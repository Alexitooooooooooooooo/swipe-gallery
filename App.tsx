import { ThemeProvider } from '@react-navigation/native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { NAV_THEME } from './lib/theme';
import './global.css';

import MainScreen from './app/index';

export default function App() {
  return (
    <ThemeProvider value={NAV_THEME.light}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <MainScreen />
          <PortalHost />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
