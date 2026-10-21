import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import React, { useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";

const metadata =
  'title, meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"], script[type="application/ld+json"]';

/** Static HTML is also the route payload, so direct visits and client navigation share content */
export function mountRouter(changed: () => void) {
  const host = document.getElementById("reading")!;
  const initial = {
    html: host.innerHTML,
    head: document.head.querySelectorAll(metadata),
    lang: document.documentElement.lang,
  };
  let first = true;
  const root = createRootRoute();
  const page = createRoute({
    getParentRoute: () => root,
    path: "$",
    loader: async ({ location, abortController }) => {
      if (first) {
        first = false;
        return initial;
      }
      const response = await fetch(location.pathname, {
        signal: abortController.signal,
        headers: { Accept: "text/html" },
      });
      if (
        !response.ok ||
        new URL(response.url).origin !== window.location.origin ||
        Number(response.headers.get("content-length")) > 2_000_000
      )
        throw new Error("Page unavailable");
      const text = await response.text();
      if (text.length > 2_000_000) throw new Error("Page exceeds budget");
      const document = new DOMParser().parseFromString(text, "text/html");
      const content = document.getElementById("reading");
      if (!content) throw new Error("Page content unavailable");
      return {
        html: content.innerHTML,
        head: document.head.querySelectorAll(metadata),
        lang: document.documentElement.lang,
      };
    },
    component: Page,
    errorComponent: () => (
      <main id="main" className="section route-error" tabIndex={-1}>
        <h1>Page unavailable</h1>
        <p>That page could not be loaded</p>
        <a href={location.pathname} rel="external">
          Open directly
        </a>
      </main>
    ),
  });
  function Page() {
    const data = page.useLoaderData();
    useLayoutEffect(() => {
      for (const node of document.head.querySelectorAll(metadata))
        node.remove();
      for (const node of data.head) document.head.append(node.cloneNode(true));
      document.documentElement.lang = data.lang;
      changed();
      if (data !== initial && !location.hash)
        document.getElementById("main")?.focus({ preventScroll: true });
    }, [data]);
    const html = { __html: data.html };
    // biome-ignore lint/security/noDangerouslySetInnerHtml: Only validated same-origin prerendered pages enter this surface
    return <div dangerouslySetInnerHTML={html} />;
  }
  const router = createRouter({
    routeTree: root.addChildren([page]),
    scrollRestoration: true,
    trailingSlash: "always",
    defaultPendingMinMs: 0,
  });
  void router.load().then(() => {
    createRoot(host).render(<RouterProvider router={router} />);
  });
  document.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (
      !link ||
      link.target ||
      link.hasAttribute("download") ||
      link.rel === "external"
    )
      return;
    const url = new URL(link.href);
    if (
      url.origin !== location.origin ||
      !url.pathname.endsWith("/") ||
      url.pathname.startsWith("/assets/")
    )
      return;
    if (url.pathname === location.pathname && url.hash) return;
    event.preventDefault();
    void router.navigate({ to: url.pathname, hash: url.hash.slice(1) });
  });
}
