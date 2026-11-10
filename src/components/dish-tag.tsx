import { Leaf, Sparkles, Star, Tag } from "lucide-react";

const presets = new Map([
  ["Bán chạy", { tone: "popular", Icon: Star }],
  ["Nên thử", { tone: "recommended", Icon: Sparkles }],
  ["Món mới", { tone: "new", Icon: Leaf }],
]);

export function DishTag({ label }: { label: string }) {
  const { tone, Icon } = presets.get(label) ?? { tone: "custom", Icon: Tag };
  return <span className="dish-tag" data-tone={tone}>
    <Icon size={12} strokeWidth={2.3} aria-hidden="true" />
    <span>{label}</span>
  </span>;
}
