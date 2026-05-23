import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Modal,
    TouchableWithoutFeedback,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';

import tw from 'twrnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

import { useAuth } from '../../../Authorization/AuthContext';
import api from '../../../Authorization/api';
import { useToast } from '../../../Authorization/ToastContext';
import { useTheme } from '../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../utils/themeStyles';
import FilterDate from '../../AfterLogin/Screens/FilterDate';
import {
    startLiveLocationSession,
    stopLiveLocationSession,
} from '../../utils/backgroundLocationPrefs';

const SampleTrackingSearchHeader = memo(function SampleTrackingSearchHeader({
    themed,
    uhid,
    patientName,
    onUhidChange,
    onPatientNameChange,
    onSearch,
    onClear,
    onOpenFilter,
    loading,
    fromDate,
    toDate,
    sampleCount,
}) {
    return (
        <View style={tw`px-4 pt-4 pb-2 bg-white dark:bg-gray-900`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={[themed.headerTitle, tw`text-lg font-bold`]}>
                    Sample Tracking
                </Text>

                <TouchableOpacity
                    onPress={onOpenFilter}
                    style={[
                        tw`px-4 py-2 rounded-xl flex-row items-center`,
                        themed.filterButton,
                    ]}
                >
                    <Feather
                        name="calendar"
                        size={18}
                        color={themed.filterButtonIcon}
                    />
                    <Text style={[themed.filterButtonText, tw`ml-2`]}>
                        Filter
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={tw`flex-row gap-3 mb-3`}>
                <TextInput
                    value={uhid}
                    onChangeText={onUhidChange}
                    placeholder="Search by UHID"
                    placeholderTextColor={themed.inputPlaceholder}
                    style={[themed.inputBox, themed.inputText, tw`flex-1`]}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="next"
                    blurOnSubmit={false}
                />

                <TextInput
                    value={patientName}
                    onChangeText={onPatientNameChange}
                    placeholder="Patient Name"
                    placeholderTextColor={themed.inputPlaceholder}
                    style={[themed.inputBox, themed.inputText, tw`flex-1`]}
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={onSearch}
                />
            </View>

            <View style={tw`flex-row gap-3`}>
                <TouchableOpacity
                    onPress={onSearch}
                    disabled={loading}
                    style={tw`flex-1 bg-blue-600 py-3 rounded-xl flex-row justify-center items-center`}
                >
                    <Feather name="search" size={18} color="#fff" />
                    <Text style={tw`text-white font-semibold ml-2`}>
                        {loading ? 'Searching...' : 'Search'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onClear}
                    style={tw`bg-gray-300 dark:bg-gray-700 px-6 py-3 rounded-xl`}
                >
                    <Text style={tw`font-semibold text-gray-700 dark:text-gray-300`}>
                        Clear
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={tw`flex-row justify-between items-center mt-3`}>
                <Text style={tw`text-gray-500 dark:text-gray-400 text-xs`}>
                    📅 {fromDate} → {toDate}
                </Text>

                <View style={tw`bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full`}>
                    <Text style={tw`text-blue-700 dark:text-blue-300 text-xs font-semibold`}>
                        {sampleCount} samples
                    </Text>
                </View>
            </View>
        </View>
    );
});

const UpdateSampleStatus = () => {
    const flatListRef = useRef(null);

    const { loginBranchId, fieldBoyId } = useAuth();
    const { showToast } = useToast();
    const { theme } = useTheme();
    const themed = getThemeStyles(theme);
    const navigation = useNavigation();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [sampleList, setSampleList] = useState([]);
    const [uhid, setUhid] = useState('');
    const [patientName, setPatientName] = useState('');
    const [appliedUhid, setAppliedUhid] = useState('');
    const [appliedPatientName, setAppliedPatientName] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const getTodayDate = useCallback(() => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const [fromDate, setFromDate] = useState(getTodayDate());
    const [toDate, setToDate] = useState(getTodayDate());

    const formatLocalDateTime = useCallback((dateValue) => {
        if (!dateValue) return 'N/A';

        return new Date(dateValue)
            .toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            })
            .replace('am', 'AM')
            .replace('pm', 'PM');
    }, []);

    const getSampleStatus = useCallback(async (searchOverrides = {}) => {
        try {
            setLoading(true);

            const uhidValue =
                searchOverrides.uhid !== undefined
                    ? searchOverrides.uhid
                    : appliedUhid;
            const patientNameValue =
                searchOverrides.patientName !== undefined
                    ? searchOverrides.patientName
                    : appliedPatientName;

            const payload = {
                fieldBoyId: Number(fieldBoyId),
                loginBranchIdList: String(loginBranchId),
                fromDate,
                toDate,
                uhid: uhidValue?.trim() || null,
                patientName: patientNameValue?.trim() || null,
            };

            const response = await api.post(
                'FlaboDashBoard/patient-sample-tracking',
                payload,
            );

            if (response?.data?.success) {
                setSampleList(
                    Array.isArray(response?.data?.data)
                        ? response.data.data
                        : [],
                );
            } else {
                setSampleList([]);
                showToast(response?.data?.message || 'No data found', 'info');
            }
        } catch (error) {
            console.log('API Error =>', error?.response?.data || error);
            showToast('Failed to fetch sample data', 'error');
            setSampleList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [
        fieldBoyId,
        loginBranchId,
        fromDate,
        toDate,
        appliedUhid,
        appliedPatientName,
        showToast,
    ]);

    const handleSearch = useCallback(() => {
        const trimmedUhid = uhid.trim();
        const trimmedPatientName = patientName.trim();
        setAppliedUhid(trimmedUhid);
        setAppliedPatientName(trimmedPatientName);
        getSampleStatus({
            uhid: trimmedUhid,
            patientName: trimmedPatientName,
        });
    }, [uhid, patientName, getSampleStatus]);

    const samplePickedApi = useCallback(async () => {
        if (!selectedItem?.Id) {
            showToast('Invalid sample', 'error');
            return;
        }
        try {
            setUpdating(true);
            const payload = {
                id: selectedItem.Id,
                samplePickup: true,
            };
            await api.post('FlaboDashBoard/update-sample-status', payload);
            showToast('Sample picked successfully', 'success');
            setMenuVisible(false);
            setSelectedItem(null);
            await getSampleStatus();
            await startLiveLocationSession(selectedItem.Id);
            navigation.navigate('FlaboShareLiveLocation', {
                id: selectedItem.Id,
            });
        } catch (error) {
            console.log('Sample Picked Error =>', error?.response?.data || error);
            showToast('Failed to update sample picked', 'error');
        } finally {
            setUpdating(false);
        }
    }, [selectedItem, showToast, getSampleStatus, navigation]);

    const sampleDeliveredApi = useCallback(async (itemOverride) => {
        const target = itemOverride || selectedItem;

        if (!target?.Id) {
            showToast('Invalid sample', 'error');
            return;
        }

        try {
            setUpdating(true);

            const payload = {
                id: target.Id,
                sampleDelivered: true,
            };

            await api.post('FlaboDashBoard/update-sample-status', payload);

            showToast('Sample delivered successfully', 'success');
            setMenuVisible(false);
            setSelectedItem(null);
            await stopLiveLocationSession();

            await getSampleStatus();
        } catch (error) {
            console.log('Sample Delivered Error =>', error?.response?.data || error);
            showToast('Failed to update sample delivered', 'error');
        } finally {
            setUpdating(false);
        }
    }, [selectedItem, showToast, getSampleStatus]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getSampleStatus();
    }, [getSampleStatus]);

    const clearSearch = useCallback(() => {
        setUhid('');
        setPatientName('');
        setAppliedUhid('');
        setAppliedPatientName('');
        setFromDate(getTodayDate());
        setToDate(getTodayDate());

        setTimeout(() => {
            getSampleStatus({ uhid: '', patientName: '' });
        }, 100);
    }, [getSampleStatus, getTodayDate]);

    const openMenu = useCallback((item) => {
        setSelectedItem(item);
        setMenuVisible(true);
    }, []);

    const scrollToTop = () => {
        flatListRef.current?.scrollToOffset({
            offset: 0,
            animated: true,
        });
    };

    const handleScroll = (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollTop(offsetY > 250);
    };

    useEffect(() => {
        if (loginBranchId && fieldBoyId) {
            getSampleStatus({ uhid: '', patientName: '' });
        }
        // Only load on mount / auth change — not when typing UHID or patient name
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginBranchId, fieldBoyId]);

    const getStatusStyle = useCallback((status) => {
        const styles = {
            'Sample Delivered': {
                bg: '#d1fae5',
                text: '#065f46',
                icon: 'check-circle',
            },
            'Sample Picked': {
                bg: '#fed7aa',
                text: '#92400e',
                icon: 'package-variant',
            },
            default: {
                bg: '#fee2e2',
                text: '#991b1b',
                icon: 'clock-outline',
            },
        };

        return styles[status] || styles.default;
    }, []);

    const SampleCard = ({ item }) => {
        const status = getStatusStyle(item?.SampleStatus);
        const canSwipeDeliver =
            item?.SamplePickup === true && item?.SampleDelivered === false;

        const renderSwipeLeftActions = () => {
            if (!canSwipeDeliver) return null;

            return (
                <View style={tw`justify-center ml-4`}>
                    <View style={tw`bg-emerald-600 px-4 py-3 rounded-xl`}>
                        <Text style={tw`text-white font-bold`}>Slide → Delivered</Text>
                    </View>
                </View>
            );
        };

        const onSwipeOpen = () => {
            if (!canSwipeDeliver || updating) {
                return;
            }

            Alert.alert(
                'Mark Delivered?',
                'Do you want to mark this sample as delivered?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delivered',
                        style: 'destructive',
                        onPress: () => sampleDeliveredApi(item),
                    },
                ],
            );
        };

        const CardBody = (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openMenu(item)}
                style={[
                    themed.card,
                    tw`mx-4 mt-3 p-4 rounded-2xl`,
                    {
                        borderLeftWidth: 4,
                        borderLeftColor: status.text,
                    },
                ]}
            >
                <View style={tw`flex-row justify-between items-start mb-3`}>
                    <View style={tw`flex-1`}>
                        <Text style={[themed.inputText, tw`text-md font-bold`]}>
                            {item?.PatientName || 'N/A'}
                        </Text>

                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mt-1`}>
                            UHID: {item?.UHID || 'N/A'}
                        </Text>
                    </View>

                    <View
                        style={[
                            tw`px-3 py-1.5 rounded-full flex-row items-center`,
                            {
                                backgroundColor: status.bg,
                            },
                        ]}
                    >
                        <Icon name={status.icon} size={14} color={status.text} />
                        <Text
                            style={[
                                tw`text-xs font-semibold ml-1`,
                                {
                                    color: status.text,
                                },
                            ]}
                        >
                            {item?.SampleStatus || 'Pending'}
                        </Text>
                    </View>
                </View>

                <View style={tw`flex-row flex-wrap mb-2`}>
                    <View style={tw`w-1/2 mb-2`}>
                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mb-1`}>
                            Amount
                        </Text>
                        <Text style={tw`text-green-600 dark:text-green-400 font-bold text-base`}>
                            ₹ {Number(item?.TotalPayment || 0).toLocaleString('en-IN')}
                        </Text>
                    </View>

                    <View style={tw`w-1/2 mb-2`}>
                        <Text style={tw`text-xs text-gray-500 dark:text-gray-400 mb-1`}>
                            Reg. Date
                        </Text>
                        <Text style={[themed.inputText, tw`font-semibold`]}>
                            {item?.CollectionDateTime
                                ? String(item.CollectionDateTime).split('T')[0]
                                : 'N/A'}
                        </Text>
                    </View>
                </View>

                {item?.ServiceList?.length > 0 &&
                    item.ServiceList.map((service, index) => (
                        <View key={index} style={tw`flex-row items-center mb-1`}>
                            <Text style={[themed.mutedText, tw`font-bold`]}>
                                {index + 1}.
                            </Text>
                            <Text style={[themed.mutedText, tw`ml-2 flex-1`]}>
                                {service.serviceName}
                            </Text>
                        </View>
                    ))}

                {item?.SamplePickupDateTime && (
                    <View style={tw`mt-2 pt-2 border-t border-gray-200 dark:border-gray-700`}>
                        <View style={tw`flex-row justify-between items-center`}>
                            <Text style={tw`text-xs text-gray-500 dark:text-gray-400`}>
                                Sample Collection
                            </Text>
                            <Text style={[themed.mutedText, tw`text-xs font-medium`]}>
                                {formatLocalDateTime(item.SamplePickupDateTime)}
                            </Text>
                        </View>
                    </View>
                )}

                {item?.SampleDeliveredDateTime && (
                    <View style={tw`mt-1`}>
                        <View style={tw`flex-row justify-between items-center`}>
                            <Text style={tw`text-xs text-gray-500 dark:text-gray-400`}>
                                Sample Delivered
                            </Text>
                            <Text style={[themed.mutedText, tw`text-xs font-medium`]}>
                                {formatLocalDateTime(item.SampleDeliveredDateTime)}
                            </Text>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );

        if (!canSwipeDeliver) {
            return CardBody;
        }

        return (
            <Swipeable
                renderLeftActions={renderSwipeLeftActions}
                leftThreshold={90}
                onSwipeableOpen={onSwipeOpen}
            >
                {CardBody}
            </Swipeable>
        );
    };

    const ActionModal = () => (
        <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => setMenuVisible(false)}
                style={tw`flex-1 bg-black/50 justify-end`}
            >
                <View style={[themed.card, tw`rounded-t-3xl p-5`]}>
                    <View style={tw`items-center mb-4`}>
                        <View style={tw`w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mb-4`} />
                        <Text style={[themed.inputText, tw`text-xl font-bold text-center`]}>
                            Update Status
                        </Text>
                        <Text style={tw`text-gray-500 dark:text-gray-400 text-center mt-1`}>
                            {selectedItem?.PatientName || 'N/A'} ({selectedItem?.UHID || 'N/A'})
                        </Text>
                    </View>

                    <View style={tw`flex-row gap-3 mb-4`}>
                        <TouchableOpacity
                            // disabled={updating || selectedItem?.SamplePickup === true}
                            onPress={samplePickedApi}
                            activeOpacity={
                                updating || selectedItem?.SamplePickup === true ? 1 : 0.8
                            }
                            style={tw.style(`flex-1 py-4 rounded-xl flex-row justify-center items-center`, updating || selectedItem?.SamplePickup === true ? 'bg-gray-400' : 'bg-amber-500',)} >
                            <Icon name="package-variant" size={22} color={updating || selectedItem?.SamplePickup === true ? '#D1D5DB' : '#fff'} />
                            <Text style={tw.style(`font-bold ml-2`, updating || selectedItem?.SamplePickup === true ? 'text-gray-200' : 'text-white',)}>
                                {selectedItem?.SamplePickup === true ? 'Already Picked' : updating ? 'Processing...' : 'Picked'}
                            </Text>
                        </TouchableOpacity>
                        {selectedItem?.SamplePickup === true &&
                            selectedItem?.SampleDelivered === false && (
                                <TouchableOpacity
                                    disabled={updating}
                                    onPress={sampleDeliveredApi}
                                    style={tw`flex-1 bg-emerald-600 py-4 rounded-xl flex-row justify-center items-center`}
                                >
                                    <Icon name="truck-check" size={22} color="#fff" />

                                    <Text style={tw`text-white font-bold ml-2`}>
                                        {updating ? 'Processing...' : 'Delivered'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                    </View>

                    <TouchableOpacity
                        onPress={() => setMenuVisible(false)}
                        style={tw`bg-gray-200 dark:bg-gray-700 py-4 rounded-xl`}
                    >
                        <Text style={tw`text-gray-700 dark:text-gray-300 font-bold text-center`}>
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const FilterModal = () => (
        <Modal
            visible={filterVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setFilterVisible(false)}
        >
            <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
                <View style={tw`flex-1 justify-center p-4 bg-black/50`}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View>
                            <FilterDate
                                onClose={() => setFilterVisible(false)}
                                onSave={(data) => {
                                    const formatToApiDate = (date) => {
                                        const [dd, mm, yyyy] = date.split('-');
                                        return `${yyyy}-${mm}-${dd}`;
                                    };

                                    setFromDate(formatToApiDate(data.fromDate));
                                    setToDate(formatToApiDate(data.toDate));
                                    setFilterVisible(false);

                                    setTimeout(() => {
                                        getSampleStatus();
                                    }, 100);
                                }}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    return (
        <SafeAreaView style={[themed.childScreen, tw`flex-1`]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <SampleTrackingSearchHeader
                themed={themed}
                uhid={uhid}
                patientName={patientName}
                onUhidChange={setUhid}
                onPatientNameChange={setPatientName}
                onSearch={handleSearch}
                onClear={clearSearch}
                onOpenFilter={() => setFilterVisible(true)}
                loading={loading}
                fromDate={fromDate}
                toDate={toDate}
                sampleCount={sampleList.length}
            />

            <FlatList
                ref={flatListRef}
                style={tw`flex-1`}
                data={sampleList}
                keyExtractor={(item, index) => String(item?.Id || index)}
                renderItem={({ item }) => <SampleCard item={item} />}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={() => (
                    <View style={tw`flex-1 justify-center items-center py-20`}>
                        <Icon
                            name="clipboard-text-outline"
                            size={80}
                            color={themed.inputPlaceholder}
                        />
                        <Text style={[themed.mutedText, tw`mt-4 text-lg font-semibold`]}>
                            No samples found
                        </Text>
                        <Text style={tw`text-gray-400 text-sm mt-2`}>
                            Try adjusting your search or filters
                        </Text>
                    </View>
                )}
                contentContainerStyle={tw`pb-28`}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />

            {showScrollTop && (
                <TouchableOpacity
                    onPress={scrollToTop}
                    activeOpacity={0.8}
                    style={tw`absolute right-5 bottom-8 bg-blue-600 w-12 h-12 rounded-full items-center justify-center shadow-lg`}
                >
                    <Icon name="arrow-up" size={26} color="#fff" />
                </TouchableOpacity>
            )}

            {loading && !refreshing && (
                <View style={tw`absolute inset-0 bg-black/50 justify-center items-center`}>
                    <View style={tw`bg-white dark:bg-gray-800 rounded-2xl p-6 items-center`}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={tw`text-gray-600 dark:text-gray-300 mt-3 font-medium`}>
                            Loading samples...
                        </Text>
                    </View>
                </View>
            )}

            <ActionModal />
            <FilterModal />
        </SafeAreaView>
    );
};

export default UpdateSampleStatus;
