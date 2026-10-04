# Legal publication review

Reviewed 5 October 2026. This is a documentation consistency review, not a legal opinion or a regulatory assessment. Application code and deployed terms were not modified.

## Existing content

[`LegalModal.tsx`](../src/components/legal/LegalModal.tsx) contains four panels: Terms of Service, SEBI & Risk Notice, Privacy Policy, and Cookie Policy. The terms address simulated execution, no real funds/orders, account responsibility, service disruption, intellectual property, and liability. The risk panel states that the project is not a registered investment adviser and must not be interpreted as buy/sell guidance.

The repository [Terms of Use](../TERMS.md) preserve those educational/simulation and acceptable-use principles, distinguish software licensing from demo use, and add the verified data and AI limitations. They do not claim regulatory compliance.

The landing-page footer in [`AuraLanding.tsx`](../src/components/AuraLanding.tsx) also uses an “Intelligence Inc.” name and all-rights-reserved language. Corporate status is not established by this repository; confirm that identity and align the footer with the intended licensing scope. Neither claim is adopted in the repository terms.

## Differences requiring owner review before publication

| Existing website statement | Conflict or unsupported implication | Required follow-up |
| --- | --- | --- |
| Terms section 3 describes the ecosystem as proprietary, reserves all rights, and prohibits duplication and commercial redistribution without written consent. | The repository MIT license expressly permits copying, modification, and distribution, including commercial use. | Reconcile the website's wording with the intended MIT scope. Do not present both as consistent. The MIT license has not been changed. |
| Risk notice describes all signals and summaries as calculated from live feeds and describes NOVA scores as statistical assessments. | Current paths include generated history, seeded data, heuristics, simplified indicators, and template responses. | Update website disclosures to distinguish observed, calculated, generated, and fallback content. |
| Privacy section 3 refers to direct Gemini transmission, enterprise API keys, and a blanket exclusion from model training. | Calls are server-mediated. The repository does not establish a paid/enterprise plan or universally applicable provider data-use guarantees. Google's terms distinguish paid/unpaid service conditions and regional treatment. | Verify the actual deployment's service terms and revise the privacy wording accordingly. [Provider terms](https://ai.google.dev/gemini-api/terms). |
| Privacy section 2 describes institutional-grade protection; the legal panel uses compliance-oriented headings. | The reviewed safeguards do not establish a certification or regulatory compliance status. | Replace unsupported assurance language during a separately authorized legal-copy update. |
| Risk panel quotes trading-loss statistics without a dated source and mentions options Greeks and other broad capabilities. | Those statistics and capabilities were not established in this presentation pass. | Source and date retained statistics and validate claims, or remove them from the website. They are not repeated in the new terms. |

These differences are explicitly disclosed rather than silently resolved. README, TERMS, LICENSE, SECURITY, and CONTRIBUTING have distinct roles and no newly introduced licensing restrictions; the remaining contradictions are in the preserved website text.

## Publication checklist

- Reconcile the website legal copy with the MIT license and actual data/AI behavior.
- Confirm rights to project artwork and any third-party content before distribution.
- Verify the applicable provider privacy/data conditions; do not infer them from an SDK or API-key name.
- Confirm a working private vulnerability-reporting channel.

No legal enforceability, security certification, regulatory approval, or financial outcome is guaranteed by this review.
