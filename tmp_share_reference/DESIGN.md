# Design System Strategy: Kinetic Brutalism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"Kinetic Brutalism."** In the fitness space, most apps settle for soft roundness and safe layouts. We are doing the opposite. This system is designed to feel like an adrenaline spike—raw, aggressive, and high-velocity.

We move beyond the "template" look by rejecting the standard 8px border radius and the thin 1px divider. Instead, we embrace **Extreme Hard Edges (0px)** and **Intentional Asymmetry**. We treat the screen as a high-contrast editorial spread where elements overlap, typography breaks the grid, and depth is achieved through shifting tectonic plates of color rather than artificial shadows. This is not just an interface; it is a digital manifestation of peak physical performance.

## 2. Colors & Surface Architecture
This system operates on a "True Dark" foundation. We don't use muddy greys; we use deep blacks and vibrant, pulsing oranges to create a sense of focused energy.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. To separate a workout module from the feed, place a `surface-container-low` card against a `surface` background. The change in luminance provides the structure; the lack of a line provides the premium, modern feel.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the Material surface tiers to define "importance" through light:
*   **Base Layer:** `surface` (#0e0e0e) — The gym floor.
*   **Secondary Sectioning:** `surface-container-low` (#131313) — Sub-navigation or secondary groupings.
*   **Actionable Containers:** `surface-container-highest` (#262626) — Active cards or focused content.
*   **The Power Layer:** `primary` (#ff9159) — High-intensity calls to action.

### Signature Textures: The "Pulse" Gradient
To prevent the UI from feeling flat, use the **Pulse Gradient** for primary buttons and hero sections. Transition from `primary_dim` (#ff7524) at the bottom-left to `primary` (#ff9159) at the top-right. This creates a subtle metallic sheen that feels like high-end performance gear.

## 3. Typography: Aggressive Editorial
Typography is our primary tool for expressing energy. We pair the industrial, wide-set **Space Grotesk** with the functional, high-readability **Manrope**.

*   **Display & Headlines (Space Grotesk):** Use `display-lg` (3.5rem) for hero stats and "Power Words." Headlines should be set with tight letter-spacing (-0.04em) to feel compressed and explosive. Use All-Caps for `label-md` to mimic athletic jersey typography.
*   **Body & Titles (Manrope):** Use Manrope for all instructional and long-form content. It provides a necessary "breather" from the aggression of Space Grotesk, ensuring that while the brand is loud, the information is clear.
*   **Visual Hierarchy:** Contrast a `display-lg` stat (e.g., "300") with a `label-sm` unit (e.g., "KCAL") placed asymmetrically. Do not center everything; allow the eye to move dynamically across the page.

## 4. Elevation & Depth
We reject the "floating card" aesthetic of the 2010s. Depth in this system is about **Tonal Stacking**.

*   **The Layering Principle:** Place a `surface-container-lowest` (#000000) card on a `surface-container-low` (#131313) section. The slight dip in darkness creates a "carved out" look, making the element feel integrated into the interface rather than hovering over it.
*   **Glassmorphism & High-Velocity Depth:** For floating navigation bars or "active workout" overlays, use semi-transparent `surface_variant` (#262626 at 70% opacity) with a `24px` backdrop blur. This allows the vibrant orange of the background content to bleed through, softening the harsh edges of the layout without losing the high-energy vibe.
*   **The "Ghost Border" Fallback:** If a border is required for input field definition, use the `outline-variant` (#484848) at **20% opacity**. It should be felt, not seen.

## 5. Components

### Buttons: High-Impact
*   **Primary:** `primary` background, `on_primary_fixed` (Pure Black) text. **0px Border Radius.** Use the "Pulse Gradient."
*   **Secondary:** `surface_container_highest` background with `on_surface` (White) text. Sharp corners.
*   **Interaction:** On hover, the primary button should shift to `primary_fixed_dim`. No bounce—only instant, high-speed transitions.

### Cards & Lists: The No-Divider Rule
*   **Cards:** Forbid shadows. Use the `surface-container` tiers. A "New Workout" card should be `surface_bright` (#2c2c2c) to stand out against the `surface` floor.
*   **Lists:** Never use divider lines. Use `spacing-4` (1.4rem) to separate list items. The white space is your divider. If items need distinct separation, use alternating backgrounds (`surface` and `surface-container-low`).

### Input Fields: Industrial Precision
*   **Default:** `surface-container-highest` background, 0px radius.
*   **Focus State:** A 2px bottom-only border using `primary`. Do not outline the entire box.
*   **Error:** Use `error` (#ff7351) text only; avoid red boxes which break the "Kinetic Brutalism" aesthetic.

### Additional Signature Component: The "Power Gauge"
A custom progress bar using a `surface-container-highest` track and a `primary` indicator. The indicator should not be a smooth bar but a series of vertical blocks (using the spacing scale) to mimic a digital tachometer.

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** Place text on the left and imagery bleeding off the right edge of the screen.
*   **Embrace the Dark:** Keep 90% of the UI in the `surface` and `surface-container` range to make the `primary` orange truly "pop."
*   **Tighten the Spacing:** Use the `spacing-1` and `spacing-2` tokens for metadata to create a "technical" and dense information look.

### Don’t:
*   **Don't Round Corners:** 0px means 0px. Even a 2px radius destroys the "Kinetic Brutalism" feel.
*   **Don't Use Grey Shadows:** If you must use a shadow for a floating modal, use a tinted shadow (#FF6B00 at 5% opacity) with a 40px blur. 
*   **Don't Centeralize Everything:** Centered layouts feel like templates. Keep the user's eye moving with off-axis headers and staggered card layouts.