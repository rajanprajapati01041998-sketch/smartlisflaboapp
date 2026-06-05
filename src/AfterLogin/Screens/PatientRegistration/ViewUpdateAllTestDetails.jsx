import { View, Text, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import api from '../../../../Authorization/api';
import { useAuth } from '../../../../Authorization/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Barcode from '@kichiyaki/react-native-barcode-generator';
import { LinearGradient } from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// Custom Skeleton Component
const CustomSkeleton = ({ width, height, borderRadius = 8, style = {} }) => {
    const { theme } = useTheme();
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const backgroundColor = theme === 'dark' ? '#1f2937' : '#e5e7eb';
    const shimmerColor = theme === 'dark' ? '#374151' : '#f3f4f6';

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: shimmerColor,
                    transform: [{ translateX: shimmerTranslate }],
                    opacity: 0.5,
                }}
            />
        </View>
    );
};

const ViewUpdateAllTestDetails = ({ visitId, labNo, puhid }) => {
    const { loginBranchId } = useAuth();
    const { theme } = useTheme();
    const themed = getThemeStyles(theme);
    const navigation = useNavigation();

    const [patientInfo, setPatientInfo] = useState(null);
    const [testList, setTestList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedIndex, setExpandedIndex] = useState(null);

    useFocusEffect(
        useCallback(() => {
            if (visitId && labNo && puhid) {
                getAllTestDetails();
            }
        }, [visitId, labNo, puhid])
    );

    const getAllTestDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(
                `Patient/get-patient-investigation-details?branchId=${loginBranchId}&uhid=${puhid}&labNo=${labNo}&visitId=${visitId}`
            );

            const data = response?.data?.data || [];

            setPatientInfo(data[0]);
            setTestList(data);
        } catch (error) {
            console.log("details error", error?.response);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
            case 'Pending':
                return { bg: '#fed7aa', text: '#92400e', border: '#f59e0b' };
            case 'In Progress':
                return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
            default:
                return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
        }
    };

    // Custom Skeleton Components
    const SkeletonPatientCard = () => (
        <View style={tw`mx-3 mt-3 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg`}>
            <View style={tw`p-5`}>
                {/* Header */}
                <View style={tw`flex-row justify-between items-center mb-4 pb-2`}>
                    <View style={tw`flex-row items-center`}>
                        <CustomSkeleton width={40} height={40} borderRadius={20} />
                        <CustomSkeleton width={120} height={20} borderRadius={4} style={tw`ml-3`} />
                    </View>
                    <CustomSkeleton width={32} height={32} borderRadius={16} />
                </View>

                {/* Patient Details Grid */}
                <View style={tw`flex-row flex-wrap`}>
                    {[1, 2, 3, 4].map((_, i) => (
                        <View key={i} style={tw`w-1/2 mb-3`}>
                            <CustomSkeleton width={60} height={12} borderRadius={4} />
                            <View style={tw`flex-row items-center mt-2`}>
                                <CustomSkeleton width={16} height={16} borderRadius={8} />
                                <CustomSkeleton width={80} height={16} borderRadius={4} style={tw`ml-2`} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );

    const SkeletonTestCard = () => (
        <View style={tw`mb-3 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm`}>
            <View style={tw`p-4`}>
                <View style={tw`flex-row justify-between items-start`}>
                    <View style={tw`flex-1 pr-3`}>
                        <View style={tw`flex-row items-center gap-2 mb-2`}>
                            <CustomSkeleton width={32} height={32} borderRadius={8} />
                            <CustomSkeleton width={160} height={20} borderRadius={4} />
                        </View>
                        <View style={tw`mt-2`}>
                            <CustomSkeleton width={200} height={40} borderRadius={8} />
                        </View>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                        <CustomSkeleton width={60} height={24} borderRadius={12} />
                        <CustomSkeleton width={24} height={24} borderRadius={12} />
                    </View>
                </View>
            </View>
        </View>
    );

    const PatientInfoCard = () => (
        <LinearGradient
            colors={theme === 'dark' ? ['#1f2937', '#111827'] : ['#ffffff', '#f9fafb']}
            style={tw` mt-3   `}
        >
            <View style={[themed.border,tw`p-5`]}>
                {/* Header with Icon */}
                <View style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-700`}>
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`bg-blue-100 dark:bg-blue-900 p-2 rounded-full`}>
                            <FontAwesome5 name="user-alt" size={18} color="#3b82f6" />
                        </View>
                        <Text style={[themed.labelText, tw`ml-3 text-lg font-bold`]}>
                            Patient Information
                        </Text>
                    </View>
                   
                </View>

                {/* Patient Details Grid */}
                <View style={tw`flex-row flex-wrap`}>
                    <View style={tw`w-1/2 mb-3`}>
                        <Text style={[themed.transactionLabel, tw`text-xs`]}>UHID</Text>
                        <View style={tw`flex-row items-center mt-1`}>
                            <Feather name="hash" size={14} color={themed.chevronColor} />
                            <Text style={[themed.labelText, tw`ml-2 text-sm font-semibold`]}>
                                {patientInfo?.uhid || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    <View style={tw`w-1/2 mb-3`}>
                        <Text style={[themed.transactionLabel, tw`text-xs`]}>Patient Name</Text>
                        <View style={tw`flex-row items-center mt-1`}>
                            <MaterialIcons name="person" size={16} color={themed.chevronColor} />
                            <Text style={[themed.labelText, tw`ml-2 text-sm font-semibold`]}>
                                {patientInfo?.patientName || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    <View style={tw`w-1/2 mb-3`}>
                        <Text style={[themed.transactionLabel, tw`text-xs`]}>Age & Gender</Text>
                        <View style={tw`flex-row items-center mt-1`}>
                            <MaterialIcons name="date-range" size={14} color={themed.chevronColor} />
                            <Text style={[themed.labelText, tw`ml-2 text-sm`]}>
                                {patientInfo?.currentAge || 'N/A'} • {patientInfo?.gender || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    <View style={tw`w-1/2 mb-3`}>
                        <Text style={[themed.transactionLabel, tw`text-xs`]}>Bill Date</Text>
                        <View style={tw`flex-row items-center mt-1`}>
                            <MaterialIcons name="calendar-today" size={14} color={themed.chevronColor} />
                            <Text style={[themed.labelText, tw`ml-2 text-sm`]}>
                                {patientInfo?.billDate || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {patientInfo?.contactNumber && (
                        <View style={tw`w-full mb-2`}>
                            <Text style={[themed.transactionLabel, tw`text-xs`]}>Contact</Text>
                            <View style={tw`flex-row items-center mt-1`}>
                                <Feather name="phone" size={14} color={themed.chevronColor} />
                                <Text style={[themed.labelText, tw`ml-2 text-sm`]}>
                                    {patientInfo?.contactNumber}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </LinearGradient>
    );

    const TestCard = ({ item, index }) => {
        const isExpanded = expandedIndex === index;
        const isUrgent = item?.isUrgent === 1;
        const statusColors = getStatusColor(item?.status);

        return (
            <View
                style={[themed.border,
                    tw`mb-3 p-2`,
                    isUrgent && { borderLeftWidth: 4, borderLeftColor: '#ef4444' }
                ]}
            >
                {/* Test Header - Always Visible */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(index)}
                    style={tw`flex-row justify-between items-start `}
                >
                    <View style={tw`flex-1 pr-3`}>
                        <View style={tw`flex-row items-center gap-2 mb-2`}>
                            <View style={tw`bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg`}>
                                <FontAwesome5 name="flask" size={14} color="#3b82f6" />
                            </View>
                            <Text style={[themed.labelText, tw`font-semibold text-base flex-1`]} numberOfLines={2}>
                                {item?.name || 'N/A'}
                            </Text>
                        </View>

                        {/* Barcode */}
                        {item?.barCode && (
                            <View style={tw`mt-2 items-start`}>
                                <Barcode
                                    value={String(item.barCode).trim()}
                                    format="CODE128"
                                    width={Platform.OS === 'ios' ? 1.5 : 1.2}
                                    maxWidth={Math.min(220, width - 100)}
                                    height={28}
                                    lineColor={theme === 'dark' ? '#9ca3af' : '#4b5563'}
                                    background="transparent"
                                    text={String(item.barCode)}
                                    textStyle={[themed.mutedText, tw`text-[10px]`]}
                                />
                            </View>
                        )}
                    </View>

                    
                </TouchableOpacity>

                {/* Expanded Details */}
                
            </View>
        );
    };

    // Loading Skeleton View with Custom Skeleton
    if (loading) {
        return (
            <ScrollView 
                style={[themed.childScreen, tw`flex-1  `]} 
                showsVerticalScrollIndicator={false}
            >
                {/* Patient Info Skeleton */}
                <SkeletonPatientCard />

                {/* Tests Section Header Skeleton */}
                <View style={tw`mt-4`}>
                    <View style={tw`flex-row justify-between items-center`}>
                        <View style={tw`flex-row items-center gap-2`}>
                            <CustomSkeleton width={24} height={24} borderRadius={4} />
                            <CustomSkeleton width={120} height={20} borderRadius={4} />
                        </View>
                        <CustomSkeleton width={60} height={24} borderRadius={12} />
                    </View>
                </View>

                {/* Test List Skeletons */}
                {[1, 2, 3].map((_, index) => (
                    <SkeletonTestCard key={index} />
                ))}
            </ScrollView>
        );
    }

    if (!patientInfo && testList.length === 0) {
        return (
            <View style={[themed.screen, tw`flex-1 justify-center items-center p-6`]}>
                <FontAwesome5 name="flask" size={64} color="#9ca3af" />
                <Text style={[themed.labelText, tw`text-center mt-4 text-gray-500 text-base`]}>
                    No test details available
                </Text>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={tw`mt-6 bg-blue-500 px-6 py-3 rounded-xl`}
                >
                    <Text style={tw`text-white font-semibold`}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView 
            style={[themed.childScreen, tw`flex-1 `]} 
            showsVerticalScrollIndicator={false}
        >
            {/* Patient Info Card */}
            {patientInfo && <PatientInfoCard />}

            {/* Tests Section */}
            <View style={tw`mt-4 mb-6`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <FontAwesome5 name="microscope" size={18} color="#3b82f6" />
                        <Text style={[themed.labelText, tw`text-base font-bold`]}>
                            Test Details
                        </Text>
                    </View>
                    <View style={tw`bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full`}>
                        <Text style={tw`text-blue-600 dark:text-blue-400 text-xs font-semibold`}>
                            {testList.length} Tests
                        </Text>
                    </View>
                </View>

                {testList.length > 0 ? (
                    testList.map((item, index) => (
                        <TestCard  key={index} item={item} index={index} />
                    ))
                ) : (
                    <View style={[themed.childScreen, tw`p-8 rounded-xl items-center`]}>
                        <FontAwesome5 name="flask" size={48} color="#9ca3af" />
                        <Text style={[themed.labelText, tw`text-center mt-3 text-gray-500`]}>
                            No test details available
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

export default ViewUpdateAllTestDetails;