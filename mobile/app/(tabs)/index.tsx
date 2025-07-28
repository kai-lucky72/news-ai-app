import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.67:8000'; // Updated for Android device access

const categoriesList = [
  'All',
  'Politics', 'Business', 'Crime', 'Investigative', 'Local News',
  'International/World News', 'Science and Technology', 'Health',
  'Entertainment', 'Lifestyle', 'Culture', 'Human Interest',
  'Sports', 'Feature Articles', 'Opinion Pieces',
];

export default function HomeScreen() {
  const [categories, setCategories] = useState(categoriesList);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchArticles = async (category) => {
    setLoading(true);
    setError(null);
    try {
      const url = category === 'All'
        ? `${API_URL}/articles`
        : `${API_URL}/articles?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError('Failed to load articles.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles(selectedCategory);
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchArticles(selectedCategory);
  };

  const renderCategory = (cat) => (
    <TouchableOpacity
      key={cat}
      style={[
        styles.categoryPill,
        selectedCategory === cat && styles.categoryPillSelected,
      ]}
      onPress={() => setSelectedCategory(cat)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === cat && styles.categoryTextSelected,
      ]}>{cat}</Text>
    </TouchableOpacity>
  );

  const renderArticle = ({ item }) => (
    <TouchableOpacity onPress={() => router.push({ pathname: '/article', params: { article: JSON.stringify(item), category: selectedCategory } })}>
      <View style={styles.card}>
        {item.original?.image_url ? (
          <Image source={{ uri: item.original.image_url }} style={styles.cardImage} />
        ) : null}
        <View style={styles.cardContent}>
          <Text style={styles.cardCategory}>{selectedCategory}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardMeta}>
            {item.original?.source_name} {item.original?.pubDate ? `· ${new Date(item.original.pubDate).toLocaleDateString()}` : ''}
          </Text>
          <Text style={styles.cardSummary} numberOfLines={3}>{item.summary}</Text>
          {item.original?.link ? (
            <TouchableOpacity onPress={() => {
              import('react-native').then(({ Linking }) => Linking.openURL(item.original.link));
            }}>
              <Text style={styles.cardLink}>Continue Reading</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesBar}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {categories.map(renderCategory)}
      </ScrollView>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderArticle}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No articles found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  categoriesBar: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  categoryPillSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  categoryText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 15,
  },
  categoryTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  cardSummary: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 10,
  },
  cardLink: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: 15,
    marginTop: 4,
  },
});
