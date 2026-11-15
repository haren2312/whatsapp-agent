'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ThinkingOrb as OfficialOrb, OrbState as OfficialOrbState } from 'thinking-orbs';
import { OrbState } from '@/lib/types';

interface ThinkingOrbProps {
  state?: OrbState;
  currentScanningLayer?: 1 | 2 | 3 | 4 | 5 | null;
  size?: number;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

class OrbErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Orb rendering error caught by boundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-10 w-10 rounded-full border border-pulse-green/40 bg-pulse-green/10 flex items-center justify-center animate-pulse">
          <span className="h-2 w-2 rounded-full bg-pulse-green" />
        </div>
      );
    }
    return this.props.children;
  }
}

export const ThinkingOrb: React.FC<ThinkingOrbProps> = ({
  state = 'idle',
  currentScanningLayer = null,
  size = 64,
  label,
  className = '',
  showLabel = true,
}) => {
  let officialState: OfficialOrbState = 'breathing';

  if (state === 'searching_rag' && !currentScanningLayer) {
    officialState = 'searching';
  } else if (currentScanningLayer === 1) {
    officialState = 'working';
  } else if (currentScanningLayer === 2) {
    officialState = 'composing';
  } else if (currentScanningLayer === 3) {
    officialState = 'connecting';
  } else if (currentScanningLayer === 4) {
    officialState = 'weaving';
  } else if (currentScanningLayer === 5 || state === 'thinking_llm') {
    officialState = 'solving';
  } else if (state === 'dispatched') {
    officialState = 'shaping';
  } else if (state === 'error') {
    officialState = 'listening';
  }

  const layerLabels: Record<number, string> = {
    1: 'CAPA 1: PARSER DETERMINÍSTICO (AST)',
    2: 'CAPA 2: DICCIONARIO & JERGA REGIONAL',
    3: 'CAPA 3: SIMILITUD TRIGRAMAS (PG_TRGM)',
    4: 'CAPA 4: EMBEDDINGS HNSW (PGVECTOR)',
    5: 'CAPA 5: RESCATE SEMÁNTICO (LUNA)',
  };

  const stateLabels: Record<OrbState, string> = {
    idle: 'COGNITIVE ENGINE IDLE',
    searching_rag: 'INICIALIZANDO MOTOR RAG (+8.000 SKUs)...',
    thinking_llm: 'LUNA REASONING...',
    dispatched: 'MATCH ENCONTRADO EN BASE DE DATOS',
    error: 'ERROR EN CONSULTA',
  };

  const currentLabel = currentScanningLayer
    ? layerLabels[currentScanningLayer]
    : label || stateLabels[state];

  // Map to supported official sizes: 64 or 20
  const validSize: 64 | 20 = size < 40 ? 20 : 64;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Frameless, clean orb presentation */}
      <div className="relative flex items-center justify-center my-0.5">
        {/* Ambient glow */}
        <div
          className={`absolute inset-0 pointer-events-none rounded-full opacity-[0.08] blur-xl transition-all duration-500 scale-125 ${
            currentScanningLayer === 1
              ? 'bg-pulse-green'
              : currentScanningLayer === 2
              ? 'bg-amber-400'
              : currentScanningLayer === 3
              ? 'bg-cyan-400'
              : currentScanningLayer === 4
              ? 'bg-purple-500'
              : currentScanningLayer === 5
              ? 'bg-neon-rose'
              : state === 'searching_rag'
              ? 'bg-cyan-300'
              : 'bg-compass-gold'
          }`}
        />

        {/* Official ThinkingOrb with Error Boundary */}
        <div className="relative z-10">
          <OrbErrorBoundary>
            <OfficialOrb
              key={`orb-${officialState}-${validSize}`}
              state={officialState}
              size={validSize}
              theme="dark"
              speed={1.0}
            />
          </OrbErrorBoundary>
        </div>
      </div>

      {/* State & Layer Label (Optional) */}
      {showLabel && (
        <div className="mt-2 text-center max-w-[280px]">
          <div className="font-mono text-[9.5px] text-smoke uppercase tracking-wider mb-0.5">
            STATE: <span className="text-chalk font-semibold">{officialState}</span>
          </div>
          <span
            className={`font-mono text-[10.5px] uppercase tracking-wider font-semibold ${
              currentScanningLayer === 1
                ? 'text-pulse-green'
                : currentScanningLayer === 2
                ? 'text-amber-400'
                : currentScanningLayer === 3
                ? 'text-cyan-400'
                : currentScanningLayer === 4
                ? 'text-purple-400'
                : currentScanningLayer === 5
                ? 'text-neon-rose'
                : state === 'searching_rag'
                ? 'text-cyan-300'
                : 'text-compass-gold'
            }`}
          >
            {currentScanningLayer ? `[L0${currentScanningLayer}] ` : ''}
            {currentLabel}
          </span>
        </div>
      )}
    </div>
  );
};
