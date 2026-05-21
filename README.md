<div align="center">
  <img src="packages/ui/assets/logo.png" alt="Chito Mitho logo" width="160" />

  <h1>Chito Mitho</h1>

  <p>
    A connected food delivery system for Kathmandu, built for customers,
    restaurants, riders, and owner-side management.
  </p>

  <p>
    <img alt="React" src="https://img.shields.io/badge/React-19.1-1E1E1E?style=for-the-badge&logo=react&logoColor=white&labelColor=F8964F" />
    <img alt="Expo" src="https://img.shields.io/badge/Expo-54-1E1E1E?style=for-the-badge&logo=expo&logoColor=white&labelColor=F8964F" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-1E1E1E?style=for-the-badge&logo=supabase&logoColor=white&labelColor=F8964F" />
    <img alt="Turbo" src="https://img.shields.io/badge/Turbo-Monorepo-1E1E1E?style=for-the-badge&logo=turborepo&logoColor=white&labelColor=F8964F" />
  </p>
</div>

<div align="center">
  <img src="packages/ui/assets/hero-illustration.png" alt="Chito Mitho food delivery illustration" width="420" />
</div>

## Overview

Chito Mitho is a Kathmandu-focused food delivery app that connects browsing, ordering, restaurant queues, rider pickup, and owner-side control in one Supabase-backed system. It is built for a complete local delivery workflow, from the landing page to checkout, delivery tracking, and restaurant approval.

## Features

<p>
  <img alt="Restaurant discovery" src="https://img.shields.io/badge/Restaurant%20discovery-F8964F?style=for-the-badge" />
  <img alt="Cart and checkout" src="https://img.shields.io/badge/Cart%20%26%20checkout-333232?style=for-the-badge" />
  <img alt="Cash and eSewa" src="https://img.shields.io/badge/Cash%20%2B%20eSewa-F8964F?style=for-the-badge" />
  <img alt="Google Maps routes" src="https://img.shields.io/badge/Maps%20%26%20routes-333232?style=for-the-badge" />
  <img alt="Rider app" src="https://img.shields.io/badge/Rider%20app-F8964F?style=for-the-badge" />
  <img alt="Admin controls" src="https://img.shields.io/badge/Admin%20controls-333232?style=for-the-badge" />
</p>

Customers discover food, restaurants manage orders, riders handle pickups, and the project owner manages approvals and platform activity.

## Preview

<div align="center">
  <img src="packages/ui/assets/app-screenshot.jpg" alt="Chito Mitho mobile app preview" width="220" />
</div>

## Project Structure

```text
Food-Delivery-App/
+-- apps/
|   +-- web/              # Vite React landing page, customer app, dashboards
|   +-- mobile/           # Expo React Native customer and rider app
+-- packages/
|   +-- api/              # Supabase queries, auth helpers, eSewa helpers
|   +-- ui/               # Shared UI components and brand assets
|   +-- utils/            # Shared business logic and constants
|   +-- config/           # Shared Tailwind config
+-- supabase/
|   +-- migrations/       # Database setup and seed data
+-- scripts/              # Brand asset sync and project scripts
```

## Getting Started

```bash
npm install
cp .env.example .env
./run.sh
```

Run a specific target:

```bash
./run.sh web
./run.sh mobile
./run.sh both
```

Add Supabase, Google Maps, and optional Groq keys in `.env`.

## Run Options

```bash
./run.sh both phone      # Web + Android phone
./run.sh both emulator   # Web + Android emulator
./run.sh mobile expo     # Expo dev server only
```

<details>
  <summary>Workspace maintenance scripts</summary>

```bash
npm run build
npm run lint
npm run brand:sync
```

</details>

## Environment Variables

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_API_KEY=
VITE_GROQ_API_KEY=

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_ENABLE_NATIVE_GOOGLE_MAPS=true
```

## Database

Supabase migrations live in `supabase/migrations`. Point web and mobile at the same Supabase project so orders, riders, restaurants, and admin tools share one data source.

## Brand

<p>
  <img alt="Primary orange #F8964F" src="https://placehold.co/160x80/F8964F/FFFFFF?text=%23F8964F" />
  <img alt="Orange light #FFF4EC" src="https://placehold.co/160x80/FFF4EC/1E1E1E?text=%23FFF4EC" />
  <img alt="Orange container #FFE8D6" src="https://placehold.co/160x80/FFE8D6/1E1E1E?text=%23FFE8D6" />
  <img alt="Dark primary #1E1E1E" src="https://placehold.co/160x80/1E1E1E/FFFFFF?text=%231E1E1E" />
  <img alt="Warm background #FFFCF9" src="https://placehold.co/160x80/FFFCF9/1E1E1E?text=%23FFFCF9" />
</p>

Assets: `logo.png`, `hero-illustration.png`, and `app-screenshot.jpg` in `packages/ui/assets`.

## License

This project is private. Add a license before distributing it publicly.
