// src/components/dashboard/BillUploadForm.tsx
'use client';

import { useState } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { extractBillData, validateBillData, type BillData } from '@/lib/bill-reader-agent';
import { supabase } from '@/lib/supabase';

interface BillUploadFormProps {
  supplierId: string;
  supplierName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BillUploadForm({
  supplierId,
  supplierName,
  onSuccess,
  onCancel,
}: BillUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [billData, setBillData] = useState<Partial<BillData>>({
    supplierName,
    billingPeriod: '',
    maxLoadKwh: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      // If AI extraction is enabled, process file
      if (useAI) {
        const extracted = extractBillData(selectedFile, true);
        if (extracted) {
          setBillData(extracted);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate
      const validation = validateBillData(billData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        setLoading(false);
        return;
      }

      // Update supplier in database
      const { error: updateError } = await supabase
        .from('suppliers')
        .update({
          bill_max_load_kwh: billData.maxLoadKwh,
        })
        .eq('id', supplierId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bill data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-500" />
            Upload Electricity Bill
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          {supplierName}
        </p>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-green-500/20 rounded-full p-3 mb-3">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-white font-semibold">Bill Updated Successfully!</p>
            <p className="text-sm text-slate-400 mt-1">Closing...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Upload Bill PDF (Optional)
              </label>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-400">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    PDF, JPG, PNG up to 10MB
                  </span>
                </label>
              </div>
            </div>

            {/* AI Extraction Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-ai"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="w-4 h-4 text-emerald-500 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="use-ai" className="text-sm text-slate-300">
                Use AI to extract data (Demo Mode)
              </label>
            </div>

            {/* Billing Period */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Billing Period *
              </label>
              <input
                type="text"
                value={billData.billingPeriod || ''}
                onChange={(e) => setBillData({ ...billData, billingPeriod: e.target.value })}
                placeholder="e.g., January 2026"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Max Load */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Maximum Allowed Load (kWh) *
              </label>
              <input
                type="number"
                value={billData.maxLoadKwh || ''}
                onChange={(e) => setBillData({ ...billData, maxLoadKwh: Number(e.target.value) })}
                placeholder="e.g., 350"
                min="0"
                step="0.01"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Bill'}
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-slate-500 mt-4 text-center">
          💡 In production, we'll use OCR/AI to automatically extract bill data
        </p>
      </div>
    </div>
  );
}
