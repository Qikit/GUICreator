import { create } from 'zustand'

interface PrefsStore {
  showNums: boolean
  showRP: boolean
  toggleNums: () => void
  toggleRP: () => void
}

export const usePrefsStore = create<PrefsStore>((set) => ({
  showNums: false,
  showRP: true,
  toggleNums: () => set((s) => ({ showNums: !s.showNums })),
  toggleRP: () => set((s) => ({ showRP: !s.showRP })),
}))
