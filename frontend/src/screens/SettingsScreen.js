import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Divider,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { userAPI, authAPI } from '../services/api';
import { theme } from '../theme';
import { format } from 'date-fns';

export default function SettingsScreen() {
  const { signOut } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const userData = response.data.user;
      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully. Signing out...');
      // Sign out immediately for security
      await signOut();
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.sectionTitle}>
              Profile Information
            </Text>

            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              disabled
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled
            />

          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.sectionTitle}>
              Change Password
            </Text>

            <TextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />

            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />

            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleChangePassword}
              loading={saving}
              style={styles.button}
            >
              Change Password
            </Button>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.button}
          textColor={theme.colors.primary}
        >
          Sign Out
        </Button>
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess('')}
        duration={3000}
        style={[styles.snackbar, { backgroundColor: 'green' }]}
      >
        {success}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  deleteButton: {
    borderColor: 'red',
    marginTop: theme.spacing.sm,
  },
  divider: {
    marginVertical: theme.spacing.lg,
  },
  snackbar: {
    backgroundColor: 'red',
  },
});
