> Step 18：当前发布包为 **questionnaire-v1.1.1 / frozen**；旧会话保留原文和版本。参见 [版本记录](docs/QUESTIONNAIRE_V1_1_1_RELEASE.md) 与 [结果归档及合并说明](docs/SURVEY_RESULTS_IMPORT.md)。

# Reachability Visualization Study

Static research questionnaire: **questionnaire-v1.1.1 (frozen)**.

Public study: https://jianbaihi.github.io/reachability-visualization-study/

- Stimulus: `rittenhouse-formal-v2`
- Dataset: `rittenhouse-formal-snapshot-v2` (113 places)
- Task pool: `rittenhouse-formal-task-pool-v5`
- Previous v1.0.x / v1.1.0 sessions retain their original assets and answers.

Run locally with `python3 -m http.server 8011`, then open http://127.0.0.1:8011/.

See [v1.1.1 release notes](docs/QUESTIONNAIRE_V1_1_1_RELEASE.md) and [v1.1.0 methods](docs/QUESTIONNAIRE_V1_1_0_RELEASE.md). Offline research utilities are in `research-tools/`; participant workbooks are ignored by Git.

Public functional validation and capacity are separate: the previous 25/50/100 concurrent-user acceptance failed. This release does not claim a capacity pass. Distribute the formal questionnaire in small, low-concurrency batches.
