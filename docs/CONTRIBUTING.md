# Contributing

Start with an issue before doing non-trivial work. If an issue already exists, comment that you are taking it so two people do not burn time on the same thing.

## Branches

- Use short lowercase branch names with hyphens, like `docs/footer`, `fix/bee-lines`, or `chore/ci-cleanup`.
- Keep the branch focused. One branch, one job.

## Local setup

- `npm install`
- `npm run dev`

## Local checks

- `npm run format`
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run check` before opening a PR

## PR expectations

- Keep the diff tight.
- Describe what changed and why.
- Include screenshots for visible UI changes.
- Mention any content or data files you touched.
- Link the issue if there is one.

## Content rules

- Do not invent facts.
- Keep names, roles, photos, links, and order intact unless the issue explicitly says otherwise.
- Prefer markdown/content files over hardcoding copy in components.
- If official constitution or code of conduct text is missing, leave a clear placeholder instead of guessing.

## Design rules

- Do not redesign the site in a drive-by change.
- Keep the comic, 3D, bee, and social style consistent.
- Avoid extra wrappers, duplicate boxes, and unnecessary visual noise.

## Accessibility and responsiveness

- Check mobile and desktop.
- Check keyboard focus.
- Check reduced motion when animation changes.
- Avoid horizontal overflow.
- Keep touch targets usable.

## AI-generated changes

- Review AI-assisted changes line by line.
- Verify content, links, and behavior before shipping.
- Do not treat AI output as source of truth when the repo already has one.
