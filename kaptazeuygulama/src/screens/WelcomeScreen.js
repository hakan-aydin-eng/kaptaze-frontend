import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Title */}
        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>kapkazan</Text>
          <Text style={styles.subtitle}>
            Sürpriz Paket Platformu
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎁</Text>
            <Text style={styles.featureText}>Sürpriz paketler keşfet</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureText}>%50'ye varan indirimler</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏪</Text>
            <Text style={styles.featureText}>Yakındaki fırsatları keşfet</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryButtonText}>Kayıt Ol</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>Giriş Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.guestButtonText}>Misafir olarak devam et</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D2E0D5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
    minHeight: height - 100,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginVertical: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  actions: {
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#16a34a',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  secondaryButtonText: {
    color: '#16a34a',
    fontSize: 18,
    fontWeight: '600',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  guestButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WelcomeScreen;