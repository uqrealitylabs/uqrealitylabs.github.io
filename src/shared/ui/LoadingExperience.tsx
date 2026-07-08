import { domAnimation, LazyMotion, m } from "motion/react";

export function LoadingExperience({
  hidden,
  label,
}: {
  hidden: boolean;
  label: string;
}) {
  if (hidden) return null;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="loading-experience"
        role="status"
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="loading-experience__orb" aria-hidden="true" />
        <span>{label}</span>
      </m.div>
    </LazyMotion>
  );
}
