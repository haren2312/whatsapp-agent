import { Conversation, LogEntry } from './types';

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-suly",
    name: "Suly",
    phone: "+58 414-235-4263",
    status: "qualified",
    statusLabel: "Reserva Confirmada",
    score: 96,
    intent: "Láminas de 12, Tubos 2x1, Cemento y Cercha",
    budget: "$340.00 USD",
    schedule: "Retiro en Mostrador (Mene Mauroa)",
    silentMode: false,
    lastTime: "09:34",
    messages: [
      {
        id: "m-suly-1",
        sender: "client",
        text: "🛒 RESERVA: 10 Láminas de 12, 1 Caja de ganchos, 5 Tubos de 2x1, 2 Tubos de 1.5x3, 1 Saco de Cemento, 1 Cercha",
        time: "09:34",
        latency: null,
        cost: null,
      },
      {
        id: "m-suly-2",
        sender: "agent",
        text: "¡Hola Suly! 👨🏻‍💼 Tu reserva fue registrada con éxito en el inventario. Materiales listos y apartados para retiro en tienda física. Aceptamos transferencias y divisas en caja.",
        time: "09:34",
        latency: "19ms (Capa 1 AST)",
        cost: "$0.0000",
      },
    ],
  },
  {
    id: "conv-yanerys",
    name: "Yanerys Sánchez Navarro",
    phone: "+58 416-263-1544",
    status: "qualified",
    statusLabel: "Reserva Confirmada",
    score: 94,
    intent: "Protector de Voltaje Vitron para Refrigeración",
    budget: "$28.00 USD",
    schedule: "Retiro en Tienda (Hoy)",
    silentMode: false,
    lastTime: "11:20",
    messages: [
      {
        id: "m-yan-1",
        sender: "client",
        text: "🛒 RESERVA: Protector DE Voltaje P/refrig Y Neveras Vitron 110V",
        time: "11:18",
        latency: null,
        cost: null,
      },
      {
        id: "m-yan-2",
        sender: "agent",
        text: "¡Hola Yanerys! 👨🏻‍🔧 Confirmado en inventario: Protector de Voltaje Vitron 110V con retardo de reconexión a $28.00 USD. Tu reserva está registrada y lista para entrega en mostrador.",
        time: "11:20",
        latency: "19ms (Capa 1 AST)",
        cost: "$0.0000",
      },
    ],
  },
  {
    id: "conv-matilde",
    name: "Matilde Páez",
    phone: "+58 424-443-0700",
    status: "in-progress",
    statusLabel: "En Mostrador (Cotizado)",
    score: 88,
    intent: "Cadena Metálica Galvanizada por Metro",
    budget: "$45.00 USD",
    schedule: "Retiro en Tienda",
    silentMode: false,
    lastTime: "10:05",
    messages: [
      {
        id: "m-mat-1",
        sender: "client",
        text: "Buenos días, tienen cadena metálica fina de eslabón corto por metro?",
        time: "10:02",
        latency: null,
        cost: null,
      },
      {
        id: "m-mat-2",
        sender: "agent",
        text: "¡Buenos días Matilde! 👨🏻‍🔧 Sí, disponemos de Cadena Galvanizada 3/16\" y 1/4\" a $2.20 el metro. ¿Cuántos metros requieres cortar para tu trabajo?",
        time: "10:05",
        latency: "14ms (Capa 2 Jerga)",
        cost: "$0.0000",
      },
    ],
  },
  {
    id: "conv-diego",
    name: "Diego Bracho",
    phone: "+58 412-110-2992",
    status: "in-progress",
    statusLabel: "Cotización Eléctrica & PVC",
    score: 92,
    intent: "Cables AWG, Tubos PVC 3/4 y Codos",
    budget: "$215.00 USD",
    schedule: "Despacho Programado",
    silentMode: false,
    lastTime: "12:15",
    messages: [
      {
        id: "m-diego-1",
        sender: "client",
        text: "Buenos días, presupuesto para: Cable AWG #14 (3 rollos), Cable AWG #12 (4 rollos), Tubo PVC Eléctrico 3/4 (28 tubos) y 24 curvas 3/4.",
        time: "12:10",
        latency: null,
        cost: null,
      },
      {
        id: "m-diego-2",
        sender: "agent",
        text: "¡Saludos Diego! 👨🏻‍🔧 Lista verificada en catálogo de más de 8.000 SKUs. Disponemos de cable THW 100% cobre y tubería PVC rígida con curvas de fábrica. Presupuesto total procesado.",
        time: "12:15",
        latency: "28ms (pgvector + GIN)",
        cost: "$0.0000",
      },
    ],
  },
  {
    id: "conv-carlos",
    name: "Carlos Mendoza",
    phone: "+58 424-647-8892",
    status: "closed",
    statusLabel: "Venta Cerrada ($530)",
    score: 95,
    intent: "40 Sacos Cemento Gris & 200 Bloques",
    budget: "$530.00 USD",
    schedule: "Retiro en Sucursal (Hoy 2:00 PM)",
    silentMode: false,
    lastTime: "13:02",
    messages: [
      {
        id: "m-carlos-1",
        sender: "client",
        text: "Buenas tardes, necesito cotizar 40 sacos de cemento gris y 200 bloques para retirar hoy.",
        time: "13:00",
        latency: null,
        cost: null,
      },
      {
        id: "m-carlos-2",
        sender: "agent",
        text: "¡Buenas tardes Carlos! 👨🏻‍🔧 Cemento Gris Tipo I en $8.50 el saco ($340.00) y Bloque de Concreto 15cm en $0.95 ($190.00). Total $530.00 USD. ¿Retiras en sucursal o necesitas transporte?",
        time: "13:00",
        latency: "18ms (Capa 1 AST)",
        cost: "$0.0000",
      },
      {
        id: "m-carlos-3",
        sender: "client",
        text: "Excelente precio. Para retirar en sucursal hoy a las 2:00 PM.",
        time: "13:02",
        latency: null,
        cost: null,
      },
      {
        id: "m-carlos-4",
        sender: "agent",
        text: "Perfecto Carlos. Te reservé la orden con presupuesto de $530.00 USD para las 2:00 PM. El personal de patio tendrá todo listo en mostrador.",
        time: "13:02",
        latency: "~700ms (consulta común)",
        cost: "$0.00012",
      },
    ],
  },
  {
    id: "conv-rafer",
    name: "Rafer Jesús",
    phone: "+58 414-562-6474",
    status: "escalated",
    statusLabel: "Atención Especial (Transporte)",
    score: 89,
    intent: "Bloques de 10 con Transporte a Campo Piñita",
    budget: "$180.00 USD",
    schedule: "Transporte en Camión a Campo Piñita",
    silentMode: true,
    lastTime: "14:54",
    messages: [
      {
        id: "m-rafer-1",
        sender: "client",
        text: "Buenas, cuánto sale el ciento de bloque de diez normal y el transporte incluido para Campo Piñita, para pagar por pago móvil de una vez?",
        time: "14:50",
        latency: null,
        cost: null,
      },
      {
        id: "m-rafer-2",
        sender: "agent",
        text: "¡Hola Rafer! 👨🏻‍🔧 El bloque de 10 normal está en $0.95 c/u ($95 por ciento). He transferido la cotización del flete a Campo Piñita a nuestro coordinador de despacho para coordinar la carga de inmediato.",
        time: "14:54",
        latency: "32ms [ESCALAR_HUMANO]",
        cost: "$0.0000",
      },
    ],
  },
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: "log-1",
    time: "01:04:12",
    tag: "success",
    tagLabel: "200 OK",
    msg: "Webhook ack <14ms · session: +584120938472"
  },
  {
    id: "log-2",
    time: "01:04:13",
    tag: "info",
    tagLabel: "LAYER 1",
    msg: 'AST Regex matched: "Tornillo drywall 1/2" (SKU-4921)'
  },
  {
    id: "log-3",
    time: "01:04:13",
    tag: "success",
    tagLabel: "DISPATCH",
    msg: "JSON estructurado validado en n8n · Enviado vía WAHA"
  }
];

export const N8N_ZONES = [
  {
    zone: 1,
    title: "ZONA 01: INGESTA & DEDUPLICACIÓN",
    nodes: [
      { id: "node-waha-webhook", name: "Webhook Ingest (WAHA)" },
      { id: "node-200-ack", name: "Fast 200 OK Response" },
      { id: "node-dedup-filter", name: "Deduplication (message_id)" },
      { id: "node-rate-limit", name: "Token Bucket Rate Limiter" },
      { id: "node-silent-check", name: "Silent Mode (fromMe check)" }
    ]
  },
  {
    zone: 2,
    title: "ZONA 02: PRE-PROCESAMIENTO & AUDIO",
    nodes: [
      { id: "node-audio-switch", name: "Type Switch (Audio / Text)" },
      { id: "node-groq-whisper", name: "Groq Whisper Stream (<800ms)" },
      { id: "node-debounce-burst", name: "Debounce Buffer (3s window)" },
      { id: "node-sanitize-input", name: "Input Text Normalizer" },
      { id: "node-load-session", name: "Session State Loader (Postgres)" }
    ]
  },
  {
    zone: 3,
    title: "ZONA 03: ENRUTAMIENTO & RAG HÍBRIDO",
    nodes: [
      { id: "node-intent-router", name: "Intent Classification Router" },
      { id: "node-layer1-ast", name: "Capa 1: AST Parser Determinístico" },
      { id: "node-layer3-trgm", name: "Capa 3: pg_trgm Fuzzy GIN" },
      { id: "node-layer4-vector", name: "Capa 4: pgvector Embedding" },
      { id: "node-sonnet-heal", name: "Auto-recuperación (Luna)" }
    ]
  },
  {
    zone: 4,
    title: "ZONA 04: STRUCTURED DISPATCH & CRM",
    nodes: [
      { id: "node-pydantic-val", name: "Validador de esquema JSON" },
      { id: "node-sanitize-output", name: "Output Markdown Sanitizer" },
      { id: "node-crm-dispatch", name: "Supabase CRM (atenciones_pendientes)" },
      { id: "node-waha-send", name: "Send Message (WAHA HTTP)" },
      { id: "node-error-trigger", name: "Error Trigger Global Fallback" }
    ]
  }
];
