import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Snackbar,
  ActivityIndicator,
  Picker,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { documentsAPI, categoriesAPI } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export default function DocumentUploadScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [store, setStore] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCategories();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories);
      if (response.data.categories.length > 0) {
        setCategoryId(response.data.categories[0].id.toString());
      }
    } catch (error) {
      setCategories([]);
    }
  };

  const pickImage = async (source) => {
    setSuccess(`Opening ${source === 'camera' ? 'camera' : 'gallery'}...`);
    let result;
    const pickerOptions = {
      mediaTypes: ImagePicker.MediaType?.Images
        ? [ImagePicker.MediaType.Images]
        : undefined,
      allowsEditing: true,
      quality: 0.8,
    };

    try {
      if (Platform.OS !== 'web') {
        if (source === 'camera') {
          const cam = await ImagePicker.getCameraPermissionsAsync();
          if (cam.status !== 'granted') {
            const req = await ImagePicker.requestCameraPermissionsAsync();
            if (req.status !== 'granted') {
              setError('Camera permission is required to take a photo');
              return;
            }
          }
        } else {
          const lib = await ImagePicker.getMediaLibraryPermissionsAsync();
          if (lib.status !== 'granted') {
            const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (req.status !== 'granted') {
              setError('Photos permission is required to select an image');
              return;
            }
          }
        }
      }

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(pickerOptions);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      }
    } catch (e) {
      setError(e?.message || 'Failed to open image picker');
      return;
    }

    if (!result) {
      setError('Image picker returned no result (check permissions and try again)');
      return;
    }

    if (result.canceled) {
      setError('Image picking cancelled');
      return;
    }

    if (!result.assets || !result.assets[0]) {
      setError('No image was returned by the picker');
      return;
    }

    setImage(result.assets[0]);
    setSuccess('Image selected');
  };

  const handleSubmit = async () => {
    if (!title) {
      setError('Title is required');
      return;
    }

    if (categories.length > 0 && !categoryId) {
      setError('Category is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await documentsAPI.create({
        title,
        categoryId: categoryId || '',
        store,
        expirationDate,
        notes,
        image,
      });
      setSuccess('Document uploaded successfully!');
      
      // Reset form
      setTitle('');
      setStore('');
      setExpirationDate('');
      setNotes('');
      setImage(null);
      
      // Navigate back after a delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload document';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Upload Document
        </Text>

        <TextInput
          label="Title *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Category *</Text>
          <View style={styles.picker}>
            {categories.length === 0 ? (
              <Text style={styles.noCategoriesText}>
                No categories available (check Appwrite permissions for the categories collection).
              </Text>
            ) : (
              categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    categoryId === cat.id.toString() &&
                      styles.categoryOptionSelected,
                  ]}
                  onPress={() => setCategoryId(cat.id.toString())}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      categoryId === cat.id.toString() &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <TextInput
          label="Store"
          value={store}
          onChangeText={setStore}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Expiration Date (YYYY-MM-DD)"
          value={expirationDate}
          onChangeText={setExpirationDate}
          mode="outlined"
          style={styles.input}
          placeholder="2024-12-31"
        />

        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <View style={styles.imageSection}>
          <Text variant="bodyLarge" style={styles.imageLabel}>
            Document Image
          </Text>
          <View style={styles.imageButtons}>
            <Button
              mode="outlined"
              onPress={() => pickImage('camera')}
              icon="camera"
              style={styles.imageButton}
            >
              Take Photo
            </Button>
            <Button
              mode="outlined"
              onPress={() => pickImage('gallery')}
              icon="image"
              style={styles.imageButton}
            >
              Choose from Gallery
            </Button>
          </View>
          {image && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
              <Button
                mode="text"
                onPress={() => setImage(null)}
                textColor="red"
              >
                Remove Image
              </Button>
            </View>
          )}
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Upload Document
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
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    marginBottom: theme.spacing.md,
  },
  pickerLabel: {
    marginBottom: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
  },
  categoryOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    color: theme.colors.text,
  },
  categoryTextSelected: {
    color: 'white',
  },
  noCategoriesText: {
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.sm,
  },
  imageSection: {
    marginBottom: theme.spacing.lg,
  },
  imageLabel: {
    marginBottom: theme.spacing.sm,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  imageButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  imagePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  submitButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  snackbar: {
    backgroundColor: 'red',
  },
});
