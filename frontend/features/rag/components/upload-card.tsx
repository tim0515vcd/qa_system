"use client";

import {
  CheckCircle2,
  FileText,
  Filter,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UploadQueueItem } from "../types/document";

type Props = {
  uploading: boolean;
  ingesting: boolean;
  message: string | null;
  error: string | null;
  queue: UploadQueueItem[];
  selectedQueueId: string | null;
  onSelectQueueItem: (id: string) => void;
  onSubmit: (files: File[]) => void;
  onClearQueue: () => void;
};

type QueueFilter = "all" | "failed";

export function UploadCard({
  uploading,
  ingesting,
  message,
  error,
  queue,
  selectedQueueId,
  onSelectQueueItem,
  onSubmit,
  onClearQueue,
}: Props) {
  const t = useTranslations("Upload");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<QueueFilter>("all");

  const loading = uploading || ingesting;

  function handlePickFiles(nextFiles: File[]) {
    if (!nextFiles.length) return;
    setFiles(nextFiles);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    handlePickFiles(Array.from(e.dataTransfer.files ?? []));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }

  const queueSummary = useMemo(() => {
    const success = queue.filter((item) => item.status === "success").length;
    const failed = queue.filter((item) => item.status === "error").length;
    const processing = queue.filter(
      (item) => item.status === "uploading" || item.status === "ingesting",
    ).length;
    const idle = queue.filter((item) => item.status === "idle").length;

    return {
      total: queue.length,
      success,
      failed,
      processing,
      idle,
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    if (filter === "failed") {
      return queue.filter((item) => item.status === "error");
    }
    return queue;
  }, [filter, queue]);

  return (
    <Card className="mx-auto w-full max-w-3xl rounded-3xl border shadow-sm">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-sm leading-7 text-slate-500">
          {t("description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <input
          ref={inputRef}
          type="file"
          accept=".md,.txt"
          multiple
          className="hidden"
          onChange={(e) => handlePickFiles(Array.from(e.target.files ?? []))}
        />

        <div className="space-y-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition",
              dragging
                ? "border-slate-900 bg-slate-100"
                : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/70",
            )}
          >
            <div
              className={cn(
                "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition",
                dragging
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700",
              )}
            >
              <Upload className="h-6 w-6" />
            </div>

            <div className="text-base font-medium text-slate-900">
              {t("dropzoneTitle")}
            </div>

            <div className="mt-2 text-sm leading-7 text-slate-500">
              {t("dropzoneDescription")}
            </div>

            <div className="mt-4">
              <span className="inline-flex rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                {t("browse")}
              </span>
            </div>
          </div>

          <p className="text-xs leading-6 text-slate-500">{t("hint")}</p>

          {!!files.length && (
            <div className="rounded-2xl border bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <div className="mb-3 font-medium">
                {t("selectedFiles", { count: files.length })}
              </div>

              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-start gap-3"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 truncate text-slate-600">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1 rounded-2xl py-6 text-base"
            disabled={!files.length || loading}
            onClick={() => files.length && onSubmit(files)}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {loading ? t("processing") : t("submitMultiple")}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={onClearQueue}
            disabled={!queue.length}
          >
            {t("clearQueue")}
          </Button>
        </div>

        {message && (
          <div className="rounded-2xl border bg-white p-4 text-sm leading-7 text-slate-600">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">
            {error}
          </div>
        )}

        {!!queue.length && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium text-slate-900">
                {t("queueTitle")}
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-xl border bg-white p-1 shadow-sm">
                <Button
                  type="button"
                  variant={filter === "all" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setFilter("all")}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {t("filters.all")}
                </Button>

                <Button
                  type="button"
                  variant={filter === "failed" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setFilter("failed")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t("filters.failedOnly")}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <SummaryCard
                label={t("summary.total")}
                value={queueSummary.total}
                tone="default"
              />
              <SummaryCard
                label={t("summary.success")}
                value={queueSummary.success}
                tone="success"
              />
              <SummaryCard
                label={t("summary.failed")}
                value={queueSummary.failed}
                tone="error"
              />
              <SummaryCard
                label={t("summary.processing")}
                value={queueSummary.processing + queueSummary.idle}
                tone="warning"
              />
            </div>

            {!filteredQueue.length ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">
                {t("emptyFilteredQueue")}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQueue.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectQueueItem(item.id)}
                    className={cn(
                      "w-full rounded-2xl border bg-white p-4 text-left text-sm transition",
                      selectedQueueId === item.id
                        ? "border-slate-900 ring-1 ring-slate-900"
                        : "hover:border-slate-400",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">
                          {item.fileName}
                        </div>

                        <div className="mt-2">
                          <StatusBadge
                            label={renderStatus(item.status, t)}
                            status={item.status}
                          />
                        </div>
                      </div>

                      <div className="shrink-0">
                        {item.status === "success" && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {(item.status === "uploading" ||
                          item.status === "ingesting") && (
                          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                        )}
                        {item.status === "error" && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>

                    {item.error && (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                        {item.error}
                      </div>
                    )}

                    {item.uploadResult && (
                      <div className="mt-3 text-xs text-slate-500">
                        document_id: {item.uploadResult.document_id}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "error" | "warning";
}) {
  const toneClassName = {
    default: "border-slate-200 bg-white text-slate-900",
    success: "border-green-200 bg-green-50 text-green-700",
    error: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className={cn("rounded-2xl border p-4", toneClassName)}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: UploadQueueItem["status"];
}) {
  const className = {
    idle: "border-slate-200 bg-slate-100 text-slate-700",
    uploading: "border-sky-200 bg-sky-50 text-sky-700",
    ingesting: "border-indigo-200 bg-indigo-50 text-indigo-700",
    success: "border-green-200 bg-green-50 text-green-700",
    error: "border-red-200 bg-red-50 text-red-700",
  }[status];

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

function renderStatus(
  status: UploadQueueItem["status"],
  t: ReturnType<typeof useTranslations<"Upload">>,
) {
  switch (status) {
    case "idle":
      return t("statuses.idle");
    case "uploading":
      return t("statuses.uploading");
    case "ingesting":
      return t("statuses.ingesting");
    case "success":
      return t("statuses.success");
    case "error":
      return t("statuses.error");
    default:
      return status;
  }
}