export function LoadingExperience({
  hidden,
  label,
}: {
  hidden: boolean;
  label: string;
}) {
  if (hidden) return null;

  return (
    <div className="loading-experience" role="status" aria-live="polite">
      <span className="loading-experience__orb" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
