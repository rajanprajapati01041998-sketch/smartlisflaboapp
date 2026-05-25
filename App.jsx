import React, {useEffect, useState} from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {useAuth} from './Authorization/AuthContext';
import DashboardDrawer from './src/DashboardDrawer';
import LoginScreen from './src/Login';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar, PermissionsAndroid, Platform} from 'react-native';
import {ResponsiveProvider} from './src/context/ResponsiveContext';
import {useTheme} from './Authorization/ThemeContext';
import StartupSplash from './src/StartupSplash';
import useCurrentLocation from './src/utils/locationService';
import {
  getBackgroundLocationEnabled,
  getLiveLocationSession,
} from './src/utils/backgroundLocationPrefs';

const navigationRef = createNavigationContainerRef();

const AppContent = () => {
  const {token, latitude, longitude,userId} = useAuth();

//  console.log('App userId:', userId);
  useCurrentLocation({enabled: true});

  useEffect(() => {
    if (latitude != null && longitude != null) {
      console.log('App location:', latitude, longitude);
    }
  }, [latitude, longitude]);

  return token ? <DashboardDrawer /> : <LoginScreen />;
};

export default function App() {
  const {isLoading, token} = useAuth();
  const {theme, colors} = useTheme();
  const [isStartupSplashVisible, setIsStartupSplashVisible] = useState(true);

  useEffect(() => {
    requestStoragePermission();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsStartupSplashVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Storage permission granted');
        } else {
          console.log('Storage permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  if (isStartupSplashVisible || isLoading) {
    return (
      <SafeAreaProvider>
        <ResponsiveProvider>
          <StatusBar
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={theme === 'dark' ? colors.surface : '#ffffff'}
          />
          <StartupSplash />
        </ResponsiveProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ResponsiveProvider>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme === 'dark' ? colors.surface : '#ffffff'}
        />

        <NavigationContainer
          ref={navigationRef}
          onReady={async () => {
            try {
              if (!token) return;

              const bgEnabled = await getBackgroundLocationEnabled();
              const session = await getLiveLocationSession();

              if (session?.active && session?.sampleId != null) {
                navigationRef.navigate('MainTabs', {
                  screen: 'Dashboard',
                  params: {
                    screen: 'FlaboShareLiveLocation',
                    params: {id: session.sampleId},
                  },
                });
              } else if (bgEnabled) {
                navigationRef.navigate('MainTabs', {
                  screen: 'Dashboard',
                  params: {screen: 'UpdateSampleStatus'},
                });
              }
            } catch {}
          }}
          theme={{
            ...(theme === 'dark' ? DarkTheme : DefaultTheme),
            colors: {
              ...((theme === 'dark' ? DarkTheme : DefaultTheme).colors),
              background: colors.background,
              card: colors.surface,
              border: colors.border,
              text: colors.text,
              primary: colors.primary,
            },
          }}>
          <AppContent />
        </NavigationContainer>
      </ResponsiveProvider>
    </SafeAreaProvider>
  );
}
