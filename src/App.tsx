/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IsometricViewport } from './components/canvas/IsometricViewport';
import { HeaderBar } from './components/ui/HeaderBar';
import { BottomToolbar } from './components/ui/BottomToolbar';
import { NodeInspector } from './components/ui/NodeInspector';
import { HelpModal } from './components/ui/HelpModal';
import { ScenarioModal } from './components/ui/ScenarioModal';
import { ChaosMonkeyDrawer } from './components/ui/ChaosMonkeyDrawer';
import { TutorialModal } from './components/ui/TutorialModal';
import { MainMenuOverlay } from './components/ui/MainMenuOverlay';
import { DefenseHUD } from './components/ui/DefenseHUD';
import { MicroToastContainer } from './components/ui/MicroToastContainer';
import { useGameModeStore } from './state/useGameModeStore';

export default function App() {
  const { currentMode } = useGameModeStore();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0f17] font-mono select-none">
      {/* 3D Isometric Viewport - always live, renders datacenter scene & defense battles */}
      <IsometricViewport />

      {/* Floating Micro-Toasts Container (Zero Clutter Notifications) */}
      <MicroToastContainer />

      {/* Mode 1: Main Menu & Title Screen */}
      {currentMode === 'title' && <MainMenuOverlay />}

      {/* Mode 2: Defend the Core (Tower Defense Mode) */}
      {currentMode === 'defense' && (
        <>
          <DefenseHUD />
          <NodeInspector />
        </>
      )}

      {/* Mode 3 & 4: Network Academy & Homelab Sandbox */}
      {(currentMode === 'academy' || currentMode === 'sandbox') && (
        <>
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

          {/* Interactive Step-by-Step Onboarding Tutorial */}
          <TutorialModal
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
          />
        </>
      )}
    </div>
  );
}
