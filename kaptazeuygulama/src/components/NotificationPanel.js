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
      // Demo için storage'ı temizle - test için
      await AsyncStorage.removeItem('@kaptaze_notifications');

      // Önce AsyncStorage'dan yükle (hızlı başlangıç için)
      let storedNotifications = await AsyncStorage.getItem('@kaptaze_notifications');
      let parsedNotifications = [];

      if (storedNotifications) {
        try {
          parsedNotifications = JSON.parse(storedNotifications);
          // Eğer array boşsa veya geçersizse demo oluştur
          if (!Array.isArray(parsedNotifications) || parsedNotifications.length === 0) {
            throw new Error('Empty or invalid notifications');
          }
          setNotifications(parsedNotifications);
          console.log('✅ Loaded notifications from storage:', parsedNotifications.length);
        } catch (parseError) {
          console.log('⚠️ Invalid stored notifications, creating demo');
          storedNotifications = null; // Demo oluşturmak için
        }
      }

      // Her zaman demo bildirimler oluştur - debug için
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
        }
      ];

      console.log('🔔 Setting demo notifications:', demoNotifications.length);
      setNotifications(demoNotifications);
      console.log('🔔 State updated. Current notifications.length should be:', demoNotifications.length);

      await AsyncStorage.setItem('@kaptaze_notifications', JSON.stringify(demoNotifications));
      console.log('✅ Demo notifications saved to storage');

      // Arka planda API'yi dene (hata verirse sorun değil)
      try {
        const response = await apiService.getNotifications();
        if (response.success && response.data.notifications) {
          setNotifications(response.data.notifications);
          await AsyncStorage.setItem('@kaptaze_notifications', JSON.stringify(response.data.notifications));
          console.log('✅ Updated from API:', response.data.notifications.length);
        }
      } catch (apiError) {
        console.log('⚠️ API failed, using local notifications:', apiError.message);
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

          {/* Notifications List */}
          <ScrollView
            style={styles.notificationsList}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>⏳</Text>
                <Text style={styles.emptyTitle}>Bildirimler yükleniyor...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
                <Text style={styles.emptyText}>
                  Yeni paketler ve özel teklifler hakkında bildirim alacaksın!
                </Text>
                <Text style={styles.emptyText}>Debug: {notifications.length} notification</Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification._id || notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification
                  ]}
                  onPress={() => markAsRead(notification._id || notification.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationIcon}>
                    <Text style={styles.notificationIconText}>
                      {getNotificationIcon(notification.type)}
                    </Text>
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadText
                    ]}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationBody} numberOfLines={2}>
                      {notification.body}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {getTimeAgo(notification.timestamp)}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View style={styles.unreadDot} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
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
    paddingBottom: 34, // iOS safe area
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
  markAllButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  markAllButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
  notificationsList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  unreadNotification: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationIconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
    paddingRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  unreadText: {
    color: '#1f2937',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginTop: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flex: 1,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 14,
  },
});

export default NotificationPanel;