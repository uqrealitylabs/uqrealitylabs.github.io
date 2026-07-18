import type { ReactNode } from "react";

type SceneLabels = {
  mainNav: string;
  joinFallback: string;
  logoAlt: string;
  socialLinks: string;
  sceneLabel: string;
  closeProfile: string;
  linkedIn: string;
};

export type SceneNavItem = {
  id: string;
  label: string;
  shortLabel: string;
};

export type SceneSocialLink = {
  label: string;
  url: string;
};

export type SceneMember = {
  image: string;
  name: string;
  title: string;
  body: string;
  url: string;
};

export type SceneDomScaffoldProps = {
  labels: SceneLabels;
  navItems: SceneNavItem[];
  activeSection: number;
  joinHref: string;
  joinLabel: string;
  socialLinks: SceneSocialLink[];
  sectionTitle: string;
  sectionDescription: string;
  selectedMember: SceneMember | null;
  onNavigate: (index: number) => void;
  onCloseMember: () => void;
  children: ReactNode;
};

function BeeLineOrb({
  duration,
  pathId,
}: {
  duration: string;
  pathId: string;
}) {
  return (
    <g className="bee-trail__dot bee-trail__orb">
      <animateMotion
        dur={duration}
        repeatCount="indefinite"
        keyPoints="0;0.36;0.72;1;0.64;0.2;0"
        keyTimes="0;0.18;0.38;0.54;0.72;0.88;1"
        calcMode="spline"
        keySplines="0.33 0 0.67 1;0.4 0 0.2 1;0.33 0 0.67 1;0.4 0 0.2 1;0.33 0 0.67 1;0.4 0 0.2 1"
        rotate="auto"
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
      <g className="bee-trail__orb-drift">
        <circle className="bee-trail__orb-light" cx="0" cy="0" r="7.2" />
        <circle className="bee-trail__orb-core" cx="0" cy="0" r="3.35" />
        <circle
          className="bee-trail__orb-spark"
          cx="1.45"
          cy="-1.35"
          r="1.05"
        />
      </g>
    </g>
  );
}

export function SceneDomScaffold({
  labels,
  navItems,
  activeSection,
  joinHref,
  joinLabel,
  socialLinks,
  sectionTitle,
  sectionDescription,
  selectedMember,
  onNavigate,
  onCloseMember,
  children,
}: SceneDomScaffoldProps) {
  return (
    <>
      <nav id="navbar" aria-label={labels.mainNav}>
        <a
          href="/"
          className="nav-logo"
          data-section="0"
          onClick={(event) => {
            event.preventDefault();
            onNavigate(0);
          }}
        >
          <img
            id="nav-logo-img"
            src="/Assets/images/labs_logo.png"
            alt={labels.logoAlt}
            width="240"
            height="80"
          />
        </a>
        <div id="nav-links" className="nav-links">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === activeSection ? "is-active" : undefined}
              data-section={index}
              data-short={item.shortLabel}
              aria-current={index === activeSection ? "page" : undefined}
              onClick={() => onNavigate(index)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {children}
      <section className="scene-copy" aria-live="polite">
        <h1>{sectionTitle}</h1>
        <p>{sectionDescription}</p>
      </section>
      <a
        id="join-us-accessible-link"
        className="sr-only focus:not-sr-only"
        href={joinHref}
      >
        {joinLabel || labels.joinFallback}
      </a>
      <nav
        id="social-accessible-links"
        className="sr-only focus-within:not-sr-only"
        aria-label={labels.socialLinks}
      >
        {socialLinks.map((social) => (
          <a key={social.label} href={social.url} rel="noopener noreferrer">
            {social.label}
          </a>
        ))}
      </nav>
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
              <path
                className="bee-trail__eye-ring bee-trail__eye-lid"
                d="M-5 -2 C-4 5 4 5 5 -2"
              />
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
            <g className="bee-trail__thought bee-trail__thought--sad-ow">
              <circle
                className="bee-trail__thought-cloud"
                cx="208"
                cy="12"
                r="10"
              />
              <text className="bee-trail__thought-text" x="198" y="16">
                ow!
              </text>
            </g>
            <g className="bee-trail__thought bee-trail__thought--sad-aw">
              <ellipse
                className="bee-trail__thought-cloud"
                cx="198"
                cy="-18"
                rx="15"
                ry="9"
              />
              <text className="bee-trail__thought-text" x="189" y="-15">
                aw.
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
              <ellipse cx="121" cy="38" rx="6.2" ry="2.4" />
              <ellipse cx="184" cy="38" rx="6.2" ry="2.4" />
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
          <BeeLineOrb duration="3.6s" pathId="bee-trail-join" />
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
          <BeeLineOrb duration="3.9s" pathId="bee-trail-social" />
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
          <BeeLineOrb duration="3.7s" pathId="bee-trail-committee" />
        </svg>
      </div>
      {selectedMember ? (
        <div id="member-popup" className="member-popup is-open">
          <button
            className="member-popup__backdrop"
            type="button"
            aria-label={labels.closeProfile}
            onClick={onCloseMember}
          />
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
              onClick={onCloseMember}
            >
              &times;
            </button>
            <img
              id="member-popup-image"
              src={selectedMember.image}
              alt={selectedMember.name}
              width="900"
              height="900"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 860px) 82vw, 9rem"
            />
            <div>
              <h2 id="member-popup-title">{selectedMember.name}</h2>
              <p id="member-popup-role">{selectedMember.title}</p>
              <p id="member-popup-copy" className="member-popup__copy">
                {selectedMember.body}
              </p>
              <a
                id="member-popup-link"
                href={selectedMember.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {labels.linkedIn}
              </a>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
