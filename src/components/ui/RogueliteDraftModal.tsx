/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRogueliteStore } from '../../state/useRogueliteStore';
import { SoundFX } from '../../audio/SoundFX';

export const RogueliteDraftModal: React.FC = () => {
  const { isDraftOpen, draftChoices, selectCard, rerollDraft, rerollsAvailable, activeCards } =
    useRogueliteStore();

  if (!isDraftOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none font-mono">
      {/* Background CRT scanline & vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15)_0%,rgba(2,6,23,0.95)_100%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full">
        {/* Header Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/90 via-indigo-950/90 to-purple-950/90 border border-cyan-500/50 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <span className="text-cyan-400 font-extrabold text-xs tracking-wider">PROTOCOL UPGRADE DETECTED</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 text-xs font-semibold">SELECT 1 HARDWARE DIRECTIVE</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2 text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          CHOOSE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">DIRECTIVE</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mb-6 text-center max-w-lg">
          Enhance your Mindustry bandwidth grid, overclock weaponized protocols, or reinforce Core infrastructure.
        </p>

        {/* 3 Card Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full mb-6">
          {draftChoices.map((card) => {
            let borderColor = 'border-cyan-500/50 hover:border-cyan-400';
            let bgGlow = 'hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]';
            let badgeBg = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';

            if (card.rarity === 'rare') {
              borderColor = 'border-purple-500/60 hover:border-purple-400';
              bgGlow = 'hover:shadow-[0_0_35px_rgba(168,85,247,0.4)]';
              badgeBg = 'bg-purple-950/80 text-purple-300 border-purple-500/50';
            } else if (card.rarity === 'legendary') {
              borderColor = 'border-amber-400/80 hover:border-amber-300';
              bgGlow = 'hover:shadow-[0_0_40px_rgba(251,191,36,0.5)]';
              badgeBg = 'bg-amber-950/90 text-amber-300 border-amber-400/60';
            }

            return (
              <button
                key={card.id}
                onClick={() => selectCard(card)}
                onMouseEnter={() => SoundFX.playClick(650)}
                className={`group relative flex flex-col text-left p-6 rounded-2xl border bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-[#0b0f19]/95 shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ${borderColor} ${bgGlow}`}
              >
                {/* Top Badge: Rarity & Category */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{card.icon}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                    {card.rarity}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-cyan-300 transition-colors mb-2">
                  {card.title}
                </h3>

                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-6">
                  {card.description}
                </p>

                <div className="mt-auto pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  <span className="tracking-wide">INSTALL FIRMWARE</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Reroll & Active Card Count */}
        <div className="flex flex-wrap items-center justify-between w-full text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>Active Directives:</span>
            <span className="font-bold text-cyan-400">{activeCards.length}</span>
          </div>

          <button
            onClick={rerollDraft}
            disabled={rerollsAvailable <= 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border font-bold text-xs transition-all shadow-md ${
              rerollsAvailable > 0
                ? 'border-indigo-500/60 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                : 'border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed'
            }`}
          >
            <span>🎲</span>
            <span>REROLL ({rerollsAvailable} LEFT)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
