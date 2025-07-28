import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ArticleDetailScreen() {
  const params = useLocalSearchParams();
  let article = null;
  let category = params.category || '';
  try {
    article = params.article ? JSON.parse(params.article) : null;
  } catch {
    article = null;
  }
  const router = useRouter();

  if (!article) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Article not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {article.original?.image_url ? (
        <Image source={{ uri: article.original.image_url }} style={styles.image} />
      ) : null}
      <Text style={styles.category}>{category}</Text>
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.meta}>
        {article.original?.source_name} {article.original?.pubDate ? `· ${new Date(article.original.pubDate).toLocaleDateString()}` : ''}
      </Text>
      <Text style={styles.summary}>{article.summary}</Text>
      {article.original?.content && article.original.content !== 'ONLY AVAILABLE IN PAID PLANS' ? (
        <Text style={styles.content}>{article.original.content}</Text>
      ) : (
        article.original?.link ? (
          <TouchableOpacity onPress={() => import('react-native').then(({ Linking }) => Linking.openURL(article.original.link))} style={styles.readBtn}>
            <Text style={styles.readBtnText}>Read Original</Text>
          </TouchableOpacity>
        ) : null
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 18,
    resizeMode: 'cover',
  },
  category: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
  },
  summary: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 18,
  },
  content: {
    fontSize: 16,
    color: '#22223b',
    marginBottom: 24,
  },
  readBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  readBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 18,
  },
  backBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
}); 