/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

export interface MicroToast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  timestamp: number;
}

interface NotificationState {
  toasts: MicroToast[];
  addToast: (message: string, type?: 'info' | 'warning' | 'success' | 'danger') => void;
  removeToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],

  addToast: (message: string, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    set((state) => {
      // Keep at most 3 toasts to avoid clutter
      const filtered = state.toasts.slice(-2);
      return { toasts: [...filtered, { id, message, type, timestamp: Date.now() }] };
    });

    // Auto-dismiss after 3.8s
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3800);
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
