# STATE SPACE

Personal site for **Amarthya Thammappa Gari** — four case files, one method, seven data substrates.

Astro + TypeScript, static output, no UI framework, no runtime CSS. The only JavaScript on the
page is The Field (canvas morph engine), the reveal observer, and the local clock.

## Run

```sh
npm install
npx astro dev --port 4321 --host 127.0.0.1
```

`npm run dev -- --port 4321` fails because npm parses the port as an Astro command. Use the
`npx` form above.

```sh
npm run build      # static site into dist/
npx astro preview  # serve dist/
npm run check      # astro check (types + a11y hints)
```

## Structure

```
src/
  pages/
    index.astro              home: hero, The Field, work, method, lab, elsewhere, contact
    work/{verdict,tb-amr,karnataka-transit,sweety}.astro
    404.astro  og.astro      og.astro renders the social card; robots.txt disallows it
    sitemap.xml.ts
  components/
    Hero  Field  WorkIndex  Method  Lab  Elsewhere  Signal  Colophon
    case/CasePage  Section  Plate  Limits
    case/figures/{VerdictTrace,ShapDrivers,FareboxRecovery,SweetySchema}
  lib/field/{topologies.ts,field.ts}
  styles/{tokens.css,global.css}
public/
  Amarthya_T_Resume_cr.pdf   og.png   robots.txt   favicon.svg
scripts/                     dev-only CDP capture utilities (not shipped)
```

## Content rules

- Every number comes from a repository table, an audited account, or the Hugging Face API.
- Every case file ends with **Known limits**. If a metric is not verifiable, the page says so
  rather than rounding it up.
- The Field's topologies are real shapes, not decorative noise: citation clusters, a causal
  attention matrix, a Manhattan plot, bus corridors, daily reading bands, a hypergraph.

## Deploy

Live at [amarthya.netlify.app](https://amarthya.netlify.app). Static output, so any static host
works: `netlify.toml` pins the build command, the publish directory, and Node 22, and every push
to `main` rebuilds.

`astro.config.mjs` sets `site: https://amarthya.netlify.app`. Canonical URLs, OpenGraph URLs and
the sitemap all read from it, so it is the one place to change when the domain changes — but
`public/robots.txt` hard-codes the sitemap URL too, so edit both.

## Notes

- `scripts/*.mjs` drive headless Chrome over CDP to capture review screenshots. They are not part
  of the build and can be deleted.
- `astro.config.mjs` sets `compressHTML: false` on purpose: Astro's condenser deletes the newline
  between an inline tag and the following word, which silently welds words together.
