import { create } from "zustand"
import { persist } from "zustand/middleware"

const useSidebarStore = create(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (isCollapsed) => set({ isCollapsed }),
    }),
    {
      name: "sidebar-storage",
    },
  ),
)

export default useSidebarStore
