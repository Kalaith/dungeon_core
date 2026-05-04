# Dungeon Core Production UI Plan

This plan uses the provided mockup, saved as `image.png`, as visual inspiration for a production-ready Dungeon Core interface. The goal is not to copy every pixel, but to build a polished, responsive, game-focused UI that makes dungeon building, monster placement, adventurer pressure, and resource growth easy to read at a glance.

Dungeon Core should feel like a living dungeon command center: dark, readable, reactive, and clearly game-like. The UI should move the current MVP away from a flat dashboard feel and toward a production-quality web game interface.

## Product Goals

- Make the first screen feel like a complete game command center.
- Keep the core loop visible: build rooms, place monsters, open or close the dungeon, react to adventurers, and grow the Core.
- Make the dungeon board the primary visual focus.
- Prioritize readable state over decorative density.
- Preserve Dungeon Core's dark fantasy identity with purple core magic, cold blue stone, gold rewards, green dungeon growth, and danger red states.
- Support desktop as the primary dense management view, with a usable stacked mobile layout.
- Improve the interface without requiring major backend or gameplay changes during the first UI pass.

## Visual Direction

Use the mockup as the target mood:

- Dark stone-and-void background with controlled contrast.
- Strong top HUD with identity, player/account state, resources, day/time, dungeon status, and utility buttons.
- Central dungeon board as the visual anchor.
- Left panel for construction.
- Right panel for monster management.
- Lower panels for adventurer parties, recent events, core stats, and tips.
- Bottom command bar for high-frequency actions.

Avoid making the UI a generic dashboard. Every panel should feel tied to dungeon operation.

Decorative art must never reduce legibility. Atmosphere should sit around the edges of panels, behind large illustrative areas, or in controlled empty space, not behind important numbers, button labels, combat state, or resource values.

## Information Architecture

### Top HUD

- Game mark and title.
- Current player identity and auth state.
- Resource cards: mana, gold, souls.
- Day/time and dungeon status.
- Adventurer pressure summary.
- Compact utility buttons for log, help/codex, achievements, and settings.

### Main Work Area

- Left: build and room controls.
- Center: dungeon layout, floors, rooms, links, occupancy, and heatmap toggle.
- Right: monster species, filters, selected monster, placement cost, and unlock state.

### Lower Status Area

- Adventurer parties with status, level, floor target, and threat direction.
- Recent events with type color and timestamp.
- Core progression panel with flavor art or atmospheric core treatment.
- Core stats with generation rates, integrity, and threat.
- Quick tips or contextual guidance.

### Bottom Command Bar

- Simulation speed selector.
- Primary dungeon state command.
- Respawn Monsters.
- Manage Lairs.
- View Log.
- Active party count.

The primary dungeon command should change based on dungeon state:

- Closed: `Open Dungeon`
- Open: `Close Dungeon`
- Transitioning: `Preparing...`, `Closing...`, or cooldown state

Avoid showing both Open and Close as competing primary actions unless there is a very clear gameplay reason.

## Component Plan

### Layout Components

- `GameShell`: full-page frame, background, responsive grid.
- `TopHud`: title, player, resources, time/status, utility nav.
- `CommandBar`: persistent action bar.
- `Panel`: shared framed panel with heading and optional actions.
- `StatCard`: compact resource and metric cards.
- `CommandButton`: shared button style for high-frequency game actions.

### Dungeon Components

- `DungeonBoard`: central board, floor rows, room graph, selection state.
- `FloorRail`: floor labels, deepest marker, vertical navigation.
- `RoomTile`: entrance, normal, boss, core, locked, selected, full, damaged states.
- `RoomConnector`: visual links between rooms.
- `HeatmapOverlay`: optional threat, loot, or monster density view.
- `RoomSummary`: active rooms, alive/dead monsters, total floors.

The dungeon board is the most important visual upgrade. If time is limited, prioritize room tiles, room connections, selected states, floor readability, and board stability over secondary panels.

### Building Components

- `BuildPanel`: room creation and construction state.
- `RoomTypePicker`: entrance, normal, boss, core cards.
- `FloorScalingCard`: concise explanation of deeper-floor impact.
- `BuildCostPreview`: shows cost, blockers, and required dungeon status.

### Monster Components

- `MonsterManagementPanel`: species unlock, filters, monster list.
- `SpeciesTabs`: amorphous, undead, demonic, and future categories.
- `MonsterCard`: stats, cost, tier, traits, lock state.
- `SelectedMonsterHint`: placement instructions and cost modifiers.

### Event And Party Components

- `AdventurerPartyList`: active parties with direction and current task.
- `PartyCard`: party name, portraits/icons, level, floor status.
- `RecentEvents`: timestamped log preview.
- `EventRow`: typed event display for battle, loot, build, spawn, warning.

### Core Components

- `CoreStatsPanel`: generation rates, integrity, threat.
- `CoreFlavorPanel`: short thematic state based on current dungeon condition.
- `QuickTipsPanel`: context-aware tips, not static tutorial copy.

## Interaction Requirements

- Selecting a monster highlights valid rooms and shows placement cost.
- Selecting a room shows contents, capacity, threat, and available actions.
- Build controls must explain why an action is disabled.
- The primary dungeon command must clearly show current state, blockers, and cooldowns.
- Heatmap toggle must not resize or shift the dungeon board.
- Resource changes should animate subtly without distracting from play.
- Recent events should update without pushing the whole layout around.
- Selected state should be obvious without relying only on color.
- Invalid actions should feel intentionally disabled, not broken.

## Responsive Behavior

### Desktop

- Three-column management layout.
- Dungeon board remains centered and visually dominant.
- Bottom command bar is sticky.
- Main game actions are visible without scrolling.

### Tablet

- Top HUD wraps into two rows.
- Build and monster panels can stack below the dungeon board or become tabs.
- Bottom command bar uses two rows if required.

### Mobile

- Primary tabs: Dungeon, Build, Monsters, Events, Core.
- Resource HUD remains compact at the top.
- Command actions become full-width or two-column buttons.
- Dungeon board uses horizontal scroll or simplified stacked floor rows.
- No horizontal page overflow outside intentional board scrolling.

## Data And State Mapping

Use existing backend-backed game state where possible:

- `gameState.mana`
- `gameState.gold`
- `gameState.souls`
- `gameState.day`
- `gameState.hour`
- `gameState.status`
- dungeon floors
- rooms
- monsters
- room capacity
- available monsters
- species unlocks
- adventurer parties
- recent log entries
- core stats derived from current progression and dungeon state

New UI-only state should stay in Zustand or local component state:

- selected room
- selected monster
- selected species filter
- selected floor
- heatmap mode
- open panel/tab on mobile
- command confirmation state

Avoid adding new backend requirements during the first UI pass unless required for existing gameplay to remain functional.

## Out Of Scope For This UI Pass

- New combat mechanics.
- New monster balance.
- New room types unless already supported.
- New backend save structures.
- Complex animations.
- Drag-and-drop room editing unless already implemented.
- Full codex/help system.
- Achievement system implementation.
- New account or persistence logic.
- Major mobile-specific gameplay redesign.

This pass is a production UI upgrade, not a full gameplay expansion.

## Production Quality Bar

- No giant single component. Keep feature components focused and under roughly 150 lines where practical.
- No inline styles. Use Tailwind classes and shared component variants.
- No direct DOM manipulation.
- No direct localStorage outside existing auth/storage bridges.
- All buttons need disabled, hover, focus-visible, loading, and error states.
- Text must fit in cards and buttons at desktop and mobile widths.
- Icons should use the existing icon library if present, or add one consistently.
- Empty, loading, error, and unauthenticated states must feel designed.
- Decorative effects should support readability, not compete with it.
- UI changes should not break existing room construction, monster placement, dungeon open/close, or event update behavior.

## Accessibility Requirements

- Keyboard focus states for every interactive element.
- Buttons and toggles use native button semantics.
- Resource cards and combat state should not rely on color alone.
- Tooltips or accessible labels for icon-only controls.
- Color contrast should meet WCAG AA for body text and core controls.
- Motion should be subtle and avoid blocking interaction.
- Reduced-motion preferences should be respected where animation is used.
- Important state changes should be visible in text, not just animation or glow effects.

## Implementation Phases

### Phase 0: Current UI Audit And Data Contract

- Identify existing game state fields already available to the frontend.
- Map current buttons, actions, and disabled states.
- Confirm which values are real, derived, or placeholder.
- Confirm current room construction behavior.
- Confirm current monster placement behavior.
- Confirm current open/close dungeon behavior.
- Confirm how adventurer parties and event logs update.
- Create a simple UI state map for selected room, selected monster, selected floor, heatmap mode, and dungeon status.
- Avoid adding new backend requirements during this audit.

Deliverable:

- A short implementation note listing current data sources, existing actions, missing UI states, and any blockers.

### Phase 1: Shell And Visual System

- Create shared `Panel`, `StatCard`, `CommandButton`, and section heading styles.
- Build `GameShell`.
- Build `TopHud`.
- Build `CommandBar`.
- Establish color tokens and reusable Tailwind patterns.
- Replace the current page frame without rebuilding dungeon rooms, monsters, events, or game logic yet.

The goal of Phase 1 is to make the game immediately feel more polished without disturbing the working MVP systems.

Deliverable:

- Current game screen displayed inside the new production shell.
- Top HUD and bottom command bar visually upgraded.
- Existing game actions still work.

### Phase 2: Dungeon Board

- Build the production `DungeonBoard`, `FloorRail`, `RoomTile`, and `RoomSummary`.
- Add selected room state.
- Add valid monster placement highlighting.
- Preserve current room construction and monster placement behavior.
- Add stable board dimensions to prevent layout shift.
- Make room types visually distinct: entrance, normal, boss, core, locked, full, selected, and damaged.
- Add simple room connectors so progression through the dungeon is visually clear.

This is the highest-priority visual phase. The dungeon board should become the screen’s centrepiece.

Deliverable:

- Dungeon layout looks like a playable game board, not a list of boxes.
- Room selection and monster placement are readable.
- Board remains stable while resources and events update.

### Phase 3: Build And Monster Panels

- Replace current construction UI with `BuildPanel`.
- Replace current monster selector UI with `MonsterManagementPanel`.
- Add category filters, lock states, selected monster details, and cost previews.
- Ensure disabled actions explain blockers.
- Show construction costs clearly.
- Show monster placement costs clearly.
- Keep the panels compact enough that the dungeon board remains dominant.

Deliverable:

- Player can understand what they can build, what they can spawn, what is locked, and why.
- Existing build and monster actions still work.

### Phase 4: Events, Parties, And Core Status

- Add active party cards and recent event feed.
- Add `CoreStatsPanel` with generation rates, integrity, and threat.
- Add `CoreFlavorPanel` driven by current dungeon condition.
- Add `QuickTipsPanel` driven by current state.
- Tune event updates so the layout remains stable.
- Avoid showing duplicate information already present in the top HUD or dungeon summary.

Deliverable:

- Player can see what adventurers are doing, what recently changed, and how the Core is progressing.
- Lower panels support decision-making without stealing focus from the board.

### Phase 5: Responsive And Polish

- Implement mobile tabs and tablet stacking.
- Add loading and empty-state polish.
- Tune animation, resource change feedback, and command confirmations.
- Verify text fitting and no overlapping UI across common viewport sizes.
- Ensure bottom command bar remains usable on desktop, tablet, and mobile.
- Add reduced-motion handling where animation is used.

Deliverable:

- Desktop, tablet, and mobile layouts are usable.
- No overlapping panels, clipped buttons, or unreadable text in common screen sizes.

### Phase 6: Verification

- Run `npm run lint`.
- Run `npm run type-check`.
- Run `npm run test:run`.
- Run `npm run build`.
- Use browser screenshots for desktop, tablet, and mobile.
- Smoke-test guest play.
- Smoke-test room building.
- Smoke-test monster placement.
- Smoke-test open/close dungeon.
- Smoke-test event updates.
- Smoke-test mobile tabs.
- Run `.\publish.ps1` after checks pass.

Deliverable:

- Verified production UI pass ready for preview publishing.

## Screenshot Verification Targets

Capture and review screenshots for:

- Desktop: `1920x1080`
- Laptop: `1366x768`
- Tablet: approximately `768x1024`
- Mobile: approximately `390x844`

Pass conditions:

- Desktop screenshot shows top HUD, dungeon board, side panels, lower panels, and command bar without overlap.
- Laptop screenshot keeps core actions usable without the layout feeling crushed.
- Tablet screenshot stacks or wraps panels cleanly.
- Mobile screenshot uses tabs without accidental horizontal page overflow.
- Dungeon board remains readable at every supported size.
- Primary actions remain easy to find.

## Acceptance Criteria

- The first screen clearly communicates Dungeon Core's theme and current game state.
- A player can understand available actions without reading external instructions.
- Main game actions are visible without scrolling on desktop.
- The dungeon board is the central focus.
- A player can select a monster and understand where it can be placed.
- A player can select a room and understand its contents, capacity, and actions.
- Disabled actions explain why they are unavailable.
- The UI remains stable while events and resource values update.
- The layout is usable on mobile.
- Decorative styling does not reduce readability.
- Existing gameplay behavior remains intact.
- All frontend checks pass.
- Preview publishing succeeds.