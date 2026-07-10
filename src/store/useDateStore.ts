import { create } from "zustand";

interface DateStore {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const today = new Date().toISOString().slice(0, 10);

export const useDateStore = create<DateStore>((set) => ({
  selectedDate: today,
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
