import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useUserData } from '../context/UserDataContext';

const OrdersScreen = ({ navigation }) => {
  const { orders, currentUser, updateOrderStatus } = useUserData();

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'Onay Bekliyor', color: '#f59e0b', bgColor: '#fef3c7' },
      confirmed: { text: 'Onaylandı', color: '#1d4ed8', bgColor: '#dbeafe' },
      ready: { text: 'Hazır', color: '#16a34a', bgColor: '#dcfce7' },
      completed: { text: 'Tamamlandı', color: '#059669', bgColor: '#d1fae5' },
      cancelled: { text: 'İptal Edildi', color: '#dc2626', bgColor: '#fee2e2' },
    };
    return statusMap[status] || statusMap.pending;
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Siparişlerim</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.title}>📋 Siparişlerim</Text>
          <Text style={styles.subtitle}>
            {currentUser ? `${orders.length} sipariş` : 'Giriş yapın'}
          </Text>
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
                  </View>

                  {/* Action Button */}
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
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#374151',
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
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  readyButton: {
    backgroundColor: '#16a34a',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrdersScreen;