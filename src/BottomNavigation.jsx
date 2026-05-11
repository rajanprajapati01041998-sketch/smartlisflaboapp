import React from 'react';
import { Platform } from 'react-native';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../Authorization/ThemeContext';

// Screens
import DashboardStack from './DashboardStack';
import HelpDeskStack from './HelpDeskStack';
import RegistrationStack from './RegistrationStack';

const Tab = createBottomTabNavigator();

/** Main content row (icons + labels) above safe-area / system inset — keep in one place to avoid double-counting with navigator padding. */
const TAB_BAR_CONTENT_HEIGHT = 52;

const HIDE_TABS_BY_TAB = {
  Dashboard: new Set([
    'ListHelpDeskPatient',
    'Profile',
    'UserLoginHistory',
    'ViewLabReport',
    'DashboardPayment',
    'DashboardPaymentHistoryDetails',
    'ViewTebularReport',
    'Registration',
    'SearchPatient',
    'PatientInformation',
    'PatientInformationList',
    'EditRegistration',
    'TRF_Print',
    'LABReceipts',
    'BarcodeScanner',
    'Track Location'
  ]),
  Registration: new Set(['PatientInformation']),
  HelpDesk: new Set([
    'ListHelpDeskPatient',
    'ViewLabReport',
    'DashboardPayment',
    'DashboardPaymentHistoryDetails',
    'ViewTebularReport',
    'PatientInformationList',
    'EditRegistration',
    'TRF_Print',
    'LABReceipts',
    'BarcodeScanner',
    'Track Location'
  ]),
};

const getDeepestRouteName = (route) => {
  if (!route) return null;
  if (!route.state) {
    // When navigating into nested navigators with `navigate(parent, { screen })`,
    // the active child may be present in params before nested state is mounted.
    if (route.params?.screen) {
      const syntheticChild = {
        name: route.params.screen,
        state: route.params.state,
        params: route.params.params,
      };
      return getDeepestRouteName(syntheticChild) ?? route.params.screen ?? route.name ?? null;
    }

    return getFocusedRouteNameFromRoute(route) ?? route.name ?? null;
  }
  const index = typeof route.state.index === 'number' ? route.state.index : 0;
  const child = route.state.routes?.[index];
  return getDeepestRouteName(child) ?? child?.name ?? route.name ?? null;
};

export default function BottomTabNavigation() {
  const insets = useSafeAreaInsets();
  const { theme, colors } = useTheme();

  // One bottom inset value: avoids “floating” gap when gestural Android reports 0 but we still need clearance above the gesture bar.
  const tabBarBottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 10 : 0
  );


  const horizontalInset = Math.max(insets.left, insets.right, 10);

  const baseTabBarStyle = {
    position: 'absolute',
    left: horizontalInset,
    right: horizontalInset,
    bottom: 0,
    height: TAB_BAR_CONTENT_HEIGHT + tabBarBottomInset,
    paddingBottom: tabBarBottomInset,
    // Navigator also adds paddingHorizontal from safe area; we already inset the whole bar with left/right.
    paddingHorizontal: 0,
    backgroundColor: theme === 'dark' ? colors.surface : '#d5d2d2',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  };

  return (
    <Tab.Navigator
      tabBar={(props) => {
        const focusedTabRoute = props.state.routes[props.state.index];
        const focusedTabName = focusedTabRoute?.name;
        const nestedRouteName = getDeepestRouteName(focusedTabRoute);
        const hideSet = HIDE_TABS_BY_TAB[focusedTabName];

        if (hideSet?.has(nestedRouteName)) return null;
        return <BottomTabBar {...props} />;
      }}
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ color, focused }) => {
          let iconName;

          if (route.name === 'Dashboard') iconName = 'view-dashboard';
          else if (route.name === 'HelpDesk') iconName = 'bell';
          else if (route.name === 'Registration') iconName = 'account-plus'; // ✅ ADD THIS

          return (
            <MaterialCommunityIcons
              name={iconName}
              size={focused ? 26 : 22}
              color={color}
            />
          );
        },

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: theme === 'dark' ? '#9CA3AF' : '#777',
        tabBarStyle: baseTabBarStyle,

        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 2 : 0,
        },

        tabBarItemStyle: {
          paddingTop: 6,
        },

        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
      />
      <Tab.Screen
        name="Registration"
        component={RegistrationStack}
      />

      <Tab.Screen
        name="HelpDesk"
        component={HelpDeskStack}
      />
    </Tab.Navigator>
  );
}
