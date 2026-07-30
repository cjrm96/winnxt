# WINNXT Campaign Tools — Project Handoff

**Owner:** Cole (cole@getinsights.org) · **Business:** WINNXT (Hayley Marting), political communications firm
**Date of handoff:** July 30, 2026
**Status:** Research complete. Product set chosen. Nothing built yet.

> **Read this first.** This document is the complete context for a new Claude session with no prior history. It contains the research, the decisions already made, the open questions, and the technical spec. You should not need to re-research anything to start building.

---

## 1. What we're building and why

WINNXT sells DIY political campaign products to small local campaigns — school board, city council, county, small state house. Currently the Etsy store sells Canva graphic templates at $9.95–$14.95.

**The plan:** add a line of *process tools* — interactive single-file HTML apps and Claude skills — that solve the things templates can't. Sell them on the existing Etsy store, build them in GitHub.

**The core insight from research:** roughly 95% of what's for sale in this market is graphics. Nobody sells process, sequence, or deadlines. That's the gap.

### The business as it stands

| | |
|---|---|
| Website | https://www.winnxt.com/ |
| Etsy shop | https://www.etsy.com/shop/WINNXTetsy |
| Live since | 2024 |
| Sales | 122 |
| Listings | 14 (11 Canva template packs, 3 conservative vinyl stickers) |
| Price band | $9.95–$14.95 digital, $3–$4 stickers |
| Rating | 4.9 from 5 reviews, 13 admirers |
| Brand voice | "We don't believe in fluff — because neither will your voters." Direct, no-nonsense, anti-jargon. |
| Positioning | Currently Republican-leaning. See open decision #1. |

**Existing listings** (useful for bundling): campaign logo templates, Facebook/Instagram ad templates, business card + flyer + door hanger bundle, bumper stickers, **political endorsement graphics**, event social graphics, yard signs, website banner ads, door hangers.

### The single most important data point

The shop's one 4-star review reads: **"Requires you to purchase canva subscription."**

That is a customer penalizing an undisclosed dependency. Claude skills have the identical problem — the buyer needs a Claude subscription. On a shop with five total reviews, a couple of those drops the rating below 4.0 and the shop is done.

**This is the primary reason we favor self-contained HTML tools over skills wherever the format allows.** An HTML file has zero dependencies. It is the structural fix for the shop's known failure mode.

---

## 2. Market research findings

### The buyer

- **67% of school board members in small districts report total campaign spend under $100.** In large districts, 55% spent over $5,000. The market is bimodal; the money is in the large-district half.
- Realistic local budgets: $1,000–$3,000 low, $3,000–$10,000 competitive, $10,000–$25,000+ large town or countywide.
- **~30% of local candidates have zero staff. Another 40% have one to three people.**
- The most-valued thing Run for Something provided candidates was not training — it was a human who "knew my important deadlines/dates."
- Universal fundraising verbatim: *"I just hate asking people for money."* Consultants call call time "a candidate's worst nightmare."
- Consultant rule of thumb: take what a first-timer says they'll raise, cut it in half, then in half again. That's the real budget.
- Best marketing quote available: a first-time candidate wrote, *"We need help. I am a first-time candidate and I only look like I know what I am doing."*
- She Should Run lists **"I have skeletons in my closet"** as a top barrier to running at all. Directly relevant to product #2.

### The competition

| Product | Price | What it is |
|---|---|---|
| Local Kit Co. school board kit (Etsy) | $35 | Canva templates + 6-week calendar. **9 shop sales total** — category is wide open |
| Campaign Toolkits (direct site) | $99–$225 | 89 social templates. Pitched as "$1,500+ consultant value" |
| Political Guide 101 (Gumroad) | $550 | The only real process product. Includes a crisis manual and endorsement strategy |
| GoodParty.org | Free | AI campaign plan + content builder. Nonpartisan/independent |
| Online Candidate | $29/mo | Websites + a school board content/SEO moat |

### Verified gaps — things nobody sells

1. **Any campaign endorsement tracker at all.** Searches return generic business spreadsheets. Zero competition.
2. **A self-vetting / vulnerability instrument.** Every consultant says do it. Nobody sells the tool.
3. A jurisdiction-aware compliance deadline calendar.
4. Structured call-time systems under $100.
5. Candidate forum and debate prep drills.
6. Anything at all for the **pre-filing window**, where consultants say the fatal errors happen.

### Crisis comms is the thinnest space in the market

The only comparable product is one chapter inside a $550 Gumroad bundle. WINNXT already owns a real framework here (section 4 below). This is the strongest competitive position in the whole plan.

Documented local crisis cases worth citing in listing copy:
- A St. Petersburg, FL city council candidate dropped out days after old tweets surfaced.
- A Norman, OK council member resigned within three months of a Facebook exchange spreading in local groups, then being amplified nationally.
- **The pattern is always local Facebook group first, national amplification second.**
- Reuters documented 200+ instances of school board members harassed or threatened. 73% of tracked incidents came from people not physically present.

---

## 3. The product set

Five products, chosen from a brainstorm of 29. Format assigned per product based on what the format is actually good at.

| # | Product | Format | Price | Build priority |
|---|---|---|---|---|
| 1 | **Self-vet & vulnerability audit** | HTML | $34 | **Build first** |
| 2 | **Crisis triage & rapid response** | HTML | $39 | Second |
| 3 | **Endorsement engine** | HTML | $34 | Third |
| 4 | **Message foundation** (your why + top three issues) | Claude skill | $24 | Fourth |
| 5 | **Call time & the ask** | Claude skill | $34 | Fifth |
| — | **Pre-filing readiness check** | HTML | **Free** | Lead magnet, build alongside #1 |

**Bundle all five at $99.** That's what Campaign Toolkits charges for 89 static graphics. It also triples the store's current basket ceiling.

### Why each format was chosen

**HTML wins when the value is structure, privacy, or persistence:**
- *Self-vet* — privacy is the entire selling point. A candidate listing their skeletons does not want that list in a cloud chat log. "Runs entirely in your browser, nothing is uploaded, close the tab and it's gone" is a guarantee no competitor can match, and it's the specific reason a nervous first-timer avoids this exercise.
- *Crisis triage* — it's a decision tree. Works at 11pm with no login, which is exactly when a crisis lands.
- *Endorsement engine* — a tracker plus a reusable answer bank is a database. Skills are bad at persistence.

**Skills win when the value is judgment and drafting:**
- *Message foundation* — the value is entirely in the interrogation. A fill-in-the-blank HTML version produces mush.
- *Call time & the ask* — role-playing the actual phone call is the whole product.

### The hybrid pattern — build this into every HTML tool

Static HTML can score, branch, and organize. It cannot write. So every HTML tool ends with a **"Continue with Claude" handoff block**: a generated, copy-pasteable prompt containing the user's structured inputs.

This does three things at once: it removes the ceiling on what a static tool can deliver, it converts a $34 download into a funnel toward the paid skills, and it creates a warm lead for WINNXT consulting. Treat the handoff block as a core feature, not an afterthought.

---

## 4. WINNXT's crisis framework (source IP)

This came from a PDF titled `WINNXT-Crisis-Communications-Framework.pdf`. **That file did not travel with this handoff — Cole should re-upload it to the new account.** The substance is transcribed below because it's the foundation of product #2.

### 4.1 Crisis risk assessment matrix — DEFENSE

| Quadrant | Description | Response strategy |
|---|---|---|
| **True & doesn't hurt** | Factual, neutral or positive. No real damage. | Acknowledge or amplify to build trust. Share proactively. |
| **True & does hurt** | Factual and damaging. Erodes trust if ignored. | Admit swiftly with context, apologize, outline fixes. Focus on empathy and action. |
| **False & doesn't hurt** | Untrue but harmless or even helpful. | Ignore or monitor. Don't respond — responding draws attention. Let it fade. |
| **False & does hurt** | Untrue and damaging. Risks chaos and lost support. | Deny firmly with facts using a "truth sandwich": state truth, briefly note the falsehood, restate truth. Discredit sources if needed. |

### 4.2 SCCT framework (Situational Crisis Communication Theory)

| Crisis type | Description | Response strategy |
|---|---|---|
| **Victim** (low blame) | External factors caused it; you're seen as a victim. | **Diminish** — downplay your role, use sympathy to rally support. |
| **Accidental** (minimal blame) | Unintentional error; public sees a slip-up. | **Excuse** — admit but explain context; focus on fixes to show competence. |
| **Preventable** (high blame) | Intentional or avoidable. Heavy scrutiny. | **Rebuild** — apologize deeply, offer concrete change, bolster with endorsements. |

This mapping prevents the two classic errors: over-apologizing for something that wasn't your fault, and under-apologizing for something that was.

### 4.3 Strategic crisis planning grid

| Risk level | Preparation | Detection | Response | Recovery |
|---|---|---|---|---|
| **Low** (routine) | Train on basics | Social media scans | Quick fixes | Minor reviews |
| **Medium** (emerging) | Ally with mentors | Track opponents | Use proxies for pushback | Gather feedback |
| **High** (major scandal) | Prep legal/PR | Real-time alerts | Apologize + pivot | Rebrand with wins |
| **Extreme** (career-threatening) | Scenario drills | Crisis hotlines | Full debunk if false; rebuild if true | Long-term strategy shift |

### 4.4 CERC phase playbook

| Phase | Key actions | Local adaptation |
|---|---|---|
| **Pre-crisis** | Build alliances, monitor risks, develop message templates | Prep talking points on local issues; network with endorsers for quick support |
| **Initial** | Acknowledge fast, express empathy, provide facts | On a viral rumor: short statement owning facts if true, debunking if false |
| **Maintenance** | Update regularly, address rumors, show action | Press briefings or social updates to maintain transparency |
| **Resolution** | Evaluate lessons, thank supporters, plan recovery | "What I learned" op-ed to humanize and strengthen the platform |

### 4.5 ⚠️ The offense matrix — DO NOT SHIP

The source PDF also contains an **offense** version of the quadrant matrix, advising how to exploit an opponent's vulnerabilities. It includes guidance on amplifying unverified claims, retweeting anonymously, and routing attacks through surrogates. WINNXT's own document labels this "High ethical/legal risk."

**Decision made: the retail product ships defense-only.**

Rationale: sold under WINNXT's name to strangers on a public marketplace, that section is a screenshot waiting to happen and the kind of thing a local reporter writes up. It also adds no commercial value — candidates buy protection, not attack tooling. Keep the offense matrix as client-only consulting IP behind an engagement agreement.

**Do not include offense content in any repo file that ships to a customer. Do not reference it in listing copy.**

---

## 5. Open decisions — need Cole's input before build

### Decision 1: Partisan or nonpartisan?

WINNXT is positioned as Republican-focused, and the sticker line is explicitly conservative ("Young Conservative and Not Sorry"). But school board and municipal races are frequently nonpartisan, and going neutral roughly doubles the addressable market.

Options: keep the firm and stickers partisan while shipping the tools nonpartisan; or lean into the Republican niche as a differentiator against GoodParty and the Democratic-aligned free trainers.

**Note regardless of the answer:** ActBlue excludes Republicans entirely and doesn't serve Connecticut. Any fundraising content must recommend a nonpartisan processor — Anedot (2.9% + $0.30) or Raise The Money.

**Recommendation:** nonpartisan tools, partisan brand. The tools are process, and process is apolitical.

### Decision 2: Pricing confirmation

The store's current ceiling is $14.95. The proposed range is $24–$39 with a $99 bundle. Research supports it — a reviewer literally wrote that these templates are what "other political communication firms charge thousands of dollars for" — but it's a real jump and Cole should confirm.

### Decision 3: Compliance products — in or out?

Recommendation is **out for v1**. Thresholds range from $1,000 in New York to $2,000 in California to $7,000 in Washington. Filing authority might be the state, the city secretary, or the school district secretary. Florida penalties run $50/day escalating to $500/day with no extension. A wrong number under WINNXT's name in a race that gets fined is a liability that isn't worth $29.

If it ships later, it ships as *process only* — a "go find these nine facts" worksheet plus a deadline calendar generated backward from the election date. Never publish a specific state's dollar figures.

### Decision 4: Etsy delivery mechanics

Etsy allows up to 5 files per listing, 20MB each. A single-file HTML tool is tiny, so no constraint there.

**DECIDED (Hayley, July 30 2026): standalone `.html` file sold directly on the Etsy store. No zip.** Buyers download one file and double-click it. A one-page PDF quickstart ships alongside it in the same listing.

This makes the single-file, zero-network build requirement in section 6 non-negotiable — there is no wrapper, no installer, and no second chance to fix a broken file.

Still to confirm: that Etsy accepts `.html` as a digital download file type. If it does not, the fallback is a `.zip` containing the single `.html`, with the quickstart PDF explaining the one unzip step.

---

## 6. Technical spec — HTML tools

### Hard requirements

**Single file. Zero network requests. Ever.**

This is not a preference, it's the product promise. The privacy guarantee ("nothing leaves your browser") is the primary selling point of the self-vet tool and it is void if the page makes any outbound request. Consequences:

- **No CDN links.** No Google Fonts, no Tailwind CDN, no Chart.js from cdnjs. Everything inlined.
- **System font stack only.** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Inline SVG icons.** No icon webfonts.
- **No analytics, no telemetry, no error reporting.** Not even self-hosted. If you want usage data, ask for it in a follow-up email, not in the file.
- Consider adding a `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">` as a belt-and-braces guarantee — and as a thing you can point to in the listing copy.

**Must work from the `file://` protocol.** Buyers will double-click the file from their downloads folder. This rules out:
- ES modules (`<script type="module">`) — blocked by CORS on `file://`
- `fetch()` of any local resource
- Web workers loaded from a separate file

Use a plain `<script>` block. Vanilla JS. No framework, no build-time module resolution in the shipped artifact.

**Data handling:**
- `localStorage` is **opt-in only**, behind an explicit checkbox that explains the tradeoff. A visible "erase everything" button must be present at all times and must actually clear storage.
- If storage is off, warn on `beforeunload` that data will be lost.

**Export:**
- PDF via `window.print()` with a dedicated print stylesheet. No PDF library.
- Plain text / JSON via `Blob` + `URL.createObjectURL` download. Works on `file://`.

**Handoff block:**
- Generates a formatted prompt containing the user's structured inputs.
- Copy button via `navigator.clipboard.writeText()`, with a `document.execCommand('copy')` fallback for older browsers on `file://`.

**Other:**
- Mobile responsive. A meaningful share of buyers will open this on a phone.
- Accessible: real `<label>` elements, keyboard navigable, visible focus states, semantic headings.
- Visible WINNXT branding and a link to winnxt.com. These files are trivially copyable and resellable — treat this like the Canva files, a volume business rather than a defensible one, and make sure every copy in the wild is an advertisement.
- Dark mode via `prefers-color-scheme` is nice-to-have, not required.

### Suggested repo structure

```
winnxt-campaign-tools/
├── README.md                     # setup, build, deploy
├── HANDOFF.md                    # this document
├── docs/
│   ├── market-research.md
│   ├── brand-voice.md            # WINNXT tone rules for all copy
│   ├── crisis-framework.md       # section 4 above, defense only
│   └── etsy-listings/            # title, description, tags, images per SKU
├── src/
│   ├── shared/
│   │   ├── styles.css            # design tokens, print styles
│   │   ├── storage.js            # opt-in localStorage wrapper + erase
│   │   ├── export.js             # print + blob download
│   │   └── handoff.js            # Claude prompt block generator
│   └── tools/
│       ├── self-vet-audit/
│       │   ├── index.html
│       │   ├── questions.js      # question bank, 7 sections
│       │   └── scoring.js        # likelihood × severity → action tier
│       ├── crisis-triage/
│       ├── endorsement-engine/
│       └── pre-filing-check/     # free lead magnet
├── skills/
│   ├── message-foundation/SKILL.md
│   └── call-time-ask/SKILL.md
├── build/
│   └── inline.js                 # bundles src → single-file dist
└── dist/                         # shippable artifacts, one .html each
```

**On the build step:** developing in a single file is miserable, but the deliverable must be one file. Write a small Node script that inlines CSS and JS into the HTML, or use `vite-plugin-singlefile`. Verify every `dist/` output by opening it from `file://` with the network tab open and confirming **zero requests**. Make that a checklist item, not a hope.

### Self-vet audit — functional spec (build first)

Seven sections. For each item the user flags, capture: a one-line description, likelihood of surfacing (high/medium/low), and severity if it does (severe/serious/survivable).

Section outline, drawn from the standard political vetting scope:

1. **Finances** — debts, bankruptcies, liens, tax issues, judgments
2. **Legal** — criminal record, civil litigation, restraining orders, professional discipline
3. **Past statements** — social media across all accounts including abandoned ones, forum posts, letters to the editor, recorded remarks
4. **Employment & business** — firings, disputes, conflicts of interest, business partners, license issues
5. **Personal & family** — relationships, family members' public issues, residency history
6. **Affiliations** — organizations, donations, endorsements given, prior campaign involvement
7. **Credentials & record** — education claims, job titles, military service, prior voting record and attendance

Scoring produces a three-tier action per item:
- **Draft a statement** (high likelihood + severe/serious) — needs a prepared response ready to go
- **Get ahead of it** (any likelihood + severe) — pre-empt proactively; "everyone knows that, it's old news" is the goal
- **Prepare an answer** (lower risk) — know what you'd say, don't volunteer it

Output: a printable risk register sorted by tier, plus the Claude handoff block for drafting the actual statements.

**Framing to use throughout the tool and in the listing copy:** *your supporters can forgive almost anything except being surprised.* That line came out of the consultant research and it's the entire value proposition in nine words.

### Skills spec (products 4 and 5)

Standard Claude skill format: a `SKILL.md` with YAML frontmatter (`name`, `description`) plus markdown instructions.

Critical constraint: **a skill sold to a stranger cannot assume any connected tools.** No Gmail, no CRM, no voter file, no web access. Everything must work from conversation alone — structured interview in, drafted artifact out. Anything requiring live data will break in a buyer's hands and generate refunds.

Packaging for Etsy: a `.skill` zip (a zipped directory containing `SKILL.md`) plus a one-page install PDF. **The Claude subscription requirement must be disclosed in the listing title, the first line of the description, and the first product image.** See section 1 — this is the shop's known failure mode.

---

## 7. Suggested build sequence

1. **Confirm the four open decisions** in section 5 with Cole. Partisan positioning and Etsy `.html` support both affect the build.
2. **Set up the repo** with the structure above, plus the shared modules and the inline build script. Prove the single-file, zero-request pipeline works end to end before building any product logic.
3. **Build the pre-filing readiness check** (free lead magnet) as the pipeline test. It's the simplest tool, it validates the whole toolchain, and it's the funnel entry point.
4. **Build the self-vet audit.** Highest-value, cleanest gap, strongest privacy story.
5. **List both on Etsy.** Get real feedback and real reviews before building three more products. The store has 122 sales and 5 reviews — the constraint is market validation, not product count.
6. **Then** crisis triage, endorsement engine, and the two skills.

---

## 8. Guardrails

Carry these forward into every session on this project.

- **Offense matrix never ships.** Defense-only in anything a customer touches. See 4.5.
- **No state-specific compliance figures.** Process only, or nothing. See decision 3.
- **The privacy claim must be literally true.** No network requests, no telemetry, no exceptions. If a future feature needs a server, it becomes a separate product with different marketing — it does not quietly get added to a tool sold on a privacy promise.
- **Disclose dependencies up front.** In the title, the description's first line, and the first image. The 4-star Canva review is the canary.
- **Nothing that reads as legal advice.** The harassment/threat concept and all compliance content sit near this line. Point to authorities and lawyers; don't substitute for them.
- **Voice check:** direct, unfluffy, no jargon, no corporate filler. WINNXT's own line is *"We don't believe in fluff — because neither will your voters."* Copy should sound like a blunt consultant, not a SaaS landing page.

---

## 9. Concepts not selected (v2 candidates)

From the 29-item brainstorm, these were ranked highest among the ones cut. Full reasoning is in `WINNXT-Claude-Skills-Brainstorm.md`, which should travel with this document.

- **Ballot statement & voter guide writer** — the sleeper pick. Many jurisdictions cap the official voter guide statement at 200–400 words, sometimes with a per-word fee, and it's often the only campaign material every voter sees. Hard deadline, universal, cheap to build, sold by nobody. **If a sixth product gets built, make it this one.**
- Resurfaced post playbook (would fold into crisis triage)
- Holding statement drafter, attack response decision tree, apology architect
- Local Facebook firestorm response
- Harassment & threat response — real demand, needs careful handling
- Endorsement screening interview prep, endorsement sequencing & rollout
- House party kit, finance plan reverse-engineer, PAC ask builder, donor stewardship
- Compliance intake & deadline calendar, money hygiene coach
- Stump speech builder, message discipline coach, announcement day package, candidate bio ladder

---

## 10. Files to bring to the new account

- **This document.**
- `WINNXT-Claude-Skills-Brainstorm.md` — the full 29-concept brainstorm with per-concept pricing, difficulty, and buyer triggers.
- `WINNXT-Crisis-Communications-Framework.pdf` — the source IP for product #2. Section 4 above transcribes the substance, but the original should come along.

---

## Sources

Store and site: [WINNXTetsy](https://www.etsy.com/shop/WINNXTetsy) · [winnxt.com](https://www.winnxt.com/)

Candidate research: [Run for Something 2020 debrief (PDF)](https://runforsomething.net/wp-content/uploads/2021/01/RFS-2020-Candidate-Debrief.pdf) · [RFS post-2018 research](https://runforsomething.medium.com/research-why-people-run-for-office-what-helps-them-succeed-and-what-gets-in-their-way-bc92c82255c8) · [She Should Run, 26 common barriers](https://www.sheshouldrun.org/resources/26-common-barriers-to-running-for-office/) · [Brookings school board survey](https://www.brookings.edu/articles/main-findings-from-a-survey-of-americas-school-board-members/)

Consultant sources: [Ozean Media, 15 campaign mistakes](https://ozeanmedia.com/political-consulting/15-campaign-mistakes-first-time-candidates-make-running-for-political-office/) · [C&E, 6 mistakes local candidates make](https://campaignsandelections.com/industry-news/6-mistakes-local-candidates-make/) · [C&E, the art of rapid response](https://www.campaignsandelections.com/campaign-insider/the-art-of-rapid-response) · [Trail Blazer, handling negative campaign issues](https://www.trailblz.com/Articles/handling-negative-campaign-issues) · [Scarlet Strategies, cost of local office](https://www.scarletstrategies.com/post/how-much-it-really-costs-to-run-for-local-office) · [Running for School Board, costs](https://runningforschoolboard.info/faq/cost-run-school-board/)

Competition: [Local Kit Co. school board kit](https://www.etsy.com/listing/4324662507/school-board-election-kit-canva) · [Campaign Toolkits](https://campaigntoolkits.com/shop/) · [Political Guide 101](https://politico101.gumroad.com/l/lonfk) · [GoodParty](https://goodparty.org/)

Endorsements: [Close the Gap CA, winning a labor endorsement](https://closethegapca.org/what-you-need-to-know-about-winning-a-labor-endorsement/) · [OC Labor COPE process](https://oclabor.org/cope-endorsements/) · [IATSE endorsement process (PDF)](https://iatse.net/wp-content/uploads/2023/07/How-to-Establish-a-Local-Union-Candidate-Endorsement-Process83.pdf) · [PP Advocates Mar Monte process](https://www.plannedparenthoodaction.org/planned-parenthood-advocates-mar-monte/elections/endorsement-process)

Crisis: [WFLA, St. Pete candidate drops out](https://www.wfla.com/news/pinellas-county/candidate-drops-out-of-st-pete-city-council-race-after-controversial-tweets-surface/) · [NBC, threats to local officials](https://www.nbcnews.com/politics/local-officials-threats-harassment-data-rcna146063) · [Governing, on self-vetting](https://www.governing.com/archive/gov-ralph-northam-importance-opposition-research.html) · [CampaignNow, oppo research on yourself](https://www.campaignnow.com/blog/doing-political-campaign-opposition-research-on-yourself)

Fundraising: [The Campaign Workshop](https://www.thecampaignworkshop.com/blog/political-campaign/campaign-fundraising) · [Nominee, discomfort of asking](https://www.gonominee.com/insights/fundraising-how-to-get-over-the-discomfort-of-asking-for-money) · [Indivisible house party 101](https://indivisible.org/resource/house-party-101-how-put-fun-fundraising/) · [ActBlue pricing](https://www.actblue.com/pricing/)

Compliance: [FPPC 2026 local filing schedule (PDF)](https://www.fppc.ca.gov/siteassets/documents/tad/filing_schedules/2026/2026_local_nov_01_cand_final.pdf) · [WA PDC mini vs. full reporting](https://www.pdc.wa.gov/registration-reporting/candidates-committees/registration-reporting-basics/choosing-mini-or-full-reporting) · [TX Ethics local candidate guide (PDF)](https://www.ethics.state.tx.us/data/resources/guides/coh_local_guide.pdf) · [FL late-filing fine calculation (PDF)](https://soe.dos.state.fl.us/pdf/DE-Guide-0013-Calculation-of-Fine-for-Late-Campaign-Treasurers-Report.pdf)
