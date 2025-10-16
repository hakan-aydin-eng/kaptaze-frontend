import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const SupportScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const supportCategories = [
    { id: 1, title: 'Sipariş Sorunları', icon: '🛍️', desc: 'Sipariş vermede yaşanan sorunlar' },
    { id: 2, title: 'Ödeme Problemleri', icon: '💳', desc: 'Ödeme işlemleri ile ilgili sorunlar' },
    { id: 3, title: 'Teslimat Sorunları', icon: '🚚', desc: 'Teslimat süreciyle ilgili problemler' },
    { id: 4, title: 'Hesap İşlemleri', icon: '👤', desc: 'Kullanıcı hesabı ile ilgili işlemler' },
    { id: 5, title: 'Teknik Sorunlar', icon: '⚙️', desc: 'Uygulama kullanımında yaşanan teknik problemler' },
    { id: 6, title: 'Diğer', icon: '❓', desc: 'Diğer konular hakkında yardım' },
  ];

  const faqItems = [
    {
      id: 1,
      question: 'Siparişimi nasıl iptal edebilirim?',
      answer: 'Siparişiniz henüz hazırlanmaya başlamadıysa "Siparişlerim" bölümünden iptal edebilirsiniz. Hazırlık başladıysa lütfen bizimle iletişime geçin.',
    },
    {
      id: 3,
      question: 'Sürpriz paketler nedir?',
      answer: 'Sürpriz paketler, restoranların gün sonunda kalan kaliteli yemeklerini %50\'ye varan indirimlerle sunduğu paketlerdir. Ne olduğunu önceden bilemezsiniz ama her zaman taze ve lezzetlidir!',
    },
    {
      id: 4,
      question: 'Ödeme yöntemleri nelerdir?',
      answer: 'Nakit ödeme ve online ödeme (kredi kartı) seçeneklerini kabul ediyoruz.',
    },
    {
      id: 5,
      question: 'Siparişimi takip edebilir miyim?',
      answer: 'Evet! Siparişiniz onaylandıktan sonra "Siparişlerim" bölümünden gerçek zamanlı olarak takip edebilirsiniz.',
    },
    {
      id: 8,
      question: 'Paketimi nereden teslim alırım?',
      answer: 'Siparişinizi verdiğiniz restorana giderek teslim alırsınız. Restoran adresi ve yol tarifi uygulama içinde mevcuttur.',
    },
    {
      id: 9,
      question: 'Paket fotoğrafı nasıl paylaşırım?',
      answer: 'Siparişinizi teslim aldıktan sonra "Siparişlerim" bölümünden puanlama yapabilir ve aldığınız sürpriz paketin fotoğrafını paylaşabilirsiniz. Fotoğraflarınız "Sürpriz Hikayeler" bölümünde görünür!',
    },
  ];

  const handleSendMessage = () => {
    if (!selectedCategory || !message.trim() || !email.trim()) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    Alert.alert(
      'Mesaj Gönderildi',
      'Mesajınız alındı. En kısa sürede size geri dönüş yapacağız.',
      [{ text: 'Tamam', onPress: () => {
        setMessage('');
        setEmail('');
        setSelectedCategory(null);
      }}]
    );
  };

  const handlePhoneCall = () => {
    Linking.openURL('tel:+902420000000');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/902420000000?text=Merhaba, KapTaze hakkında yardıma ihtiyacım var.');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:destek@kaptaze.com');
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
        <Text style={styles.headerTitle}>Yardım & Destek</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İletişim</Text>
          <View style={styles.quickContact}>
            <TouchableOpacity style={styles.contactButton} onPress={handlePhoneCall}>
              <Text style={styles.contactButtonIcon}>📞</Text>
              <Text style={styles.contactButtonText}>Ara</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
              <Text style={styles.contactButtonIcon}>💬</Text>
              <Text style={styles.contactButtonText}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
              <Text style={styles.contactButtonIcon}>📧</Text>
              <Text style={styles.contactButtonText}>E-posta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sıkça Sorulan Sorular</Text>
          {faqItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqToggle}>
                  {expandedFaq === item.id ? '−' : '+'}
                </Text>
              </View>
              {expandedFaq === item.id && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Support Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek Talebi</Text>
          <Text style={styles.sectionDesc}>
            Sorununuzu aşağıdaki form ile bize iletebilirsiniz.
          </Text>

          <Text style={styles.inputLabel}>Konu Seçiniz</Text>
          <View style={styles.categoryGrid}>
            {supportCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryTitle,
                  selectedCategory === category.id && styles.selectedCategoryText
                ]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>E-posta Adresiniz</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Mesajınız</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Sorununuzu detaylı olarak açıklayın..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!selectedCategory || !message.trim() || !email.trim()) && styles.disabledButton
            ]}
            onPress={handleSendMessage}
            disabled={!selectedCategory || !message.trim() || !email.trim()}
          >
            <Text style={styles.sendButtonText}>Gönder</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
          <View style={styles.contactInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Adres</Text>
                <Text style={styles.infoDesc}>Antalya, Türkiye</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>⏰</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Çalışma Saatleri</Text>
                <Text style={styles.infoDesc}>7/24 Hizmet</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📞</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Destek Hattı</Text>
                <Text style={styles.infoDesc}>+90 242 XXX XX XX</Text>
              </View>
            </View>
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
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  quickContact: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactButton: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  contactButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  faqToggle: {
    fontSize: 20,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: '30%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCategory: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
});

export default SupportScreen;