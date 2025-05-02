import { useLicense } from "../../hooks/use-license";
import avatar from "../../assets/avatar-med.png";
import { openLink } from "@/platform";

export const UpgradeLicenseBanner = ({
  onActivate,
  onDismiss,
}: {
  onActivate: () => void;
  onDismiss: () => void;
}) => {
  const { workspaceLimitStatus } = useLicense();

  return (
    <div className="relative">
      <div
        className="flex flex-col items-center justify-center gap-4
                    bg-yellow-500/10 border border-yellow-600
                    text-yellow-300 text-sm rounded px-3 py-2 mb-3"
      >
        <button
          onClick={onDismiss}
          className="absolute -top-6 -right-6 w-5 h-5 flex items-center justify-center
                     rounded-full bg-yellow-700/50 hover:bg-yellow-600/70
                     text-yellow-200 text-xs font-bold"
          aria-label="Dismiss"
        >
          ✕
        </button>

        {workspaceLimitStatus?.used && workspaceLimitStatus?.used > 3 && (
          <div className="flex gap-4">
            <img src={avatar} className="w-10 h-10 rounded-full" alt="avatar" />
            <p className="text-sm max-w-md">
              Thanks for trying out TreeSnap! Please consider upgrading to a
              commercial license for unlimited workspaces and continued updates.
            </p>
            <a
              href="https://www.treesnap.app/alex"
              className="text-sm underline"
              onClick={(e) => {
                e.preventDefault();
                openLink("https://www.treesnap.app/alex");
              }}
            >
              - Alex
            </a>
          </div>
        )}
        <button
          className="bg-blue-600 hover:bg-blue-500 rounded px-3 py-1
                   text-white text-xs shrink-0"
          onClick={onActivate}
        >
          Activate license
        </button>
      </div>
    </div>
  );
};
