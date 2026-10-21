import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  defineConfig,
  type OnBeforeStartDevServerFn,
  type OnBeforeStartPreviewServerFn,
  type RsbuildConfig,
} from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { createElement } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { calendarFeed } from "../../src/content/calendar.ts";
import { allPages } from "../../src/content/pages.tsx";
import { events } from "../../src/content/records.ts";
import {
  buildLlms,
  buildRobots,
  buildSitemap,
  renderHeadBlock,
} from "../../src/content/seo.ts";
import { assertValidContent } from "../../src/content/validate.ts";
import { Layout } from "../../src/site/layout.tsx";
import { writeAssets } from "./assets.ts";
import { generateSettings, settings } from "./settings.ts";
import { trafficFeed } from "./traffic.ts";

generateSettings();
assertValidContent();
const target = process.env.SITE_TARGET === "projects" ? "projects" : "website";
const pages = allPages()
  .filter((page) => target !== "projects" || page.project || page.key === "404")
  .map((page) =>
    target === "projects"
      ? { ...page, path: page.path.replace(/^\/projects\//, "/") }
      : page,
  );
const entries = new Map(
  pages.map((page) => [
    page.path === "/"
      ? "index"
      : page.path.endsWith(".html")
        ? page.path.slice(1, -5)
        : `${page.path.slice(1)}index`,
    page,
  ]),
);
const generated = () => ({
  "/events.ics": calendarFeed(events()),
  "/sitemap.xml": buildSitemap(pages, target),
  "/robots.txt": buildRobots(target),
  "/llms.txt": buildLlms(pages, target),
  "/search.json": JSON.stringify(
    pages
      .filter((page) => page.indexable)
      .map(({ title, description, path, locale, body }) => ({
        title,
        description,
        path,
        locale,
        text: renderToStaticMarkup(body)
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 12000),
      })),
  ),
});
export default defineConfig({
  ...(settings("build") as RsbuildConfig),
  plugins: [
    pluginReact(),
    {
      name: "uqrl-content",
      setup(api) {
        const traffic = trafficFeed();
        api.onCloseDevServer(() => traffic.dispose());
        api.onBeforeStartDevServer((({ server }) => {
          server.middlewares.use(traffic);
        }) satisfies OnBeforeStartDevServerFn);
        api.onBeforeStartPreviewServer((({ server }) => {
          server.middlewares.use(traffic);
        }) satisfies OnBeforeStartPreviewServerFn);
        api.onBeforeStartDevServer((({ server }) => {
          const resources: Record<string, string> = generated();
          server.middlewares.use((request, response, next) => {
            const value = resources[request.url?.split("?")[0] ?? ""];
            if (value === undefined) return next();
            response.setHeader(
              "Content-Type",
              request.url?.includes(".svg")
                ? "image/svg+xml"
                : request.url?.includes(".json")
                  ? "application/json"
                  : request.url?.includes(".ics")
                    ? "text/calendar; charset=utf-8"
                    : "text/plain; charset=utf-8",
            );
            response.end(value);
          });
        }) satisfies OnBeforeStartDevServerFn);
        api.onAfterBuild(async () => {
          if (target === "projects")
            writeFileSync("dist/CNAME", "project.uqrealitylabs.com\n");
          for (const [path, value] of Object.entries(generated()))
            writeFileSync(`dist${path}`, value);
          await writeAssets();
          writeFileSync(
            "dist/_headers",
            "/bundled/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/*\n  Cache-Control: public, max-age=86400\n/assets/content/*\n  Cache-Control: public, max-age=0, must-revalidate\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Cache-Control: public, max-age=0, must-revalidate\n/events.ics\n  Content-Type: text/calendar; charset=utf-8\n  Cache-Control: public, max-age=300\n",
          );
        });
      },
    },
  ],
  output: {
    ...(settings("build").output as RsbuildConfig["output"]),
    copy: [
      { from: resolve("out/tools/world"), to: "assets/world" },
      { from: resolve("out/tools/native"), to: "assets/wasm" },
      {
        from: resolve("node_modules/@mediapipe/tasks-vision/wasm"),
        to: "assets/vision/wasm",
        globOptions: { ignore: ["**/*module*"] },
      },
    ],
  },
  html: {
    title: "",
    template: "./index.html",
    templateParameters: (_parameters, { entryName }) => {
      const page = entries.get(entryName);
      if (!page) throw new Error(`Unknown page ${entryName}`);
      const shell = renderToString(createElement(Layout, { page }, page.body));
      return {
        lang: page.locale,
        pageKey: page.key,
        head: renderHeadBlock(page, pages, target),
        body:
          target === "projects"
            ? shell
                .replaceAll('href="/projects/', 'href="/')
                .replaceAll(
                  'href="/#station-',
                  'href="https://uqrealitylabs.com/#station-',
                )
                .replace(
                  /href="\/(about|team|events|sponsors|archive|es)(\/[^"]*)?"/g,
                  'href="https://uqrealitylabs.com/$1$2"',
                )
            : shell,
      };
    },
  },
  source: {
    ...(settings("build").source as RsbuildConfig["source"]),
    entry: Object.fromEntries(
      [...entries.keys()].map((key) => [key, "./src/site/main.ts"]),
    ),
  },
  dev: {
    watchFiles: {
      paths: [
        "public/assets/content/**/*",
        "public/assets/people/**/*",
        "public/assets/world/**/*",
      ],
      type: "restart",
    },
  },
});
