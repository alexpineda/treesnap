// src/components/TopBanner.tsx
export const TopBanner = () => (
  <a
    href="https://reposnap.io/download"
    target="_blank"
    rel="noreferrer"
    className="flex items-center justify-center gap-1
                 h-6 w-full text-xs font-medium
                 bg-gray-800/70 backdrop-blur
                 text-amber-300 hover:text-amber-200"
  >
    Unlimited repos & file-watching? →<span className="underline">Desktop</span>
  </a>
);
