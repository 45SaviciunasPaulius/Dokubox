import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { pingAppwrite } from './src/services/api';
import { authAPI } from './src/services/api';
import api from './src/services/api';

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DocumentUploadScreen from './src/screens/DocumentUploadScreen';
import DocumentDetailScreen from './src/screens/DocumentDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { AuthContext } from './src/context/AuthContext';
import { theme } from './src/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Upload') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Upload" component={DocumentUploadScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    pingAppwrite();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (_) {
        setUserToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const authContext = {
    signIn: async (token) => {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    },
    signOut: async () => {
      try {
        await api.account.deleteSession('current');
      } catch (error) {
        // Session might already be invalid, ignore
      }
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
    },
  };

  if (isLoading) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <AuthContext.Provider value={authContext}>
        <NavigationContainer>
          {userToken == null ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth" component={AuthScreen} />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator>
              <Stack.Screen 
                name="Main" 
                component={MainTabs} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="DocumentDetail" 
                component={DocumentDetailScreen}
                options={{ title: 'Document Details' }}
              />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </AuthContext.Provider>
    </PaperProvider>
  );
}
