'use client';

import React, { useEffect, useState } from 'react';
import { TabType } from '@/lib/types';
import { useSound } from '@/components/audio/SoundProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { RecruiterArchitectureGuide } from './RecruiterArchitectureGuide';
import { HeaderActionsMenu, HeaderAction } from './HeaderActionsMenu';
import { Volume2, VolumeX, Cloud, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import {
  MotionFlightIcon,
  MotionCrmIcon,
  MotionRagIcon,
  MotionN8nIcon,
  MotionDevOpsIcon,
} from '@/components/icons/MotionIcons';

interface HeaderNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ activeTab, onSelectTab }) => {
  const { soundEnabled, toggleSound, playClick, playSuccess } = useSound();
  const { user, isDemoMode, signOut } = useAuth();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [tunnels, setTunnels] = useState<{
    wahaOnline: boolean;
    n8nOnline: boolean;
  }>({ wahaOnline: false, n8nOnline: false });

  useEffect(() => {
    const fetchTunnels = async () => {
      try {
        const res = await fetch('/api/tunnel');
        if (res.ok) {
          const data = await res.json();
          setTunnels({
            wahaOnline: Boolean(data?.waha?.isOnline),
            n8nOnline: Boolean(data?.n8n?.isOnline),
          });
        }
      } catch {
        // Suppress background poll errors
      }
    };

    fetchTunnels();
    const interval = setInterval(fetchTunnels, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (tab: TabType) => {
    try {
      playClick();
    } catch {}
    onSelectTab(tab);
  };

  const handleSignOut = async () => {
    try {
      playClick();
      await signOut();
    } catch {}
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'flight', label: 'Flight Deck', icon: <MotionFlightIcon /> },
    { id: 'crm', label: 'WhatsApp CRM', icon: <MotionCrmIcon /> },
    { id: 'rag', label: 'RAG Studio (TUI)', icon: <MotionRagIcon /> },
    { id: 'n8n', label: '33-Node n8n', icon: <MotionN8nIcon /> },
    { id: 'devops', label: 'Command Center', icon: <MotionDevOpsIcon /> },
  ];

  // Below md the secondary actions collapse into a single menu so the header
  // stops being a row of undifferentiated icon boxes.
  const collapsedActions: HeaderAction[] = [
    {
      id: 'guide',
      label: 'Guía Arquitectura',
      icon: <Sparkles className="h-4 w-4 text-pulse-green" aria-hidden="true" />,
      onClick: () => {
        playSuccess();
        setIsGuideOpen(true);
      },
    },
    {
      id: 'sound',
      label: soundEnabled ? 'Silenciar audio' : 'Activar audio',
      icon: soundEnabled ? (
        <Volume2 className="h-4 w-4 text-pulse-green" aria-hidden="true" />
      ) : (
        <VolumeX className="h-4 w-4 text-smoke" aria-hidden="true" />
      ),
      onClick: toggleSound,
    },
  ];

  if (user) {
    collapsedActions.push({
      id: 'signout',
      label: isDemoMode ? 'Salir del modo demo' : 'Cerrar sesión',
      icon: <LogOut className="h-4 w-4" aria-hidden="true" />,
      onClick: handleSignOut,
      destructive: true,
    });
  }

  const tunnelDot = (online: boolean) =>
    online ? 'bg-pulse-green' : 'bg-neon-rose';

  const menuStatus = (
    <div className="flex flex-col gap-2">
      {user && (
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-chalk">
          <UserIcon className="h-3.5 w-3.5 flex-shrink-0 text-gold-bright" aria-hidden="true" />
          <span className="truncate" title={user.email}>
            {isDemoMode ? 'RECRUITER DEMO' : user.email}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 font-mono text-[10.5px] text-smoke">
        <Cloud className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" aria-hidden="true" />
        <span className="flex items-center gap-1">
          WAHA
          <span className={`h-1.5 w-1.5 rounded-full ${tunnelDot(tunnels.wahaOnline)}`} aria-hidden="true" />
          <span className={tunnels.wahaOnline ? 'text-pulse-green' : 'text-neon-rose'}>
            {tunnels.wahaOnline ? 'ON' : 'OFF'}
          </span>
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          n8n
          <span className={`h-1.5 w-1.5 rounded-full ${tunnelDot(tunnels.n8nOnline)}`} aria-hidden="true" />
          <span className={tunnels.n8nOnline ? 'text-pulse-green' : 'text-neon-rose'}>
            {tunnels.n8nOnline ? 'ON' : 'OFF'}
          </span>
        </span>
      </div>
    </div>
  );

  return (
    <>
      <header className="hud-header pointer-events-auto sticky top-0 z-50 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border border-graphite bg-[#0e0e0e]/95 backdrop-blur-xl sm:top-2">
        {/* Brand & Mission Status */}
        <div className="flex min-w-0 select-none items-center gap-2.5">
          <img
            src="/crmlogo.svg"
            alt="CRM Logo"
            className="h-6 w-auto object-contain flex-shrink-0"
          />
          <div className="hud-header-brand min-w-0">
            <div className="flex items-center gap-1.5 truncate font-mono text-[12.5px] font-semibold uppercase tracking-wider text-chalk">
              <span>{process.env.NEXT_PUBLIC_AGENT_NAME || 'AGENT'}</span>
              <span className="hidden text-gold-bright md:inline">{'//'}</span>
              <span className="hidden text-smoke md:inline">WHATSAPP CRM FLIGHT DECK</span>
            </div>
            <div className="hidden truncate font-mono text-[9.5px] uppercase text-smoke sm:block">
              TARGET: {process.env.NEXT_PUBLIC_TARGET_NAME || process.env.NEXT_PUBLIC_STORE_NAME || 'COMMERCE STORE'} · 33 NODES · 8,000+ SKUs
            </div>
          </div>
        </div>

        {/* Segmented Navigation Capsule */}
        <nav
          className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-full border border-graphite bg-[#111111]/90 p-1 backdrop-blur-md sm:order-none sm:w-auto"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                title={tab.label}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wider transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-compass-gold sm:min-h-0 sm:flex-none ${
                  isActive
                    ? 'bg-compass-gold/15 text-compass-gold ring-1 ring-compass-gold/40 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                    : 'text-smoke hover:bg-graphite/40 hover:text-chalk'
                }`}
              >
                <span className={isActive ? 'text-compass-gold' : 'text-smoke'}>
                  {tab.icon}
                </span>
                <span className="hidden lg:inline">{tab.label}</span>
                {isActive && (
                  <span className="h-1 w-1 rounded-full bg-compass-gold animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status Capsule: Recruiter Guide + Tunnels + User + Sound */}
        <div className="flex flex-shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {/* Inline actions: only from md up, where they can carry labels */}
          <div className="hidden items-center gap-1.5 md:flex md:gap-2">
          {/* Recruiter Guide CTA Button */}
          <button
            onClick={() => {
              playSuccess();
              setIsGuideOpen(true);
            }}
            className="hud-tap-target flex min-h-[32px] cursor-pointer items-center justify-center gap-1.5 border border-compass-gold/50 bg-compass-gold/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-gold-bright shadow-[0_0_10px_rgba(212,175,55,0.15)] transition-all hover:border-compass-gold hover:bg-compass-gold/20"
            title="Abrir resumen arquitectónico para evaluadores técnicos"
          >
            <Sparkles className="h-3 w-3 text-pulse-green animate-pulse" />
            <span className="hud-guide-label">GUÍA ARQUITECTURA</span>
          </button>

          {/* Cloudflare Tunnel Status Badge */}
          <div className="hidden lg:flex items-center gap-2 border border-graphite bg-[#141414] px-2.5 py-1 font-mono text-[10.5px] text-smoke">
            <Cloud className="h-3 w-3 text-blue-400" />
            <span className="flex items-center gap-1">
              WAHA:
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  tunnels.wahaOnline ? 'bg-pulse-green' : 'bg-neon-rose'
                }`}
              />
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              n8n:
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  tunnels.n8nOnline ? 'bg-pulse-green' : 'bg-neon-rose'
                }`}
              />
            </span>
          </div>

          {/* Audio Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="hud-tap-target flex cursor-pointer items-center justify-center gap-1 border border-graphite bg-[#141414] px-2 py-1 font-mono text-[10.5px] text-smoke transition-colors hover:border-ash hover:text-chalk"
            aria-label={soundEnabled ? 'Silenciar sintetizador de sonido' : 'Activar sintetizador de sonido'}
            title="Alternar sintetizador de sonido"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3 w-3 text-pulse-green" />
                <span className="hidden sm:inline">AUDIO</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3 w-3 text-smoke" />
                <span className="hidden sm:inline">MUTED</span>
              </>
            )}
          </button>

          {/* User Session & Logout */}
          {user && (
            <div className="flex items-center gap-1.5 border border-graphite bg-[#111111] px-2 py-1 font-mono text-[10.5px]">
              <UserIcon className="h-3 w-3 flex-shrink-0 text-gold-bright" />
              <span className="text-chalk max-w-[120px] truncate hidden md:inline" title={user.email}>
                {isDemoMode ? 'RECRUITER DEMO' : user.email?.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="hud-tap-target -my-1 ml-1 flex cursor-pointer items-center justify-center px-1 text-smoke transition-colors hover:text-neon-rose focus-visible:outline focus-visible:outline-2 focus-visible:outline-compass-gold"
                aria-label={isDemoMode ? 'Salir del Modo Demo' : 'Cerrar sesión de Supabase Auth'}
                title={isDemoMode ? 'Salir del Modo Demo' : 'Cerrar sesión de Supabase Auth'}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          </div>

          {/* Live / Demo Mode Badge */}
          <div
            className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10.5px] select-none ${
              isDemoMode
                ? 'border-compass-gold/50 bg-compass-gold/15 text-compass-gold font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                : 'border-pulse-green/25 bg-pulse-green/[0.08] text-pulse-green'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isDemoMode
                  ? 'bg-compass-gold animate-pulse'
                  : 'bg-pulse-green shadow-[0_0_8px_var(--color-pulse-green)] animate-pulse-glow'
              }`}
            />
            <span>{isDemoMode ? 'DEMO SANDBOX' : 'LIVE'}</span>
          </div>

          {/* Below md the same actions live behind one control */}
          <HeaderActionsMenu
            className="md:hidden"
            actions={collapsedActions}
            status={menuStatus}
          />
        </div>
      </header>

      {/* Recruiter Architecture Briefing Modal */}
      <RecruiterArchitectureGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onNavigateTab={onSelectTab}
      />
    </>
  );
};
