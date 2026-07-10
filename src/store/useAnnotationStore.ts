import { create } from "zustand";

interface AnnotationStore {
  activeImageId: string | null;
  setActiveImageId: (id: string | null) => void;
}

export const useAnnotationStore = create<AnnotationStore>((set) => ({
  activeImageId: null,
  setActiveImageId: (id) => set({ activeImageId: id }),
}));
