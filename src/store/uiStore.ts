import { create } from 'zustand'

interface UIState {
  viewMode: 'list' | 'kanban'
  setViewMode: (mode: 'list' | 'kanban') => void
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode })
}))
