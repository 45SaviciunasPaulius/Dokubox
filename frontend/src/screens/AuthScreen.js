import React, { useState, useContext } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { theme } from '../theme';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useContext(AuthContext);

  const handleSubmit = async () => {
    try {
      let response;
      if (isLogin) {
        response = await authAPI.login({ email, password });
      } else {
        response = await authAPI.register({ name, email, password });
      }

      if (response.data.token) {
        await signIn(response.data.token);
      }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Dokubox
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {isLogin ? 'Sign in to continue' : 'Create an account'}
          </Text>

          {!isLogin && (
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
            />
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>

          <Button
            mode="text"
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={styles.switchButton}
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.placeholder,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  switchButton: {
    marginTop: theme.spacing.md,
  },
});
