"use client";

import SelectMenu from "@/components/SelectMenu";
import { AI_MODELS } from "@/lib/ai/models";
import { useAssistant } from "@/components/assistant/AssistantProvider";

// Tính 1 lần ở module scope — AI_MODELS tĩnh, không cần map lại mỗi render.
const MODEL_OPTIONS = AI_MODELS.map((m) => ({ value: m.id, label: m.label }));

export default function ModelPicker({ placement = "down" }: { placement?: "down" | "up" }) {
  const { model, setModel } = useAssistant();
  return (
    <div className="w-full">
      <SelectMenu
        name="assistant-model"
        value={model}
        onChange={setModel}
        options={MODEL_OPTIONS}
        placement={placement}
      />
    </div>
  );
}
