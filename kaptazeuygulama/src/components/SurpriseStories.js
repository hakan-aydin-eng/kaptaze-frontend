import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import apiService from '../services/apiService';
import StoryModal from './StoryModal';

const { width } = Dimensions.get('window');
const STORY_SIZE = (width - 48) / 4; // 4 stories per row with padding

const SurpriseStories = ({ userCity }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadStories();
  }, [userCity]);

  const loadStories = async () => {
    try {
      setLoading(true);
      console.log('📸 Loading surprise stories for city:', userCity || 'all cities');
      const response = await apiService.getSurpriseStories(10, userCity);

      console.log('📸 Stories API response:', response);
      console.log('📸 Stories count:', response.stories ? response.stories.length : 0);
      console.log('📸 Full response:', JSON.stringify(response, null, 2));

      if (response.success) {
        const stories = response.data?.stories || response.stories || [];
        console.log('📸 Extracted stories:', stories);
        console.log('📸 First story image:', stories[0]?.image);
        setStories(stories);
        console.log('📸 Stories updated in state:', stories.length);
      } else {
        console.warn('Failed to load surprise stories:', response.message);
      }
    } catch (error) {
      console.error('Error loading surprise stories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStories();
  };

  const openStory = (index) => {
    setSelectedStoryIndex(index);
    setModalVisible(true);
  };

  const closeStory = () => {
    setModalVisible(false);
    setSelectedStoryIndex(null);
  };

  const nextStory = () => {
    if (selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else {
      closeStory();
    }
  };

  const previousStory = () => {
    if (selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📸 Sürpriz Hikayeler</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Hikayeler yükleniyor... 🔄</Text>
        </View>
      </View>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📸 Sürpriz Hikayeler</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz sürpriz hikaye yok 📱</Text>
          <Text style={styles.emptySubtext}>
            İlk sen bir paket sipariş et ve puanlarken fotoğraf ekle! 🎁
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 Sürpriz Hikayeler</Text>
      <Text style={styles.subtitle}>
        Kullanıcılarımızın aldığı sürpriz paketler! 😍
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#16a34a']}
            tintColor="#16a34a"
          />
        }
      >
        {stories.map((story, index) => (
          <TouchableOpacity
            key={story.id || story._id || `story-${index}`}
            style={styles.storyItem}
            onPress={() => openStory(index)}
            activeOpacity={0.8}
          >
            <View style={styles.storyImageContainer}>
              <Image
                source={{
                  uri: (story.image && story.image.startsWith('http'))
                    ? story.image
                    : story.photoUrl?.startsWith('http')
                    ? story.photoUrl
                    : story.photos?.[0]?.url?.startsWith('http')
                    ? story.photos?.[0]?.url
                    : 'https://picsum.photos/400/300?random=' + (story.id || Math.random())
                }}
                style={styles.storyImage}
                resizeMode="cover"
              />
              <View style={styles.storyGradient} />

              {/* Rating badge */}
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐{story.rating}</Text>
              </View>

              {/* User info */}
              <View style={styles.storyInfo}>
                <Text style={styles.storyUserName} numberOfLines={1}>
                  {story.userName || story.consumer?.name || 'Anonim'}
                </Text>
                <Text style={styles.storyRestaurant} numberOfLines={1}>
                  {story.restaurantName || story.restaurant?.name || 'Restaurant'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Story Modal */}
      {modalVisible && selectedStoryIndex !== null && (
        <StoryModal
          visible={modalVisible}
          story={stories[selectedStoryIndex]}
          onClose={closeStory}
          onNext={nextStory}
          onPrevious={previousStory}
          hasNext={selectedStoryIndex < stories.length - 1}
          hasPrevious={selectedStoryIndex > 0}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  storiesContainer: {
    gap: 12,
    paddingHorizontal: 4,
  },
  storyItem: {
    width: STORY_SIZE,
    height: STORY_SIZE * 1.4, // Slightly taller for story format
  },
  storyImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  storyInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  storyUserName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  storyRestaurant: {
    color: '#ffffff',
    fontSize: 10,
    opacity: 0.8,
  },
});

export default SurpriseStories;