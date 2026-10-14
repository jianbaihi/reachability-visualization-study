# Questionnaire v1.1.0

Release status: frozen. Release tag: `questionnaire-v1.1.0`.

This release incorporates the approved Step 15B–15E.1 experiment revision: the formal SVG/V4-derived dataset snapshot authorized by the researcher, v2 category colors/contours, T2 one-answer Top-1, T3/T4 pairing in the same walking ring, T4 actual-font Top-3 targets, T5 Restaurants/Shopping targets with all four English legend categories, revised U1–U3 wording, and a minimum 10,000 ms of visible instruction reading. These are methods changes relative to v1.0.x. Task 3→2→1/ACTIVE timing stays independent of instruction reading.

Step 15F changes delivery and compatibility only. Welcome loads navigation/UI without XLSX, JSZip, task generators, task JSON, or formal SVGs. Instruction entry prefetches task configuration; task entry still requires pool/snapshot integrity and 113 mounted places. Local export dependencies are prefetched at PREVis/loaded on export with shared requests, bounded timeouts and retry. Static PNG pixels/display sizing are unchanged. Four duplicate CSS minimum-viewport rules that hid formal tasks were removed; short desktops scroll naturally. Approved reading-button and one-column legend UI are unchanged.

Chrome simulated 100 ms / 250,000 bytes/s empty-cache median READY improved from 7.082 s to 1.220 s (82.8%). Local normal-cold medians: Chrome 0.173→0.081 s, Safari 0.231→0.073 s. These are local measurements, not a public-network latency guarantee. Both browsers passed the full questionnaire and legacy restore/export regression. 1280×720, 1280×900, 1440×900 and 1470×956 were tested with real map selection/submission, including Safari. Frozen SVG/snapshot/V5/generator hashes and 1,000-seed results are unchanged.

Old v1.0.x storage keys, original stimuli/pool, answers and export versions remain intact; sessions are not migrated. New v1.1.0 sessions record the frozen channel; existing candidate test sessions keep their original metadata. Export workbooks remain four sheets, five tasks, nine PREVis items, with optional instruction-reading audit fields.

The historical GitHub Pages 25/50/100 concurrent-user acceptance remains FAIL/not revalidated. Functional publishing does not imply improved capacity. Use small, low-concurrency recruitment batches.
