import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import tw from 'twrnc';
import styles from '../../../utils/InputStyle';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../../Authorization/api';
import { useAuth } from '../../../../Authorization/AuthContext';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';

const CenterInfo = ({ condition }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [uhid, setUhid] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCenterInfo, setShowCenterInfo] = useState(false);
    const [branchSearch, setBranchSearch] = useState('');
    const [ratePannel, setRatePannel] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    const { theme } = useTheme();
    const themed = getThemeStyles(theme);

    const {
        setCorporateId,
        setPatientData,
        loginBranchId,
    } = useAuth();

    console.log("login branch id", loginBranchId)

    const getrateListPanel = async branchId => {
        try {
            if (!branchId) {
                return;
            }
            const response = await api.get(`Rate/rate-list/${branchId}`);
            console.log('Rate List Panel:', response?.data);
            setCorporateId(response?.data[0].CorporateId|| null);
        } catch (error) {
            console.log(
                'getrateListPanel error:',
                error?.response?.data || error?.message,
            );
            setCorporateId(null);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (loginBranchId) {
                getrateListPanel(loginBranchId);

            } else { return null; }
            return () => {
            };
        }, [loginBranchId]),
    );

    const searchGetPatientByUhid = async () => {
        try {
            if (!loginBranchId) {
                setErrorMessage('Branch not selected');
                return;
            }

            if (!uhid.trim()) {
                setErrorMessage('Please enter UHID');
                return;
            }

            setLoading(true);

            const response = await api.get(
                `Patient/get-by-uhid?uhid=${uhid.trim()}&branchId=${loginBranchId}`,
            );

            const patient = response?.data?.data;

            if (patient) {
                setPatientData(patient);
                setUhid(patient.UHID || uhid);
                setErrorMessage('');
            } else {
                setErrorMessage('Patient not found');
            }
        } catch (error) {
            setErrorMessage(
                error?.response?.data?.message || 'Something went wrong',
            );
        } finally {
            setLoading(false);
        }
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

    return (
        <View style={[themed.card, themed.cardPadding, themed.childScreen, tw`mb-4`]}>
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
                    {selectedItem ? (
                        <View style={[themed.globalCard, themed.border, tw`p-3 rounded-xl mb-3`]}>
                            <Text style={themed.inputLabel}>Selected Center</Text>
                            <Text style={[themed.inputText, tw`font-semibold mt-1`]}>
                                {selectedItem?.BranchName ||
                                    selectedItem?.branchName ||
                                    selectedItem?.Name ||
                                    'Selected'}
                            </Text>
                        </View>
                    ) : null}

                    {!condition && (
                        <View style={tw`flex-row items-end gap-3 mt-3`}>
                            <View style={tw`flex-1`}>
                                <Text style={themed.inputLabel}>Enter UHID</Text>
                                <TextInput
                                    value={uhid}
                                    onChangeText={setUhid}
                                    placeholder="Search UHID"
                                    placeholderTextColor={themed.inputPlaceholder}
                                    style={[themed.inputBox, themed.inputText, tw`h-12`]}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={searchGetPatientByUhid}
                                disabled={loading || uhid.trim().length === 0}
                                style={tw`
                  h-12 px-5 rounded-xl justify-center items-center
                  ${loading || uhid.trim().length === 0 ? 'bg-blue-400' : 'bg-blue-500'}
                `}>
                                {loading ? (
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
                visible={isModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setIsModalVisible(false);
                    setBranchSearch('');
                }}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        setIsModalVisible(false);
                        setBranchSearch('');
                    }}>
                    <View style={tw`flex-1 bg-black/50 justify-end`}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View
                                style={[
                                    themed.childScreen,
                                    themed.border,
                                    tw`rounded-t-3xl p-4 max-h-[85%]`,
                                ]}>
                                <View style={tw`flex-row justify-between items-center mb-3`}>
                                    <Text style={[themed.inputText, tw`text-lg font-semibold`]}>
                                        Select Center
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsModalVisible(false);
                                            setBranchSearch('');
                                        }}>
                                        <MaterialIcons
                                            name="close"
                                            size={24}
                                            color={themed.chevronColor}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View
                                    style={[
                                        themed.globalCard,
                                        themed.border,
                                        tw`flex-row items-center px-4 py-3 rounded-xl border mb-3`,
                                    ]}>
                                    <Icon name="search" size={18} color={themed.chevronColor} />

                                    <TextInput
                                        value={branchSearch}
                                        onChangeText={setBranchSearch}
                                        placeholder="Search center..."
                                        placeholderTextColor={themed.inputPlaceholder}
                                        style={[tw`flex-1 ml-3 py-1`, themed.inputText]}
                                    />

                                    {branchSearch ? (
                                        <TouchableOpacity onPress={() => setBranchSearch('')}>
                                            <MaterialIcons
                                                name="close"
                                                size={20}
                                                color={themed.chevronColor}
                                            />
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

export default CenterInfo;