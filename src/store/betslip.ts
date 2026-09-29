import { create } from "zustand";

export type BetSelection = {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: number;
};

type BetSlipStore = {
  selections: BetSelection[];
  addSelection: (selection: BetSelection) => void;
  removeSelection: (id: string) => void;
  clearSelections: () => void;
};

export const useBetSlipStore = create<BetSlipStore>((set) => ({
  selections: [],

  addSelection: (selection) =>
    set((state) => {
      const existing = state.selections.find(
        (item) => item.id === selection.id,
      );

      if (existing) {
        return state;
      }

      return {
        selections: [...state.selections, selection],
      };
    }),

  removeSelection: (id) =>
    set((state) => ({
      selections: state.selections.filter(
        (selection) => selection.id !== id,
      ),
    })),

  clearSelections: () =>
    set({
      selections: [],
    }),
}));