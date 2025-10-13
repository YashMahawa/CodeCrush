"use client";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const models = [
    { value: "gemini-2.5-flash", label: "2.5 Flash" },
    { value: "gemini-2.5-pro", label: "2.5 Pro" },
  ];

  return (
    <select
      value={selectedModel}
      onChange={(e) => onModelChange(e.target.value)}
      className="bg-black/30 text-white px-3 py-1.5 rounded border border-neonMagenta/30 
                 focus:border-neonMagenta/50 focus:outline-none text-sm cursor-pointer
                 hover:border-neonMagenta/40 transition-colors"
    >
      {models.map((model) => (
        <option key={model.value} value={model.value} className="bg-gray-900">
          {model.label}
        </option>
      ))}
    </select>
  );
}
