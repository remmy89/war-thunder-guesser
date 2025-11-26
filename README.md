# 🛡️ War Thunder Guesser

> **Identify the target. Secure the intel. Win the war.**

A tactical vehicle identification game built with React, TypeScript, and Vite. Test your knowledge of War Thunder ground vehicles by identifying tanks based on progressively revealed intelligence data.

![Status](https://img.shields.io/badge/Status-Operational-green)
![Version](https://img.shields.io/badge/Version-1.4.1-blue)
![Tech](https://img.shields.io/badge/Built%20With-React%2019%20%2B%20Tailwind-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

## 📋 Mission Briefing

War Thunder Guesser mimics a military intelligence terminal. Your goal is to identify a specific ground vehicle from the War Thunder database. You start with minimal information (Nation) and gain more specific "Intel" (Rank, BR, Class, Armament, Visuals) with every incorrect guess.

### 🎮 Game Modes

1.  **EASY MODE (Assisted)**
    *   **Searchable Database:** You select from a dropdown list of vehicles.
    *   **Smart Filters:** The list automatically filters itself based on the hints currently revealed (e.g., if "Rank III" is revealed, only Rank III vehicles appear in the list).
    *   **Visual Feedback:** See thumbnails of potential matches before guessing.

2.  **HARD MODE (Manual Entry)**
    *   **Manual Input:** You must type the name of the vehicle.
    *   **Fuzzy Matching:** The system uses a Levenshtein distance algorithm to accept typos, aliases, and common abbreviations (e.g., "Marder 1A3" works for "Marder 1 A3").
    *   **No Handholding:** No dropdowns. Pure knowledge required.

3.  **DAILY CHALLENGE**
    *   **Global Target:** Same vehicle for everyone each day.
    *   **Compare with Friends:** Share your results and compete.
    *   **New Target Every 24 Hours:** Fresh challenge daily.

## ✨ Key Features

- **Progressive Hint System:** Nation → Rank → BR → Class → Armament → Visuals (revealed across attempts)
- **Skip Hint Feature:** Reveal the next hint without submitting a wrong guess (strategic gameplay)
- **Keyboard Shortcuts:** Full keyboard navigation support (`Ctrl+S` to skip, `/` to focus search, `?` for help)
- **Toast Notifications:** Modern feedback system for game events
- **Share Results:** Share your performance with friends after each game
- **Achievements & Service Record:** Track medals and progress (Sharpshooter, Iron Cross, Cold War Specialist, Veteran, Tank Ace)
- **Immersive UI:** "Dark Military OS" aesthetic with scanlines, CRT effects, and tactical animations
- **Audio Feedback:** Built-in Web Audio synthesizer for UI sounds (no external audio files required)
- **Live Data:** Fetches vehicle data dynamically from a custom War Thunder API

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit guess |
| `Ctrl+S` / `Cmd+S` | Skip & reveal next hint |
| `/` | Focus search input |
| `?` | Toggle keyboard shortcuts help |
| `↑` / `↓` | Navigate suggestions |
| `Esc` | Close suggestions |

## 🛠️ Tech Stack

*   **Core:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS (Custom "WT" color palette)
*   **Icons:** Lucide React
*   **Audio:** Native Web Audio API (No external audio files required)
*   **Logic:** Custom fuzzy string matching and dynamic array filtering.

## 🚀 Installation & Setup

Follow these steps to deploy the terminal locally:

1.  **Clone the repository**
    ```bash
    git clone https://github.com/remmy89/war-thunder-guesser.git
    cd war-thunder-guesser
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run the Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

## 📂 Project Structure

```text
war-thunder-guesser/
├── components/
│   ├── Game.tsx          # Main game loop and input logic
│   ├── HintCard.tsx      # UI component for individual clues
│   ├── ServiceRecord.tsx # Modal: shows achievements and progress
│   └── ErrorBoundary.tsx # React error boundary for graceful error handling
├── services/
│   └── apiService.ts     # API fetcher and data normalization logic
├── utils/
│   ├── achievements.ts   # Achievement checking and unlocking logic
│   ├── audio.ts          # Web Audio API synthesizer implementation
│   ├── storage.ts        # Safe localStorage operations with error handling
│   └── stringUtils.ts    # String manipulation and fuzzy matching utilities
├── App.tsx               # State management (Menu vs Game vs Result)
├── constants.ts          # Centralized configuration and constants
├── types.ts              # TypeScript interfaces with readonly modifiers
└── vite-env.d.ts         # Vite TypeScript type definitions
```

## 📝 What's New (v1.5.1)

### Daily Challenge Improvements
- **Once Per Day Limit:** Daily challenge can now only be played once per day - come back tomorrow for a new target!
- **Completion Status:** Daily button shows "Completed ✓" indicator after finishing today's challenge
- **Disabled State:** Button is grayed out and non-clickable after completing the daily challenge

### Hard Mode Suggestions Fix
- **Hint-Based Filtering:** Suggestions in Hard mode now respect revealed hints (nation, rank, type)
- **Accurate Results:** Typing in the search box now only shows vehicles matching the current intel
- **Consistent Behavior:** Hard mode suggestions now filter the same way as Easy mode

## 📝 Previous Updates (v1.5.0)

### Local Data & Offline Support
- **Offline Mode:** Game now uses local JSON data instead of external API calls
- **Faster Loading:** No network latency - instant game start
- **Reliability:** No more API connection failures

### Improved Search & Matching
- **Flexible Search:** Typing "type 3" now matches "Type-3" (spaces, hyphens, underscores treated equivalently)
- **Stricter Guess Validation:** Fixed false positives where partial matches like "Gaz 4m" incorrectly matched "Gaz Dshk"
- **Deduplicated Suggestions:** Hard mode dropdown no longer shows duplicate vehicle names

### UI/UX Fixes
- **Tooltip Fix:** Difficulty tooltips no longer appear automatically when returning to menu after a game

## 📝 Previous Updates (v1.4.0)

### Wordle-Style Comparative Feedback (Hard Mode)
- **Smart Guess Analysis:** When you guess incorrectly in Hard Mode, you now see feedback comparing your guess to the target:
  - **Nation:** ✅ (correct) or ❌ (wrong)
  - **Rank:** ✅ (match), 🔼 (target is higher), or 🔽 (target is lower)
  - **BR:** ✅ (match), 🔼 (target is higher), or 🔽 (target is lower)
  - **Vehicle Type:** ✅ (correct) or ❌ (wrong)
- **Guess History:** All previous guesses are displayed with their feedback, helping you narrow down the target mathematically
- **Educational Gameplay:** Learn *why* your guess was wrong, not just that it was wrong

### Layout Improvements
- **Compact Hint Cards:** Redesigned hint cards in a horizontal 5-column layout to reduce vertical scrolling
- **Streamlined Feedback Section:** Guess history is now compact and scrollable with a max height
- **Better Space Utilization:** All game elements now fit better on a single screen

### New Components
- **GuessFeedback Component:** New dedicated component for displaying comparative feedback
- **Compact HintCard Mode:** HintCard now supports a `compact` prop for condensed display

## 📝 Previous Updates (v1.3.0)

### Enhanced User Experience
- **Skip Hint Feature:** New button to reveal hints without wrong guesses for strategic gameplay
- **Toast Notifications:** Replaced bouncing error messages with modern toast system (error/info/success)
- **Progress Bar:** Visual intel progress indicator showing hint progression (1-5)
- **Keyboard Shortcuts:** Full keyboard navigation (`Ctrl+S` skip, `/` focus, `?` help modal)
- **Share Results:** Share button on victory/game over screen (native share or clipboard)

### Visual Improvements
- **Hint Card Animations:** Flip animation with sparkle effect when hints are revealed
- **Shake Animation:** Input shakes on wrong answers for clear feedback
- **Streak Celebration:** High streaks (3+) animate, 5+ shows fire emoji 🔥
- **Confetti Effect:** Celebration animation on victory
- **Performance Badges:** Shows "PERFECT", "Excellent", "Good Work" based on attempts
- **Low Attempt Warning:** Counter turns red when ≤2 attempts remain

### Menu Improvements
- **Difficulty Tooltips:** Hover over buttons to see mode explanations
- **Quick Stats:** Shows games played, win rate, and best streak on menu
- **Daily Challenge Indicator:** Sparkle animation on Daily button

### Accessibility
- Better focus-visible styles with orange outline
- ARIA labels on all interactive elements
- Keyboard navigation support throughout
- Screen reader friendly role attributes

### Audio
- Added new "skip" sound effect for hint skipping

## 📝 Previous Updates (v1.2.0)

### Code Quality & Architecture
- **Centralized Constants**: Extracted all magic numbers and configuration into `constants.ts`
- **Utility Modules**: Created reusable utility functions in `utils/stringUtils.ts` and `utils/storage.ts`
- **Type Safety**: Added `readonly` modifiers to interfaces, removed `any` types from API service
- **Error Boundaries**: Added `ErrorBoundary` component for graceful error handling

### Performance Optimizations
- **React Hooks**: Added `useCallback` for event handlers to prevent unnecessary re-renders
- **Memoization**: Improved `useMemo` dependencies for better caching
- **Lazy Loading**: Added `loading="lazy"` to images

### Accessibility Improvements
- Added ARIA attributes (`role`, `aria-label`, `aria-live`, `aria-hidden`)
- Improved keyboard navigation support
- Added proper semantic HTML structure

## 📝 Previous Updates (v1.1.0)

- Added Achievements system and a `Service Record` modal where players can view unlocked medals and track progress.
- Achievements are stored under `localStorage` keys: `wt_guesser_achievements` and `wt_guesser_stats`.
- `components/Game.tsx` updated to report attempt counts to `App.tsx` so achievements (e.g. Sharpshooter) can be detected.

## ⚠️ Disclaimer

This project is an unofficial fan-made application. It is not affiliated with, endorsed by, or connected to **Gaijin Entertainment** or **War Thunder**. All vehicle names, images, and statistics are property of their respective owners.

## 🤝 Contributing

Intel gathering is a team effort. Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

*System Status: ONLINE // End of File*
