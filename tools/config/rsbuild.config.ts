import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";

const demoMetadata = {
  eyslie: {
    title: "Eyslie | Living text for React",
    description:
      "Try Eyslie's accessible living letters, anchored eyes, moods, winks, blush, and reduced-motion support.",
    url: "https://uqrealitylabs.com/project/eyslie/",
  },
  "feelable-materials": {
    title: "Feelable Materials | Tactile surfaces for React Three Fiber",
    description:
      "Poke and compare cloth, rubber, glass, grass, mail, and enamel responses from Feelable Materials.",
    url: "https://uqrealitylabs.com/project/feelable-materials/",
  },
} as const;

function getDemoMetadata(entryName: string) {
  return Object.hasOwn(demoMetadata, entryName)
    ? demoMetadata[entryName as keyof typeof demoMetadata]
    : undefined;
}

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
  html: {
    template: ({ entryName }) =>
      entryName === "index" ? "./index.html" : "./src/demos/demo.html",
    title: ({ entryName }) => getDemoMetadata(entryName)?.title,
    meta: ({ entryName, value }) => {
      const page = getDemoMetadata(entryName);
      if (!page) return value;
      return {
        ...value,
        description: page.description,
        robots: "index,follow",
        "theme-color": "#10121a",
        "og:site_name": {
          property: "og:site_name",
          content: "UQ Reality Labs",
        },
        "og:type": { property: "og:type", content: "website" },
        "og:title": { property: "og:title", content: page.title },
        "og:description": {
          property: "og:description",
          content: page.description,
        },
        "og:url": { property: "og:url", content: page.url },
        "og:image": {
          property: "og:image",
          content: "https://uqrealitylabs.com/Assets/images/labs_logo.png",
        },
        "og:image:alt": {
          property: "og:image:alt",
          content: "UQ Reality Labs logo",
        },
        "twitter:card": "summary_large_image",
      };
    },
    favicon: ({ entryName }) =>
      getDemoMetadata(entryName) ? "./public/favicon.svg" : undefined,
    tags: (tags, { entryName }) => {
      const page = getDemoMetadata(entryName);
      if (page) {
        tags.push({
          tag: "link",
          attrs: { rel: "canonical", href: page.url },
          head: true,
        });
      }
      return tags;
    },
  },
  source: {
    entry: {
      index: "./src/app/main.tsx",
      eyslie: "./src/demos/main-eyslie.tsx",
      "feelable-materials": "./src/demos/main-feelable-materials.tsx",
    },
  },
  output: {
    assetPrefix: "auto",
    distPath: {
      root: "dist",
      js: "bundled",
      css: "bundled",
      media: "bundled",
    },
    sourceMap: {
      js:
        process.env.NODE_ENV === "production"
          ? "hidden-source-map"
          : "cheap-module-source-map",
    },
  },
  tools: {
    htmlPlugin(options, { entryName }) {
      options.filename =
        entryName === "index"
          ? "index.html"
          : `project/${entryName}/index.html`;
      return options;
    },
    rspack(config, { appendPlugins }) {
      if (process.env.RSDOCTOR === "true") {
        appendPlugins(
          new RsdoctorRspackPlugin({
            disableClientServer: true,
            output: {
              mode: "brief",
              reportCodeType: "noCode",
              reportDir: "artifacts/rsdoctor",
            },
          }),
        );
      }
      return config;
    },
  },
});
