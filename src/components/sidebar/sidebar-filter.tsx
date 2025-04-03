import { Settings } from "lucide-react";

export const SidebarFilter = () => {
  return (
    <div className="relative">
      <input
        placeholder="Ignore Filter"
        className="w-full px-2 py-1 pr-8 rounded bg-gray-700 border border-gray-600 text-xs"
      />
      <Settings
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
};
