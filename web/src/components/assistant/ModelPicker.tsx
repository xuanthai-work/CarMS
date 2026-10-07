"use client";

import SelectMenu from "@/components/common/SelectMenu";
import { AI_MODELS } from "@/configs/ai";
import { useAssistant } from "@/states/assistant/AssistantProvider";

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
        variant="pill"
        leadingDotClassName="bg-indigo-500"
      />
    </div>
  );
}
