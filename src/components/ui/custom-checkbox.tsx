import { Check, Minus } from "lucide-react";
import classNames from "classnames";

interface CustomCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
}

export const CustomCheckbox = ({
  checked,
  indeterminate,
  onChange,
  className,
}: CustomCheckboxProps) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={classNames(
        "w-3 h-3 rounded-sm cursor-pointer flex items-center justify-center transition-colors",
        {
          "bg-blue-500": checked || indeterminate,
          "bg-gray-800 border border-gray-500": !checked && !indeterminate,
        },
        className
      )}
    >
      {checked && <Check size={12} className="text-white" />}
      {indeterminate && <Minus size={10} className="text-white" />}
    </div>
  );
};
