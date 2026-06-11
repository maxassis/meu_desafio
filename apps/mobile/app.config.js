import process from 'node:process'

import 'dotenv/config'

const apiUrl
  = process.env.APP_ENV === 'production'
    ? process.env.API_URL_PRODUCTION
    : process.env.API_URL_DEVELOPMENT

export default {
  expo: {
    name: 'Meu Desafio',
    slug: 'meu-desafio-2',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon2.png',
    userInterfaceStyle: 'light',
    scheme: 'meudesafio2',
    splash: {
      image: './assets/gpt.png',
      resizeMode: 'cover',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.maxassis.bondis-app',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        // 🔹 Permissões de localização
        NSLocationWhenInUseUsageDescription:
          'Este app precisa da sua localização para rastrear suas atividades enquanto você o utiliza.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Este app precisa da sua localização mesmo em segundo plano para rastrear suas atividades.',
        NSLocationAlwaysUsageDescription:
          'Este app usa sua localização mesmo em segundo plano para rastrear suas atividades.',

        // 🔹 Permite background mode no iOS
        UIBackgroundModes: ['location'],
      },
    },
    android: {
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_LOCATION',
      ],
      package: 'com.maxassis.meudesafio2',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    updates: {
      url: 'https://u.expo.dev/230cd5ae-e636-4f24-a992-74172495dd48',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    newArchEnabled: true,
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission:
            'The app accesses your photos to let you share them with your friends.',
        },
      ],
      [
        'expo-location',
        {
          // 🔹 Textos para os prompts de permissão
          locationAlwaysAndWhenInUsePermission:
            'Este app precisa da sua localização mesmo em segundo plano para rastrear suas atividades.',
          locationAlwaysPermission:
            'Este app precisa da sua localização mesmo em segundo plano para rastrear suas atividades.',
          locationWhenInUsePermission:
            'Este app precisa da sua localização para rastrear suas atividades enquanto você o utiliza.',
        },
      ],
      'expo-font',
      'expo-router',
      'expo-secure-store',
      'expo-web-browser',
    ],
    extra: {
      eas: {
        projectId: '230cd5ae-e636-4f24-a992-74172495dd48',
      },
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      apiUrl,
    },
  },
}
