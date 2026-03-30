# Design System Strategy: LIONESS PERSONAL ESTUDIO

## 1. Overview & Creative North Star: "The Kinetic Monolith"
The creative direction for this design system is **"The Kinetic Monolith."** We are moving away from the "soft and approachable" fitness aesthetic to something that feels architectural, authoritative, and high-performance. 

This system rejects the standard "grid-of-cards" layout. Instead, we use **Intentional Asymmetry** and **Aggressive Scale** to mimic the explosive energy of a workout. By overlapping `display-lg` typography across high-contrast surface transitions, we create a sense of forward motion. The interface shouldn't just host content; it should feel like a premium training environment—structured, deep, and unyielding.

---

## 2. Colors: High-Octane Contrast
This palette is built on the tension between the void (`surface`) and the flame (`primary`). 

### The Palette Roles
*   **Primary (`#ff9157`):** Use this as a "strike" color. It is not for backgrounds; it is for high-action touchpoints and critical branding elements.
*   **Surface Hierarchy (Nesting):** We use a "Dark Mode First" architecture. Use `surface` (#0e0e0e) for the global canvas. Use `surface-container-low` (#131313) for secondary sections and `surface-container-high` (#20201f) for interactive elements to create "nested depth."
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Contrast must be achieved through background shifts. A section using `surface-container-low` should sit directly against the `surface` background to define its boundary.
*   **The "Glass & Gradient" Rule:** For floating headers or stats overlays, use `surface` at 60% opacity with a `backdrop-blur` of 20px. 
*   **Signature Texture:** Use a subtle linear gradient from `primary` (#ff9157) to `primary-container` (#ff7a2c) at a 135-degree angle for primary CTAs to give them a metallic, "forged" energy.

---

## 3. Typography: The Editorial Voice
We use a high-contrast pairing: **Space Grotesk** for strength and **Manrope** for technical precision.

*   **Display & Headlines (Space Grotesk):** These are your "Power Statements." Use `display-lg` for hero sections, set with a `-0.04em` letter spacing to feel tight and aggressive. Headlines should be "Strong and Bold" as requested, serving as the visual anchor of the page.
*   **Body & Labels (Manrope):** This is the "Professional" counterweight. Manrope’s geometric clarity ensures that training schedules and performance metrics are hyper-readable. 
*   **The Scale Logic:** Always skip a size in the hierarchy for impact. If a section header is `headline-lg`, the sub-header should jump down to `title-sm` to create a sophisticated, editorial "widow" effect.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "software-like" for a high-end fitness brand. We use physics-based layering.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-highest` card placed on a `surface-container-low` section creates a natural lift.
*   **Ambient Shadows:** If an element must float (e.g., a "Book Now" floating button), use a shadow tinted with `primary_dim` (#ff7520) at 8% opacity with a 40px blur. It should look like an ambient glow, not a shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline-variant` (#484847) at 15% opacity. It must be felt, not seen.
*   **Glassmorphism:** Apply to navigation bars. Use `surface_bright` (#2c2c2c) at 40% opacity with a heavy blur to allow the "Lioness Orange" of the content to bleed through as the user scrolls.

---

## 5. Components: The Elite Kit

### Buttons
*   **Primary:** Solid `primary` background, `on-primary-fixed` (#000000) text. Use `DEFAULT` (0.25rem) roundedness for a sharp, modern edge.
*   **Secondary:** `surface-container-highest` background with a `primary` "Ghost Border" at 20% opacity.
*   **States:** On hover, primary buttons should scale to 102% with a `primary_dim` outer glow.

### Cards & Lists
*   **Forbid Dividers:** Do not use lines to separate training programs. Use `16` (5.5rem) vertical spacing from the scale to create "Islands of Content."
*   **Nesting:** Program details should live in a `surface-container-low` card nested within the `surface` main body.

### Input Fields
*   **Style:** Minimalist. No background fill—only a bottom-border using `outline` (#767575). When focused, the border transitions to `primary` (#ff9157) and the label (Manrope `label-md`) shifts upwards.

### Signature Component: "The Stat Monolith"
For the landing page, create large-scale stat blocks (e.g., "500+ CLIENTS") using `display-lg` text. These should be placed with negative margin so they partially overlap background image containers, creating a layered, 3D editorial feel.

---

## 6. Do's and Don'ts

### Do
*   **DO** use extreme white space. Use `20` (7rem) and `24` (8.5rem) spacing tokens between major sections to let the brand breathe.
*   **DO** use "Power Imagery." Photos of athletes should be high-contrast, desaturated, or treated with a subtle black-to-transparent gradient to ensure text overlay readability.
*   **DO** use `display-lg` typography for the slogan 'CENTRO DE TREINAMENTO FEMININO' to make it a structural element of the design, not just a caption.

### Don't
*   **DON'T** use `full` (9999px) rounding for buttons. It feels too "soft" for the Lioness brand. Stick to `DEFAULT` or `md`.
*   **DON'T** use pure white for large blocks of text. Use `on-surface-variant` (#adaaaa) for long descriptions to reduce eye strain against the black background.
*   **DON'T** use standard 12-column grids rigidly. Offset images by one column to create a more bespoke, high-end fashion/fitness magazine feel.