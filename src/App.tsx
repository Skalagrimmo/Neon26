/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Download, Layers, Keyboard, Play, X } from 'lucide-react';

interface ModuleSeam {
  index: string;
  name: string;
  targetFile: string;
  deps: string;
  exports: string;
  responsibility: string;
}

const MODULE_SEAMS: ModuleSeam[] = [
  {
    index: '01',
    name: 'CONFIG',
    targetFile: 'src/config/gameConfig.ts',
    deps: 'Немає',
    exports: 'CONFIG',
    responsibility: 'Баланс бою, 2026-навички, товари ріпердока, діалогові ключові слова.'
  },
  {
    index: '02',
    name: 'EVENT_BUS',
    targetFile: 'src/core/eventBus.ts',
    deps: 'Немає',
    exports: 'createEventBus()',
    responsibility: 'Слабке зв’язування систем через події (combat:hit, hack:success, quest:update).'
  },
  {
    index: '03',
    name: 'STATE_STORE',
    targetFile: 'src/core/stateStore.ts',
    deps: 'CONFIG, EVENT_BUS',
    exports: 'createStateStore()',
    responsibility: 'Єдине джерело істини, реактивне автозбереження прогресу й окремі налаштування (опади) у localStorage.'
  },
  {
    index: '04',
    name: 'INPUT_MANAGER',
    targetFile: 'src/core/inputManager.ts',
    deps: 'Немає',
    exports: 'createInputManager()',
    responsibility: 'Нормалізація клавіатури, миші та iframe postMessage-міст без прив’язки до ігрової логіки.'
  },
  {
    index: '05',
    name: 'AUDIO_SYNTH',
    targetFile: 'src/audio/audioSynth.ts',
    deps: 'EVENT_BUS',
    exports: 'createAudioSynth()',
    responsibility: 'Процедурний Web Audio синтез ударів, смарт-пістолета, EMP і зламів.'
  },
  {
    index: '06',
    name: 'WORLD_MAP',
    targetFile: 'src/world/worldMap.ts',
    deps: 'CONFIG, STATE_STORE, EVENT_BUS',
    exports: 'createWorldMap()',
    responsibility: 'Ізометрична проєкція, колізії тайлів, 3 сектори 2026 року, термінали й переходи.'
  },
  {
    index: '07',
    name: 'COMBAT_ENGINE',
    targetFile: 'src/combat/combatEngine.ts',
    deps: 'CONFIG, STATE_STORE, EVENT_BUS, WORLD_MAP, INPUT_MANAGER',
    exports: 'createCombatEngine()',
    responsibility: 'Бітемап-фізика, 3-ударні комбо з буфером, ривки з i-frames, смарт-пістолет, 3 швидкі хаки.'
  },
  {
    index: '08',
    name: 'AI_DIRECTOR',
    targetFile: 'src/ai/aiDirector.ts',
    deps: 'STATE_STORE, WORLD_MAP, COMBAT_ENGINE',
    exports: 'createAIDirector()',
    responsibility: 'Машини станів для рейдерів, щитовиків, FPV-дронів, турелей 6G та боса Агент-09.'
  },
  {
    index: '09',
    name: 'HACKING_MATRIX',
    targetFile: 'src/hacking/hackingMatrix.ts',
    deps: 'STATE_STORE, EVENT_BUS, WORLD_MAP',
    exports: 'createHackingMatrix()',
    responsibility: 'Міні-гра злому Zero-Trust вузлів (рядки/стовпці, токени експлойтів, ICE-пастки).'
  },
  {
    index: '10',
    name: 'DIALOGUE_QUEST',
    targetFile: 'src/narrative/dialogueQuest.ts',
    deps: 'CONFIG, STATE_STORE, EVENT_BUS',
    exports: 'createDialogueQuest()',
    responsibility: 'SNES Shadowrun-діалоги з ключовими словами, портрети та магазин імплантів.'
  },
  {
    index: '11',
    name: 'ISOMETRIC_RENDERER',
    targetFile: 'src/render/isometricRenderer.ts',
    deps: 'CONFIG, STATE_STORE, WORLD_MAP',
    exports: 'createRenderer()',
    responsibility: 'Чистий Canvas 2D рендер, сортування глибини, тіні, післяобрази та телеграфи атак.'
  },
  {
    index: '11B',
    name: 'RAIN_SHADER',
    targetFile: 'src/render/rainShader.ts',
    deps: 'STATE_STORE',
    exports: 'createRainShader()',
    responsibility: 'WebGL GLSL-шейдер дощу (3 паралакс-шари, брижі, неонові відблиски) поверх сцени з 2D-резервом.'
  },
  {
    index: '11C',
    name: 'WORLD_EDITOR',
    targetFile: 'src/editor/worldEditor.ts',
    deps: 'CONFIG, STATE_STORE, WORLD_MAP, EVENT_BUS, INPUT_MANAGER',
    exports: 'createWorldEditor()',
    responsibility: 'Редактор рівнів і світу (Sandbox), створення секторів, миттєвий Playtest і JSON-серіалізація.'
  },
  {
    index: '11D',
    name: 'MINIMAP_HUD',
    targetFile: 'src/hud/minimapHud.ts',
    deps: 'STATE_STORE, WORLD_MAP',
    exports: 'createMinimapHud()',
    responsibility: 'Динамічна міні-карта з туманом війни, пам’яттю терміналів, сенсором ворогів і маркерами квестів.'
  },
  {
    index: '12',
    name: 'HUD_UI & KERNEL',
    targetFile: 'src/main.ts',
    deps: 'Модулі 01–11D',
    exports: 'AppKernel',
    responsibility: 'Збірка залежностей (DI), HUD, консоль подій, меню налаштувань і фіксований ігровий цикл 60 Гц.'
  }
];

const CONTROLS = [
  ['WASD / Стрілки', 'Рух у 8 напрямках (адаптовано під ізометрію)'],
  ['Space / Shift', 'Ривок із вікном невразливості (i-frames)'],
  ['J / ЛКМ', 'Швидке 3-ударне бітемап-комбо'],
  ['K / ПКМ', 'Важкий удар (пробиває щити, підкидає у повітря)'],
  ['L / Q', 'Смарт-пістолет з автонаведенням'],
  ['1 · 2 · 3', 'Промпт-ін’єкція · Розгін-26 (Slow-Mo) · Sub-GHz EMP'],
  ['T', 'Термо-зір (вороги крізь стіни та приховані схованки)'],
  ['M', 'Міні-карта сектора (згорнути або розгорнути)'],
  ['E', 'Розмова з NPC / Термінали / Портали'],
  ['Esc', 'Пауза або вихід із модального вікна']
];

export default function App() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'seams' | 'controls'>('none');

  // Bridge keyboard events to the standalone single-file HTML game so controls work instantaneously
  useEffect(() => {
    const forwardKey = (type: 'HOST_KEYDOWN' | 'HOST_KEYUP') => (e: KeyboardEvent) => {
      if (activeModal !== 'none') {
        if (type === 'HOST_KEYDOWN' && e.code === 'Escape') {
          setActiveModal('none');
        }
        return;
      }
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      if (document.activeElement !== iframeRef.current) {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
        win.postMessage({ type, code: e.code }, '*');
      }
    };

    const onDown = forwardKey('HOST_KEYDOWN');
    const onUp = forwardKey('HOST_KEYUP');
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [activeModal]);

  const focusGame = () => {
    setActiveModal('none');
    requestAnimationFrame(() => {
      iframeRef.current?.focus();
      iframeRef.current?.contentWindow?.focus();
    });
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0B0F17] text-slate-100">
      {/* 3-Zone Top Bar */}
      <header className="flex h-13 shrink-0 items-center justify-between gap-8 border-b border-slate-800/90 bg-[#0E1420] px-5">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={focusGame}
          className="font-display shrink-0 cursor-pointer whitespace-nowrap text-lg font-bold tracking-wide text-slate-100 hover:text-amber-400 transition-colors"
        >
          Shadowrun 2026
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={focusGame}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white ${
              activeModal === 'none' ? 'text-amber-400' : ''
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>Гра</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModal(activeModal === 'seams' ? 'none' : 'seams')}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white ${
              activeModal === 'seams' ? 'text-cyan-400' : ''
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Шви модулів (15)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModal(activeModal === 'controls' ? 'none' : 'controls')}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white ${
              activeModal === 'controls' ? 'text-cyan-400' : ''
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Керування</span>
          </button>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="shrink-0">
          <a
            href="/shadowrun-2026.html"
            download="shadowrun-2026.html"
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Завантажити .html</span>
          </a>
        </div>
      </header>

      {/* Main Game Viewport */}
      <main className="relative flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          src="/shadowrun-2026.html"
          title="Shadowrun 2026 Single-File HTML Game"
          className="h-full w-full border-0"
          onLoad={() => iframeRef.current?.contentWindow?.focus()}
        />

        {/* Module Seams Inspector Modal */}
        {activeModal === 'seams' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-700/80 bg-[#101826] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-100">
                    Архітектурні шви однофайлової гри
                  </h2>
                  <p className="text-xs text-slate-400">
                    Файл public/shadowrun-2026.html розділений на 15 ізольованих фабрик із явним впровадженням залежностей.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={focusGame}
                  className="rounded-md border border-slate-700 p-1.5 text-slate-400 hover:border-slate-500 hover:text-white"
                  aria-label="Закрити"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 overflow-y-auto p-6 md:grid-cols-2">
                {MODULE_SEAMS.map((m) => (
                  <div
                    key={m.index}
                    className="rounded-md border border-slate-800 bg-[#0B101B] p-3.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-sm font-bold text-amber-400">
                        {m.index}. {m.name}
                      </span>
                      <span className="font-mono-tech text-[11px] text-cyan-400">
                        {m.targetFile}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      {m.responsibility}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                      <span>
                        Залежності: <strong className="font-medium text-slate-200">{m.deps}</strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Експорт: <strong className="font-medium text-slate-200">{m.exports}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls Reference Modal */}
        {activeModal === 'controls' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-lg border border-slate-700/80 bg-[#101826] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <h2 className="font-display text-lg font-bold text-slate-100">
                  Керування боєм та зламом
                </h2>
                <button
                  type="button"
                  onClick={focusGame}
                  className="rounded-md border border-slate-700 p-1.5 text-slate-400 hover:border-slate-500 hover:text-white"
                  aria-label="Закрити"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-800/80 px-6 py-3">
                {CONTROLS.map(([keys, desc]) => (
                  <div key={keys} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="text-slate-300">{desc}</span>
                    <span className="font-mono-tech shrink-0 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-amber-400">
                      {keys}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-slate-800 px-6 py-3.5">
                <button
                  type="button"
                  onClick={focusGame}
                  className="rounded-md bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Повернутися до гри
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
