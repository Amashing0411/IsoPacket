/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNotificationStore } from '../../state/useNotificationStore';

export const MicroToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let borderColor = 'border-cyan-500/50';
        let bgColor = 'bg-[#0f172a]/95';
        let textColor = 'text-cyan-300';
        let icon = '⚡';

        if (toast.type === 'warning') {
          borderColor = 'border-amber-500/60';
          textColor = 'text-amber-300';
          icon = '⚠️';
        } else if (toast.type === 'success') {
          borderColor = 'border-emerald-500/60';
          textColor = 'text-emerald-300';
          icon = '🛡️';
        } else if (toast.type === 'danger') {
          borderColor = 'border-rose-500/70';
          textColor = 'text-rose-300';
          icon = '💥';
        }

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-xl backdrop-blur-md text-xs font-mono font-medium tracking-wide transition-all animate-bounce-in cursor-pointer hover:opacity-80 ${borderColor} ${bgColor} ${textColor}`}
          >
            <span className="text-sm">{icon}</span>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
