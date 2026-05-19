import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Switch,
  StatusBar,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../../../Authorization/AuthContext';
import { useNavigation } from '@react-navigation/native';
import styles from '../../../utils/InputStyle';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';

const { width } = Dimensions.get('window');

const Profile = () => {
  const { logout, userData ,fieldBoyData} = useAuth();
  const { theme, toggleTheme } = useTheme();
  const themed = getThemeStyles(theme);
  const navigation = useNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [labname, setLabName] = useState('');
  const [userName, setUserName] = useState('');
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);

  console.log('user profile',userData)

  useEffect(() => {
    setLabName(userData?.name || '');
    setUserName(userData?.userIdApp || "");
  }, [userData]);

  console.log(userData)
  useEffect(() => {
    console.log('Current theme mode:', theme);
  }, [theme]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    scaleValue.value = withSpring(0.95, {}, () => {
      scaleValue.value = withSpring(1);
    });
    opacityValue.value = withTiming(0.8, { duration: 200 });

    setTimeout(async () => {
      await logout();
      setIsLoggingOut(false);
    }, 300);
  };

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
      opacity: opacityValue.value,
    };
  });

  const profileItems = [
    { icon: 'person', name: 'User ID', value: fieldBoyData?.userIdApp, color: '#8b5cf6' },
    
  ];

  return (
    <View style={themed.screen}>
      <StatusBar
        backgroundColor={themed.statusBarBg}
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        

        <ScrollView
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={[
              styles.cardShadow,
              themed.profileCard,
              tw`mx-4 mt-5 p-5`,
              {
                borderWidth: 1,
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
              },
            ]}
          >
            {profileItems.map((item, index) => (
              <Animated.View
                key={item.name}
                entering={FadeInDown.delay(300 + index * 100)}
                style={[
                  tw`mb-2 pb-4`,
                  index !== profileItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme === 'dark' ? '#374151' : '#E5E7EB',
                  },
                ]}
              >
                <View style={tw`flex-row items-center`}>
                  <View
                    style={[
                      tw`p-2 rounded-lg`,
                      { backgroundColor: `${item.color}18` },
                    ]}
                  >
                    <Icon name={item.icon} size={20} color={item.color} />
                  </View>

                  <Text
                    style={[
                      themed.profileItemLabel,
                      { letterSpacing: 0.5 },
                    ]}
                  >
                    {item.name}
                  </Text>
                </View>

                <Text style={themed.profileItemValue}>
                  {item.value || 'Not specified'}
                </Text>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Login History */}
          

          {/* Account Status */}
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            style={tw`px-4 mt-4`}
          >
            <View
              style={[
                styles.cardShadow,
                themed.profileStatusCard,
                { borderWidth: 1 },
              ]}
            >
              <View style={tw`flex-row items-center`}>
                <Icon2 name="information-circle" size={24} color="#3b82f6" />
                <Text style={themed.profileStatusTitle}>
                  Account Status
                </Text>
              </View>

              <View style={tw`flex-row items-center mt-2 ml-6`}>
                <View style={tw`w-2 h-2 bg-green-500 rounded-full mr-2`} />
                <Text style={themed.profileStatusText}>
                  Active • Verified Account
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Theme Toggle */}
          <Animated.View entering={FadeInDown.delay(500).springify()}
            style={tw`px-4 mt-4`}
          >
            <TouchableOpacity style={[styles.cardShadow, themed.profileCard, tw`p-4`, { borderWidth: 1, elevation: 2, },]}
              activeOpacity={0.7}
              onPress={toggleTheme}
            >
              <View style={tw`flex-row items-center`}>
                <Animated.View entering={ZoomIn.delay(550)} style={themed.profileIconBox}>
                  <MaterialIcons name={theme === 'dark' ? 'dark-mode' : 'light-mode'}
                    size={26} color="#3b82f6"
                  />
                </Animated.View>

                <View style={tw`flex-1`}>
                  <Text style={[tw`text-base font-semibold`, themed.mutedText]}>
                    Dark Mode
                  </Text>
                  <Text style={[tw`text-xs mt-1`, themed.headerSubText]}>
                    Turn {theme === 'dark' ? 'off' : 'on'} dark appearance
                  </Text>
                </View>

                <Switch
                  value={theme === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#D1D5DB', true: '#60A5FA' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Logout Button */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={[
            themed.bottomBar,
            {
              paddingHorizontal: 16,
              paddingVertical: 10,
              paddingBottom: Platform.OS === 'ios' ? 34 : 16,
            },
          ]}
        >
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity
              style={[
                tw`bg-red-500 rounded-md py-3 flex-row items-center justify-center`,
                isLoggingOut && tw`opacity-70`,
              ]}
              onPress={handleLogout}
              disabled={isLoggingOut}
              activeOpacity={0.8}
            >
              <Animated.View
                entering={ZoomIn.delay(450)}
                style={tw`flex-row items-center`}
              >
                <Icon2
                  name={isLoggingOut ? 'hourglass-outline' : 'log-out-outline'}
                  size={22}
                  color="white"
                />
                <Text style={tw`text-white font-semibold text-md ml-2`}>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Profile;