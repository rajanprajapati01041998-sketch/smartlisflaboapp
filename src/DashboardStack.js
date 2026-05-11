import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

import { useTheme } from '../Authorization/ThemeContext';

// Screens
import LabDashboard from './AfterLogin/Screens/DashboardData/Dashborad';
import Registration from './AfterLogin/Screens/PatientRegistration/Registration';
import UserLoginHistory from './AfterLogin/Screens/Profile/UserLoginHistory';
import Profile from './AfterLogin/Screens/Profile/Profile';
import PatientInformation from './AfterLogin/Screens/PatientRegistration/PatientInformation';
import DashboardPayment from './AfterLogin/Screens/DashboardData/DashboardPayment';
import DashboardPaymentHistoryDetails from './AfterLogin/Screens/DashboardData/DashboardPaymentHistoryDetails';
import PatientInformationList from './AfterLogin/Screens/PatientRegistration/PatientInformationList';
import EditRegistration from './AfterLogin/Screens/PatientRegistration/EditRegistration';
import TRF_Print from './AfterLogin/Screens/PatientRegistration/TRF_Print';
import LABReceipts from './AfterLogin/Screens/PatientRegistration/LabReceipts';
import Location from './components/Location/Location';

const Stack = createNativeStackNavigator();

const HeaderRightMenu = ({ navigation }) => {
  const { colors, theme, setThemeMode } = useTheme();
  const [visible, setVisible] = useState(false);

  const changeTheme = async mode => {
    setVisible(false);

    // ✅ Use your ThemeContext function name here
    // If your context uses toggleTheme instead, replace this line.
    if (setThemeMode) {
      await setThemeMode(mode);
    }
  };

  return (
    <View style={tw`flex-row items-center  gap-2`}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.7}
        style={tw`mr-2`}
      >
        <MaterialCommunityIcons
          name="account-circle"
          size={30}
          color={colors.text}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
        style={tw`p-1`}
      >
        <MaterialCommunityIcons
          name="dots-vertical"
          size={25}
          color={colors.text}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          onPress={() => setVisible(false)}
          style={tw`flex-1`}
        >
          <View
            style={[
              tw`absolute top-12 right-3 w-44 rounded-2xl p-2 shadow-lg`,
              {
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                tw`px-3 py-2 text-xs font-bold`,
                { color: colors.text, opacity: 0.55 },
              ]}
            >
              Appearance
            </Text>

            <TouchableOpacity
              onPress={() => changeTheme('light')}
              style={[
                tw`flex-row items-center px-3 py-3 rounded-xl`,
                {
                  backgroundColor:
                    theme === 'light' ? 'rgba(37,99,235,0.12)' : 'transparent',
                },
              ]}
            >
              <MaterialCommunityIcons
                name="white-balance-sunny"
                size={21}
                color={theme === 'light' ? '#2563eb' : colors.text}
              />
              <Text
                style={[
                  tw`ml-3 text-sm font-semibold`,
                  { color: theme === 'light' ? '#2563eb' : colors.text },
                ]}
              >
                Light Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => changeTheme('dark')}
              style={[
                tw`flex-row items-center px-3 py-3 rounded-xl mt-1`,
                {
                  backgroundColor:
                    theme === 'dark' ? 'rgba(37,99,235,0.12)' : 'transparent',
                },
              ]}
            >
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={21}
                color={theme === 'dark' ? '#2563eb' : colors.text}
              />
              <Text
                style={[
                  tw`ml-3 text-sm font-semibold`,
                  { color: theme === 'dark' ? '#2563eb' : colors.text },
                ]}
              >
                Dark Mode
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default function DashboardStack() {
  const { colors } = useTheme();

  const openDrawer = navigation => {
    let parent = navigation.getParent?.();

    while (parent && !parent.openDrawer) {
      parent = parent.getParent?.();
    }

    if (parent?.openDrawer) parent.openDrawer();
    else if (navigation.openDrawer) navigation.openDrawer();
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        headerShown: true,
        headerBackVisible: true,
        headerBackTitleVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerBackTitle: '',
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="DashboardHome"
        component={LabDashboard}
        options={({ navigation }) => ({
          headerTitle: 'Dashboard',
          headerRight: () => <HeaderRightMenu navigation={navigation} />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => openDrawer(navigation)}
              style={{ marginLeft: 12 }}
            >
              <MaterialCommunityIcons
                name="menu-open"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="Registration"
        component={Registration}
        options={{ title: 'Patient Registration' }}
      />

      <Stack.Screen
        name="PatientInformation"
        component={PatientInformation}
        options={{ title: 'Patient Information' }}
      />

      <Stack.Screen
        name="PatientInformationList"
        component={PatientInformationList}
        options={{ title: 'All Patient' }}
      />

      <Stack.Screen
        name="EditRegistration"
        component={EditRegistration}
        options={{ title: 'Patient Details' }}
      />

      <Stack.Screen
        name="TRF_Print"
        component={TRF_Print}
        options={{ title: 'Test Details' }}
      />

      <Stack.Screen
        name="LABReceipts"
        component={LABReceipts}
        options={{ title: 'Receipts' }}
      />

      <Stack.Screen
        name="UserLoginHistory"
        component={UserLoginHistory}
        options={{ title: 'Login History' }}
      />

      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          title: 'My Profile',
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="DashboardPayment"
        component={DashboardPayment}
        options={{ title: 'Payment' }}
      />

      <Stack.Screen
        name="DashboardPaymentHistoryDetails"
        component={DashboardPaymentHistoryDetails}
        options={{ title: 'History' }}
      />
      <Stack.Screen
        name="Track Location"
        component={Location}
        options={{ title: 'Location' }}
      />
    </Stack.Navigator>
  );
}