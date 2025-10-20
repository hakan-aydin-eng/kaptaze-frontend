import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const PrivacyScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Son Güncelleme: 30 Ağustos 2025</Text>
          
          <Text style={styles.paragraph}>
            KapKazan uygulaması olarak, gizliliğinizi korumayı taahhüt ediyoruz. Bu gizlilik politikası, kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.
          </Text>

          <Text style={styles.sectionTitle}>1. Topladığımız Bilgiler</Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Hesap Bilgileri:</Text> Ad, soyad, e-posta adresi, telefon numarası
            {'\n'}• <Text style={styles.bold}>Konum Bilgileri:</Text> Yakınızındaki restoranları göstermek için konum verilerinizi kullanırız
            {'\n'}• <Text style={styles.bold}>Sipariş Bilgileri:</Text> Sipariş geçmişi, tercihler ve ödeme bilgileri
            {'\n'}• <Text style={styles.bold}>Cihaz Bilgileri:</Text> Cihaz türü, işletim sistemi, uygulama sürümü
          </Text>

          <Text style={styles.sectionTitle}>2. Bilgilerin Kullanımı</Text>
          <Text style={styles.paragraph}>
            Kişisel bilgilerinizi şu amaçlarla kullanırız:
            {'\n'}• Sipariş işlemlerinizi gerçekleştirmek
            {'\n'}• Yakınızda bulunan restoranları göstermek
            {'\n'}• Kişiselleştirilmiş öneriler sunmak
            {'\n'}• Müşteri destek hizmetleri sağlamak
            {'\n'}• Uygulama performansını iyileştirmek
            {'\n'}• Güvenlik ve dolandırıcılık önlemleri almak
          </Text>

          <Text style={styles.sectionTitle}>3. Konum Verileri</Text>
          <Text style={styles.paragraph}>
            KapKazan, yakınızda bulunan restoranları göstermek ve fırsat paketleri hizmetlerini optimize etmek için konum bilgilerinizi kullanır. Konum paylaşımını istediğiniz zaman cihaz ayarlarından devre dışı bırakabilirsiniz.
          </Text>

          <Text style={styles.sectionTitle}>4. Veri Paylaşımı</Text>
          <Text style={styles.paragraph}>
            Kişisel bilgilerinizi yalnızca şu durumda üçüncü taraflarla paylaşırız:
            {'\n'}• Sipariş teslimatı için restoran ve kurye hizmetleri ile
            {'\n'}• Ödeme işlemleri için güvenli ödeme sağlayıcıları ile
            {'\n'}• Yasal yükümlülüklerimizi yerine getirmek için
            {'\n'}• Açık rızanızla belirttiğiniz diğer durumlar için
          </Text>

          <Text style={styles.sectionTitle}>5. Veri Güvenliği</Text>
          <Text style={styles.paragraph}>
            Kişisel verilerinizi korumak için endüstri standardında güvenlik önlemleri alıyoruz:
            {'\n'}• SSL şifreleme ile veri aktarımı
            {'\n'}• Güvenli veri saklama yöntemleri
            {'\n'}• Düzenli güvenlik denetimleri
            {'\n'}• Sınırlı erişim kontrolleri
          </Text>

          <Text style={styles.sectionTitle}>6. Çerezler ve Takip Teknolojileri</Text>
          <Text style={styles.paragraph}>
            Uygulama deneyiminizi iyileştirmek için çerezler ve benzer teknolojiler kullanırız. Bu teknolojiler, tercihlerinizi hatırlamak ve uygulama performansını analiz etmek için kullanılır.
          </Text>

          <Text style={styles.sectionTitle}>7. Haklarınız</Text>
          <Text style={styles.paragraph}>
            KVKK kapsamında aşağıdaki haklara sahipsiniz:
            {'\n'}• Kişisel verilerinizin işlenip işlenmediğini öğrenme
            {'\n'}• Kişisel verilerinize erişim talep etme
            {'\n'}• Yanlış verilerin düzeltilmesini isteme
            {'\n'}• Belirli şartlar altında verilerin silinmesini talep etme
            {'\n'}• Veri işleme faaliyetlerine itiraz etme
          </Text>

          <Text style={styles.sectionTitle}>8. Çocukların Gizliliği</Text>
          <Text style={styles.paragraph}>
            KapKazan, 13 yaş altındaki çocuklardan bilerek kişisel bilgi toplamaz. 13 yaş altında bir çocuğa ait bilgi topladığımızı öğrenirsek, bu bilgileri derhal sileriz.
          </Text>

          <Text style={styles.sectionTitle}>9. Uluslararası Veri Aktarımı</Text>
          <Text style={styles.paragraph}>
            Verileriniz Türkiye sınırları içinde işlenir ve saklanır. Uluslararası aktarım gerektiğinde, yeterli koruma seviyesine sahip ülkelere veya uygun güvencelerle aktarım yapılır.
          </Text>

          <Text style={styles.sectionTitle}>10. Politika Değişiklikleri</Text>
          <Text style={styles.paragraph}>
            Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler uygulama içinde bildirilecektir. Politikayı düzenli olarak gözden geçirmenizi öneririz.
          </Text>

          <Text style={styles.sectionTitle}>11. İletişim</Text>
          <Text style={styles.paragraph}>
            Gizlilik politikamızla ilgili sorularınız için bizimle iletişime geçebilirsiniz:
            {'\n'}• E-posta: privacy@kapkazan.com
            {'\n'}• Telefon: +90 242 XXX XX XX
            {'\n'}• Adres: Antalya, Türkiye
          </Text>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Bu politika, Türkiye Cumhuriyeti Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği Genel Veri Koruma Yönetmeliği (GDPR) uyarınca hazırlanmıştır.
            </Text>
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
  lastUpdated: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 16,
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
  bold: {
    fontWeight: '600',
    color: '#111827',
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PrivacyScreen;