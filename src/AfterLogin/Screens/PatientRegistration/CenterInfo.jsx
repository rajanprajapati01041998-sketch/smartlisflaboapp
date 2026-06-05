import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    FlatList,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import tw from 'twrnc';
import styles from '../../../utils/InputStyle';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../../Authorization/api';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';
import Feather from 'react-native-vector-icons/Feather';
import { Accordion } from 'react-native-paper/lib/typescript/components/List/List';
import { useAuth } from '../../../../Authorization/AuthContext';

const CenterInfo = ({ condition }) => {
    const [allBranchInfo, setAllBranchInfo] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [ratePannel, setRatePannel] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [uhid, setUhid] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCenterInfo, setShowCenterInfo] = useState(false);
    const [branchDetails, setBranchDetails] = useState(null);
    const [branchSearch, setBranchSearch] = useState('');
    const [selectedId, setSelectedId] = useState('1');
    const [patientSearchModal, setPatientSearchModal] = useState(false);
    const [patientSearchList, setPatientSearchList] = useState([]);
    const [patientSearchLoading, setPatientSearchLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(null)
    const [accordian, setAccordian] = useState(false)
    const [lastPress, setLastPress] = useState(0);

    const { theme,loginBrachId } = useTheme();
    const themed = getThemeStyles(theme);

    const searchOptions = [
        { id: '1', label: 'UHID', value: 'UHID' },
        { id: '2', label: 'Mobile', value: 'ContactNo' },
        { id: '3', label: 'Patient Name', value: 'PatientName' },
    ];

    const selectedSearchType =
        searchOptions.find(x => x.id === selectedId) || searchOptions[0];

    const {
        setCorporateId,
        setPatientData,
        setCenterLoginBranchId,
        loginBranchId,
        centerLoginBranchId,
        setAddBarcode,
    } = useAuth();


    useEffect(() => {
        setUhid('');
        setErrorMessage('');
        setPatientSearchList([]);
        setPatientSearchModal(false);
    }, [selectedId]);

    const filteredBranchList = useMemo(() => {
        if (!branchSearch?.trim()) return allBranchInfo;

        const searchValue = branchSearch.trim().toLowerCase();

        return allBranchInfo.filter(item => {
            const branchName = item?.branchName?.toLowerCase() || '';
            const branchCode = String(item?.branchCode || '').toLowerCase();

            return (
                branchName.includes(searchValue) || branchCode.includes(searchValue)
            );
        });
    }, [allBranchInfo, branchSearch]);

    

    

    

    const getPatientByUhid = async selectedUhid => {
        try {
            setLoading(true);

            const response = await api.get(
                `Patient/get-by-uhid?uhid=${encodeURIComponent(
                    selectedUhid,
                )}&branchId=${loginBranchId}`,
            );

            const patient = response?.data?.data;

            if (patient) {
                setPatientData(patient);
                setUhid(patient?.UHID || selectedUhid);
                setErrorMessage('');
            } else {
                setErrorMessage('Patient not found');
            }
        } catch (error) {
            console.log('get patient by uhid error', error);
            setErrorMessage(error?.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const searchPatientMaster = async () => {
        console.log('Searching patient with:', loginBrachId)
        try {
            if (!loginBranchId) {
                setErrorMessage('Branch not selected');
                return;
            }

            if (!uhid?.trim()) {
                setErrorMessage(`Please enter ${selectedSearchType.label}`);
                return;
            }

            setPatientSearchLoading(true);
            setErrorMessage('');
            setPatientSearchList([]);
            setPatientSearchModal(false);

            const response = await api.get(
                `Patient/search-patient-master?searchText=${encodeURIComponent(
                    uhid.trim(),
                )}&branchId=${loginBranchId}`,
            );

            const list = response?.data?.data || [];

            if (!Array.isArray(list) || list.length === 0) {
                setErrorMessage('No patient found');
                return;
            }

            if (list.length === 1) {
                const selectedUhid = list[0]?.UHID || '';

                if (!selectedUhid) {
                    setErrorMessage('UHID not found');
                    return;
                }

                setUhid(selectedUhid);
                await getPatientByUhid(selectedUhid);
                return;
            }

            setPatientSearchList(list);
            setPatientSearchModal(true);
        } catch (error) {
            console.log('search patient master error', error);
            setErrorMessage(error?.response?.data?.message || 'Something went wrong');
        } finally {
            setPatientSearchLoading(false);
        }
    };

    const handleSelectPatient = async patient => {
        setPatientSearchModal(false);
        setPatientSearchList([]);

        const selectedUhid = patient?.UHID || '';

        if (!selectedUhid) {
            setErrorMessage('UHID not found');
            return;
        }

        setUhid(selectedUhid);
        await getPatientByUhid(selectedUhid);
    };

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const handleSelectBranch = branch => {
        setSelectedItem(branch);
        setIsModalVisible(false);
        setBranchSearch('');
    };

    const handleAccordian = (index) => {
        setCurrentIndex(index)
        setAccordian(!accordian)
    }

    const handleCardPress = (item, index) => {
        const now = Date.now();

        if (now - lastPress < 300) {
            // Double click
            handleSelectPatient(item);
        } else {
            // Single click
            handleAccordian(index);
        }

        setLastPress(now);
    };
    const handleAccordiansClose = () => {
        setCurrentIndex(null)
        setAccordian(false)
    }

    const renderBranchItem = ({ item }) => {
        const isSelected = selectedItem?.branchId === item?.branchId;

        return (
            <TouchableOpacity
                onPress={() => handleSelectBranch(item)}
                activeOpacity={0.8}
                style={[
                    themed.globalCard,
                    themed.border,
                    tw`border rounded-xl px-4 py-3 mb-3`,
                    isSelected && { borderColor: '#3b82f6' },
                ]}>
                <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-1 pr-3`}>
                        <Text style={[themed.inputText, tw`font-medium`]}>
                            {item?.branchName}
                        </Text>
                    </View>

                    {isSelected ? (
                        <MaterialIcons name="check-circle" size={22} color="#3b82f6" />
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    const renderPatientItem = ({ item, index }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleSelectPatient(item)}
                style={[
                    themed.globalCard,
                    themed.border,
                    tw`border rounded-2xl p-4 mb-3`,
                ]}>
                <TouchableOpacity
                    onPress={() => handleCardPress(item, index)}
                    style={tw`flex-row justify-between items-start `}>
                    <View style={tw`flex-1 pr-3`}>
                        <Text
                            numberOfLines={1}
                            style={[themed.inputText, tw`text-base font-bold`]}>
                            {item?.PatientName || 'N/A'}
                        </Text>

                        <Text style={[themed.labelText, tw`text-xs mt-1`]}>
                            {item?.UHID || 'N/A'}
                        </Text>
                    </View>

                    <View style={tw`items-end`}>
                        <View style={tw`px-3 py-1 rounded-full bg-blue-100`}>
                            <Text style={tw`text-blue-700 text-[11px] font-bold`}>
                                {item?.Gender || 'N/A'}
                            </Text>
                        </View>

                        <Text style={[themed.inputText, tw`font-semibold mt-1 text-xs`]}>
                            {item?.RegistrationDate || 'N/A'}
                        </Text>
                    </View>
                </TouchableOpacity>
                {accordian && currentIndex == index && <View>
                    <View style={[themed.border, tw`border-t my-3`]} />
                    <View style={tw`flex-row justify-between`}>
                        <View style={tw`flex-1 items-center flex-row gap-2`}>
                            <FontAwesome name='mobile' size={20} color={themed.iconColor} />
                            <Text style={[themed.inputText, tw`font-semibold`]}>
                                {item?.ContactNumber || ''}
                            </Text>
                        </View>

                        <View style={tw`flex-1 items-center flex-row gap-2`}>
                            <FontAwesome name='calendar' size={16} color={themed.iconColor} />
                            <Text style={[themed.inputText, tw`font-semibold `]}>
                                {item?.Age || 'N/A'}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            tw`mt-3 p-3 rounded-xl`,
                            {
                                backgroundColor:
                                    theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                            },
                        ]}>
                        <Text style={[themed.labelText, tw`text-[11px] uppercase`]}>
                            Center
                        </Text>
                        <Text style={[themed.inputText, tw`font-medium mt-1`]}>
                            {item?.BranchName || 'N/A'}
                        </Text>
                    </View>

                    {!!item?.Address && (
                        <View style={tw`mt-3`}>
                            <Text style={[themed.labelText, tw`text-[11px] uppercase`]}>
                                Address
                            </Text>
                            <Text style={[themed.inputText, tw`mt-1 text-sm`]}>
                                {item?.Address}
                            </Text>
                        </View>
                    )}
                </View>}
            </TouchableOpacity>
        );
    };

    return (
        <View
            style={[themed.card, themed.cardPadding, themed.childScreen, tw`mb-4`]}>
            <TouchableOpacity
                onPress={() => setShowCenterInfo(!showCenterInfo)}
                style={tw`flex-row justify-between items-center mb-3`}>
                <Text style={styles.patientInfoText}>Center Information</Text>

                <Entypo
                    style={[tw`rounded-full p-1`, themed.modalCloseButton]}
                    name={showCenterInfo ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color={themed.chevronColor}
                />
            </TouchableOpacity>

            {showCenterInfo && (
                <>
                    

                    <View style={tw`my-3`}>
                        <Text style={[themed.labelText, tw`mb-2 font-bold`]}>
                            Search By
                        </Text>

                        <View style={tw`flex-row gap-2`}>
                            {searchOptions.map(item => {
                                const active = selectedId === item.id;

                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        activeOpacity={0.8}
                                        onPress={() => setSelectedId(item.id)}
                                        style={[
                                            tw`flex-row items-center px-3 py-2 rounded-full border`,
                                            {
                                                borderColor: active
                                                    ? '#3376ea'
                                                    : theme === 'dark'
                                                        ? '#475569'
                                                        : '#d1d5db',
                                                backgroundColor: active
                                                    ? theme === 'dark'
                                                        ? 'rgba(51,118,234,0.18)'
                                                        : '#eff6ff'
                                                    : 'transparent',
                                            },
                                        ]}>
                                        <View
                                            style={[
                                                tw`w-4 h-4 rounded-full border mr-2 items-center justify-center`,
                                                {
                                                    borderColor: active
                                                        ? '#3376ea'
                                                        : theme === 'dark'
                                                            ? '#cbd5e1'
                                                            : '#6b7280',
                                                },
                                            ]}>
                                            {active && (
                                                <View style={tw`w-2 h-2 rounded-full bg-blue-600`} />
                                            )}
                                        </View>

                                        <Text
                                            style={[
                                                tw`text-xs font-bold`,
                                                {
                                                    color: active
                                                        ? '#3376ea'
                                                        : theme === 'dark'
                                                            ? '#e5e7eb'
                                                            : '#111827',
                                                },
                                            ]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {!condition && (
                        <View style={tw`flex-row items-end gap-3 mt-1`}>
                            <View style={tw`flex-1`}>
                                <Text style={themed.inputLabel}>
                                    Enter {selectedSearchType.label}
                                </Text>

                                <View style={tw`relative`}>
                                    <TextInput
                                        value={uhid}
                                        onChangeText={setUhid}
                                        placeholder={`Search ${selectedSearchType.label}`}
                                        placeholderTextColor={themed.inputPlaceholder}
                                        keyboardType={
                                            selectedSearchType.value === 'ContactNo'
                                                ? 'number-pad'
                                                : 'default'
                                        }
                                        style={[themed.inputBox, themed.inputText, tw`h-12 pr-12`]}
                                        onSubmitEditing={searchPatientMaster}
                                        returnKeyType="search"
                                    />

                                    {uhid?.length > 0 && (
                                        <TouchableOpacity
                                            onPress={() => setUhid('')}
                                            style={tw`absolute right-3 top-3`}>
                                            <Feather
                                                name="x-circle"
                                                size={20}
                                                color={themed.inputPlaceholder}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={searchPatientMaster}
                                disabled={loading || patientSearchLoading || uhid.length === 0}
                                style={tw`
                  h-12 px-5 rounded-xl justify-center items-center
                  ${loading || patientSearchLoading || uhid.length === 0
                                        ? 'bg-blue-400'
                                        : 'bg-blue-500'
                                    }
                `}>
                                {loading || patientSearchLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={tw`text-white font-medium`}>Search</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {errorMessage ? (
                        <View style={tw`flex-row items-center mt-2`}>
                            <MaterialIcons name="error-outline" size={16} color="#ef4444" />
                            <Text style={tw`text-red-500 ml-1`}>{errorMessage}</Text>
                        </View>
                    ) : null}
                </>
            )}

            

            <Modal
                visible={patientSearchModal}
                transparent
                animationType="slide"
                onRequestClose={() => setPatientSearchModal(false)}>
                <TouchableWithoutFeedback onPress={() => setPatientSearchModal(false)}>
                    <View style={tw`flex-1 bg-black/50 justify-end`}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View
                                style={[
                                    themed.childScreen,
                                    themed.border,
                                    tw`rounded-t-3xl p-4 max-h-[80%]`,
                                ]}>
                                <View style={tw`flex-row justify-between items-center mb-3`}>
                                    <Text style={[themed.inputText, tw`text-lg font-semibold`]}>
                                        Select Patient
                                    </Text>

                                    <TouchableOpacity onPress={() => setPatientSearchModal(false)}>
                                        <MaterialIcons
                                            name="close"
                                            size={24}
                                            color={themed.chevronColor}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <FlatList
                                    data={patientSearchList}
                                    keyExtractor={(item, index) =>
                                        String(item?.PatientId || item?.UHID || index)
                                    }
                                    renderItem={renderPatientItem}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={tw`pb-6`}
                                    ListEmptyComponent={
                                        <Text style={[themed.labelText, tw`text-center mt-4`]}>
                                            No patient found
                                        </Text>
                                    }
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

export default CenterInfo;