"use client";

import { Loader2, SendHorizonal, Settings2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  apiBase: string;
  query: string;
  limit: string;
  loading: boolean;
  onApiBaseChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onLimitChange: (value: string) => void;
  onSubmit: () => void;
};

export function QaFormCard({
  apiBase,
  query,
  limit,
  loading,
  onApiBaseChange,
  onQueryChange,
  onLimitChange,
  onSubmit,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="sticky bottom-0 z-10 border-t bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
      <div className="mx-auto max-w-4xl px-4 pb-4 pt-3 md:px-6">
        <div className="rounded-3xl border bg-white p-3 shadow-sm">
          <Textarea
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="輸入你的問題，例如：VPN 怎麼申請？"
            className="min-h-[96px] resize-none border-0 bg-transparent px-2 py-2 text-base shadow-none focus-visible:ring-0"
          />

          <div className="mt-3 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowAdvanced((prev) => !prev)}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                進階設定
              </Button>

              {showAdvanced && (
                <>
                  <div className="w-[120px]">
                    <Select value={limit} onValueChange={onLimitChange}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Citation 數量" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 citations</SelectItem>
                        <SelectItem value="5">5 citations</SelectItem>
                        <SelectItem value="8">8 citations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[240px] flex-1">
                    <Input
                      value={apiBase}
                      onChange={(e) => onApiBaseChange(e.target.value)}
                      placeholder="http://localhost:8000"
                      className="rounded-xl"
                    />
                  </div>
                </>
              )}
            </div>

            <Button
              className="rounded-2xl px-5"
              onClick={onSubmit}
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="mr-2 h-4 w-4" />
              )}
              送出
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}