import { create } from "zustand";
import { User } from "firebase/auth";

interface AppState {
  user: User | null
  authenticated: boolean
  signIn: (user: User) => void
  signOut: () => void
}

export const useAppState = create<AppState>()((set) => ({
  user: null,
  authenticated: false,
  signIn: (user: User) => set(() => ({user: user, authenticated: true})),
  signOut: () => set(() => ({user: null, authenticated: false})),
}))