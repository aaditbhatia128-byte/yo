# Meteorix Messenger APK & Asset Guide

## 1. Changing the App Icon
To change the icon for the APK:
1. Upload a square PNG image (at least 1024x1024) to the project root and rename it to `icon.png`.
2. Run `npm run assets:generate`.
3. Run `npm run cap:sync`.

## 2. Fixing Login (Android)
If login is not working on Android ("Action is invalid" error):
1. **Get google-services.json**: 
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Click "Add App" > "Android".
   - Package Name: **com.meteorix.neuralmatrix** (Must match exactly)
   - Download `google-services.json` and upload it to the `android/app/` folder.
2. **SHA-1 Fingerprint (MANDATORY)**:
   - Google Login **will NOT work** on Android unless you add your SHA-1 fingerprint in Firebase settings.
   - For this project, your SHA-1 is: `D8:53:66:9C:7A:2F:FD:8F:68:4E:D9:FD:B8:D3:D3:B5:01:42:03:24`
   - Paste it into Firebase Console > Project Settings > Android App.

## 3. Changing the App Name
- **Web**: Update the `name` field in `metadata.json` and `<title>` in `index.html`.
- **APK**:
  1. Open `android/app/src/main/res/values/strings.xml`.
  2. Change the `app_name` value.
  3. Run `npx cap sync android`.

## 3. Building the APK (ZIP to APK)
If you have downloaded the project as a ZIP and want to create an APK:
1. **Prerequisites**:
   - Install [Android Studio](https://developer.android.com/studio).
   - Install [Node.js](https://nodejs.org/).
   - Install project dependencies: `npm install`.
2. **Build the Web Project**:
   ```bash
   npm run build
   ```
3. **Sync with Capacitor**:
   ```bash
   npx cap sync android
   ```
4. **Generate APK**:
   - Open the `android` folder in Android Studio.
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - OR run from terminal (if Android SDK is in PATH):
     ```bash
     cd android && ./gradlew assembleDebug
     ```
   - The APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.

## 4. Environment Variables
Ensure all API keys (Gemini, etc.) are set in your deployment environment or the `.env` file before building the web project.
