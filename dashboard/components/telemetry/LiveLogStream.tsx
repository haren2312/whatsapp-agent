'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from '@/lib/types';
import { CrosshairCard } from '@/components/hud/CrosshairCard';
import { useSound } from '@/components/audio/SoundProvider';
import { Zap } from 'lucide-react';

export const LiveLogStream: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isInjecting, setIsInjecting] = useState(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const { playPacket, playSuccess, playClick } = useSound();

  useEffect(() => {
    // Initial seeded logs
    const initialLogs: LogEntry[] = [
      {
        id: '1',
        time: '01:04:12',
        tag: 'success',
        tagLabel: '200 OK',
        msg: 'Webhook ack <14ms · session: +584120938472',
      },
      {
        id: '2',
        time: '01:04:13',
        tag: 'info',
        tagLabel: 'LAYER 1',
        msg: 'AST Regex matched: "Tornillo drywall 1/2" (SKU-4921)',
      },
      {
        id: '3',
        time: '01:04:13',
        tag: 'success',
        tagLabel: 'DISPATCH',
        msg: 'JSON estructurado validado en n8n · Enviado vía WAHA',
      },
    ];
    setLogs(initialLogs);
  }, []);

  const injectSimulatedEvent = () => {
    if (isInjecting) return;
    setIsInjecting(true);
    playClick();

    const sampleProducts = [
      { name: 'Tubo Estructural 2x1 Calibre 16', sku: 'SKU-8812', price: '14.20' },
      { name: 'Cemento Gris Portland Tipo I (Saco 42.5kg)', sku: 'SKU-1049', price: '8.50' },
      { name: 'Cabilla Estriada 1/2 pulgada (6m)', sku: 'SKU-3091', price: '7.80' },
      { name: 'Pintura Caucho Blanco Mate Galón', sku: 'SKU-5540', price: '16.00' },
    ];

    const selectedProd = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
    const phone = `+58 412-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Pasos con cadencia pausada y elegante para demostración (~4.5s total)
    const steps = [
      {
        stageIndex: 0,
        tag: 'info' as const,
        tagLabel: 'INBOUND',
        msg: `Mensaje recibido de ${phone}: "¿Tienen disponible ${selectedProd.name}?"`,
        delay: 0,
      },
      {
        stageIndex: 1,
        tag: 'success' as const,
        tagLabel: '200 OK',
        msg: `WAHA Webhook Ack <12ms · Payload verificado y deduplicado en Redis/Memory`,
        delay: 750,
      },
      {
        stageIndex: 2,
        tag: 'info' as const,
        tagLabel: 'N8N DAG',
        msg: `Orquestador n8n: Enrutamiento en nodo #14 (Procesar Mensaje Cliente)`,
        delay: 1600,
      },
      {
        stageIndex: 3,
        tag: 'info' as const,
        tagLabel: 'LAYER 1 AST',
        msg: `Determinismo AST: Coincidencia exacta "${selectedProd.name}" (${selectedProd.sku}) en catálogo de más de 8.000 SKUs`,
        delay: 2500,
      },
      {
        stageIndex: 4,
        tag: 'info' as const,
        tagLabel: 'SCHEMA',
        msg: `Validación de esquema JSON: cotización formateada con moneda USD ($${selectedProd.price})`,
        delay: 3450,
      },
      {
        stageIndex: 5,
        tag: 'success' as const,
        tagLabel: 'DISPATCH',
        msg: `Respuesta final enviada a WhatsApp vía WAHA (${selectedProd.price} USD) · Latencia total: ~700ms`,
        delay: 4400,
      },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        playPacket();

        // Notificar al componente del flujo de ejecución (DAG)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pipeline-step', { detail: { stage: step.stageIndex } }));
        }

        const now = new Date().toTimeString().slice(0, 8);
        const newLog: LogEntry = {
          id: `log-${Date.now()}-${Math.random()}`,
          time: now,
          tag: step.tag,
          tagLabel: step.tagLabel,
          msg: step.msg,
        };

        setLogs((prev) => [newLog, ...prev.slice(0, 29)]);

        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = 0;
        }

        if (step.tagLabel === 'DISPATCH') {
          setIsInjecting(false);
          playSuccess();
        }
      }, step.delay);
    });
  };

  const getTagClass = (tag: LogEntry['tag']) => {
    switch (tag) {
      case 'success':
        return 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40';
      case 'info':
        return 'bg-slate-900/80 text-blue-300 border border-blue-800/40';
      case 'warn':
        return 'bg-amber-950/60 text-amber-300 border border-amber-800/40';
      case 'error':
        return 'bg-rose-950/60 text-rose-300 border border-rose-800/40';
    }
  };

  return (
    <CrosshairCard className="p-3 sm:p-4 bg-[#0c0c0c] flex flex-col flex-1 min-h-[280px] lg:min-h-0">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2.5 flex-shrink-0">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold-bright font-medium">
          {'//'} RUNTIME LOG STREAM
        </span>
        <button
          onClick={injectSimulatedEvent}
          disabled={isInjecting}
          className={`inline-flex items-center gap-1.5 border px-3 py-1.5 sm:py-0.5 font-mono text-[10.5px] sm:text-[10px] uppercase font-semibold transition-all cursor-pointer min-h-[36px] sm:min-h-0 ${
            isInjecting
              ? 'border-pulse-green bg-pulse-green/15 text-pulse-green animate-pulse'
              : 'border-compass-gold/50 bg-compass-gold/10 text-gold-bright hover:bg-compass-gold/20 hover:border-compass-gold'
          }`}
        >
          <Zap className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-pulse-green" />
          <span>{isInjecting ? 'Procesando Flujo...' : 'Inyectar Evento'}</span>
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto bg-[#080808] border border-graphite p-2.5 sm:p-3 font-mono text-xs flex flex-col gap-2 min-h-0"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 sm:gap-3 border-b border-[#161616] pb-2 transition-all">
            <span className="text-smoke/60 font-mono text-[10px] sm:text-[11px] select-none flex-shrink-0">{log.time}</span>
            <span
              className={`font-mono text-[9.5px] uppercase px-1.5 py-0.5 flex-shrink-0 font-medium ${getTagClass(
                log.tag
              )}`}
            >
              {log.tagLabel}
            </span>
            <span className="text-chalk font-mono text-[10.5px] sm:text-[11.5px] leading-snug break-words flex-1 min-w-0">{log.msg}</span>
          </div>
        ))}
      </div>
    </CrosshairCard>
  );
};
