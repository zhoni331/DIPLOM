import { Star } from "lucide-react";

interface Props {
  rating: number;
  onChange?: (r: number) => void;
  size?: number;
}

export default function StarRating({ rating, onChange, size = 20 }: Props) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            size={size}
            className={star <= rating ? "fill-secondary text-secondary" : "text-muted-foreground/30"}
          />
        </button>
      ))}
    </div>
  );
}
