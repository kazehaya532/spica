---
name: Spica
description: A layered live-sky field atlas for learning the universe.
colors:
  chart-ink: "#07182a"
  chart-ink-raised: "#0c2238"
  plotting-paper: "#eee9d6"
  plotting-paper-deep: "#ded8c2"
  paper-ink: "#15283a"
  chalk: "#f7f1dd"
  notation-cyan: "#67bbc2"
  annotation-coral: "#ef6548"
  annotation-coral-deep: "#bd472f"
  muted-blue: "#91abb7"
  space-black: "#010207"
  atmosphere-horizon: "#173b50"
  daylight-blue: "#2f6f9e"
  twilight-coral: "#b46f5d"
typography:
  display:
    fontFamily: "Geologica Variable, sans-serif"
    fontSize: "clamp(3.5rem, 7vw, 6rem)"
    fontWeight: 640
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Geologica Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Spline Sans Mono, monospace"
    fontSize: "0.7rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.075em"
spacing:
  compact: "8px"
  control: "12px"
  group: "20px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.chart-ink}"
    typography: "{typography.body}"
    padding: "0 20px"
    height: "48px"
  button-coral:
    backgroundColor: "{colors.annotation-coral}"
    textColor: "{colors.chart-ink}"
    typography: "{typography.body}"
    padding: "0 20px"
    height: "48px"
  input-chart:
    backgroundColor: "{colors.chart-ink-raised}"
    textColor: "{colors.chalk}"
    padding: "0 14px"
    height: "46px"
---

# Design System: Spica

## Overview

**Creative North Star: "The Layered Star Atlas"**

Spica behaves like a live teaching chart assembled from transparent information layers. Dense ink-blue skies carry calculated objects and cyan geometry; warm paper surfaces slow the pace for reading, annotation, and reflection. Vermilion marks decisions and teaching emphasis rather than decorating every control.

The system is precise but not clinical. Square controls, ruled dividers, plotted coordinates, and mono labels make information feel placed by hand on an atlas while large Geologica headings keep the experience contemporary and approachable.

**Key Characteristics:**
- Dark sky and warm paper alternate according to task.
- Fine rules organize information instead of card shadows.
- Cyan explains structure; coral marks action and emphasis.
- Data labels stay compact, uppercase, and clearly secondary.
- The interactive sky remains an information surface, never a backdrop alone.

## Colors

The palette alternates cool nocturnal fields with warm plotting paper and reserves two saturated annotation colors for meaning.

### Primary
- **Chart Ink:** The immersive sky field, navigation ground, and deepest text color.
- **Plotting Paper:** Reading surfaces, lessons, profiles, and quiz sheets.

### Secondary
- **Notation Cyan:** Constellation geometry, orientation icons, and labels on dark fields. Use the darker accessible cyan treatment when metadata sits on paper.
- **Annotation Coral:** Primary actions, selected coordinates, teaching marks, and major transitions.

### Neutral
- **Chalk:** Stars, high-emphasis text, and primary controls on chart ink.
- **Muted Blue:** Secondary text on dark fields only.
- **Paper Ink:** Headings, paragraphs, controls, and rules on plotting paper.

**The Annotation Rule.** Cyan explains the chart; coral asks the learner to act. Do not swap their jobs.

**The Surface Rule.** Use chart ink for exploration and plotting paper for sustained reading or assessment.

## Typography

**Display Font:** Geologica Variable (sans-serif fallback)
**Body Font:** Geologica Variable (sans-serif fallback)
**Label/Mono Font:** Spline Sans Mono (monospace fallback)

**Character:** Geologica supplies broad, friendly forms with enough technical character for scientific material. Spline Sans Mono appears only where information is measured, indexed, or plotted.

### Hierarchy
- **Display** (640, fluid up to 6rem, 0.96): First-view headings and major closing statements.
- **Headline** (630, fluid 2.1–4.5rem, approximately 1.03): Section and page headings.
- **Title** (600–650, 1.3–2.35rem): Lessons, objects, and local task headings.
- **Body** (400, 0.95–1.08rem, 1.65–1.85): Explanations with a maximum readable measure around 70 characters.
- **Label** (400, 0.7rem, 0.075em, uppercase): Coordinates, categories, durations, and chart metadata.

**The Measurement Rule.** Monospace is for data and indexing, never a general “science” costume.

## Layout

Wide screens center a dominant 360-degree map followed by two observing ledgers; lessons retain margin-and-article layouts and quizzes retain index-and-sheet layouts. The shared content ceiling is 1440px, while reading columns remain around 760px.

Spacing separates whole learning phases generously and keeps controls tight. At 800px, multi-column task layouts become ordered vertical flows: map first, horizontally scrollable object index second, detail panel third. At 520px, actions become full-width and lesson rows collapse to one reading column.

## Elevation & Depth

The system is flat by design. Depth comes from alternating tonal fields, ruled boundaries, canvas layers, and occasional overlapping orbital geometry. Shadows are limited to astronomical body illustrations; interface containers do not float.

**The Ruled Surface Rule.** Prefer a fine one-pixel divider or tonal field change over a shadowed container.

## Shapes

Controls, panels, and reading containers are square. Circles belong to celestial bodies, orbital diagrams, object marks, and the brand symbol. Organic nebula and flattened galaxy marks are reserved for object classification, not generic decoration.

## Components

### Buttons
- **Shape:** Square, compact, and at least 48px high.
- **Primary:** Chalk on chart ink, or coral with chart-ink text for emphasized educational actions.
- **Hover / Focus:** Shift the surface color and translate upward by 2px; use a visible coral focus outline.
- **Secondary:** Transparent with a fine context-colored border.

### Chips
- **Style:** Square outline controls with compact labels.
- **State:** Active chart filters invert to paper ink and white on reading surfaces, or switch to cyan border and text on dark surfaces.

### Cards / Containers
- **Corner Style:** Square.
- **Background:** Use the page’s field unless a task needs the opposite material.
- **Shadow Strategy:** None.
- **Border:** One-pixel low-contrast rules.

### Inputs / Fields
- **Style:** Raised chart ink with a subtle chalk border on dark fields; translucent paper with a paper-ink rule on light fields.
- **Focus:** Border changes to notation cyan with the global coral focus ring.

### Navigation
- Desktop navigation is a quiet horizontal index with a coral underline for the current section. At mobile sizes, a square menu control reveals a ruled vertical list.

### Star Map
- The WebGL canvas layers calculated horizontal positions, constellation geometry, object marks, labels, atmosphere, and optional coordinate grids on a 360-degree dome.
- Earth atmosphere shows a bounded horizon, atmospheric extinction, and time-dependent sky brightness; airless space removes the horizon and exposes the full celestial sphere against near-black.
- Zoom, look direction, selection, time, observer location, and text observing lists must remain synchronized with the same data.
- Location access is explicit and contextual; global and manual modes must remain fully usable.

## Do's and Don'ts

### Do:
- **Do** alternate exploration and reading surfaces according to the learner’s task.
- **Do** let object marks, plotted lines, and measured labels carry the astronomy identity.
- **Do** provide text navigation alongside every canvas-only interaction.
- **Do** keep coral rare enough that the next action is immediately visible.

### Don't:
- **Don't** turn Spica into a black-and-neon glass dashboard.
- **Don't** place cyan metadata on plotting paper without using its darker accessible treatment.
- **Don't** use rounded cards, decorative glow, or generic icon tiles as page structure.
- **Don't** imply that the compact catalog models weather, terrain, camera direction, or safety-critical navigation.
