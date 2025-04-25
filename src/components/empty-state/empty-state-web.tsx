import { X } from "lucide-react";

const COUPON = "TWEETSNAP"; // or env var

export const EmptyStateWeb = ({ showUpsell }: { showUpsell: boolean }) => (
  <div className="flex h-full flex-col items-center justify-center text-gray-400">
    {/* hero */}
    <a href="https://reposnap.io" target="_blank" rel="noreferrer">
      <img
        src="/logo.svg"
        alt="RepoSnap"
        className="w-16 h-16 mb-4 hover:opacity-80"
      />
    </a>
    <h2 className="text-2xl font-semibold text-gray-200">
      Welcome to RepoSnap Web
    </h2>
    <p className="mt-2 max-w-xs text-center">
      Flatten your repo &nbsp;→&nbsp; copy GPT-ready context in seconds.
    </p>

    {/* quick-start */}
    <div className="mt-6 w-72 rounded-xl border border-gray-700 p-6">
      <h3 className="mb-2 text-sm uppercase tracking-wide text-gray-500">
        Quick start
      </h3>
      <ol className="list-decimal space-y-1 pl-4 text-sm">
        <li>
          Click <strong>Open Folder</strong> (sidebar)
        </li>
        <li>Select your repo root</li>
        <li>
          Select files → <kbd>Export → GPT</kbd>
        </li>
      </ol>
    </div>

    {/* feedback */}
    {showUpsell && (
      <a
        href="https://visualdevlabs.featurebase.app/"
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center gap-1 text-sm text-blue-400 hover:underline"
      >
        Leave feedback on Featurebase
      </a>
    )}

    {/* tweet-for-coupon */}
    {showUpsell && (
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Just flattened my repo in seconds with @RepoSnapApp 🤯 #AI #devtools — grab 10% off desktop with code ${COUPON}`
        )}`}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center gap-1 rounded-md border border-blue-500 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10"
      >
        <X size={16} />
        Tweet &amp; snag&nbsp;10% off desktop
      </a>
    )}
  </div>
);
