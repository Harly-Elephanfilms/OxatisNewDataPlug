"use client";

import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

interface ProgressModalProps {
  open: boolean;
  title: string;
  current: number;
  total: number;
  errors?: string[];
  onClose?: () => void;
  done?: boolean;
}

export function ProgressModal({
  open,
  title,
  current,
  total,
  errors = [],
  onClose,
  done = false,
}: ProgressModalProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Modal open={open} onClose={done && onClose ? onClose : () => {}} title={title} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {!done && <Spinner />}
          {done && (
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="text-sm text-gray-600">
            {current} / {total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {errors.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-sm font-medium text-red-700">{errors.length} erreur(s) :</p>
            <ul className="text-xs text-red-600 list-disc pl-4 max-h-40 overflow-y-auto">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {done && onClose && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
