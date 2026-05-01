# UI Design Requirements - Dobon Card Game

## Project Overview
A mobile card game application for 2-8 players to play "Dobon" online in real-time. The game requires quick decision-making and clear visibility of all game elements.

---

## Target Users & Context

### Primary Users
- Team members playing casually
- Age range: Adults (20-40s)
- Technical proficiency: Basic smartphone users

### Usage Context
- **Primary device**: Smartphone
- **Primary orientation**: Landscape (横画面)
- **Session duration**: 10-30 minutes per game
- **Environment**: Casual settings (home, break time)
- **Network**: WiFi or 4G/5G mobile data

### User Goals
1. Quickly understand the current game state
2. Easily identify all cards (own and opponents')
3. Make fast decisions (play card, declare dobo)
4. Track game progress and scores
5. Enjoy smooth, responsive gameplay

---

## Core Design Requirements

### 1. Information Hierarchy

**Critical Information (Always Visible)**:
- Own hand cards - Must see all cards clearly
- Field card - Current card in play
- Opponent card counts - How many cards each player has
- Current turn indicator - Whose turn it is
- Dobo button - Always accessible for quick declaration

**Important Information (Visible When Relevant)**:
- Opponent's public cards - Cards they've revealed
- Deck remaining count - How many cards left
- Multiplier - Current payment multiplier
- Dobo displays - When dobo occurs, show who and what cards

**Secondary Information**:
- Player names
- Who played the last card
- Game phase indicators

### 2. Screen Real Estate Constraints

**Challenge**: Fit everything in one screen without scrolling
- 8 players maximum
- Each player can have up to 13 cards
- Player's own hand can have up to 13 cards
- Dobo displays when they occur
- Control buttons

**Requirements**:
- No horizontal scrolling for main gameplay
- Vertical scrolling only for opponent list (if needed)
- All critical information visible at once
- Efficient use of space

### 3. Card Visibility Requirements

**Own Hand Cards**:
- All cards must be identifiable
- When many cards (6+), use space-efficient display
- Each card must show suit (♠♥♦♣) and value (A-K)
- Selected cards must be clearly distinguished
- Public vs private cards must be visually different

**Opponent Cards**:
- Card count must be prominent
- Public cards should be visible (suit and value)
- Private cards shown as card backs
- When 13 cards all public, all must be identifiable
- Compact display to fit multiple players

**Field Card**:
- Large and prominent
- Easy to see suit and value
- Clear indication of who played it

### 4. Interaction Requirements

**Card Operations**:
- Tap to select/deselect cards
- Drag and drop to play cards
- Visual feedback for all interactions
- Auto-deselect when selecting different value (business rule)

**Dobo Declaration**:
- One-tap declaration (no confirmation needed)
- Always accessible button
- System auto-calculates all formulas
- Clear feedback when declared

**Drawing Cards**:
- Tap deck to draw (when it's player's turn)
- Clear indication when drawing is available
- Visual feedback for draw action

### 5. Real-time Updates

**Game State Changes**:
- Instant updates when any player acts
- Smooth animations for card movements
- Clear indication of turn changes
- Dobo occurrences with visual impact

**Multiplayer Awareness**:
- See all players' status simultaneously
- Current turn player clearly indicated
- Dobo declarations visible to all
- Return dobo chain visualization

---

## Functional Requirements

### Layout Structure

**Overall Organization**:
- Divide screen into logical zones
- Opponents area (compact, scrollable if needed)
- Game field area (deck, field card, dobo displays)
- Player hand area (bottom, always visible)
- Floating controls (dobo button)

**Responsive Behavior**:
- Optimize for landscape smartphone
- Graceful degradation for portrait (if user rotates)
- Adapt to different screen sizes (5-7 inch phones)

### Card Display Logic

**Normal State (Few Cards)**:
- Display cards with comfortable spacing
- Full card details visible
- Easy to tap/select

**Compact State (Many Cards)**:
- Overlap cards to save space
- Ensure suit and value remain visible
- Maintain ability to select any card
- Hover/tap to see full card

**Opponent Cards**:
- Prioritize card count visibility
- Show public cards compactly
- Stack or overlap when many cards
- Distinguish current turn player

### Dobo Display

**When Dobo Occurs**:
- Show dobo declaration prominently
- Display: Who declared, cards used, formula, result
- Don't obscure critical game elements
- Compact but readable

**Return Dobo Chain**:
- Stack multiple dobos visually
- Show sequence clearly
- Indicate who returned whom
- Maintain compact footprint

### Visual Feedback

**Interactive Elements**:
- Hover states for all clickable elements
- Active/pressed states for buttons
- Drag preview for card dragging
- Drop target indication

**State Changes**:
- Smooth transitions between states
- Animations for card movements
- Attention-grabbing for important events (dobo)
- Subtle for routine actions (turn change)

---

## User Experience Goals

### Clarity
- Instantly understand game state
- No confusion about whose turn
- Clear indication of available actions
- Obvious feedback for all interactions

### Efficiency
- Minimal taps to perform actions
- Quick access to common operations
- No unnecessary confirmations
- Fast visual scanning

### Responsiveness
- Immediate feedback for all actions
- Smooth animations (60fps)
- No lag or delay
- Real-time updates feel instant

### Aesthetics
- Card game atmosphere
- Professional but playful
- Not cluttered despite information density
- Visually appealing color scheme

---

## Design Challenges to Solve

### Challenge 1: 13-Card Hand Display
**Problem**: 13 cards at full size don't fit in screen width
**Requirements**:
- All 13 cards must be identifiable
- Each card's suit and value must be visible
- User can select any card
- No horizontal scrolling

**Desired Solution**:
- Creative overlapping or stacking
- Smart use of space
- Maintain usability

### Challenge 2: 8 Players + Card Counts
**Problem**: 8 players with varying card counts need compact display
**Requirements**:
- All players visible simultaneously
- Card counts prominent
- Public cards visible
- Current turn player obvious

**Desired Solution**:
- Efficient list layout
- Visual hierarchy
- Compact card representation

### Challenge 3: Dobo Display Without Blocking
**Problem**: Dobo displays need to show info without blocking gameplay
**Requirements**:
- Show dobo details (player, cards, formula)
- Don't hide field card or player hand
- Support multiple dobos (return chain)
- Compact but readable

**Desired Solution**:
- Smart positioning
- Compact card display
- Stacking for multiple dobos

### Challenge 4: One-Screen Fit
**Problem**: All elements must fit without scrolling
**Requirements**:
- Opponents list
- Game field (deck, field card, dobos)
- Player hand (up to 13 cards)
- Control button
- All visible simultaneously

**Desired Solution**:
- Efficient space allocation
- Vertical scroll only for opponent list
- Smart responsive layout

---

## Interaction Patterns

### Card Selection
- **Action**: Tap card in hand
- **Feedback**: Visual highlight (border, lift, or glow)
- **Rule**: Auto-deselect previous if different value
- **State**: Selected cards remain highlighted

### Card Playing
- **Action**: Drag card to field OR tap selected cards then tap field
- **Feedback**: Drag preview, drop target highlight
- **Validation**: If invalid, return to hand (no error message)
- **Result**: Card moves to field, turn progresses

### Dobo Declaration
- **Action**: Tap dobo button
- **Feedback**: Button press animation
- **Processing**: System calculates all formulas
- **Result**: Dobo display appears, or penalty if invalid

### Drawing Card
- **Action**: Tap deck (when available)
- **Feedback**: Deck highlight, draw animation
- **Result**: Card added to hand

---

## Accessibility & Usability

### Touch Targets
- All interactive elements large enough for finger taps
- Adequate spacing between tappable elements
- No tiny buttons or controls

### Visual Clarity
- High contrast for important elements
- Clear distinction between states
- Readable text sizes
- Obvious interactive elements

### Error Prevention
- Disable unavailable actions
- Clear indication of valid actions
- Forgiving interaction (easy to undo selections)

### Performance
- Smooth animations even with many elements
- No lag during interactions
- Fast rendering of updates
- Efficient re-renders

---

## Design Constraints

### Technical Constraints
- Web application (not native app)
- Must work on latest mobile browsers
- Touch-optimized (no mouse hover required)
- Real-time updates via WebSocket

### Business Constraints
- POC level (not production-ready)
- Team use only (no public release)
- No accessibility requirements (WCAG)
- Development time: 1-2 weeks

### Device Constraints
- Smartphone screens (5-7 inches)
- Landscape orientation primary
- Portrait as fallback
- Modern devices (last 3 years)

---

## Success Criteria

### Functional Success
- ✅ All 8 players visible simultaneously
- ✅ All 13 cards in hand identifiable
- ✅ No horizontal scrolling for main gameplay
- ✅ One-tap dobo declaration works
- ✅ All game states clearly represented

### UX Success
- ✅ Users can identify their cards instantly
- ✅ Users know whose turn it is immediately
- ✅ Users can perform actions with minimal taps
- ✅ Users understand dobo occurrences clearly
- ✅ Game feels responsive and smooth

### Visual Success
- ✅ Design looks professional
- ✅ Card game atmosphere achieved
- ✅ Information hierarchy is clear
- ✅ Not cluttered despite density
- ✅ Aesthetically pleasing

---

## Design Freedom

### What to Decide
- Color palette and theme
- Typography and font choices
- Exact layout proportions
- Animation styles and timing
- Visual effects and polish
- Icon and symbol design
- Card back design
- Button styles and shapes
- Spacing and padding values
- Border and shadow styles

### What to Maintain
- Information hierarchy (critical > important > secondary)
- Functional requirements (all cards visible, no scroll, etc.)
- Interaction patterns (tap, drag, dobo button)
- Business rules (auto-deselect, one-tap dobo, etc.)
- Performance targets (smooth, responsive)

---

## Inspiration & References

### Card Game Aesthetics
- Traditional playing card design
- Digital card game interfaces
- Casino/poker game UIs
- Modern card game apps

### Layout Patterns
- Dashboard layouts (multiple info panels)
- Mobile game interfaces
- Real-time multiplayer games
- Compact information displays

### Interaction Patterns
- Touch-optimized mobile games
- Drag-and-drop interfaces
- One-tap actions
- Real-time updates

---

## Deliverables Expected from Design

1. **Layout Structure**: How to organize all elements in one screen
2. **Card Display Solution**: How to show 13 cards compactly
3. **Opponent List Design**: How to show 8 players efficiently
4. **Dobo Display Design**: How to show dobo info without blocking
5. **Color Scheme**: Professional card game palette
6. **Typography**: Readable and appropriate fonts
7. **Interactive States**: Visual feedback for all interactions
8. **Animations**: Smooth transitions and effects
9. **Responsive Behavior**: Adapt to different screen sizes
10. **Visual Polish**: Professional finish and details

---

## Notes for Designer

- This is a real-time multiplayer card game
- Speed and clarity are more important than decoration
- Information density is high - smart space usage is critical
- Mobile-first, touch-optimized design required
- The 13-card display challenge is the hardest problem to solve
- Users need to make quick decisions - clarity is paramount
- Card game atmosphere but modern/digital feel
- POC level but should look professional

