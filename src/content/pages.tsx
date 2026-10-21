import type { ReactNode } from "react";
import React from "react";
import { Calendar } from "../site/calendar.tsx";
import { External, Lead, prefix } from "../site/layout.tsx";
import { LabObject } from "../site/objects.tsx";
import {
  About,
  Contact,
  Hero,
  OpenLab,
  Partnership,
} from "../site/sections.tsx";
import { eventDay, timeZone } from "./calendar.ts";
import { getInterface } from "./copy.ts";
import {
  awards,
  type Document,
  documents,
  type Event,
  events,
  type Person,
  type Project,
  portrait,
  projects,
  sponsors,
  terms,
} from "./records.ts";
import type { Locale } from "./schema.ts";

export type Page = {
  key: string;
  path: string;
  title: string;
  description: string;
  locale: Locale;
  body: ReactNode;
  indexable: boolean;
  project?: boolean;
  canonicalPath?: string;
  event?: Event;
};
export const ui = getInterface;
export function json(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("&", "\\u0026");
}

function Awards({ locale }: { locale: Locale }) {
  const t = ui(locale);
  return (
    <section className="recognition section" aria-labelledby="awards-title">
      <div className="section__label annotation">
        <span>{t.awardLabel}</span>
        <span aria-hidden="true">[ RECOGNITION ]</span>
      </div>
      <h2 id="awards-title">{t.awards}</h2>
      <p className="lead">{t.awardsHint}</p>
      <div className="award-gallery">
        {awards().map((award) => (
          <article
            key={award.id}
            className="award-object"
            data-visual={award.visual}
          >
            <div className="award-object__stage">
              <div
                className={`award-object__poster award-object__poster--${award.visual}`}
                aria-hidden="true"
              >
                <span>{award.visual === "trophy" ? "✳" : "◎"}</span>
                <b>{award.year}</b>
              </div>
              <canvas aria-hidden="true" tabIndex={-1} />
              <button
                className="award-object__load"
                type="button"
                aria-label={`${t.loadAward}: ${award.title}`}
              >
                3D
              </button>
            </div>
            <div className="award-object__text">
              <span className="annotation">UQ UNION / {award.year}</span>
              <h3>{award.title}</h3>
              <p>{award.description}</p>
              <External url={award.link} label={t.awardDetails} />
            </div>
            <p className="sr-only" role="status" data-error={t.awardError} />
          </article>
        ))}
      </div>
    </section>
  );
}
function AboutDocuments({ locale }: { locale: Locale }) {
  const t = ui(locale);
  return (
    <section className="section documents" aria-labelledby="documents-title">
      <div className="section__label annotation">
        <span>{t.documents}</span>
        <span aria-hidden="true">[ REFERENCE ]</span>
      </div>
      <h2 id="documents-title">{t.aboutDocs}</h2>
      <div className="document-index">
        {documents("about").map((doc, i) => (
          <a key={doc.slug} href={`/about/${doc.slug}/`}>
            <span className="annotation">0{i + 1}</span>
            <span>
              <strong>{doc.title}</strong>
              <small>{doc.description}</small>
              {doc.draft && <em>{t.unfinished}</em>}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
function People({ people, locale }: { people: Person[]; locale: Locale }) {
  return people.length ? (
    <div className="people">
      {[...people]
        .sort((a, b) => a.order - b.order)
        .map((person) => (
          <article key={person.id} className="person">
            {person.photo && (
              <div className="person__image">
                <img
                  src={
                    process.env.NODE_ENV === "production"
                      ? portrait(person.photo, 800)
                      : person.photo
                  }
                  srcSet={
                    process.env.NODE_ENV === "production"
                      ? `${portrait(person.photo, 400)} 400w, ${portrait(person.photo, 800)} 800w`
                      : undefined
                  }
                  sizes="(max-width: 760px) 44vw, (max-width: 1000px) 29vw, 23vw"
                  alt={person.name}
                  width="600"
                  height="720"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
            <h3 className="person__name">{person.name}</h3>
            <p className="person__role annotation">{person.role}</p>
            <External url={person.linkedin} label="LinkedIn" />
          </article>
        ))}
    </div>
  ) : (
    <p className="empty">{ui(locale).noPeople}</p>
  );
}
function Committee({ people, locale }: { people: Person[]; locale: Locale }) {
  const t = ui(locale);
  return ["t3", "officers", "general"].map((group) => (
    <section className="section committee-group" key={group} data-group={group}>
      <h2>{t[group]}</h2>
      <People
        people={people.filter((person) => person.group === group)}
        locale={locale}
      />
    </section>
  ));
}
function EventCard({ event, locale }: { event: Event; locale: Locale }) {
  const date = new Date(event.startDate);
  return (
    <article className="event-entry" id={`event-${event.slug}`}>
      <time dateTime={event.startDate}>
        <b>
          {new Intl.DateTimeFormat(locale, { timeZone, day: "2-digit" }).format(
            date,
          )}
        </b>
        <span>
          {new Intl.DateTimeFormat(locale, {
            timeZone,
            month: "short",
            year: "numeric",
          }).format(date)}
        </span>
      </time>
      <div>
        {event.cancelled && (
          <span className="annotation">{ui(locale).cancelled}</span>
        )}
        <h3>
          <a href={`${prefix(locale)}/events/${event.slug}/`}>{event.title}</a>
        </h3>
        <p>{event.description}</p>
        <small>
          {event.location},{" "}
          {new Intl.DateTimeFormat(locale, {
            timeZone,
            hour: "numeric",
            minute: "2-digit",
          }).format(date)}
        </small>
      </div>
    </article>
  );
}
function Events({ locale, now }: { locale: Locale; now: Date }) {
  const t = ui(locale);
  const items = events().filter((event) => !event.draft);
  const props = {
    locale,
    events: items.map(({ slug, title, startDate, endDate, cancelled }) => ({
      slug,
      title,
      startDate,
      endDate,
      cancelled,
    })),
    initialDay: eventDay(now.toISOString()),
    labels: {
      today: t.today,
      previous: t.previous,
      next: t.next,
      emptyMonth: t.emptyMonth,
    },
  };
  const upcoming = items.filter(
    (event) => Date.parse(event.endDate) >= now.getTime(),
  );
  const past = items
    .filter((event) => Date.parse(event.endDate) < now.getTime())
    .reverse();
  return (
    <>
      <Lead
        kicker="UQRL / EVENTS"
        title={t.events}
        description={t.eventsDescription}
      />
      <section className="section events">
        <div className="calendar-actions">
          <a
            className="button button--accent"
            href="webcal://uqrealitylabs.com/events.ics"
          >
            {t.subscribe}
          </a>
          <a className="text-link" href="/events.ics" download>
            {t.download}
          </a>
          <button
            className="text-link feed-copy"
            type="button"
            data-copied={t.copied}
            hidden
          >
            {t.copyFeed}
          </button>
        </div>
        <p className="annotation calendar-timezone">{t.localTime}</p>
        <div id="calendar" data-calendar={json(props)}>
          <Calendar {...props} />
        </div>
        <div className="event-agenda">
          <h2>{t.upcoming}</h2>
          {upcoming.length ? (
            upcoming.map((event) => (
              <EventCard key={event.id} event={event} locale={locale} />
            ))
          ) : (
            <p className="empty">{t.emptyEvents}</p>
          )}
          {past.length > 0 && (
            <>
              <h2>{t.past}</h2>
              {past.map((event) => (
                <EventCard key={event.id} event={event} locale={locale} />
              ))}
            </>
          )}
        </div>
      </section>
    </>
  );
}
function ProjectCard({ project }: { project: Project }) {
  const t = ui("en");
  return (
    <article className="project-entry">
      <a
        className="project-entry__visual"
        href={`/projects/${project.slug}/`}
        aria-label={project.title}
      >
        {project.coverImage ? (
          <img
            src={project.coverImage}
            width="800"
            height="600"
            alt=""
            loading="lazy"
          />
        ) : (
          <LabObject kind="projects" />
        )}
        <span className="project-entry__number annotation">
          {project.year} / {project.status}
        </span>
      </a>
      <div className="project-entry__body">
        <h2>
          <a href={`/projects/${project.slug}/`}>{project.title}</a>
        </h2>
        <p className="lead">{project.summary}</p>
        <ul className="tags" aria-label="Tags">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <div className="actions">
          <External
            url={project.demoUrl}
            label={t.demo}
            className="button button--accent"
          />
          <External url={project.repoUrl} label={t.source} />
        </div>
      </div>
    </article>
  );
}
function Markdown({ doc }: { doc: Document }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: The bounded Markdown parser disables raw HTML and validates every link and asset
  return <div dangerouslySetInnerHTML={{ __html: doc.html }} />;
}

export function allPages(now = new Date()): Page[] {
  const result: Page[] = [];
  const publishedTerms = terms().filter((term) => term.published);
  const items = events().filter((event) => !event.draft);
  const partners = sponsors();
  const years = [
    ...new Set([
      ...publishedTerms.map((term) => term.year),
      ...items.map((event) => Number(eventDay(event.startDate).slice(0, 4))),
      ...partners.flatMap((sponsor) => sponsor.years),
    ]),
  ].sort((a, b) => b - a);
  for (const locale of ["en", "es"] as const) {
    const t = ui(locale);
    const base = prefix(locale);
    const add = (
      key: string,
      path: string,
      title: string,
      description: string,
      body: ReactNode,
      extra: Partial<Page> = {},
    ) =>
      result.push({
        key,
        path,
        title,
        description,
        locale,
        body,
        indexable: true,
        ...extra,
      });
    add(
      "home",
      `${base}/`,
      "UQ Reality labs",
      t.aboutDescription,
      <>
        <Hero locale={locale} />
        <OpenLab locale={locale} />
      </>,
    );
    add(
      "about",
      `${base}/about/`,
      t.about,
      t.aboutDescription,
      <>
        <Lead
          kicker="UQRL / ABOUT"
          title={t.about}
          description={t.aboutDescription}
        />
        <About locale={locale} />
        <Awards locale={locale} />
        <AboutDocuments locale={locale} />
        <Contact locale={locale} />
      </>,
    );
    const current = publishedTerms
      .filter((term) => term.current)
      .flatMap((term) => term.people);
    add(
      "team",
      `${base}/team/`,
      t.team,
      t.teamDescription,
      <>
        <Lead
          kicker="UQRL / PEOPLE"
          title={t.team}
          description={t.teamDescription}
        />
        <Committee people={current} locale={locale} />
        <section className="section team-archive">
          <details className="committee-timeline">
            <summary>{t.timeline}</summary>
            <ol>
              {years.map((year) => (
                <li key={year}>
                  <a className="archive-year" href={`${base}/team/${year}/`}>
                    <strong>{year}</strong>
                    <span>{t.viewYear}</span>
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </section>
      </>,
    );
    add(
      "sponsors",
      `${base}/sponsors/`,
      t.sponsors,
      t.sponsorsDescription,
      <>
        <Lead
          kicker="UQRL / GOOD COMPANY"
          title={t.sponsors}
          description={t.sponsorsDescription}
        />
        <section className="section sponsor-list">
          {partners
            .filter((sponsor) => sponsor.current)
            .map((sponsor) => (
              <article className="sponsor-entry" key={sponsor.id}>
                <div className="partner__logo">
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width="500"
                    height="200"
                    loading="lazy"
                  />
                </div>
                <div className="sponsor-entry__body">
                  <h2>{sponsor.name}</h2>
                  <External url={sponsor.url} label={sponsor.name} />
                </div>
              </article>
            ))}
        </section>
        <Partnership locale={locale} />
      </>,
    );
    add(
      "events",
      `${base}/events/`,
      t.events,
      t.eventsDescription,
      <Events locale={locale} now={now} />,
    );
    for (const event of items)
      add(
        `event-${event.slug}`,
        `${base}/events/${event.slug}/`,
        event.title,
        event.description,
        <>
          <Lead
            kicker="UQRL / EVENTS"
            title={event.title}
            description={event.description}
          />
          <article className="prose section">
            <a className="text-link" href={`${base}/events/`}>
              ← {t.backEvents}
            </a>
            <p>
              <time dateTime={event.startDate}>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "full",
                  timeStyle: "short",
                  timeZone,
                }).format(new Date(event.startDate))}
              </time>{" "}
              , {event.location}
            </p>
            {event.cancelled && <p>{t.cancelled}</p>}
            {event.image && (
              <img src={event.image} alt="" width="1000" height="600" />
            )}
            <Markdown doc={event} />
            <External
              url={event.ctaUrl}
              label={event.ctaLabel || event.title}
              className="button button--accent"
            />
          </article>
        </>,
        { event },
      );
    add(
      "archive",
      `${base}/archive/`,
      t.archive,
      t.archiveDescription,
      <>
        <Lead
          kicker="UQRL / ARCHIVE"
          title={t.archive}
          description={t.archiveDescription}
        />
        <section className="section archive">
          {years.length ? (
            years.map((year) => (
              <a
                key={year}
                className="archive-year"
                href={`${base}/team/${year}/`}
              >
                <strong>{year}</strong>
                <span>{t.viewYear}</span>
              </a>
            ))
          ) : (
            <p className="empty">{t.noArchive}</p>
          )}
        </section>
      </>,
      { canonicalPath: `${base}/team/`, indexable: false },
    );
    for (const year of years)
      add(
        `archive-${year}`,
        `${base}/team/${year}/`,
        `${t.archive} / ${year}`,
        `${t.archiveDescription} — ${year}`,
        <>
          <Lead
            kicker="UQRL / ARCHIVE"
            title={String(year)}
            description={t.archiveDescription}
          />
          <Committee
            people={publishedTerms
              .filter((term) => term.year === year)
              .flatMap((term) => term.people)}
            locale={locale}
          />
          <section className="section archive">
            <h2>{t.events}</h2>
            {items
              .filter(
                (event) =>
                  Number(eventDay(event.startDate).slice(0, 4)) === year,
              )
              .map((event) => (
                <EventCard key={event.id} event={event} locale={locale} />
              ))}
            <h2>{t.sponsors}</h2>
            {partners
              .filter((sponsor) => sponsor.years.includes(year))
              .map((sponsor) => (
                <p key={sponsor.id}>{sponsor.name}</p>
              ))}
          </section>
        </>,
      );
  }
  for (const doc of documents("about"))
    result.push({
      key: `doc-${doc.slug}`,
      path: `/about/${doc.slug}/`,
      title: doc.title,
      description: doc.description,
      locale: "en",
      indexable: !doc.draft,
      body: (
        <>
          <Lead
            kicker={doc.slugline || "UQRL / REFERENCE"}
            title={doc.title}
            description={doc.description}
          />
          <article className="prose section">
            <a className="text-link" href="/about/">
              {ui("en").backAbout}
            </a>
            {doc.draft && (
              <p className="document-notice">
                Unfinished — approved wording has not been supplied
              </p>
            )}
            <Markdown doc={doc} />
          </article>
        </>
      ),
    });
  const catalogue = projects().filter((project) => !project.draft);
  result.push({
    key: "projects",
    path: "/projects/",
    title: "Projects",
    description: ui("en").projectsDescription,
    locale: "en",
    project: true,
    indexable: true,
    body: (
      <>
        <Lead
          kicker="UQRL / EXPERIMENTS"
          title="Projects"
          description={ui("en").projectsDescription}
        />
        <section className="section project-list">
          {catalogue.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </section>
      </>
    ),
  });
  for (const project of catalogue)
    result.push({
      key: `project-${project.slug}`,
      path: `/projects/${project.slug}/`,
      title: project.title,
      description: project.description,
      locale: "en",
      project: true,
      indexable: true,
      body: (
        <>
          <Lead
            kicker={project.slugline || "UQRL / EXPERIMENT"}
            title={project.title}
            description={project.summary}
          />
          <article className="prose section">
            <a className="text-link" href="/projects/">
              ← {ui("en").backProjects}
            </a>
            <p className="annotation">
              {project.status} / {project.year} / {project.team.join(", ")}
            </p>
            <Markdown doc={project} />
            <ul className="tags">
              {project.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <div className="actions">
              <External
                url={project.demoUrl}
                label={ui("en").demo}
                className="button button--accent"
              />
              <External url={project.repoUrl} label={ui("en").source} />
              <External url={project.videoUrl} label={ui("en").video} />
            </div>
          </article>
        </>
      ),
    });
  result.push({
    key: "404",
    path: "/404.html",
    title: ui("en").notFound,
    description: ui("en").notFoundBody,
    locale: "en",
    indexable: false,
    body: (
      <>
        <Lead
          kicker="404 / LOST SIGNAL"
          title={ui("en").notFound}
          description={ui("en").notFoundBody}
        />
        <div className="section">
          <a className="button button--accent" href="/">
            UQ Reality Labs
          </a>
        </div>
      </>
    ),
  });
  for (const page of result.filter((page) => /^archive-/.test(page.key)))
    result.push({
      ...page,
      key: `legacy-${page.key}`,
      path: page.path.replace("/team/", "/archive/"),
      canonicalPath: page.path,
      indexable: false,
    });
  return result;
}
