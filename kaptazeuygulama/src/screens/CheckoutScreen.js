import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCardInput } from 'react-native-credit-card-input';
import { WebView } from 'react-native-webview';
import apiService from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserData } from '../context/UserDataContext';

const CheckoutScreen = ({ route, navigation }) => {
  const { basketItems, totalAmount, restaurant } = route.params;
  const { currentUser } = useUserData();

  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({});
  const [saveCard, setSaveCard] = useState(false);

  // 3D Secure states
  const [showWebView, setShowWebView] = useState(false);
  const [threeDSHtml, setThreeDSHtml] = useState('');
  const [billingInfo, setBillingInfo] = useState({
    name: currentUser?.name || '',
    surname: currentUser?.surname || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: '',
    city: 'Antalya',
    zipCode: '07000'
  });

  // Update billing info when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setBillingInfo(prev => ({
        ...prev,
        name: currentUser.name || '',
        surname: currentUser.surname || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      }));
    }
  }, [currentUser]);

  const handlePayment = async () => {
    console.log('💳 Starting payment process...');

    // Validate card data
    if (!cardData.values?.number || !cardData.values?.expiry || !cardData.values?.cvc) {
      Alert.alert('Kart Bilgisi Hatası', 'Lütfen tüm kart bilgilerini girin.');
      return;
    }

    // Validate billing info
    if (!billingInfo.name || !billingInfo.surname || !billingInfo.email) {
      Alert.alert('Fatura Bilgisi Eksik', 'İyzico güvenliği için fatura bilgileri zorunludur. Lütfen ad, soyad ve e-posta adresinizi girin.');
      return;
    }

    setLoading(true);

    try {
      console.log('💳 Creating payment request...');

      // Format card data for Iyzico
      const cardInfo = {
        cardHolderName: cardData.values.name || `${billingInfo.name} ${billingInfo.surname}`,
        cardNumber: cardData.values.number.replace(/\s/g, ''),
        expireMonth: cardData.values.expiry.split('/')[0],
        expireYear: '20' + cardData.values.expiry.split('/')[1],
        cvc: cardData.values.cvc,
        saveCard: saveCard // Kartı kaydet seçeneği
      };

      const paymentData = {
        amount: totalAmount,
        basketItems: basketItems.map(item => ({
          packageId: item._id,
          packageName: item.packageName,
          quantity: item.quantity || 1,
          price: item.discountedPrice || item.price
        })),
        restaurantId: restaurant._id,
        cardInfo,
        billingInfo
      };

      console.log('💳 Payment data prepared:', {
        amount: paymentData.amount,
        basketItemsCount: paymentData.basketItems.length,
        restaurant: restaurant.name
      });

      // Send payment request to backend
      const result = await apiService.createPayment(paymentData);

      console.log('✅ Payment result:', result);

      if (result.success) {
        if (result.status === 'waiting_3d_secure' && result.threeDSHtmlContent) {
          // 3D Secure verification required
          console.log('🔒 3D Secure verification required');

          // Decode Base64 HTML content
          try {
            const decodedHtml = atob(result.threeDSHtmlContent);
            console.log('🔒 Decoded HTML length:', decodedHtml.length);
            setThreeDSHtml(decodedHtml);
          } catch (error) {
            console.error('🔒 Base64 decode error:', error);
            setThreeDSHtml(result.threeDSHtmlContent); // Fallback to original
          }

          setShowWebView(true);
        } else {
          // Payment successful - navigate to success screen
          Alert.alert(
            'Ödeme Başarılı! 🎉',
            `Sipariş kodunuz: ${result.orderCode}\n\nRestorana giderek siparişinizi teslim alabilirsiniz.`,
            [
              {
                text: 'Siparişlerim',
                onPress: () => navigation.navigate('Orders')
              }
            ]
          );
        }
      } else {
        Alert.alert('Ödeme Hatası', result.error || 'Ödeme işlemi başarısız oldu.');
      }

    } catch (error) {
      console.error('💳 Payment error:', error);

      let errorMessage = 'Ödeme işlemi sırasında bir hata oluştu.';

      if (error.message.includes('Invalid card')) {
        errorMessage = 'Kart bilgileri geçersiz. Lütfen kontrol edin.';
      } else if (error.message.includes('Insufficient')) {
        errorMessage = 'Yetersiz bakiye. Lütfen başka bir kart deneyin.';
      } else if (error.message.includes('3D Secure')) {
        errorMessage = '3D Secure doğrulama başarısız. Lütfen tekrar deneyin.';
      }

      Alert.alert('Ödeme Hatası', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const _onChange = (cardData) => {
    setCardData(cardData);
    console.log('💳 Card data updated:', {
      valid: cardData.valid,
      brand: cardData.values?.type,
      status: cardData.status,
      values: cardData.values
    });
  };

  // Ödeme butonunun aktif olup olmadığını kontrol et
  const isPaymentReady = () => {
    const hasCardInfo = cardData.values &&
      cardData.values.number &&
      cardData.values.expiry &&
      cardData.values.cvc;

    const hasBillingInfo = billingInfo.name &&
      billingInfo.surname &&
      billingInfo.email;

    return hasCardInfo && hasBillingInfo;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f0fdf4', '#dcfce7']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ödeme</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Sipariş Özeti</Text>
            <View style={styles.orderSummary}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>

              {basketItems.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <Text style={styles.itemName}>{item.packageName}</Text>
                  <Text style={styles.itemPrice}>₺{item.discountedPrice || item.price}</Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Toplam:</Text>
                <Text style={styles.totalAmount}>₺{totalAmount}</Text>
              </View>
            </View>
          </View>

          {/* Credit Card Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Kart Bilgileri</Text>
            <View style={styles.cardContainer}>
              <CreditCardInput
                onChange={_onChange}
                allowScroll={true}
                autoFocus={false}
                requiresName={true}
                requiresCVC={true}
                validColor={'#16a34a'}
                invalidColor={'#ef4444'}
                placeholderColor={'#9ca3af'}
                cardImageFront={require('../../assets/adaptive-icon.png')}
                cardImageBack={require('../../assets/adaptive-icon.png')}
                labels={{
                  number: 'KART NUMARASI',
                  expiry: 'SON KULLANMA',
                  cvc: 'CVV',
                  name: 'KART SAHİBİ'
                }}
                placeholders={{
                  number: '1234 5678 9012 3456',
                  expiry: 'AA/YY',
                  cvc: 'CVV',
                  name: 'Ad Soyad'
                }}
              />
            </View>

            {/* Save Card Checkbox */}
            <TouchableOpacity
              style={styles.saveCardOption}
              onPress={() => setSaveCard(!saveCard)}
            >
              <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
                {saveCard && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.saveCardTextContainer}>
                <Text style={styles.saveCardText}>
                  Kart bilgilerini güvenli şekilde kaydet (Hızlı ödeme için)
                </Text>
                <Text style={styles.securityNote}>
                  🔒 Kart bilgileri KapTaze'de saklanmaz. İyzico güvenli veritabanından token alınır.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Test Card Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧪 Test Kartları</Text>
            <View style={styles.testCards}>
              <Text style={styles.testCardTitle}>Test için kullanabilirsiniz:</Text>
              <Text style={styles.testCardNumber}>✅ Başarılı: 5528 7900 0000 0006</Text>
              <Text style={styles.testCardNumber}>❌ Başarısız: 5406 6700 0000 0009</Text>
              <Text style={styles.testCardDetails}>Son kullanma: 12/30, CVV: 123</Text>
            </View>
          </View>

          {/* Billing Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Fatura Bilgileri</Text>
            <View style={styles.requiredInfo}>
              <Text style={styles.requiredIcon}>⚠️</Text>
              <Text style={styles.requiredText}>
                Güvenli ödeme için fatura bilgileri zorunludur. Bilgileriniz gizli tutulur.
              </Text>
            </View>
            <View style={styles.billingForm}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Ad"
                  value={billingInfo.name}
                  onChangeText={(text) => setBillingInfo(prev => ({ ...prev, name: text }))}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Soyad"
                  value={billingInfo.surname}
                  onChangeText={(text) => setBillingInfo(prev => ({ ...prev, surname: text }))}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="E-posta"
                value={billingInfo.email}
                onChangeText={(text) => setBillingInfo(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
              />

              <TextInput
                style={styles.input}
                placeholder="Telefon"
                value={billingInfo.phone}
                onChangeText={(text) => setBillingInfo(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Payment Button */}
          <TouchableOpacity
            style={[styles.payButton, (!isPaymentReady() || loading) && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={!isPaymentReady() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.payButtonText}>₺{totalAmount} Öde</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>
      </LinearGradient>

      {/* 3D Secure WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
            backgroundColor: '#ffffff'
          }}>
            <TouchableOpacity
              onPress={() => setShowWebView(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#f3f4f6',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}
            >
              <Text style={{ fontSize: 18, color: '#374151' }}>×</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
              3D Secure Doğrulama
            </Text>
          </View>

          {threeDSHtml ? (
            <WebView
              source={{ html: threeDSHtml }}
              style={{ flex: 1 }}
              onNavigationStateChange={(navState) => {
                console.log('🔒 WebView navigation:', navState.url);

                // Check if redirected back to app (payment completed)
                if (navState.url.includes('kaptaze://payment-success')) {
                  setShowWebView(false);

                  // Extract order details from URL
                  const urlParams = new URLSearchParams(navState.url.split('?')[1] || '');
                  const orderId = urlParams.get('orderId');
                  const orderCode = urlParams.get('orderCode');

                  Alert.alert(
                    'Ödeme Başarılı! 🎉',
                    `Sipariş kodunuz: ${orderCode || 'N/A'}\n\nSiparişiniz onaylandı. Restorana giderek teslim alabilirsiniz.`,
                    [
                      {
                        text: 'Siparişlerim',
                        onPress: () => navigation.navigate('Orders')
                      }
                    ]
                  );
                  return false; // Prevent WebView from handling the deep link
                } else if (navState.url.includes('kaptaze://payment-failed')) {
                  setShowWebView(false);
                  Alert.alert('Ödeme Hatası', '3D Secure doğrulama başarısız. Lütfen tekrar deneyin.');
                  return false; // Prevent WebView from handling the deep link
                } else if (navState.url.includes('/payment/3ds-callback')) {
                  // Backend callback endpoint - wait for redirect
                  console.log('🔒 Backend processing payment...');
                }
              }}
              onShouldStartLoadWithRequest={(request) => {
                console.log('🔒 WebView should start load:', request.url);

                // Handle deep links manually
                if (request.url.includes('kaptaze://payment-success')) {
                  setShowWebView(false);

                  // Extract order details from URL
                  const urlParams = new URLSearchParams(request.url.split('?')[1] || '');
                  const orderId = urlParams.get('orderId');
                  const orderCode = urlParams.get('orderCode');

                  Alert.alert(
                    'Ödeme Başarılı! 🎉',
                    `Sipariş kodunuz: ${orderCode || 'N/A'}\n\nSiparişiniz onaylandı. Restorana giderek teslim alabilirsiniz.`,
                    [
                      {
                        text: 'Siparişlerim',
                        onPress: () => navigation.navigate('Orders')
                      }
                    ]
                  );
                  return false; // Prevent navigation
                }

                if (request.url.includes('kaptaze://payment-failed')) {
                  setShowWebView(false);
                  Alert.alert('Ödeme Hatası', '3D Secure doğrulama başarısız. Lütfen tekrar deneyin.');
                  return false; // Prevent navigation
                }

                // Allow all other navigations
                return true;
              }}
              onError={(error) => {
                console.error('🔒 WebView error:', error);
                setShowWebView(false);
                Alert.alert('Hata', '3D Secure sayfası yüklenirken hata oluştu.');
              }}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={{ marginTop: 16, color: '#6b7280' }}>3D Secure sayfası yükleniyor...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    fontSize: 18,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  orderSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemName: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#16a34a',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  testCards: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  testCardTitle: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 8,
    fontWeight: '600',
  },
  testCardNumber: {
    fontSize: 12,
    color: '#1e40af',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 2,
  },
  testCardDetails: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 8,
    fontStyle: 'italic',
  },
  billingForm: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  requiredInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  requiredIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  requiredText: {
    fontSize: 13,
    color: '#92400e',
    flex: 1,
    lineHeight: 18,
  },
  payButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveCardTextContainer: {
    flex: 1,
  },
  saveCardText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  securityNote: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default CheckoutScreen;