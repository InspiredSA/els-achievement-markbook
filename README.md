# ELS achievement markbook companion

A blank, on-device teacher markbook with exact curriculum descriptors for five stages and Benchmark, Term 2 and Term 4. This is separate from the ELS reporting app and lesson observation companion.

Open the GitHub Pages site. For a self-contained offline copy, download `offline.html` and open it in a modern browser. The hosted app has relative asset paths and no service worker. No installed/offline-cache behaviour is claimed.

Names and ticks stay in the tab until the teacher explicitly saves a JSON draft or XLSX export. There is no analytics, backend, automatic browser storage or data submission. Files are unencrypted; use approved school storage. Never commit pupil names, drafts or assessment records to this repository.

Use XLSX for reporting imports: the existing ELS CSV importer reads names only. Stage/report-point metadata is not applied by that importer; select the matching curriculum point manually in the reporting tool. It treats all non-TRUE values alike and discards clarification/moderation distinctions. Keep the JSON draft and review report wording; absent evidence is not inability.

The existing importer skips names containing `student`, `learner`, `name` or `instruction` case-insensitively. Export blocks those names to prevent silent loss. A reporting-app fix requires separate authorisation.

All source clarification notes remain visible in category guidance. Stage 5 Measurement at 66/72 months repeats spatial criteria and cannot be marked TRUE pending curriculum-owner correction. No replacement criterion is invented. Other flagged manual selections need moderation. Source QA was representative, not exhaustive. No Extension descriptor block was supplied.

Teacher judgement is required for every tick. Preserve the source's help, attempt, independence, time and count meanings. Never force distress, sensory exposure or unsafe activities to collect evidence. Respect language/AAC/access adjustments while preserving the actual construct.

Local synthetic tests verified all 38 category ticks through the reporting importer, real Excel boolean cells, source formula behaviour and desktop/390px responsive flows. Native phone/tablet and native Excel validation were not performed. Browser-automated draft reopening remains unverified because extension file access was unavailable; JSON roundtrip validation passed.
