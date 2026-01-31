# DOKUBOX - DOCUMENT MANAGEMENT MOBILE APP

A mobile application for managing documents (receipts, warranties, invoices) built with React Native (Expo SDK 54) and Appwrite.

## FEATURES

- User Authentication (email/password)
- Document Upload and Management
- Photo Capture (camera or gallery)
- Search and Filter by category, store, date
- Warranty Reminders
- Secure Storage with user-based access

## TECH STACK

- Frontend: React Native with Expo SDK 54
- Backend: Appwrite (cloud)
- Navigation: React Navigation
- UI: React Native Paper (Material Design)

## PREREQUISITES

- Node.js (v20.19 or higher)
- npm or yarn
- Expo CLI (npm install -g expo-cli)
- iOS Simulator / Android Emulator or physical device
- Appwrite instance (Cloud or self-hosted)

## SETUP INSTRUCTIONS

### MOBILE APP (frontend)

1. Clone the repository and open the frontend folder:

```bash
git clone https://github.com/45SaviciunasPaulius/Dokubox.git
cd Dokubox/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Install additional native dependencies required by Appwrite and polyfills:

```bash
npx expo install react-native-appwrite react-native-url-polyfill
```

4. Ensure Expo SDK 54 is installed in the project (required by this repo):

```bash
npm install expo@^54.0.0
npx expo install --fix
npx expo-doctor
```

5. Configure Appwrite environment variables. Create a file named `.env` (or set environment variables in your chosen method) with the following values:

```
APPWRITE_ENDPOINT=https://[YOUR_APPWRITE_ENDPOINT]
APPWRITE_PROJECT_ID=[YOUR_PROJECT_ID]
APPWRITE_DATABASE_ID=[YOUR_DATABASE_ID]
APPWRITE_BUCKET_ID=[YOUR_BUCKET_ID]
```

Replace placeholders with values from your Appwrite console.

6. Start the development server:

```bash
npm start
```

7. Run on a device or simulator:
- Scan the QR code with the Expo Go app (iOS/Android)
- Or run on iOS simulator / Android emulator via the Expo CLI

## USAGE

- Sign up or sign in using email/password
- Add documents by taking photos or selecting images from gallery
- Add metadata (category, store, purchase date, warranty length)
- Use search/filters to find documents
- Enable warranty reminders to get notified before warranties expire

## CONTRIBUTING

Contributions welcome — please open issues or pull requests for improvements.

## TROUBLESHOOTING

- If you see native modules or linking errors, run `npx expo install` again and rebuild your environment.
- If uploads fail, verify Appwrite endpoint and project IDs in your environment variables.

## LICENSE

Specify your license here (e.g., MIT) or remove this section if not applicable.

---

If you want, I can also add example .env.example, screenshots, or a simple Appwrite configuration guide next.