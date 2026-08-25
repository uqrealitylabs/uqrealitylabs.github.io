const SEGMENT_COUNT = 20;
const SEGMENTS = Array.from({ length: SEGMENT_COUNT }, (_, i) => `seg-${i}`);

export function LoadingExperience({
  hidden,
  label,
  progress,
}: {
  hidden: boolean;
  label: string;
  progress: number;
}) {
  if (hidden) return null;

  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const filled = Math.round((pct / 100) * SEGMENT_COUNT);

  return (
    <div
      className="loading-experience"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className="loading-experience__panel">
        <div className="loading-experience__meta">
          <span>{label}</span>
          <span aria-hidden="true">{pct}%</span>
        </div>
        <div className="loading-experience__track" aria-hidden="true">
          {SEGMENTS.map((id, i) => (
            <span
              key={id}
              className={
                i < filled
                  ? "loading-experience__seg is-on"
                  : "loading-experience__seg"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
