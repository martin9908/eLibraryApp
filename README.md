# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing files inside the **src** directory.

- Navigation lives in **src/navigation/AppNavigator.tsx**
- Screens live in **src/screens**

## Firestore Setup

This app now reads library metadata from Firestore and writes borrow records.

1. Create a local env file from `.env.example`.
2. Fill in your Firebase web config values:

   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

3. Restart Expo after updating env variables.

### Current POC behavior

- Reads featured eBook from the `books` collection.
- Creates borrow records in `borrowRecords`.
- Decrements `books.availableCopies` during borrow.
- Validates active borrow status before opening an external eBook URL.

## Reactotron (Development)

Reactotron is wired in development mode only and auto-initializes from `App.tsx`.

1. Install and open the Reactotron desktop app.
2. Start your project with `npx expo start`.
3. Run the app on a simulator/device in the same network.
4. Confirm your app appears in Reactotron as `eLibraryApp`.

## PDF Reader Integration

The `Reader` screen now uses `react-native-pdf` for in-app rendering after Firestore borrow validation.

- Native (iOS/Android): Uses an embedded PDF viewer.
- Web: Falls back to opening the PDF URL.

Because `react-native-pdf` is a native module, run this in a development build (not Expo Go):

1. `npx expo prebuild`
2. `npx expo run:ios` or `npx expo run:android`

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
