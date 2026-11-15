'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { TabType, Conversation, ChatMessage } from '@/lib/types';
import { INITIAL_CONVERSATIONS } from '@/lib/constants';
import { DEMO_CONVERSATIONS } from '@/lib/demoData';
import { HeaderNav } from '@/components/hud/HeaderNav';
import { KpiMatrix } from '@/components/telemetry/KpiMatrix';
import { LiveLogStream } from '@/components/telemetry/LiveLogStream';
import { MicroservicesTopologyCard } from '@/components/telemetry/MicroservicesTopologyCard';
import { CrmWorkspace } from '@/components/crm/CrmWorkspace';
import { RagStudio } from '@/components/rag/RagStudio';
import { N8nVisualizer } from '@/components/n8n/N8nVisualizer';
import { DevOpsConsole } from '@/components/devops/DevOpsConsole';
import { useSound } from '@/components/audio/SoundProvider';
import { useAuth } from '@/components/auth/AuthProvider';

export default function FlightDeckDashboard() {
  const { isDemoMode } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('flight');
  const [conversations, setConversations] = useState<Conversation[]>(
    isDemoMode ? DEMO_CONVERSATIONS : INITIAL_CONVERSATIONS
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string>(
    isDemoMode ? DEMO_CONVERSATIONS[0].id : INITIAL_CONVERSATIONS[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { toggleSound, playPacket, playSuccess } = useSound();
  const viewContainerRef = useRef<HTMLDivElement | null>(null);

  // Sincronizar datos si cambia el estado de Demo Mode
  useEffect(() => {
    if (isDemoMode) {
      setConversations(DEMO_CONVERSATIONS);
      setSelectedConversationId(DEMO_CONVERSATIONS[0].id);
    }
  }, [isDemoMode]);

  // Cargar conversaciones reales desde Supabase y WAHA
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data: Conversation[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setConversations(data);
          setSelectedConversationId((prev) => {
            if (prev && data.some((c) => c.id === prev)) return prev;
            return data[0].id;
          });
        }
      }
    } catch {
      // Usar datos locales si hay error de red
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // GSAP tab switch animation
  useEffect(() => {
    if (viewContainerRef.current) {
      gsap.fromTo(
        viewContainerRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  // Global Keyboard Shortcuts (1-5 for tabs, M for mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === '1') setActiveTab('flight');
      if (e.key === '2') setActiveTab('crm');
      if (e.key === '3') setActiveTab('rag');
      if (e.key === '4') setActiveTab('n8n');
      if (e.key === '5') setActiveTab('devops');
      if (e.key === 'm' || e.key === 'M') toggleSound();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSound]);

  const selectedConversation =
    conversations.find((c) => c.id === selectedConversationId) ||
    conversations[0] ||
    DEMO_CONVERSATIONS[0];

  const handleToggleSilentMode = async (convId: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    if (!targetConv) return;

    const newSilentState = !targetConv.silentMode;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, silentMode: newSilentState } : c
      )
    );

    if (isDemoMode) return;

    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_silent',
          phone: targetConv.phone,
          silentMode: newSilentState,
        }),
      });
    } catch {}
  };

  const handleSendMessage = async (convId: string, text: string) => {
    const targetConv = conversations.find((c) => c.id === convId);
    if (!targetConv) return;

    const now = new Date().toTimeString().slice(0, 5);
    const clientMsg: ChatMessage = {
      sender: 'client',
      text,
      time: now,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastTime: now,
              messages: [...c.messages, clientMsg],
            }
          : c
      )
    );

    playPacket();

    // En Modo Demo: simular respuesta del agente en ~600ms
    if (isDemoMode) {
      setTimeout(() => {
        const botResponses = [
          '¡Con gusto! El producto solicitado se encuentra disponible en inventario para entrega inmediata. Aceptamos Pago Móvil a tasa BCV, Zelle y transferencias.',
          'Entendido. He registrado tu pedido en el sistema. ¿Deseas coordinar el retiro en tienda física o despacho en camión?',
          'Cotización verificada en catálogo de más de 8.000 SKUs. Precios exactos de base de datos sin recargos sorpresa.',
        ];
        const randomResp = botResponses[Math.floor(Math.random() * botResponses.length)];
        const botMsg: ChatMessage = {
          sender: 'agent',
          text: randomResp,
          time: new Date().toTimeString().slice(0, 5),
          latency: '14ms',
          cost: '$0.0000',
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, botMsg],
                }
              : c
          )
        );
        playSuccess();
      }, 600);
      return;
    }

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          phone: targetConv.phone,
          message: clientMsg,
        }),
      });

      if (res.ok) {
        playSuccess();
      }
    } catch {}
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full max-w-full overflow-hidden">
      <HeaderNav activeTab={activeTab} onSelectTab={setActiveTab} />

      <div ref={viewContainerRef} className="flex-1 min-h-0 flex flex-col w-full max-w-full p-1.5 overflow-hidden mt-1">
        {/* VIEW 1: FLIGHT DECK */}
        {activeTab === 'flight' && (
          <div className="crosshair-safe flex flex-col flex-1 min-h-0 gap-3 py-1 overflow-y-auto lg:overflow-hidden lg:justify-between">
            <div className="flex-shrink-0">
              <span className="font-mono text-[10px] text-gold-bright uppercase tracking-wider block mb-0.5 font-medium">
                {'//'} GLOBAL TELEMETRY & FLIGHT RADAR
              </span>
              <h2 className="text-lg sm:text-xl font-normal text-chalk tracking-tight">
                Métricas Operativas del Agente en Producción
              </h2>
            </div>

            <KpiMatrix />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:flex-1 lg:min-h-0 p-0.5">
              {/* Architecture & Topology Card */}
              <div className="lg:col-span-7 lg:min-h-0 flex flex-col">
                <MicroservicesTopologyCard />
              </div>

              {/* Log Stream */}
              <div className="lg:col-span-5 min-h-[300px] lg:min-h-0 flex flex-col">
                <LiveLogStream />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: WHATSAPP CRM */}
        {activeTab === 'crm' && (
          <CrmWorkspace
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversationId}
            onToggleSilentMode={handleToggleSilentMode}
            onSendMessage={handleSendMessage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={setFilter}
          />
        )}

        {/* VIEW 3: RAG STUDIO */}
        {activeTab === 'rag' && (
          <div className="crosshair-safe flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col py-1">
            <RagStudio />
          </div>
        )}

        {/* VIEW 4: 33-NODE N8N */}
        {activeTab === 'n8n' && (
          <div className="crosshair-safe flex-1 min-h-0 overflow-y-auto">
            <N8nVisualizer />
          </div>
        )}

        {/* VIEW 5: COMMAND CENTER */}
        {activeTab === 'devops' && (
          <div className="crosshair-safe flex-1 min-h-0 overflow-y-auto">
            <DevOpsConsole />
          </div>
        )}
      </div>
    </div>
  );
}
