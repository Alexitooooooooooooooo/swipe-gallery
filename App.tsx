import React, { useState } from 'react';
import { ThemeProvider } from '@react-navigation/native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { NAV_THEME } from './lib/theme';
import './global.css';

import MainScreen from './app/index';
import GalleryScreen from './app/gallery';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'gallery'>('welcome');

  return (
    <ThemeProvider value={NAV_THEME.light}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {currentScreen === 'welcome' ? (
            <MainScreen onNavigate={() => setCurrentScreen('gallery')} />
          ) : (
            <GalleryScreen />
          )}
          <PortalHost />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
