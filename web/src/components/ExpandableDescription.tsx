import { useState } from "react";

interface Props {
  text: string;
  maxLength?: number;
}

export default function ExpandableDescription({ text, maxLength = 80 }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= maxLength) {
    return <div className="text-[11px] font-normal text-[var(--text-secondary)] italic mt-1">{text}</div>;
  }

  return (
    <div className="text-[11px] font-normal text-[var(--text-secondary)] mt-1">
      <span className="italic">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }}
        className="ml-2 text-[var(--accent)] hover:underline font-medium focus:outline-none"
      >
        {isExpanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
