# RAG del Agente de Ventas — cómo encuentra un producto

Documento de referencia para **investigar mejoras**. No describe lo que se quiso construir,
sino lo que hay, con los números que lo respaldan y los caminos que se probaron y no
funcionaron, para no volver a pagarlos.

> **Lo primero que hay que entender:** esto **no es un RAG de manual**. Un RAG clásico
> recupera pasajes de prosa para dárselos a un LLM. Aquí se recupera de un catálogo de
> **más de 8.000 cadenas de SKU de ~36 caracteres** (`TAPA DE INODORO CIERRE SUAVE 17X14 BEIGE
> AQUAFINA`), que no es prosa. Casi todo lo que la literatura da por bueno para RAG rinde
> distinto sobre este material, y hay evidencia medida más abajo de exactamente cómo.

---

## 1. La cascada de 5 capas

El cliente escribe como habla, no como está escrito el catálogo. La búsqueda baja por capas
y **solo pasa a la siguiente si la anterior no resolvió**. El caso normal («cemento gris»)
muere en la capa 1: **~700 ms y coste cero**.

| # | Capa | Qué resuelve | Coste |
| :-- | :--- | :--- | :--- |
| 1 | **Léxico** — `ilike` + mapa `SIN` + normalización de medidas | El grueso. Sinónimos a mano, medidas NxM/fracciones/calibre, stopwords conversacionales | 0 |
| 2 | **Diccionario de catálogo** — `catalogo_vocabulario` | Coloquialismos: *chapa*→cerradura, *foco*→bombillo, *cincho*→abrazadera | 1 query |
| 3 | **Relajación drop-one + fuzzy `pg_trgm`** | Erratas fuertes y consultas que fallan por una sola palabra | 0 |
| 4 | **Vectorial** — `pgvector`, umbral 0.45 | Variantes de nombre: *tapa para el baño* → TAPA DE INODORO | ~1 llamada OpenAI |
| 5 | **Rescate semántico** — Luna + las 710 categorías | El cliente describe la FUNCIÓN: *«lo que se usa para pegar los bloques»* → cemento | ~1 llamada Luna |

Y una señal transversal que **reordena** el resultado de cualquier capa:

| | Señal | Efecto |
| :-- | :--- | :--- |
| ★ | **Ventas recientes** — `producto_popularidad` | Lo que de verdad se vende sube; el stock fantasma cae |

### Cuándo se dispara cada capa

- **4 y 5 se activan** si (a) lo léxico devolvió **cero**, o (b) al primer resultado **le falta
  alguna palabra de la consulta** — señal de que ganó por una palabra de paso.
  *Mirar solo el sustantivo principal NO basta*: en «tapa para el baño» vs «Tapa P/toma»
  también coincide. Ese detalle costó una iteración entera.
- Si están todas las palabras («cemento gris» → «Cemento Gris CSC»), **no se llama a OpenAI**.
- **Las capas 4 y 5 devuelven una HIPÓTESIS, no un hallazgo.** El resultado lleva
  `_rescate` y una `instruccion` que obliga al bot a preguntar *«¿te refieres a…?»* y a
  emitir `[PEDIR_AYUDA]` si el cliente la refuta. Una interpretación nunca se presenta como
  certeza.

---

## 2. Estructura

### Tablas (Supabase)

| Tabla | Filas | Qué guarda | Quién la mantiene |
| :--- | ---: | :--- | :--- |
| `productos` | +8.000 | Catálogo, sincronizado desde HybridLite | backend POS / ERP |
| `catalogo_vocabulario` | 3.495 | `termino → canonico` coloquial | `generar_vocabulario.js` |
| `catalogo_vocab_categorias` | ~710 | Hash md5 **por categoría** | idem |
| `productos_embedding` | +8.000 | `vector(1536)` + HNSW coseno | `generar_embeddings.js` |
| `producto_descripcion` | 3.728 | Descripción en lenguaje natural (Luna) | `generar_descripciones.js` |
| `producto_popularidad` | 4.680 | Facturas 90d/365d + score | `refrescar_popularidad_reciente()` |

**Todas van aparte de `productos` a propósito**: esa tabla la reescribe el backend en cada
sync desde HybridLite y se llevaría por delante vectores, descripciones y scores.

### Funciones SQL

- `buscar_semantico(embedding, umbral, limite)` — similitud de coseno cruzada con existencia y precio
- `popularidad_productos(codigos[])` — score de ventas recientes (lee la tabla precalculada)
- `refrescar_popularidad_reciente()` — recalcula todo; devuelve nº de productos

### Workflow nocturno (n8n, cron 3:00)

```
Cada noche 3:00 → Sincronizar Vocabulario → Monitor Embeddings → Refrescar Popularidad
```

Va en un **workflow aparte** del flujo de mensajes para no sumar latencia a ningún cliente.
Vocabulario y ranking por ventas **sí se mantienen solos**, incrementales por hash.

> **Los embeddings NO se generan solos.** El tercer nodo es un **monitor**: detecta y avisa.
> No puede embeber por dos límites reales — escribir vectores con el índice HNSW presente
> revienta el `statement_timeout` (`57014`) y la anon key no puede quitar el índice, y además
> no puede recalcular el hash del texto enriquecido. Antes fingía trabajar: reportaba
> `ok:true` escribiendo cero, y estuvo **20 días** así sin que nadie lo notara.
>
> Cuando `node rag.js estado` avise, el ciclo es manual:
> `drop index` → `node rag.js embeddings` → `create index`.

### Scripts

| Script | Para qué |
| :--- | :--- |
| `generar_vocabulario.js` | Diccionario coloquial desde el catálogo |
| `generar_embeddings.js` | Vectores (texto enriquecido) |
| `generar_descripciones.js` | Descripciones con Luna |
| `deploy_nodos.js` | dumps `scratch_live/` → nodos del n8n vivo |
| `_test_coloquial.js` | **Recall sobre 320 consultas cacheadas** (`--sin-vector` para aislar) |
| `_test_vector.js` | **Margen señal/ruido** del espacio vectorial |
| `_test_fallos_reales.js` | Las consultas que de verdad escalaron |
| `_test_busqueda_50.js` | Regresión, 86 casos |
| `_audit_sin.js` | Audita el mapa `SIN` contra el catálogo real |
| `../rag.js` | **CLI / TUI Interactiva**: orquesta todo con REPL en vivo, búsqueda inteligente, diagnóstico y diagramas vectoriales Braille. `node rag.js` |

---

## 3. Estadísticas

### Evolución medida (mismo set de 320 consultas coloquiales)

| Hito | Recall exacto | Fallos |
| :--- | ---: | ---: |
| Punto de partida | 72,2% | 9,1% |
| + auditoría de `SIN` y drop-one | 73,1% | 7,8% |
| + embeddings v2 (texto enriquecido) | 75,9% | 6,6% |
| + ranking por ventas | 76,9% | 6,6% |
| + descripciones (v3) | **76,9%** | **6,3%** |
| + intento 4 de plan 006 (`0c31b52`) — **medición 2026-09-07** | 72,2% | 9,7% |
| + A3 adopción híbrida + recalibración — **medición 2026-09-08** (vec-new, override local OpenRouter) | 76,3% (244) | 7,2% (23) |

> ⚠️ **Dos mediciones que no hay que confundir (corrección de atribución):**
>
> 1. **2026-09-07** — el intento 4 (`0c31b52`) dio **72,2% en AMBOS lados** (vec y sinvec,
>    gap 0). Hoy sabemos que esa corrida corrió el camino **frío**: la clave de OpenAI estaba
>    vacía y el egress está geo-bloqueado por OpenAI; sin vector vivo, ambos lados ejecutan el
>    mismo código léxico → gap 0 idéntico. Ese A/B **NO prueba** "la capa vectorial no aporta
>    tras el intento 4"; solo prueba que se midió sin vector. El +7 histórico quedaba sin
>    explicación, y el veredicto REJECTED de aquel día se basaba en una medición vector-OFF.
> 2. **2026-09-08** (cambio `rrf-reintento`, A3 + umbral recalibrado + override local
>    `OPENAI_API_BASE`→OpenRouter): **vec-new 244 (76,3%) vs sinvec-new 231 (72,2%) → gap
>    4,1 pts < 5 → REJECTED**, pero ahora con el vector **vivo**: **+13 aciertos reales
>    atribuibles a la capa vectorial** (244 vs 231), calibró el umbral con el datapoint vivo
>    (simLex "tapa" = 0.5246 → `UMBRAL_LEXICO_FIABLE` 0.52→**0.55**).
>
> Fase 4 (Phase C): la caída 246→231 **no se reproduce caliente** en el código — las 4
> corridas A/B calientes de `b439c4a` y `c33e0b0` (before/after, cuerpos portados) dieron
> todas **243/320, after==before** → ambos sospechosos **inocentes**. La caída queda como
> deuda de investigación de causa externa (reconstrucción nocturna de popularidad/vocabulario
> o entorno). El gate sigue < 5 → el RRF queda diferido (ver §7).

### Aporte aislado de la capa vectorial (A/B sobre el mismo set)

| | Recall | Fallos |
| :--- | ---: | ---: |
| Con vector (histórico) | 246 (76,9%) | 20 (6,3%) |
| Sin vector (control, histórico) | 239 (74,7%) | 24 (7,5%) |
| Con vector — 2026-09-07 (vec, frío: sin clave/egress bloqueado) | 231 (72,2%) | 31 (9,7%) |
| Sin vector — 2026-09-07 (sinvec, frío) | 231 (72,2%) | 31 (9,7%) |
| Con vector + A3 — 2026-09-08 (vec-new, vivo) | **244 (76,3%)** | 23 (7,2%) |
| Sin vector — 2026-09-08 (sinvec-new) | 231 (72,2%) | 31 (9,7%) |

**Corrección de atribución (2026-09-08)**: el "+7 aciertos del vector" histórico se confirmó
y amplió con medición caliente real: **+13 aciertos** (244 vs 231, buckets 133/171 · 15/26 ·
96/123 vs 124/171 · 14/26 · 93/123). La medición del 2026-09-07 (gap 0) fue **sin vector**
(clave vacía + egress geo-bloqueado por OpenAI), no un efecto de `0c31b52` sobre la capa
vectorial. El gate A/B **sigue REJECTED** (4,1 pts < 5): el aporte es real pero no cruza la
barra de adopción → sin deploy; RRF diferido (ver §7).

### Margen señal/ruido — la métrica que decide

Peor consulta legítima **menos** mejor texto basura. Si no supera ~0.05, **no existe umbral
posible** y la capa es inservible por diseño, por muy bien que parezca acertar.

| | Basura | Legítima | **Margen** |
| :--- | ---: | ---: | ---: |
| v1 (SKU crudo) | 0.467 | 0.479 | **0.012** ❌ |
| v2 / v3 (enriquecido) | 0.368 | 0.491 | **0.123** ✅ |

### Catálogo y ventas

- **5.046** productos con existencia — de ellos **2.559 (51%) no venden hace un año**
- **1.802** vendidos en 90 días · **3.728** en 365 días
- **46** solicitudes de ayuda históricas, **solo 2 en los últimos 10 días**
- **61%** de esas solicitudes las **descartó el empleado**: no eran búsquedas fallidas sino
  saludos, peticiones de foto y seguimientos sin producto

### Costes reales

| Concepto | Coste | Frecuencia |
| :--- | ---: | :--- |
| Diccionario (3.448 términos) | $0.19 | una vez |
| Embeddings v2 (+8.000) | $0.0043 | una vez |
| Embeddings v3 (3.728) | $0.0076 | una vez |
| Descripciones (3.728) | $0.11 | una vez |
| Búsqueda normal | **$0** | por consulta |
| Con capa vectorial | ~$0.0000002 | solo si dispara |

---

## 4. Por qué — decisiones y evidencia

### Por qué la popularidad NO va en el vector

El embedding codifica **significado**; la popularidad es una señal **ortogonal**. Mezclarlas
corrompe el espacio semántico y obligaría a **re-embeber el catálogo entero cada vez que
cambia una venta**. Como señal de ranking separada se recalcula de noche en segundos y su
peso se ajusta sin tocar un solo vector.

### Por qué el texto embebido va enriquecido

Se embebe:

```
DESCRIPCIÓN | descripción en lenguaje natural | categoria: X | como lo pide el cliente: sinónimos
```

Embeber el SKU crudo **no funcionó** (v1: aporte cero, margen 0.012). Con categoría y
coloquialismos el margen saltó a 0.123 y el vector empezó a aportar (+7).

### Por qué el diccionario NO se fusiona en `SIN`

`expandir()` aplica `SIN` con **reemplazo de subcadena, sin límite de palabra**. Con 93
claves curadas a mano era inofensivo; con miles generadas es destructivo: el término
legítimo `"te" → "tee pvc"` convertía **«plateado» en «platee pvcado»**. El diccionario de
la BD se aplica antes, con **límites de palabra**. *Si alguien «simplifica» esto fusionándolo
en `SIN`, rompe la búsqueda en silencio.*

### Por qué el nº de facturas y no las unidades

Las unidades las distorsiona un solo comprador mayorista. **80 facturas son 80 decisiones de
compra distintas.** Score: `ln(facturas 90d) + 0.5·ln(facturas 365d) − castigo por antigüedad`.

El stock fantasma se castiga **solo**, sin regla aparte: sin ventas → no está en la tabla →
score 0; con última venta vieja → score **negativo**.

---

## 5. Lo que se probó y NO funcionó

Documentado para no volver a pagarlo.

| Intento | Resultado | Por qué |
| :--- | :--- | :--- |
| **Embeddings del SKU crudo (v1)** | **Aporte cero** (72,2% con y sin, idéntico caso por caso) | Cadenas de 36 chars no son prosa; el vector medía solapamiento léxico, que `pg_trgm` ya hacía. Margen 0.012 |
| **Descripciones de Luna (v3)** | **Aporte cero** (246 → 246; $0.11) | v2 ya cubría *qué es* y *cómo lo pide la gente*; añadir *para qué sirve* resultó redundante. **El margen lo predijo: 0.123 → 0.123** |
| **Umbral de similitud como filtro de ruido en v1** | Imposible | Basura 0.467 vs legítima 0.479: no hay umbral que los separe |
| **Confianza del LLM para filtrar rescates** | No sirve | El mal tiro puntuaba 4 y el acierto 3. La red real es obligar a preguntar |
| **Gatillo por sustantivo principal** | Insuficiente | En «tapa para el baño» vs «Tapa P/toma» el sustantivo también coincide |

**Conclusión transversal:** enriquecer más el texto embebido parece agotado. Dos intentos
seguidos (descripciones) no movieron el margen. Antes de invertir ahí otra vez, exigir que
el margen se ensanche.

---

## 6. Cómo medir

```bash
node scripts/_test_coloquial.js                 # recall sobre 320 (set cacheado)
node scripts/_test_coloquial.js --sin-vector    # el mismo set sin vector -> aísla el aporte
node scripts/_test_vector.js                    # margen señal/ruido
node scripts/_test_busqueda_50.js               # regresión, exigir 0 falsos negativos
node scripts/_test_fallos_reales.js --prod      # consultas que de verdad escalaron
```

### Reglas para no engañarse

1. **El set está cacheado a propósito** (`scratch_live/_coloquial_set.json`). Comparar dos
   corridas con preguntas distintas no mide nada. Regenerar solo con `--generar N`, y
   entonces re-medir la línea base.
2. **Siempre A/B sobre el mismo set.** Que un número suba tras un cambio no prueba que sea
   *por* el cambio.
3. **HNSW es aproximado**: dos corridas del mismo probe pueden dar 3/7 y 5/7. No leer
   diferencias de 1-2 casos como señal.
4. **El margen manda sobre el acierto.** v1 parecía «casi bien» (2/7) siendo inservible.
5. **Verificar las expectativas del probe a mano** antes de fijarlas. Escribirlas mal hizo
   que 6/7 pareciera 1/7 — y eso lleva a revertir algo que funciona.
6. **El set de 320 muestrea AL AZAR**, inventario muerto incluido, así que **subestima el
   ranking por ventas**. Un cambio puede bajar ese número y aun así ser correcto para el
   negocio.
7. **No confundir una corrida sin vector con una prueba de que el vector no aporta.**
   OpenAI geo-bloquea este egress (`Country, region, or territory not supported`) y la clave
   puede estar vacía sin que el harness proteste: un A/B con gap 0 puede ser «medí sin vector
   dos veces» (exactamente lo que pasó el 2026-09-07, ver §3). Para medir caliente desde acá
   hay que apuntar el override local `OPENAI_API_BASE=https://openrouter.ai/api/v1` con
   `OPENAI_API_KEY` de OpenRouter (embedding `text-embedding-3-small`, dims 1536 compatible).
   El override es **local y de dev**: el cuerpo desplegado en n8n no lleva esa línea (deploy
   empuja solo el cuerpo, nunca `.env`).
8. **Los 2 FN históricos de LÁMINA quedaron resueltos por `fix-regresion-fn` (2026-09-08).**
   El baseline pre-cambio (`b1e8823`, medido 2026-09-08) tenía `#11 "Que precio este tipo de
   sinz de 6 metros"` y `#28 "lamina de zinc"` como FALSO-NEGATIVO (0 resultados) por un
   alias de array en la regla LÁMINA (`let lf = unicos`): sin sub-filtro que reasignara
   `lf`, el bloque final (líneas 907-909) vaciaba `unicos` y la regla devolvía 0 — no era
   la capa léxica sino el idiom del array. Con la copia defensiva
   (`unicos.filter(() => true)`, mismo idioma que CEMENTO/CABILLA/PINTURA) la regresión de
   86 casos mide **FN 2→0** y #28 queda sin flags. #11 conserva `🟡 parcial` (no era FN: ver
   §7): la medida ("6" en `medLargas`) y el ranking por existencia mandan mallas/alambrón
   a top-4 — deuda de la capa de medidas/ranking, distinta del alias y fuera del alcance de
   `fix-regresion-fn`. El criterio operativo **no introducir FN nuevos** sigue vigente.
   **Phase C (tildes) NO se adoptó**: la probe live "tienes lamina arquitectónicas…" dio
   4 encontrados estrechando a arquitectónica/canal cuadrado con Fase A sola — `norm()`
   quita los acentos del query antes de `wantCuadrada`, así que las tildes no rompen nada.

---

## 7. Dónde investigar mejoras

**En orden de retorno esperado:**

1. **Fusión híbrida RRF — DIFERIDA** (medición 2026-09-08: gate 4,1 pts < 5 tras A3). Hoy el
   vector **reemplaza** lo léxico (`res = _vec`) en vez de combinarse: es todo-o-nada, y un
   producto que sale 3º en léxico y 2º en vector no sube por consenso. **Prerrequisito
   obligatorio antes de reintentar: dedupe por familia de productos** (el RRF mezcla rank
   posiciones; sin dedupe, las familias con muchas variantes — láminas, tubos, cementos —
   saturan los top-N y el recall medido se degrada). Solo tiene sentido si un gate ≥ 5 lo
   habilita; con el gate < 5 correr RRF es medir un cambio no habilitado. Plan en
   [`plans/006-fusion-hibrida-rrf.md`](plans/006-fusion-hibrida-rrf.md).
2. **[RESUELTO] Cerrar los 2 FN de LÁMINA** (`fix-regresion-fn`, 2026-09-08) — la causa
   era un alias de array en la regla LÁMINA (`let lf = unicos`, línea 867): sin sub-filtro
   que reasignara `lf`, el bloque final vaciaba `unicos` y devolvía 0. Con la copia
   defensiva `.filter(() => true)` la regresión mide **FN 2→0** (#28 sin flags; #11 pasa de
   FALSO-NEGATIVO a `🟡 parcial`). **Queda pendiente el `parcial` de #11**: "sinz de 6
   metros" devuelve top-4 de mallas/alambrón porque el filtro de medida ("6" en
   `medLargas`) + ranking por existencia ganan a la lámina de zinc de 6 mts. Deuda de la
   capa de medidas/ranking (no del alias), fuera del alcance de `fix-regresion-fn`; atacar
   con un sub-filtro de material zinc (`wantZinc`, hoy calculado y sin uso) o con el filtro
   de medida más estricto. *(Archive 2026-09-09: ciclo SDD de `fix-regresion-fn` cerrado con
   PASS WITH WARNINGS, FN 0 doblemente confirmado; la deuda del `parcial` de #11 sigue
   siendo esta entrada.)*
3. **Auditar el resto de `SIN`** — `_audit_sin.js` marcó **21 entradas «a revisar»** que
   nadie ha mirado. Las 5 «dañinas» ya se corrigieron y cada una valía aciertos reales.
4. **Presupuesto sobre listas largas** — es menos preciso que la búsqueda suelta, y ahí están
   los pedidos grandes. `SIN` exige subcadena **contigua**, así que `tubo electrico →
   tubo electricidad` no aplica a «tubo **pvc** electrico».
5. **Muestreo del harness ponderado por ventas** — cambio de metodología, no de código.
6. **Modelo de embeddings** — nunca se probó `text-embedding-3-large` ni otras dimensiones.
   Barato de probar, y el margen dirá enseguida si aporta.

**Investigación abierta (deuda, no urgente)**: la caída 246→231 del recall histórico **no se
reproduce caliente** en el código (Phase C: `b439c4a` y `c33e0b0` inocentes, 4 corridas
243/320 with after==before). Sospecha principal: la reconstrucción nocturna de
`producto_popularidad` y `catalogo_vocabulario` (workflow cron 3:00) cambia rankings y
equivalencias entre mediciones sin tocar una línea de código — hay que medir con el snapshot
de popularidad fijado para aislarlo.

**Probablemente NO valga la pena** (evidencia en §5): enriquecer más el texto embebido.

---

## 8. Trampas operativas

- **Carga masiva de vectores:** el índice HNSW reconstruye el grafo en **cada insert** y
  revienta el `statement_timeout` de Supabase (error `57014`) a mitad, ya pagados los
  embeddings. Orden correcto: `drop index` → cargar (lotes de escritura ~40) → `create index`.
  El script avisa si hay >500 pendientes; **no puede automatizarlo** porque la anon key no
  hace DDL. *Esta trampa mordió dos veces.*
- **Parchear estos archivos desde el shell:** un heredoc se comió las barras invertidas y
  dejó `/\d/` como `/d/` y `\b` como carácter backspace en los tres archivos. Usar
  herramientas de edición, no `cat <<EOF`.
- **Cadena de despliegue:** `lib/catalog-search.js` → `scratch_live/*` → `scripts/new_*.js`
  → `n8n_workflow.json` → n8n. Desplegar con `deploy_nodos.js` y cerrar siempre con
  `npm test` (los guards detectan drift entre las copias).
- **PostgREST corta en 1000 filas EN SILENCIO.** `?...&limit=20000` no levanta el `max-rows`
  del servidor: devuelve 1000 filas y un `200 OK`, sin error ni warning. El diccionario de
  catálogo (`catalogo_vocabulario`, 3.839 términos activos) llevaba cargando **1.000 (26%)**
  y nadie podía enterarse. Para traer todo hay que paginar con `Range` hasta agotar.
- **El diccionario ya NO reescribe la consulta (2026-09-11).** Se aplicaba con `String.replace`:
  la palabra del cliente se perdía y, si el canónico era malo, nada podía recuperarla. Ahora
  hay **dos ramas**: la del cliente manda en ranking, reglas de negocio y filtros de medida;
  la del diccionario solo **suma candidatos** a la recuperación, y decide el ranking. Un
  canónico malo solo puede aportar ruido descartable. Es la semántica aditiva que ya usaba
  `ALIAS`, que se incluye a sí mismo en su lista. Medido: **235 → 238** (gana 5, pierde 2).
  Ojo al factorizar: las dos ramas necesitan la relajación `relajarDropOne`; dándosela solo
  a la del cliente se conservaba 1 de 4 rescates en vez de 3.
- **No pagines el diccionario: cuesta 623 ms por búsqueda y no paga nada.** Medido
  2026-09-11 con la semántica de unión ya en su sitio: 1.000 → 3.862 términos da **+0 casos**
  sobre el set de 320, y ni siquiera cambia de caso (gana 0, pierde 0). El coste sí es real:
  la carga pasa de **143 ms a 766 ms de mediana**, y se paga en CADA invocación del nodo Code
  porque no hay caché entre mensajes. El camino feliz cuesta ~750 ms, o sea que lo duplica.
  Solo **40 términos de 3.869 (1%)** llegan a dispararse sobre el set, así que la cola no
  participa. Si algún día hay evidencia de que sí aporta, la forma barata de traerla entera
  es **buscar solo los términos relevantes**: generar n-gramas de 1-3 palabras de la consulta
  y pedirlos con `termino=in.(...)` en un solo round-trip, en vez de bajar la tabla completa.
- **La calidad del diccionario, por si hace falta filtrarlo algún día**: el LLM generó
  traducciones de un término genérico a un **producto específico** en vez de a una categoría
  (`pintura en spray → speed max`, una marca). Por cuántos productos casa cada `canonico`:
  582 casan 0 (15%), 1.699 casan 1 o 2 (44%), 748 casan 3-10, y solo 810 casan más de 10
  (21%). Por inflación de atributos (tokens que el canónico añade sobre el término): 2.787
  conservan (72%), 729 añaden 1, **353 añaden 2+ (9%, la clase que hacía daño)**. Desde que
  el diccionario suma en vez de reescribir, esta contaminación ya no rompe nada.
- **El despliegue va en UN SOLO sentido:** `scratch_live/*` → `n8n_workflow.json` → n8n.
  `apply_workflow_hardening.js` hacía lo contrario: leía el workflow vivo, mutaba dos nodos
  y guardaba **eso** encima de `n8n_workflow.json`. El 2026-09-09 revirtió en silencio un
  matcher ya montado (guardia de credencial + fix de LÁMINA) mientras desplegaba solo el
  nodo Sanitize, y ninguna guarda lo detectó porque el archivo quedó coherente consigo
  mismo. Ahora el script publica el archivo canónico, exige que la guarda de sync pase
  antes de tocar nada y **nunca escribe** `n8n_workflow.json`.
- **`n8n_workflow.json` NO es el estado desplegado.** Es un artefacto de staging: un
  resync escribe el archivo pero no publica nada. La única fuente de verdad de producción
  es `GET http://localhost:5678/api/v1/workflows/<id>`. El 2026-09-09 auditamos los tres
  niveles y el vivo iba tres cambios por detrás del archivo (sin A3, sin el umbral 0.55 y
  **sin el fix de LÁMINA** que su ciclo SDD ya había archivado como *done*). Un ciclo que
  cierra sin desplegar deja la corrección solo en el repo.
- **A3 y `UMBRAL_LEXICO_FIABLE = 0.55` están DORMIDOS, no adoptados.** Su gate A/B salió
  **REJECTED** (gap 4,1 < 5). Siguen en el código porque son inalcanzables: ambas
  constantes se leen **solo** dentro del bloque `if (_falta)` de rescate vectorial, y la
  adopción exige `_vec.length > 0`. Con la capa vectorial apagada nunca se evalúan.
  ⚠️ **Poner `OPENAI_API_BASE` los despierta a los dos de golpe**, sin pasar por ningún
  gate. Antes de encender el vector hay que volver a medir el A/B y decidir A3 aparte.
- **Nunca mandar una clave que no es de OpenAI a `api.openai.com`.** Producción tenía
  `OPENAI_API_KEY` con prefijo `sk-or-` (OpenRouter) y `OPENAI_API_BASE` vacío: cada
  rescate le entregaba el secreto a un tercero y recibía 401, así que el vector estaba
  muerto **en silencio** (el `catch` devuelve filas vacías, que es indistinguible de "sin
  resultados"). `buscarVectorial` ahora corta antes de la petición si la clave es `sk-or-`
  y no hay endpoint que la redirija.
