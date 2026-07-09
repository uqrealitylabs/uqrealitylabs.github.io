type LegacyLabels = {
  mainNav: string;
  joinFallback: string;
  logoAlt: string;
  socialLinks: string;
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
      <a
        id="join-us-accessible-link"
        className="sr-only focus:not-sr-only"
        href="#nav-links"
      >
        {labels.joinFallback}
      </a>
      <nav
        id="social-accessible-links"
        className="sr-only focus-within:not-sr-only"
        aria-label={labels.socialLinks}
      />
      <div id="chalk-layer" aria-hidden="true">
        <svg
          className="bee-trail bee-trail--join"
          viewBox="0 0 220 120"
          focusable="false"
          aria-hidden="true"
        >
          <path
            className="bee-trail__ghost"
            d="M12 88 C28 24 42 122 62 66 C78 14 96 108 118 56 C138 10 158 118 178 54 C192 30 204 36 214 64"
          />
          <path
            id="bee-trail-join"
            className="bee-trail__path"
            d="M12 88 C28 24 42 122 62 66 C78 14 96 108 118 56 C138 10 158 118 178 54 C192 30 204 36 214 64"
          />
          <g className="bee-trail__label-group bee-trail__join-word">
            <text
              className="bee-trail__label bee-trail__join-letter bee-trail__join-letter--j"
              x="118"
              y="30"
            >
              J
            </text>
            <text
              className="bee-trail__label bee-trail__join-letter bee-trail__join-letter--o"
              x="130"
              y="30"
            >
              O
            </text>
            <text
              className="bee-trail__label bee-trail__join-letter bee-trail__join-letter--i"
              x="144"
              y="30"
            >
              I
            </text>
            <text
              className="bee-trail__label bee-trail__join-letter bee-trail__join-letter--n"
              x="153"
              y="30"
            >
              N
            </text>
            <text
              className="bee-trail__label bee-trail__join-letter bee-trail__join-letter--u"
              x="171"
              y="30"
            >
              U
            </text>
            <text
              className="bee-trail__label bee-trail__join-letter bee-trail__join-letter--s"
              x="184"
              y="30"
            >
              S
            </text>
            <g
              className="bee-trail__eye bee-trail__eye--o"
              transform="translate(130 24)"
            >
              <circle className="bee-trail__eye-ring" cx="0" cy="0" r="4.8" />
              <circle className="bee-trail__eye-pupil" cx="0" cy="0" r="1.6" />
            </g>
            <g
              className="bee-trail__eye bee-trail__eye--u"
              transform="translate(172 25)"
            >
              <circle className="bee-trail__eye-ring" cx="0" cy="0" r="4.3" />
              <circle className="bee-trail__eye-pupil" cx="0" cy="0" r="1.45" />
            </g>
            <path className="bee-trail__join-wink" d="M166 23 Q172 19 178 23" />
            <path
              className="bee-trail__join-smile"
              d="M137 37 Q154 47 174 37"
            />
            <path
              className="bee-trail__join-frown"
              d="M137 43 Q154 32 174 43"
            />
            <path
              className="bee-trail__join-tear"
              d="M132 32 C128 38 127 43 132 47 C137 43 136 38 132 32"
            />
            <g className="bee-trail__thought bee-trail__thought--near-awwww">
              <ellipse
                className="bee-trail__thought-cloud"
                cx="154"
                cy="-15"
                rx="28"
                ry="11"
              />
              <text className="bee-trail__thought-text" x="131" y="-11">
                AWWWW
              </text>
            </g>
            <g className="bee-trail__thought bee-trail__thought--sad-aw">
              <ellipse
                className="bee-trail__thought-cloud"
                cx="198"
                cy="-12"
                rx="18"
                ry="10"
              />
              <text className="bee-trail__thought-text" x="187" y="-9">
                aw.
              </text>
            </g>
            <g className="bee-trail__thought bee-trail__thought--sad-ow">
              <circle
                className="bee-trail__thought-cloud"
                cx="208"
                cy="12"
                r="10"
              />
              <text className="bee-trail__thought-text" x="199" y="16">
                ow.
              </text>
            </g>
            <g className="bee-trail__thought bee-trail__thought--yay">
              <ellipse
                className="bee-trail__thought-cloud"
                cx="154"
                cy="-16"
                rx="18"
                ry="10"
              />
              <text className="bee-trail__thought-text" x="144" y="-13">
                yay
              </text>
            </g>
            <g className="bee-trail__kawaii-blush">
              <ellipse cx="141" cy="35" rx="4.4" ry="2" />
              <ellipse cx="163" cy="35" rx="4.4" ry="2" />
            </g>
            <g className="bee-trail__pom-poms">
              <path d="M126 4 l-6 -5 M126 4 l-1 -8 M126 4 l7 -5" />
              <path d="M182 4 l-6 -5 M182 4 l1 -8 M182 4 l7 -5" />
              <circle cx="126" cy="4" r="3" />
              <circle cx="182" cy="4" r="3" />
            </g>
            <g className="bee-trail__dust">
              <circle cx="194" cy="4" r="1.3" />
              <circle cx="204" cy="0" r="1" />
              <circle cx="212" cy="20" r="1.2" />
            </g>
          </g>
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
