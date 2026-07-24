"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_MODEL_ID, resolveModelId } from "@/lib/ai/models";
import { STORAGE_KEYS, loadJSON, saveJSON } from "@/lib/ai/storage";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  model: string;
  setModel: (id: string) => void;
  instructions: string;
  setInstructions: (s: string) => void;
};

const AssistantCtx = createContext<Ctx | null>(null);

export function useAssistant(): Ctx {
  const ctx = useContext(AssistantCtx);
  if (!ctx) throw new Error("useAssistant phải nằm trong <AssistantProvider>");
  return ctx;
}

export default function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [model, setModelState] = useState(DEFAULT_MODEL_ID);
  const [instructions, setInstructionsState] = useState("");

  // Nạp từ localStorage sau mount (tránh lệch SSR).
  useEffect(() => {
    setModelState(resolveModelId(loadJSON<string>(STORAGE_KEYS.model, DEFAULT_MODEL_ID)));
    setInstructionsState(loadJSON<string>(STORAGE_KEYS.instructions, ""));
  }, []);

  const setModel = (id: string) => {
    const m = resolveModelId(id);
    setModelState(m);
    saveJSON(STORAGE_KEYS.model, m);
  };
  const setInstructions = (s: string) => {
    setInstructionsState(s);
    saveJSON(STORAGE_KEYS.instructions, s);
  };

  return (
    <AssistantCtx.Provider value={{ open, setOpen, model, setModel, instructions, setInstructions }}>
      {children}
    </AssistantCtx.Provider>
  );
}
