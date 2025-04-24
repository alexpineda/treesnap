// SizeCapBanner.tsx
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SizeCapBanner({
  files,
  sizeMB,
  show,
  onClose,
}: {
  files: number;
  sizeMB: number;
  show: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="fixed inset-x-0 top-2 z-50 flex justify-center px-4"
        >
          <div className="flex w-full max-w-2xl items-start gap-3 rounded-md bg-orange-500/20 px-4 py-2 text-sm text-orange-200 backdrop-blur-lg ring-1 ring-inset ring-orange-400/25 shadow-lg">
            <AlertTriangle className="mt-[2px] h-4 w-4 flex-none text-orange-300" />
            <p className="grow">
              Web cap hit&nbsp;—&nbsp;
              <span className="font-semibold text-orange-100">
                {files.toLocaleString()} files / {sizeMB} MB
              </span>
              .&nbsp;
              <a
                href="https://reposnap.io/desktop"
                className="underline underline-offset-2 hover:text-orange-50"
              >
                Grab the desktop app for unlimited size →
              </a>
            </p>
            <button
              onClick={onClose}
              className="rounded hover:bg-orange-500/20 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
