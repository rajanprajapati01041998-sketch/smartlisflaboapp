import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ImageBackground,
    Keyboard,
    TouchableWithoutFeedback,
    Image,
    Modal,
    FlatList,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import logo from '../Assets/Login/login_logo.jpg';
import api from '../Authorization/api';
import { useToast } from '../Authorization/ToastContext';
import { useAuth } from '../Authorization/AuthContext';
import { useTheme } from '../Authorization/ThemeContext';
import { getThemeStyles } from './utils/themeStyles';

const Login = () => {
    const { showToast } = useToast();

    const {
        setToken,
        setUserData,
        setUserId,
        setFieldBoyId,
        setLoginBranchId,
    } = useAuth();

    const [userIdApp, setUserIdApp] = useState('');
    const [passwordApp, setPasswordApp] = useState('');

    const [loading, setLoading] = useState(false);
    const [branchLoading, setBranchLoading] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const [branchModalVisible, setBranchModalVisible] = useState(false);
    const [branches, setBranches] = useState([]);
    const [branchSearch, setBranchSearch] = useState('');

    const { theme, colors } = useTheme();
    const themed = getThemeStyles(theme);

    const filteredBranches = useMemo(() => {
        const search = branchSearch.trim().toLowerCase();

        if (!search) {
            return branches;
        }

        return branches.filter(item => {
            return (
                String(item.branchName || '').toLowerCase().includes(search) ||
                String(item.branchCode || '').toLowerCase().includes(search) ||
                String(item.fullBranchName || '').toLowerCase().includes(search) ||
                String(item.branchId || '').includes(search)
            );
        });
    }, [branches, branchSearch]);

    const getBranchList = async () => {
        if (!userIdApp.trim()) {
            showToast('Enter User ID', 'warning');
            return;
        }

        if (!passwordApp.trim()) {
            showToast('Enter Password', 'warning');
            return;
        }

        try {
            setLoading(true);
            setBranchLoading(true);

            const payload = {
                userIdApp: userIdApp.trim(),
                passwordApp: passwordApp.trim(),
            };

            console.log('Branch List Payload:', payload);

            const response = await api.post(
                'FlaboLogin/fieldBoyBranchList',
                payload,
            );

            console.log('Branch List Response:', response.data);

            if (response.data?.success) {
                const list = Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

                setBranches(list);
                setBranchSearch('');

                if (list.length === 1) {
                    await handleBranchSelect(list[0]);
                } else {
                    setBranchModalVisible(true);
                }
            } else {
                showToast(
                    response.data?.message || 'Invalid User ID or Password',
                    'error',
                );
            }
        } catch (error) {
            console.log(
                'Branch List Error:',
                error?.response?.data || error?.message,
            );

            showToast(
                error?.response?.data?.message || 'Unable to fetch branch list',
                'error',
            );
        } finally {
            setLoading(false);
            setBranchLoading(false);
        }
    };

    const handleBranchSelect = async branch => {
        if (!branch?.branchId) {
            showToast('Invalid branch selected', 'error');
            return;
        }

        try {
            setLoginLoading(true);

            const payload = {
                userIdApp: userIdApp.trim(),
                passwordApp: passwordApp.trim(),
                branchId: Number(branch.branchId),
            };

            console.log('Field Boy Login Payload:', payload);
            const response = await api.post(
                'FlaboLogin/fieldBoyLogin',
                payload,
            );

            console.log('Field Boy Login Response:', response?.data?.data?.loginBranchId);

            if (response.data?.success) {
                const token = response.data?.token;
                const data = response.data?.data;
                const branchId = response?.data?.data?.loginBranchId
                setLoginBranchId(branchId)
                setToken(token);
                await AsyncStorage.setItem('fieldBoyToken', token);
                await AsyncStorage.setItem('fieldBoyData', JSON.stringify(data));
                setBranchModalVisible(false);
                showToast('Login Successful', 'success');
            } else {
                showToast(response.data?.message || 'Login Failed', 'error', );
            }
        } catch (error) {
            console.log(  'Field Boy Login Error:',
                error?.response?.data || error?.message,
            );
            showToast( error?.response?.data?.message || 'Invalid login or branch not mapped', 'error', );
        } finally {
            setLoginLoading(false);
        }
    };

    const renderBranchModal = () => {
        return (
            <Modal
                visible={branchModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setBranchModalVisible(false)}>
                <TouchableWithoutFeedback
                    onPress={() => setBranchModalVisible(false)}>
                    <View style={tw`flex-1 bg-black/50 justify-end`}>
                        <TouchableWithoutFeedback>
                            <View style={tw`bg-white rounded-t-3xl p-4 max-h-[78%]`}>
                                <View style={tw`items-center mb-3`}>
                                    <View style={tw`w-12 h-1 bg-gray-300 rounded-full mb-3`} />
                                </View>

                                <View style={tw`flex-row justify-between items-center mb-3`}>
                                    <View>
                                        <Text style={tw`text-black text-lg font-bold`}>
                                            Select Branch
                                        </Text>
                                        <Text style={tw`text-gray-500 text-xs mt-1`}>
                                            {branches.length} branch available
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setBranchModalVisible(false)}
                                        style={tw`h-9 w-9 rounded-full bg-gray-100 items-center justify-center`}>
                                        <Ionicons name="close" size={22} color="#111827" />
                                    </TouchableOpacity>
                                </View>

                                <View
                                    style={tw`flex-row items-center bg-gray-100 rounded-xl px-3 mb-3`}>
                                    <Ionicons name="search" size={18} color="#6B7280" />

                                    <TextInput
                                        value={branchSearch}
                                        onChangeText={setBranchSearch}
                                        placeholder="Search branch..."
                                        placeholderTextColor="#9CA3AF"
                                        style={tw`flex-1 px-2 py-3 text-black`}
                                    />

                                    {branchSearch ? (
                                        <TouchableOpacity onPress={() => setBranchSearch('')}>
                                            <Ionicons
                                                name="close-circle"
                                                size={18}
                                                color="#9CA3AF"
                                            />
                                        </TouchableOpacity>
                                    ) : null}
                                </View>

                                {loginLoading ? (
                                    <View style={tw`py-10 items-center justify-center`}>
                                        <ActivityIndicator color="#174B3F" />
                                        <Text style={tw`text-gray-500 mt-3`}>
                                            Logging in...
                                        </Text>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={filteredBranches}
                                        keyExtractor={(item, index) =>
                                            `${item.branchId}-${index}`
                                        }
                                        showsVerticalScrollIndicator={false}
                                        keyboardShouldPersistTaps="handled"
                                        ListEmptyComponent={
                                            <View style={tw`py-12 items-center justify-center`}>
                                                <MaterialIcons
                                                    name="business"
                                                    size={48}
                                                    color="#D1D5DB"
                                                />
                                                <Text style={tw`text-gray-400 mt-3`}>
                                                    No branch found
                                                </Text>
                                            </View>
                                        }
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onPress={() => handleBranchSelect(item)}
                                                activeOpacity={0.75}
                                                style={tw`flex-row items-center p-4 mb-2 rounded-2xl bg-gray-50 border border-gray-200`}>
                                                <View
                                                    style={tw`h-11 w-11 rounded-full bg-green-100 items-center justify-center mr-3`}>
                                                    <MaterialIcons
                                                        name="business"
                                                        size={22}
                                                        color="#174B3F"
                                                    />
                                                </View>

                                                <View style={tw`flex-1`}>
                                                    <Text
                                                        numberOfLines={1}
                                                        style={tw`text-black font-bold text-sm`}>
                                                        {item.fullBranchName || item.branchName}
                                                    </Text>

                                                    <Text style={tw`text-gray-500 text-xs mt-1`}>
                                                        Branch ID: {item.branchId}
                                                    </Text>
                                                </View>

                                                <MaterialIcons
                                                    name="chevron-right"
                                                    size={26}
                                                    color="#9CA3AF"
                                                />
                                            </TouchableOpacity>
                                        )}
                                    />
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={tw`flex-1 bg-white`}>
                <StatusBar barStyle="light-content" backgroundColor="#174B3F" />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={tw`flex-1`}>
                    <View style={tw`h-[42%] rounded-b-[45px] overflow-hidden`}>
                        <ImageBackground
                            source={logo}
                            resizeMode="cover"
                            style={tw`flex-1 h-45 `}>
                            <LinearGradient
                                colors={[
                                    'rgba(10,70,55,0.90)',
                                    'rgba(10,70,55,0.82)',
                                ]}
                                style={tw`flex-1 justify-center items-center px-6`}>
                                <View
                                    style={tw`h-28 w-28 rounded-full bg-white items-center justify-center shadow-lg overflow-hidden`}>
                                    <Image
                                        source={logo}
                                        resizeMode="contain"
                                        style={tw`h-26 w-26`}
                                    />
                                </View>

                                <Text style={tw`text-white text-3xl font-extrabold mt-5`}>
                                    Welcome Back!
                                </Text>

                                <Text style={tw`text-white/80 mt-2 text-center`}>
                                    Select your branch and continue
                                </Text>
                            </LinearGradient>
                        </ImageBackground>
                    </View>

                    <View
                        style={tw`flex-1 bg-white -mt-10 rounded-t-[45px] px-7 pt-10`}>
                        <Text style={tw`text-gray-500 text-sm mb-1`}>User ID</Text>

                        <TextInput
                            value={userIdApp}
                            onChangeText={setUserIdApp}
                            placeholder="Enter User ID"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="none"
                            style={tw`text-black text-lg font-bold border-b border-yellow-400 pb-3 mb-8`}
                        />

                        <Text style={tw`text-gray-500 text-sm mb-1`}>Password</Text>

                        <View
                            style={tw`flex-row items-center border-b border-gray-200 mb-5`}>
                            <TextInput
                                value={passwordApp}
                                onChangeText={setPasswordApp}
                                secureTextEntry={!showPassword}
                                placeholder="Enter Password"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="none"
                                style={tw`flex-1 text-black text-base pb-3`}
                            />

                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>



                        <TouchableOpacity
                            onPress={getBranchList}
                            disabled={loading || branchLoading}
                            activeOpacity={0.85}
                            style={[themed.loginBtn]}>
                            {loading || branchLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text
                                    style={tw`text-white text-center font-extrabold text-base tracking-widest`}>
                                    CONTINUE
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={tw`items-center mt-10`}>
                            <Text style={tw`text-gray-500`}>
                                Gravity Web Technologies
                            </Text>
                            <Text style={tw`text-gray-400 text-xs mt-1`}>
                                Version 1.0.0
                            </Text>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                {renderBranchModal()}
            </View>
        </TouchableWithoutFeedback>
    );
};

export default Login;