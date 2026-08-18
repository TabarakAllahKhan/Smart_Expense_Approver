import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { uploadReceipt } from "../../lib/expenseApi";

type ReceiptUploadProps = {
  onUploadStart:()=>void
  onUploadComplete: (receiptUrl: string, receiptText?: string) => void;
  onClear: () => void;
};

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function ReceiptUpload({onUploadStart, onUploadComplete, onClear }: ReceiptUploadProps) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus("uploading");
    setErrorMessage(null);
    onUploadStart()

    try {
      const token = await getToken();
      const result = await uploadReceipt(file, token);
      setStatus("success");
      onUploadComplete(result.receiptUrl, result.receiptText);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function handleClear() {
    setStatus("idle");
    setFileName(null);
    setErrorMessage(null);
    onClear();
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Receipt (optional)
      </label>

      {status === "idle" && (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="text-sm text-gray-600"
        />
      )}

      {status === "uploading" && (
        <p className="text-sm text-gray-500">Uploading {fileName}…</p>
      )}

      {status === "success" && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-green-600">✓ {fileName} uploaded</p>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Remove
          </button>
        </div>
      )}

      {status === "error" && (
        <div>
          <p className="text-sm text-red-600">Upload failed: {errorMessage}</p>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-blue-600 hover:underline mt-1"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}