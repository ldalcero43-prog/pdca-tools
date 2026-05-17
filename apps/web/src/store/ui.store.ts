import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  currentProjectId: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleAiPanel: () => void;
  setCurrentProject: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  aiPanelOpen: false,
  currentProjectId: null,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setCurrentProject: (id) => set({ currentProjectId: id }),
}));
