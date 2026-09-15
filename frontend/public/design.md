# MaxStarter Design Configuration

Edit this file, then run `npm run apply-maxstarter` to update theme and MaxStarter-owned screen content.

## Design System Rules

**CRITICAL RULE**: Stitch-defined reusable components (e.g. TopNavBar, ProfileIcon, HROperationsCard, ContentCard, StatsCard) are the single source of truth for their visual styling. Their styling must remain consistent wherever reused and must not be overridden or recreated unless explicitly requested.

**UI API Fallback Rule**: If a UI component cannot display its API-fetched data because the API is unavailable, fails, or returns no usable data, the UI must gracefully fall back to displaying the same data/content shown in the Stitch design. Any hardcoded/fallback data must be displayed with red text or a clear red "API DATA" indicator to signify it is not live. API data must always take priority when available.
## App

name: leave-attendance

## Colors

primary: "#000000"
secondary: "#FFFFFF"
background: "#FFFFFF"
text: "#111111"
muted: "#6B7280"
error: "#DC2626"
border: "#E5E7EB"

## Typography

headingFont: "System"
bodyFont: "System"

## Login

enabled: true
title: "Welcome Back"
subtitle: "Login to continue"

## Home

enabled: true
title: "Welcome"
subtitle: "Your app is ready. Customize this screen to match your product."

## Navigation

enabled: true

## Splash

durationMs: 1800
