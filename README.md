# 🛡️ War Thunder Guesser

> **Identify the target. Secure the intel. Win the war.**

A tactical vehicle identification game built with React, TypeScript, and Vite. Test your knowledge of War Thunder ground vehicles by identifying tanks based on progressively revealed intelligence data.

![Status](https://img.shields.io/badge/Status-Operational-green)
![Tech](https://img.shields.io/badge/Built%20With-React%20%2B%20Tailwind-blue)
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

## ✨ Key Features

- **Progressive Hint System:** Nation → Rank → BR → Class → Armament → Visuals (revealed across attempts)
- **Achievements & Service Record:** New system to track medals and progress (Sharpshooter, Iron Cross, Cold War Specialist, Veteran, Tank Ace). Open `Menu → VIEW SERVICE RECORD` to view medals and progress; achievements persist in `localStorage`.
- **Immersive UI:** "Dark Military OS" aesthetic with scanlines, CRT effects, and tactical animations.
- **Audio Feedback:** Built-in Web Audio synthesizer for UI sounds (no external audio files required).
- **Live Data:** Fetches vehicle data dynamically from a custom War Thunder API.

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
│   ├── Game.tsx        # Main game loop and input logic (now reports attempts for achievements)
│   ├── ServiceRecord.tsx # Modal: shows achievements and progress
│   └── HintCard.tsx    # UI component for individual clues
├── services/
│   └── apiService.ts # API fetcher and data normalization logic
├── utils/
│   └── audio.ts        # Web Audio API synthesizer implementation
│   └── achivements.ts  
├── App.tsx             # State management (Menu vs Game vs Result)
└── types.ts            # TypeScript interfaces
```

## 📝 What's New (v1.1.0)

- Added Achievements system and a `Service Record` modal where players can view unlocked medals and track progress.
- Achievements are stored under `localStorage` keys: `wt_guesser_achievements` and `wt_guesser_stats`.
- `components/Game.tsx` updated to report attempt counts to `App.tsx` so achievements (e.g. Sharpshooter) can be detected.

## ⚠️ Disclaimer

This project is an unofficial fan-made application. It is not affiliated with, endorsed by, or connected to **Gaijin Entertainment** or **War Thunder**. All vehicle names, images, and statistics are property of their respective owners.

## 🤝 Contributing

Intel gathering is a team effort. Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

*System Status: ONLINE // End of File*
