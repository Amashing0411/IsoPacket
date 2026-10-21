/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Trophy,
  Shield,
  Layers,
  Activity,
  DollarSign,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useScenarioStore } from '../../state/useScenarioStore';
import { SCENARIOS } from '../../engine/scenarioDefs';
import { ScenarioId } from '../../engine/scenarioTypes';

export const ScenarioModal: React.FC = () => {
  const isSelectorOpen = useScenarioStore((s) => s.isSelectorOpen);
  const closeSelector = useScenarioStore((s) => s.closeSelector);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const selectScenario = useScenarioStore((s) => s.selectScenario);
  const status = useScenarioStore((s) => s.status);
  const restartScenario = useScenarioStore((s) => s.restartScenario);

  const [previewId, setPreviewId] = useState<ScenarioId>(activeScenarioId);

  if (!isSelectorOpen && status !== 'won') return null;

  const previewScenario = SCENARIOS[previewId];
  const scenarioList: ScenarioId[] = ['sandbox', 'level1', 'level2', 'level3', 'level4'];

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-950 text-emerald-400 border-emerald-500/40';
      case 'Intermediate':
        return 'bg-amber-950 text-amber-400 border-amber-500/40';
      case 'Advanced':
        return 'bg-rose-950 text-rose-400 border-rose-500/40';
      case 'Expert':
        return 'bg-purple-950 text-purple-400 border-purple-500/40';
      default:
        return 'bg-cyan-950 text-cyan-400 border-cyan-500/40';
    }
  };

  // If Won, render Victory Celebration Modal
  if (status === 'won') {
    const currentIndex = scenarioList.indexOf(activeScenarioId);
    const nextScenarioId =
      currentIndex < scenarioList.length - 1 ? scenarioList[currentIndex + 1] : null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
        <div className="bg-[#0b101c] border-2 border-emerald-500/60 rounded-3xl max-w-lg w-full p-6 text-slate-200 shadow-2xl shadow-emerald-950/60 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block mb-1">
            CAMPAIGN OBJECTIVE MET
          </span>
          <h2 className="text-xl font-extrabold text-white mb-2">
            Level Complete: {previewScenario.title}
          </h2>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            You successfully architected a resilient network topology, maintained an SLA above
            99.0% under live packet traffic, and stayed within budget limits!
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6 bg-[#131b2c] p-3 rounded-2xl border border-slate-700/60 text-left text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">SLA Uptime</span>
              <span className="font-bold text-emerald-400 text-sm">99.0%+ SLA (Passed)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Status</span>
              <span className="font-bold text-cyan-400 text-sm">Target Sustained</span>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={restartScenario}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Level</span>
            </button>

            {nextScenarioId ? (
              <button
                onClick={() => selectScenario(nextScenarioId)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>Next Mission</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => selectScenario('sandbox')}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
              >
                <span>Free Sandbox</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono select-none">
      <div className="bg-[#0b101c] border border-cyan-500/40 rounded-3xl max-w-4xl w-full p-5 sm:p-6 text-slate-200 shadow-2xl shadow-cyan-950/60 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base tracking-wide">
                Network Scenarios & Campaigns
              </h2>
              <p className="text-[11px] text-slate-400">
                Choose a structured network engineering puzzle or free sandbox mode
              </p>
            </div>
          </div>

          <button
            onClick={closeSelector}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Main Body (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto pr-1">
          {/* Left Column: Scenario List */}
          <div className="md:col-span-5 space-y-2">
            {scenarioList.map((id) => {
              const sc = SCENARIOS[id];
              const isSelected = previewId === id;
              const isActive = activeScenarioId === id;

              return (
                <button
                  key={id}
                  onClick={() => setPreviewId(id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#152033] border-cyan-400 shadow-lg shadow-cyan-950/40'
                      : 'bg-[#0f1624] border-slate-800 hover:border-slate-700 hover:bg-[#121a2c]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-white truncate">{sc.title}</span>
                    <span
                      className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold ${getDifficultyBadge(
                        sc.difficulty
                      )}`}
                    >
                      {sc.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{sc.subtitle}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <DollarSign className="w-3 h-3" />
                      {sc.budget >= 999999 ? 'Unlimited' : `$${sc.budget}`}
                    </span>
                    {isActive && (
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Currently Active
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Scenario Detail & Launch View */}
          <div className="md:col-span-7 bg-[#101726] border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${getDifficultyBadge(
                      previewScenario.difficulty
                    )}`}
                  >
                    {previewScenario.difficulty}
                  </span>
                  <span className="text-xs text-slate-400">
                    Target: {previewScenario.durationSecondsToWin > 0 ? `SLA >= 99% for ${previewScenario.durationSecondsToWin}s` : 'Free Exploration'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">{previewScenario.title}</h3>
                <p className="text-xs text-cyan-300 font-medium mb-2">{previewScenario.subtitle}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{previewScenario.description}</p>
              </div>

              {/* Briefing Checklist */}
              <div className="bg-[#0a0f18] p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Tactical Briefing & Constraints
                </span>
                {previewScenario.briefing.map((item, i) => (
                  <div key={i} className="text-[11px] text-slate-300 leading-normal">
                    {item}
                  </div>
                ))}
              </div>

              {/* Objectives List */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  Winning Objectives
                </span>
                <div className="space-y-1.5">
                  {previewScenario.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Action Footer */}
            <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-[10px] text-slate-400 block">Available Budget</span>
                <span className="font-bold text-emerald-400">
                  {previewScenario.budget >= 999999 ? 'Unlimited' : `$${previewScenario.budget.toLocaleString()}`}
                </span>
              </div>

              <button
                onClick={() => selectScenario(previewId)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch {previewScenario.title}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
