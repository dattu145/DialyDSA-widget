# DailyDSA Widget 📱

DailyDSA is a React Native (Expo) application with a native Android widget designed to help you practice Data Structures and Algorithms (DSA) daily. It fetches Java problems directly from your GitHub repository and displays them on your home screen, complete with syntax highlighting, metadata, and navigation.

## 🚀 Features

-   **Daily Random Problem**: Automatically fetches a random DSA problem from your GitHub repo.
-   **Native Android Widget**:
    -   **Full Code Display**: Scrollable list view of the Java code with syntax highlighting.
    -   **Metadata**: Shows Difficulty, Topic, Intuition, Technique, Time & Space Complexity.
    -   **Navigation**: "Next" (random) and "Previous" (history) arrows directly on the widget.
    -   **Seen Status**: Marks problems you've already viewed.
    -   **Auto-Fetch**: Automatically fetches code in the background if missing.
-   **Folder Filtering**: Choose specific topics (e.g., "Easy/Arrays", "Hard/DP") to display on the widget.
-   **App-Widget Sync**: The app and widget stay in sync. Opening the app loads the current widget problem.
-   **History**: Tracks your recently viewed problems.

## 🛠️ Setup & Installation

### Prerequisites
-   Node.js & npm
-   **Android Studio** (for building the native widget)
-   **Expo CLI**: `npm install -g expo-cli`

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/dattu145/DialyDSA-widget.git
    cd DialyDSA-widget
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure GitHub Repository**:
    Open `src/config.ts` and update your GitHub details:
    ```typescript
    export const CONFIG = {
        GITHUB_USERNAME: 'your-username', // e.g., 'dattu145'
        GITHUB_REPO: 'your-repo-name',    // e.g., 'DSA-Daily-Codes'
        GITHUB_TOKEN: '',                 // Optional: Add fine-grained token if repo is private
    };
    ```

### 🏃‍♂️ Running the App

Since this project uses native Android code (Kotlin/XML) for the widget, you **cannot** use Expo Go. You must build the development client.

1.  **Build and Run on Android Emulator/Device**:
    ```bash
    npx expo run:android
    ```
    *This command runs `prebuild` to generate native files and then builds the APK.*

## 📂 Repository Structure

-   **`src/`**: React Native application code.
    -   `screens/`: UI screens (Home, Filter, History).
    -   `services/`: Logic for GitHub fetching (`github.ts`) and local storage (`storage.ts`).
-   **`plugins/`**: Expo Config Plugins.
    -   `withAndroidWidget.js`: Configures AndroidManifest and copies native files.
    -   `android/`: Contains the native Kotlin and XML files for the widget.
        -   `DailyWidgetProvider.kt`: Main widget logic (updates, navigation, fetch).
        -   `CodeWidgetService.kt` & `Factory.kt`: Handles the code list view.
        -   `res/layout/daily_widget.xml`: Widget UI layout.

## 🧩 How it Works

1.  **Data Source**: The app fetches a file tree of `.java` files from your GitHub repo.
2.  **Metadata**: It looks for a `problems_metadata.json` in your repo root for extra details (intuition, complexity).
3.  **Widget Logic**:
    -   The widget reads a local `problem_cache.json` file (managed by the React Native app).
    -   On "Next", it picks a random item from this cache.
    -   If code is missing, it fetches it via a background thread.
    -   It maintains a `widget_history.json` for "Previous" navigation.

## 📝 Metadata Format

To see rich metadata, add a `problems_metadata.json` to your GitHub repo root:

```json
{
  "src/Easy/TwoSum.java": {
    "intuition": "Use a HashMap to store complements.",
    "technique": "HashMap",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)"
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---
Built with ❤️ using React Native, Expo, and Kotlin.
