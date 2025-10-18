import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import apiService from '../services/apiService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('E-posta gereklidir');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Geçerli bir e-posta adresi girin');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (validateEmail()) {
      setIsSubmitting(true);

      try {
        const result = await apiService.forgotPassword(email.trim());

        if (result.success) {
          Alert.alert(
            '✅ E-posta Gönderildi',
            'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.',
            [
              {
                text: 'Tamam',
                onPress: () => navigation.goBack()
              }
            ]
          );
        } else {
          Alert.alert('❌ Hata', result.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } catch (error) {
        console.error('Forgot password error:', error);
        Alert.alert('❌ Hata', 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Şifremi Unuttum</Text>
        </View>

        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={styles.brandName}>kapkazan</Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>🔒 Şifrenizi mi unuttunuz?</Text>
            <Text style={styles.instructionsText}>
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta Adresi</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (error) setError('');
                }}
                placeholder="ornek@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Sıfırlama Bağlantısı Gönder</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back to Login Link */}
          <View style={styles.backToLoginLink}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backToLoginText}>← Giriş ekranına dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D2E0D5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
    borderRadius: 12,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  instructionsContainer: {
    marginBottom: 32,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
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
    paddingVertical: 12,
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
  submitButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
