# Beldium Logistics Compliance

Build a polished, frontend-only Beldium Logistics Compliance prototype. Do not use cloud services, auth providers, or database. Use local mock data and demo role switching/login so I can log out and log into complete flows for: (1) Logistics Compliance Partner / compliance operator as the primary, comprehensive workflow; (2) Logistics Partner company portal; (3) Regulatory / Oversight portal. Add a simple Beldium Admin placeholder/view only if it supports the role separation, but prioritize the three requested flows.

Design language: use Poppins/inter-like sans typography, primary #101E3D navy, pale blue #D3E4FE, link blue #2563EB, mint success #B0E2CD, warning #FBBF24, error #F87171. Sophisticated B2B compliance dashboard: white surfaces, soft blue-gray background, rounded cards, restrained shadows, high information density, responsive layouts. Beldium branding should feel trustworthy and professional.

Implement all meaningful navigation and interactions with mock data. Start with a role-aware sign-in page offering demo credentials/role cards and a logout control. Compliance operator workspace needs: dashboard with the specified attention cards (Applications, Pending Reviews, Additional Information, Expiring Documents, High Risk, Approved, Rejected), attention queue, compliance trend / risk visualization; applications table with company, ID, location, fleet, status, risk, submitted date, reviewer, activity and actions (view, assign, request info, start review); company profile with overview/company info/locations/services, fleet and drivers, score and risk. In company review, clearly section the checks: Corporate, Regulatory, Fleet, Driver, Insurance, H&S, Operational, Mineral Transport, Data & Platform. Include an inline document review interface with document metadata plus view, verify, reject, request replacement, add note, download actions. Make action buttons update local state, include review notes, a request-information modal/form with the listed reasons and message, and an approval decision screen with final summary and actions Approve, Conditional Approval, Request More Info, Reject. Include risk assessment page, expiring documents, requests, audit history, reports, notifications, profile.

Logistics Partner portal: dashboard showing verification/compliance status, outstanding information requests with exact missing items and upload/reply UI, company information, fleet module (multiple individual vehicle compliance objects: registration, type, VIN, make/model/year, capacity, ownership, insurance, roadworthiness, GPS/current status), drivers module (licence/expiry, ID, experience, vehicle, training/status), documents and activity. Make a reasonable onboarding/application progress view.

Regulatory portal: limited/read-only dashboard with overview, registered operators, compliance status, expiring credentials, regulatory alerts, reports and notifications. Do not permit document editing or decisions.

Make all flows navigate cleanly with sidebar, topbar, breadcrumbs, filters/search where applicable. Seed realistic Nigeria logistics operator mock data including one selected review case showing medium risk 82/100, fleet 92%, drivers 85%, insurance 100%, safety 72%, mineral transport pending, so the full operator journey is obvious. Make the interface functional and demonstrate continuous compliance warnings and restrictions. Use icons thoughtfully. Ensure build succeeds.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://beldiumlogisticscompliance.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/de6c59ec-6a2b-40e3-bfa3-40f62f03ab44).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
