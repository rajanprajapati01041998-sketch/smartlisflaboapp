import { View, Text, TouchableOpacity, Platform, Dimensions, ScrollView, Image } from 'react-native';
import React, { useCallback, useImperativeHandle, useState, forwardRef, useMemo, useEffect } from 'react';
import tw from 'twrnc';
import api from '../../../../Authorization/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  Layout,
  ZoomIn,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from '../../../../Authorization/AuthContext';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const CARD_WIDTH = width - 32;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DashboardCollection = forwardRef(({ fromDate, toDate }, ref) => {
  const [dashboardData, setDashboardData] = useState({
    totalSamples: 0,
    totalPaymentCollected: 0,
    totalSamplePicked: 0,
    totalSampleDelivered: 0,
    totalSampleDeliverPending: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const navigation = useNavigation();
  // Get theme from context
  const { theme: themeMode } = useTheme(); // Renamed to avoid conflict

  const isDarkMode = themeMode === 'dark';

  const themed = getThemeStyles(themeMode)

  const { fieldBoyId, userId ,loginBranchId} = useAuth();
  const finalFieldBoyId = fieldBoyId

  // Animation values for floating waves
  const waveAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);

  // Theme colors - renamed to themeColors to avoid conflict
  const themeColors = useMemo(() => ({
    dark: {
      background: '#1a1a2e',
      cardBackground: '#16213e',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      cardGradient: ['#1e2a3a', '#2d3a4a'],
      cardGradientAlt: ['#2d1b4e', '#1a1a2e'],
      headerGradient: ['#1e1b4b', '#312e81', '#3730a3'],
      skeletonBg: '#2a2a3e',
      skeletonHighlight: '#3a3a4e',
      border: '#2a2a3e',
      trackColor: '#2a2a3e',
    },
    light: {
      background: '#ffffff',
      cardBackground: '#ffffff',
      text: '#f4f5f8',
      textSecondary: '#fbfcfd',
      cardGradient: ['rgb(94, 97, 236)', '#0c92878b'],
      cardGradientAlt: ['#e0f2fe', '#bae6fd'],
      headerGradient: ['#1e1b4b', '#312e81', '#3730a3'],
      skeletonBg: '#f1f5f9',
      skeletonHighlight: '#e2e8f0',
      border: '#e2e8f0',
      trackColor: '#b46666',
    },
  }), []);

  const currentTheme = isDarkMode ? themeColors.dark : themeColors.light;

  useEffect(() => {
    waveAnimation.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getDashboardData = useCallback(async (id) => {
    if (!id) return;

    const finalFromDate = fromDate || getTodayDate();
    const finalToDate = toDate || getTodayDate();

    setLoading(true);

    try {
      const response = await api.get('FlaboDashBoard/sample-summary', {
        params: {
          fieldBoyId: id,
          fromDate: finalFromDate,
          toDate: finalToDate,
          loginBranchIdList:loginBranchId
        },
      });

      const data = response?.data?.data || {};

      console.log('dashboard data', data);

      setDashboardData({
        totalSamples: Number(data.TotalSamples || 0),
        totalPaymentCollected: Number(data.TotalPaymentCollected || 0),
        totalSamplePicked: Number(data.TotalSamplePicked || 0),
        totalSampleDelivered: Number(data.TotalSampleDelivered || 0),
        totalSampleDeliverPending: Number(data.SampleDeliverPending || 0),
      });

    } catch (error) {
      console.log(
        'dashboard error',
        error?.response?.data || error?.message
      );
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useFocusEffect(
    useCallback(() => {
      if (finalFieldBoyId && fromDate && toDate) {
        getDashboardData(finalFieldBoyId);
      }
    }, [finalFieldBoyId, getDashboardData, fromDate, toDate])
  );

  useImperativeHandle(ref, () => ({
    refresh: () => getDashboardData(finalFieldBoyId),
  }));

  const maxValue = useMemo(() => {
    return Math.max(
      dashboardData.totalSamples,
      dashboardData.totalPaymentCollected,
      dashboardData.totalSamplePicked,
      dashboardData.totalSampleDelivered,
      1
    );
  }, [dashboardData]);

  const statsCards = useMemo(() => [
    {
      id: 'totalSamples',
      title: 'Total Samples',
      value: dashboardData?.totalSamples || 0,
      icon: 'flask',
      iconSet: 'FontAwesome5',
      gradient: ['#667eea', '#764ba2'],
      accentColor: '#dfe2ee',
    },
    {
      id: 'payment',
      title: 'Revenue Collected',
      value: formatCurrency(dashboardData.totalPaymentCollected || 0),
      icon: 'currency-inr',
      iconSet: 'MaterialCommunityIcons',
      gradient: ['#d05fdd', '#dd2d45'],
      accentColor: '#f5576c',
    },
    {
      id: 'picked',
      title: 'Samples Picked',
      value: dashboardData.totalSamplePicked || 0,
      icon: 'package-variant-closed',
      iconSet: 'MaterialCommunityIcons',
      gradient: ['#4facfe', '#00f2fe'],
      accentColor: '#4facfe',
    },
    {
      id: 'delivered',
      title: 'Samples Delivered',
      value: dashboardData.totalSampleDelivered || 0,
      icon: 'truck-fast',
      iconSet: 'MaterialCommunityIcons',
      gradient: ['#43e97b', '#38f9d7'],
      accentColor: '#43e97b',
    },
  ], [dashboardData]);

  const FloatingCard = ({ item, index }) => {
    const isSelected = selectedCard === item.id;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify().damping(20)}
        layout={Layout.springify()}
        style={[
          tw`mb-1.5`,
          Platform.OS === 'ios' && {
            shadowColor: isDarkMode ? '#000' : item.accentColor,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: isDarkMode ? 0.3 : 0.2,
            shadowRadius: 20,
          },
          Platform.OS === 'android' && {
            elevation: 8,
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => setSelectedCard(isSelected ? null : item.id)}
          style={tw`overflow-hidden`}
        >
          <LinearGradient
            colors={currentTheme.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              tw`rounded-xl overflow-hidden`,
              isDarkMode && { borderWidth: 1, borderColor: currentTheme.border }
            ]}
          >
            {/* Floating wave background */}
            <View style={[tw`absolute top-0 right-0 w-32 h-32 opacity-10`]}>
              <Svg width="128" height="128" viewBox="0 0 128 128">
                <Circle cx="64" cy="64" r="63" fill={item.accentColor} />
              </Svg>
            </View>

            <View style={tw`p-5`}>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View style={tw`flex-row items-center gap-4`}>
                  {/* Icon container */}
                  <View
                    style={[
                      tw`w-10 h-10 rounded-2xl items-center justify-center`,
                      {
                        backgroundColor: isDarkMode
                          ? `${item.accentColor}25`
                          : `${item.accentColor}15`
                      }
                    ]}
                  >
                    {item.iconSet === 'FontAwesome5' ? (
                      <FontAwesome5 name={item.icon} size={20} color={item.accentColor} />
                    ) : (
                      <Icon name={item.icon} size={20} color={item.accentColor} />
                    )}
                  </View>
                  <View>
                    <Text style={[
                      tw`text-xs font-semibold uppercase tracking-wider mb-1`,
                      { color: currentTheme.textSecondary }
                    ]}>
                      {item.title}
                    </Text>
                  </View>
                </View>

                <Text style={[
                  tw`text-md font-bold tracking-tight`,
                  { color: currentTheme.text }
                ]}>
                  {item.value}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Summary header card
  const SummaryHeader = () => (
    <Animated.View
      entering={ZoomIn.delay(200).springify()}
      style={tw`mb-1`}
    >
      <LinearGradient
        colors={currentTheme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`rounded-xl p-4`,
          Platform.OS === 'ios' && {
            shadowColor: '#312e81',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 25,
          }
        ]}
      >
        <View style={tw`flex-row items-center justify-between `}>
          <View>
            <Text style={tw`text-indigo-200 text-xs font-semibold uppercase tracking-wider `}>
              Dashboard Overview
            </Text>
            <Text style={tw`text-white text-md font-bold tracking-tight`}>
              Sample Analytics
            </Text>
            {
              dashboardData?.totalSampleDeliverPending > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Sample', {
                    screen: 'HelpDeskHome',
                  })}
                  style={[themed.border, tw` flex-row items-center px-3 py-2 gap-4 mt-1 bg-gray-100/5`]}>
                  <Image
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/128/13081/13081427.png',
                    }}
                    style={tw`w-10 h-10 `}
                  />
                  <View style={tw`flex-col items-end `}>
                    <Text style={[themed.labelText, tw`text-end text-xl font-bold text-orange-500`]}>
                      {dashboardData?.totalSampleDeliverPending}
                    </Text>
                    <Text style={tw`text-sm text-gray-400 text-center`}>
                      Samples pending for delivery
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            }
          </View>
          <View style={tw`bg-white/20 rounded-full p-3`}>
            <Feather name="activity" size={24} color="white" />
          </View>
        </View>

        {/* Wave graph visualization */}
        <View style={tw`h-16 mt-2`}>
          <Svg width={CARD_WIDTH - 64} height="80" viewBox={`0 0 ${CARD_WIDTH - 64} 80`}>
            <Defs>
              <SvgGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                <Stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.8" />
              </SvgGradient>
            </Defs>
            <Path
              d={`M 0 60 Q ${(CARD_WIDTH - 64) / 4} 20, ${(CARD_WIDTH - 64) / 2} 40 T ${CARD_WIDTH - 64} 30`}
              stroke="url(#wave-gradient)"
              strokeWidth="3"
              fill="transparent"
            />
          </Svg>
        </View>

        <View style={tw`flex-row justify-between mt-1 pt-1 border-t border-white/10`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-indigo-200 text-xs mb-1`}>Total Samples</Text>
            <Text style={tw`text-white font-bold text-lg`}>{dashboardData.totalSamples}</Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-indigo-200 text-xs mb-1`}>Collected Amount</Text>
            <Text style={tw`text-white font-bold text-lg`}>
              {formatCurrency(dashboardData.totalPaymentCollected || 0)}
            </Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-indigo-200 text-xs mb-1`}>Samples delivered</Text>
            <Text style={tw`text-white font-bold text-lg`}>{dashboardData.totalSampleDelivered || 0}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <View>
      {[1, 2, 3, 4].map((idx) => (
        <View key={idx} style={tw`mb-4`}>
          <View style={[
            tw`rounded-3xl h-32`,
            { backgroundColor: currentTheme.skeletonBg }
          ]}>
            <View style={tw`p-5`}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={[
                  tw`w-12 h-12 rounded-2xl`,
                  { backgroundColor: currentTheme.skeletonHighlight }
                ]} />
                <View style={tw`flex-1`}>
                  <View style={[
                    tw`w-24 h-3 rounded-full mb-2`,
                    { backgroundColor: currentTheme.skeletonHighlight }
                  ]} />
                  <View style={[
                    tw`w-32 h-6 rounded-full`,
                    { backgroundColor: currentTheme.skeletonHighlight }
                  ]} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[
        tw`flex-1`,
        { backgroundColor: currentTheme.background }
      ]}
    >
      <SummaryHeader />

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <View>
          {statsCards.map((item, index) => (
            <FloatingCard key={item.id} item={item} index={index} />
          ))}
        </View>
      )}

      <View style={tw`h-20`} />
    </ScrollView>
  );
});

export default DashboardCollection;