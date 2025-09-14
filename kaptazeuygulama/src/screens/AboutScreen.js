import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const AboutScreen = ({ navigation }) => {
  
  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hakkında</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.logoSection}>
            <Text style={styles.appIcon}>🍽️</Text>
            <Text style={styles.appName}>KapTaze</Text>
            <Text style={styles.version}>Sürüm 1.0.3</Text>
            <Text style={styles.tagline}>Kapıda taze, lezzet hep yanında!</Text>
          </View>

          <Text style={styles.sectionTitle}>Uygulama Hakkında</Text>
          <Text style={styles.paragraph}>
            KapTaze, Antalya'nın en hızlı ve güvenilir yemek sipariş uygulamasıdır. Sevdiğiniz restoranlardan kolayca sipariş verin, kapınıza kadar taze lezzetleri getirtelim.
          </Text>

          <Text style={styles.paragraph}>
            Uygulamımız, yerel restoranları desteklemek ve müşterilerimize en iyi deneyimi sunmak amacıyla geliştirilmiştir. Hızlı teslimat, kaliteli hizmet ve uygun fiyatlarla yanınızdayız.
          </Text>

          <Text style={styles.sectionTitle}>Özellikler</Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>🚀 Hızlı sipariş ve teslimat</Text>
            <Text style={styles.feature}>🎯 Konum tabanlı restoran önerileri</Text>
            <Text style={styles.feature}>💰 Özel indirimler ve paketler</Text>
            <Text style={styles.feature}>⭐ Değerlendirme ve yorumlar</Text>
            <Text style={styles.feature}>📱 Kullanıcı dostu arayüz</Text>
            <Text style={styles.feature}>🔒 Güvenli ödeme sistemi</Text>
            <Text style={styles.feature}>📍 Gerçek zamanlı sipariş takibi</Text>
            <Text style={styles.feature}>❤️ Favori restoran listesi</Text>
          </View>

          <Text style={styles.sectionTitle}>İletişim</Text>
          <View style={styles.contactInfo}>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleLinkPress('mailto:info@kaptaze.com')}
            >
              <Text style={styles.contactIcon}>📧</Text>
              <Text style={styles.contactText}>info@kaptaze.com</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleLinkPress('tel:+902420000000')}
            >
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactText}>+90 242 XXX XX XX</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleLinkPress('https://www.kaptaze.com')}
            >
              <Text style={styles.contactIcon}>🌐</Text>
              <Text style={styles.contactText}>www.kaptaze.com</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Sosyal Medya</Text>
          <View style={styles.socialMedia}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleLinkPress('https://instagram.com/kaptaze')}
            >
              <Text style={styles.socialIcon}>📷</Text>
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleLinkPress('https://twitter.com/kaptaze')}
            >
              <Text style={styles.socialIcon}>🐦</Text>
              <Text style={styles.socialText}>Twitter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleLinkPress('https://facebook.com/kaptaze')}
            >
              <Text style={styles.socialIcon}>👥</Text>
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Yasal Bilgiler</Text>
          <Text style={styles.paragraph}>
            KapTaze, Türkiye'de faaliyet gösteren bir teknoloji şirketidir. Tüm hakları saklıdır.
          </Text>
          
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
              <Text style={styles.legalLink}>Gizlilik Politikası</Text>
            </TouchableOpacity>
            
            <Text style={styles.separator}>•</Text>
            
            <TouchableOpacity onPress={() => handleLinkPress('https://www.kaptaze.com/terms')}>
              <Text style={styles.legalLink}>Kullanım Şartları</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with ❤️ in Antalya</Text>
            <Text style={styles.copyright}>© 2025 KapTaze. Tüm hakları saklıdır.</Text>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  appIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#374151',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 16,
  },
  featureList: {
    marginBottom: 16,
  },
  feature: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 4,
  },
  contactInfo: {
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  contactText: {
    fontSize: 14,
    color: '#16a34a',
    textDecorationLine: 'underline',
  },
  socialMedia: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  socialButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  socialIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  socialText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  legalLink: {
    fontSize: 14,
    color: '#16a34a',
    textDecorationLine: 'underline',
  },
  separator: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default AboutScreen;