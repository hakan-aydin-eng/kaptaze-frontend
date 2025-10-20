import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import apiService from '../services/apiService';

const ProfileScreen = ({ navigation }) => {
  const { user, token, logout } = useAuth();
  const { setUser, getUserStats } = useUserData();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('tr');
  
  // Profile Edit Form
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate || '',
  });
  
  // Address Form
  const [addresses, setAddresses] = useState([
    { id: 1, title: 'Ev', address: 'Lara Mah. Güzeloba Cad. No:25/3 Muratpaşa/Antalya', isDefault: true },
    { id: 2, title: 'İş', address: 'Konyaaltı Sahil Yolu No:45 Konyaaltı/Antalya', isDefault: false },
  ]);
  
  const [newAddress, setNewAddress] = useState({
    title: '',
    address: '',
    district: '',
    city: '',
    isDefault: false,
  });
  
  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'card', last4: '4532', brand: 'Visa', isDefault: true },
    { id: 2, type: 'card', last4: '7890', brand: 'Mastercard', isDefault: false },
  ]);
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    orders: true,
    promotions: true,
    newRestaurants: false,
    reminders: true,
    email: true,
    sms: false,
    push: true,
  });
  
  const [formErrors, setFormErrors] = useState({});
  const stats = getUserStats();

  const menuItems = [
    { id: 1, title: 'Hesap Bilgileri', icon: '👤', action: 'edit' },
    { id: 2, title: 'Ödeme Yöntemleri', icon: '💳', action: 'payment', badge: paymentMethods.length },
    { id: 3, title: 'Bildirim Ayarları', icon: '🔔', action: 'notifications' },
    { id: 4, title: 'Tema', icon: darkMode ? '🌙' : '☀️', action: 'theme' },
    { id: 5, title: 'Dil / Language', icon: '🌍', action: 'language', subtitle: language === 'tr' ? 'Türkçe' : 'English' },
    { id: 6, title: 'Yardım & Destek', icon: '💬', screen: 'Support' },
    { id: 7, title: 'Gizlilik Politikası', icon: '🔒', screen: 'Privacy' },
    { id: 8, title: 'Hakkında', icon: 'ℹ️', screen: 'About' },
    { id: 9, title: 'Çıkış Yap', icon: '🚪', action: 'logout', danger: true },
  ];

  const handleMenuPress = async (item) => {
    switch(item.action) {
      case 'logout':
        Alert.alert(
          'Çıkış Yap',
          'Çıkış yapmak istediğinizden emin misiniz?',
          [
            { text: 'İptal', style: 'cancel' },
            { 
              text: 'Çıkış Yap', 
              style: 'destructive',
              onPress: async () => {
                await logout();
                navigation.navigate('Welcome');
              }
            }
          ]
        );
        break;
      case 'edit':
        openEditModal();
        break;
      case 'payment':
        setIsPaymentModalVisible(true);
        break;
      case 'notifications':
        setIsNotificationModalVisible(true);
        break;
      case 'theme':
        setDarkMode(!darkMode);
        Alert.alert('🎨 Tema', darkMode ? 'Açık tema aktif' : 'Koyu tema aktif');
        break;
      case 'language':
        const newLang = language === 'tr' ? 'en' : 'tr';
        setLanguage(newLang);
        Alert.alert('🌍 Dil', newLang === 'tr' ? 'Türkçe seçildi' : 'English selected');
        break;
      default:
        if (item.screen) {
          navigation.navigate(item.screen);
        }
    }
  };


  const openEditModal = () => {
    setEditForm({
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || '',
      phone: user?.phone || '',
      birthDate: user?.birthDate || '',
    });
    setFormErrors({});
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!editForm.name.trim()) {
      errors.name = 'İsim gereklidir';
    }

    if (!editForm.surname.trim()) {
      errors.surname = 'Soyisim gereklidir';
    }

    if (!editForm.email.trim()) {
      errors.email = 'E-posta gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
      errors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (editForm.phone && !/^[0-9]{10,11}$/.test(editForm.phone.replace(/\s/g, ''))) {
      errors.phone = 'Geçerli bir telefon numarası girin';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setIsUpdating(true);
    
    try {
      const updatedUser = {
        ...user,
        name: editForm.name.trim(),
        surname: editForm.surname.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        birthDate: editForm.birthDate.trim() || null,
      };

      await setUser(updatedUser);
      closeEditModal();
      Alert.alert('✅ Başarılı!', 'Profiliniz güncellendi!');

    } catch (error) {
      Alert.alert('❌ Hata', 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  const addNewAddress = () => {
    if (!newAddress.title || !newAddress.address) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun');
      return;
    }
    
    const address = {
      id: addresses.length + 1,
      ...newAddress,
      isDefault: addresses.length === 0,
    };
    
    setAddresses([...addresses, address]);
    setNewAddress({ title: '', address: '', district: '', city: '', isDefault: false });
    Alert.alert('✅', 'Adres eklendi!');
  };

  const deleteAddress = (id) => {
    Alert.alert(
      'Adresi Sil',
      'Bu adresi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => {
            setAddresses(addresses.filter(a => a.id !== id));
          }
        }
      ]
    );
  };

  const setDefaultAddress = (id) => {
    setAddresses(addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    })));
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={[styles.header, darkMode && styles.darkHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.darkText]}>Profil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info Section */}
        <View style={[styles.profileSection, darkMode && styles.darkSection]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          
          <Text style={[styles.userName, darkMode && styles.darkText]}>
            {user ? `${user.name} ${user.surname}` : 'Misafir Kullanıcı'}
          </Text>
          <Text style={[styles.userEmail, darkMode && styles.darkSubText]}>
            {user ? user.email : 'misafir@kapkazan.com'}
          </Text>
          {user?.phone && (
            <Text style={[styles.userPhone, darkMode && styles.darkSubText]}>
              📱 {user.phone}
            </Text>
          )}
          
          <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>


        {/* Stats Section */}
        <View style={[styles.statsSection, darkMode && styles.darkSection]}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🛍️</Text>
            <Text style={[styles.statNumber, darkMode && styles.darkText]}>
              {stats.completedOrders}
            </Text>
            <Text style={[styles.statLabel, darkMode && styles.darkSubText]}>Sipariş</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statNumber, darkMode && styles.darkText]}>
              ₺{stats.totalSavings.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, darkMode && styles.darkSubText]}>Tasarruf</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🌱</Text>
            <Text style={[styles.statNumber, darkMode && styles.darkText]}>
              {stats.foodSaved.toFixed(1)}kg
            </Text>
            <Text style={[styles.statLabel, darkMode && styles.darkSubText]}>CO₂ Tasarrufu</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuSection, darkMode && styles.darkSection]}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                darkMode && styles.darkMenuItem,
                item.danger && styles.dangerItem
              ]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={[
                    styles.menuTitle,
                    darkMode && styles.darkText,
                    item.danger && styles.dangerText
                  ]}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={[styles.menuSubtitle, darkMode && styles.darkSubText]}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Text style={[styles.menuArrow, darkMode && styles.darkSubText]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, darkMode && styles.darkSubText]}>
            kapkazan v1.0.4
          </Text>
          <Text style={[styles.versionText, darkMode && styles.darkSubText]}>
            Made with ❤️ in Antalya
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                Profili Düzenle
              </Text>
              <TouchableOpacity onPress={closeEditModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, darkMode && styles.darkText]}>İsim</Text>
                <TextInput
                  style={[styles.input, darkMode && styles.darkInput, formErrors.name && styles.inputError]}
                  value={editForm.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="İsminizi girin"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
                {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, darkMode && styles.darkText]}>Soyisim</Text>
                <TextInput
                  style={[styles.input, darkMode && styles.darkInput, formErrors.surname && styles.inputError]}
                  value={editForm.surname}
                  onChangeText={(value) => handleInputChange('surname', value)}
                  placeholder="Soyisminizi girin"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
                {formErrors.surname && <Text style={styles.errorText}>{formErrors.surname}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, darkMode && styles.darkText]}>E-posta</Text>
                <TextInput
                  style={[styles.input, darkMode && styles.darkInput, formErrors.email && styles.inputError]}
                  value={editForm.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="E-posta adresinizi girin"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
                {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, darkMode && styles.darkText]}>Telefon</Text>
                <TextInput
                  style={[styles.input, darkMode && styles.darkInput, formErrors.phone && styles.inputError]}
                  value={editForm.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  placeholder="5XX XXX XX XX"
                  keyboardType="phone-pad"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
                {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, darkMode && styles.darkText]}>Doğum Tarihi</Text>
                <TextInput
                  style={[styles.input, darkMode && styles.darkInput]}
                  value={editForm.birthDate}
                  onChangeText={(value) => handleInputChange('birthDate', value)}
                  placeholder="GG/AA/YYYY"
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, isUpdating && styles.disabledButton]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Güncelle</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Address Modal */}
      <Modal
        visible={isAddressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal, darkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>Adres Bilgileri</Text>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {addresses.map((addr) => (
                <View key={addr.id} style={[styles.addressCard, darkMode && styles.darkCard]}>
                  <View style={styles.addressHeader}>
                    <Text style={[styles.addressTitle, darkMode && styles.darkText]}>
                      {addr.title}
                    </Text>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Varsayılan</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.addressText, darkMode && styles.darkSubText]}>
                    {addr.address}
                  </Text>
                  <View style={styles.addressActions}>
                    {!addr.isDefault && (
                      <TouchableOpacity 
                        style={styles.addressActionBtn}
                        onPress={() => setDefaultAddress(addr.id)}
                      >
                        <Text style={styles.addressActionText}>Varsayılan Yap</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={[styles.addressActionBtn, styles.deleteBtn]}
                      onPress={() => deleteAddress(addr.id)}
                    >
                      <Text style={styles.deleteText}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={[styles.addAddressSection, darkMode && styles.darkCard]}>
                <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
                  Yeni Adres Ekle
                </Text>
                <TextInput
                  style={[styles.input, darkMode && styles.darkInput]}
                  placeholder="Adres Başlığı (Ev, İş, vs.)"
                  value={newAddress.title}
                  onChangeText={(text) => setNewAddress({...newAddress, title: text})}
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
                <TextInput
                  style={[styles.input, styles.textArea, darkMode && styles.darkInput]}
                  placeholder="Adres"
                  value={newAddress.address}
                  onChangeText={(text) => setNewAddress({...newAddress, address: text})}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                />
                <TouchableOpacity style={styles.addButton} onPress={addNewAddress}>
                  <Text style={styles.addButtonText}>Adres Ekle</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal
        visible={isPaymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                Ödeme Yöntemleri
              </Text>
              <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {paymentMethods.map((method) => (
                <View key={method.id} style={[styles.paymentCard, darkMode && styles.darkCard]}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.cardIcon}>
                      {method.brand === 'Visa' ? '💳' : '💳'}
                    </Text>
                    <View>
                      <Text style={[styles.cardBrand, darkMode && styles.darkText]}>
                        {method.brand}
                      </Text>
                      <Text style={[styles.cardNumber, darkMode && styles.darkSubText]}>
                        •••• {method.last4}
                      </Text>
                    </View>
                  </View>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Varsayılan</Text>
                    </View>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addPaymentButton}>
                <Text style={styles.addPaymentIcon}>➕</Text>
                <Text style={styles.addPaymentText}>Yeni Kart Ekle</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        visible={isNotificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                Bildirim Ayarları
              </Text>
              <TouchableOpacity onPress={() => setIsNotificationModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.notificationSection}>
                <Text style={[styles.notificationCategory, darkMode && styles.darkText]}>
                  Bildirim Türleri
                </Text>
                
                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, darkMode && styles.darkText]}>
                      Sipariş Bildirimleri
                    </Text>
                    <Text style={[styles.notificationDesc, darkMode && styles.darkSubText]}>
                      Sipariş durumu güncellemeleri
                    </Text>
                  </View>
                  <Switch
                    value={notifications.orders}
                    onValueChange={(value) => setNotifications({...notifications, orders: value})}
                    trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                    thumbColor={notifications.orders ? '#16a34a' : '#f3f4f6'}
                  />
                </View>

                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, darkMode && styles.darkText]}>
                      Promosyonlar
                    </Text>
                    <Text style={[styles.notificationDesc, darkMode && styles.darkSubText]}>
                      Özel teklifler ve indirimler
                    </Text>
                  </View>
                  <Switch
                    value={notifications.promotions}
                    onValueChange={(value) => setNotifications({...notifications, promotions: value})}
                    trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                    thumbColor={notifications.promotions ? '#16a34a' : '#f3f4f6'}
                  />
                </View>

                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, darkMode && styles.darkText]}>
                      Yeni Restoranlar
                    </Text>
                    <Text style={[styles.notificationDesc, darkMode && styles.darkSubText]}>
                      Bölgenizdeki yeni restoranlar
                    </Text>
                  </View>
                  <Switch
                    value={notifications.newRestaurants}
                    onValueChange={(value) => setNotifications({...notifications, newRestaurants: value})}
                    trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                    thumbColor={notifications.newRestaurants ? '#16a34a' : '#f3f4f6'}
                  />
                </View>

                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, darkMode && styles.darkText]}>
                      Hatırlatmalar
                    </Text>
                    <Text style={[styles.notificationDesc, darkMode && styles.darkSubText]}>
                      Favori restoranlardan haberler
                    </Text>
                  </View>
                  <Switch
                    value={notifications.reminders}
                    onValueChange={(value) => setNotifications({...notifications, reminders: value})}
                    trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                    thumbColor={notifications.reminders ? '#16a34a' : '#f3f4f6'}
                  />
                </View>
              </View>

              <View style={styles.notificationSection}>
                <Text style={[styles.notificationCategory, darkMode && styles.darkText]}>
                  Bildirim Kanalları
                </Text>
                
                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, darkMode && styles.darkText]}>
                      📧 E-posta
                    </Text>
                  </View>
                  <Switch
                    value={notifications.email}
                    onValueChange={(value) => setNotifications({...notifications, email: value})}
                    trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                    thumbColor={notifications.email ? '#16a34a' : '#f3f4f6'}
                  />
                </View>

                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, darkMode && styles.darkText]}>
                      📱 SMS
                    </Text>
                  </View>
                  <Switch
                    value={notifications.sms}
                    onValueChange={(value) => setNotifications({...notifications, sms: value})}
                    trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                    thumbColor={notifications.sms ? '#16a34a' : '#f3f4f6'}
                  />
                </View>

                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, darkMode && styles.darkText]}>
                      🔔 Push Bildirimler
                    </Text>
                  </View>
                  <Switch
                    value={notifications.push}
                    onValueChange={(value) => setNotifications({...notifications, push: value})}
                    trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                    thumbColor={notifications.push ? '#16a34a' : '#f3f4f6'}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  darkContainer: {
    backgroundColor: '#111827',
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
  darkHeader: {
    backgroundColor: '#1f2937',
    borderBottomColor: '#374151',
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
  placeholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  darkText: {
    color: '#f9fafb',
  },
  darkSubText: {
    color: '#9ca3af',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  darkSection: {
    backgroundColor: '#1f2937',
    borderBottomColor: '#374151',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarText: {
    fontSize: 50,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  premiumIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  premiumSubtitle: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
  },
  premiumButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  premiumButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  darkMenuItem: {
    backgroundColor: '#1f2937',
    borderBottomColor: '#374151',
  },
  dangerItem: {
    backgroundColor: '#fef2f2',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  dangerText: {
    color: '#dc2626',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  darkModalContent: {
    backgroundColor: '#1f2937',
  },
  largeModal: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  darkInput: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    color: '#f9fafb',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  defaultBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addressActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#16a34a',
  },
  addressActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  addAddressSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  addPaymentIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  notificationSection: {
    marginBottom: 24,
  },
  notificationCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  notificationDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default ProfileScreen;