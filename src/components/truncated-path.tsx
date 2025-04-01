import { useState } from "react";

interface TruncatedPathProps {
  path: string;
}

export const TruncatedPath: React.FC<TruncatedPathProps> = ({ path }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <span
      className="text-sm break-all cursor-pointer hover:text-gray-300 transition-colors"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {path.length > 60 && !isExpanded ? "..." + path.slice(-60) : path}
    </span>
  );
};
