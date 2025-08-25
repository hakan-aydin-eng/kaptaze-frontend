import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
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
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Sipariş</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₺0</Text>
            <Text style={styles.statLabel}>Tasarruf</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0kg</Text>
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
});

export default ProfileScreen;