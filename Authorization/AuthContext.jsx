// context/AuthContext.js (Updated)
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceInfo } from '../src/utils/deviceInfo';
import { logoutUser } from '../src/utils/logoutService/logout';
import { NetworkInfo } from 'react-native-network-info';
import { useCustomAlert } from '../src/hooks/useCustomAlert'; // Import the hook

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [ipAddress, setIpAddress] = useState(null);
  const [serviceItem, setServiceItem] = useState(null)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [corporateId, setCorporateId] = useState(null)
  const [loginBranchId, setLoginBranchId] = useState(null)
  const [hosId, setHosId] = useState(1)
  const [patientData, setPatientData] = useState(null)
  const [userId, setUserId] = useState(null)
  const [mainBranchId, setMainBranchId] = useState(1)
  const [allBranchInfo, setAllBranchInfo] = useState([])
  const [deviceData, setDeviceData] = useState(null);
  const [sessionId, setSessionId] = useState(null)
  const [centerLoginBranchId, setCenterLoginBranchId] = useState(null)
  const [updateFlag, setUpdateFlag] = useState(0);
  const [addBarcode, setAddBarcode] = useState(false)
  const [barcodeScan,setBarcodeScan] = useState(null)
  const [latitude,setLatitude] = useState(null)
  const [longitude,setLongitude] = useState(null)

  // Initialize custom alert hook
  const { showCustomAlert, AlertComponent } = useCustomAlert();

  const triggerUpdate = () => {
    setUpdateFlag(prev => prev + 1);
  };

  // Load stored auth data on app startup
  useEffect(() => {
    loadStoredData();
    getBranchInfo()
    loadDeviceInfo();
    getLocalIP();
  }, []);

  console.log("corpoteid", corporateId)

  const getLocalIP = async () => {
    try {
      const ip = await NetworkInfo.getIPV4Address();
      console.log('Local IP:', ip);
      setIpAddress(ip || '0.0.0.0');
      return ip || '0.0.0.0';
    } catch (error) {
      console.log('Local IP error:', error);
      return '0.0.0.0';
    }
  };

  const loadDeviceInfo = async () => {
    const info = await getDeviceInfo();
    setDeviceData(info);
  };

  const getBranchInfo = async () => {
    try {
      const data = await AsyncStorage.getItem('AllBranch');
      if (data) {
        const parsedData = JSON.parse(data);
        setAllBranchInfo(parsedData);
        if (parsedData.length > 0) {
          const defaultBranch = parsedData[0];
        }
      }
    } catch (error) {
      console.log("Error reading branches", error);
    }
  };

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUserInfo) {
        const parsedUser = JSON.parse(storedUserInfo);
        console.log("login dta:", parsedUser)
        setLoginBranchId(parsedUser?.branchId)
        setUser(parsedUser);
        setUserData(parsedUser?.user);
        setUserId(parsedUser?.user?.id)
        setSessionId(parsedUser?.sessionId)
      }
    } catch (error) {
      console.log('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token, userInfo) => {
    try {
      console.log("token", token)
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      setToken(token);
      setUserData(userInfo);
      setUser(userInfo);
      return true;
    } catch (error) {
      console.log('Error saving auth data:', error);
      return false;
    }
  };
console.log(corporateId)
  const logout = () => {
    showCustomAlert({
      title: "Logout Confirmation",
      message: "Are you sure you want to logout? You will need to login again to access your account.",
      confirmText: "Logout",
      cancelText: "Cancel",
      type: "warning",
      onCancel: () => {
        console.log('Logout Cancelled');
      },
      onConfirm: async () => {
        try {
          // Show loading indicator if needed
          console.log('Logging out...');
          
          // Clear AsyncStorage
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('userInfo');
          
          // Call logout API if sessionId exists
          if (sessionId) {
            await logoutUser(sessionId);
          }
          
          // Clear all states
          setToken(null);
          setUserData({});
          setUser(null);
          setUserId(null);
          setCorporateId(null);
          setSessionId(null);
          setAllBranchInfo(null);
          setLoginBranchId(null);
          setCenterLoginBranchId(null);
          
          console.log('User Logged Out Successfully');
        } catch (error) {
          console.log('Error during logout:', error);
          
          // Show error alert if logout fails
          showCustomAlert({
            title: "Logout Failed",
            message: "An error occurred while logging out. Please try again.",
            confirmText: "OK",
            cancelText: null,
            type: "error",
          });
        }
      },
    });
  };

  return (
    <>
      <AuthContext.Provider
        value={{
          triggerUpdate, updateFlag,
          user, userData,
          isLoading, login,
          logout,
          token,
          setToken,
          setUserData,
          ipAddress,
          serviceItem, setServiceItem,
          selectedDoctor, setSelectedDoctor,
          corporateId, setCorporateId,
          patientData, setPatientData,
          userId, setUserId,
          mainBranchId, setMainBranchId,
          loginBranchId, setLoginBranchId,
          allBranchInfo, setAllBranchInfo,
          deviceData, setDeviceData, loadDeviceInfo,
          sessionId, setSessionId,
          centerLoginBranchId, setCenterLoginBranchId,
          hosId, setHosId,
          addBarcode, setAddBarcode,
          barcodeScan,setBarcodeScan,
          latitude,setLatitude,
          longitude,setLongitude
        }}
      >
        {children}
      </AuthContext.Provider>
      {/* Render the AlertComponent here */}
      <AlertComponent />
    </>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
