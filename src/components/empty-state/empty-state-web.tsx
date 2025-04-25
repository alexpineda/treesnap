import { X } from "lucide-react";

const COUPON = "TWEETSNAP"; // or env var

export const EmptyStateWeb = ({ showUpsell }: { showUpsell: boolean }) => (
  <div className="flex h-full flex-col items-center justify-center text-gray-400">
    {/* hero */}
    {/* <a href="https://treesnap.app" target="_blank" rel="noreferrer">
      <img
        src="/logo.svg"
        alt="TreeSnap"
        className="w-16 h-16 mb-4 hover:opacity-80"
      />
    </a> */}
    {!showUpsell && (
      <h2 className="text-2xl font-semibold text-gray-200">Hi! Let's code!</h2>
    )}

    {showUpsell && (
      <h2 className="text-2xl font-semibold text-gray-200">Ready for more?</h2>
    )}
    {/* <img
      src="/flow.png"
      alt="TreeSnap flow"
      className="w-64 rounded-2xl mt-6"
    /> */}
    <p className="mt-2 max-w-xs text-center">
      Try out the `nanoid` package for a demo.
    </p>

    {/* privacy statement */}
    {!showUpsell && (
      <div>
        <div className="mt-6 w-72 rounded-xl border border-green-700 p-6 text-center">
          <h3 className="mb-2 text-sm uppercase tracking-wide text-green-500">
            Your Privacy Matters
          </h3>
          <p className="text-sm text-gray-300">
            TreeSnap operates entirely locally. No session recording occurs, and
            your files never leave your machine. Your code remains completely
            private and safe.
          </p>
        </div>
        <div className="text-sm text-gray-400 mt-2 text-center">
          Visit{" "}
          <a href="https://www.treesnap.app" target="_blank" rel="noreferrer">
            treesnap.app
          </a>{" "}
          for more information
        </div>
      </div>
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
