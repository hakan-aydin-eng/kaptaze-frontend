import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useUserData } from '../context/UserDataContext';

const OrdersScreen = ({ navigation }) => {
  const { orders, currentUser, updateOrderStatus } = useUserData();

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'Onay Bekliyor', color: '#f59e0b', bgColor: '#fef3c7' },
      confirmed: { text: 'Onaylandı', color: '#1d4ed8', bgColor: '#dbeafe' },
      preparing: { text: 'Onaylandı', color: '#1d4ed8', bgColor: '#dbeafe' }, // Backward compatibility
      ready: { text: 'Hazır', color: '#16a34a', bgColor: '#dcfce7' },
      completed: { text: 'Tamamlandı', color: '#059669', bgColor: '#d1fae5' },
      delivered: { text: 'Tamamlandı', color: '#059669', bgColor: '#d1fae5' }, // Backward compatibility
      cancelled: { text: 'İptal Edildi', color: '#dc2626', bgColor: '#fee2e2' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const openNavigation = (restaurant) => {
    console.log('🗺️ Opening navigation for restaurant:', restaurant.name);
    console.log('📍 Restaurant location:', restaurant.location);
    
    const restaurantCoords = restaurant.location?.coordinates || [30.7133, 36.8969]; // Default Antalya coordinates
    const lat = restaurant.location?.coordinates ? restaurant.location.coordinates[1] : 36.8969;
    const lng = restaurant.location?.coordinates ? restaurant.location.coordinates[0] : 30.7133;
    
    console.log('🎯 Navigation coordinates:', { lat, lng });
    
    // iOS ve Android her ikisi için de Google Maps kullan
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    Linking.canOpenURL(googleMapsUrl).then(supported => {
      if (supported) {
        console.log('✅ Opening Google Maps with URL:', googleMapsUrl);
        Linking.openURL(googleMapsUrl);
      } else {
        console.log('❌ Cannot open Google Maps');
        Alert.alert('Hata', 'Harita uygulaması açılamadı.');
      }
    }).catch(error => {
      console.log('❌ Navigation error:', error);
      Alert.alert('Hata', 'Navigasyon açılırken bir hata oluştu.');
    });
  };

  const handleOrderAction = (order) => {
    if (order.status === 'ready') {
      Alert.alert(
        'Siparişi Teslim Al',
        `${order.restaurant.name} restoranından siparişinizi teslim aldınız mı?`,
        [
          { text: 'Hayır', style: 'cancel' },
          { 
            text: 'Evet, Teslim Aldım', 
            onPress: () => updateOrderStatus(order.id, 'completed')
          }
        ]
      );
    } else if (order.status === 'pending') {
      Alert.alert(
        'Siparişi İptal Et',
        'Bu siparişi iptal etmek istediğinize emin misiniz?',
        [
          { text: 'Hayır', style: 'cancel' },
          { 
            text: 'Evet, İptal Et', 
            style: 'destructive',
            onPress: () => updateOrderStatus(order.id, 'cancelled')
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Siparişlerim</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.title}>📋 Siparişlerim</Text>
        </View>
        
        {!currentUser ? (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginIcon}>👤</Text>
            <Text style={styles.loginTitle}>Giriş Yapın</Text>
            <Text style={styles.loginDescription}>
              Siparişlerinizi görmek için giriş yapmalısınız.
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Henüz sipariş yok</Text>
            <Text style={styles.emptyDescription}>
              İlk siparişinizi verin, siparişleriniz burada görünsün!
            </Text>
            <TouchableOpacity 
              style={styles.orderButton}
              onPress={() => navigation.navigate('Main')}
            >
              <Text style={styles.orderButtonText}>Sipariş Ver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Order Header */}
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderRestaurant}>{order.restaurant.name}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: statusInfo.bgColor }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: statusInfo.color }
                      ]}>
                        {statusInfo.text}
                      </Text>
                    </View>
                  </View>

                  {/* Order Details */}
                  <View style={styles.orderDetails}>
                    <Text style={styles.packageName}>{order.package.name}</Text>
                    <Text style={styles.packageDescription}>{order.package.description}</Text>
                    
                    <View style={styles.orderMeta}>
                      <Text style={styles.orderQuantity}>Miktar: {order.quantity} adet</Text>
                      <Text style={styles.orderPrice}>₺{order.totalPrice}</Text>
                    </View>
                    
                    <View style={styles.orderSavings}>
                      <Text style={styles.savingsText}>
                        ₺{order.savings} tasarruf ettiniz!
                      </Text>
                    </View>
                  </View>

                  {/* Pickup Info */}
                  <View style={styles.pickupInfo}>
                    <View style={styles.pickupRow}>
                      <Text style={styles.pickupIcon}>📋</Text>
                      <Text style={styles.pickupText}>Kod: {order.pickupCode}</Text>
                    </View>
                    <View style={styles.pickupRow}>
                      <Text style={styles.pickupIcon}>⏰</Text>
                      <Text style={styles.pickupText}>Teslim: {order.pickupTime}</Text>
                    </View>

                    {/* Status-specific notifications */}
                    {order.status === 'pending' && (
                      <View style={styles.statusNotification}>
                        <Text style={styles.statusNotificationText}>
                          ⏳ Siparişin onay bekliyor! Restaurant en kısa sürede onaylayacak.
                        </Text>
                      </View>
                    )}

                    {order.status === 'confirmed' && (
                      <View style={styles.statusNotification}>
                        <Text style={styles.statusNotificationText}>
                          ✅ Siparişin onaylandı! Restaurant paketini hazırlıyor.
                        </Text>
                      </View>
                    )}

                    {order.status === 'ready' && (
                      <View style={styles.statusNotification}>
                        <Text style={styles.statusNotificationText}>
                          🎉 Paketiniz hazır! Hemen alabilirsiniz.
                        </Text>
                      </View>
                    )}

                    {/* Puanlama teşviki - tüm aktif siparişlerde göster */}
                    {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready') && !order.isRated && (
                      <View style={styles.ratingEncouragement}>
                        <Text style={styles.ratingEncouragementText}>
                          ⭐ Teslim aldıktan sonra puanlamayı unutma! 😊
                        </Text>
                        <Text style={styles.photoEncouragementText}>
                          📸 Sürpriz paketinin fotoğrafını çekip puanlama ekranına ekleyebilirsin! 🎁
                        </Text>
                      </View>
                    )}

                    {order.status === 'completed' && !order.isRated && (
                      <View style={styles.ratingReminder}>
                        <Text style={styles.ratingReminderText}>
                          ⭐ Teslim aldıktan sonra puanlamayı unutma! 😊
                        </Text>
                        <Text style={styles.photoReminderText}>
                          📸 Sürpriz paketinin fotoğrafını çekip puanlama ekranına ekleyebilirsin! 🎁
                        </Text>
                      </View>
                    )}

                    {order.status === 'completed' && order.isRated && (
                      <View style={styles.statusNotification}>
                        <Text style={styles.statusNotificationText}>
                          💚 Teşekkürler! Puanlamanız kaydedildi.
                        </Text>
                      </View>
                    )}

                    {order.status === 'cancelled' && (
                      <View style={styles.cancelledNotification}>
                        <Text style={styles.cancelledNotificationText}>
                          ❌ Bu sipariş iptal edildi.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  {order.status !== 'cancelled' && (
                    <View style={styles.actionButtonsContainer}>
                      {/* Yol tarifi butonu - iptal edilmemiş siparişler için göster */}
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.navigationButton]}
                        onPress={() => openNavigation(order.restaurant)}
                      >
                        <Text style={styles.actionButtonText}>📍 Yol Tarifi Al</Text>
                      </TouchableOpacity>
                      
                      {/* Durum butonları */}
                      {(order.status === 'ready' || order.status === 'pending') && (
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            order.status === 'ready' ? styles.readyButton : styles.cancelButton
                          ]}
                          onPress={() => handleOrderAction(order)}
                        >
                          <Text style={styles.actionButtonText}>
                            {order.status === 'ready' ? 'Teslim Aldım' : 'İptal Et'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Rating button for completed orders */}
                      {order.status === 'completed' && !order.isRated && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.ratingButton]}
                          onPress={() => navigation.navigate('Rating', { order })}
                        >
                          <Text style={styles.actionButtonText}>⭐ Puanla</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* İptal edilen siparişler için sadece durum göster */}
                  {order.status === 'cancelled' && (
                    <View style={styles.cancelledInfo}>
                      <Text style={styles.cancelledText}>❌ Sipariş İptal Edildi</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
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
    borderWidth: 2,
    borderColor: '#ffffff',
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
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  homeIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  pageHeader: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  orderButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  orderButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPrompt: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  loginIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  loginDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  ordersList: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderRestaurant: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  orderSavings: {
    alignItems: 'flex-end',
  },
  savingsText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  pickupInfo: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  pickupText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  readyButton: {
    backgroundColor: '#16a34a',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  navigationButton: {
    backgroundColor: '#16a34a',
  },
  halfWidth: {
    flex: 1,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelledInfo: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelledText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingReminder: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  ratingReminderText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
    marginBottom: 4,
  },
  photoReminderText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  ratingButton: {
    backgroundColor: '#f59e0b',
  },
  statusNotification: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
  },
  statusNotificationText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelledNotification: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
  },
  cancelledNotificationText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    textAlign: 'center',
  },
  ratingEncouragement: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
  },
  ratingEncouragementText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  photoEncouragementText: {
    fontSize: 11,
    color: '#92400e',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default OrdersScreen;