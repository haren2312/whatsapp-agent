'use client';

import React, { useState } from 'react';
import { RagResult, OrbState } from '@/lib/types';
import { CrosshairCard } from '@/components/hud/CrosshairCard';
import { ThinkingOrb } from '@/components/orbs/ThinkingOrb';
import { useSound } from '@/components/audio/SoundProvider';
import {
  Database,
  Send,
  Binary,
  BookOpen,
  Search,
  Sparkles,
  BrainCircuit,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  query: string;
  status: 'loading' | 'done' | 'error';
  result?: RagResult;
}

export const RagStudio: React.FC = () => {
  const [query, setQuery] = useState('');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [currentLayer, setCurrentLayer] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [evaluatedLayers, setEvaluatedLayers] = useState<number[]>([]);
  const [result, setResult] = useState<RagResult | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { playClick, playPacket, playSuccess } = useSound();

  const sampleQueries = [
    { text: 'Tornillo drywall 1/2 x 100u', layer: 1, desc: 'Capa 1: AST' },
    { text: 'Pega loca super bonder', layer: 2, desc: 'Capa 2: Jerga' },
    { text: 'Algo para tapar gotera techo', layer: 4, desc: 'Capa 4: pgvector' },
    { text: 'Cemento gris para hoy', layer: 1, desc: 'Capa 1: Supabase' },
  ];

  const layersInfo = [
    {
      num: 1,
      name: 'Parser Determinístico AST',
      tech: 'Regex & Medidas Exactas',
      lat: '< 8 ms',
      cost: '$0.0000',
      icon: Binary,
      color: 'emerald',
    },
    {
      num: 2,
      name: 'Diccionario & Jerga Regional',
      tech: 'Normalizador de Sinónimos',
      lat: '< 15 ms',
      cost: '$0.0000',
      icon: BookOpen,
      color: 'amber',
    },
    {
      num: 3,
      name: 'Búsqueda Trigramas GIN',
      tech: 'pg_trgm Fuzzy Substring',
      lat: '< 45 ms',
      cost: '$0.0000',
      icon: Search,
      color: 'cyan',
    },
    {
      num: 4,
      name: 'Vector Embeddings HNSW',
      tech: 'pgvector 1536d Cosine',
      lat: '< 120 ms',
      cost: '$0.00002',
      icon: Sparkles,
      color: 'purple',
    },
    {
      num: 5,
      name: 'Rescate Semántico LLM',
      tech: 'gpt-5.6-luna + Guardrails',
      lat: '~ 850 ms',
      cost: '$0.00035',
      icon: BrainCircuit,
      color: 'rose',
    },
  ];

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handleRunQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;
    playClick();

    const cleanQuery = queryText.trim();
    setQuery('');
    setIsLoading(true);
    setOrbState('searching_rag');
    setActiveLayer(null);
    setCurrentLayer(null);
    setEvaluatedLayers([]);
    setResult(null);

    const itemId = `hist-${Date.now()}`;
    const initialItem: HistoryItem = {
      id: itemId,
      query: cleanQuery,
      status: 'loading',
    };
    setHistoryItems((prev) => [initialItem, ...prev]);

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanQuery }),
      });
      const data: RagResult = await res.json();
      const targetLayer = data.hitLayer;

      await sleep(120);

      const evalHistory: number[] = [];
      for (let l = 1; l <= targetLayer; l++) {
        const stepLayer = l as 1 | 2 | 3 | 4 | 5;
        setCurrentLayer(stepLayer);
        playPacket();

        if (l < targetLayer) {
          await sleep(220);
          evalHistory.push(l);
          setEvaluatedLayers([...evalHistory]);
        }
      }

      setActiveLayer(targetLayer);
      setCurrentLayer(targetLayer);
      setOrbState(targetLayer === 5 ? 'thinking_llm' : 'dispatched');
      setResult(data);
      playSuccess();

      setHistoryItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'done', result: data } : item
        )
      );
    } catch {
      setOrbState('error');
      setHistoryItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: 'error' } : item))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getLayerCardStyle = (layerNum: number) => {
    if (currentLayer === layerNum && activeLayer !== layerNum) {
      return 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400';
    }

    if (activeLayer === layerNum) {
      if (layerNum === 1) return 'border-pulse-green bg-emerald-950/40 shadow-[0_0_20px_rgba(152,255,56,0.3)] ring-1 ring-pulse-green';
      if (layerNum === 2) return 'border-amber-400 bg-amber-950/40 shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-1 ring-amber-400';
      if (layerNum === 3) return 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-cyan-400';
      if (layerNum === 4) return 'border-purple-400 bg-purple-950/40 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-400';
      if (layerNum === 5) return 'border-neon-rose bg-rose-950/40 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-neon-rose';
    }

    if (evaluatedLayers.includes(layerNum)) {
      return 'border-graphite bg-[#101010] opacity-50';
    }

    if (activeLayer !== null && layerNum > activeLayer) {
      return 'border-graphite/60 bg-[#080808] opacity-35 border-dashed';
    }

    return 'border-graphite bg-[#0c0c0c] hover:border-ash hover:bg-[#121212]';
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2.5 p-0.5 sm:p-1">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-2 flex-shrink-0">
        <div>
          <span className="font-mono text-[10px] text-gold-bright uppercase tracking-wider block mb-0.5 font-medium">
            {'//'} CLI TUI STUDIO & RETRIEVAL LAB · LIVE DATABASE CONNECTED
          </span>
          <h2 className="text-lg sm:text-xl font-normal text-chalk tracking-tight">
            Pruebas de Búsqueda Híbrida & SNR (+8.000 SKUs)
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-[#121212] border border-graphite px-2.5 py-1 font-mono text-[10.5px] sm:text-[11px] text-pulse-green flex-shrink-0">
          <Database className="h-3 w-3" />
          <span>SUPABASE PGVECTOR LIVE</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 lg:flex-1 lg:min-h-0 p-0.5">
        {/* Left: Terminal Console */}
        <CrosshairCard className="lg:col-span-7 p-3 sm:p-4 bg-[#050505] flex flex-col justify-between lg:min-h-0 lg:flex-1">
          <div className="flex flex-col justify-between h-full min-h-0 gap-2">
            <div>
              {/* HUD Blueprint Terminal Banner */}
              <div className="border border-compass-gold/30 bg-compass-gold/[0.03] p-2 sm:p-2.5 mb-2 select-none font-mono">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-gold-bright font-semibold tracking-wide">
                  <span>HYBRID RETRIEVAL BENCHMARK v2.4</span>
                  <span className="text-[10px] text-smoke font-normal">8,000+ SKUs</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[10.5px] text-smoke mt-0.5">
                  <span>Exact Recall: <span className="text-pulse-green font-medium">76.9%</span></span>
                  <span>·</span>
                  <span>SNR: <span className="text-pulse-green font-medium">0.123</span></span>
                  <span>·</span>
                  <span>Postgres HNSW Cosine</span>
                </div>
              </div>

              {/* Quick Sample Chips */}
              <div className="mb-1.5 sm:mb-2">
                <span className="font-mono text-[10px] text-gold-bright uppercase block mb-1 font-medium">
                  Consultas recomendadas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleQueries.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleRunQuery(s.text)}
                      disabled={isLoading}
                      className="font-mono text-[10.5px] sm:text-[11px] border border-graphite bg-[#111111] px-2.5 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 text-smoke hover:text-chalk hover:border-ash hover:bg-white/[0.04] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-chalk">{s.text}</span>
                      <span className="text-[9.5px] text-gold-bright">({s.desc})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* History Output Stream */}
            <div className="flex-1 p-2.5 bg-[#080808] border border-graphite overflow-y-auto font-mono text-xs space-y-2 min-h-[140px] sm:min-h-0 my-1">
              {historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="text-pulse-green font-semibold text-[11px] sm:text-[11.5px]">
                      {(process.env.NEXT_PUBLIC_AGENT_NAME || 'agent').toLowerCase()}@rag:~$ {item.query}
                    </div>
                    {item.status === 'loading' ? (
                      <div className="text-cyan-400 animate-pulse pl-2 text-[10.5px] sm:text-[11px]">
                        ⎿ [SYSTEM] Inicializando pipeline y evaluando en Supabase...
                      </div>
                    ) : item.status === 'error' ? (
                      <div className="text-neon-rose pl-2 text-[10.5px] sm:text-[11px]">
                        ⎿ [ERROR] No se pudo completar la consulta en Supabase.
                      </div>
                    ) : item.result ? (
                      <div className="text-[#e4e4e7] pl-2 space-y-0.5 text-[11px] sm:text-[11.5px]">
                        <div>
                          ↳ <span className="text-gold-bright">[CAPA 0{item.result.hitLayer}]</span>{' '}
                          <span className="font-semibold">{item.result.productName}</span>
                        </div>
                        <div className="text-smoke text-[10px] sm:text-[10.5px]">
                          Precio: <span className="text-pulse-green">{item.result.price}</span> · Latencia:{' '}
                          <span className="text-cyan-300">{item.result.latencyMs}ms</span> · Costo:{' '}
                          <span className="text-gold-bright">{item.result.costEstimate}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-smoke text-center py-4 text-[11px] sm:text-[11.5px]">
                  [SYSTEM] Selecciona una consulta rápida o escribe en el prompt inferior.
                </div>
              )}
            </div>

            {/* Input Prompt (16px on mobile to avoid iOS auto-zoom) */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0f0f0f] border border-graphite p-1.5 sm:p-2 flex-shrink-0">
              <span className="font-mono text-xs font-semibold text-pulse-green pl-1 hidden sm:inline">
                {(process.env.NEXT_PUBLIC_AGENT_NAME || 'agent').toLowerCase()}@rag:~$
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunQuery(query)}
                disabled={isLoading}
                placeholder={isLoading ? 'Evaluando...' : 'Escribir consulta técnica (ej. cemento, tornillo)...'}
                className="flex-1 bg-transparent border-none text-chalk font-mono text-base sm:text-xs outline-none disabled:opacity-50 py-1"
              />
              <button
                onClick={() => handleRunQuery(query)}
                disabled={isLoading}
                className="bg-signal-white text-obsidian px-3 py-2 sm:py-1 font-mono text-xs font-semibold uppercase flex items-center gap-1 hover:bg-[#e4e4e7] transition-colors cursor-pointer disabled:opacity-50 min-h-[40px] sm:min-h-0 flex-shrink-0"
              >
                <span>{isLoading ? '...' : 'Evaluar'}</span>
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </CrosshairCard>

        {/* Right: Cascade Waterfall Pipeline with Directional Connectors */}
        <CrosshairCard className="lg:col-span-5 p-3 sm:p-4 bg-[#0c0c0c] flex flex-col justify-between min-h-[380px] lg:min-h-0 flex-1">
          <div className="flex flex-col justify-between h-full min-h-0 gap-2">
            {/* Header with inline Orb state */}
            <div className="flex items-center justify-between pb-2 border-b border-graphite/60 flex-shrink-0">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-gold-bright block mb-0.5 font-medium">
                  {'//'} CASCADE WATERFALL TELEMETRY
                </span>
                <h3 className="text-sm sm:text-[14.5px] font-normal text-chalk">
                  Resolución por Capas en Cascada
                </h3>
              </div>
              <div className="scale-75 origin-right">
                <ThinkingOrb state={orbState} currentScanningLayer={currentLayer} size={56} showLabel={false} />
              </div>
            </div>

            {/* 5-Layer Cascade Flow with Arrows */}
            <div className="flex flex-col gap-1 flex-1 justify-center min-h-0">
              {layersInfo.map((layer, idx) => {
                const Icon = layer.icon;
                const isScanning = currentLayer === layer.num && activeLayer !== layer.num;
                const isResolvedHit = activeLayer === layer.num;
                const isEvaluatedMiss = evaluatedLayers.includes(layer.num);
                const isBypassed = activeLayer !== null && layer.num > activeLayer;

                return (
                  <React.Fragment key={layer.num}>
                    {/* Layer Item Card */}
                    <div
                      className={`px-2.5 sm:px-3 py-1.5 border transition-all duration-200 flex items-center justify-between ${getLayerCardStyle(
                        layer.num
                      )}`}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        {/* Layer Badge with Icon */}
                        <div
                          className={`h-6 w-6 sm:h-7 sm:w-7 rounded flex items-center justify-center flex-shrink-0 border ${
                            isResolvedHit
                              ? 'bg-pulse-green/20 border-pulse-green text-pulse-green'
                              : isScanning
                              ? 'bg-cyan-400/20 border-cyan-400 text-cyan-300 animate-pulse'
                              : 'bg-[#151515] border-graphite text-gold-bright'
                          }`}
                        >
                          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </div>

                        {/* Title & Tech */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-semibold text-gold-bright">
                              CAPA 0{layer.num}
                            </span>
                            {isResolvedHit && (
                              <span className="inline-flex items-center gap-0.5 font-mono text-[9.5px] text-pulse-green font-bold bg-pulse-green/10 px-1 py-0.5 border border-pulse-green/40">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                MATCH HIT
                              </span>
                            )}
                            {isScanning && (
                              <span className="font-mono text-[9.5px] text-cyan-300 font-medium bg-cyan-400/10 px-1 py-0.5 border border-cyan-400/40 animate-pulse">
                                ESCANEANDO...
                              </span>
                            )}
                            {isEvaluatedMiss && (
                              <span className="inline-flex items-center gap-0.5 font-mono text-[9.5px] text-smoke bg-[#181818] px-1 py-0.5 border border-graphite">
                                <XCircle className="h-2.5 w-2.5" />
                                FALLÓ
                              </span>
                            )}
                            {isBypassed && (
                              <span className="font-mono text-[9.5px] text-smoke">
                                [BYPASS $0]
                              </span>
                            )}
                          </div>
                          <div className="text-[11.5px] sm:text-[12px] font-medium text-chalk truncate">
                            {layer.name}
                          </div>
                        </div>
                      </div>

                      {/* Metrics Pill */}
                      <div className="text-right flex-shrink-0 pl-1.5 sm:pl-2">
                        <div className="font-mono text-[9.5px] sm:text-[10px] text-chalk font-medium flex items-center justify-end gap-1">
                          <Clock className="h-2.5 w-2.5 text-smoke" />
                          <span>{layer.lat}</span>
                        </div>
                        <div className="font-mono text-[10px] text-smoke">
                          {layer.cost}
                        </div>
                      </div>
                    </div>

                    {/* Cascading Directional Arrow between layers */}
                    {idx < layersInfo.length - 1 && (
                      <div className="flex items-center justify-center -my-0.5">
                        <div className="flex items-center gap-1 text-smoke font-mono text-[9.5px]">
                          <div className="h-2 sm:h-2.5 w-[1px] bg-graphite" />
                          <ArrowDown className="h-2 sm:h-2.5 w-2 sm:w-2.5 text-graphite" />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Evaluated Result Preview */}
            <div className="p-2.5 bg-[#080808] border border-graphite font-mono text-xs flex-shrink-0">
              <div className="text-gold-bright mb-0.5 uppercase text-[9px] flex items-center justify-between font-medium">
                <span>RESULTADO EVALUADO EN VIVO:</span>
                {result && (
                  <span className="text-pulse-green font-semibold">
                    Filtro Resuelto en Capa 0{result.hitLayer}
                  </span>
                )}
              </div>
              {result ? (
                <div>
                  <div className="text-chalk font-semibold text-[11.5px] sm:text-[12px] truncate">{result.productName}</div>
                  <div className="text-pulse-green text-[10px] sm:text-[10.5px] mt-0.5 font-medium">
                    Precio: {result.price}
                  </div>
                  <div className="text-smoke text-[9px] sm:text-[9.5px] mt-0.5">
                    Método: {result.method} · Latencia: {result.latencyMs}ms · Costo: {result.costEstimate}
                  </div>
                </div>
              ) : isLoading ? (
                <div className="text-cyan-300 animate-pulse flex items-center gap-2 text-[10px] sm:text-[10.5px]">
                  <div className="h-3.5 w-3.5 flex items-center justify-center flex-shrink-0">
                    <ThinkingOrb state="searching_rag" size={20} showLabel={false} />
                  </div>
                  <span>Evaluando capas en cascada secuencial...</span>
                </div>
              ) : (
                <div className="text-smoke text-[10px] sm:text-[10.5px]">Esperando ejecución de consulta técnica...</div>
              )}
            </div>
          </div>
        </CrosshairCard>
      </div>
    </div>
  );
};
