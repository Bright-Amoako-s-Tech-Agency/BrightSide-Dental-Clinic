export default function KpiCard({
  number,
  label,
  value,
  description,
  progress,
}) {
  return (
    <div className="rounded-2xl bg-[#f1efe8] p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4d5752]">
          {label}
        </p>

        <span className="font-serif text-2xl italic text-[#c27632]">
          {number}
        </span>
      </div>

      <p className="mt-6 font-serif text-3xl text-[#10231f]">{value}</p>

      <p className="mt-2 text-sm leading-5 text-[#69706c]">{description}</p>

      {progress !== undefined && (
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#dfddd5]">
          <div
            className="h-full rounded-full bg-[#b84620]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
