import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Linking,
} from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

const BLUE_TONES = [
  '#1E3A8A',
  '#2563EB',
  '#60A5FA',
  '#93C5FD',
  '#DBEAFE',
] as const;

const PINK_TONES = [
  '#03001e',
  '#7303c0',
  '#a125d3',
  '#ec38bc',
  '#fdeff9',
] as const;

const YELLOW_TONES = [
  '#FFF7B2',
  '#FFE066',
  '#FFC233',
  '#E5A100',
  '#B87300',
] as const;

function AnimatedBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(2, {
        duration: 1000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, []);

  const fadeToPink = useAnimatedStyle(() => ({
    opacity: Math.min(progress.value, 1),
  }));

  const fadeToYellow = useAnimatedStyle(() => ({
    opacity: Math.max(progress.value - 1, 0),
  }));

  return (
    <View style={{ flex: 1 }}>
      <View style={StyleSheet.absoluteFill}>
        {/* Degradado azul completo, siempre de fondo */}
        <LinearGradient
          colors={BLUE_TONES}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Degradado rosa completo, aparece primero */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            fadeToPink,
          ]}
        >
          <LinearGradient
            colors={PINK_TONES}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Degradado amarillo/dorado, aparece al final */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            fadeToYellow,
          ]}
        >
          <LinearGradient
            colors={YELLOW_TONES}
            locations={[0, 0.22, 0.49, 0.75, 1]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {children}
    </View>
  );
}

export default function App() {
  const [biometricType, setBiometricType] =
    useState('Comprobando...');

  const [authenticated, setAuthenticated] =
    useState(false);

  const [authenticating, setAuthenticating] =
    useState(false);

  const [photo, setPhoto] =
    useState<string | null>(null);

  const [video, setVideo] =
    useState<string | null>(null);

  const [documentName, setDocumentName] =
    useState<string | null>(null);

  const [documentUri, setDocumentUri] =
    useState<string | null>(null);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const hasHardware =
        await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        setBiometricType(
          'Este dispositivo no tiene biometría'
        );
        return;
      }

      const isEnrolled =
        await LocalAuthentication.isEnrolledAsync();

      if (!isEnrolled) {
        setBiometricType(
          'No hay biometría configurada'
        );
        return;
      }

      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      const hasFingerprint =
        types.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        );

      const hasFace =
        types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        );

      if (hasFingerprint && hasFace) {
        setBiometricType(
          'Huella y reconocimiento facial disponibles'
        );
      } else if (hasFingerprint) {
        setBiometricType(
          'Huella dactilar disponible'
        );
      } else if (hasFace) {
        setBiometricType(
          'Reconocimiento facial disponible'
        );
      } else {
        setBiometricType(
          'Biometría disponible'
        );
      }
    } catch {
      setBiometricType(
        'No se pudo comprobar la biometría'
      );
    }
  };

  const authenticate = async () => {
    if (authenticating) {
      return;
    }

    setAuthenticating(true);

    try {
      const result =
        await LocalAuthentication.authenticateAsync({
          promptMessage:
            'Desbloquear SecureVault',
          promptDescription:
            'Usa la biometría configurada en tu dispositivo',
          cancelLabel: 'Cancelar',
          disableDeviceFallback: true,
          biometricsSecurityLevel: 'weak',
        });

      if (result.success) {
        setAuthenticated(true);
      } else {
        Alert.alert(
          'Acceso denegado',
          'La autenticación biométrica no fue exitosa.'
        );
      }
    } catch {
      Alert.alert(
        'Error',
        'No se pudo realizar la autenticación biométrica.'
      );
    } finally {
      setAuthenticating(false);
    }
  };

  const selectPhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos permiso para acceder a tus fotos.'
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const selectVideo = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos permiso para acceder a tus videos.'
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
      });

    if (!result.canceled) {
      setVideo(result.assets[0].uri);
    }
  };

  const selectDocument = async () => {
    const result =
      await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

    if (!result.canceled) {
      setDocumentName(result.assets[0].name);
      setDocumentUri(result.assets[0].uri);
    }
  };

  const openFile = async (uri: string) => {
    try {
      await Linking.openURL(uri);
    } catch {
      Alert.alert(
        'Error',
        'No se pudo abrir el archivo.'
      );
    }
  };

  const lockVault = () => {
    setAuthenticated(false);
  };

  return (
    <AnimatedBackground>
      <View style={styles.container}>
        {!authenticated ? (
          <View style={styles.lockScreen}>
            <Text style={styles.icon}>
              🔐
            </Text>

            <Text style={styles.title}>
              SecureVault
            </Text>

            <Text style={styles.subtitle}>
              Contenido protegido
            </Text>

            <Text style={styles.status}>
              {biometricType}
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                authenticating &&
                  styles.disabledButton,
              ]}
              onPress={authenticate}
              disabled={authenticating}
            >
              <Text style={styles.buttonText}>
                {authenticating
                  ? '🔄 Autenticando...'
                  : '🔓 Desbloquear'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={
              styles.vaultContainer
            }
          >
            <Text style={styles.icon}>
              🔓
            </Text>

            <Text style={styles.title}>
              SecureVault
            </Text>

            <Text style={styles.subtitle}>
              Contenido protegido
            </Text>

            <Text
              style={styles.authenticatedText}
            >
              ✓ Autenticación biométrica correcta
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🖼️ Fotos
              </Text>

              <TouchableOpacity
                style={styles.fileButton}
                onPress={selectPhoto}
              >
                <Text style={styles.buttonText}>
                  Seleccionar foto
                </Text>
              </TouchableOpacity>

              {photo && (
                <Image
                  source={{ uri: photo }}
                  style={styles.photo}
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🎥 Videos
              </Text>

              <TouchableOpacity
                style={styles.fileButton}
                onPress={selectVideo}
              >
                <Text style={styles.buttonText}>
                  Seleccionar video
                </Text>
              </TouchableOpacity>

              {video && (
                <TouchableOpacity
                  style={styles.selectedFile}
                  onPress={() =>
                    openFile(video)
                  }
                >
                  <Text style={styles.fileText}>
                    🎥 Video seleccionado
                  </Text>

                  <Text style={styles.openText}>
                    Toca para abrir
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                📄 Documentos
              </Text>

              <TouchableOpacity
                style={styles.fileButton}
                onPress={selectDocument}
              >
                <Text style={styles.buttonText}>
                  Seleccionar documento
                </Text>
              </TouchableOpacity>

              {documentName &&
                documentUri && (
                  <TouchableOpacity
                    style={styles.selectedFile}
                    onPress={() =>
                      openFile(documentUri)
                    }
                  >
                    <Text
                      style={styles.fileText}
                    >
                      📄 {documentName}
                    </Text>

                    <Text
                      style={styles.openText}
                    >
                      Toca para abrir
                    </Text>
                  </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
              style={styles.lockButton}
              onPress={lockVault}
            >
              <Text style={styles.buttonText}>
                🔒 Bloquear SecureVault
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  lockScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  vaultContainer: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 60,
    paddingBottom: 50,
  },

  icon: {
    fontSize: 70,
    marginBottom: 20,
    textAlign: 'center',
  },

  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  subtitle: {
    color: '#e5e7eb',
    fontSize: 17,
    marginBottom: 25,
    textAlign: 'center',
  },

  status: {
    color: '#eff6ff',
    fontSize: 15,
    marginBottom: 30,
    textAlign: 'center',
  },

  authenticatedText: {
    color: '#000000',
    fontSize: 15,
    marginBottom: 25,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#0e0e0e',
    paddingVertical: 16,
    paddingHorizontal: 35,
    borderRadius: 14,
  },

  disabledButton: {
    opacity: 0.6,
  },

  section: {
    width: '100%',
    backgroundColor:
      'rgba(31, 41, 55, 0.85)',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
  },

  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  fileButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },

  selectedFile: {
    backgroundColor: '#374151',
    padding: 15,
    borderRadius: 10,
    marginTop: 12,
  },

  fileText: {
    color: '#ffffff',
    fontSize: 16,
  },

  openText: {
    color: '#93C5FD',
    fontSize: 13,
    marginTop: 5,
  },

  photo: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginTop: 15,
  },

  lockButton: {
    backgroundColor:
      'rgba(55, 65, 81, 0.85)',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 14,
    marginTop: 20,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});