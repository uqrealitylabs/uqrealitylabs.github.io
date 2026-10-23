import React, { useId } from "react";

export type ObjectKind =
  | "headset"
  | "projects"
  | "events"
  | "team"
  | "about"
  | "archive"
  | "sponsors";

export function LabPoster() {
  return (
    <div className="lab-poster" aria-hidden="true">
      {["campus", "australia"].map((place) => (
        <picture key={place}>
          <source
            media="(max-width: 720px)"
            srcSet={`/assets/world/${place}-mobile.webp`}
          />
          <img
            className={`poster-${place}`}
            src={`/assets/world/${place}.webp`}
            width="1280"
            height="889"
            alt=""
            fetchPriority={place === "campus" ? "high" : "auto"}
            loading={place === "campus" ? "eager" : "lazy"}
          />
        </picture>
      ))}
    </div>
  );
}

export function LabObject({
  kind,
  className = "",
}: {
  kind: ObjectKind;
  className?: string;
}) {
  const id = useId().replaceAll(":", "");
  const paint = (name: string) => `url(#${id}-${name})`;
  return (
    <svg
      className={`lab-object lab-object--${kind} ${className}`}
      viewBox="0 0 400 340"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-cream`} x2="0.8" y2="1">
          <stop stopColor="#fffbea" />
          <stop offset=".6" stopColor="#e9e4e2" />
          <stop offset="1" stopColor="#bab3d0" />
        </linearGradient>
        <linearGradient id={`${id}-purple`} x2=".8" y2="1">
          <stop stopColor="#c9b7ff" />
          <stop offset=".5" stopColor="#a392eb" />
          <stop offset="1" stopColor="#6a55b7" />
        </linearGradient>
        <linearGradient id={`${id}-orange`} x2=".6" y2="1">
          <stop stopColor="#ffc88c" />
          <stop offset=".6" stopColor="#f69351" />
          <stop offset="1" stopColor="#bd533e" />
        </linearGradient>
        <linearGradient id={`${id}-dark`} x2=".8" y2="1">
          <stop stopColor="#59526c" />
          <stop offset=".5" stopColor="#29243c" />
          <stop offset="1" stopColor="#171526" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x2="1" y2="1">
          <stop stopColor="#d7cdff" />
          <stop offset=".35" stopColor="#8378bd" />
          <stop offset=".6" stopColor="#2b304f" />
          <stop offset="1" stopColor="#121626" />
        </linearGradient>
      </defs>
      {kind === "headset" ? (
        <g transform="translate(5 18) rotate(-12 200 170)">
          <path
            d="M80 174C20 28 300-35 333 128"
            fill="none"
            stroke="#74629e"
            strokeWidth="38"
          />
          <path
            d="M80 164C33 37 285-24 323 123"
            fill="none"
            stroke={paint("purple")}
            strokeWidth="27"
          />
          <path d="M198 48l-5 98" stroke="#a191c9" strokeWidth="32" />
          <path d="M194 47l-5 98" stroke="#d1c4ef" strokeWidth="23" />
          <path
            d="M46 133Q49 112 75 104L316 100q36 0 43 34l10 91q0 35-32 41l-81 9q-16 1-22-13l-9-20-22 23q-8 10-23 9l-86-5q-31-3-35-30z"
            fill="#81758e"
          />
          <path
            d="M34 127q5-24 34-27l241-7q32 0 40 29l10 90q3 34-30 39l-78 10q-17 2-23-14l-8-18-21 22q-8 10-23 9l-88-7q-31-3-36-31z"
            fill={paint("cream")}
            stroke="#f8f3f0"
            strokeWidth="2"
          />
          <path
            d="M48 135q3-20 25-21l229-7q24-1 30 23l9 72q3 24-20 28l-69 9q-16 1-22-12l-9-19-24 25q-7 7-21 7l-81-6q-27-2-30-26z"
            fill={paint("dark")}
          />
          <ellipse
            cx="119"
            cy="175"
            rx="39"
            ry="40"
            fill="#151323"
            stroke="#757083"
            strokeWidth="5"
          />
          <ellipse cx="119" cy="173" rx="29" ry="31" fill={paint("glass")} />
          <ellipse
            cx="273"
            cy="169"
            rx="38"
            ry="40"
            fill="#151323"
            stroke="#757083"
            strokeWidth="5"
          />
          <ellipse cx="273" cy="167" rx="29" ry="31" fill={paint("glass")} />
          <path
            d="M101 152q14-11 26-4M256 146q13-11 25-4"
            stroke="#e9dcff"
            strokeOpacity=".7"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="175" y="113" width="36" height="6" rx="3" fill="#b4a7ce" />
          <circle cx="193" cy="148" r="5" fill="#f5a96f" />
          <path d="M71 253l6 9m223-11l-2 12" stroke="#61556f" strokeWidth="7" />
        </g>
      ) : kind === "projects" ? (
        <g transform="rotate(-12 200 170)">
          <path d="M97 69l21-15h176l15 204-22 24H98z" fill="#bb593c" />
          <path
            d="M84 72q0-15 15-15h173q15 0 15 15v201H84z"
            fill={paint("orange")}
            stroke="#ffcc91"
            strokeWidth="2"
          />
          <path d="M109 57v22h151V57" fill="#e67d46" />
          <rect
            x="107"
            y="101"
            width="158"
            height="116"
            rx="6"
            fill="#fcf1c9"
          />
          <path d="M147 165l25-36 35 3 31 38-45 24z" fill="#6c57d6" />
          <path
            d="M172 129l11 34 24-31m-24 31l55 7m-55-7l10 31m-46-29l36-2"
            stroke="#bca5f9"
            strokeWidth="3"
            fill="none"
          />
          <path d="M119 117h19m-19 9h12" stroke="#a55b40" strokeWidth="3" />
          <rect x="120" y="239" width="125" height="34" rx="4" fill="#422e3e" />
          <path
            d="M136 245v24m15-24v24m15-24v24m15-24v24m15-24v24m15-24v24m15-24v24"
            stroke="#d5a55b"
            strokeWidth="7"
          />
        </g>
      ) : kind === "events" ? (
        <g transform="rotate(12 200 170)">
          <path d="M91 254l20-159h172l31 176H100z" fill="#8c72ba" />
          <path d="M87 85h201v171H87z" fill="#bbb0ce" />
          <rect
            x="77"
            y="73"
            width="201"
            height="177"
            rx="12"
            fill={paint("cream")}
            stroke="#fff8e9"
            strokeWidth="2"
          />
          <path
            d="M77 85q0-12 12-12h177q12 0 12 12v34H77z"
            fill={paint("orange")}
          />
          {[118, 155, 192, 229].map((x) => (
            <path
              key={x}
              d={`M${x} 58v31`}
              stroke="#4a3849"
              strokeWidth="10"
              strokeLinecap="round"
            />
          ))}
          <path
            d="M113 145h26v24h-26zm39 0h26v24h-26zm39 0h26v24h-26zm39 0h18v24h-18zm-117 40h26v24h-26zm39 0h26v24h-26zm39 0h26v24h-26z"
            fill="#c7bedb"
          />
          <circle cx="165" cy="157" r="20" fill="#6450d6" />
          <path
            d="M157 157l6 6 12-14"
            stroke="#fff7de"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M109 226h92"
            stroke="#b9adc9"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      ) : kind === "team" ? (
        <g>
          <g transform="translate(30 -13) rotate(13 200 170)">
            <rect
              x="88"
              y="65"
              width="195"
              height="225"
              rx="4"
              fill="#a18bcd"
            />
            <rect
              x="98"
              y="75"
              width="175"
              height="166"
              rx="2"
              fill="#7464bc"
            />
          </g>
          <g transform="rotate(-9 200 170)">
            <rect
              x="73"
              y="55"
              width="199"
              height="230"
              rx="5"
              fill={paint("cream")}
              stroke="#fffaed"
              strokeWidth="2"
            />
            <rect
              x="85"
              y="67"
              width="175"
              height="164"
              rx="3"
              fill="#f7b17b"
            />
            <path
              d="M85 213q10-56 43-56t41 74H85m84 0q2-63 41-63t50 63"
              fill="#7254bf"
            />
            <circle cx="132" cy="132" r="29" fill="#fae9cb" />
            <circle cx="214" cy="144" r="27" fill="#b47761" />
            <path
              d="M105 128q-4-43 28-35 30-2 28 34l-23-15-33 16m85 10q-5-39 24-32 31 0 28 40l-20-16-32 8"
              fill="#383044"
            />
            <path
              d="M114 253h87m-60 12h40"
              stroke="#8e80a3"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        </g>
      ) : kind === "sponsors" ? (
        <g transform="rotate(-18 200 170)">
          <rect x="134" y="50" width="107" height="29" rx="10" fill="#766291" />
          <rect
            x="112"
            y="69"
            width="151"
            height="213"
            rx="33"
            fill="#735aa0"
          />
          <rect
            x="100"
            y="60"
            width="151"
            height="213"
            rx="33"
            fill={paint("purple")}
            stroke="#dcd0ff"
            strokeWidth="2"
          />
          <path d="M100 124h151v89H100z" fill="#e6eaa9" />
          <path d="M183 136l-33 42h25l-8 28 36-45h-27z" fill="#6450b0" />
          <path
            d="M150 244h50"
            stroke="#d7c7f3"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g transform="rotate(-10 200 170)">
          <path d="M102 68l163-14 28 16v208l-27 16-167-14z" fill="#8165b5" />
          <path d="M109 80l160-11v207l-160-10z" fill="#e4d7d2" />
          <path
            d="M103 61l160-9v211l-160 11q-17-5-17-20V81q0-14 17-20z"
            fill={paint("purple")}
            stroke="#cfbcf2"
            strokeWidth="2"
          />
          <path d="M110 63v208" stroke="#7c61af" strokeWidth="4" />
          <circle
            cx="185"
            cy="151"
            r="39"
            fill="none"
            stroke="#fef2d2"
            strokeWidth="9"
          />
          <path d="M185 107v43" stroke="#b29ae1" strokeWidth="18" />
          <path
            d="M185 106v39"
            stroke="#fef2d2"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M140 219h83m-64 13h45"
            stroke="#ded0f4"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {kind === "archive" && (
            <path d="M237 54v62l-12-9-12 12V55" fill="#f4aa75" />
          )}
        </g>
      )}
    </svg>
  );
}
