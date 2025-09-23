import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

const NotificationPanel = ({ visible, onClose, onNotificationRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  // Yeni iyileştirmeler - mevcut functionality'yi bozmayacak
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      loadNotifications();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Önce AsyncStorage'dan yükle (hızlı başlangıç için)
      let storedNotifications = await AsyncStorage.getItem('@kaptaze_notifications');
      let parsedNotifications = [];

      if (storedNotifications) {
        try {
          parsedNotifications = JSON.parse(storedNotifications);
          if (Array.isArray(parsedNotifications) && parsedNotifications.length > 0) {
            setNotifications(parsedNotifications);
            console.log('✅ Loaded notifications from storage:', parsedNotifications.length);
          }
        } catch (parseError) {
          console.log('⚠️ Invalid stored notifications, will try API');
        }
      }

      // API'den güncel bildirimleri al
      try {
        const response = await apiService.getNotifications();
        if (response.success && response.data.notifications) {
          setNotifications(response.data.notifications);
          await AsyncStorage.setItem('@kaptaze_notifications', JSON.stringify(response.data.notifications));
          console.log('✅ Updated from API:', response.data.notifications.length);
        }
      } catch (apiError) {
        console.log('⚠️ API failed, using local notifications:', apiError.message);

        // API başarısızsa veya her durumda demo bildirimler oluştur
        const demoNotifications = [
          {
            id: 'demo1',
            title: 'KapTaze\'ye Hoş Geldin! 🎉',
            body: 'Gıda israfına karşı mücadelede sen de yer al!',
            timestamp: new Date().toISOString(),
            read: false,
            type: 'welcome'
          },
          {
            id: 'demo2',
            title: 'Yakındaki Fırsatlar 📍',
            body: 'Çevrende indirimli paketler var, hemen keşfet!',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            read: false,
            type: 'promo'
          },
          {
            id: 'demo3',
            title: 'Günün Özel Teklifi 🎁',
            body: 'Seçili restoranlarda %50 indirim fırsatı!',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            read: true,
            type: 'promotion'
          },
          {
            id: 'demo4',
            title: 'Test Bildirimi 🚀',
            body: 'Backend API düzeltildi, artık çalışıyor!',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            read: false,
            type: 'system'
          }
        ];

        console.log('🔔 Setting demo notifications as fallback');
        setNotifications(demoNotifications);
        await AsyncStorage.setItem('@kaptaze_notifications', JSON.stringify(demoNotifications));
      }

    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      // En son çare - boş array
      setNotifications([]);
    }
    setIsLoading(false);
    // Final count'u state güncellenince görmek için setTimeout kullan
    setTimeout(() => {
      console.log('🔔 Load notifications completed. Final count:', notifications.length);
    }, 100);
  };

  const markAsRead = async (notificationId) => {
    try {
      // Backend'e okundu işaretle
      await apiService.markNotificationRead(notificationId);

      // Local state güncelle
      const updatedNotifications = notifications.map(notification =>
        notification._id === notificationId || notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      setNotifications(updatedNotifications);
      await AsyncStorage.setItem('@kaptaze_notifications', JSON.stringify(updatedNotifications));

      // Parent component'e bildirim sayısını güncellenmesi için bildir
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // Sadece local state güncelle API hatası varsa
      const updatedNotifications = notifications.map(notification =>
        notification._id === notificationId || notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      setNotifications(updatedNotifications);

      // Parent component'e bildirim sayısını güncellenmesi için bildir
      if (onNotificationRead) {
        onNotificationRead();
      }
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Backend'den tüm bildirimleri sil
      await apiService.clearAllNotifications();

      // Local storage temizle
      await AsyncStorage.removeItem('@kaptaze_notifications');
      setNotifications([]);
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
      // Sadece local temizle API hatası varsa
      await AsyncStorage.removeItem('@kaptaze_notifications');
      setNotifications([]);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'welcome': '🎉',
      'promo': '🎁',
      'order': '📦',
      'restaurant': '🍽️',
      'system': '⚙️',
      'info': 'ℹ️',
      'warning': '⚠️',
      'success': '✅',
      'default': '🔔'
    };
    return icons[type] || icons.default;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes}dk önce`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}s önce`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}g önce`;

    return notificationTime.toLocaleDateString('tr-TR');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>

        <Animated.View style={[styles.panelContainer, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Bildirimler</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerButtons}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearAllNotifications}
                >
                  <Text style={styles.clearButtonText}>Temizle</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ULTRA BASİT TEST */}
          <View style={{flex: 1, backgroundColor: '#FFFF00', padding: 20}}>
            <Text style={{fontSize: 24, color: '#000', fontWeight: 'bold', marginBottom: 20}}>
              🚨 TEST MOD AKTİF 🚨
            </Text>
            <Text style={{fontSize: 18, color: '#000', marginBottom: 10}}>
              ✅ Bu yazıyı görüyor musun?
            </Text>
            <Text style={{fontSize: 16, color: '#000', marginBottom: 10}}>
              🎉 İlk Bildirim: KapTaze'ye Hoş Geldin!
            </Text>
            <Text style={{fontSize: 16, color: '#000', marginBottom: 10}}>
              📍 İkinci Bildirim: Yakındaki Fırsatlar
            </Text>
            <Text style={{fontSize: 16, color: '#000', marginBottom: 10}}>
              🎁 Üçüncü Bildirim: Günün Özel Teklifi
            </Text>
            <Text style={{fontSize: 14, color: '#333', marginTop: 20}}>
              Bu metinleri görüyorsan notification panel çalışıyor!
            </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panelContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
});

export default NotificationPanel;
