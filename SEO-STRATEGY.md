# Hidden Doors — SEO standard

Semantic ownership of queries and planned URLs is defined in `SEO-SEMANTIC-MAP.md`. Check that map before creating or materially rewriting any indexable page.

## Status

Current GitHub Pages URL is a staging/test environment:

- https://satana6667292-droid.github.io/hidden-doors-website/
- Pages must stay `noindex,follow` until the final production domain is connected.
- Before production launch, replace the staging origin in canonical, Open Graph, JSON-LD, sitemap and robots.txt with the final domain.
- Only after the final domain and redirects are checked change robots meta from `noindex,follow` to `index,follow`.

## Core SEO goals

1. Commercial traffic for hidden and interior doors.
2. Manufacturer intent: Hidden Doors as a door manufacturer.
3. Product-system intent: 36 / 42 / 59 mm.
4. B2B traffic: dealers, designers/architects, developers and construction companies.
5. Local intent through real dealers/regions, without duplicate doorway pages.
6. Informational traffic through useful guides that lead into product pages.

## URL structure

Use lowercase Latin URLs, short paths, no query parameters for indexable content and no `index.html` in internal links.

Current:
- `/` — manufacturer / brand / main commercial landing.
- `/doors/36/` — 36 mm interior doors.
- `/doors/42/` — 42 mm concealed doors.
- `/doors/59/` — 59 mm concealed doors.

Planned:
- `/ready-doors/` — ready/in-stock doors.
- `/projects/` — completed projects.
- `/production/` — manufacturing/factory.
- `/dealers/` — dealer program.
- `/designers/` — designers and architects.
- `/developers/` — developers/construction companies.
- `/where-to-buy/` — dealer network / where to buy.
- `/contacts/` — contacts.
- `/blog/` or `/guide/` — expert guides.

Future model/collection pages should be children of their system, for example:
- `/doors/36/modena/`
- `/doors/36/siena/`

City/region pages are created only when there is real local value: actual dealer/contact, showroom, delivery terms, projects or unique local content. Do not mass-generate near-duplicate city pages.

## Search intent map

### Homepage
Primary intent:
- hidden doors manufacturer
- interior doors manufacturer
- Hidden Doors

The homepage explains the brand, the three systems, production, projects and routes visitors into the correct product/B2B page.

### /doors/36/
Primary intent:
- interior doors
- frame-panel interior doors
- 36 mm doors
- door leaf + trim/mouldings in one style

### /doors/42/
Primary intent:
- concealed doors
- hidden doors
- flush-to-wall doors
- concealed doors 42 mm
- plywood/aluminium frame

### /doors/59/
Primary intent:
- concealed doors 59 mm
- aluminium-frame concealed doors
- tall concealed doors
- doors up to 2950 mm

### /dealers/
Primary intent:
- door manufacturer for dealers
- wholesale doors from manufacturer
- Hidden Doors dealer program

### /designers/
Primary intent:
- concealed doors for designers/architects
- technical solutions for interior projects

### /developers/
Primary intent:
- door supplier for developers/construction companies
- doors for residential/commercial projects

## Metadata rules

Every indexable page must have unique:
- `title`
- `meta description`
- one visible `h1`
- canonical URL
- Open Graph title/description/url/image
- meaningful image alt text

Do not use one title/description template unchanged across multiple pages.

Title formula:
`Primary query / product — differentiator | Hidden Doors`

Description formula:
`What it is + key differences/specs + commercial next step/brand fact`

Avoid keyword stuffing.

## Heading structure

- Exactly one main `h1` per page.
- `h2` = major intent/content blocks.
- `h3` = subtopics inside an H2.
- Do not choose heading levels for visual size only.
- The H1 and first screen must clearly explain what page the user landed on.

## Content standard for product pages

Each commercial product/system page should eventually contain:

1. Clear first screen: what the system is and who it is for.
2. Key advantages without generic marketing filler.
3. Sizes and technical possibilities.
4. Construction / frame.
5. Opening/reverse options where applicable.
6. Finishes and materials.
7. Box / trim / hardware / configuration.
8. Real interior/project examples.
9. Comparison with adjacent Hidden Doors systems.
10. FAQ based on real customer questions.
11. CTA to calculate/select.
12. Internal links to relevant guides, projects and B2B pages.

## Internal linking

Every important page must have at least one crawlable HTML link from another relevant page.

Rules:
- Homepage links to 36/42/59, production, projects, dealers, where-to-buy.
- Product pages cross-link to adjacent systems.
- Guides link to the relevant product system.
- Projects link to the system used when known.
- B2B pages link to technical/product pages.
- Use descriptive anchor text, not repeated "read more" everywhere.

## Images

- Use descriptive filenames for new SEO images when practical.
- Every meaningful image gets accurate `alt`.
- Decorative images use empty `alt=""`.
- Prefer WebP/AVIF for photos when supported by workflow.
- Do not stuff keywords into alt text.
- Main social image should be at least suitable for large social preview cards.

## Structured data

Current baseline:
- Homepage: Organization + WebSite.
- Product/system pages: WebPage + BreadcrumbList. Add Product markup only when the page contains enough real commercial data (for example Offer/price or eligible review data) to satisfy current search-engine requirements.

Only mark up information that is actually visible/true on the page.
Do not add fake reviews, ratings, prices or availability.

Future page types:
- FAQPage only when applicable and compliant with current search-engine rules.
- LocalBusiness/Organization for real locations.
- Article/BlogPosting for guides/articles.

## Technical rules

- HTTPS only.
- Mobile-first responsive layout.
- Clean URLs ending with `/` for sections/pages.
- Self-canonical on production.
- Production XML sitemap contains only canonical indexable URLs. The staging sitemap may be kept for prelaunch validation but is not submitted to search consoles.
- robots.txt points to production sitemap.
- No broken internal links.
- Real 404 response for missing URLs.
- Avoid duplicate `index.html` links.
- Avoid indexable filter/query duplicates.
- Keep primary content in rendered HTML, not dependent on user interaction.
- Maintain Core Web Vitals / image dimensions / lazy loading below the fold.

## Staging -> production checklist

Before indexing the final site:

1. Connect final domain.
2. Force HTTPS.
3. Replace staging origin everywhere with final origin.
4. Confirm clean URL redirects and remove duplicate `index.html` URLs.
5. Set every production canonical to itself.
6. Change intended pages to `index,follow,max-image-preview:large`.
7. Keep service/private/dealer-auth pages `noindex` as appropriate.
8. Generate production sitemap.xml.
9. Update robots.txt with production sitemap.
10. Validate JSON-LD.
11. Check all titles/descriptions/H1s for uniqueness.
12. Check 404 and redirects.
13. Add site to Yandex Webmaster and Google Search Console.
14. Submit sitemap.
15. Connect analytics/goal tracking before traffic launch.

## SEO workflow for every new page

Before building:
1. Define page intent.
2. Assign one primary query cluster; avoid cannibalizing an existing page.
3. Choose permanent URL.
4. Define H1, Title, Description.
5. Define required sections based on user questions.
6. Define internal links in/out.

Before merge:
1. Validate HTML semantics.
2. Validate canonical.
3. Validate metadata.
4. Validate structured data.
5. Check mobile.
6. Check page speed/image weight.
7. Add URL to sitemap when it becomes indexable.
