"use client";

import { useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultUploadProps {
  bookingId: string;
  existingFileName?: string | null;
  onUploaded?: (fileName: string) => void;
}

export function ResultUpload({ bookingId, existingFileName, onUploaded }: ResultUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("booking_id", bookingId);

      const res = await fetch("/api/admin/upload-result", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Could not upload file.");

      onUploaded?.(data.file_name ?? file.name);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload file.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-error">
          {error}
        </div>
      )}

      {existingFileName && !file && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3.5 py-2.5 text-sm text-text-primary">
          <FileText className="h-4 w-4 text-text-secondary" />
          {existingFileName}
        </div>
      )}

      <label
        htmlFor="result-file"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center transition hover:border-sky-300 hover:bg-primary-light/40"
      >
        <Upload className="h-5 w-5 text-text-secondary" />
        <span className="text-sm text-text-secondary">
          {file ? file.name : "Click to upload a PDF or MD file"}
        </span>
        <input
          id="result-file"
          type="file"
          accept=".pdf,.md,text/markdown,application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : existingFileName ? (
          "Re-upload Result"
        ) : (
          "Upload Result"
        )}
      </Button>
    </div>
  );
}
