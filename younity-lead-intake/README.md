# Younity Consultancy Lead Intake and Client Portal

This is the Next.js application for the Younity Consultancy public website, lead intake workflow, and client portal.

The system supports public service requests, Zoho CRM lead creation, ClickUp operations tasks, Google Sheets logging, email and WhatsApp notifications, Supabase Auth, client request tracking, private document upload, internal ClickUp status/billing sync, and Vercel deployment.

ClickUp Client Services -> Services -> Client Requests is the operations hub list for portal-created tasks. Its list ID is `901713882310`, and `CLICKUP_LIST_ID` should point there. Billing preparation is handled in ClickUp/manual admin workflow only; Zoho Books is inactive.

## Documentation

- [System Overview](docs/SYSTEM_OVERVIEW.md)
- [Client Portal Launch Checklist](docs/CLIENT_PORTAL_LAUNCH_CHECKLIST.md)
- [Client Portal SOP](docs/CLIENT_PORTAL_SOP.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING_GUIDE.md)
- [Testing Checklist](docs/TESTING_CHECKLIST.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)
- [ClickUp Workflow Setup](docs/CLICKUP_WORKFLOW_SETUP.md)
- [Roadmap](docs/ROADMAP.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app locally.

## Verification

```bash
npm run lint
npm run build
```
