# STATE SPACE — Portfolio Plan

> One frame. Seven substrates. One method.

**Owner:** Amarthya Thammappa Gari · Bengaluru
**Stack:** Astro + TypeScript · Vercel · custom domain
**Status:** v1 built — four case files, The Field, Model Lab. Pending deploy decisions
**Last updated:** 17 Nov 2026

---

## 1. Positioning

**Thesis:** I take messy, high-stakes systems — courtrooms, genomes, bus networks, supply chains, model safety — and make them legible. The substrate changes; the method doesn't.

**Hero line (pick one, test with 3 people):**

1. "I've fine-tuned legal LLMs, mapped TB drug-resistance mutations, modelled Bengaluru's bus economics, and built a clinical tracker. Different substrates. Same method."
2. "I build machine learning systems for messy, high-stakes data — then make them explain themselves."
3. "Data scientist by training. Researcher by temperament. Engineer by necessity."

**Audience priority:**
1. Hiring managers / ML leads (will click GitHub and HF within 30 seconds)
2. Recruiters screening breadth (need a 10-second "what does he do")
3. Peers / collaborators (need artifact links)

**Success criteria:**
- A visitor can name 3 of your domains unprompted after 20 seconds.
- A technical visitor finds at least one live demo and one model card.
- Nobody can say "looks like a template."

---

## 2. Core concept

"State space" is native to both chess (search over positions) and ML (latent space), and describes every one of your projects: legal retrieval states, variant states, transit states, supply-chain states.

**The Field** — the signature interaction. One canvas graph that morphs between real topologies:

| Domain | Topology | Source of shape |
|---|---|---|
| Legal RAG (VERDICT) | citation / parent-child chunk graph | 1,000+ SC judgments |
| Legal Llama 3.1 | token stream + attention arcs | ILC corpus |
| Qwen 3.5 2B Abliterated | refusal-vector space, direction subtracted | abliteration metadata |
| TB-AMR | SNP lattice / Manhattan plot | 600 × 158 SNP matrix ||
| Sweety | glucose time-series | reading schema |
| Butterfly Engine | supply-chain hypergraph | in-progress model |

**Behaviour:**
- Auto-cycles every ~6s; cursor proximity distorts edges; clicking a label locks a topology.
- Accessible via a real tab list (arrow keys), not canvas-only. `prefers-reduced-motion` → static field, one topology, no cycling.
- Pauses when off-screen (`IntersectionObserver`).
- Canvas 2D, ~600–900 points, lerped targets. No Three.js.

**Why it works:** one instrument demonstrating seven subjects *is* the polymath argument. Variety lives in the data, not the layout.

---

## 3. Information architecture

| # | Section | Content | Job |
|---|---|---|---|
| 00 | **Index** | Name, thesis line, The Field, live IST clock, availability, CV | Range, instantly |
| 01 | **Practice** | 3 paragraphs + capability matrix (5 rows, evidence links) | Identity |
| 02 | **Work** | 4 deep case files, uniform frame | Depth |
| 03 | **Method** | 4 recurring moves × 3 fields each | Polymath proof |
| 04 | **Lab** | Dark section: HF model cards, abliteration explainer | Research |
| 05 | **Elsewhere** | Compact ledger: chess, MUN, awards, languages | Range beyond code |
| 06 | **Signal** | Email, phone, socials, real form | Conversion |
| — | **Colophon** (footer) | Stack, fonts, a11y notes, last updated | Engineer tell |

**Nav (plain language, 6 items):** Work · Method · Lab · About · Elsewhere · Contact
*(Retires: Node 0, Network Map, Signal Box, Timeline Chain, Toolkit.)*

---

## 4. Case file template

Uniform frame, heterogeneous content. Each case is one Markdown file in `src/content/work/`.

**Layout:**
- Left rail (sticky): case number `CASE 02`, domain, year, status
- Main column: abstract (2 sentences) → spec table → figure plate(s) → method list → result → **known limits**
- Right margin: mono annotations, source refs
- Footer row: links (Code · Live · Model · Dataset)

**Spec table (4 rows):** Problem · Constraint · Approach · Result

**Figure plate:** one bespoke, real-data SVG/canvas per project. Never a stock chart.

| Case | Figure | Real data |
|---|---|---|
| 01 VERDICT | Retrieval trace: query → ranked chunks → grounded answer with distances | semantic distance vs 0.75 threshold |
| 02 TB-AMR | SHAP bar chart, top driver mutations, passenger vs driver | `top_driver_mutations.csv` |
| 03 Karnataka transport | Farebox recovery FY18–FY26 + Shakti share of revenue | `BMTC_Financials.csv` |
| 04 Sweety | Four-slot daily readings + month-to-date report | seed dataset |
| 05 Legal Llama | GGUF quant size vs quality tradeoff | Q4_K_M / Q8_0 |
| 06 Qwen ablation | Refusal rate before/after orthogonalization | abliteration metadata |
| 07 LeetLog | FSRS forgetting curve | FSRS v4 params |

**"Known limits" — mandatory.** 2–4 sentences on what the data couldn't support, where it fails, what you'd do next. Strongest anti-AI signal on the site.

---

## 5. Content inventory (verified 16 Nov 2026)

### Flagship cases (deep)

**01 · VERDICT — Legal Judgment RAG**
- Repo: `AmarthyaT/Verdict-Legal_Judgment_RAG` · Python · Apache-2.0 · ~83 MB
- Parent-child chunking; child chunks for retrieval, parent context for generation
- Fuzzy case routing, Token Set Ratio ≥ 75, catalog of 1,000+ SC judgments
- Semantic rejection at distance threshold 0.75; fictional-case bypass grounded in Article 14 / natural justice / proportionality
- Local mode: Ollama + Llama 3 8B + `BAAI/bge-base-en-v1.5`; cloud mode: Gemini 2.5 Flash
- Streamlit dashboard: glassmorphic tabs, pipeline logs, chunk-score transparency
- HF dataset: `Amarthya11/vector-database-Supreme_court_judgments_india`
- Metrics: 72–76% citation accuracy *(verify methodology before publishing)*

**02 · TB-AMR Variant ML** *(collaboration — 3 of 4 commits, lead engineer)*
- Repo: `Pavithra-Bandaru/TB-AMR-Variant-ML-1` · Python · XGBoost + Balanced RF
- VCF parsing → MAF filtering → stratified 80/20 → 5-fold CV → ROC-AUC / PR-AUC
- TreeSHAP driver-vs-passenger ranking; novel membrane protein + efflux pump candidates
- 600 samples × 158 loci SNP matrix; dual-mode synthetic + real NCBI SRA / BV-BRC
- Streamlit dashboard + end-to-end CLI (`main.py`)
- Metrics: pull exact ROC-AUC / PR-AUC from `results/tables/model_performance.csv`

**03 · Sweety — Clinical Glucose Tracker**
- Repo: `AmarthyaT/sweety_Blood-G` · Node/Express · PostgreSQL · Redis · BullMQ · React (Vite) · Docker
- JWT + bcrypt, per-user query scoping, four fixed reading slots, 40–600 mg/dl validation
- Daily / month-to-date / monthly reports; Recharts chart; doctor role for assigned patients
- Redis cache invalidated on write; BullMQ daily reminder job; RTL tests; 10 screenshots in `docs/screenshots`

### Supporting projects (compact rows)

| Project | Stack | One-liner |
|---|---|---|
| Indian Legal Llama 3.1 (GGUF) | Unsloth, QLoRA, Llama 3.1 8B, ILC | Abstractive summarization of Indian court proceedings; Q4_K_M + Q8_0 quants |
| Qwen 3.5 2B Abliterated | refusal-vector orthogonalization | 24-layer hybrid Gated DeltaNet-Attention, 262k ctx, thinking mode, vision, MCP |
| LeetLog | Next.js 14, Supabase, Groq, FSRS v4, Resend | Auto-imports LeetCode solves hourly, generates AI revision cards, spaced repetition |
| Butterfly Engine *(in progress)* | Python, hypergraphs, causal inference | Supply-chain disruption propagation, "butterfly effect" financial impact |
| Student Result Management | MySQL, HTML | CRUD records, schema design, automated GPA |

### Elsewhere ledger (6 lines, no cards)
- **Chess** — competitive regional tournaments; pattern recognition under time pressure
- **MUN** — Deputy Secretary General (AIMUN-SOC); USG & Head of Finance (AICON 2025); Head of Sponsorships (AICON 2026); jury member and moderator
- **1st place** — Mathematics in Real Life poster: eigenvectors and matrix multiplication for image blur, unblur, edge detection
- **3rd place** — Indian Data Club hackathon: credit-risk prediction (EDA + modeling)
- **Certifications** — KNIME Data Science Professional; Networking & Administration Fundamentals (LinkedIn Learning)
- **Languages** — English C2 · Telugu native · Kannada C1 · Tamil · Hindi B1

---

## 6. Design system

### Palette
```
--paper        #F2EFE6   page
--paper-deep   #E7E2D6   alternate band
--ink          #111110   text, rules
--ink-soft     #55534C   secondary text
--accent       #D93A1F   vermilion — one per screen
--lab-bg       #0B0B0C   Model Lab
--lab-ink      #EDEAE1
--lab-accent   #FF4D1F
```
No gradients except one subtle paper grain. No purple. No glassmorphism outside the VERDICT screenshot (which is the product's own UI).

### Type
| Role | Family | Use |
|---|---|---|
| Display | Archivo (or Inter Tight), 600–700, tight tracking | Name, section titles, case titles |
| Mono | IBM Plex Mono 400/500 | Labels, metadata, figure captions, nav, footnotes |
| Abstract | Newsreader 400 italic | Case abstracts, quotes |

Scale: 12 / 13 / 15 / 18 / 24 / 34 / 52 / 88 px. Self-hosted WOFF2, `font-display: swap`.

### Grid & rules
- 12 columns, 24px gutters, max 1320px; 1px hairline rules `rgba(17,17,16,.18)`
- Figure captions: `Fig. 03 — Retrieval trace, 1,042 judgments in corpus`
- Stamps/annotations: rotated −3°, mono, uppercase, 11px, `opacity .7`

### Motion
- 200–400ms, `cubic-bezier(.22,.61,.36,1)`
- Section reveals only at boundaries; one signature animation per screen
- Full `prefers-reduced-motion` path: no morphing, no parallax, no auto-cycle

### Curated animata components (5 only)
1. **Aperture Reveal** — figure plates on scroll
2. **Animated Timeline** — trajectory / case chronology
3. **Card Stack** — Model Lab HF cards (flip for metadata)
4. **Fluid Tabs** — case sub-sections (Overview / Architecture / Results / Artifacts)
5. **Split Reveal** — preloader: "six substrates · one method"

Everything else custom or omitted.

---

## 7. Anti-slop rulebook

**Banned:** purple/blue gradients · glassmorphism by default · emoji in headings · "Hi, I'm ___ 👋" · skill percentage bars · typing effect on every heading · floating blob ornaments · stock project cards · three-column feature grids with icons · "passionate about leveraging" · fake contact forms · unverified metrics.

**Required:** hairline rules · figure numbers · source footnotes · one rotated stamp · real screenshots · real numbers with provenance · short declarative sentences · a visible "Known limits" in every case · a colophon.

---

## 8. Technical plan

```
portfolio/
├─ astro.config.mjs
├─ src/
│  ├─ layouts/Base.astro
│  ├─ pages/index.astro, work/[slug].astro, 404.astro
│  ├─ components/
│  │   ├─ Nav.astro  Hero.astro  Field.astro  Practice.astro
│  │   ├─ CaseFile.astro  SpecTable.astro  Figure.astro
│  │   ├─ Method.astro  Lab.astro  Elsewhere.astro  Signal.astro  Colophon.astro
│  │   └─ ui/{Tabs,CardStack,ApertureReveal,Timeline,Stamp}.astro
│  ├─ content/work/*.md        (one file per case — Zod schema)
│  ├─ content/models/*.md
│  ├─ lib/field/{topologies.ts,morph.ts,render.ts}
│  └─ styles/{tokens,base,type,layout}.css
├─ scripts/sync-metrics.ts     (build-time GitHub + HF numbers, cached JSON)
└─ public/{figures,shots,cv.pdf,fonts}
```

**Rules**
- Astro islands: only `Field` and `CardStack` ship JS.
- Content collections with Zod schema: `title, domain, year, status, problem, constraint, approach, result, limits, stack[], links{code,live,model,dataset}, figures[]`
- Metrics generated at build time from GitHub/HF APIs, cached and committed — never fabricated.
- Contact: Web3Forms or Formspree endpoint + honeypot + `mailto:` fallback.
- Analytics: Plausible or Umami (cookieless).
- Performance budget: LCP < 1.5s, JS < 90KB gzip, CLS < 0.05, Lighthouse a11y ≥ 98.
- SEO: OG images per case generated from title + figure, `sitemap.xml`, JSON-LD `Person` + `CreativeWork`.

---

## 9. Workstreams (run in parallel)

### A. Credibility cleanup — do first, it gates everything
- [ ] Fix resume link: `github.com/AmartyaT` → `github.com/AmarthyaT` (the current link is a **different account**) — only fixable by re-exporting the PDF
- [x] Verify the "500+ downloads" claim (API shows 69 + 9) — the site now prints the real numbers
- [ ] GitHub bio, profile README, pin 6 repos, add descriptions + topics
- [ ] Archive or populate empty repos: `Parallel-Computing`, `toooo`, `TB-AMR-Variant-ML` (size 0)
- [x] Replace fake contact form — mailto on the page, no form
- [ ] Deploy live demos (biggest gap — currently zero):
  - VERDICT → HF Space (Streamlit)
  - TB-AMR → HF Space (Streamlit)
  - Karnataka → HF Space (Streamlit)
  - Sweety → Vercel (client) + Render (API + Postgres + Redis)
  - LeetLog → Vercel + Supabase
- [x] Export ROC-AUC / PR-AUC from `model_performance.csv` for the TB-AMR figure

### B. Build phases

| Phase | Deliverable | Exit criteria |
|---|---|---|
| 0 | Scaffold: Astro, tokens, type, layout shell, nav, footer, 404 | Renders on mobile + desktop, Lighthouse a11y ≥ 95 |
| 1 | The Field: 6 topologies, morph engine, tab fallback, reduced-motion | 60fps on mid-range laptop; keyboard operable |
| 2 | Case file template + VERDICT as reference case | Pattern locked; one case fully written |
| 3 | Remaining 3 flagship cases + 7 figures | All figures use real data; limits written |
| 4 | Method, Lab (dark), Elsewhere, Signal, Colophon | No placeholder copy left |
| 5 | Polish: OG images, sitemap, analytics, perf, cross-browser | LCP < 1.5s, JS < 90KB |
| 6 | Deploy + domain + post-launch checklist | Live URL, CV linked, all demo links resolve |

**Built:** phases 0–5 except analytics. `astro check` is clean. OG card at `/og.png`, `sitemap.xml` and `robots.txt` ship. Analytics is the one deliberate omission — decide between Plausible, Umami, or nothing.

---

## 10. Open questions

1. **Domain** — own domain (e.g. `amarthya.dev` / `amarthya.in`), or `*.vercel.app` to start?
2. **CV** — replace `Amarthya_T_Resume_cr.pdf` with a clean export (remove the `_cr` suffix, fix the GitHub link, verify download count)?
3. **Photo** — include a portrait, or stay type-only? (Type-only is more credible for a research-desk aesthetic; a single high-contrast B&W portrait in the About margin could also work.)
4. **Butterfly Engine** — publish as "in progress" with an honest status, or omit until there's a result?
5. **Qwen abliteration** — how much detail? It's your boldest artifact and a genuine differentiator, but it needs careful framing as safety research.
