import React from "react";

export function Logo({ name }: { name: string }) {
  if (name === "Rubric")
    return (
      <img
        className="logo"
        src="/assets/brand/rubric.png"
        width="32"
        height="32"
        alt=""
        aria-hidden="true"
      />
    );
  const brand = ["Discord", "Instagram", "GitHub", "Git"].includes(name);
  if (brand || name === "UQ Reality Labs" || name === "Projects")
    return (
      <img
        className={`logo ${brand ? "logo--brand" : ""}`}
        src={`/assets/brand/${brand ? name.toLowerCase() : "mark"}.svg`}
        width="32"
        height="32"
        alt=""
        aria-hidden="true"
      />
    );
  return (
    <svg
      className="logo"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {name === "LinkedIn" ? (
        <>
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="2"
            fill="currentColor"
            stroke="none"
          />
          <path
            d="M6 10v8m5-8v8m0-5a3.5 3.5 0 0 1 7 0v5"
            stroke="var(--icon-cutout, #132330)"
            strokeWidth="2"
          />
          <circle
            cx="6"
            cy="6.5"
            r="1.3"
            fill="var(--icon-cutout, #132330)"
            stroke="none"
          />
        </>
      ) : name === "Email" ? (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m3 5 9 8 9-8" />
        </>
      ) : (
        <>
          <path d="M8 4h13v13H10M3 10a11 11 0 0 1 11 11M3 15a6 6 0 0 1 6 6" />
          <rect
            x="2"
            y="20"
            width="2"
            height="2"
            fill="currentColor"
            stroke="none"
          />
        </>
      )}
    </svg>
  );
}
