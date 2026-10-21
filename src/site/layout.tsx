import type { ReactNode } from "react";
import React from "react";
import { getSiteContent } from "../content/catalog.ts";
import { getInterface } from "../content/copy.ts";
import type { Page } from "../content/pages.tsx";
import type { Locale } from "../content/schema.ts";
import { Logo } from "./logo.tsx";
import type { ObjectKind } from "./objects.tsx";
import { World } from "./sections.tsx";

export const prefix = (locale: Locale) => (locale === "en" ? "" : "/es");
export function External({
  url,
  label,
  className = "text-link",
}: {
  url: string;
  label: string;
  className?: string;
}) {
  return url ? (
    <a
      className={className}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  ) : null;
}
export function Lead({
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-lead">
      <h1 className="page-title">{title}</h1>
      <p className="lead">{description}</p>
    </div>
  );
}
export function Layout({
  page,
  children,
}: {
  page: Page;
  children?: ReactNode;
}) {
  const t = getInterface(page.locale);
  const base = prefix(page.locale);
  const nav = ["about", "team", "events", "sponsors"];
  const site = getSiteContent(page.locale);
  const room: ObjectKind = page.project
    ? "projects"
    : page.key.startsWith("archive")
      ? "team"
      : ["team", "events", "sponsors"].includes(page.key)
        ? (page.key as ObjectKind)
        : "about";
  return (
    <>
      <a className="skip" href="#main">
        {page.locale === "en" ? "Skip to content" : "Saltar al contenido"}
      </a>
      <header className="header">
        <a className="brand" href={`${base}/`} aria-label="UQ Reality Labs">
          <Logo name="UQ Reality Labs" />
        </a>
        <button
          className="menu"
          type="button"
          aria-expanded="false"
          aria-controls="navigation"
          hidden
        >
          {page.locale === "en" ? "Menu" : "Menú"}
          <span aria-hidden="true">+</span>
        </button>
        <nav
          id="navigation"
          aria-label={page.locale === "en" ? "Primary" : "Principal"}
        >
          {nav.map((key) => (
            <a
              key={key}
              href={`${base}/${key}/`}
              aria-current={
                page.key === key || page.path.includes(`/${key}/`)
                  ? "page"
                  : undefined
              }
            >
              {t[key]}
            </a>
          ))}
          <a href="/projects/" aria-current={page.project ? "page" : undefined}>
            {t.projects}
          </a>
        </nav>
        <a
          className="header__join"
          href={site.membership}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.join}
        >
          <span className="join-long">{t.join}</span>
          <span className="join-short" aria-hidden="true">
            {t.joinShort}
          </span>
        </a>
        <button
          className="air-trigger"
          type="button"
          aria-label={t.air}
          aria-haspopup="dialog"
          hidden
        >
          <svg
            className="logo"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v8c0 4-2 6-6 6h-1c-2 0-3-1-4-2l-5-6a1.6 1.6 0 0 1 2-2l2 2" />
          </svg>
        </button>
        <button
          className="search-trigger"
          type="button"
          aria-label={t.search}
          aria-haspopup="dialog"
          hidden
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="6" />
            <path d="m15 15 6 6" />
          </svg>
        </button>
      </header>
      <World locale={page.locale} />
      <div id="reading">
        <main id="main" tabIndex={-1} data-page={page.key} data-room={room}>
          {children}
        </main>
      </div>
      <footer className="footer">
        <div className="footer__space" id="footer-space">
          <nav className="footer__pages" aria-label={t.club}>
            <a href={`${base}/sponsors/`}>
              {page.locale === "en" ? "Sponsorships" : "Patrocinios"}
            </a>
            <a href={`${base}/about/`}>
              {page.locale === "en" ? "About Us" : "Quiénes somos"}
            </a>
            <a href={`${base}/team/`}>{t.team}</a>
            <a href="/projects/">{t.projects}</a>
          </nav>
          <nav className="footer__socials" aria-label={t.community}>
            {site.socialLinks
              .filter((item) => item.label !== "Website")
              .map((item) => (
                <a
                  className="icon-link"
                  key={item.label}
                  href={item.url}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Logo name={item.label} />
                </a>
              ))}
          </nav>
        </div>
        <span className="footer__door footer__door--left" aria-hidden="true">
          REALITY
        </span>
        <span className="footer__door footer__door--right" aria-hidden="true">
          LABS
        </span>
        <button
          className="footer__latch"
          type="button"
          hidden
          aria-label={
            page.locale === "en" ? "Open footer links" : "Abrir enlaces del pie"
          }
          aria-controls="footer-space"
          aria-expanded="false"
        >
          <Logo name="UQ Reality Labs" />
        </button>
      </footer>
      <aside className="air-invite" aria-labelledby="air-invite-title" hidden>
        <h2 id="air-invite-title">{t.airInvite}</h2>
        <p>{t.airIntro}</p>
        <button type="button" data-air-open>
          {t.airInvite}
        </button>
        <button type="button" data-air-dismiss>
          {t.airLater}
        </button>
      </aside>
      <dialog
        id="air"
        aria-labelledby="air-title"
        aria-describedby="air-privacy"
      >
        <h2 id="air-title">{t.air}</h2>
        <p id="air-privacy">{t.airPrivacy}</p>
        <p>{t.airCaution}</p>
        <p role="status" />
        <div className="air-actions">
          <button type="button" data-start>
            {t.airEnable}
          </button>
          <form method="dialog">
            <button type="submit" data-close>
              {t.airClose}
            </button>
          </form>
        </div>
      </dialog>
      <aside id="air-session" className="air-session" aria-label={t.air} hidden>
        <video muted playsInline aria-hidden="true" tabIndex={-1} />
        <p
          role="status"
          data-loading={t.airLoading}
          data-hand={t.airHandHint}
          data-eye={t.airEyeHint}
          data-error={t.airError}
        />
        <button type="button" data-calibrate hidden>
          {t.airCalibrate}
        </button>
        <button type="button" data-stop>
          {t.airStop}
        </button>
        <div className="air-cursor" aria-hidden="true" hidden>
          <span />
          <i />
        </div>
        <div className="air-effects" aria-hidden="true" />
      </aside>
      <dialog id="search" aria-labelledby="search-title">
        <div className="search__head">
          <h2 id="search-title">{t.search}</h2>
          <button type="button" data-close aria-label={t.searchClose}>
            ×
          </button>
        </div>
        <div
          id="search-content"
          data-hint={t.searchHint}
          data-empty={t.searchEmpty}
        >
          <label className="sr-only" htmlFor="query">
            {t.searchHint}
          </label>
          <input
            id="query"
            type="search"
            placeholder={t.searchHint}
            autoComplete="off"
            maxLength={200}
          />
          <div id="search-results" aria-live="polite" />
        </div>
      </dialog>
    </>
  );
}
