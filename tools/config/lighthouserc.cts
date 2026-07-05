export default {
  ci: {
    collect: {
      numberOfRuns: 1,
      startServerCommand: "npm run preview -- --host 127.0.0.1 --port 4173",
      url: ["http://127.0.0.1:4173"],
      settings: {
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
  },
} as const;
