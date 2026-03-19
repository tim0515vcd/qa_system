"use client";

import { FileUp, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

export type RagView = "upload" | "qa";

type Props = {
  value: RagView;
  onChange: (value: RagView) => void;
};

export function RagNav({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-2xl border bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("upload")}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
          value === "upload"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100"
        )}
      >
        <FileUp className="h-4 w-4" />
        文件上傳
      </button>

      <button
        type="button"
        onClick={() => onChange("qa")}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
          value === "qa"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100"
        )}
      >
        <MessageSquareText className="h-4 w-4" />
        問答查詢
      </button>
    </div>
  );
}