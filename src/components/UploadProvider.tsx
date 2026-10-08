"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence } from "motion/react";
import type { SectionType } from "@/lib/constants";
import { UploadModal } from "@/components/UploadModal";

type OpenOptions = {
  year?: number;
  type?: SectionType;
};

type UploadContextValue = {
  openUpload: (options?: OpenOptions) => void;
};

const UploadContext = createContext<UploadContextValue | null>(null);

type Props = {
  defaultYear?: number;
  children: ReactNode;
};

export function UploadProvider({ defaultYear = 2024, children }: Props) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(defaultYear);
  const [type, setType] = useState<SectionType>("vocab");

  const openUpload = useCallback(
    (options?: OpenOptions) => {
      setYear(options?.year ?? defaultYear);
      setType(options?.type ?? "vocab");
      setOpen(true);
    },
    [defaultYear],
  );

  const value = useMemo(() => ({ openUpload }), [openUpload]);

  return (
    <UploadContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {open ? (
          <UploadModal
            key="upload-modal"
            defaultYear={year}
            defaultType={type}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) {
    throw new Error("useUpload must be used within UploadProvider");
  }
  return ctx;
}
