import { useState } from "react";
import { Copy } from "lucide-react";
import { FileTreeNode, TreeOption } from "../types";
import { useExport } from "../hooks/use-export";

export const Export = ({
  selectedFiles,
  workspacePath,
  onClose,
}: {
  selectedFiles: FileTreeNode[];
  workspacePath: string;
  onClose: () => void;
}) => {
  const [treeOption, setTreeOption] = useState<TreeOption>("include");
  const { status, copyExportToClipboard } = useExport({
    selectedFiles,
    workspacePath,
  });

  const handleCopy = async () => {
    await copyExportToClipboard(treeOption);
  };

  return (
    <div className="w-full h-full flex flex-col p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Export Options</h2>
        <button onClick={onClose} className="p-2 rounded hover:bg-gray-700">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">File Tree Options</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="treeOption"
                value="include"
                checked={treeOption === "include"}
                onChange={() => setTreeOption("include")}
                className="form-radio text-blue-500"
              />
              <span>Include full file tree</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="treeOption"
                value="include-only-selected"
                checked={treeOption === "include-only-selected"}
                onChange={() => setTreeOption("include-only-selected")}
                className="form-radio text-blue-500"
              />
              <span>Include only selected files in tree</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="treeOption"
                value="do-not-include"
                checked={treeOption === "do-not-include"}
                onChange={() => setTreeOption("do-not-include")}
                className="form-radio text-blue-500"
              />
              <span>Do not include file tree</span>
            </label>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleCopy}
            disabled={status === "copying"}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50"
          >
            <Copy size={16} />
            <span>
              {status === "copying"
                ? "Copying..."
                : status === "success"
                ? "Copied!"
                : "Copy to Clipboard"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
