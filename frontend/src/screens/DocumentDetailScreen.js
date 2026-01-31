import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  IconButton,
  ActivityIndicator,
  Menu,
  Snackbar,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';
import { documentsAPI, categoriesAPI, getImageUrl } from '../services/api';
import { theme } from '../theme';

export default function DocumentDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { documentId } = route.params;

  const [document, setDocument] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [store, setStore] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    loadDocument();
    loadCategories();
    requestPermissions();
  }, [documentId]);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
  };

  const loadDocument = async () => {
    try {
      const response = await documentsAPI.getById(documentId);
      const doc = response.data.document;
      setDocument(doc);
      setTitle(doc.title);
      setCategoryId(doc.categoryId.toString());
      setStore(doc.store || '');
      setExpirationDate(doc.expirationDate ? doc.expirationDate.split('T')[0] : '');
      setNotes(doc.notes || '');
    } catch (error) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      setError('Failed to load categories');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImage(null);
    setImageChanged(false);
    loadDocument();
  };

  const handleSave = async () => {
    if (!title) {
      setError('Title is required');
      return;
    }

    if (categories.length > 0 && !categoryId) {
      setError('Category is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await documentsAPI.update(documentId, {
        title,
        categoryId,
        store,
        expirationDate,
        notes,
        image,
        imageChanged,
        deleteImage: imageChanged && !image,
      });
      setDocument(response.data.document);
      setIsEditing(false);
      setImage(null);
      setImageChanged(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentsAPI.delete(documentId);
              navigation.goBack();
            } catch (error) {
              setError('Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const pickImage = async (source) => {
    setError('');
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
    setImageChanged(true);
    setError('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const imageUri = image
    ? image.uri
    : document?.imageUrl
    ? getImageUrl(document.imageUrl)
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerActions}>
          {!isEditing && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item onPress={handleEdit} title="Edit" />
              <Menu.Item onPress={handleDelete} title="Delete" leadingIcon="delete" />
            </Menu>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {isEditing ? (
          <>
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
                {categories.map((cat) => (
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
                ))}
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
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.image} />
                  <View style={styles.imageButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => pickImage('camera')}
                      icon="camera"
                      style={styles.imageButton}
                    >
                      Retake
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => pickImage('gallery')}
                      icon="image"
                      style={styles.imageButton}
                    >
                      Change
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setImage(null);
                        setImageChanged(true);
                      }}
                      textColor="red"
                      style={styles.imageButton}
                    >
                      Remove
                    </Button>
                  </View>
                </>
              ) : (
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
                    Choose Image
                  </Button>
                </View>
              )}
            </View>

            <View style={styles.editActions}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.actionButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                style={styles.actionButton}
              >
                Save
              </Button>
            </View>
          </>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="headlineSmall" style={styles.cardTitle}>
                  {document.title}
                </Text>
                <Text variant="bodyMedium" style={styles.cardCategory}>
                  {document.categoryName}
                </Text>

                {imageUri && (
                  <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                    <Image source={{ uri: imageUri  }} style={styles.image} />
                  </TouchableOpacity>
                )}

                <View style={styles.infoSection}>
                  {document.store && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Store:</Text>
                      <Text style={styles.infoValue}>{document.store}</Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Uploaded:</Text>
                    <Text style={styles.infoValue}>
                      {format(new Date(document.uploadDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  {document.expirationDate && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Expires:</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          new Date(document.expirationDate) < new Date() &&
                            styles.expiredText,
                        ]}
                      >
                        {format(
                          new Date(document.expirationDate),
                          'MMM dd, yyyy'
                        )}
                      </Text>
                    </View>
                  )}
                  {document.notes && (
                    <View style={styles.notesSection}>
                      <Text style={styles.infoLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{document.notes}</Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          </>
        )}
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
      >
        {error}
      </Snackbar>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <IconButton
              icon="close"
              iconColor="white"
              size={28}
              onPress={() => setImageModalVisible(false)}
            />
          </View>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: imageUri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    padding: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    marginBottom: theme.spacing.xs,
  },
  cardCategory: {
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  imageSection: {
    marginBottom: theme.spacing.lg,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  imageButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  infoSection: {
    marginTop: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: theme.spacing.sm,
    minWidth: 100,
  },
  infoValue: {
    flex: 1,
  },
  expiredText: {
    color: 'red',
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: theme.spacing.md,
  },
  notesText: {
    marginTop: theme.spacing.xs,
    lineHeight: 20,
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
  editActions: {
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 50,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  },
});
