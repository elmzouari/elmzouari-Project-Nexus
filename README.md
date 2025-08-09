# Interactive Polling Platform

A demo polling app built with Next.js App Router, shadcn/ui, Redux Toolkit, and Recharts. Create single-choice and multi-select polls with scheduling, vote, share, and view analytics.

## Tech Stack

- Next.js App Router (React Server + Client Components)
- TypeScript
- Redux Toolkit for client state
- shadcn/ui (Radix + Tailwind) for components
- Recharts for data viz
- In-memory Mock DB (demo)
- Simple in-memory rate limiting (per-IP)

## Demo Mode and Persistence

This project runs in demo mode using an in-memory store. Data (polls, votes, comments, sessions, rate-limit buckets) resets on reload/redeploy. For persistence, swap the mock DB for a real database (e.g., Supabase or Neon) and a durable cache (e.g., Upstash Redis) for rate limiting.

## Features

- Poll scheduling (start/end time)
- Single-choice and multi-select polls
- Per-user vote tracking with revote support
- Share dialog (link, QR, embed)
- Analytics dashboard (total polls, total votes, avg votes, most popular, recent) with accessible charts
- Comments per poll (only voters can comment) with basic moderation
- Per-IP rate limiting:
  - Votes: 20 requests/minute
  - Comments: 5 requests/minute

## Accessibility

- ARIA labels on charts
- Keyboard guidance on vote inputs
- Live region announcements after a vote

## Getting Started

### Prerequisites
- Node 18+

### Install and Run
```bash
pnpm i # or npm i / yarn
pnpm dev # or npm run dev / yarn dev
