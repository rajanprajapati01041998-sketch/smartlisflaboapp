import {
  PermissionsAndroid,
  Easing,
  LayoutAnimation,
  UIManager,
  Platform,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import tw from 'twrnc';
import api, { API_BASE_URL } from '../../../../Authorization/api';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import QRCode from 'react-native-qrcode-svg';
import Svg from 'react-native-svg';
import Barcode from '@kichiyaki/react-native-barcode-generator';
import Entypo from 'react-native-vector-icons/Entypo';
import styles from '../../../utils/InputStyle';
import RNFetchBlob from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { useToast } from '../../../../Authorization/ToastContext';
import { useAuth } from '../../../../Authorization/AuthContext';
import { dashboardWallet } from '../../../utils/dashboardService/dashboard';
import { useDash } from '../../../../Authorization/DashContext';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';
import CheckBox from '@react-native-community/checkbox';
import { formatBillDateTime } from '../../../utils/dateUtils';


const { width } = Dimensions.get('window');

const ListHelpDeskPatient = () => {
  const isFlagTrue = (value) => value === true || value === 1 || value === '1' || value === 'true' || value === 'Y';

  const route = useRoute();
  const navigation = useNavigation();
  const [showFilter, setShowFilter] = useState(false);
  const payload = route?.params?.payload || null;
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [showStatusLegend, setShowStatusLegend] = useState(false);
  const { showToast } = useToast();
  const [downloadingId, setDownloadingId] = useState(null);
  const { loginBranchId, userId, mainBranchId } = useAuth();
  const filterSlideAnim = useRef(new Animated.Value(1)).current;
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [openItemIndex, setOpenItemIndex] = useState(null);
  const animationRefs = useRef({});
  const { walletData } = useDash();
  const [isPrintHeader, setIsPrintHeader] = useState(true)
  const [loginHeader, setLoginHeader] = useState(true)
  const [mainHeader, setMainHeader] = useState(false)
  const [pickingSample, setPickingSample] = useState(false)
  const [deliveringSample, setDeliveringSample] = useState(false)

  const { theme } = useTheme();
  const themed = getThemeStyles(theme);

  useEffect(() => {
    const scanned = route?.params?.scannedBarcode;
    if (!scanned) return;
    setSearchText(String(scanned));
    navigation.setParams({ scannedBarcode: undefined });
  }, [navigation, route?.params?.scannedBarcode]);

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      return false;
    }
  };

  const openFilterModal = () => {
    setFilterModal(true);
    filterSlideAnim.setValue(1);

    Animated.timing(filterSlideAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterModal = () => {
    Animated.timing(filterSlideAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setFilterModal(false);
    });
  };

  const onPressScan = async () => {
    const ok = await requestCameraPermission();

    if (!ok) {
      Alert.alert(
        'Camera permission',
        'Please allow camera permission to scan barcode.'
      );
      return;
    }

    navigation.navigate('BarcodeScanner', {
      onScanSuccess: (code) => {
        console.log('Scanned barcode:', code);
        setSearchText(String(code));
      },
    });
  };

  const statusLegend = [
    { key: 'sample_pending', label: 'Sample Collection Pending', color: '#ef4444', bg: '#fee2e2', condition: (item) => !item.IsSampleCollected && !item.IsResultDone },
    { key: 'sample_collected', label: 'Sample Collected', color: '#3b82f6', bg: '#dbeafe', condition: (item) => item.IsSampleCollected === 1 && !item.IsResultDone },
    { key: 'department_received', label: 'Department Received', color: '#8b5cf6', bg: '#ede9fe', condition: (item) => item.IsSampleReceivedByDepartment === 1 },
    { key: 'abnormal', label: 'Abnormal', color: '#f97316', bg: '#ffedd5', condition: (item) => item.IsAbnormalResult === 1 },
    { key: 'hold', label: 'Hold', color: '#6b7280', bg: '#f3f4f6', condition: (item) => item.IsReportHold === 1 },
    { key: 'report_pending', label: 'Report Approval Pending', color: '#f59e0b', bg: '#fed7aa', condition: (item) => item.IsResultDone === 1 && item.IsReportApproved !== 1 },
    { key: 'approved', label: 'Approved', color: '#10b981', bg: '#d1fae5', condition: (item) => item.IsReportApproved === 1 && item.IsDispatched !== 1 },
    { key: 'dispatched', label: 'Dispatched', color: '#06b6d4', bg: '#cffafe', condition: (item) => item.IsDispatched === 1 },
    { key: 'urgent', label: 'Urgent', color: '#dc2626', bg: '#fee2e2', condition: (item) => item.isUrgent === 1 }
  ];

  const handleLoginHeader = (value) => {
    const newValue = !loginHeader // toggle manually
    setLoginHeader(newValue)
    if (newValue) setMainHeader(false)
  }



  const handleMainHeader = () => {
    const newValue = !mainHeader
    setMainHeader(newValue)
    if (newValue) setLoginHeader(false)
  }

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const gethelpDesk = async () => {
    console.log('help payload', payload);
    try {
      setLoading(true);
      const response = await api.post(`HelpDesk/flabo_help_desk`, payload);
      const responseData = response?.data?.data || response?.data || [];
      setData(responseData);
      setFilteredData(responseData);
    } catch (error) {
      console.log('ERROR RESPONSE >>>', error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (openItemIndex === index) {
      setOpenItemIndex(null);
    } else {
      setOpenItemIndex(index);
    }
  };

  const getAnimationValue = (index) => {
    if (!animationRefs.current[index]) {
      animationRefs.current[index] = {
        rotateAnim: new Animated.Value(openItemIndex === index ? 1 : 0)
      };
    }
    return animationRefs.current[index];
  };

  useEffect(() => {
    Object.keys(animationRefs.current).forEach((key) => {
      const index = parseInt(key);
      const animValue = animationRefs.current[index];
      if (animValue) {
        Animated.timing(animValue.rotateAnim, {
          toValue: openItemIndex === index ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }).start();
      }
    });
  }, [openItemIndex]);

  const getChevronRotation = (index) => {
    const animValue = animationRefs.current[index];
    if (animValue) {
      return animValue.rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
      });
    }
    return '0deg';
  };

  useEffect(() => {
    if (payload) {
      gethelpDesk();
    }
  }, [payload]);

  useEffect(() => {
    applyFilters();
  }, [searchText, selectedStatus, selectedType, data]);

  const applyFilters = () => {
    let filtered = [...data];

    if (searchText) {
      filtered = filtered.filter(item =>
        item.PatientName?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.UHID?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.Name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.Barcode?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => {
        if (selectedStatus === 'sample_pending') return !item.IsSampleCollected && !item.IsResultDone;
        if (selectedStatus === 'sample_collected') return item.IsSampleCollected === 1 && !item.IsResultDone;
        if (selectedStatus === 'department_received') return item.IsSampleReceivedByDepartment === 1;
        if (selectedStatus === 'abnormal') return item.IsAbnormalResult === 1;
        if (selectedStatus === 'hold') return item.IsReportHold === 1;
        if (selectedStatus === 'report_pending') return item.IsResultDone === 1 && item.IsReportApproved !== 1;
        if (selectedStatus === 'approved') return item.IsReportApproved === 1 && item.IsDispatched !== 1;
        if (selectedStatus === 'dispatched') return item.IsDispatched === 1;
        if (selectedStatus === 'urgent') return item.isUrgent === 1;
        return true;
      });
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.Type === selectedType);
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedStatus('all');
    setSelectedType('all');
    setFilterModal(false);
  };

  const getglobalCardColor = (item) => {
    if (item.isUrgent === 1) return { bg: '#fee2e2', border: '#dc2626' };
    if (item.IsDispatched === 1) return { bg: '#cffafe', border: '#06b6d4' };
    if (item.IsReportApproved === 1) return { bg: '#d1fae5', border: '#10b981' };
    if (item.IsResultDone === 1 && item.IsReportApproved !== 1) return { bg: '#fed7aa', border: '#f59e0b' };
    if (item.IsReportHold === 1) return { bg: '#f3f4f6', border: '#6b7280' };
    if (item.IsAbnormalResult === 1) return { bg: '#ffedd5', border: '#f97316' };
    if (item.IsSampleReceivedByDepartment === 1) return { bg: '#ede9fe', border: '#8b5cf6' };
    if (item.IsSampleCollected === 1) return { bg: '#dbeafe', border: '#3b82f6' };
    return { bg: '#fee2e2', border: '#ef4444' };
  };

  const getDetailedStatus = (item) => {
    if (item.isUrgent === 1) return 'URGENT';
    if (item.IsDispatched === 1) return 'Dispatched';
    if (item.IsReportApproved === 1) return 'Report Approved';
    if (item.IsResultDone === 1 && item.IsReportApproved !== 1) return 'Report Approval Pending';
    if (item.IsReportHold === 1) return 'Hold';
    if (item.IsAbnormalResult === 1) return 'Abnormal';
    if (item.IsSampleReceivedByDepartment === 1) return 'Department Received';
    if (item.IsSampleCollected === 1) return 'Sample Collected';
    return 'Sample Collection Pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      let date;

      if (dateString.includes('-') && !dateString.includes(' ')) {
        const [day, month, year] = dateString.split('-');
        const monthMap = {
          Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
          Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };
        date = new Date(parseInt(year), monthMap[month], parseInt(day));
      } else if (dateString.includes(' ')) {
        const parts = dateString.split(' ');
        if (parts.length >= 4) {
          const month = parts[0];
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          const timeStr = parts[3];

          let hours = 0;
          let minutes = 0;
          const timeMatch = timeStr.match(/(\d+):?(\d*)([AP]M)/i);
          if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            minutes = parseInt(timeMatch[2]) || 0;
            const isPM = timeMatch[3].toUpperCase() === 'PM';
            if (isPM && hours !== 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
          }

          const monthMap = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
          };
          date = new Date(year, monthMap[month], day, hours, minutes);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) return dateString;

      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;

      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      if (dateString.includes('-') && !dateString.includes(' ')) {
        const [day, month, year] = dateString.split('-');
        return `${day} ${month} ${year}`;
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();

      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  const handleDownloadReport = async (id, name, reporTypeId) => {
    console.log("report Id", reporTypeId)
    if (reporTypeId === 2) {
      try {
        console.log('Free text report with ID:', id, 'and name:', name, 'reporTypeId', reporTypeId);
        setDownloadingId(id);
        const { config, fs } = RNFetchBlob;
        const path = `${fs.dirs.DownloadDir}/report-${id}/${name}.pdf`;

        await config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            path,
            description: 'Downloading report...',
          },
        }).fetch(
          'GET',
          `${API_BASE_URL}ReportPrint/DownloadCombinedReport?ptInvstId=${id}&isHeaderPNG=0&printBy=1&branchId=${loginBranchId}`
        );

        showToast('File downloaded', 'success');
      } catch (error) {
        console.error('Download failed', error);
      } finally {
        setDownloadingId(null);
      }
    } else {
      handleDownloadTebularReport(id, name, reporTypeId);
    }
  };


  const handleUpdatetatusDelivered = async (item) => {
    setDeliveringSample(true)
    if (isFlagTrue(item?.SampleDelivered)) {
      showToast('Sample already delivered', 'warning');
      setDeliveringSample(false)
      return;
    }
    try {
      const response = await api.post(`FlaboDashBoard/update-sample-status`, {
        id: item?.PatientSampleTrackingId,
        sampleDelivered: true
      })
      setDeliveringSample(false);
      showToast('Status updated to Sample Delivered', 'success');
      await gethelpDesk();
    } catch (error) {
      setDeliveringSample(false);
      showToast('Failed to update status', 'error');
      console.log('Update status error:', error?.response?.data || error?.message);
    }
  }
  const handleUpdatetatusPicked = async (item) => {
    console.log('Updating status for ID:', item?.PatientSampleTrackingId);
    if (isFlagTrue(item?.SamplePickup)) {
      showToast('Sample already picked', 'warning');
      return;
    }
    setPickingSample(true)
    try {
      console.log('Sending update request for ID:', item?.PatientSampleTrackingId);
      const response = await api.post(`FlaboDashBoard/update-sample-status`, {
        id: item?.PatientSampleTrackingId,
        samplePickup: true
      })
      setPickingSample(false);
      showToast('Status updated to Sample Picked', 'success');
      await gethelpDesk();
      navigation.navigate('FlaboShareLiveLocation', { id:item?.PatientSampleTrackingId });
    } catch (error) {
      setPickingSample(false);
      showToast('Failed to update status', 'error');
      console.log('Update status error:', error?.response?.data || error?.message);
    }
    // Alert.alert('ID', String(id));
  };

  const handleDownloadTebularReport = async (id, name, reporTypeId) => {
    try {
      setDownloadingId(id);

      const { config, fs } = RNFetchBlob;

      const cleanName = name
        ? String(name).replace(/[\/\\:*?"<>|]/g, '_').trim()
        : `report-${id}`;

      const uniqueFileName = `${cleanName}-${id}-${Date.now()}.pdf`;
      const path = `${fs.dirs.DownloadDir}/${uniqueFileName}`;

      const selectedBranchId = loginHeader ? loginBranchId : 0;
      const clientId = mainHeader ? mainBranchId : 0;
      const isHeaderPNG = isPrintHeader ? 1 : 0;

      const url =
        `${API_BASE_URL}DeltaReport/download-delta-report` +
        `?PatientInvestigationIdList=${id}` +
        `&isHeaderPNG=${isHeaderPNG}` +
        `&PrintBy=${userId}` +
        `&branchId=${selectedBranchId}` +
        `&clientId=${clientId}` +
        `&ViewReport=false`;

      console.log('Download URL:', url);
      console.log('Download path:', path);

      const res = await config({
        fileCache: true,
        path,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: uniqueFileName,
          description: 'Downloading report...',
          mime: 'application/pdf',
          path,
          mediaScannable: true,
        },
      }).fetch('GET', url);

      console.log('Download response:', res?.info?.(), res?.path());

      if (res && res.path()) {
        showToast('File downloaded', 'success');
      } else {
        showToast('Download failed', 'error');
      }
    } catch (error) {
      console.error('Download failed', error);
      showToast('Download failed', 'error');
    } finally {
      setDownloadingId((prev) => (prev === id ? null : prev));
    }
  };

  const getStatusInfo = (item) => {
    const status = getDetailedStatus(item);
    if (status === 'Dispatched') return { text: status, color: '#06b6d4', bg: '#cffafe', icon: 'truck-fast' };
    if (status === 'Report Approved') return { text: status, color: '#10b981', bg: '#d1fae5', icon: 'file-check' };
    if (status === 'Report Approval Pending') return { text: status, color: '#f59e0b', bg: '#fed7aa', icon: 'clock-time-four' };
    if (status === 'Hold') return { text: status, color: '#6b7280', bg: '#f3f4f6', icon: 'pause-circle' };
    if (status === 'Abnormal') return { text: status, color: '#f97316', bg: '#ffedd5', icon: 'alert-circle' };
    if (status === 'Department Received') return { text: status, color: '#8b5cf6', bg: '#ede9fe', icon: 'office-building' };
    if (status === 'Sample Collected') return { text: status, color: '#3b82f6', bg: '#dbeafe', icon: 'test-tube' };
    if (status === 'URGENT') return { text: status, color: '#dc2626', bg: '#fee2e2', icon: 'alert' };
    return { text: 'Sample Collection Pending', color: '#ef4444', bg: '#fee2e2', icon: 'clock-time-four' };
  };

  const getGenderIcon = (gender) => {
    if (gender === 'MALE') return { name: 'gender-male', color: '#3b82f6' };
    if (gender === 'FEMALE') return { name: 'gender-female', color: '#ec489a' };
    return { name: 'gender-male-female', color: '#9ca3af' };
  };

  const renderItem = ({ item, index }) => {
    const statusInfo = getStatusInfo(item);
    const genderIcon = getGenderIcon(item.Gender);
    const globalCardColor = getglobalCardColor(item);
    const isOpen = openItemIndex === index;

    getAnimationValue(index);
    const chevronRotation = getChevronRotation(index);

    return (
      <View style={tw`relative`}>
        <View
          style={[
            themed.globalCard,
            tw`rounded-lg mb-4 shadow-sm `,
            { backgroundColor: globalCardColor.bg, borderLeftWidth: 4, borderLeftColor: globalCardColor.border }
          ]}
        >
          {(item?.SamplePickup || item?.SampleDelivered) && (
            <View
              style={tw`absolute -top-2 -right-2 flex-row items-center z-50`}
            >
              <View
                style={[
                  tw`bg-white rounded-full min-w-[32px] h-8 px-2 items-center justify-center border`,
                  {
                    borderColor:
                      item?.SampleDelivered && item?.SamplePickup
                        ? '#7c3aed'
                        : item?.SampleDelivered
                          ? '#2563eb'
                          : '#16a34a',
                  },
                ]}
              >
                <Text
                  style={[
                    tw`text-xs font-bold`,
                    {
                      color:
                        item?.SampleDelivered && item?.SamplePickup
                          ? '#7c3aed'
                          : item?.SampleDelivered
                            ? '#2563eb'
                            : '#16a34a',
                    },
                  ]}
                >
                  {item?.SampleDelivered && item?.SamplePickup
                    ? 'PD'
                    : item?.SampleDelivered
                      ? 'D'
                      : 'P'}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => toggleItem(index)}
            style={tw`flex-col py-2 px-4`}
          >
            <View style={tw`flex-row justify-between items-start`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View
                  style={[
                    tw`mr-3 rounded-full p-1`,
                    themed.globalCard,
                    { backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF' }
                  ]}
                >
                  <MaterialCommunityIcons name="account" size={24} color={genderIcon.color} />
                </View>

                <View style={tw`flex-1 justify-start items-start`}>
                  <Text style={[tw`text-md font-bold`]}>
                    {item.PatientName || 'No Name'}
                  </Text>

                  <Text style={[themed.transactionLabel, tw`mt-0.5 text-xs`]}>
                    {`${item.UHID || 'N/A'} • ${formatDateOnly(item.BillDate)}`}
                  </Text>

                  {item.Barcode && (
                    <View style={tw`mt-1`}>
                      <Barcode
                        value={String(item.Barcode).trim()}
                        format="CODE128"
                        width={1.2}
                        maxWidth={Math.min(80, width - 200)}
                        height={24}
                        lineColor={theme === 'dark' ? '#3f464e' : '#848994'}
                        background="transparent"
                        text={String(item.Barcode).trim()}
                        textStyle={tw`text-[10px] text-gray-700`}
                        onError={(e) => console.warn('Barcode render error:', e?.message || e)}
                        style={{ alignSelf: 'flex-start' }}
                      />
                    </View>
                  )}
                </View>

                <View
                  style={[
                    themed.globalCard,
                    tw`flex-row justify-between items-center p-3 rounded-full`
                  ]}
                >
                  <Animated.View
                    style={[
                      themed.modalCloseButton,
                      tw`rounded-full p-1.5`,
                      { transform: [{ rotate: chevronRotation }] }
                    ]}
                  >
                    <Entypo name="chevron-down" size={18} color={themed.chevronColor} />
                  </Animated.View>
                </View>

              </View>
            </View>
          </TouchableOpacity>

          {isOpen && (
            <View style={[themed.transactionDivider, themed.globalCard, tw`p-4 border-t`]}>
              <View style={tw`gap-2`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-md font-bold`}>
                    {item?.Name || ''}
                  </Text>
                </View>

                <View style={tw`flex-row flex-wrap gap-3 mb-2`}>
                  <View style={tw`flex-row items-center`}>
                    <MaterialCommunityIcons name="calendar" size={14} color={themed.iconMuted} />
                    <Text style={[themed.transactionLabel, tw`ml-1 text-xs`]}>
                      Age: {item.CurrentAge || 'N/A'}
                    </Text>
                  </View>

                  <View style={tw`flex-row items-center`}>
                    <MaterialCommunityIcons name="phone" size={14} color={themed.iconMuted} />
                    <Text style={[themed.transactionLabel, tw`ml-1 text-xs`]}>
                      {item.ContactNumber || 'No Contact'}
                    </Text>
                  </View>
                </View>

                {item.BillDate && (
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                      <MaterialCommunityIcons name="calendar-clock" size={14} color={themed.iconMuted} />
                      <Text style={[themed.transactionLabel, tw`ml-2 text-xs`]}>Bill Date</Text>
                    </View>
                    <Text style={[themed.transactionLabel, tw`text-xs`]}>{formatBillDateTime(item.CreatedOn)}</Text>
                  </View>
                )}

                {item.SampleCollectedOn && (
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                      <MaterialCommunityIcons name="test-tube" size={14} color={themed.iconMuted} />
                      <Text style={[themed.transactionLabel, tw`ml-2 text-xs`]}>Sample Collected</Text>
                    </View>
                    <Text style={[themed.transactionLabel, tw`text-xs`]}>{item.SampleCollectedOn}</Text>
                  </View>
                )}

                {item.ResultDoneOn && (
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                      <MaterialCommunityIcons name="file-check" size={14} color={themed.iconMuted} />
                      <Text style={[themed.transactionLabel, tw`ml-2 text-xs`]}>Result Done</Text>
                    </View>
                    <Text style={[themed.transactionLabel, tw`text-xs`]}>{item.ResultDoneOn}</Text>
                  </View>
                )}

                {item.ReportApprovedOn && (
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                      <MaterialCommunityIcons name="check-circle" size={14} color={themed.iconMuted} />
                      <Text style={[themed.transactionLabel, tw`ml-2 text-xs`]}>Report Approved</Text>
                    </View>
                    <Text style={[themed.transactionLabel, tw`text-xs`]}>{item.ReportApprovedOn}</Text>
                  </View>
                )}

                {item.DispatchedOn && (
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                      <MaterialCommunityIcons name="truck-fast" size={14} color={themed.iconMuted} />
                      <Text style={[themed.transactionLabel, tw`ml-2 text-xs`]}>Dispatched</Text>
                    </View>
                    <Text style={[themed.transactionLabel, tw`text-xs`]}>{formatDate(item.DispatchedOn)}</Text>
                  </View>
                )}
              </View>

              {walletData.balanceMain >= 0 && item?.IsReportApproved === 1 && (
                <View style={tw`flex-row gap-2 mt-4`}>
                  <TouchableOpacity
                    onPress={() =>
                      handleDownloadReport(
                        item?.PatientInvestigationId,
                        item?.PatientName,
                        item?.ReportTypeId
                      )
                    }
                    style={[themed.card, tw`flex-1 flex-row items-center justify-center py-3 rounded-lg`]}
                    activeOpacity={0.7}
                    disabled={downloadingId === item?.PatientInvestigationId}
                  >
                    {downloadingId === item?.PatientInvestigationId ? (
                      <ActivityIndicator size="small" color={themed.chevronColor} />
                    ) : (
                      <>
                        <Feather name="download" size={14} color={themed.chevronColor} />
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[themed.listItemText, tw`ml-2 text-xs font-medium`]}
                        >
                          Download
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (item?.ReportTypeId === 1) {
                        navigation.navigate('ViewTebularReport', { item, isPrintHeader, loginHeader, mainHeader });
                      } else {
                        navigation.navigate('ViewLabReport', {
                          patientInvestigationId: item?.PatientInvestigationId,
                          patientName: item?.PatientName,
                          branchId: payload?.branchId,
                          item,
                        });
                      }
                    }}
                    style={[
                      tw`flex-1 flex-row items-center justify-center py-3 rounded-lg border`,
                      theme === 'dark'
                        ? tw`bg-blue-900 border-blue-700`
                        : tw`bg-blue-50 border-blue-500`
                    ]}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name="eye"
                      size={14}
                      color={theme === 'dark' ? '#93C5FD' : '#3b82f6'}
                    />
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[
                        tw`ml-2 text-xs font-medium`,
                        theme === 'dark' ? tw`text-blue-200` : tw`text-blue-600`
                      ]}
                    >
                      View
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {walletData?.balanceMain < 0 && (
                <View style={tw`bg-amber-50 border-l-4 border-amber-500 rounded-lg px-2 py-1 mt-2 mb-4`}>
                  <View style={tw`flex-row items-center`}>
                    <MaterialCommunityIcons name="alert-circle" size={24} color="#D97706" />
                    <View style={tw`ml-3 flex-1`}>
                      <Text style={tw`text-amber-800 font-semibold text-sm`}>
                        Low Balance Alert
                      </Text>
                      <Text style={tw`text-amber-700 text-xs mt-0.5`}>
                        Please add funds to download report. Current balance:
                        <Text style={tw`font-bold text-red-500`}> ₹{walletData?.balanceMain}</Text>
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={tw`flex-row items-center gap-2 mt-4`}>
                <TouchableOpacity
                  onPress={() => handleUpdatetatusPicked(item)}
                  // disabled={isFlagTrue(item?.SamplePickup)}
                  style={tw`flex-1 ${item?.SamplePickup ? `bg-green-400` : `bg-yellow-800`}  px-4 py-3 rounded-lg items-center justify-center`} activeOpacity={0.7}>
                  {pickingSample ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={tw`flex-row items-center gap-1`}>
                      <Text style={[themed.saveButtonText]}>Sample Picked</Text>
                      {item?.SamplePickup && <EvilIcons name="check" size={20} color="white" />}
                    </View>
                  )}
                </TouchableOpacity>
                {item?.SamplePickup && <TouchableOpacity
                  onPress={() => handleUpdatetatusDelivered(item)}
                  // disabled={isFlagTrue(item?.SampleDelivered)}
                  style={tw`flex-1 ${item?.SampleDelivered ? `bg-green-500` : `bg-orange-500`}  px-4 py-3 rounded-lg items-center justify-center`} activeOpacity={0.7}>
                  {deliveringSample ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={tw`flex-row items-center gap-1`}>
                      <Text style={[themed.saveButtonText]}>Sample Delivered</Text>
                      {item?.SampleDelivered && <EvilIcons name="check" size={20} color="white" />}
                    </View>
                  )}

                </TouchableOpacity>}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!payload) {
    return (
      <View style={[themed.screen, tw`flex-1`]}>
        <View style={[themed.globalCard, tw`flex-1 items-center justify-center px-6`]}>
          <MaterialCommunityIcons name="magnify" size={44} color={themed.chevronColor} />
          <Text style={[themed.listItemText, tw`mt-3 text-base font-semibold text-center`]}>
            Search required
          </Text>
          <Text style={[themed.transactionLabel, tw`mt-1 text-sm text-center`]}>
            Please search from Help Desk to view the patient list.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('HelpDeskHome')}
            style={tw`mt-4 bg-blue-500 px-4 py-3 rounded-lg`}
            activeOpacity={0.8}
          >
            <Text style={tw`text-white font-semibold`}>Go to Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[themed.screen, tw`flex-1`]}>
      <View style={[themed.globalCard, tw`px-4 py-3 border-b rounded-none`]}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={[themed.listItemText, tw`text-xl font-bold`]}>Patient List</Text>
            <Text style={[themed.transactionLabel, tw`text-sm mt-1`]}>
              {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'} found
            </Text>
          </View>

          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              onPress={() => setShowStatusLegend(!showStatusLegend)}
              style={[themed.filterButton, tw`border`]}
            >
              <MaterialCommunityIcons name="information-outline" size={18} color={themed.filterButtonIcon} />
              <Text style={themed.filterButtonText}>Status Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openFilterModal}
              style={tw`flex-row items-center bg-blue-500 px-3 py-2 rounded-lg shadow-sm`}
            >
              <MaterialCommunityIcons name="filter-variant" size={18} color="white" />
              <Text style={tw`text-white text-sm font-medium ml-1`}>Filter</Text>
              {(selectedStatus !== 'all' || selectedType !== 'all' || searchText) && (
                <View style={tw`bg-red-500 rounded-full w-5 h-5 items-center justify-center ml-2`}>
                  <Text style={tw`text-white text-[10px] font-bold`}>
                    {selectedStatus !== 'all' && selectedType !== 'all' ? 2 : (selectedStatus !== 'all' || selectedType !== 'all' ? 1 : 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`flex-row items-center gap-3`}>
          <View style={[themed.inputBox, tw`flex-1 flex-row items-center px-3 min-h-[50px] rounded-xl`]}>
            <Feather name="search" size={18} color={themed.iconMuted} />
            <TextInput
              style={[tw`flex-1 ml-2 py-0 text-base`, themed.inputText]}
              placeholder="Search by name, UHID, test or barcode..."
              placeholderTextColor={themed.inputPlaceholder}
              value={searchText}
              onChangeText={setSearchText}
              numberOfLines={1}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={themed.iconMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={tw`bg-blue-500 px-4 min-h-[50px] rounded-xl flex-row items-center justify-center`}
            activeOpacity={0.7}
            onPress={onPressScan}
          >
            <MaterialIcons name="qr-code-scanner" size={18} color="white" />
            <Text style={tw`text-white text-sm font-medium ml-2`}>Scan</Text>
          </TouchableOpacity>
        </View>

        {data && data.length > 0 &&
          <View style={tw`flex-row items-center gap-4 mt-3`}>
            <View style={tw`flex-row items-center gap-1 mt-3`}>
              <CheckBox
                value={isPrintHeader}
                onValueChange={setIsPrintHeader}
                style={{
                  transform: [
                    { scaleX: Platform.OS === 'ios' ? 0.9 : 0.9 },
                    { scaleY: Platform.OS === 'ios' ? 0.9 : 0.9 },
                  ],
                }}
              />
              <Text style={themed.labelTextXs}>Header</Text>
            </View>

            <View style={tw`flex-row items-center gap-4 mt-3`}>
              <View style={tw`flex-row items-center gap-2`}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleLoginHeader}
                  style={tw`flex-row items-center gap-2`}
                >
                  <CheckBox
                    value={loginHeader}
                    onValueChange={handleLoginHeader}
                    style={{
                      transform: [
                        { scaleX: Platform.OS === 'ios' ? 0.9 : 0.9 },
                        { scaleY: Platform.OS === 'ios' ? 0.9 : 0.9 },
                      ],
                    }}
                  />
                  <Text style={themed.labelTextXs}>Login Header</Text>
                </TouchableOpacity>
              </View>

              {/* Main Header (radio) */}
              <View style={tw`flex-row items-center gap-2`}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleMainHeader}
                  style={tw`flex-row items-center gap-2`}
                >
                  <CheckBox
                    value={mainHeader}
                    onValueChange={handleMainHeader}
                    style={{
                      transform: [
                        { scaleX: Platform.OS === 'ios' ? 0.9 : 0.9 },
                        { scaleY: Platform.OS === 'ios' ? 0.9 : 0.9 },
                      ],
                    }}
                  />
                  <Text style={themed.labelTextXs}>Main Header</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }


        {showStatusLegend && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`mt-3`}
            contentContainerStyle={tw`gap-2`}
          >
            <View style={tw`flex-row gap-2`}>
              {statusLegend.map((status) => (
                <TouchableOpacity
                  key={status.key}
                  onPress={() => setSelectedStatus(selectedStatus === status.key ? 'all' : status.key)}
                  style={[
                    tw`flex-row items-center rounded-full px-3 py-1.5`,
                    {
                      backgroundColor: status.bg,
                      borderWidth: selectedStatus === status.key ? 2 : 1,
                      borderColor: status.color
                    }
                  ]}
                >
                  <View style={[tw`w-2 h-2 rounded-full mr-2`, { backgroundColor: status.color }]} />
                  <Text style={[tw`text-xs font-medium`, { color: status.color }]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {(selectedStatus !== 'all' || selectedType !== 'all') && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mt-2`}>
            <View style={tw`flex-row gap-2`}>
              {selectedStatus !== 'all' && (
                <TouchableOpacity
                  onPress={() => setSelectedStatus('all')}
                  style={tw`flex-row items-center bg-blue-100 rounded-full px-2 py-1`}
                >
                  <Text style={tw`text-xs text-blue-700`}>
                    {statusLegend.find(s => s.key === selectedStatus)?.label || selectedStatus}
                  </Text>
                  <MaterialCommunityIcons name="close" size={12} color="#3b82f6" style={tw`ml-1`} />
                </TouchableOpacity>
              )}
              {selectedType !== 'all' && (
                <TouchableOpacity
                  onPress={() => setSelectedType('all')}
                  style={tw`flex-row items-center bg-blue-100 rounded-full px-2 py-1`}
                >
                  <Text style={tw`text-xs text-blue-700`}>Type: {selectedType}</Text>
                  <MaterialCommunityIcons name="close" size={12} color="#3b82f6" style={tw`ml-1`} />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => `${item.LabNo || index}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={gethelpDesk}
        ListEmptyComponent={
          <View style={tw`items-center justify-center py-12`}>
            <MaterialCommunityIcons name="file-search-outline" size={64} color="#d1d5db" />
            <Text style={[themed.transactionLabel, tw`text-base mt-4 font-medium`]}>
              No Data Found
            </Text>
            <Text style={[themed.transactionLabel, tw`text-sm mt-1`]}>
              {searchText || selectedStatus !== 'all' || selectedType !== 'all'
                ? 'No matching records found'
                : 'No patient records available'}
            </Text>
          </View>
        }
      />

      <Modal visible={filterModal} transparent animationType="fade" statusBarTranslucent onRequestClose={closeFilterModal} >
        <View style={tw`flex-1 flex-row bg-black/50`}>
          <TouchableOpacity activeOpacity={1} onPress={closeFilterModal} style={tw`flex-1`} />
          <Animated.View
            style={[
              themed.modalContainer,
              tw`h-full w-[60%] rounded-l-3xl rounded-r-none`,
              {
                transform: [{
                  translateX: filterSlideAnim.interpolate({
                    inputRange: [0, 1], outputRange: [0, 500],
                  }),
                },],
              },]} >
            <View style={[themed.globalDivider, tw`p-4 border-b flex-row justify-between items-center`,]}>
              <Text style={[themed.listItemText, tw`text-lg font-bold`]}>  Filter Patients  </Text>
              <TouchableOpacity onPress={closeFilterModal}>
                <MaterialCommunityIcons name="close" size={24} color={themed.chevronColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`flex-1 p-4`} showsVerticalScrollIndicator={false}>
              <Text style={[themed.listItemText, tw`text-base font-semibold mb-3`]}> Status  </Text>
              <View style={tw`gap-2 mb-6`}>
                {statusLegend.map((status) => {
                  const isSelected = selectedStatus === status.key;

                  return (
                    <TouchableOpacity
                      key={status.key}
                      onPress={() => { setSelectedStatus(status.key), closeFilterModal() }}
                      activeOpacity={0.85}
                      style={[
                        tw`w-full flex-row items-center rounded-xl px-3 py-3 border`,
                        {
                          backgroundColor: isSelected ? status.color : status.bg,
                          borderColor: status.color,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={[tw`w-3 h-3 rounded-full mr-2`, { backgroundColor: isSelected ? '#fff' : status.color, },]} />
                      <Text
                        style={[tw`text-sm font-semibold flex-1`, { color: isSelected ? '#fff' : status.color, },]} >
                        {status.label}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={[themed.transactionDivider, tw`p-4 border-t gap-3 flex flex-row`]}>
              <TouchableOpacity
                onPress={clearFilters}
                style={[themed.card, tw`py-3 rounded-xl w-[48%]`]}
              >
                <Text style={[themed.listItemText, tw`text-center font-medium`]}> Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeFilterModal}
                style={[themed.primaryButton, tw`w-[48%]`]}
              >
                <Text style={themed.primaryButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default ListHelpDeskPatient;
