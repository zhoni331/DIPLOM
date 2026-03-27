import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  score: number;
  breakdown?: { rating_score?: number; volume_score?: number; evidence_score?: number; recency_score?: number };
  size?: "sm" | "md" | "lg";
}

export default function TrustScoreBadge({ score, breakdown, size = "md" }: Props) {
  const getColor = () => {
    if (score >= 75) return "text-success";
    if (score >= 50) return "text-secondary";
    if (score >= 25) return "text-warning";
    return "text-destructive";
  };

  const sizeClasses = {
    sm: "text-sm w-10 h-10",
    md: "text-lg w-14 h-14",
    lg: "text-2xl w-20 h-20",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`${sizeClasses[size]} rounded-full border-2 border-current ${getColor()} flex items-center justify-center font-heading font-bold cursor-help`}>
          {Math.round(score)}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-semibold mb-2">Trust Score Breakdown</p>
        {breakdown ? (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4"><span>Rating:</span><span>{breakdown.rating_score?.toFixed(1)}/40</span></div>
            <div className="flex justify-between gap-4"><span>Volume:</span><span>{breakdown.volume_score?.toFixed(1)}/25</span></div>
            <div className="flex justify-between gap-4"><span>Evidence:</span><span>{breakdown.evidence_score?.toFixed(1)}/20</span></div>
            <div className="flex justify-between gap-4"><span>Recency:</span><span>{breakdown.recency_score?.toFixed(1)}/15</span></div>
          </div>
        ) : <p className="text-xs">No data yet</p>}
      </TooltipContent>
    </Tooltip>
  );
}
