# Frontend Development Rules (UI)

Rules for working on the Next.js frontend in the `ui` directory.

## 1. Feature-Based Architecture

To prevent component bloat and improve maintainability, we use a **Feature-Based Architecture**.

- **Directory Structure**: Organize code by feature within `src/features/[feature-name]/`.
  - `components/`: Feature-specific UI components.
  - `hooks/`: Feature-specific logic.
  - `services/`: API calls specific to the feature.
  - `index.ts`: Public API for the feature (exporting components/hooks).
- **Component Size**: Keep components under **250 lines**. If a component grows larger, decompose it into smaller, atomic sub-components within its feature directory.

## 2. Styling Strategy: Semantic Utility Abstraction

We use Tailwind CSS but avoid "Class Name Soup" in JSX to ensure readability and refactorability.

- **Minimize Inline Styles**: Avoid more than 5-10 utility classes on a single element.
- **Abstraction Path**:
    1. **CSS Components**: For repeated complex designs (e.g., "Premium Card", "Glass Modal"), extract them into `src/app/globals.css` using Tailwind's `@apply` directive.
    2. **Style Constants**: For variations or complex one-off groups, extract class strings into `const` variables outside the component body.
- **Naming**: Use semantic names for abstracted styles (e.g., `.btn-primary`, `.card-surface-indigo`) rather than purely descriptive ones.

## 3. Tech Stack

- **Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS + Semantic Abstraction.
- **Icons**: Lucide React.
- **State Management**: React Hooks (useState, useEffect, useMemo, useCallback).

## 4. Component Design

- **Functional Components**: Use functional components with TypeScript interfaces for props.
- **Premium Aesthetics**: Follow our "Premium Design" tokens:
  - Palette: Slate / Indigo / Emerald.
  - Effects: `backdrop-blur`, `shadow-2xl`.
  - Transitions: `transition-all`, `animate-in`, `fade-in`.
- **Accessibility**: Use semantic HTML and ensure labels/titles are present.

## 5. Validation & Maintainability

- **Strict Linting**: Always run `npm run lint` before completing a task.
- **Type Safety**: No `any`. Use derived types or Zod schemas for validation.
- **Refactorability**: Code should be readable by a human at a glance. Extract complex logic into custom hooks.
