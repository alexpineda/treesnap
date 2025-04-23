import { WorkspaceLimitStatus } from "src/types";

export const WorkspaceLimitBanner = ({
  workspaceLimitStatus,
  onActivate,
}: {
  workspaceLimitStatus: WorkspaceLimitStatus;
  onActivate: () => void;
}) => {
  const used = workspaceLimitStatus.used;
  const limit = workspaceLimitStatus.limit;
  const remaining = limit - used;
  if (remaining > 1) return null; // only warn when 1 left or 0

  return (
    <div
      className="flex items-center justify-between gap-4
                    bg-yellow-500/10 border border-yellow-600
                    text-yellow-300 text-sm rounded px-3 py-2 mb-3"
    >
      <span>
        {remaining === 1
          ? `1 free workspace left 🚀`
          : remaining > 0
          ? `You've used ${used} of ${limit} free workspaces 🚀`
          : `Free workspace limit reached (${limit}) 🚀`}
      </span>
      <button
        className="bg-blue-600 hover:bg-blue-500 rounded px-3 py-1
                   text-white text-xs shrink-0"
        onClick={onActivate}
      >
        Activate license
      </button>
    </div>
  );
};
