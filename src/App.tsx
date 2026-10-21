/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { IsometricViewport } from './components/canvas/IsometricViewport';
import { HeaderBar } from './components/ui/HeaderBar';
import { BottomToolbar } from './components/ui/BottomToolbar';
import { NodeInspector } from './components/ui/NodeInspector';
import { HelpModal } from './components/ui/HelpModal';
import { ScenarioModal } from './components/ui/ScenarioModal';
import { ChaosMonkeyDrawer } from './components/ui/ChaosMonkeyDrawer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { TutorialModal } from './components/ui/TutorialModal';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('isopacket_tutorial_seen');
      if (!seen) {
        setIsTutorialOpen(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0f17] font-mono select-none">
      {/* 3D Isometric Viewport */}
      <IsometricViewport />

      {/* Cyberpunk Tycoon Status Header */}
      <HeaderBar
        onShowHelp={() => setIsHelpOpen(true)}
        onShowTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Selected Node Inspector Drawer / Mobile Bottom Sheet */}
      <NodeInspector />

      {/* Collapsible Unified Bottom Toolbar */}
      <BottomToolbar />

      {/* Campaign Scenario Selection & Victory Modal */}
      <ScenarioModal />

      {/* Chaos Monkey Fault Injection Panel & Alerts */}
      <ChaosMonkeyDrawer />

      {/* Guide & Controls Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Interactive Step-by-Step Cisco Onboarding Tutorial */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* Animated Cyberpunk Boot Loading Screen */}
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
    </div>
  );
}
