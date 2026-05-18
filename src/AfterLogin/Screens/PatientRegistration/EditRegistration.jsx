import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../../Authorization/api';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SearchServiceUpdate from './SearchServiceUpdate';
import { useAuth } from '../../../../Authorization/AuthContext';
import { useToast } from '../../../../Authorization/ToastContext';

const EditRegistration = () => {
  const route = useRoute();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const themed = getThemeStyles(theme);
  const { ipAddress, loginBranchId, userId, corporateId } = useAuth();

  const [serviceItemModal, setServoceItemModal] = useState(false);
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(false);

  const visitId = route?.params?.patientData?.VisitId;

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [patientDetails, setPatientDetails] = useState(null);
  const [serviceList, setServiceList] = useState([]);
  const [newlyAddedIds, setNewlyAddedIds] = useState([]);

  const [form, setForm] = useState({
    Title: '',
    FirstName: '',
    AgeYears: '',
    AgeMonths: '',
    AgeDays: '',
    DOB: '',
    Gender: '',
    UHID: '',
    ContactNumber: '',
  });

  useEffect(() => {
    if (visitId) {
      getPatientData(visitId);
    }
  }, [visitId]);




  const getPatientData = async (visitIdValue) => {
    setLoading(true);
    try {
      const response = await api.get(
        `Patient/get-patient-bill-details?visitId=${visitIdValue}`
      );

      const patientArray = response?.data?.data || [];
      const patientHeader = patientArray?.[0] || null;

      setPatientDetails(patientHeader);
      setServiceList(patientArray);
      setNewlyAddedIds([]);

      setForm({
        Title: patientHeader?.Title || '',
        FirstName: patientHeader?.FirstName || patientHeader?.PatientName || '',
        AgeYears:
          patientHeader?.AgeYears !== null && patientHeader?.AgeYears !== undefined
            ? String(patientHeader.AgeYears)
            : '',
        AgeMonths:
          patientHeader?.AgeMonths !== null && patientHeader?.AgeMonths !== undefined
            ? String(patientHeader.AgeMonths)
            : '',
        AgeDays:
          patientHeader?.AgeDays !== null && patientHeader?.AgeDays !== undefined
            ? String(patientHeader.AgeDays)
            : '',
        DOB: formatDateForUI(patientHeader?.DOB),
        Gender: toTitleCase(patientHeader?.Gender || ''),
        UHID: patientHeader?.UHID || '',
        ContactNumber:
          patientHeader?.MobileNo ||
          patientHeader?.ContactNumber ||
          patientHeader?.PhoneNo ||
          '',
      });
    } catch (error) {
      console.log('patient data error', error?.response || error?.message);
      showToast('Unable to load patient details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForUI = (dateStr) => {
    if (!dateStr) return '';

    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
      }
    }

    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return dateStr;

    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const toTitleCase = (value) => {
    if (!value) return '';
    const lower = String(value).toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const displayName = useMemo(() => {
    return form?.FirstName || patientDetails?.PatientName || '';
  }, [form?.FirstName, patientDetails?.PatientName]);

  const hasNewTests = newlyAddedIds.length > 0;

  const InfoRow = ({ icon, label, value, IconComponent = Icon }) => (
    <View style={tw`flex-row items-start mb-3`}>
      <View style={tw`w-8 mt-1`}>
        <IconComponent
          name={icon}
          size={16}
          color={themed.primaryColor || '#06b6d4'}
        />
      </View>
      <View style={tw`flex-1`}>
        <Text style={[themed.labelText, tw`text-xs mb-1 opacity-70`]}>
          {label}
        </Text>
        <Text style={[themed.mutedText]}>
          {value || 'Not Provided'}
        </Text>
      </View>
    </View>
  );

  const handleAddTestsToServiceList = (payload) => {
    const incomingServices = payload?.services || [];

    if (!incomingServices.length) {
      setServoceItemModal(false);
      return;
    }

    setServiceList((prev) => {
      const oldList = Array.isArray(prev) ? [...prev] : [];
      const freshNewIds = [];

      incomingServices.forEach((service) => {
        const serviceItemId = Number(service?.serviceItemId) || 0;

        const alreadyExists = oldList.some(
          (x) => Number(x?.ServiceItemId || x?.serviceItemId) === serviceItemId
        );

        if (!alreadyExists) {
          oldList.push({
            ServiceItemId: serviceItemId,
            SubSubCategoryId: Number(service?.subSubCategoryId) || 0,
            ServiceName: service?.serviceName || '',
            Rate: Number(service?.amount) || 0,
            Qty: Number(service?.qty) || 1,
            IsUrgent: Number(service?.isUrgent) || 0,
            Barcode: service?.barcode || '',
            TestRemark: service?.testRemark || '',
            CorporateId: Number(corporateId) || 0,
            isNewlyAdded: true,
          });

          if (serviceItemId > 0) {
            freshNewIds.push(serviceItemId);
          }
        }
      });

      setNewlyAddedIds((prevIds) => [...prevIds, ...freshNewIds]);
      return oldList;
    });

    setServoceItemModal(false);
  };

  const handleRemoveNewTest = (serviceItemId) => {
    const id = Number(serviceItemId) || 0;

    setServiceList((prev) =>
      prev.filter((item) => Number(item?.ServiceItemId || item?.serviceItemId) !== id)
    );

    setNewlyAddedIds((prev) => prev.filter((x) => Number(x) !== id));
  };

  const handleUpdateTests = async () => {
    try {
      const newServicesOnly = serviceList.filter((item) =>
        newlyAddedIds.includes(Number(item?.ServiceItemId || item?.serviceItemId))
      );

      if (!newServicesOnly.length) {
        return;
      }

      setUpdating(true);

      const payload = {
        patientId:
          Number(
            patientDetails?.PatientId ||
            route?.params?.patientData?.PatientId
          ) || 0,
        branchId: Number(loginBranchId) || 0,
        loginBranchId: Number(loginBranchId) || 0,
        userId: 1,
        ipAddress: ipAddress || '',
        discountAmount: 0,
        services: newServicesOnly.map((item) => ({
          serviceItemId: Number(item?.ServiceItemId || item?.serviceItemId) || 0,
          subSubCategoryId:
            Number(item?.SubSubCategoryId || item?.subSubCategoryId) || 0,
          serviceName: item?.ServiceName || item?.serviceName || '',
          amount: Number(item?.Rate || item?.amount) || 0,
          qty: Number(item?.Qty || item?.qty) || 1,
          isUrgent: Number(item?.IsUrgent || item?.isUrgent) || 0,
          barcode: item?.Barcode || item?.barcode || '',
          testRemark: item?.TestRemark || item?.testRemark || '',
          corporateId: corporateId,

        })),
      };

      console.log('update payload', payload);

      const response = await api.post(`Patient/update-patient-services`, payload);
      console.log('update success', response?.data);
      showToast(response?.data?.message || 'Updated Successfully', 'success');

      setServiceList((prev) =>
        prev.map((item) => {
          const id = Number(item?.ServiceItemId || item?.serviceItemId) || 0;
          if (newlyAddedIds.includes(id)) {
            return { ...item, isNewlyAdded: false };
          }
          return item;
        })
      );

      setNewlyAddedIds([]);
    } catch (error) {
      console.log(
        'update error',
        error?.response?.data || error?.response || error?.message
      );
      showToast(
        error?.response?.data?.message || 'Unable to update services',
        'error'
      );
    } finally {
      setUpdating(false);
    }
  };

  const renderServiceItem = ({ item }) => {
    const serviceItemId = Number(item?.ServiceItemId || item?.serviceItemId) || 0;
    const isNew = newlyAddedIds.includes(serviceItemId) || item?.isNewlyAdded;
    const isUrgent = Number(item?.IsUrgent || item?.isUrgent) === 1;

    return (
      <View
        style={[
          themed.globalCard,
          themed.border,
          tw`p-3 rounded-xl border mb-3`,
        ]}
      >
        <View style={tw`flex-row justify-between items-start`}>
          <View style={tw`flex-1 pr-3`}>
            <View style={tw`flex-row items-center`}>
              {isUrgent && (
                <View style={tw`bg-red-600 px-2 py-0.5 rounded-full mr-2`}>
                  <Text style={tw`text-white text-[10px] font-bold`}>U</Text>
                </View>
              )}

              <Text
                numberOfLines={2}
                style={[themed.inputText, tw`flex-1  `]}
              >
                {item?.ServiceName || item?.serviceName || 'N/A'}
              </Text>
            </View>

            {isNew ? (
              <View style={tw`mt-2 self-start bg-green-600 px-2 py-1 rounded-full`}>
                <Text style={tw`text-white text-[10px] font-bold`}>NEW</Text>
              </View>
            ) : null}
          </View>

          <View style={tw`items-end`}>
            <Text style={[themed.mutedText, tw``]}>
              ₹ {item?.Rate ?? item?.amount ?? 0}
            </Text>

            {isNew ? (
              <TouchableOpacity
                onPress={() => handleRemoveNewTest(serviceItemId)}
                style={tw`flex-row items-center bg-red-600 px-2 py-1 rounded-lg`}
              >
                <MaterialIcons name="delete-outline" size={16} color="#fff" />
                <Text style={tw`text-white text-xs font-semibold ml-1`}>
                  Remove
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[themed.childScreen, tw`flex-1 justify-center items-center`]}>
        <ActivityIndicator size="large" color={themed.primaryColor || '#06b6d4'} />
        <Text style={[themed.inputText, tw`mt-3`]}>
          Loading patient details...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[themed.childScreen, tw`flex-1`]}
    >
      <ScrollView
        contentContainerStyle={tw`p-2 pb-8`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[themed.globalCard, themed.border, tw`rounded-xl border mb-4 overflow-hidden`]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setBasicInfoExpanded((prev) => !prev)}
            style={tw`flex-row items-center justify-between p-3`}
          >
            <View style={tw`flex-row items-center`}>
              <Icon
                name="user"
                size={16}
                color={themed.primaryColor || '#06b6d4'}
                style={tw`mr-2`}
              />
              <Text style={[themed.labelText, tw``]}>
                Basic Information
              </Text>
            </View>

            <MaterialIcons
              name={basicInfoExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={26}
              color={themed.primaryColor || '#06b6d4'}
            />
          </TouchableOpacity>

          {basicInfoExpanded ? (
            <View style={tw`px-3 pb-3`}>
              <View style={[themed.border, tw`h-[0.5px] mb-3`]} />

              <InfoRow icon="hash" label="UHID Number" value={form.UHID} />

              <View style={tw`flex-row items-start mb-3`}>
                <View style={tw`w-8 mt-1`}>
                  <Icon
                    name="user"
                    size={18}
                    color={themed.primaryColor || '#06b6d4'}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[themed.labelText, tw`text-xs mb-1 opacity-70`]}>
                    Full Name
                  </Text>
                  <Text style={[themed.mutedText, tw`font-semibold`]}>
                    {form.Title} {displayName} /({form.Gender})
                  </Text>
                </View>
              </View>

              <View style={tw`flex-row items-start mb-3`}>
                <View style={tw`w-8 mt-1`}>
                  <Icon
                    name="calendar"
                    size={16}
                    color={themed.primaryColor || '#06b6d4'}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[themed.labelText, tw`text-xs mb-1 opacity-70`]}>
                    Age
                  </Text>
                  <Text style={[themed.mutedText, tw`font-semibold`]}>
                    {form.AgeYears} Years {form.AgeMonths} Months {form.AgeDays} Days
                  </Text>
                  <Text style={[themed.mutedText, tw`font-semibold`]}>
                    DOB: {form.DOB}
                  </Text>
                </View>
              </View>

              <InfoRow icon="phone" label="Contact Number" value={form.ContactNumber} />
            </View>
          ) : null}
        </View>

        <View style={[themed.globalCard, themed.border, tw`p-3 rounded-xl border mb-4`]}>
          <View style={tw`flex-row items-center mb-3 pb-2`}>
            <Icon
              name="list"
              size={16}
              color={themed.primaryColor || '#06b6d4'}
              style={tw`mr-2`}
            />
            <Text style={[themed.labelText]}>Service Details</Text>
          </View>

          {serviceList?.length > 0 ? (
            <FlatList
              data={serviceList}
              keyExtractor={(item, index) =>
                String(item?.ServiceItemId || item?.serviceItemId || index)
              }
              renderItem={renderServiceItem}
              scrollEnabled={false}
            />
          ) : (
            <Text style={[themed.inputText, tw`text-center py-4 opacity-70`]}>
              No services found
            </Text>
          )}

          <TouchableOpacity
            onPress={() => setServoceItemModal(true)}
            style={[themed.searchButton, tw`mb-3`]}
          >
            <Text style={[themed.saveButtonText]}>Add New Test</Text>
          </TouchableOpacity>

          {hasNewTests ? (
            <TouchableOpacity
              onPress={handleUpdateTests}
              disabled={updating}
              style={[
                tw`py-3 rounded-xl`,
                { backgroundColor: '#16a34a' },
              ]}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={tw`text-white text-center font-semibold text-base`}>
                  Update
                </Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={serviceItemModal}
        transparent
        animationType="none"
        onRequestClose={() => setServoceItemModal(false)}
      >
        <View style={tw`flex-1 bg-black/50`}>
          <TouchableWithoutFeedback onPress={() => setServoceItemModal(false)}>
            <View style={tw`flex-1`} />
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback>
            <View
              style={[
                themed.modalCard,
                tw`rounded-t-2xl p-3 h-[80%]`,
              ]}
            >
              <SearchServiceUpdate
                onClose={() => setServoceItemModal(false)}
                onSaveTests={handleAddTestsToServiceList}
                initialSelectedTests={[]}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default EditRegistration;