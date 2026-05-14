import {View, Text, TouchableOpacity, Platform} from 'react-native';
import React, {
  useCallback,
  useImperativeHandle,
  useState,
  forwardRef,
} from 'react';
import tw from 'twrnc';
import api from '../../../../Authorization/api';
import {useFocusEffect} from '@react-navigation/native';
import Animated, {FadeInDown, Layout} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../../../Authorization/AuthContext';
import LinearGradient from 'react-native-linear-gradient';

const DashboardCollection = forwardRef(
  ({fromDate, toDate, fieldBoyId}, ref) => {
    const [dashboardData, setDashboardData] = useState({
      totalSamples: 0,
      totalPaymentCollected: 0,
      totalSamplePicked: 0,
      totalSampleDelivered: 0,
    });

    const {fieldBoyId: authFieldBoyId, userId} = useAuth();

    const finalFieldBoyId = fieldBoyId || authFieldBoyId || userId;

    const getTodayDate = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    const getDashboardData = useCallback(
      async id => {
        if (!id) {
          return;
        }

        const finalFromDate = fromDate || getTodayDate();
        const finalToDate = toDate || getTodayDate();

        console.log(
          'Dashboard API Params:',
          id,
          finalFromDate,
          finalToDate,
        );

        try {
          const response = await api.get(
            'FlaboDashBoard/sample-summary',
            {
              params: {
                fieldBoyId: id,
                fromDate: finalFromDate,
                toDate: finalToDate,
              },
            },
          );

          console.log('dsh', response?.data);

          const data = response?.data?.data || {};

          setDashboardData({
            totalSamples: Number(data.totalSamples || 0),
            totalPaymentCollected: Number(
              data.totalPaymentCollected || 0,
            ),
            totalSamplePicked: Number(
              data.totalSamplePicked || 0,
            ),
            totalSampleDelivered: Number(
              data.totalSampleDelivered || 0,
            ),
          });
        } catch (error) {
          console.log(
            'dashboard error',
            error?.response?.data || error?.message,
          );
        }
      },
      [fromDate, toDate],
    );

    useFocusEffect(
      useCallback(() => {
        if (finalFieldBoyId && fromDate && toDate) {
          getDashboardData(finalFieldBoyId);
        }
      }, [finalFieldBoyId, getDashboardData, fromDate, toDate]),
    );

    useImperativeHandle(ref, () => ({
      refresh: () => getDashboardData(finalFieldBoyId),
    }));

    const formatCurrency = amount => {
      const value = Number(amount || 0);
      return `₹ ${value.toLocaleString('en-IN')}`;
    };

    const getGradientColors = type => {
      const gradients = {
        totalSamples: ['#9bf6d8', '#23b98a'],
        payment: ['#efa017', '#cfb69a'],
        picked: ['#a4e8f4', '#39bcdc'],
        delivered: ['#5ec1b5', '#449a64'],
      };

      return gradients[type] || ['#6b7280', '#4b5563'];
    };

    // =========================
    // ALWAYS SHOW ALL 4 CARDS
    // =========================
    const statsCards = [
      {
        title: 'Total Samples',
        value: dashboardData.totalSamples || 0,
        icon: 'account-group',
        gradientType: 'totalSamples',
      },
      {
        title: 'Total Payment',
        value: formatCurrency(
          dashboardData.totalPaymentCollected || 0,
        ),
        icon: 'wallet',
        gradientType: 'payment',
      },
      {
        title: 'Picked Samples',
        value: dashboardData.totalSamplePicked || 0,
        icon: 'check-circle',
        gradientType: 'picked',
      },
      {
        title: 'Delivered Samples',
        value: dashboardData.totalSampleDelivered || 0,
        icon: 'truck-check',
        gradientType: 'delivered',
      },
    ];

    const StatsCard = ({item, index}) => {
      const gradientColors = getGradientColors(item.gradientType);

      return (
        <Animated.View
          entering={FadeInDown.delay(index * 80).springify()}
          layout={Layout.springify()}
          style={[
            tw`mb-4`,
            {
              width: '48%',
            },
          ]}>
          <TouchableOpacity activeOpacity={0.9}>
            <View style={tw`rounded-2xl shadow-lg`}>
              <LinearGradient
                colors={gradientColors}
                style={[
                  tw`rounded-2xl h-28 justify-between`,
                  Platform.OS === 'ios'
                    ? {
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 3},
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                      }
                    : {
                        padding: 14,
                        elevation: 5,
                      },
                ]}>
                {/* TOP */}
                <View
                  style={tw`flex-row justify-between items-center`}>
                  <View
                    style={tw`bg-white/20 rounded-full p-2`}>
                    <Icon
                      name={item.icon}
                      size={Platform.OS === 'ios' ? 20 : 24}
                      color="white"
                    />
                  </View>

                  <Text
                    numberOfLines={1}
                    style={[
                      tw`text-white font-extrabold`,
                      {
                        fontSize:
                          Platform.OS === 'ios' ? 15 : 18,
                        maxWidth: '65%',
                      },
                    ]}>
                    {item.value}
                  </Text>
                </View>

                {/* BOTTOM */}
                <View>
                  <Text
                    numberOfLines={2}
                    style={[
                      tw`text-white font-semibold`,
                      {
                        fontSize:
                          Platform.OS === 'ios' ? 12 : 14,
                      },
                    ]}>
                    {item.title}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    };

    return (
      <View
        style={[
          tw`pt-2 flex-row flex-wrap justify-between`,
          {
            paddingHorizontal:
              Platform.OS === 'ios' ? 2 : 0,
          },
        ]}>
        {statsCards.map((item, index) => (
          <StatsCard
            key={`${item.title}-${index}`}
            item={item}
            index={index}
          />
        ))}
      </View>
    );
  },
);

export default DashboardCollection;