# Reachability Visualization Study

Static research questionnaire: **questionnaire-v1.1.0 (frozen)**.

Public study: https://jianbaihi.github.io/reachability-visualization-study/

- Stimulus: `rittenhouse-formal-v2`
- Dataset: `rittenhouse-formal-snapshot-v2` (113 places)
- Task pool: `rittenhouse-formal-task-pool-v5`
- Previous v1.0.x sessions retain their original assets and answers.

Run locally with `python3 -m http.server 8011`, then open http://127.0.0.1:8011/.

See [v1.1.0 release notes](docs/QUESTIONNAIRE_V1_1_0_RELEASE.md) for methods and validation. Offline research utilities are in `research-tools/`; participant workbooks are ignored by Git.

Public functional validation and capacity are separate: the previous 25/50/100 concurrent-user acceptance failed. This release does not claim a capacity pass. Distribute the formal questionnaire in small, low-concurrency batches.
