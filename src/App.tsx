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

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0f17] font-mono select-none">
      {/* 3D Isometric Viewport */}
      <IsometricViewport />

      {/* Cyberpunk Status Header */}
      <HeaderBar onShowHelp={() => setIsHelpOpen(true)} />

      {/* Selected Node Inspector Drawer */}
      <NodeInspector />

      {/* Collapsible Unified Bottom Toolbar */}
      <BottomToolbar />

      {/* Guide & Controls Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
