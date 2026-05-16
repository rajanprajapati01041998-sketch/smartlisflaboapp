import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import React, {useState, useRef, useCallback} from 'react';
import tw from 'twrnc';
import {useAuth} from '../../../../Authorization/AuthContext';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import api from '../../../../Authorization/api';
import {useTheme} from '../../../../Authorization/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {getAddressFromLatLng} from '../../../utils/patinetService.js/location';
import {getThemeStyles} from '../../../utils/themeStyles';

const UserLoginHistory = () => {
  const {userData, fieldBoyId} = useAuth();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [addresses, setAddresses] = useState({});
  const [loadingAddress, setLoadingAddress] = useState({});
  const [itemAnimations, setItemAnimations] = useState({});

  const navigation = useNavigation();
  const {theme} = useTheme();
  const themed = getThemeStyles(theme);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  const getAddressFromCoordinates = async (latitude, longitude, id) => {
    if (!latitude || !longitude || !id) {
      return 'Location not available';
    }

    if (addresses[id]) {
      return addresses[id];
    }

    setLoadingAddress(prev => ({
      ...prev,
      [id]: true,
    }));

    try {
      const address = await getAddressFromLatLng(latitude, longitude);

      const finalAddress = address || 'Address not found';

      setAddresses(prev => ({
        ...prev,
        [id]: finalAddress,
      }));

      return finalAddress;
    } catch (error) {
      console.log('Address fetch error:', error);

      setAddresses(prev => ({
        ...prev,
        [id]: 'Unable to fetch address',
      }));

      return 'Unable to fetch address';
    } finally {
      setLoadingAddress(prev => ({
        ...prev,
        [id]: false,
      }));
    }
  };

  const startAnimations = historyData => {
    const animations = {};

    historyData.forEach((_, index) => {
      animations[index] = {
        fade: new Animated.Value(0),
        slide: new Animated.Value(30),
      };
    });

    setItemAnimations(animations);

    Object.keys(animations).forEach((key, index) => {
      Animated.parallel([
        Animated.timing(animations[key].fade, {
          toValue: 1,
          duration: 250,
          delay: index * 20,
          useNativeDriver: true,
        }),
        Animated.spring(animations[key].slide, {
          toValue: 0,
          damping: 15,
          stiffness: 100,
          delay: index * 20,
          useNativeDriver: true,
        }),
      ]).start();
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getUserLoginHistory = async (id, isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      const response = await api.get(
        `FlaboLogin/fieldBoyLoginHistory?fieldBoyId=${id}`,
      );

      console.log('Login History Response:', response?.data);

      if (response?.data?.success) {
        const historyData = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

        setLoginHistory(historyData);

        historyData.forEach(item => {
          if (item.LatitudeApp && item.LongitudeApp) {
            getAddressFromCoordinates(item.LatitudeApp, item.LongitudeApp, item.Id);
          }
        });

        startAnimations(historyData);
      }
    } catch (error) {
      console.log('history error', error?.response || error?.message);
      Alert.alert('Error', 'Failed to load login history');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (fieldBoyId) {
        getUserLoginHistory(fieldBoyId);
      } else {
        navigation.navigate('Dashboard');
      }

      return () => {};
    }, [userData, fieldBoyId]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    if (fieldBoyId) {
      getUserLoginHistory(fieldBoyId, true);
    } else {
      setRefreshing(false);
    }
  }, [fieldBoyId]);

  const formatDate = dateString => {
    if (!dateString) {
      return {
        formatted: 'N/A',
        timeAgo: '',
      };
    }

    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeAgo = '';

    if (diffMins < 60) {
      timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      timeAgo = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    return {
      formatted: date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      timeAgo,
    };
  };

  const getDeviceIcon = (browser, device) => {
    const deviceLower = String(device || '').toLowerCase();
    const browserLower = String(browser || '').toLowerCase();

    if (deviceLower.includes('iphone') || deviceLower.includes('ipad')) {
      return 'logo-apple';
    }

    if (deviceLower.includes('android')) {
      return 'logo-android';
    }

    if (browserLower.includes('chrome')) {
      return 'logo-chrome';
    }

    return 'laptop-outline';
  };

  const getDeviceColor = device => {
    const deviceLower = String(device || '').toLowerCase();

    if (deviceLower.includes('iphone')) {
      return '#34C759';
    }

    if (deviceLower.includes('android')) {
      return '#3DDC84';
    }

    return '#3B82F6';
  };

  const RenderItemContent = ({
    item,
    isCurrent,
    dateInfo,
    deviceIcon,
    deviceColor,
    hasLocation,
    sessionAddress,
    isLoadingAddress,
  }) => {
    return (
      <View style={themed.border}>
        {isCurrent && (
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={tw`absolute top-0 right-0 px-3 py-1 rounded-bl-xl z-10`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="flash" size={12} color="white" />
              <Text style={tw`text-white text-xs font-bold ml-1`}>
                CURRENT
              </Text>
            </View>
          </LinearGradient>
        )}

        <View style={tw`p-4`}>
          <View style={tw`flex-row items-start justify-between mb-3`}>
            <View style={tw`flex-row items-center flex-1`}>
              <View
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
                  {backgroundColor: `${deviceColor}15`},
                ]}>
                <Ionicons name={deviceIcon} size={18} color={deviceColor} />
              </View>

              <View style={tw`flex-1`}>
                <Text style={[themed.inputText, tw`font-bold text-base`]}>
                  {item.Device || 'Unknown Device'}
                </Text>

                <Text style={[themed.inputText, tw`text-xs`]}>
                  {item.Browser || 'Unknown Browser'}
                </Text>
              </View>
            </View>
          </View>

          <View style={tw`mb-3`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={themed.mutedText}>
                OS: {item.Os || 'Unknown'}
              </Text>

              <Text style={themed.mutedText}>
                IP: {item.IpAddress || 'Unknown'}
              </Text>
            </View>

            {hasLocation && (
              <View style={tw`mt-3`}>
                {isLoadingAddress ? (
                  <View style={tw`flex-row items-center`}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={tw`text-xs text-gray-400 ml-2`}>
                      Fetching address...
                    </Text>
                  </View>
                ) : (
                  <Text style={[themed.inputText, tw`text-xs text-gray-500`]}>
                    {sessionAddress || 'Address not available'}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={tw`flex-row justify-between items-end mt-2 pt-2 border-t border-gray-100`}>
            <View>
              {item.LogoutAt ? (
                <Text style={tw`text-xs text-gray-400 mt-1`}>
                  Logout: {formatDate(item.LogoutAt).formatted}
                </Text>
              ) : (
                <Text style={tw`text-xs text-green-600 font-semibold mt-1`}>
                  Active Session
                </Text>
              )}
            </View>

            <View style={tw`items-end`}>
              <Text style={themed.mutedText}>{dateInfo.formatted}</Text>

              {!isCurrent && (
                <Text style={tw`text-xs text-gray-400 mt-1`}>
                  {dateInfo.timeAgo}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({item, index}) => {
    const dateInfo = formatDate(item.LoginAt);
    const isCurrent = index === 0 && !item.LogoutAt;

    const deviceIcon = getDeviceIcon(item.Browser, item.Device);
    const deviceColor = getDeviceColor(item.Device);

    const hasLocation = item.LatitudeApp && item.LongitudeApp;
    const sessionAddress = addresses[item.Id];
    const isLoadingAddress = loadingAddress[item.Id];

    const animations = itemAnimations[index];

    if (!animations) {
      return null;
    }

    return (
      <Animated.View
        style={[
          themed.childScreen,
          tw`mx-4 my-2 rounded-xl overflow-hidden`,
          {
            opacity: animations.fade,
            transform: [{translateX: animations.slide}],
          },
        ]}>
        <RenderItemContent
          item={item}
          isCurrent={isCurrent}
          dateInfo={dateInfo}
          deviceIcon={deviceIcon}
          deviceColor={deviceColor}
          hasLocation={hasLocation}
          sessionAddress={sessionAddress}
          isLoadingAddress={isLoadingAddress}
        />
      </Animated.View>
    );
  };

  if (loading && loginHistory.length === 0) {
    return (
      <View style={[themed.childScreen, tw`flex-1 justify-center items-center`]}>
        <ActivityIndicator size="large" color="#3b82f6" />

        <Text style={tw`mt-4 text-gray-600`}>
          Loading login history...
        </Text>
      </View>
    );
  }

  return (
    <View style={[themed.childScreen, tw`flex-1`]}>
      <FlatList
        data={loginHistory}
        keyExtractor={(item, index) => `${item.Id}-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-8`}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
          />
        }
      />
    </View>
  );
};

export default UserLoginHistory;