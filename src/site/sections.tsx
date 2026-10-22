import React from "react";
import { getSiteContent } from "../content/catalog.ts";
import { getCopy, getInterface } from "../content/copy.ts";
import { places, portrait, projects, terms } from "../content/records.ts";
import type { Locale } from "../content/schema.ts";
import { External } from "./layout.tsx";
import { Logo } from "./logo.tsx";
import { getSocialMaterialKind } from "./material.ts";
import { LabObject, LabPoster, type ObjectKind } from "./objects.tsx";

export function World({ locale }: { locale: Locale }) {
  const text = getCopy(locale);
  const t = getInterface(locale);
  const base = locale === "en" ? "" : "/es";
  const stations: ObjectKind[] = [
    "projects",
    "events",
    "team",
    "about",
    "sponsors",
  ];
  const portraits = terms()
    .filter((term) => term.current && term.published)
    .flatMap((term) => term.people)
    .filter((person) => person.group === "t3" && person.photo)
    .slice(0, 3)
    .map((person) =>
      process.env.NODE_ENV === "production"
        ? portrait(person.photo, 400)
        : person.photo,
    );
  return (
    <aside className="world" aria-label="UQ Reality Labs landscape">
      <div className="specimen" id="specimen" data-view="home">
        <div id="poster" className="specimen__poster">
          <LabPoster />
        </div>
        <div className="specimen__viewport">
          <canvas
            id="canvas"
            data-portraits={JSON.stringify(portraits)}
            aria-hidden="true"
            tabIndex={-1}
          />
          <nav className="world-labels" aria-label="Places">
            {places().map((place) => {
              const Label = place.kind === "city" ? "button" : "span";
              return (
                <Label
                  key={place.name}
                  className="world-label"
                  data-longitude={place.longitude}
                  data-latitude={place.latitude}
                  data-kind={place.kind}
                  data-offset={place.offset}
                  {...(place.kind === "city"
                    ? {
                        type: "button" as const,
                        "aria-label": `Fly to ${place.name}`,
                        "data-capital": place.name,
                      }
                    : { "aria-hidden": true as const })}
                  hidden
                >
                  {place.name}
                </Label>
              );
            })}
          </nav>
        </div>
        <button className="world-return" type="button" hidden>
          Australia
        </button>
        <p className="world-destination annotation" role="status" hidden />
        <div
          className="scene-readout"
          aria-live="polite"
          aria-atomic="true"
          hidden
        >
          <h2 id="room-title">UQ Reality Labs</h2>
          <p id="room-description">{text.aboutBody}</p>
          <a
            className="text-link"
            id="room-link"
            href={`${base}/about/`}
            data-label={t.openRoom}
          >
            {t.openRoom} {t.about}
          </a>
        </div>
        <nav className="lab-stations" aria-label={t.explore}>
          <p className="annotation lab-stations__hint">{t.labExplore}</p>
          <ol>
            {stations.map((kind) => (
              <li className="station" key={kind}>
                <button
                  className="station__view"
                  type="button"
                  data-view={kind}
                  data-title={t[kind]}
                  data-description={t[`${kind}Description`]}
                  data-url={
                    kind === "projects" ? "/projects/" : `${base}/${kind}/`
                  }
                  aria-pressed="false"
                  aria-label={`${t.inspect} ${t[kind]}`}
                  hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3-6 10-6 10 6 10 6-3 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </button>
                <a
                  id={`station-${kind}`}
                  className="station__link"
                  href={kind === "projects" ? "/projects/" : `${base}/${kind}/`}
                  aria-label={`${t.openRoom} ${t[kind]}`}
                >
                  <span className="station__fallback">{t[kind]}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p
          id="scene-status"
          className="sr-only"
          role="status"
          data-loading={text.loading}
          data-ready={text.ready}
          data-error={text.static}
        />
      </div>
      <p
        className="world-weather annotation"
        id="world-weather"
        role="status"
        hidden
      />
      <p
        className="world-traffic annotation"
        id="world-traffic"
        role="status"
        hidden
      />
      <a
        className="world-credit"
        href="/assets/world/SOURCES.md"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t.mapCredit}
      </a>
    </aside>
  );
}

export function Hero({ locale }: { locale: Locale }) {
  const text = getCopy(locale);
  const site = getSiteContent(locale);
  return (
    <section
      className="hero"
      id="home"
      aria-labelledby="hero-title"
      data-chapter="campus"
    >
      <div className="hero__stage">
        <div className="hero__copy">
          <h1 id="hero-title">
            <span className="hero__uq">UQ</span>
            <span className="hero__name">
              Reality{" "}
              <img src="/assets/brand/mark.svg" width="80" height="80" alt="" />{" "}
              Labs
            </span>
          </h1>
          <External
            url={site.membership}
            label={text.join}
            className="button button--accent"
          />
        </div>
      </div>
    </section>
  );
}

export function OpenLab({ locale }: { locale: Locale }) {
  const text = getCopy(locale);
  const t = getInterface(locale);
  const project = projects().find((item) => item.featured && !item.draft);
  return (
    <section
      className="open-lab section"
      id="inside"
      aria-labelledby="inside-title"
    >
      <div className="section__label annotation">
        <span>{text.chapter}</span>
        <span>{t.noHeadset}</span>
      </div>
      <div className="open-lab__intro">
        <h2 id="inside-title">
          {text.about[0]}
          <br />
          <em>{text.about[1]}</em>
        </h2>
        <p className="lead">{text.aboutBody}</p>
      </div>
      <div className="workbench">
        <div className="workbench__notes">
          {text.activities.map(([, title, body]) => (
            <article key={title}>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
        {project && (
          <a className="experiment" href={`/projects/${project.slug}/`}>
            <span className="annotation">{project.status}</span>
            <LabObject kind="projects" />
            <span className="experiment__title">{project.title}</span>
            <p>{project.summary}</p>
            <span className="experiment__tab annotation">{t.projects}</span>
          </a>
        )}
      </div>
      <div className="club-ticket">
        <div>
          <h3>{text.joinTitle}</h3>
          <p>{text.joinBody}</p>
        </div>
        <External
          url={getSiteContent(locale).membership}
          label={text.join}
          className="button"
        />
      </div>
    </section>
  );
}

export function About({ locale }: { locale: Locale }) {
  const text = getCopy(locale);
  return (
    <section className="about section" id="about" aria-labelledby="about-title">
      <div className="section__label annotation">
        <span>{text.chapter}</span>
      </div>
      <div className="about__intro">
        <h2 id="about-title">
          {text.about[0]}
          <br />
          <em>{text.about[1]}</em>
        </h2>
        <div>
          <p className="lead">{text.aboutBody}</p>
          <p className="annotation about__award">{text.award}</p>
        </div>
      </div>
      <div className="activities">
        {text.activities.map(([, title, body]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <div className="invitation">
        <div className="eyes" aria-hidden="true">
          <span>
            <i />
          </span>
          <span>
            <i />
          </span>
        </div>
        <div>
          <h3>{text.joinTitle}</h3>
          <p>{text.joinBody}</p>
        </div>
        <External
          url={getSiteContent(locale).membership}
          label={text.join}
          className="button button--accent join-link"
        />
        <span className="invitation__aside annotation">{text.joinAside}</span>
      </div>
    </section>
  );
}

export function Partnership({ locale }: { locale: Locale }) {
  const text = getCopy(locale);
  return (
    <section
      className="partners section"
      id="sponsors"
      aria-labelledby="partners-title"
    >
      <div className="section__label annotation">
        <span>{text.partnerLabel}</span>
      </div>
      <div className="partners__body">
        <div>
          <h2 id="partners-title">{text.partnerTitle}</h2>
          <p className="lead">{text.partnerBody}</p>
          <a className="text-link" href="mailto:uqrealitylabs@gmail.com">
            {text.partnerAction}
          </a>
        </div>
        <span className="partners__symbol" aria-hidden="true">
          ✳
        </span>
      </div>
    </section>
  );
}

export function Contact({ locale }: { locale: Locale }) {
  const text = getCopy(locale);
  return (
    <section
      className="contact section"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="section__label annotation">
        <span>{text.contactLabel}</span>
      </div>
      <div className="section__intro">
        <h2 id="contact-title">
          {text.contactTitle[0]}
          <br />
          <em>{text.contactTitle[1]}</em>
        </h2>
        <p className="lead">{text.contactBody}</p>
      </div>
      <nav className="portals" aria-label={text.contactLabel}>
        {getSiteContent(locale)
          .socialLinks.filter((social) => social.label !== "Website")
          .map((social) => (
            <a
              key={social.label}
              className="portal"
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              title={social.label}
              data-material={
                social.material ?? getSocialMaterialKind(social.label)
              }
            >
              <span className="portal__name">
                <Logo name={social.label} />
              </span>
              <span className="portal__hint">
                {text.socialHints[social.label] ?? ""}
              </span>
            </a>
          ))}
      </nav>
      <div className="faq">
        <h3>{text.faq}</h3>
        <div>
          {text.questions.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
