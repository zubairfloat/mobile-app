"use client";
import { Minus, Plus, Star } from "lucide-react";
export function Price({ price, old }: { price: number; old?: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <strong className="text-xl">${price.toFixed(2)}</strong>
      {old && (
        <span className="muted text-sm line-through">${old.toFixed(2)}</span>
      )}
    </div>
  );
}
export function Rating({
  value,
  reviews,
}: {
  value: number;
  reviews?: number;
}) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <Star size={15} fill="#ffb423" strokeWidth={0} />
      <strong>{value.toFixed(1)}</strong>
      {reviews !== undefined && <span className="muted">({reviews})</span>}
    </div>
  );
}
export function QuantitySelector({
  value,
  onChange,
  disabled = false,
  max = Infinity,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--line)]">
      <button
        type="button"
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
        className="p-3"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus size={16} />
      </button>
      <span className="w-8 text-center font-bold">{value}</span>
      <button
        type="button"
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="p-3"
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card px-6 py-20 text-center">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-2xl">
        ✦
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="muted mt-2 mb-6">{text}</p>
      {action}
    </div>
  );
}
export function Skeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-3xl bg-slate-100" />
          <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-1/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
