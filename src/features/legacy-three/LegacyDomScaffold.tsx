type LegacyLabels = {
  mainNav: string;
  logoAlt: string;
  sceneLabel: string;
  closeProfile: string;
  linkedIn: string;
};

export function LegacyDomScaffold({ labels }: { labels: LegacyLabels }) {
  return (
    <>
      <nav id="navbar" aria-label={labels.mainNav}>
        <a href="/" className="nav-logo" data-section="0">
          <img id="nav-logo-img" src="" alt={labels.logoAlt} />
        </a>
        <div id="nav-links" className="nav-links" />
      </nav>
      <canvas id="canvas" aria-label={labels.sceneLabel} />
      <div id="chalk-layer" aria-hidden="true">
        <svg
          className="bee-trail bee-trail--join"
          viewBox="0 0 220 120"
          focusable="false"
          aria-hidden="true"
        >
          <path
            className="bee-trail__ghost"
            d="M12 88 C36 18 72 104 94 58 C116 12 146 116 174 52 C190 20 204 38 214 70"
          />
          <path
            id="bee-trail-join"
            className="bee-trail__path"
            d="M12 88 C36 18 72 104 94 58 C116 12 146 116 174 52 C190 20 204 38 214 70"
          />
          <text className="bee-trail__label" x="118" y="30">
            JOIN us
          </text>
          <g className="bee-trail__dot bee-trail__bee">
            <animateMotion
              dur="3.1s"
              repeatCount="indefinite"
              keyPoints="0;1;0"
              keyTimes="0;0.5;1"
              calcMode="linear"
              rotate="auto"
            >
              <mpath href="#bee-trail-join" />
            </animateMotion>
            <ellipse
              className="bee-trail__bee-body"
              cx="0"
              cy="0"
              rx="4.4"
              ry="3"
            />
            <path
              className="bee-trail__bee-stripe"
              d="M-1.8 -2.1 V2.1 M1.8 -2.1 V2.1"
            />
            <path
              className="bee-trail__bee-wing bee-trail__bee-wing--left"
              d="M-1.6 -2.2 C-4.5 -5.8 -2.1 -7.2 0.6 -4.5"
            />
            <path
              className="bee-trail__bee-wing bee-trail__bee-wing--right"
              d="M1.5 -2.2 C4.2 -5.8 2 -7.2 -0.4 -4.6"
            />
          </g>
        </svg>
        <svg
          className="bee-trail bee-trail--social"
          viewBox="0 0 240 110"
          focusable="false"
          aria-hidden="true"
        >
          <path
            className="bee-trail__ghost"
            d="M14 72 C42 18 82 92 104 48 C128 2 156 96 182 48 C204 10 222 18 232 36"
          />
          <path
            id="bee-trail-social"
            className="bee-trail__path"
            d="M14 72 C42 18 82 92 104 48 C128 2 156 96 182 48 C204 10 222 18 232 36"
          />
          <text className="bee-trail__label" x="18" y="24">
            buzz buzz
          </text>
          <g className="bee-trail__dot bee-trail__bee">
            <animateMotion
              dur="3.4s"
              repeatCount="indefinite"
              keyPoints="0;1;0"
              keyTimes="0;0.5;1"
              calcMode="linear"
              rotate="auto"
            >
              <mpath href="#bee-trail-social" />
            </animateMotion>
            <ellipse
              className="bee-trail__bee-body"
              cx="0"
              cy="0"
              rx="4"
              ry="2.75"
            />
            <path
              className="bee-trail__bee-stripe"
              d="M-1.6 -2 V2 M1.6 -2 V2"
            />
            <path
              className="bee-trail__bee-wing bee-trail__bee-wing--left"
              d="M-1.4 -2 C-4.2 -5.3 -1.9 -6.8 0.5 -4.2"
            />
            <path
              className="bee-trail__bee-wing bee-trail__bee-wing--right"
              d="M1.3 -2 C4 -5.3 1.7 -6.8 -0.3 -4.3"
            />
          </g>
        </svg>
        <svg
          className="bee-trail bee-trail--committee"
          viewBox="0 0 260 130"
          focusable="false"
          aria-hidden="true"
        >
          <path
            className="bee-trail__ghost"
            d="M18 94 C48 18 92 122 122 62 C154 4 184 120 218 58 C238 20 250 34 254 54"
          />
          <path
            id="bee-trail-committee"
            className="bee-trail__path"
            d="M18 94 C48 18 92 122 122 62 C154 4 184 120 218 58 C238 20 250 34 254 54"
          />
          <text className="bee-trail__label" x="36" y="42">
            crew?
          </text>
          <g className="bee-trail__dot bee-trail__bee">
            <animateMotion
              dur="3.2s"
              repeatCount="indefinite"
              keyPoints="0;1;0"
              keyTimes="0;0.5;1"
              calcMode="linear"
              rotate="auto"
            >
              <mpath href="#bee-trail-committee" />
            </animateMotion>
            <ellipse
              className="bee-trail__bee-body"
              cx="0"
              cy="0"
              rx="4.3"
              ry="2.95"
            />
            <path
              className="bee-trail__bee-stripe"
              d="M-1.7 -2.05 V2.05 M1.7 -2.05 V2.05"
            />
            <path
              className="bee-trail__bee-wing bee-trail__bee-wing--left"
              d="M-1.5 -2.1 C-4.3 -5.6 -2 -7 0.5 -4.4"
            />
            <path
              className="bee-trail__bee-wing bee-trail__bee-wing--right"
              d="M1.4 -2.1 C4.1 -5.6 1.8 -7 -0.3 -4.5"
            />
          </g>
        </svg>
        <svg
          className="bee-trail bee-trail--join-sad"
          viewBox="0 0 180 120"
          focusable="false"
          aria-hidden="true"
        >
          <path
            className="bee-trail__ghost"
            d="M18 74 C44 42 66 94 92 64 C116 36 132 64 154 42"
          />
          <path
            className="bee-trail__path"
            d="M18 74 C44 42 66 94 92 64 C116 36 132 64 154 42"
          />
          <text className="bee-trail__label" x="18" y="28">
            aw.
          </text>
          <circle className="bee-trail__sad-eye" cx="76" cy="88" r="3.4" />
          <circle className="bee-trail__sad-eye" cx="104" cy="88" r="3.4" />
          <path className="bee-trail__sad-mouth" d="M78 108 Q90 96 102 108" />
        </svg>
      </div>
      <div id="member-popup" className="member-popup" hidden>
        <div className="member-popup__backdrop" data-popup-close />
        <article
          className="member-popup__card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-popup-title"
          tabIndex={-1}
        >
          <button
            className="member-popup__close"
            type="button"
            aria-label={labels.closeProfile}
            data-popup-close
          >
            &times;
          </button>
          <img
            id="member-popup-image"
            alt=""
            width="900"
            height="900"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 860px) 82vw, 9rem"
          />
          <div>
            <h2 id="member-popup-title">Profile</h2>
            <p id="member-popup-role" />
            <p id="member-popup-copy" className="member-popup__copy" />
            <a
              id="member-popup-link"
              href="https://www.linkedin.com/company/uq-reality-labs"
              target="_blank"
              rel="noopener noreferrer"
            >
              {labels.linkedIn}
            </a>
          </div>
        </article>
      </div>
      <div id="status" hidden />
    </>
  );
}
