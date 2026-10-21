/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AudioManager } from '../../utils/AudioManager';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialStep {
  title: string;
  badge: string;
  badgeColor: string;
  icon: string;
  content: string;
  highlightItems: Array<{ label: string; desc: string }>;
  tip: string;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Cisco Network Tycoon',
    badge: 'Step 1 of 5 • The Objective',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: '🏢',
    content:
      'IsoPacket merges real Cisco enterprise architecture with an educational tycoon game loop. You design, wire, and manage a living office & warehouse network on an isometric 32x32 grid.',
    highlightItems: [
      { label: 'Tycoon Revenue', desc: 'Connected devices generate continuous cash ($/s) based on network uptime and latency.' },
      { label: 'Cisco Principles', desc: 'VLAN segmentation, DHCP subnets, Wi-Fi 6 AP rings, and Firewall ACLs.' },
      { label: 'SLA Uptime', desc: 'Keep packet delivery above 99.0% to pass campaign scenarios.' },
    ],
    tip: 'Tip: Click and drag to pan the isometric camera. Scroll or pinch with two fingers to zoom.',
  },
  {
    title: 'The Infrastructure Backbone',
    badge: 'Step 2 of 5 • Core Routing',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    icon: '🌐',
    content:
      'Every robust network begins with an ISP WAN Gateway and hierarchical core layers to ensure redundancy and security.',
    highlightItems: [
      { label: 'WAN Fiber Gateway', desc: 'Uplink to the global internet. All end devices must reach this gateway to generate revenue.' },
      { label: 'Next-Gen Firewall', desc: 'Stateful packet inspection. Drops DDoS SYN floods and blocks unauthorized port scans.' },
      { label: 'Cisco Core L3 Router', desc: 'Performs Inter-VLAN routing, OSPF forwarding, and NAT translation.' },
    ],
    tip: 'Wire WAN Gateway -> Firewall -> Core Router using Fiber or Cat6 patch cables.',
  },
  {
    title: 'Distribution: Switches & Wi-Fi 6 APs',
    badge: 'Step 3 of 5 • Switching & Wireless',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: '⚡',
    content:
      'To connect dozens of endpoints, deploy Managed Cisco Catalyst Switches and Wi-Fi 6 Access Points across the facility floor.',
    highlightItems: [
      { label: 'Catalyst L2/L3 Switch', desc: 'Provides 24 high-speed 10GbE ports with 802.1Q trunking to eliminate bottlenecks.' },
      { label: 'Wi-Fi 6 Access Point', desc: 'Projects a 7-tile circular wireless coverage ring on the floor for mobile laptops and robots.' },
      { label: '1U Blade Server & DB', desc: 'Hosts web applications and databases. Generates high internal traffic and SQL queries.' },
    ],
    tip: 'Connect Access Points to the Catalyst Switch. Any wireless device inside the cyan AP circle links automatically!',
  },
  {
    title: 'End Devices & The Productivity Loop',
    badge: 'Step 4 of 5 • Tycoon Economy',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: '🤖',
    content:
      'Office workers and warehouse robots rely on seamless network connectivity to complete their daily operations.',
    highlightItems: [
      { label: 'Workstation PC & Laptop', desc: 'Data VLAN 10. Generates $20-$25/s when connected to the internet gateway.' },
      { label: 'Cisco VoIP IP Phone', desc: 'Voice VLAN 20 with QoS. Generates $12/s for continuous crystal-clear voice calls.' },
      { label: 'Warehouse AGV Robot', desc: 'IoT VLAN 30. Generates $45/s! If network drops or lag spikes, robots halt immediately.' },
    ],
    tip: 'If productivity drops to 0%, check if patch cables were severed or if an intermediate switch is overflowing.',
  },
  {
    title: 'VLANs, ACLs & Chaos Engineering',
    badge: 'Step 5 of 5 • Enterprise Security',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    icon: '🛡️',
    content:
      'Master professional Cisco configuration using the Node Inspector and test your resilience using Chaos Monkey.',
    highlightItems: [
      { label: 'VLAN Tagging', desc: 'Isolate sensitive database clusters on VLAN 50 away from guest clients.' },
      { label: 'Firewall ACL Rules', desc: 'Create ALLOW and DROP rules by protocol (HTTP, HTTPS, SQL, SSH, DDOS).' },
      { label: 'Chaos Monkey', desc: 'Sever random cables, simulate kernel panics, or inject 100G DDoS waves to test failover.' },
    ],
    tip: 'You are ready to build! Choose Free Sandbox or play through the 4 structured Campaign Levels.',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  const handleNext = () => {
    AudioManager.playClick(900);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    AudioManager.playClick(750);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    AudioManager.playVictory();
    try {
      localStorage.setItem('isopacket_tutorial_seen', 'true');
    } catch {
      // Ignore localStorage restrictions
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0c111c] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{step.icon}</span>
            <div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${step.badgeColor}`}>
                {step.badge}
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide mt-0.5">{step.title}</h2>
            </div>
          </div>
          <button
            onClick={() => {
              AudioManager.playClick(700);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-300">
          <p className="text-slate-200 leading-relaxed font-sans">{step.content}</p>

          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {step.highlightItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#080d16] border border-slate-800/80 rounded-xl flex flex-col gap-0.5 hover:border-cyan-500/30 transition-colors"
              >
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {item.label}
                </span>
                <span className="text-xs text-slate-400 font-sans">{item.desc}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-xs text-cyan-200 flex items-center gap-2.5 font-sans">
            <span className="text-cyan-400 font-bold">💡</span>
            <span>{step.tip}</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  AudioManager.playClick(800);
                  setCurrentStep(i);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  i === currentStep ? 'w-6 bg-cyan-400' : 'bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{currentStep === STEPS.length - 1 ? 'Start Playing' : 'Next'}</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
