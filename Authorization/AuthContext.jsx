import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkInfo } from 'react-native-network-info';

import { getDeviceInfo } from '../src/utils/deviceInfo';
import { logoutUser } from '../src/utils/logoutService/logout';
import { useCustomAlert } from '../src/hooks/useCustomAlert';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [fieldBoyData, setFieldBoyData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [fieldBoyId, setFieldBoyId] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ipAddress, setIpAddress] = useState(null);
  const [serviceItem, setServiceItem] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [corporateId, setCorporateId] = useState(null);
  const [loginBranchId, setLoginBranchId] = useState(null);
  const [hosId, setHosId] = useState(1);
  const [patientData, setPatientData] = useState(null);
  const [mainBranchId, setMainBranchId] = useState(1);
  const [allBranchInfo, setAllBranchInfo] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [centerLoginBranchId, setCenterLoginBranchId] = useState(null);
  const [addBarcode, setAddBarcode] = useState(false);
  const [barcodeScan, setBarcodeScan] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const { showCustomAlert, AlertComponent } = useCustomAlert();

  useEffect(() => {
    loadStoredData();
    getBranchInfo();
    getLocalIP();
  }, []);

  const triggerUpdate = () => {
    setUpdateFlag(prev => prev + 1);
  };

  const getLocalIP = async () => {
    try {
      const ip = await NetworkInfo.getIPV4Address();
      setIpAddress(ip || '0.0.0.0');
      return ip || '0.0.0.0';
    } catch (error) {
      console.log('Local IP error:', error);
      setIpAddress('0.0.0.0');
      return '0.0.0.0';
    }
  };



  const getBranchInfo = async () => {
    try {
      const data = await AsyncStorage.getItem('AllBranch');

      if (data) {
        const parsedData = JSON.parse(data);
        setAllBranchInfo(parsedData);
      }
    } catch (error) {
      console.log('Error reading branches:', error);
    }
  };

  const loadStoredData = async () => {
    try {
      const storedFieldBoyToken =
        await AsyncStorage.getItem('fieldBoyToken');

      const storedFieldBoyData =
        await AsyncStorage.getItem('fieldBoyData');

      const storedLoginBranchId =
        await AsyncStorage.getItem('loginBranchId');

      const parsedFieldBoyData = storedFieldBoyData
        ? JSON.parse(storedFieldBoyData)
        : null;

      console.log('Parsed Field Boy Data:', parsedFieldBoyData,);
      setToken(storedFieldBoyToken);
      setFieldBoyData(parsedFieldBoyData);
      setUserData(parsedFieldBoyData);
      setFieldBoyId(parsedFieldBoyData?.fieldBoyId);
      setLoginBranchId(
        storedLoginBranchId
          ? JSON.parse(storedLoginBranchId)
          : parsedFieldBoyData?.loginBranchId,
      );

    } catch (error) {
      console.log('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };





  const clearAuthState = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userInfo');
    await AsyncStorage.removeItem('fieldBoyToken');
    await AsyncStorage.removeItem('fieldBoyData');

    setToken(null);
    setLoginType(null);
    setUser(null);
    setUserData(null);
    setFieldBoyData(null);
    setUserId(null);
    setFieldBoyId(null);
    setCorporateId(null);
    setSessionId(null);
    setAllBranchInfo([]);
    setLoginBranchId(null);
    setCenterLoginBranchId(null);
  };

  const logout = () => {
    showCustomAlert({
      title: 'Logout Confirmation',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          await clearAuthState();
        } catch (error) {
          console.log('Error during logout:', error);

          showCustomAlert({
            title: 'Logout Failed',
            message: 'An error occurred while logging out. Please try again.',
            confirmText: 'OK',
            cancelText: null,
            type: 'error',
          });
        }
      },
    });
  };

  return (
    <>
      <AuthContext.Provider
        value={{
          userData,
          setUserData,
          fieldBoyData,
          setFieldBoyData,
          fieldBoyId,
          setFieldBoyId,
          isLoading,
          logout,

          token,
          setToken,

          userId,
          setUserId,

          ipAddress,

          serviceItem,
          setServiceItem,

          selectedDoctor,
          setSelectedDoctor,

          corporateId,
          setCorporateId,

          loginBranchId,
          setLoginBranchId,
          patientData, setPatientData,
          hosId,
          setHosId,

          addBarcode,
          setAddBarcode,

          barcodeScan,
          setBarcodeScan,

          latitude,
          setLatitude,

          longitude,
          setLongitude,
        }}>
        {children}
      </AuthContext.Provider>

      <AlertComponent />
    </>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};