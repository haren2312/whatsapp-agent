'use client';

import React, { useState, useEffect } from 'react';
import { CrosshairCard } from '@/components/hud/CrosshairCard';
import { ThinkingOrb } from '@/components/orbs/ThinkingOrb';
import {
  Server,
  Database,
  GitBranch,
  BrainCircuit,
  Cloud,
  Zap,
  ShieldCheck,
  Radio,
  ArrowRight,
} from 'lucide-react';

export const MicroservicesTopologyCard: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number | null>(null);

  useEffect(() => {
    let resetTimer: NodeJS.Timeout;

    const handlePipelineStep = (e: Event) => {
      const customEvent = e as CustomEvent<{ stage: number }>;
      const stageIdx = customEvent.detail?.stage;
      if (typeof stageIdx === 'number') {
        setActiveStage(stageIdx);
        clearTimeout(resetTimer);

        if (stageIdx === 5) {
          // Mantener iluminado el paso final y luego retornar suavemente a reposo
          resetTimer = setTimeout(() => {
            setActiveStage(null);
          }, 4000);
        }
      }
    };

    window.addEventListener('pipeline-step', handlePipelineStep);
    return () => {
      window.removeEventListener('pipeline-step', handlePipelineStep);
      clearTimeout(resetTimer);
    };
  }, []);

  const microservices = [
    {
      id: 'waha',
      title: 'PASARELA WHATSAPP (WAHA)',
      status: 'Healthy (Docker Port 3000)',
      statusType: 'online',
      latency: '<12ms Ack',
      detail: 'NOWEB Engine · Multi-Session',
      icon: Radio,
      activeOnStages: [0, 5],
    },
    {
      id: 'n8n',
      title: 'ORQUESTADOR N8N',
      status: '33 Nodos / Zero-Desync',
      statusType: 'online',
      latency: '4 Flujos Activos',
      detail: 'Deduplicación & Rate Limiter',
      icon: GitBranch,
      activeOnStages: [1, 2],
    },
    {
      id: 'supabase',
      title: 'BASE VECTORIAL (SUPABASE)',
      status: 'pgvector / HNSW Cosine',
      statusType: 'online',
      latency: '+8.000 SKUs',
      detail: 'PostgreSQL 15 + pg_trgm GIN',
      icon: Database,
      activeOnStages: [3],
    },
    {
      id: 'ai-engine',
      title: 'AUTONOMOUS SELF-HEAL',
      status: 'OpenRouter · gpt-5.6-luna',
      statusType: 'gold',
      latency: 'JSON estructurado',
      detail: 'Recuperación de Fallos en Vivo',
      icon: BrainCircuit,
      activeOnStages: [4],
    },
    {
      id: 'tunnels',
      title: 'TÚNELES CLOUDFLARE',
      status: 'Dynamic Ingress Active',
      statusType: 'online',
      latency: 'Heartbeat 30s',
      detail: 'Supabase tunnel_config Sync',
      icon: Cloud,
      activeOnStages: [0, 1],
    },
    {
      id: 'catchup',
      title: 'CATCH-UP RESILIENCE',
      status: 'PowerShell Auto-Recovery',
      statusType: 'gold',
      latency: 'Zero Data Loss',
      detail: 'Tolerancia a Cortes Eléctricos',
      icon: Zap,
      activeOnStages: [],
    },
  ];

  const pipelineStages = [
    { label: 'WAHA Inbound', sub: 'Webhook', stageIdx: 0 },
    { label: 'Deduplicación', sub: '<12ms', stageIdx: 1 },
    { label: '33 Nodos n8n', sub: 'Pipeline', stageIdx: 2 },
    { label: 'RAG 5 Capas', sub: 'pgvector', stageIdx: 3 },
    { label: 'JSON estructurado', sub: 'JSON', stageIdx: 4 },
    { label: 'WAHA Dispatch', sub: 'WhatsApp', stageIdx: 5 },
  ];

  return (
    <CrosshairCard className="p-3 sm:p-4 bg-[#0c0c0c] flex flex-col justify-between flex-1 lg:min-h-0">
      <div className="flex flex-col gap-2.5 min-h-0">
        {/* Header with status badge */}
        <div className="flex flex-wrap justify-between items-center gap-2 flex-shrink-0">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-gold-bright block mb-0.5 font-medium">
              {'//'} RESILIENCE & RUNTIME TOPOLOGY
            </span>
            <h3 className="text-sm sm:text-[15px] font-normal text-chalk">
              Topología de Microservicios & Pipeline en Producción
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pulse-green/10 border border-pulse-green/30 font-mono text-[10px] text-pulse-green flex-shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-pulse-green animate-pulse" />
            <span>ALTA DISPONIBILIDAD</span>
          </div>
        </div>

        {/* 6 Microservice HUD Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 flex-shrink-0">
          {microservices.map((srv) => {
            const Icon = srv.icon;
            const isGold = srv.statusType === 'gold';
            const isServicePulsing = activeStage !== null && srv.activeOnStages.includes(activeStage);

            return (
              <div
                key={srv.id}
                className={`p-2 sm:p-2.5 border transition-all duration-300 flex flex-col justify-between ${
                  isServicePulsing
                    ? 'bg-pulse-green/15 border-pulse-green shadow-[0_0_16px_rgba(152,255,56,0.3)] ring-1 ring-pulse-green/50 scale-[1.01]'
                    : 'bg-[#080808] border-graphite/80 hover:border-ash hover:bg-[#101010]'
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-1">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] text-smoke uppercase truncate min-w-0">
                    <Icon
                      className={`h-3 w-3 flex-shrink-0 ${
                        isServicePulsing ? 'text-pulse-green animate-pulse' : 'text-gold-bright'
                      }`}
                    />
                    <span className={`truncate ${isServicePulsing ? 'text-chalk font-semibold' : ''}`}>
                      {srv.title}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[9px] px-1 py-0.5 border flex-shrink-0 transition-colors ${
                      isServicePulsing
                        ? 'text-pulse-green border-pulse-green bg-pulse-green/20 font-bold animate-pulse'
                        : isGold
                        ? 'text-gold-bright border-gold-bright/30 bg-gold-bright/10'
                        : 'text-pulse-green border-pulse-green/30 bg-pulse-green/10'
                    }`}
                  >
                    {srv.latency}
                  </span>
                </div>

                <div>
                  <div
                    className={`text-[11px] sm:text-[11.5px] font-medium truncate ${
                      isServicePulsing
                        ? 'text-pulse-green font-semibold'
                        : isGold
                        ? 'text-gold-bright'
                        : 'text-pulse-green'
                    }`}
                  >
                    {srv.status}
                  </div>
                  <div className="font-mono text-[9px] sm:text-[9.5px] text-smoke truncate mt-0.5">
                    {srv.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Linear DAG Pipeline Flow */}
        <div
          className={`p-2.5 sm:p-3 border transition-all duration-300 flex flex-col gap-2 flex-shrink-0 ${
            activeStage !== null
              ? 'bg-[#0e0e0e] border-compass-gold/60 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
              : 'bg-[#080808] border-graphite'
          }`}
        >
          <div className="font-mono text-[9px] uppercase tracking-wider text-gold-bright flex flex-wrap items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center flex-shrink-0">
                <ThinkingOrb
                  state={activeStage !== null ? 'searching_rag' : 'idle'}
                  currentScanningLayer={activeStage !== null ? (Math.min(5, activeStage + 1) as 1 | 2 | 3 | 4 | 5) : null}
                  size={20}
                  showLabel={false}
                />
              </div>
              <span className="font-mono text-[9px] sm:text-[9.5px]">Pipeline de Eventos en Tiempo Real</span>
            </div>
            <span className={activeStage !== null ? 'text-pulse-green font-bold animate-pulse' : 'text-smoke'}>
              {activeStage !== null ? `Paso ${activeStage + 1}/6 en proceso...` : '~700ms Latencia'}
            </span>
          </div>

          {/* Desktop/Tablet: Horizontal flow with arrows. Mobile: 3x2 Grid */}
          <div className="hidden md:flex items-center justify-between gap-1 px-0.5 py-1">
            {pipelineStages.map((stage, idx) => {
              const isStageActive = activeStage === stage.stageIdx;
              const isStagePassed = activeStage !== null && activeStage > stage.stageIdx;

              return (
                <React.Fragment key={stage.label}>
                  <div
                    className={`flex flex-col items-center px-1.5 py-1 flex-1 min-w-0 text-center border transition-all duration-300 ${
                      isStageActive
                        ? 'bg-pulse-green/20 border-pulse-green text-pulse-green shadow-[0_0_16px_rgba(152,255,56,0.4)] scale-[1.02] font-semibold ring-1 ring-pulse-green'
                        : isStagePassed
                        ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                        : 'bg-[#141414] border-graphite text-chalk'
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] font-medium truncate w-full ${
                        isStageActive ? 'text-pulse-green font-bold' : isStagePassed ? 'text-emerald-300' : 'text-chalk'
                      }`}
                    >
                      {stage.label}
                    </span>
                    <span
                      className={`font-mono text-[9.5px] truncate mt-0.5 ${
                        isStageActive ? 'text-pulse-green font-bold animate-pulse' : isStagePassed ? 'text-emerald-400' : 'text-pulse-green'
                      }`}
                    >
                      {stage.sub}
                    </span>
                  </div>
                  {idx < pipelineStages.length - 1 && (
                    <ArrowRight
                      className={`h-2.5 w-2.5 flex-shrink-0 transition-colors ${
                        isStageActive || isStagePassed ? 'text-pulse-green animate-pulse' : 'text-smoke'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile Grid (3 cols x 2 rows) for crisp readability */}
          <div className="grid grid-cols-3 gap-1.5 md:hidden">
            {pipelineStages.map((stage) => {
              const isStageActive = activeStage === stage.stageIdx;
              const isStagePassed = activeStage !== null && activeStage > stage.stageIdx;

              return (
                <div
                  key={stage.label}
                  className={`flex flex-col items-center px-1.5 py-1 text-center border transition-all duration-300 ${
                    isStageActive
                      ? 'bg-pulse-green/20 border-pulse-green text-pulse-green shadow-[0_0_12px_rgba(152,255,56,0.4)] font-semibold ring-1 ring-pulse-green'
                      : isStagePassed
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                      : 'bg-[#141414] border-graphite text-chalk'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] font-medium truncate w-full ${
                      isStageActive ? 'text-pulse-green font-bold' : isStagePassed ? 'text-emerald-300' : 'text-chalk'
                    }`}
                  >
                    0{stage.stageIdx + 1} {stage.label}
                  </span>
                  <span
                    className={`font-mono text-[9.5px] truncate mt-0.5 ${
                      isStageActive ? 'text-pulse-green font-bold animate-pulse' : isStagePassed ? 'text-emerald-400' : 'text-pulse-green'
                    }`}
                  >
                    {stage.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Resilience Guarantees Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-graphite/40 flex-shrink-0 font-mono text-[9px] sm:text-[9.5px]">
          <div className="flex items-center gap-1.5 text-smoke truncate">
            <ShieldCheck className="h-3 w-3 text-pulse-green flex-shrink-0" />
            <span className="text-chalk truncate">Deduplicación 100%</span>
          </div>
          <div className="flex items-center gap-1.5 text-smoke truncate">
            <Server className="h-3 w-3 text-gold-bright flex-shrink-0" />
            <span className="text-chalk truncate">+8.000 SKUs Catálogo</span>
          </div>
          <div className="flex items-center gap-1.5 text-smoke truncate">
            <Zap className="h-3 w-3 text-gold-bright flex-shrink-0" />
            <span className="text-chalk truncate">Zero Data Loss</span>
          </div>
          <div className="flex items-center gap-1.5 text-smoke truncate">
            <Cloud className="h-3 w-3 text-blue-400 flex-shrink-0" />
            <span className="text-chalk truncate">Cloudflare Tunnels</span>
          </div>
        </div>
      </div>
    </CrosshairCard>
  );
};
