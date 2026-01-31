import 'react-native-url-polyfill/auto';
import { Client } from 'react-native-appwrite';

// Hardcoded project details (as requested)
export const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '695d738e00398baf6e21';
export const APPWRITE_PLATFORM = 'com.dokubox.app';

export const client = new Client()
  .setProject(APPWRITE_PROJECT_ID)
  .setEndpoint(APPWRITE_ENDPOINT)
  .setPlatform(APPWRITE_PLATFORM);

