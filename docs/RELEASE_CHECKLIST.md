# Release checklist

- [x] Core asset SHA-256 values match the audited source files.
- [x] Formal dataset contains 113 POIs with ring distribution 30/30/30/23.
- [x] The two formal SVG files expose identical place ID sets.
- [x] Local package runs independently on port 8011 (also retested on 8013).
- [x] Browser requests use only the release-package origin.
- [x] Full questionnaire E2E and XLSX export pass.
- [x] Sensitive-information audit passes.
- [x] Release status is changed from `candidate` to `frozen` only after release freeze.
