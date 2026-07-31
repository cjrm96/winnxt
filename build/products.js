// The manifest. One entry per thing that gets sold, and everything the build
// does is driven from here.
//
// The point of this file is that somebody who has never seen the repo can open
// it and know what exists, where each piece comes from, and what a buyer ends
// up with. Before it existed the answer was spread across three build scripts
// and a README that had already drifted.
//
// `out` is the folder inside dist/ that holds everything for one Etsy listing:
// the tool, the quickstart PDF, and the listing images. Upload that folder and
// you have a complete listing.
module.exports = [
  {
    id: 'crisis-triage',
    name: 'Crisis Triage and Rapid Response',
    out: 'crisis-triage',
    file: 'crisis-triage.html',
    tool: 'src/tools/crisis-triage/index.html',
    quickstart: 'src/quickstart/crisis-triage/index.html',
    listing: 'src/marketing/listing/crisis-triage',
    live: true
  },
  {
    id: 'vulnerability-assessment',
    name: 'Candidate Vulnerability Assessment',
    out: 'vulnerability-assessment',
    file: 'candidate-vulnerability-assessment.html',
    tool: 'src/tools/self-vet/index.html',
    quickstart: 'src/quickstart/self-vet/index.html',
    listing: 'src/marketing/listing/self-vet',
    live: false
  },
  {
    id: 'pre-filing-check',
    name: 'Pre-Filing Readiness Check',
    out: 'pre-filing-check',
    file: 'pre-filing-check.html',
    tool: 'src/tools/pre-filing-check/index.html',
    // Free lead magnet. Still on the pre-brand design, and it has no quickstart
    // or listing images until it is refaced.
    live: false
  }
];
