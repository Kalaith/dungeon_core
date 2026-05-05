import { useEffect, useState, type ReactNode } from 'react';

interface GameShellProps {
  hud: ReactNode;
  commandBar: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right?: ReactNode;
  intel?: ReactNode;
  lower?: ReactNode;
  mobileMonsters?: ReactNode;
  mobileEvents?: ReactNode;
  mobileCore?: ReactNode;
}

type MobileTab = 'dungeon' | 'build' | 'monsters' | 'events' | 'core';
type DesktopDrawer = 'build' | null;

const mobileTabs: Array<{ id: MobileTab; label: string }> = [
  { id: 'dungeon', label: 'Dungeon' },
  { id: 'build', label: 'Build' },
  { id: 'monsters', label: 'Monsters' },
  { id: 'events', label: 'Events' },
  { id: 'core', label: 'Core' },
];

export function GameShell({
  hud,
  commandBar,
  left,
  center,
  right,
  intel,
  lower,
  mobileMonsters,
  mobileEvents,
  mobileCore,
}: GameShellProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('dungeon');
  const [desktopDrawer, setDesktopDrawer] = useState<DesktopDrawer>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobileState = () => setIsMobile(mediaQuery.matches);

    updateMobileState();
    mediaQuery.addEventListener('change', updateMobileState);
    return () => mediaQuery.removeEventListener('change', updateMobileState);
  }, []);

  useEffect(() => {
    const openBuildMenu = () => {
      if (isMobile) {
        setMobileTab('build');
        return;
      }

      setDesktopDrawer('build');
    };

    window.addEventListener('dungeon-core:open-build-menu', openBuildMenu);
    return () => window.removeEventListener('dungeon-core:open-build-menu', openBuildMenu);
  }, [isMobile]);

  const mobileContent: Record<MobileTab, ReactNode> = {
    dungeon: center,
    build: left,
    monsters: mobileMonsters ?? right,
    events: mobileEvents ?? intel ?? lower,
    core: mobileCore ?? intel ?? lower,
  };
  const intelContent = intel ?? lower;
  const hasRightPanel = Boolean(right);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#090d18] text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.20),transparent_34%),linear-gradient(180deg,#0c1324_0%,#070a12_70%)]" />
      <div className="shrink-0 border-b border-slate-800/90 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto max-w-[1480px] px-3 py-2 sm:px-4">{hud}</div>
      </div>
      {isMobile ? (
        <main className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col px-3 pb-3 pt-3">
          <div className="mb-3 grid grid-cols-5 gap-1 rounded-lg border border-slate-700 bg-slate-950/80 p-1">
            {mobileTabs.map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`min-h-10 rounded-md px-1 text-[0.68rem] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${
                  mobileTab === tab.id
                    ? 'bg-amber-200 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <section className="min-h-0 flex-1 overflow-y-auto">{mobileContent[mobileTab]}</section>
        </main>
      ) : (
        <main className="mx-auto grid min-h-0 w-full max-w-[1480px] flex-1 grid-rows-[minmax(0,1fr)_minmax(5.5rem,7.75rem)] gap-3 px-3 py-3 sm:px-4">
          <div
            className={`relative grid min-h-0 gap-3 ${
              hasRightPanel
                ? 'grid-cols-[4rem_minmax(0,1fr)_21rem]'
                : 'grid-cols-[4rem_minmax(0,1fr)]'
            }`}
          >
            <aside className="min-h-0">
              <div className="flex h-full flex-col items-stretch gap-2 rounded-lg border border-slate-700/80 bg-slate-950/70 p-2">
                <button
                  type="button"
                  onClick={() => setDesktopDrawer(desktopDrawer === 'build' ? null : 'build')}
                  aria-expanded={desktopDrawer === 'build'}
                  className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border px-2 text-xs font-bold uppercase tracking-normal transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${
                    desktopDrawer === 'build'
                      ? 'border-amber-200 bg-amber-200 text-slate-950'
                      : 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20'
                  }`}
                >
                  <span className="text-xl leading-none">+</span>
                  <span className="[writing-mode:vertical-rl]">Build</span>
                </button>
              </div>
            </aside>
            <section className="min-h-0 min-w-0 overflow-hidden">{center}</section>
            {hasRightPanel ? (
              <aside className="min-h-0 min-w-0 overflow-hidden">{right}</aside>
            ) : null}
            {desktopDrawer ? (
              <aside
                className="absolute bottom-0 left-[4.75rem] top-0 z-30 w-[24rem] overflow-hidden rounded-lg border border-slate-600/90 bg-slate-950/95 shadow-2xl backdrop-blur"
              >
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-3 py-2">
                    <div className="text-xs font-bold uppercase tracking-normal text-slate-200">
                      Build / Monsters
                    </div>
                    <button
                      type="button"
                      onClick={() => setDesktopDrawer(null)}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                    >
                      Close
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden p-2">
                    {left}
                  </div>
                </div>
              </aside>
            ) : null}
          </div>
          {intelContent ? (
            <section className="min-h-0 overflow-hidden">{intelContent}</section>
          ) : null}
        </main>
      )}
      <div className="shrink-0 border-t border-slate-700/80 bg-slate-950/90 shadow-[0_-20px_55px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="mx-auto max-w-[1480px] px-3 py-2 sm:px-4">{commandBar}</div>
      </div>
    </div>
  );
}
