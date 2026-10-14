# v1.1.0 final candidate — Step 15D

**STEP 15D READY FOR RESEARCHER REVIEW**

Branch: `release/questionnaire-v1.1.0`. RELEASE STATUS: `candidate`. COMMIT / PUSH / TAG: NOT CREATED / NOT EXECUTED / NOT CREATED. Main remains at `2264f00`; published v1.0.x and old tags are unchanged.

## Current version contract

- questionnaireVersion: questionnaire-v1.1.0
- stimulusVersion: rittenhouse-formal-v2
- taskPoolVersion: rittenhouse-formal-task-pool-v5
- datasetId: rittenhouse-formal-snapshot-v2

The user-authorized Step 15B data correction remains: formal SVG/V4 has only 28/113 IDs in common with the old fixed dataset. The consistent snapshot is a new file/ID; the old fixed file and old session metadata remain preserved. Step 15D does not modify either dataset or either V2 SVG.

## Instructions

The time PNG remains. Only the title, one paragraph and the two action buttons remain in the right column. Five cards, repeated hints, subtitle and manual line breaks are removed. The single paragraph is 16 px, line-height 1.85 and letter-spacing .015em. Screenshots and layout checks cover 1280×720, 1440×900 and 1470×956; no horizontal overflow and action buttons remain within each viewport.

Final text:

本次实验使用美国宾夕法尼亚州费城 Rittenhouse Square Park 周边的地点数据，并以 Rittenhouse Square Park 为出发位置。地点名称、类别和用户评论数量来自 Yelp 地点数据。地图按步行时间将周边地点划分为 0–5、5–10、10–15 和 15–20 分钟四个范围，每个文字代表一个地点，文字越大表示该地点的用户评论数量越多。前四个任务中，文字颜色表示地点所在的步行时间范围；第五个任务中，文字颜色表示地点类别。请根据题目要求，在地图中查找地点并完成作答。

## T5

Production generator now draws only `Restaurants` or `Shopping`. All 113 map places and all four existing colors remain. Task prompt: `请在地图中选择【{target_category}】类别中用户评论数量最多的地点。`

| Legend | Count | Color |
|---|---:|---|
| Attractions & Landmarks | 8 | #7B2CBF |
| Restaurants | 68 | #C2410C |
| Hotels & Travel | 8 | #1D4ED8 |
| Shopping | 29 | #047857 |

Legend swatches still come from mounted SVG computed fill. English labels wrap naturally within their own items; counts do not overlap.

Correct answers independently verified by ID, category and review_count against the immutable snapshot:

- Restaurants: Luke's Lobster Rittenhouse, `30cpm1uq6xcQCmN6JTrB8w`, 1161.
- Shopping: Rescue Spa, `X5fWO9e82EICHXzzs6eQMg`, 476.

## PREVis content isolation

New candidate items:

- U1: 我很容易掌握这张可达性地图的阅读方法。
- U2: 我能清楚理解地图中颜色、字号等视觉元素所表达的信息。
- U3: 整体而言，我觉得这张可达性地图容易理解。

`questionnaire-content-v2.js` creates a candidate-only content object. Runtime and export choose it only for v1.1.0. The original content file is untouched; v1.0.0/v1.0.1 sessions and exports use the original wording. L1–L3, R1–R3, stable IDs, Likert choices, validation, grouping and layout remain unchanged. Merger copies source row wording; it does not replace old item text or assume strict measurement equivalence. Version isolation remains in effect.

## Production randomization

Participant order remains T1 → T2 → T3 → T4 → T5. Internal dependency order:

1. Uniform seeded T4 draw from the unchanged exact SVG Top-3.
2. T2 excludes the T4 ring. Remaining 10–15 ring has weight 2; remaining other rings each have weight 3. The stable production hash/choose function selects from eight weighted slots. T2 theoretical marginal probabilities are all 25%.
3. T1 draws from the three rings other than T2.
4. T3 uses the original ordinary-font pool in T4's ring, excluding T4's place. Rank by name-character-length difference, then place ID ASC; seeded choice among the closest three valid candidates. Empty eligible pool throws an error, without expanding the pool.
5. T5 seeded draw from Restaurants / Shopping.

T4 exact candidate set is unchanged:

| Place | ID | Actual font size | Reviews | Ring |
|---|---|---:|---:|---|
| Luke's Lobster Rittenhouse | 30cpm1uq6xcQCmN6JTrB8w | 48.0 | 1161 | 0–5 |
| Chima Steakhouse | gjFUrbSMo1rA1jgG5IhA2A | 41.7 | 697 | 5–10 |
| Ms Tootsie's RBL | ysvzP0VvMTrGmUClKJ3img | 40.2 | 612 | 15–20 |

T3/T4 prompt templates and options remain identical. T2 Top-1 answers and one-slot replacement/scoring are preserved. No timing, scoring or restore logic changes were introduced by Step 15D. Already generated candidate instances remain unchanged on refresh; new sessions use the final generator. No production storage reset or forced rerandomization is added.

## 1,000-seed acceptance

| Ring | T1 | T2 | T3/T4 paired ring |
|---|---:|---:|---:|
| 0–5 | 263 | 252 | 336 |
| 5–10 | 226 | 254 | 331 |
| 10–15 | 244 | 249 | 0 |
| 15–20 | 267 | 245 | 333 |

T4 targets: Luke's 336, Chima 331, Ms Tootsie's 333. T5: Restaurants 488, Shopping 512.

- T3/T4 same-ring rate: 100%.
- T2/T4 duplicate target count: 0.
- T1/T2 same-ring count: 0.
- Same-seed determinism, candidate/answer integrity, T2 Top-1, T4 actual Top-3 and strict missing-pool failure: PASS.
- All specified distribution thresholds pass without widening test limits.

## Asset protection

| Protected asset | Unchanged SHA-256 |
|---|---|
| formal-time-color-v2.svg | cc2e4352d0ce25f9d2d002d35a1002a78920967c4d1ca90d786d42265495fc78 |
| formal-category-color-v2.svg | 65f3f62301b7371296408e466a31ddc3e44fd81933e620a18de0089b2152705b |
| rittenhouse-formal-dataset-v2.json | 1c39c8287b37346faa174c6bbac251e1f42196cc77e6dc1e33cb77f5c509f73f |

113 place IDs, 30/30/30/23 rings and zero geometry mismatches still pass. The new protected checksum fixture makes any Step 15D SVG/data change fail validation. V5 JSON SHA is recomputed in formal-stimulus-checksums-v2.json. V1 SVG/V4/fixed dataset and old generator remain byte-identical to tagged assets. The builder deterministically reproduces the final V5 metadata without changing protected files.

## Browser, restore and XLSX acceptance

Chrome and Safari 26.0.1 both complete the full participant flow and actual result download. Chrome includes three instruction viewports and screenshots of both eligible T5 categories. Both verify paired targets, disjoint targets/rings, final U wording, refresh stability and English legend colors/counts.

Both browsers restore v1.0.0 and v1.0.1 fixtures at T3 ACTIVE, T5 ACTIVE, PREVis 2/3 and completion. Original keys, identities, seeds, V1/V4 instances, answers, widths/colors and questionnaire wording stay intact. Chrome also checks original T2 two-answer scoring and preservation of pre-Step-15D already generated candidate instances.

Exports retain 4 sheets, 5 task rows and 9 PREVis rows. New version metadata is v1.1.0 / formal-v2 / pool-v5 / formal-snapshot-v2. New U wording appears in exported rows; legacy U wording remains original. Hidden condition, candidate_pool, target_ring, task_seed and both target ID names (`target_place_id`, `target_poi_id`) are retained for analysis.

Mixed-version merge imports three versions, preserves every source question, reports zero quality flags, and includes only v1.1.0 in default primary analysis. Old versions remain pre-change / pilot.

## Review artifacts and reproduction

Screenshots: `output/playwright/step15d/01-instructions-single-paragraph.png`, `02-t5-restaurants-english-legend.png`, `03-t5-shopping-english-legend.png`, `04-previs-u1-u3-new-chinese.png`, `05-t3-t4-same-ring-check.png`, plus 1280×720 and 1470×956 instruction images. Image 05 is researcher-only evidence; internal conditions are not added to participant UI.

Evidence: `release-audit/step15d-joint-randomization.json`, `step15d-v2-validator.json`, `step15d-chrome-e2e.json`, `step15d-safari-e2e.json`, `step15d-xlsx-validation.json` and `step15d-instruction-layouts.json`.

Serve the candidate on localhost:8031, then run the V2 validator, V5 randomization test and `test-formal-v2-e2e.cjs` / `test-formal-v2-safari.cjs` using the configured browser runtimes. The scripts default to the Step 15D evidence directory and use committed disposable legacy fixtures.

## Stop point

Keep `RELEASE.json.releaseStatus = candidate`. Stage final changes and run `git diff --cached --check`; do not commit, push, create a tag or deploy. Earlier public concurrent-load acceptance failure remains outside this candidate revision and unresolved. This candidate has not been publicly deployed, as required.


## Step 15E 实验流程变化

新 v1.1.0 会话在实验说明页面累计至少 10,000 ms 的可见阅读时间后，才能主动点击进入 T1。后台暂停、刷新恢复累计时长，已进入任务及旧 v1.0.x 会话豁免。该门槛属于实验方法变化，独立于每题 3→2→1 倒计时及 ACTIVE 时间；session_meta 新增可选 instructions_read_visible_ms / instructions_read_gate_completed 审计项。欢迎页具有 BOOTING/LOADING/READY/ERROR 与有效资源重试，介绍 PNG 不阻断进入基础信息。运行时图例使用 mounted SVG fill 和 13/18/24 px 示意字号，未改变正式刺激或任务随机化。
