import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TrackingPoint = { day: string; views: number; orders: number; interactions: number };

const series = [
  { key: "views", label: "Xem thực đơn", color: "#9c3529", dash: undefined },
  { key: "orders", label: "Bấm đặt món", color: "#276255", dash: "7 4" },
  { key: "interactions", label: "Khám phá", color: "#825414", dash: "2 5" },
] as const;

const numberFormat = new Intl.NumberFormat("vi-VN");
const axisNumber = new Intl.NumberFormat("vi-VN", { notation: "compact" });
const axisDate = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeZone: "UTC" });

export function TrackingTrend({ points }: { points: TrackingPoint[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [selectedIndex, setSelectedIndex] = useState(points.length - 1);
  const selected = points[selectedIndex];

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const peak = Math.max(0, ...points.flatMap((point) => series.map(({ key }) => point[key])));
  const scale = 10 ** Math.floor(Math.log10(Math.max(1, peak / 4)));
  const step = ([1, 2, 5, 10].find((value) => value * scale * 4 >= peak) ?? 10) * scale;
  const intervals = Math.max(1, Math.ceil(peak / step));
  const height = 212;
  const left = 44;
  const right = Math.max(left + 1, width - 18);
  const top = 12;
  const bottom = height - 28;
  const x = (index: number) => left + index / Math.max(1, points.length - 1) * (right - left);
  const y = (value: number) => bottom - value / (step * intervals) * (bottom - top);
  const labelCount = Math.min(points.length, Math.max(2, Math.floor((right - left) / 72) + 1), 7);
  const labelIndexes = Array.from({ length: labelCount }, (_, index) =>
    Math.round(index * (points.length - 1) / Math.max(1, labelCount - 1)));

  function selectAtPointer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = (event.clientX - bounds.left - left) / (right - left);
    setSelectedIndex(Math.max(0, Math.min(points.length - 1, Math.round(position * (points.length - 1)))));
  }

  return <section className="mt-5 rounded-xl border border-border bg-card p-3 sm:p-4" aria-labelledby="tracking-trend-title">
    <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
      <h4 id="tracking-trend-title" className="font-bold">Xu hướng theo ngày</h4>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Chú giải biểu đồ">
        {series.map(({ key, label, color, dash }) => <li key={key} className="flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden="true"><path d="M1 4H19" stroke={color} strokeWidth="2" strokeDasharray={dash} strokeLinecap="round" /></svg>
          {label}
        </li>)}
      </ul>
    </div>
    <div ref={container} className="relative mt-3 min-w-0">
      <svg width="100%" height={height} aria-hidden="true" onPointerDown={selectAtPointer}
        onPointerMove={(event) => { if (event.pointerType === "mouse") selectAtPointer(event); }}>
        {Array.from({ length: intervals + 1 }, (_, index) => {
          const value = index * step;
          return <g key={value}>
            <line x1={left} x2={right} y1={y(value)} y2={y(value)} className="stroke-border" />
            <text x={left - 7} y={y(value)} dy="0.35em" textAnchor="end" className="fill-muted-foreground text-[11px]">
              {value >= 10_000 ? axisNumber.format(value) : numberFormat.format(value)}
            </text>
          </g>;
        })}
        {labelIndexes.map((index) => <text key={index} x={x(index)} y={height - 8}
          textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
          className="fill-muted-foreground text-[11px]">{axisDate.format(new Date(points[index].day))}</text>)}
        {peak > 0 && <>
          <line x1={x(selectedIndex)} x2={x(selectedIndex)} y1={top} y2={bottom} className="stroke-muted-foreground" strokeDasharray="3 4" />
          {series.map(({ key, color, dash }) => <g key={key}>
            <polyline points={points.map((point, index) => `${x(index)},${y(point[key])}`).join(" ")}
              fill="none" stroke={color} strokeWidth="2" strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={x(selectedIndex)} cy={y(selected[key])} r="3" fill={color} className="stroke-card" strokeWidth="1" />
          </g>)}
        </>}
      </svg>
      {!peak && <p className="pointer-events-none absolute inset-0 grid place-items-center px-9 pb-6 text-center text-sm text-muted-foreground">
        Chưa có hoạt động trong khoảng thời gian này.
      </p>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Ngày trước" disabled={selectedIndex === 0}
          onClick={() => setSelectedIndex((index) => index - 1)}><ChevronLeft size={16} aria-hidden="true" /></Button>
        <p className="text-sm font-bold tabular-nums">{fullDate.format(new Date(selected.day))}</p>
        <Button variant="ghost" size="icon" aria-label="Ngày sau" disabled={selectedIndex === points.length - 1}
          onClick={() => setSelectedIndex((index) => index + 1)}><ChevronRight size={16} aria-hidden="true" /></Button>
      </div>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
        {series.map(({ key, label, color }) => <div key={key} className="flex items-baseline gap-1.5">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-bold" style={{ color }}>{numberFormat.format(selected[key])}</dd>
        </div>)}
      </dl>
    </div>
  </section>;
}
