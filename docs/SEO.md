# SEO follow-up checklist

Technical on-page SEO is implemented in source (`index.html`, `public/robots.txt`, `public/sitemap.xml`, etc.). Complete these manual steps to maximize rankings for **UQ Reality Labs** and informal queries like **university VR society at UQ**.

## 1. Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add property: `https://uqrealitylabs.github.io/`
3. Verify ownership (HTML file upload, DNS, or meta tag — whichever GitHub Pages supports for your setup).
4. Submit sitemap: `https://uqrealitylabs.github.io/sitemap.xml`
5. Use **URL Inspection** on the homepage and request indexing after deploy.

## 2. Profile consistency (backlinks)

Ensure these profiles link to `https://uqrealitylabs.github.io/` with the name **UQ Reality Labs**:

- [LinkedIn](https://www.linkedin.com/company/uq-reality-labs)
- [Instagram](https://www.instagram.com/uqrealitylabs/)
- [UQ Union club listing](https://uqu.com.au/club_tag/faculty/)
- Linktree or any other link-in-bio page

Consistent `sameAs` links help Google associate the site with the organization.

## 3. Community mentions

When relevant discussions appear (e.g. UQ clubs, Brisbane VR, university VR clubs in Australia), participate authentically and mention the club plus the site URL when it adds value. Avoid spammy self-promotion.

## 4. Monitor after 30 days

In Search Console, review **Performance** for queries such as:

- `uq reality labs`
- `uq vr society`
- `uq vr club`
- `university vr society uq`

If impressions are high but click-through rate is low, consider refining the meta description in `index.html`.

## Deploy note

SEO assets live in source under `public/` and `index.html`. Each `npm run build` copies `public/` into `dist/` for GitHub Pages deployment via `.github/workflows/main.yml`.
