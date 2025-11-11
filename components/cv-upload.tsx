"use client";

import type React from "react";

import { useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CVUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function CVUpload({ file, onFileChange }: CVUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type === "application/pdf") {
        onFileChange(droppedFile);
      }
    },
    [onFileChange]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <div>
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 transition-colors hover:border-primary hover:bg-muted/50"
        >
          <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-sm font-medium text-foreground">
            Drop your CV here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">PDF files only</p>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="secondary" className="mt-4" asChild>
              <span>Select File</span>
            </Button>
          </label>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFileChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
