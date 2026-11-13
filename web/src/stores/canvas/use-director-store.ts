import { create } from "zustand";
import type { CanvasNodeContext } from "@/types/canvas-plugin";

export const useDirectorStore = create<{ context: CanvasNodeContext | null; open: (context: CanvasNodeContext) => void; close: () => void }>((set) => ({
    context: null,
    open: (context) => set({ context }),
    close: () => set({ context: null }),
}));
