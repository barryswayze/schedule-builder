# Schedule Builder

Personal project: Weekly family schedule planner with drag-and-drop, recurring events, and ICS export.

## Quick Start

```bash
cd /mnt/d/projects/Personal/schedule-builder

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Tech Stack

- **React 19** + TypeScript
- **Vite 7** (build tool)
- **Tailwind CSS v4** (styling)
- **shadcn/ui** (component library)
- **@dnd-kit** (drag and drop)
- **date-fns** (date utilities)
- **lucide-react** (icons)

## Project Structure

```
schedule-builder/
├── src/
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles
│   ├── components/
│   │   ├── Calendar/        # Calendar views
│   │   ├── Events/          # Event management
│   │   ├── Layout/          # App layout
│   │   └── ui/              # shadcn/ui components
│   ├── stores/              # State management
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   └── lib/                 # Library utilities
├── public/                  # Static assets
├── dist/                    # Production build output
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── eslint.config.js
```

## Key Features

- Activity type management with custom colors
- Recurring events support
- ICS calendar export
- Time slot selection
- Drag-and-drop scheduling

## Environment Variables

None required - this is a client-side only app.

## Git Config

```bash
git config user.email "streamlinecivilcrew@gmail.com"
git config user.name "Barryswayze"
```

## Presets

Schedule templates in `src/presets/`:

| Preset | Purpose |
|--------|---------|
| `monastic-schedule.json` | FS exam prep: weights, cardio, prayer, study blocks |

**Weekly totals (Monastic)**:
- Weights: 3 hrs (Push/Pull/Legs)
- Cardio: 5 hrs (Norwegian 4x4, jog, Zone 2 bike)
- Prayer: 7 hrs (1hr AM + 1hr PM daily)
- Study: 9 hrs (calculator + weakpoints)
- Desk breaks: 1.25 hrs

## Notes

- Personal project (not work-related)
- Family scheduling use case
- No backend - all data stored client-side
- Presets sourced from Claude.ai export (2026-01-14)
