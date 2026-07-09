import { create } from "zustand";
import { getInitialLocale, type Locale } from "../i18n/runtime";

export type JoinUsMode =
  | "idle"
  | "near"
  | "rubrics-hover"
  | "rubrics-click"
  | "sad";

type UiState = {
  locale: Locale;
  joinUsMode: JoinUsMode;
  setLocale: (locale: Locale) => void;
  setJoinUsMode: (mode: JoinUsMode) => void;
};

export const useUiStore = create<UiState>((set) => ({
  locale: getInitialLocale(),
  joinUsMode: "idle",
  setLocale: (locale) => set({ locale }),
  setJoinUsMode: (joinUsMode) => set({ joinUsMode }),
}));
