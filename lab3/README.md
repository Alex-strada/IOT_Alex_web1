# Lab 3 — Smart Parking · Tec de Monterrey

A standalone HTML, CSS, and JavaScript prototype inspired by the supplied aerial image of Tec de Monterrey, Campus Querétaro.

## Use

Open `index.html` in a browser, or visit [the published application](https://alex-strada.github.io/IOT_Alex_web1/lab3/). No installation, API key, hardware, or backend is needed.

- 100 virtual parking sensors are randomly initialized in five zones of 20 spaces.
- Green spaces show **P / Available**; terracotta spaces show a **car / Occupied**. Each space also has an accessible status label.
- Clicking a space changes its status immediately. Enter or Space works when a space has keyboard focus.
- The dashboard recalculates total, available, occupied, occupancy percentage, and per-zone availability after every change.
- Every five seconds, one to three distinct spaces change automatically. Choose a three-, five-, or ten-second interval, pause/resume updates, or randomize the entire lot.
- Filters highlight matching spaces while preserving their map positions. All spaces remain operable.
- Space details show the selected virtual sensor: `0` means no vehicle; `1` means vehicle detected.
- The activity feed shows the latest three sensor changes and their local timestamps.
- “Satellite reference” opens the original provided image. On mobile, scroll the map horizontally to inspect the full lot.

## Files

- `index.html` — Semantic page structure and dashboard.
- `styles.css` — Responsive interface, parking map, colors, and reduced-motion support. Optional Google Fonts fall back to system fonts.
- `app.js` — Random readings, interaction, simulation timer, filtering, activity, and dashboard calculations.
- `assets/tec-parking-reference.png` — The reference image supplied with the assignment.
- `assets/favicon.svg` — Parking favicon.

## Simulation scope

All readings are simulated in the browser. The illustrative 100-space layout is not a measured real-world parking capacity. There are no physical sensors, reservations, hardware connections, or real-time campus data. Reloading the page creates a new random state.

## Publication

This project is linked as **Lab 3 — Smart Parking** from the personal website. GitHub Pages serves the `main` branch from the repository root, so the application lives at `/IOT_Alex_web1/lab3/`.
