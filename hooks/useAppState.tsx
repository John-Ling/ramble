import { create } from "zustand";
import { User } from "firebase/auth";

interface AppState {
  user: User | null
  authenticated: boolean
  signIn: () => void
  signOut: () => void
}

export const useAppState = create<AppState>()((set) => ({
  user: null,
  authenticated: false,
  signIn: () => set((state) => ({user: state.user, authenticated: state.authenticated})),
  signOut: () => set(() => ({user: null, authenticated: false})),
}))