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

*   **Progressive Hint System:**
    1.  **Start:** Nation
    2.  **Attempt 1:** Rank
    3.  **Attempt 2:** Battle Rating (BR)
    4.  **Attempt 3:** Vehicle Class
    5.  **Attempt 4:** Main Armament (e.g., "105mm L7A3")
    6.  **Attempt 5:** Visual Intel (Blurred/Obscured Image)
*   **Immersive UI:** Designed with a "Dark Military OS" aesthetic, featuring scanlines, CRT effects, and tactical animations.
*   **Audio Feedback:** Custom Web Audio API synthesizer for UI sounds (typing, revealing hints, victory/defeat themes) without external assets.
*   **Live Data:** Fetches vehicle data dynamically from a custom War Thunder API.

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
│   ├── Game.tsx        # Main game loop and input logic
│   └── HintCard.tsx    # UI component for individual clues
├── services/
│   └── apiService.ts # API fetcher and data normalization logic
├── utils/
│   └── audio.ts        # Web Audio API synthesizer implementation
├── App.tsx             # State management (Menu vs Game vs Result)
└── types.ts            # TypeScript interfaces
```

## ⚠️ Disclaimer

This project is an unofficial fan-made application. It is not affiliated with, endorsed by, or connected to **Gaijin Entertainment** or **War Thunder**. All vehicle names, images, and statistics are property of their respective owners.

## 🤝 Contributing

Intel gathering is a team effort. Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

*System Status: ONLINE // End of File*
