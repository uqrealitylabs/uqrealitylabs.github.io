type LegacyLabels = {
  mainNav: string;
  joinFallback: string;
  logoAlt: string;
  socialLinks: string;
  sceneLabel: string;
  closeProfile: string;
  linkedIn: string;
  years: string;
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
        data-cy="rubrics-button"
      >
        {labels.joinFallback}
      </a>
      <nav
        id="social-accessible-links"
        className="sr-only focus-within:not-sr-only"
        aria-label={labels.socialLinks}
      />
      <div id="scroll-track" aria-hidden="true" />
      <nav id="year-rail" aria-label={labels.years} />
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
