import { X } from "lucide-react";

const COUPON = "TWEETSNAP"; // or env var

export const EmptyStateVscode = ({ showUpsell }: { showUpsell: boolean }) => (
  <div className="flex h-full flex-col items-center justify-center text-gray-400">
    {!showUpsell && (
      <h2 className="text-2xl font-semibold text-gray-200">Hi! Let's code!</h2>
    )}

    {showUpsell && (
      <h2 className="text-2xl font-semibold text-gray-200">Ready for more?</h2>
    )}

    <p className="mt-2 max-w-xs text-center">
      Welcome to TreeSnap - VSCode Edition!
    </p>

    {/* tweet-for-coupon */}
    {showUpsell && (
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Just flattened my repo in seconds with @GetTreeSnap 🤯 #AI #devtools — grab 10% off desktop with code ${COUPON}`
        )}`}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center gap-1 rounded-md border border-blue-500 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10"
      >
        <X size={16} />
        Tweet &amp; snag&nbsp;10% off desktop
      </a>
    )}

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
  </div>
);
