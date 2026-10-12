# Data dictionary

The participant export contains four sheets.

## 参与者信息

Participant identifier, questionnaire and stimulus versions, study background fields, session timestamps, and total duration. Technical identifiers and numeric duration fields are hidden by default.

## 任务记录

One row per task (T1–T5): prompt, target condition, participant answer, correctness, active duration, and page-visibility interruption counts/duration. Technical task IDs, seeds, place IDs, and raw millisecond fields are hidden by default.

## 主观评价

Long-format PREVis responses. Each participant has nine rows grouped into Understand, Layout, and Reading Data dimensions. Scores use a 1–7 Likert scale.

## 会话信息

Key-value metadata including browser, screen dimensions, device pixel ratio, task seed, export timestamp, and release identifiers.

## Timing and quality fields

- `active_duration_ms` / `active_duration_s`: task-active time.
- `hidden_count`: number of times the page became hidden during a task.
- `hidden_duration_ms`: total hidden duration during a task.
- `correct_bool`: machine-readable correctness value; the visible column uses ✓ or ✕.

Detailed answer keys are intentionally not included in this document.
