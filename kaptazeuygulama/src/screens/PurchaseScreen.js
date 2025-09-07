import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useUserData } from '../context/UserDataContext';

const PurchaseScreen = ({ route, navigation }) => {
  const { restaurant, package: selectedPackage, quantity } = route.params;
  const { addOrder, currentUser } = useUserData();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const totalPrice = selectedPackage.salePrice * quantity;
  const originalTotal = selectedPackage.originalPrice * quantity;
  const totalSavings = originalTotal - totalPrice;

  const paymentMethods = [
    { id: 'cash', name: 'Nakit', icon: '💵' },
    { id: 'card', name: 'Kredi/Banka Kartı', icon: '💳' },
    { id: 'online', name: 'Online Ödeme', icon: '📱' },
  ];

  const confirmPurchase = async () => {
    Alert.alert(
      'Rezervasyonu Onayla',
      `${restaurant.name}'dan ${selectedPackage.name} (${quantity} adet) rezerve etmek istiyorsunuz?\n\nToplam: ₺${totalPrice}\n\nRezerve ettiğiniz paketi restorana giderek teslim alabilirsiniz.`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Rezerve Et', 
          onPress: async () => {
            try {
              // Debug logging
              console.log('Restaurant data:', restaurant);
              console.log('Package data:', selectedPackage);
              
              // Prepare order data for backend
              const orderData = {
                customer: {
                  id: currentUser?.id || 'guest_' + Date.now(),
                  name: 'Paket Siparişi',
                  phone: 'Mobil Uygulama',
                  address: 'Restorana gelip alacak'
                },
                restaurantId: restaurant._id || restaurant.id,
                items: [{
                  productId: selectedPackage.id || selectedPackage._id,
                  name: selectedPackage.name,
                  price: selectedPackage.salePrice,
                  quantity: quantity,
                  total: selectedPackage.salePrice * quantity
                }],
                totalAmount: totalPrice,
                paymentMethod: paymentMethod,
                notes: notes || 'Mobil uygulama rezervasyonu'
              };

              // Debug order data
              console.log('Order data being sent:', orderData);

              // Send order to backend
              const API_URL = 'https://kaptaze-backend-api.onrender.com';
              const response = await fetch(`${API_URL}/orders/create`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
              });

              console.log('Response status:', response.status);
              const result = await response.json();
              console.log('Response data:', result);
              
              if (response.ok && result.success) {
                // Also save to local context
                await addOrder({
                  restaurant,
                  package: selectedPackage,
                  quantity,
                  totalPrice,
                  originalPrice: originalTotal,
                  paymentMethod,
                  orderId: result.orderId
                });

                Alert.alert(
                  'Başarılı! 🎉',
                  `Rezervasyonunuz alındı. Rezervasyon No: #${result.orderId.slice(-6)}\n\nPaketinizi ${restaurant.name} restoranına giderek teslim alabilirsiniz.\n\nTeslim saatleri: 18:00 - 21:00`,
                  [
                    { 
                      text: 'Siparişlerim', 
                      onPress: () => navigation.navigate('Orders')
                    },
                    { 
                      text: 'Ana Sayfa', 
                      onPress: () => navigation.navigate('Main')
                    }
                  ]
                );
              } else {
                Alert.alert('Hata', result.error || 'Rezervasyon oluşturulurken bir hata oluştu.');
              }
            } catch (error) {
              console.error('Order creation error:', error);
              Alert.alert('Hata', 'Rezervasyon oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
            }
          }
        }
      ]
    );
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
        <Text style={styles.headerTitle}>Satın Al</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Sipariş Özeti */}
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>📋 Sipariş Özeti</Text>
          
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantCategory}>{restaurant.category}</Text>
          </View>

          <View style={styles.packageInfo}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{selectedPackage.name}</Text>
              <Text style={styles.packageQuantity}>x{quantity}</Text>
            </View>
            <Text style={styles.packageDescription}>{selectedPackage.description}</Text>
            
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Birim Fiyat:</Text>
                <View style={styles.priceRight}>
                  <Text style={styles.originalPrice}>₺{selectedPackage.originalPrice}</Text>
                  <Text style={styles.salePrice}>₺{selectedPackage.salePrice}</Text>
                </View>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Miktar:</Text>
                <Text style={styles.priceValue}>{quantity} adet</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Toplam:</Text>
                <Text style={styles.totalPrice}>₺{totalPrice}</Text>
              </View>
              
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>Toplam Tasarruf:</Text>
                <Text style={styles.savingsAmount}>₺{totalSavings}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Teslim Alma Bilgileri */}
        <View style={styles.pickupInfo}>
          <Text style={styles.sectionTitle}>📍 Teslim Alma Bilgileri</Text>
          
          <View style={styles.pickupDetails}>
            <View style={styles.pickupRow}>
              <Text style={styles.pickupIcon}>⏰</Text>
              <View>
                <Text style={styles.pickupLabel}>Teslim Saatleri</Text>
                <Text style={styles.pickupValue}>18:00 - 21:00</Text>
              </View>
            </View>
            
            <View style={styles.pickupRow}>
              <Text style={styles.pickupIcon}>📍</Text>
              <View>
                <Text style={styles.pickupLabel}>Adres</Text>
                <Text style={styles.pickupValue}>
                  {restaurant.address 
                    ? (typeof restaurant.address === 'object' 
                        ? `${restaurant.address.street || ''} ${restaurant.address.district || ''} ${restaurant.address.city || ''}`.trim()
                        : restaurant.address)
                    : restaurant.location?.address
                      ? (typeof restaurant.location.address === 'object'
                          ? `${restaurant.location.address.street || ''} ${restaurant.location.address.district || ''} ${restaurant.location.address.city || ''}`.trim()
                          : restaurant.location.address)
                      : 'Restoran adresi belirtilmemiş'}
                </Text>
              </View>
            </View>
            
          </View>
          
          <View style={styles.importantNote}>
            <Text style={styles.noteIcon}>💡</Text>
            <Text style={styles.noteText}>
              Teslim alırken kimlik belgesi götürmeyi unutmayın!
            </Text>
          </View>
        </View>

        {/* Rezervasyon Notu */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>📝 Rezervasyon Notu (Opsiyonel)</Text>
          
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Özel bir isteğiniz var mı?"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Ödeme Yöntemi */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>💳 Ödeme Yöntemi</Text>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                paymentMethod === method.id && styles.paymentMethodSelected
              ]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={styles.paymentLeft}>
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <Text style={styles.paymentName}>{method.name}</Text>
              </View>
              <View style={[
                styles.radioButton,
                paymentMethod === method.id && styles.radioButtonSelected
              ]}>
                {paymentMethod === method.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gıda İsrafı Bilgisi */}
        <View style={styles.impactSection}>
          <Text style={styles.impactTitle}>🌱 Çevresel Etki</Text>
          <Text style={styles.impactDescription}>
            Bu siparişle yaklaşık <Text style={styles.impactHighlight}>1.2 kg</Text> gıda israfını önlüyorsunuz ve 
            <Text style={styles.impactHighlight}> 3.5 kg CO₂</Text> emisyon tasarrufu sağlıyorsunuz!
          </Text>
        </View>
      </ScrollView>

      {/* Alt Kısım - Toplam ve Satın Al */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomPricing}>
          <Text style={styles.bottomTotalLabel}>Toplam Tutar</Text>
          <View style={styles.bottomPriceContainer}>
            <Text style={styles.bottomOriginalPrice}>₺{originalTotal}</Text>
            <Text style={styles.bottomFinalPrice}>₺{totalPrice}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.purchaseButton}
          onPress={confirmPurchase}
        >
          <Text style={styles.purchaseButtonText}>🎯 Rezerve Et</Text>
        </TouchableOpacity>
      </View>
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
  orderSummary: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  restaurantInfo: {
    marginBottom: 16,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  restaurantCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  packageInfo: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  packageQuantity: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  packageDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  priceBreakdown: {
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  salePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  priceValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  savingsLabel: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  savingsAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  pickupInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickupDetails: {
    marginBottom: 16,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pickupIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  pickupLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  pickupValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  importantNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  noteIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  notesSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  paymentSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentMethodSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  paymentName: {
    fontSize: 16,
    color: '#111827',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#16a34a',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
  },
  impactSection: {
    backgroundColor: '#f0fdf4',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 8,
  },
  impactDescription: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  impactHighlight: {
    fontWeight: 'bold',
    color: '#14532d',
  },
  bottomSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bottomPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomTotalLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  bottomPriceContainer: {
    alignItems: 'flex-end',
  },
  bottomOriginalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  bottomFinalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  purchaseButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PurchaseScreen;