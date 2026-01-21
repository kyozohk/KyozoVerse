# Typography Guide

This document outlines the typographic standards for the application, ensuring a consistent and readable user interface. Our typography is primarily managed through Tailwind CSS utility classes.

## Primary Font

-   **Font Family**: `PT Sans`
-   **Source**: Google Fonts
-   **Weights**: 400 (Regular), 700 (Bold)
-   **Tailwind Class**: `font-body` (for general text) and `font-headline` (for headings). Currently, both are set to 'PT Sans'.

## Text Styles

### Headings

-   **H1 (Page Titles)**: Use for main page titles, typically inside a `<HeaderBanner>`.
    -   **Classes**: `text-3xl font-bold font-headline`
    -   **Example**: `src/components/layout/header-banner.tsx`

-   **H2 (Section Titles)**:
    -   **Classes**: `text-2xl font-semibold`
    -   **Example**: `CardTitle` in `src/components/ui/card.tsx`

-   **H3 (Item Titles)**:
    -   **Classes**: `text-lg font-semibold`
    -   **Example**: Community card titles in `src/app/(app)/communities/page.tsx`

### Body & Regular Text

-   **Default Text**: The default `<body>` style.
    -   **Classes**: `text-base` (on larger screens, often `text-sm` is used for component text). `text-foreground`.
-   **Muted/Secondary Text**: For descriptions, subtitles, or less important information.
    -   **Classes**: `text-muted-foreground`
    -   **Example**: Page descriptions in `<HeaderBanner>`, `CardDescription`.

### Interactive Elements

-   **Buttons**:
    -   **Classes**: `text-sm font-medium`
    -   **Component**: `src/components/ui/button.tsx`

-   **Input Fields**:
    -   **Classes**: `text-base md:text-sm`
    -   **Placeholder Text**: `placeholder:text-muted-foreground`
    -   **Component**: `src/components/ui/input.tsx`

-   **Labels**:
    -   **Classes**: `text-sm font-medium`
    -   **Component**: `src/components/ui/label.tsx`

## General Principles

1.  **Use Semantic Classes**: Prefer using size classes like `text-lg`, `text-sm` over arbitrary pixel values.
2.  **Leverage Components**: Our UI components from `shadcn/ui` (e.g., `Button`, `Input`, `Card`) already have the correct typographic styles applied. Use them whenever possible.
3.  **Maintain Hierarchy**: Use a clear typographic hierarchy (e.g., larger, bolder text for titles; smaller, lighter text for secondary info) to guide the user's attention.
4.  **Consistency**: Stick to the defined styles to ensure the entire application feels unified. Check `tailwind.config.ts` for the source of truth on font families.