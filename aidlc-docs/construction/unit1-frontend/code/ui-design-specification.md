# UI Design Specification - Dobon Card Game

## Overview
A mobile-first card game interface designed for landscape orientation on smartphones. The design supports 2-8 players with real-time gameplay visualization.

---

## Screen Layout

### Overall Structure
- **Target Device**: Smartphone in landscape orientation (横画面)
- **Layout**: 2-column grid layout
  - Left column: 180px fixed width (opponent players list)
  - Right column: Flexible width (game field and player hand)
- **Background**: Deep blue gradient (from #0f172a)
- **No scrolling**: All content fits in one screen (100vh)

---

## Left Side: Opponent Players Area

### Container
- **Width**: 180px fixed
- **Background**: Transparent with subtle overlay
- **Scroll**: Vertical scroll only (overflow-y: auto, overflow-x: hidden)
- **Max height**: calc(100vh - 24px)

### Opponent Hand Card (Each Player)
- **Layout**: Vertical stack of player cards
- **Spacing**: 6px gap between players
- **Background**: Semi-transparent white (rgba(255, 255, 255, 0.1))
- **Border**: 2px solid transparent (yellow #fbbf24 when current player's turn)
- **Border radius**: 8px
- **Padding**: 10px 12px

#### Player Info Section
- **Player name**: White text, 14px, bold, max-width 100px with ellipsis
- **Current turn indicator**: Yellow dot (●) with pulse animation
- **Card count badge**: White text on semi-transparent background, rounded pill shape

#### Card Display
- **Private cards**: Blue card back icon + count (e.g., "×3")
- **Public cards**: Mini playing cards showing suit and value
  - Card size: 28px × 40px
  - Overlap: 4-6px horizontal offset
  - All cards visible with suit symbol and value
  - Hover effect: Card lifts up 4px
  - Color coding: Red suits (♥♦), Black suits (♣♠)

#### Special Case: 13 Cards All Open
- Display all 13 cards with 4px overlap
- Each card shows suit symbol and value
- Total width fits within 180px container

---

## Right Side: Game Field and Player Hand

### Top Area: Game Field (Fixed Height)
- **Height**: min 200px, max 300px
- **Layout**: Horizontal flexbox, centered
- **Components**: Deck, Field Card, Dobo Display (when active)

#### Deck Display
- **Size**: 80px × 112px
- **Visual**: Stacked blue cards showing depth
- **Layers**: 3-8 layers depending on remaining cards
- **Card count**: White text on rounded badge below deck
- **Draw button** (when player's turn):
  - Position: Centered overlay on deck
  - Size: Compact (14px font, 6px×12px padding)
  - Color: Green gradient (#10b981 to #059669)
  - Border: 2px white
  - Animation: Pulse effect
  - Text: "引く"

#### Field Card Display
- **Size**: 80px × 112px playing card
- **Background**: Pink/purple gradient container
- **Border radius**: 12px
- **Padding**: 20px
- **Multiplier badge**: Top-right corner, red text on white, shows "倍率: Xx"
- **Last player name**: Below card, white text on semi-transparent background
  - Text: "〇〇さんが出した"

#### Dobo Display (When Active)
- **Container**: Compact card, max-width 280px
- **Background**: Gold gradient (#fbbf24 to #f59e0b) for normal dobo
- **Background**: Pink gradient (#ec4899 to #be185d) for return dobo
- **Border**: 2px white
- **Border radius**: 10px
- **Padding**: 10px
- **Shadow**: 0 6px 16px with color glow
- **Animation**: Slam down effect (cards thrown from above)

**Dobo Card Contents**:
1. **Header**: Player name (14px bold white) + Label ("ドボン！" or "返しドボン！")
2. **Cards used**: Horizontal row of mini cards (3px gap)
3. **Formula**: White background box showing calculation
   - Format: "3 + 4 + 5 = 12"
   - Monospace font, 14px
   - Result in larger font (18px) and colored
4. **Target player**: Who got dobo'd (11px white text on dark background)

**Stacking for Return Dobo**:
- First dobo: Relative positioning
- Return dobos: Absolute positioning on top
- Each return rotates 3-5 degrees more
- Diagonal stacking effect (cards thrown on top)

### Bottom Area: Player Hand
- **Padding**: 8px 0 80px 0 (80px bottom to avoid dobo button overlap)
- **Background**: Purple gradient (#667eea to #764ba2)
- **Border radius**: 12px
- **Padding**: 16px

#### Hand Title
- **Text**: "手札 (X枚)"
- **Color**: White
- **Size**: 16px bold
- **Alignment**: Center

#### Card Display
- **Layout**: Horizontal row, centered
- **Card size**: 80px × 112px

**Normal Mode (1-5 cards)**:
- Cards displayed with 8px gap
- Full card visible with:
  - Top-left corner: Value and suit
  - Center: Large suit symbol (48px, 30% opacity)
  - Bottom-right corner: Value and suit (rotated 180°)

**Compact Mode (6+ cards)**:
- First card: Full card visible (80px)
- Subsequent cards: Overlap with 30px visible width
- Overlap calculation: -50px margin (80px - 30px)
- **Compact indicator**: External badge on right side
  - Position: right: -24px (outside card boundary)
  - Size: 22px value, 20px suit
  - Background: White with 2px border
  - Shadow: Strong shadow for visibility
  - Always visible, never covered by overlap

**Card States**:
- **Normal**: White background, 2px black border
- **Selected**: Blue border (3px), lifted 8px, blue shadow
- **Public**: Orange border, cream background (#fffbeb)
- **Hover**: Lifts up 12px
- **Dragging**: 50% opacity

**13 Cards Display**:
- Total width: 80px + (30px × 12) = 440px
- All cards identifiable by external indicators
- No horizontal scroll

---

## Floating Elements

### Dobo Button (Control Panel)
- **Position**: Fixed, bottom-right corner (20px from edges)
- **Size**: 20px font, 16px×32px padding
- **Background**: Gold gradient (#fbbf24 to #f59e0b)
- **Border**: 4px white
- **Border radius**: 50px (pill shape)
- **Shadow**: 0 8px 24px gold glow
- **Animation**: Pulse glow effect (2s loop)
- **Text**: "ドボン！"
- **Hover**: Scales to 110%, darker gradient
- **Active**: Scales to 95%

---

## Color Palette

### Primary Colors
- **Background**: Deep blue (#0f172a)
- **Opponent area**: Semi-transparent white overlay
- **Player hand**: Purple gradient (#667eea to #764ba2)
- **Field card**: Pink gradient (#f093fb to #f5576c)
- **Dobo display**: Gold gradient (#fbbf24 to #f59e0b)
- **Return dobo**: Pink gradient (#ec4899 to #be185d)

### Card Colors
- **Card background**: White (#ffffff)
- **Card border**: Black (#333333)
- **Red suits**: Red (#dc2626) - Hearts ♥, Diamonds ♦
- **Black suits**: Dark gray (#1f2937) - Clubs ♣, Spades ♠
- **Public card**: Orange border (#f59e0b), cream background (#fffbeb)
- **Selected card**: Blue border (#3b82f6), blue shadow

### UI Elements
- **Current player**: Yellow (#fbbf24) with pulse
- **Deck**: Blue gradient (#1e3a8a to #1e40af)
- **Draw button**: Green gradient (#10b981 to #059669)
- **Dobo button**: Gold gradient (#fbbf24 to #f59e0b)
- **Multiplier badge**: Red text (#dc2626) on white

---

## Typography

### Fonts
- **Primary**: System font stack (sans-serif)
- **Formula**: 'Courier New', monospace

### Sizes
- **Player name**: 14px bold
- **Card count**: 13px bold
- **Hand title**: 16px bold
- **Card value**: 18px bold (normal), 22px bold (compact indicator)
- **Card suit**: 16px (normal), 20px (compact indicator)
- **Large suit**: 48px (30% opacity)
- **Dobo player**: 14px bold
- **Dobo label**: 11px bold
- **Formula**: 14px
- **Formula result**: 18px bold
- **Dobo button**: 20px bold
- **Draw button**: 14px bold

---

## Animations

### Pulse Animation (Current Player, Draw Button, Dobo Button)
- **Duration**: 1.5-2s
- **Easing**: ease-in-out
- **Loop**: Infinite
- **Effect**: Opacity or shadow pulse

### Slam Down Animation (Dobo Display)
- **Duration**: 0.5s
- **Easing**: cubic-bezier(0.68, -0.55, 0.265, 1.55)
- **Effect**: 
  - Start: translateY(-200px), rotate(-20deg), scale(0.7), opacity 0
  - Mid: translateY(10px), rotate(3deg), scale(1.05)
  - End: translateY(0), rotate(0), scale(1), opacity 1

### Hover Effects
- **Cards**: translateY(-4px to -12px), shadow increase
- **Buttons**: scale(1.05-1.1), shadow increase
- **Active**: scale(0.95-0.98)

### Drag Effects
- **Dragging card**: opacity 0.5, cursor grabbing
- **Drop target**: Dashed border, scale(1.02)

---

## Responsive Behavior

### Landscape Mobile (max-width: 926px)
- Left side: 150px width
- Smaller fonts and padding
- Tighter card spacing

### Portrait Fallback (max-width: 640px)
- Switch to vertical layout
- Opponents: Horizontal scroll at top
- Field: Stacked vertically
- Hand: Bottom area
- Dobo button: Bottom center

---

## Interaction States

### Card Interactions
- **Click**: Select/deselect (toggle blue border)
- **Drag start**: Opacity 50%, cursor grabbing
- **Drag over field**: Field shows dashed border
- **Drop**: Play card or cancel (return to hand)
- **Hover**: Lift up to show full card

### Button Interactions
- **Hover**: Scale up, darker color
- **Active/Click**: Scale down
- **Disabled**: Gray color, no hover effect

### Auto-deselect Rule
- When selecting different card value: Previous selections auto-clear
- Only same-value cards can be multi-selected

---

## Special UI Behaviors

### Dobo Occurrence
1. Field info stays in place
2. Dobo display appears to the right
3. Compact layout (280px max-width)
4. Slam-down animation

### Return Dobo
1. Field position unchanged
2. Return dobo card stacks on top of previous
3. Diagonal rotation (3-5° more per return)
4. Different color (pink gradient)

### 13-Card Scenarios
- **Opponent with 13 open cards**: All visible with 4px overlap in 180px width
- **Player with 13 cards**: All visible with external indicators, 440px total width
- **No scrolling**: All content fits in viewport

---

## Design Notes for Figma

### Key Design Principles
1. **Mobile-first**: Optimized for smartphone landscape
2. **One-screen fit**: No scrolling required for gameplay
3. **Clear hierarchy**: Field > Opponents > Hand
4. **Visual feedback**: Animations for all interactions
5. **Card visibility**: All cards identifiable even when overlapped
6. **Compact efficiency**: 8 players + 13 cards fit in one screen

### Areas for Improvement
- Card overlap visualization (compact indicators)
- Dobo display sizing and positioning
- Color scheme refinement
- Typography hierarchy
- Spacing and padding optimization
- Animation timing and easing

### Current Implementation Status
- ✅ Basic layout structure
- ✅ Component positioning
- ✅ Card display logic
- ✅ Overlap mechanics
- ⚠️ Visual polish needed
- ⚠️ Compact mode refinement needed
- ⚠️ Color scheme optimization needed

---

## Technical Constraints

### Performance
- Maximum 8 players
- Maximum 13 cards per player
- 60fps animations
- Minimal re-renders

### Browser Support
- Latest Chrome, Safari, Firefox
- Mobile browsers (iOS Safari, Chrome Mobile)
- No IE support

### Accessibility
- No WCAG requirements (POC level)
- No keyboard navigation required
- Touch-optimized for mobile

