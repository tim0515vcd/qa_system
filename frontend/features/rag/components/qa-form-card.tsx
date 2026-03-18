"use client";

import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">RAG QA Demo</CardTitle>
        <CardDescription>
          呼叫 <code>/api/v1/qa/ask</code>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="api-base">API Base URL</Label>
          <Input
            id="api-base"
            value={apiBase}
            onChange={(e) => onApiBaseChange(e.target.value)}
            placeholder="http://localhost:8000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="query">問題</Label>
          <Textarea
            id="query"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="例如：VPN 怎麼申請？"
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit">Citation 數量</Label>
          <Select value={limit} onValueChange={onLimitChange}>
            <SelectTrigger id="limit">
              <SelectValue placeholder="選擇數量" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="8">8</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full rounded-2xl"
          onClick={onSubmit}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          送出 QA 查詢
        </Button>
      </CardContent>
    </Card>
  );
}