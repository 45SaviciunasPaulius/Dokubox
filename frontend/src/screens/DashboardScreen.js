import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Card,
  FAB,
  Menu,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { documentsAPI, categoriesAPI, getImageUrl } from '../services/api';
import { theme } from '../theme';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState('uploadDate');
  const [sortOrder, setSortOrder] = useState('DESC');

  const loadData = async () => {
    try {
      const [docsResponse, catsResponse] = await Promise.all([
        documentsAPI.getAll({ sortBy, sortOrder }),
        categoriesAPI.getAll(),
      ]);

      setDocuments(docsResponse.data.documents);
      setCategories(catsResponse.data.categories);
      setFilteredDocuments(docsResponse.data.documents);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [sortBy, sortOrder])
  );

  useEffect(() => {
    filterDocuments();
  }, [searchQuery, selectedCategory, documents]);

  const filterDocuments = () => {
    let filtered = [...documents];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.store?.toLowerCase().includes(query) ||
          doc.notes?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((doc) => doc.categoryId === selectedCategory);
    }

    setFilteredDocuments(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setSortMenuVisible(false);
  };

  const renderDocument = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('DocumentDetail', { documentId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text variant="titleMedium" numberOfLines={1}>
              {item.title}
            </Text>
            <Chip
              mode="outlined"
              compact
              style={styles.categoryChip}
            >
              {item.categoryName}
            </Chip>
          </View>
        </View>

        {item.imageUrl && (
          <Image
            source={{ uri: getImageUrl(item.imageUrl) }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.cardInfo}>
          {item.store && (
            <Text variant="bodySmall" style={styles.cardText}>
              Store: {item.store}
            </Text>
          )}
          <Text variant="bodySmall" style={styles.cardText}>
            Uploaded: {format(new Date(item.uploadDate), 'MMM dd, yyyy')}
          </Text>
          {item.expirationDate && (
            <Text
              variant="bodySmall"
              style={[
                styles.cardText,
                new Date(item.expirationDate) < new Date() && styles.expiredText,
              ]}
            >
              Expires: {format(new Date(item.expirationDate), 'MMM dd, yyyy')}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search documents..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <IconButton
              icon="sort"
              size={24}
              onPress={() => setSortMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => handleSort('uploadDate', 'DESC')}
            title="Newest First"
          />
          <Menu.Item
            onPress={() => handleSort('uploadDate', 'ASC')}
            title="Oldest First"
          />
          <Menu.Item
            onPress={() => handleSort('expirationDate', 'ASC')}
            title="Expiring Soon"
          />
          <Menu.Item
            onPress={() => handleSort('title', 'ASC')}
            title="Title A-Z"
          />
        </Menu>
      </View>

      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <Chip
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={styles.categoryChip}
          >
            All
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              selected={selectedCategory === cat.id}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id
                )
              }
              style={styles.categoryChip}
            >
              {cat.name}
            </Chip>
          ))}
        </View>
      )}

      <FlatList
        data={filteredDocuments}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No documents found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
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
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  searchbar: {
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  categoriesContainer: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    flexWrap: 'wrap',
    backgroundColor: theme.colors.surface,
  },
  categoryChip: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  list: {
    padding: theme.spacing.sm,
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  cardInfo: {
    marginTop: theme.spacing.xs,
  },
  cardText: {
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xs,
  },
  expiredText: {
    color: 'red',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.placeholder,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

