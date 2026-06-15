import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import tw from 'twrnc';
import { useTheme } from '../Authorization/ThemeContext';
import { useAuth } from '../Authorization/AuthContext';
import BottomTabNavigation from './BottomNavigation';
import {
  getBackgroundLocationEnabled,
  setBackgroundLocationEnabled,
} from './utils/backgroundLocationPrefs';
const Drawer = createDrawerNavigator();
import AnimatedBorder from '../AnimatedBorder';
import { getThemeStyles } from './utils/themeStyles';

function DashboardDrawerContent(props) {
  const { colors, theme } = useTheme();
  const { logout, fieldBoyData, logoutLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [bgLocationEnabled, setBgLocationEnabled] = useState(false);

  const themed = getThemeStyles(theme);

  useEffect(() => {
    let mounted = true;
    getBackgroundLocationEnabled()
      .then(v => mounted && setBgLocationEnabled(v))
      .catch(() => { });
    return () => {
      mounted = false;
    };
  }, []);

  const goTo = useCallback((screenName) => {
    props.navigation.navigate('MainTabs', {
      screen: 'Dashboard',
      params: { screen: screenName },
    });
    props.navigation.closeDrawer();
  }, [props.navigation]);

  const goToTab = useCallback((tabName) => {
    props.navigation.navigate('MainTabs', { screen: tabName });
    props.navigation.closeDrawer();
  }, [props.navigation]);

  const menuItems = useMemo(() => ([
    {
      label: 'New Registration',
      subTitle: 'Register new patient',
      iconType: 'mi',
      icon: 'person-add',
      color: '#c3c832',
      onPress: () => goTo('Registration'),
    },
    {
      label: 'Update Sample',
      subTitle: 'Update sample information',
      iconType: 'mi',
      icon: 'bloodtype',
      color: '#c20404',
      onPress: () => goTo('UpdateSampleStatus'),
    },
    {
      label: 'Patient Information',
      subTitle: 'Search and manage patient details',
      iconType: 'mci',
      icon: 'account-search',
      color: '#2563eb',
      onPress: () => goTo('PatientInformation'),
    },
    {
      label: 'Login History',
      subTitle: 'View user login activity',
      iconType: 'mi',
      icon: 'history',
      color: '#9333ea',
      onPress: () => goTo('UserLoginHistory'),
    },
    // {
    //   label: 'Track Location',
    //   subTitle: 'View Live laction',
    //   iconType: 'mi',
    //   icon: 'map',
    //   color: '#3376ea',
    //   onPress: () => goTo('Track Location')
    // },
    {
      label: 'Test Refund',
      subTitle: 'Test Refund',
      iconType: 'mci',
      icon: 'map',
      color: '#0ba957ff',
      onPress: () => goTo('Test Refund'),
    },
  ]), [goTo]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return menuItems;

    return menuItems.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.subTitle.toLowerCase().includes(q),
    );
  }, [search, menuItems]);

  const renderIcon = item => {
    if (item.iconType === 'mi') {
      return <MaterialIcons name={item.icon} size={22} color={item.color} />;
    }

    return (
      <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
    );
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: colors.surface }]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={tw`pb-2`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            tw`px-4 pt-5 pb-4`,
            {
              backgroundColor:
                theme === 'dark' ? colors.surface : 'rgba(37,99,235,0.06)',
            },
          ]}
        >
          <View style={tw`flex-row items-center mb-1`}>
            <View
              style={[
                tw`w-10 h-10 rounded-lg items-center justify-center`,
                { backgroundColor: '#2563eb' },
              ]}
            >
              <Text style={tw`text-white text-xl font-bold`}>
                {(fieldBoyData?.fieldBoyName || 'G')
                  ?.charAt(0)
                  ?.toUpperCase()}
              </Text>
            </View>

            <View style={tw`ml-3 flex-1`}>
              <Text
                numberOfLines={1}
                style={[tw`text-base font-bold uppercase`, themed.menuText]}
              >
                {fieldBoyData?.fieldBoyName || 'Gravity User'}
              </Text>
              <Text numberOfLines={1}   style={[ tw`mt-0.5`,themed.labelTextXs  ]} >
                Quick actions menu
              </Text>
            </View>
          </View>

          {/* Search */}
          <AnimatedBorder>
            <View  style={[tw`px-3 py-2.5 rounded-2xl flex-row items-center`,themed.childScreen2]}>
              <Feather name="search"size={18} color={themed.iconColor}/>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search menu..."
                placeholderTextColor={themed.inputPlaceholder}
                style={[themed.inputText,
                  tw`flex-1 ml-2 py-0 text-sm`,
                ]}
              />

              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch('')}>
                  <Feather
                    name="x-circle"
                    size={18}
                    color={themed.iconColor}
                  />
                </TouchableOpacity>
              )}
            </View>
          </AnimatedBorder>
        </View>

        {/* Menu */}
        <View style={tw`px-3 mt-3`}>
          <Text
            style={[
              tw`px-2 mb-2 text-xs font-bold uppercase`,
              themed.labelText,
            ]}
          >
            Navigation
          </Text>

          <View
            style={[
              tw`mb-3 p-3 rounded-2xl flex-row items-center border`,
              {
                backgroundColor:
                  theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#ffffff',
                borderColor: themed.border,
              },
            ]}
          >
            <View
              style={[
                tw`w-8 h-8 rounded-xl items-center justify-center`,
                { backgroundColor: 'rgba(22,163,74,0.10)' },
              ]}
            >
              <MaterialCommunityIcons name="map-marker-radius" size={18} color="#16a34a" />
            </View>

            <View style={tw`ml-3 flex-1`}>
              <Text style={[tw`text-sm font-semibold` ,themed.menuText]}>
                Background Location
              </Text>
              <Text
                numberOfLines={1}
                style={[tw`text-xs mt-0.5`, themed.labelTextXs]}
              >
                Keep live tracking enabled
              </Text>
            </View>

            <Switch
              value={bgLocationEnabled}
              onValueChange={async next => {
                setBgLocationEnabled(next);
                try {
                  await setBackgroundLocationEnabled(next);
                } catch { }
              }}
              trackColor={{ false: '#d1d5db', true: 'rgba(22,163,74,0.35)' }}
              thumbColor={bgLocationEnabled ? '#16a34a' : '#f4f4f5'}
            />
          </View>

          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.75}
                onPress={item.onPress}
                style={[
                  tw`mb-2 p-3 rounded-2xl flex-row items-center border`,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(255,255,255,0.04)'
                        : '#ffffff',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    tw`w-11 h-11 rounded-xl items-center justify-center`,
                    { backgroundColor: `${item.color}18` },
                  ]}
                >
                  {renderIcon(item)}
                </View>

                <View style={tw`ml-3 flex-1`}>
                  <Text style={[ tw`text-sm font-semibold`,themed.menuText ]}>
                    {item.label}
                  </Text>

                  <Text numberOfLines={1} style={[tw` mt-0.5`, themed.labelTextXs]}>
                    {item.subTitle}
                  </Text>
                </View>

                <Feather
                  name="chevron-right"
                  size={19}
                  color={colors.text}
                  style={{ opacity: 0.45 }}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={tw`items-center justify-center py-8`}>
              <Feather name="search" size={30} color={colors.text} />
              <Text
                style={[
                  tw`mt-3 text-sm font-semibold`,
                  { color: colors.text },
                ]}
              >
                No menu found
              </Text>
            </View>
          )}
        </View>
      </DrawerContentScrollView>

      {/* Logout Bottom */}
      <View
        style={[
          tw`px-3 py-4 border-t`,
          { borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={logoutLoading}
          onPress={logout}
          style={[
            tw`p-3 rounded-2xl flex-row items-center`,
            {
              backgroundColor:
                theme === 'dark'
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(239,68,68,0.08)',
            },
          ]}
        >
          <View
            style={[
              tw`w-11 h-11 rounded-xl items-center justify-center`,
              { backgroundColor: 'rgba(239,68,68,0.16)' },
            ]}
          >
            <MaterialCommunityIcons name="logout" size={23} color="#ef4444" />
          </View>

          <View style={tw`ml-3 flex-1`}>
            <Text style={tw`text-sm font-bold text-red-500`}>Logout</Text>
            <Text style={tw`text-xs text-red-400 mt-0.5`}>
              Sign out from this device
            </Text>
          </View>

          <Feather name="chevron-right" size={19} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DashboardDrawer() {
  const { theme, colors } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 310,
        },
        sceneContainerStyle: {
          backgroundColor: colors.background,
        },
        overlayColor:
          theme === 'dark'
            ? 'rgba(0,0,0,0.65)'
            : 'rgba(0,0,0,0.45)',
      }}
      drawerContent={props => <DashboardDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTabs" component={BottomTabNavigation} />
    </Drawer.Navigator>
  );
}
