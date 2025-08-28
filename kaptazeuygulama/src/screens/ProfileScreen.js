import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import apiService from '../services/apiService';

const ProfileScreen = ({ navigation }) => {
  const { user, token, logout } = useAuth();
  const { setUser, getUserStats } = useUserData();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [formErrors, setFormErrors] = useState({});

  const stats = getUserStats();

  const menuItems = [
    { id: 1, title: 'Hesap Bilgileri', icon: '👤', screen: null },
    { id: 2, title: 'Bildirim Ayarları', icon: '🔔', screen: null },
    { id: 3, title: 'Gizlilik Politikası', icon: '🔒', screen: null },
    { id: 4, title: 'Kullanım Şartları', icon: '📜', screen: null },
    { id: 5, title: 'Hakkında', icon: 'ℹ️', screen: null },
    { id: 6, title: 'Çıkış Yap', icon: '🚪', action: 'logout' },
  ];

  const handleMenuPress = async (item) => {
    if (item.action === 'logout') {
      await logout();
      navigation.navigate('Welcome');
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || '',
      phone: user?.phone || '',
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

    if (editForm.phone && !/^[0-9]{11}$/.test(editForm.phone.replace(/\s/g, ''))) {
      errors.phone = 'Telefon numarası 11 haneli olmalıdır';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setIsUpdating(true);
    
    try {
      if (token) {
        // Backend profil update API call
        const result = await apiService.updateProfile({
          name: editForm.name.trim(),
          surname: editForm.surname.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
        }, token);

        if (result.success) {
          // Backend'den dönen güncel user bilgisiyle güncelle
          await setUser(result.data.consumer, token);
          closeEditModal();
          Alert.alert('✅ Başarılı!', 'Profiliniz başarıyla güncellendi!');
        } else {
          throw new Error(result.error || 'Update failed');
        }
      } else {
        // Token yoksa local update (demo için)
        const updatedUser = {
          ...user,
          name: editForm.name.trim(),
          surname: editForm.surname.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
        };

        await setUser(updatedUser);
        closeEditModal();
        Alert.alert('✅ Başarılı!', 'Profiliniz başarıyla güncellendi! (Offline)');
      }

    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('❌ Hata', error.message || 'Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsUpdating(false);
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
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>
            {user ? `${user.name} ${user.surname}` : 'Misafir Kullanıcı'}
          </Text>
          <Text style={styles.userEmail}>
            {user ? user.email : 'misafir@kaptaze.com'}
          </Text>
          
          <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completedOrders}</Text>
            <Text style={styles.statLabel}>Sipariş</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₺{stats.totalSavings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Tasarruf</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.foodSaved.toFixed(1)}kg</Text>
            <Text style={styles.statLabel}>İsraf Önlendi</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Environmental Impact */}
        <View style={styles.impactSection}>
          <Text style={styles.impactTitle}>🌱 Çevresel Etki</Text>
          <Text style={styles.impactDescription}>
            KapTaze ile gıda israfını önleyerek çevreye katkı sağlıyorsunuz. 
            Her satın aldığınız paket bir adım daha temiz bir gelecek için!
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEditModal}>
              <Text style={styles.modalCancelButton}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            <TouchableOpacity 
              onPress={handleUpdateProfile} 
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <Text style={styles.modalSaveButton}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Kişisel Bilgiler</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>İsim *</Text>
                <TextInput
                  style={[styles.input, formErrors.name && styles.inputError]}
                  value={editForm.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Adınız"
                  placeholderTextColor="#9ca3af"
                />
                {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Soyisim *</Text>
                <TextInput
                  style={[styles.input, formErrors.surname && styles.inputError]}
                  value={editForm.surname}
                  onChangeText={(value) => handleInputChange('surname', value)}
                  placeholder="Soyadınız"
                  placeholderTextColor="#9ca3af"
                />
                {formErrors.surname && <Text style={styles.errorText}>{formErrors.surname}</Text>}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>İletişim Bilgileri</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-posta *</Text>
                <TextInput
                  style={[styles.input, formErrors.email && styles.inputError]}
                  value={editForm.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefon</Text>
                <TextInput
                  style={[styles.input, formErrors.phone && styles.inputError]}
                  value={editForm.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  placeholder="05XXXXXXXXX"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  maxLength={11}
                />
                {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}
                <Text style={styles.inputHint}>Opsiyonel - SMS bildirimleri için</Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>ℹ️ Bilgi</Text>
              <Text style={styles.infoText}>
                E-posta adresinizi değiştirirseniz, yeni adrese doğrulama kodu gönderilecektir.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statsSection: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    paddingVertical: 20,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: '#111827',
  },
  menuArrow: {
    fontSize: 16,
    color: '#9ca3af',
  },
  impactSection: {
    backgroundColor: '#f0fdf4',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 8,
  },
  impactDescription: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default ProfileScreen;