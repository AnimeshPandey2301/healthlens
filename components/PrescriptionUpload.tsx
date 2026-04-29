"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";

type Props = {
  phone: string;
  onUploaded: (url: string) => void;
};

export default function PrescriptionUpload({ phone, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(f.type)) {
      setError("Only JPG, PNG, WebP or PDF files are allowed");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }
    setError("");
    setFile(f);
    setUploaded(false);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("prescription", file);
      formData.append("phone", phone);
      const res = await fetch("/api/prescription/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
      setUploaded(true);
      onUploaded(data.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setUploaded(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-200 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
          <FileText size={18} className="text-orange-500" />
        </div>
        <div>
          <h3 className="font-semibold text-[#1E3A5F] text-sm">Upload Prescription</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Your cart contains Rx medicines. A valid doctor's prescription is required.
          </p>
        </div>
      </div>

      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
        >
          <Upload size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-600">Drop file here or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF • Max 5MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            {preview ? (
              <img src={preview} alt="Prescription" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
            ) : (
              <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                <FileText size={24} className="text-red-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              {uploaded && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 size={12} /> Prescription uploaded successfully
                </p>
              )}
            </div>
            <button onClick={clear} className="text-gray-400 hover:text-red-500 mt-0.5">
              <X size={16} />
            </button>
          </div>

          {!uploaded && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 size={14} className="animate-spin" /> Uploading…</>
              ) : (
                <><Upload size={14} /> Upload Prescription</>
              )}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
          <AlertTriangle size={12} /> {error}
        </p>
      )}

      <p className="text-[10px] text-gray-400 mt-3">
        Your prescription is stored securely and only used for order verification.
      </p>
    </div>
  );
}
