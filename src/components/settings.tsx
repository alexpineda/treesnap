import { useState } from "react";
import { X } from "lucide-react";
import { TreeOption } from "../types";
import { useLicense } from "../hooks/use-license";
import { LicenseArea } from "./license/license-area";

export const Settings = ({ onClose }: { onClose: () => void }) => {
  const [treeOption, setTreeOption] = useState<TreeOption>("include");
  const [showActivationForm, setShowActivationForm] = useState(false);
  const license = useLicense();

  return (
    <div className="flex flex-col p-4 text-white shadow-lg items-center justify-center h-full w-full gap-8">
      <div className="flex justify-between items-center min-w-xl max-w-2xl border-b-1  border-gray-600 rounded-lg py-1">
        <h2 className="font-medium text-white">Application Settings</h2>
      </div>

      <div className="space-y-4 min-w-xl max-w-2xl">
        <div>
          <h3 className="text-sm font-medium mb-2 text-gray-300">
            File Tree Options
          </h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer text-gray-300">
              <input
                type="radio"
                name="treeOption"
                value="include"
                checked={treeOption === "include"}
                onChange={() => setTreeOption("include")}
                className="form-radio text-blue-500 bg-gray-700 border-gray-600"
              />
              <span>Include full file tree</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-gray-300">
              <input
                type="radio"
                name="treeOption"
                value="include-only-selected"
                checked={treeOption === "include-only-selected"}
                onChange={() => setTreeOption("include-only-selected")}
                className="form-radio text-blue-500 bg-gray-700 border-gray-600"
              />
              <span>Include only selected files in tree</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-gray-300">
              <input
                type="radio"
                name="treeOption"
                value="do-not-include"
                checked={treeOption === "do-not-include"}
                onChange={() => setTreeOption("do-not-include")}
                className="form-radio text-blue-500 bg-gray-700 border-gray-600"
              />
              <span>Do not include file tree</span>
            </label>
          </div>
        </div>

        {license.localLicenseState?.status === "expired" && (
          <p>The application license has expired.</p>
        )}

        {license.localLicenseState?.status === "inactive" &&
          !showActivationForm && (
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
              onClick={() => setShowActivationForm(true)}
            >
              Activate License
            </button>
          )}

        {showActivationForm && <LicenseArea showActivationUnderLimit={true} />}

        <div className="pt-4 flex gap-4">
          <button
            onClick={onClose}
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50 border border-gray-600"
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
