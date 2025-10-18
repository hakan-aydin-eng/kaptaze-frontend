import React, { useState, useEffect } from 'react';
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

const ResetPasswordScreen = ({ navigation, route }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    // Get token from route params (from deep link or navigation)
    if (route.params?.token) {
      setResetToken(route.params.token);
    } else {
      // If no token, redirect back to login
      Alert.alert(
        '❌ Geçersiz Bağlantı',
        'Şifre sıfırlama bağlantısı geçersiz. Lütfen tekrar deneyin.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
      );
    }
  }, [route.params]);

  const validateForm = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = 'Yeni şifre gereklidir';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Şifre en az 6 karakter olmalıdır';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);

      try {
        const result = await apiService.resetPassword(resetToken, newPassword);

        if (result.success) {
          Alert.alert(
            '✅ Şifre Sıfırlandı',
            'Şifreniz başarıyla sıfırlandı. Şimdi yeni şifrenizle giriş yapabilirsiniz.',
            [
              {
                text: 'Giriş Yap',
                onPress: () => navigation.navigate('Login')
              }
            ]
          );
        } else {
          Alert.alert('❌ Hata', result.error || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } catch (error) {
        console.error('Reset password error:', error);
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
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Yeni Şifre Belirle</Text>
        </View>

        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={styles.brandName}>kapkazan</Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>🔐 Yeni Şifrenizi Belirleyin</Text>
            <Text style={styles.instructionsText}>
              Hesabınız için yeni bir şifre oluşturun. Şifreniz en az 6 karakter olmalıdır.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yeni Şifre</Text>
              <TextInput
                style={[styles.input, errors.newPassword && styles.inputError]}
                value={newPassword}
                onChangeText={(value) => {
                  setNewPassword(value);
                  if (errors.newPassword) {
                    setErrors(prev => ({ ...prev, newPassword: '' }));
                  }
                }}
                placeholder="En az 6 karakter"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
              {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                placeholder="Şifrenizi tekrar girin"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Şifremi Sıfırla</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back to Login Link */}
          <View style={styles.backToLoginLink}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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

export default ResetPasswordScreen;
