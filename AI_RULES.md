# AI Rules for CLMS Planner Application

This document outlines the core technologies used in this project and provides guidelines for their usage.

## Tech Stack Overview

*   **Frontend Framework**: React
*   **Language**: TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **UI Components**: shadcn/ui (built on Radix UI)
*   **Routing**: React Router DOM
*   **Data Fetching & Server State Management**: React Query
*   **Icons**: Lucide React
*   **Date Manipulation**: date-fns
*   **Toast Notifications**: Sonner
*   **Backend/Database**: Supabase
*   **Theming**: next-themes

## Library Usage Rules

To maintain consistency and best practices, please adhere to the following rules when developing or modifying the application:

*   **UI Components**:
    *   **shadcn/ui**: Always use components from `src/components/ui` for standard UI elements (e.g., Button, Input, Card, Dialog, Select, Switch).
    *   **Custom Components**: If a specific shadcn/ui component doesn't meet the exact requirements, create a new component in `src/components/` that wraps or extends existing shadcn/ui primitives, rather than modifying the `src/components/ui` files directly.
*   **Styling**:
    *   **Tailwind CSS**: All styling must be done using Tailwind CSS utility classes. Avoid writing custom CSS or inline styles unless absolutely necessary for global styles in `src/index.css`.
    *   **`cn` Utility**: Use the `cn` utility function (from `src/lib/utils.ts`) for conditionally applying and merging Tailwind CSS classes.
*   **Routing**:
    *   **React Router DOM**: Use `react-router-dom` for all client-side navigation. Define main application routes within `src/App.tsx`.
*   **Data Management**:
    *   **React Query**: Utilize `@tanstack/react-query` for managing server state and handling data fetching, caching, and synchronization with the Supabase backend.
    *   **Supabase**: Interact with the database exclusively through the `supabase` client (`@/integrations/supabase/client.ts`) and the custom hooks provided in `src/hooks/` (e.g., `useProjects`, `useRisks`). Do not directly access Supabase from components.
*   **Icons**:
    *   **Lucide React**: Use icons from the `lucide-react` library for all visual iconography.
*   **Date Handling**:
    *   **date-fns**: Use `date-fns` for all date parsing, formatting, and manipulation. Leverage the `DateFormatContext` (`src/contexts/DateFormatContext.tsx`) for consistent date display across the application based on user preferences.
*   **Notifications**:
    *   **Sonner**: Implement all toast notifications using the `sonner` library.
*   **Theming**:
    *   **next-themes**: Use `next-themes` for managing and toggling between dark and light modes.