# Interface Direction

Spica follows a modern planetarium interaction model: the sky occupies the
entire viewport, transient controls sit over it, and object facts remain
readable outside the canvas. Stellarium Web, Star Walk 2, Sky Guide, and
SkySafari define the expected usability and finish, not assets or layouts to
copy.

## Visual Language

- Deep neutral night surfaces preserve star colour and work indoors or outside.
- Warm amber marks active controls and orientation without resembling generic
  blue software chrome.
- Newsreader gives names and discoveries an editorial astronomy voice; Manrope
  keeps controls and numerical data compact and legible.
- An original four-sail windmill mark suggests air, orientation, and motion. The
  supplied Anemoi images are visual references only and are not bundled into
  the application.
- Blur is limited to functional overlays whose contrast must survive a changing
  sky. The canvas remains unobstructed wherever possible.
- Tonight advances the observer to astronomical darkness while preserving the
  engine's realistic atmosphere; it also reveals Milky Way and deep-sky data.
- Red-light mode remains separate and uses Stellarium's full-surface red
  multiply treatment for dark adaptation without changing simulation time.

## Responsive Contract

- Desktop: search is centred, discovery or selection details stay left, and
  time controls anchor the bottom centre.
- Mobile: search moves below the title row, layer controls collapse to icons,
  and selected-object details become a bounded bottom sheet.
- Primary controls retain at least a 42px touch target.

## Accessibility Contract

Every engine operation exposed in the interface uses a semantic HTML control.
Selected-object coordinates are represented as a definition list outside the
canvas. Focus rings, high-contrast placeholders, reduced motion, manual
location entry, and an explicit renderer failure state are required behavior.
