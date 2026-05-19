import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../Authorization/ThemeContext';

import Registration from './AfterLogin/Screens/PatientRegistration/Registration';
import PatientInformation from './AfterLogin/Screens/PatientRegistration/PatientInformation';
import EditRegistration from './AfterLogin/Screens/PatientRegistration/EditRegistration';
import BarcodeScannerScreen from './BarcodeScannerScreen';

const Stack = createNativeStackNavigator();

export default function RegistrationStack() {
  const { theme, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={() => ({
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
      })}
    >
      <Stack.Screen
        name="RegistrationHome"
        component={Registration}
        options={{ title: 'Patient Registration', headerShown: false }}
      />
      <Stack.Screen
        name="PatientInformation"
        component={PatientInformation}
        options={{ title: 'Patient Information' }}
      />
      <Stack.Screen
        name="EditRegistration"
        component={EditRegistration}
        options={{ title: 'Patient Details' }}
      />

      <Stack.Screen
        name="BarcodeScanner"
        component={BarcodeScannerScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
