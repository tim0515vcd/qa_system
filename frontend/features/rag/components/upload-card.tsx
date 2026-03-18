"use client";

import { Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  uploading: boolean;
  ingesting: boolean;
  message: string | null;
  error: string | null;
  onSubmit: (file: File) => void;
};

export function UploadCard({
  uploading,
  ingesting,
  message,
  error,
  onSubmit,
}: Props) {
  const [file, setFile] = useState<File | null>(null);

  const loading = uploading || ingesting;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">文件上傳與 Ingest</CardTitle>
        <CardDescription>
          呼叫 <code>/api/v1/documents/upload</code> 與 <code>/api/v1/documents/:id/ingest</code>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="document-file">文件檔案</Label>
          <Input
            id="document-file"
            type="file"
            accept=".md,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-slate-500">
            目前後端 ingest 只支援 markdown，建議先上傳 .md / .txt。
          </p>
        </div>

        <Button
          className="w-full rounded-2xl"
          disabled={!file || loading}
          onClick={() => file && onSubmit(file)}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          上傳並執行 ingest
        </Button>

        {message && (
          <div className="rounded-xl border bg-white p-3 text-sm text-slate-600">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}