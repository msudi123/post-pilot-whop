'use client';

import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, width = 480 }: ModalProps) {
  if (!open) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-5">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-[#DCE8FF] bg-white p-6 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        style={{ maxWidth: width }}
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{title}</span>
          <button
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent px-1 text-lg leading-none text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
