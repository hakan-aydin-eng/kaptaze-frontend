import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUserData } from '../context/UserDataContext';
import apiService from '../services/apiService';

const RatingScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const { updateOrderRating } = useUserData();

  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (starRating) => {
    setRating(starRating);
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeriye erişim izni gerekli.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],  // ✅ Updated from deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Sadece 1 fotoğraf, mevcut fotoğrafı değiştir
        setPhotos([result.assets[0]]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera erişim izni gerekli.');
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Sadece 1 fotoğraf, mevcut fotoğrafı değiştir
        setPhotos([result.assets[0]]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Fotoğraf Ekle',
      'Fotoğraf nasıl eklemek istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Kameradan Çek', onPress: takePhoto },
        { text: 'Galeriden Seç', onPress: pickImage },
      ]
    );
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Hata', 'Lütfen bir puan verin.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare rating data
      const ratingData = {
        orderId: order.id,
        rating,
        photos: photos.map(photo => ({
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.fileName || `rating_photo_${Date.now()}.jpg`,
        })),
      };

      // Submit to backend
      const response = await apiService.submitOrderRating(ratingData);

      if (response.success) {
        // Update local state
        if (updateOrderRating) {
          updateOrderRating(order.id, {
            rating,
            photos: photos.length,
            isRated: true,
          });
        }

        Alert.alert(
          'Teşekkürler! 🎉',
          'Puanlamanız başarıyla kaydedildi. Geri bildiriminiz bizim için çok değerli!',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Rating submission failed');
      }
    } catch (error) {
      console.error('Rating submission error:', error);

      let errorMessage = 'Puanlama kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.';

      // Check for authentication errors
      if (error.message.includes('Invalid token') || error.message.includes('authentication')) {
        errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın ve puanlamayı tekrar deneyin.';
      }

      Alert.alert('Hata', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          style={styles.starButton}
          onPress={() => handleStarPress(i)}
        >
          <Text style={[
            styles.star,
            i <= rating ? styles.starFilled : styles.starEmpty
          ]}>
            ⭐
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    const ratingTexts = {
      1: 'Çok Kötü 😞',
      2: 'Kötü 😕',
      3: 'Orta 😐',
      4: 'İyi 😊',
      5: 'Mükemmel! 🤩',
    };
    return ratingTexts[rating] || 'Puan verin';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sipariş Puanlama</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text style={styles.restaurantName}>{order.restaurant.name}</Text>
          <Text style={styles.packageName}>{order.package.name}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.orderDate).toLocaleDateString('tr-TR')}
          </Text>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>⭐ Deneyiminizi Puanlayın</Text>
          <Text style={styles.sectionSubtitle}>
            Fırsat paketiniz nasıldı? Soldan sağa puan verin:
          </Text>

          <View style={styles.starsContainer}>
            {renderStars()}
          </View>

          <Text style={styles.ratingText}>{getRatingText()}</Text>
        </View>


        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>📸 Fırsat Paketi Fotoğrafları</Text>
          <Text style={styles.sectionSubtitle}>
            Aldığınız fırsat paketinin 1 fotoğrafını paylaşın! 🎁
          </Text>

          {photos.length > 0 && (
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={showPhotoOptions}
          >
            <Text style={styles.addPhotoText}>
              {photos.length > 0 ? '🔄 Fotoğraf Değiştir' : '📷 Fotoğraf Ekle'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonDisabled,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={submitRating}
            disabled={rating === 0 || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Gönderiliyor...' : '🚀 Puanlama Gönder'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.submitHint}>
            Puanlamanız diğer kullanıcılara yardımcı olacak! 💚
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  ratingSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
  },
  starFilled: {
    color: '#f59e0b',
  },
  starEmpty: {
    color: '#e5e7eb',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  photoSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  addPhotoText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  submitSection: {
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RatingScreen;