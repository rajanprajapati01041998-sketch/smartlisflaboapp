import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert, ActivityIndicator, Platform, FlatList, Image } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  referLabList,
  searchInvestigation,
  allBankList,
  referDoctorList
} from './services/doctorService';
import ReferDoctor from './ReferDoctor';
import DoctorList from './DoctorList';
import { useAuth } from '../../../../Authorization/AuthContext';
import ReferLab from './ReferLab';
import SearchSelectService from './SearchSelectService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RadioButton, Checkbox } from 'react-native-paper';
import FieldBoy from './FieldBoy';
import api from '../../../../Authorization/api';
import SelectTitle from './SelectTitle';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../../../utils/InputStyle';
import Icon from 'react-native-vector-icons/Feather';
import CenterInfo from './CenterInfo';
import { useToast } from '../../../../Authorization/ToastContext';
import BottomModal from '../../../utils/BottomModal';
import CenterModal from '../../../utils/CenterModal';
import { useTheme } from '../../../../Authorization/ThemeContext';
import SelectBank from './SelectBank';
import PaymentInfo from './PaymentInfo';
import AddReferDoctor from './AddReferDoctor';
import { getThemeStyles } from '../../../utils/themeStyles';
import { SelectList } from 'react-native-dropdown-select-list';
import { getPatientInvestigation } from '../../../utils/patinetService.js/investigation';
import { getFullLocation } from '../../../utils/patinetService.js/location';
import SelectApproval from './SelectApproval';
import Clipboard from '@react-native-clipboard/clipboard';
import AddBarcodePatientRegistration from './AddBarcodePatientRegistration';


const RegistrationScreen = () => {
  const [loading, setLoading] = useState(false)
  const { ipAddress, setServiceItem, serviceItem, selectedDoctor, corporateId, patientData, userData, loginBranchId, centerLoginBranchId, userId, addBarcode, hosId, fieldBoyData, fieldBoyId } = useAuth();
  const { showToast } = useToast()
  const { theme, colors } = useTheme();
  const themed = getThemeStyles(theme);
  const [error, setError] = useState(false)
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [ageDays, setAgeDays] = useState('');
  const [dob, setDob] = useState(null);
  const [ageLastEdited, setAgeLastEdited] = useState('dob'); // 'dob' | 'age'
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState("MALE");
  const [maritalStatus, setMaritalStatus] = useState('');
  const [relation, setRelation] = useState('');
  const [relativeName, setRelativeName] = useState('');
  const [contactNumber, setContactNumber] = useState(null);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [vistType, setVisitype] = useState("Home Collection");
  const [collectionDateTime, setCollectionDateTime] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date()); // For iOS modal
  const [tempTime, setTempTime] = useState(new Date()); // For iOS modal
  const [grossAmount, setGrossAmount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentData, setPaymentData] = useState({})
  const [discountLastEdited, setDiscountLastEdited] = useState('percent');
  const [balanceAmount, setBalanceAmount] = useState(patientData?.TotalBalanceOfAdvanceAmount || null);
  const [isOverPaid, setIsOverPaid] = useState(false);
  const [netAmount, setNetAmount] = useState(null);
  const [roundOff, setRoundOff] = useState(0);
  const [cash, setCash] = useState(null);
  const [isCashAuto, setIsCashAuto] = useState(true);
  const [debitCardAmt, setDebitCardAmt] = useState(null);
  const [creditCardAmt, setCreditCardAmt] = useState(null);
  const [chequeAmt, setChequeAmt] = useState(null);
  const [neftrtgsAmt, setNeftRtgsAmt] = useState(null);
  const [payTmAmt, setPayTm] = useState(null);
  const [phonePayAmt, setPhonePayAmt] = useState(null);
  const [discountReason, setDiscountReason] = useState(" ");
  const [remark, setRemark] = useState(" ");
  const [refrDoctrorModal, setReferDoctorModal] = useState(false);
  const [addreferDoctorModal, setAddReferDoctorModal] = useState(false)
  const [selectedReferDoctor, setSelectedReferDoctor] = useState(null);
  const [doctorlistModal, setDoctorListModal] = useState(false);
  const [selectedDoctorList, setSelectedDoctorList] = useState(null);
  const [referLabListModal, setReferLabListModal] = useState(false);
  const [selectedReferLab, setSelectedReferLab] = useState(null);
  const [searchSelectModal, setSearchSelectModal] = useState(false);
  const [fieldBoyModal, setFieldBoyModal] = useState(false);
  const [selectedFieldBoy, setSelectedFieldBoy] = useState(null);
  const [selectTitleModal, setSelectTitleModal] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState("Mr.");
  const [receiptAmount, setReceiptAmount] = useState(0);
  // const [selectedTitle, setSelectedTitle] = useState(null)
  const [showBillingInfo, setShowBillingInfo] = useState(false)
  const [responseSuccess, setResponseSuccess] = useState(false)
  const [selectedBank, setSelectedBank] = useState(null)
  const [bankModal, setBankModal] = useState(false)
  const [chequeRefrence, setChequeRefrence] = useState('')
  const [neftRefrence, setNeftReference] = useState('')
  const [debitCardReference, setDebitCardReference] = useState('')
  const [paytmRefrence, setPaytmRefrence] = useState('')
  const [phonePayReference, setPhonePayReference] = useState("")
  const [credicardReference, setCrediCardReference] = useState('')
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [barcodeDraft, setBarcodeDraft] = useState({});
  const [remarkExpanded, setRemarkExpanded] = useState({});
  const [sampleGroupExpanded, setSampleGroupExpanded] = useState({});
  const [groupBarcodeDraft, setGroupBarcodeDraft] = useState({});
  const [pincodeResponse, setPincodeResponse] = useState([]);
  const [pincode, setPincode] = useState("");
  const [district, setDistrict] = useState(null);
  const [state, setState] = useState(null);
  const [city, setCity] = useState(null);
  const [isCityModal, setIsCityModal] = useState(false);
  const [country, setCountry] = useState("India");
  const [discountApprovalModal, setDiscountApprovalModal] = useState(false);
  const [selectedDiscountApproval, setSelectedDiscountApproval] = useState(null);
  const [discountApprovalId, setDiscountApprovalId] = useState(0);

  const parseDOBValue = useCallback((value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const raw = String(value).trim();
    if (!raw) return null;

    // ISO / RFC compatible strings
    if (/^\d{4}-\d{2}-\d{2}/.test(raw) || raw.includes('T')) {
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // Common API format in India: DD/MM/YYYY (also accept D/M/YYYY)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
      const [a, b, c] = raw.split('/');
      const dd = Number(a);
      const mm = Number(b);
      const yyyy = Number(c);
      if (!dd || !mm || !yyyy) return null;
      const d = new Date(yyyy, mm - 1, dd);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // Another common API format: DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(raw)) {
      const [a, b, c] = raw.split('-');
      const dd = Number(a);
      const mm = Number(b);
      const yyyy = Number(c);
      if (!dd || !mm || !yyyy) return null;
      const d = new Date(yyyy, mm - 1, dd);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // Fallback
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }, []);

  // console.log(patientData)
  useEffect(() => {
    setSelectedTitle(patientData?.Title || "Mr.");
    setFirstName(patientData?.FirstName || "")
    setGender(patientData?.Gender || "MALE")
    setBalanceAmount(patientData?.TotalBalanceOfAdvanceAmount || 0)
    setContactNumber(patientData?.ContactNumber)
    const nextDob = parseDOBValue(patientData?.DOB);
    setDob(nextDob);
    if (nextDob) {
      setAgeLastEdited('dob');
      setAgeYears('');
      setAgeMonths('');
      setAgeDays('');
    } else {
      // If DOB is not available, fall back to Age fields from API.
      setAgeDays(patientData?.AgeDays || "")
      setAgeMonths(patientData?.AgeMonths || "")
      setAgeYears(patientData?.AgeYears || "")
    }
  }, [patientData, parseDOBValue])

  useEffect(() => {
    const title = String(selectedTitle || '').trim().toLowerCase();
    if (['mr.', 'mr', 'master', 'master.', 'mstr.', 'mstr'].includes(title)) {
      setGender('MALE');
    } else if (['mrs.', 'mrs', 'miss.', 'miss', 'ms.', 'ms'].includes(title)) {
      setGender('FEMALE');
    } else {
      setGender('OTHER');
    }
  }, [selectedTitle]);

  console.log("boy id", fieldBoyId, corporateId)
  useFocusEffect(
    useCallback(() => {
      GetReferedLabList();
      getInvestigationList('cbc');
      return () => {
        console.log('Registration Screen Unfocused');
      };
    }, [])
  );

  const resetForm = useCallback(() => {
    // Close any open modals
    setBarcodeModalVisible(false);
    setSearchSelectModal(false);
    setReferDoctorModal(false);
    setAddReferDoctorModal(false);
    setDoctorListModal(false);
    setReferLabListModal(false);
    setFieldBoyModal(false);
    setSelectTitleModal(false);
    setBankModal(false);

    // Basic Info
    // setTitle('');
    setFirstName('');
    setMiddleName('');
    setLastName('');

    // Age / DOB
    setAgeYears('');
    setAgeMonths('');
    setAgeDays('');
    setDob(null);
    setAgeLastEdited('dob');

    // Personal
    setGender('MALE');
    setMaritalStatus('');
    setRelation('');
    setRelativeName('');

    // Contact
    setContactNumber('');
    setEmail('');
    setAddress('');

    // Location
    setCountry('');
    setState('');
    setDistrict('');
    setCity('');
    setPincode('')

    // Medical
    setMedicalHistory('');

    // Visit
    setVisitype('Home Collection');
    setCollectionDateTime(new Date());
    setTempDate(new Date());
    setTempTime(new Date());

    // Selection
    setSelectedReferDoctor(null);
    setSelectedReferLab(null);
    setSelectedFieldBoy(null);
    setSelectedTitle('Mr.');

    // Billing
    setGrossAmount(null);
    setDiscountAmount(null);
    setDiscountPercent(0);
    setDiscountLastEdited('percent');
    setNetAmount(null);
    setRoundOff(0);
    setBalanceAmount(null);
    setIsCashAuto(true);
    setIsOverPaid(false);
    setShowBillingInfo(false);


    // Payments
    setCash(null);
    setDebitCardAmt(null);
    setCreditCardAmt(null);
    setChequeAmt(null);
    setPhonePayAmt(null);
    setPayTm(null);
    setPaymentData({});
    setReceiptAmount(0);

    // Others
    setDiscountReason('');
    setRemark('');
    setBarcodeDraft({});
    setRemarkExpanded({});
    setSelectedBank(null);

    // Services reset
    setServiceItem({ Services: [] });
  }, [setServiceItem]);

  useEffect(() => {
    resetForm()
  }, [responseSuccess, resetForm])

  const parseMoney = (txt) => {
    const cleaned = String(txt ?? '').replace(/[^0-9.]/g, '');
    if (cleaned === '') return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const getServiceItemId = (item) => Number(item?.ServiceItemId ?? item?.serviceItemId ?? 0);
  const getPackageId = (item) => Number(item?.PackageId ?? item?.packageId ?? 0);
  const isUnderPackage = (item) => Number(item?.IsUnderPackage ?? item?.isUnderPackage ?? 0) === 1;

  const handleRemoveService = (serviceToRemove) => {
    const currentServices = Array.isArray(serviceItem?.Services) ? serviceItem.Services : [];
    if (currentServices.length === 0) return;

    const removeServiceId = getServiceItemId(serviceToRemove);
    if (!removeServiceId) return;

    // If selected chip is a package parent, remove parent + all package child tests.
    const updatedServices = currentServices.filter((item) => {
      const itemServiceId = getServiceItemId(item);
      const itemPackageId = getPackageId(item);

      // remove exact selected service always
      if (itemServiceId === removeServiceId) return false;

      // remove children linked to package parent
      if (itemPackageId === removeServiceId) return false;

      return true;
    });

    setServiceItem({
      ...serviceItem,
      Services: updatedServices,
    });
  };


  const payments = Object.entries(paymentData)
    .filter(([_, val]) => Number(val?.amount) > 0)
    .map(([id, val]) => ({
      paymentModeId: Number(id),
      amount: Number(val?.amount || 0),
      bankId: val?.bank?.bankId ? Number(val.bank.bankId) : 0,
      referenceNo: val?.reference ? String(val.reference) : ""
    }));

  const validateBeforeSave = () => {
    if (isOverPaid) {
      showToast('Your Cash Amount is Greater from Net Amount', 'error');
      return false;
    }
    if (!firstName) {
      showToast('Enter full name', 'error');
      return false;
    }
    if (!ageYears && !ageMonths && !ageDays && !dob) {
      showToast('Enter age or DOB', 'error');
      return false;
    }
    if (!gender) {
      showToast('Select Gender', 'error');
      return false;
    }
    return true;
  };

  const initBarcodeDraftFromServices = (services) => {
    const next = {};
    const nextExpanded = {};
    (services || []).forEach((s) => {
      const id = s?.ServiceItemId;
      if (!id) return;
      const sampleTypes = Array.isArray(s?.SampleTypes) ? s.SampleTypes: Array.isArray(s?.sampleTypes) ? s.sampleTypes  : [];
      const defaultSampleTypeObj = sampleTypes.find(st => Number(st?.sampleTypeId) === Number(s?.SampleTypeId ?? s?.sampleTypeId)) || sampleTypes[0] || null;
      const initialSampleTypeId = s?.SampleTypeId ?? s?.sampleTypeId ?? defaultSampleTypeObj?.sampleTypeId ?? null;
      const initialSampleType = s?.SampleType ?? s ?.sampleType ?? defaultSampleTypeObj?.sampleType ??  '';
      const existingRemark = s?.TestRemark ?? s?.testRemark ?? '';
      next[id] = {
        barcode: s?.Barcode ?? s?.barcode ?? '',
        testRemark: existingRemark,
        sampleTypeId: initialSampleTypeId ? Number(initialSampleTypeId) : null,
        sampleType: initialSampleType,
      };
      nextExpanded[id] = false;
    });
    setBarcodeDraft(next);
    setRemarkExpanded(nextExpanded);

    // Initialize group barcodes from first item of each sample type group.
    const servicesArr = Array.isArray(services) ? services : [];
    const groups = new Map();
    servicesArr.forEach((s) => {
      const stId = (() => {
        const id = s?.ServiceItemId;
        const draft = id ? next?.[id] : null;
        const val = draft?.sampleTypeId ?? s?.SampleTypeId ?? s?.sampleTypeId ?? null;
        return val == null ? null : Number(val);
      })();
      const key = stId == null ? 'unknown' : String(stId);
      if (!groups.has(key)) {
        const id = s?.ServiceItemId;
        const b = id ? (next?.[id]?.barcode ?? '') : '';
        groups.set(key, String(b ?? ''));
      }
    });
    setGroupBarcodeDraft(Object.fromEntries(groups.entries()));
    setSampleGroupExpanded({});
  };

  const openBarcodeModal = () => {
    const services = Array.isArray(serviceItem?.Services) ? serviceItem.Services : [];
    initBarcodeDraftFromServices(services);
    setBarcodeModalVisible(true);
  };

  const savePatientApi = async (servicesOverride) => {
    const services = Array.isArray(servicesOverride)
      ? servicesOverride
      : Array.isArray(serviceItem?.Services)
        ? serviceItem.Services
        : [];

    if (!validateBeforeSave()) return;

    const finalLoginBranchId = centerLoginBranchId || loginBranchId;

    setLoading(true);

    try {
      // =============================
      // 🔥 PAYMENT CALCULATION
      // =============================
      const totalPaidAmount = payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );

      const finalGrossAmount = Number(grossAmount || 0);
      const finalDiscountPercentage = Number(discountPercent || 0);
      const finalDiscountAmount = Number(discountAmount || 0);
      const finalNetAmount = Number(netAmount || 0);

      const finalRoundOff = Number(
        (finalNetAmount - (finalGrossAmount - finalDiscountAmount)).toFixed(2)
      );

      const finalBalanceAmount =
        finalNetAmount - totalPaidAmount;

      // =============================
      // 🔥 PAYLOAD
      // =============================
      const payload = {
        HospId: hosId,
        BranchId: finalLoginBranchId,
        LoginBranchId: finalLoginBranchId,
        CorporateId: corporateId || 1,
        Title: selectedTitle || "Mr.",
        FirstName: firstName,
        MiddleName: middleName,
        LastName: lastName,

        AgeYears: Number(ageYears || 0),
        AgeMonths: Number(ageMonths || 0),
        AgeDays: Number(ageDays || 0),

        DOB: dob
          ? new Date(dob).toISOString().split("T")[0]
          : null,

        Gender: gender,
        MaritalStatus: maritalStatus,
        Relation: relation,
        RelativeName: relativeName,

        ContactNumber: contactNumber || "",
        Address: address || "",

        DoctorId: selectedDoctor || 0,
        ReferDoctorId: selectedReferDoctor?.referDoctorId || 0,
        ReferLabId: selectedReferLab?.outSourceLabId || 0,
        FieldBoyId: fieldBoyId || '',
        MedicalHistory: medicalHistory || "",

        CollectionDateTime: collectionDateTime
          ? new Date(collectionDateTime).toISOString()
          : null,

        CountryId: 1,
        Country: country || "India",
        StateId: 1,
        State: state?.stateName || "",
        DistrictId: district?.districtCode || 0,
        District: district?.districtName || "",
        CityId: city?.cityCode || 0,
        City: city?.cityName || "",

        UserId: userId,
        IpAddress: ipAddress,
        // 🔥 BILL LEVEL
        GrossAmount: finalGrossAmount,
        DiscountPercentage: finalDiscountPercentage,
        DiscountAmount: finalDiscountAmount,
        RoundOff: finalRoundOff,
        NetAmount: finalNetAmount,

        TotalPayableAmount: finalNetAmount,
        TotalPaidAmount: totalPaidAmount,
        TotalBalanceAmount: finalBalanceAmount,

        TotalPatientPayableAmount: finalNetAmount,
        TotalCorporatePayableAmount: 0,
        TotalPatientPaidAmount: totalPaidAmount,
        TotalCorporatePaidAmount: 0,

        // receipt amount
        ReceiptAmount: Number(receiptAmount || 0),
        DiscountApprovedById: discountApprovalId || 0,
        DiscountReason: discountReason || "",
        Remarks: remark || "",
        // 🔥 SERVICES
        Services: services.map(item => {
          const isUnderPackage = Number(item.IsUnderPackage ?? 0);
          const rate = Number(item.Amount ?? item.Rate ?? 0);
          const qty = Number(item.Qty ?? item.qty ?? 1);
          const gross = rate * qty;
          const discPer = isUnderPackage === 1 ? 0 : finalDiscountPercentage;
          const discAmt = isUnderPackage === 1
            ? 0
            : Number(((gross * discPer) / 100).toFixed(2));

          const net = isUnderPackage === 1 ? 0 : gross - discAmt;

          return {
            ServiceItemId: item.ServiceItemId,
            SubSubCategoryId: item.SubSubCategoryId,
            SubCategoryId: item.SubCategoryId ?? 0,
            CategoryId: item.CategoryId ?? 0,

            ServiceName: item.ServiceName,
            Code: item.Code ?? "",

            Rate: rate,
            Amount: rate,
            Qty: qty,

            GrossAmt: gross,
            DiscPer: discPer,
            DiscAmt: discAmt,
            TotalTaxPer: 0,
            TotalTaxAmt: 0,
            NetAmt: net,

            IsUrgent: Number(item.IsUrgent ?? 0),
            IsUnderPackage: isUnderPackage,
            PackageId: item.PackageId ?? item.packageId ?? 0,

            Barcode: item.Barcode ?? "",
            TestRemark: item.TestRemark ?? "",

            SampleTypeId: item.SampleTypeId ?? null,
            SampleType: item.SampleType ?? "",
          };
        }),
        // 🔥 PAYMENTS
        payments: payments,
        // 🔥 INVESTIGATION
        Investigations: [
          {
            ReportingBranchId: finalLoginBranchId,
            TestRemark: remark || ""
          }
        ]
      };

      console.log("FINAL PAYLOAD 👉", JSON.stringify(payload, null, 2));
      const response = await api.post("Patient/save", payload);
      console.log("SUCCESS 👉", response);
      const uhid = response?.data?.uhid;
      if (uhid) {
        Clipboard.setString(uhid);
        showToast(
          `Patient saved. UHID ${uhid} copied to clipboard`,
          "success"
        );
      }

      setResponseSuccess(prev => !prev);
      resetForm();

    } catch (error) {
      console.log("ERROR 👉", error?.response);

      showToast(
        error?.response?.data?.message || "Something went wrong",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeModalSave = () => {
    const currentServices = Array.isArray(serviceItem?.Services) ? serviceItem.Services : [];
    const trimmedGroupBarcodeByKey = Object.entries(groupBarcodeDraft || {}).reduce((acc, [k, v]) => {
      const t = String(v ?? '').trim();
      if (t) acc[k] = t;
      return acc;
    }, {});

    const updatedServices = currentServices.map((s) => {
      const draft = barcodeDraft?.[s.ServiceItemId];
      const groupKey = (() => {
        const stId = getEffectiveSampleTypeId(s);
        return stId == null ? 'unknown' : String(stId);
      })();
      const groupBarcode = trimmedGroupBarcodeByKey?.[groupKey] ?? '';
      const perTestBarcode = String(draft?.barcode ?? s?.Barcode ?? '').trim();
      return {
        ...s,
        Barcode: perTestBarcode || groupBarcode,
        TestRemark: draft?.testRemark ?? s?.TestRemark ?? '',
        SampleTypeId: draft?.sampleTypeId ?? s?.SampleTypeId ?? null,
        SampleType: draft?.sampleType ?? s?.SampleType ?? '',
      };
    });

    setServiceItem((prev) => ({
      ...(prev || {}),
      Services: updatedServices,
    }));

    setBarcodeModalVisible(false);
    savePatientApi(updatedServices);
  };

  const handleSavePatient = () => {
    if (!validateBeforeSave()) return;

    if (addBarcode) {
      openBarcodeModal();
      return;
    }

    savePatientApi();
  };

  const getEffectiveSampleTypeId = useCallback((service) => {
    const id = service?.ServiceItemId;
    const draft = id ? barcodeDraft?.[id] : null;
    const val = draft?.sampleTypeId ?? service?.SampleTypeId ?? service?.sampleTypeId ?? null;
    return val == null ? null : Number(val);
  }, [barcodeDraft]);

  const getEffectiveSampleTypeName = useCallback((service) => {
    const id = service?.ServiceItemId;
    const draft = id ? barcodeDraft?.[id] : null;
    return (
      draft?.sampleType ??
      service?.SampleType ??
      service?.sampleType ??
      ''
    );
  }, [barcodeDraft]);

  const groupedServicesForBarcode = useCallback(() => {
    const services = Array.isArray(serviceItem?.Services) ? serviceItem.Services : [];
    const groupsMap = new Map();

    services.forEach((s) => {
      const stId = getEffectiveSampleTypeId(s);
      const stName = getEffectiveSampleTypeName(s);
      const key = stId == null ? 'unknown' : String(stId);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          sampleTypeId: stId,
          sampleType: stName || (stId == null ? 'Sample Type' : ''),
          items: [],
        });
      }
      groupsMap.get(key).items.push(s);
    });

    return Array.from(groupsMap.values());
  }, [getEffectiveSampleTypeId, getEffectiveSampleTypeName, serviceItem]);

  const setBarcodeForServiceIds = useCallback((serviceIds, txt) => {
    const ids = Array.isArray(serviceIds) ? serviceIds : [];
    setBarcodeDraft((prev) => {
      const next = { ...(prev || {}) };
      ids.forEach((id) => {
        if (!id) return;
        next[id] = { ...(next[id] || {}), barcode: txt };
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (serviceItem?.Services) {
      const sum = serviceItem.Services.reduce((acc, item) => acc + (item.Amount || 0), 0);
      setGrossAmount(sum);

      // Auto-fill cash only when user hasn't manually edited payments.
      if (isCashAuto) {
        setCash(sum);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceItem]);

  useEffect(() => {
    const gross = Number(grossAmount || 0);
    const discPer = Number(discountPercent || 0);
    const discAmt = Number(discountAmount || 0);

    // If gross is 0, reset discount + net to avoid NaN.
    if (!gross) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setNetAmount(0);
      setRoundOff(0);
      return;
    }

    let nextDiscPer = discPer;
    let nextDiscAmt = discAmt;

    if (discountLastEdited === 'percent') {
      nextDiscAmt = (gross * discPer) / 100;
      nextDiscPer = discPer;
    } else {
      // User edited discount amount => recalc percent.
      nextDiscAmt = discAmt;
      nextDiscPer = gross > 0 ? (nextDiscAmt / gross) * 100 : 0;
    }

    // Keep stable rounding to avoid endless re-renders due to float precision.
    const roundedDiscAmt = Number(nextDiscAmt.toFixed(2));
    const roundedDiscPer = Number(nextDiscPer.toFixed(2));

    // Example: gross=750, discount=52.50 => rawNet=697.50, net=698, roundOff=0.50
    const rawNet = gross - roundedDiscAmt;
    const roundedNet = Math.round(rawNet);
    const nextRoundOff = Number((roundedNet - rawNet).toFixed(2));

    setDiscountAmount(roundedDiscAmt);
    setDiscountPercent(roundedDiscPer);
    setNetAmount(roundedNet);
    setRoundOff(nextRoundOff);
  }, [discountLastEdited, discountPercent, discountAmount, grossAmount]);

  useEffect(() => {
    const totalPaid = Object.values(paymentData || {}).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    setIsOverPaid(totalPaid > (netAmount || 0));
  }, [paymentData, netAmount]);

  const onChangeDate1 = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setAgeLastEdited('dob');
      setDob(selectedDate);
    }
  };

  const calculateDOB = (years = 0, months = 0, days = 0) => {
    const today = new Date();
    const dobDate = new Date(
      today.getFullYear() - Number(years || 0),
      today.getMonth() - Number(months || 0),
      today.getDate() - Number(days || 0)
    );

    setDob(dobDate);
  };

  useEffect(() => {
    if (ageLastEdited !== 'age') return;
    if (ageYears || ageMonths || ageDays) {
      calculateDOB(ageYears, ageMonths, ageDays);
    }
  }, [ageYears, ageMonths, ageDays, ageLastEdited]);

  useEffect(() => {
    if (ageLastEdited !== 'dob') return;
    if (dob instanceof Date && !Number.isNaN(dob.getTime())) {
      calculateAge(dob);
    }
  }, [dob, ageLastEdited]);

  const calculateAge = (dobDate) => {
    const today = new Date();

    let years = today.getFullYear() - dobDate.getFullYear();
    let months = today.getMonth() - dobDate.getMonth();
    let days = today.getDate() - dobDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    setAgeYears(String(years));
    setAgeMonths(String(months));
    setAgeDays(String(days));
  };

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate) {
        if (!collectionDateTime) {
          const newDate = new Date(selectedDate);
          const now = new Date();
          newDate.setHours(now.getHours(), now.getMinutes());
          setCollectionDateTime(newDate);
        } else {
          const updated = new Date(collectionDateTime);
          updated.setFullYear(selectedDate.getFullYear());
          updated.setMonth(selectedDate.getMonth());
          updated.setDate(selectedDate.getDate());
          setCollectionDateTime(updated);
        }
        setShowTimePicker(true);
      }
    } else {
      // For iOS, update temp date
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const onIOSDateConfirm = () => {
    if (tempDate) {
      if (!collectionDateTime) {
        const newDate = new Date(tempDate);
        const now = new Date();
        newDate.setHours(now.getHours(), now.getMinutes());
        setCollectionDateTime(newDate);
      } else {
        const updated = new Date(collectionDateTime);
        updated.setFullYear(tempDate.getFullYear());
        updated.setMonth(tempDate.getMonth());
        updated.setDate(tempDate.getDate());
        setCollectionDateTime(updated);
      }
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
  };

  const onChangeTime = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (selectedTime && collectionDateTime) {
        const now = new Date();
        const selectedDateTime = new Date(selectedTime);

        if (
          collectionDateTime &&
          collectionDateTime.toDateString() === now.toDateString()
        ) {
          if (
            selectedDateTime.getHours() < now.getHours() ||
            (selectedDateTime.getHours() === now.getHours() &&
              selectedDateTime.getMinutes() < now.getMinutes())
          ) {
            Alert.alert("Invalid Time", "Cannot select past time for today");
            return;
          }
        }

        const updated = new Date(collectionDateTime);
        updated.setHours(selectedTime.getHours());
        updated.setMinutes(selectedTime.getMinutes());
        setCollectionDateTime(updated);
      } else if (selectedTime && !collectionDateTime) {
        const newDate = new Date();
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setCollectionDateTime(newDate);
      }
    } else {
      // For iOS, update temp time
      if (selectedTime) {
        setTempTime(selectedTime);
      }
    }
  };

  const onIOSTimeConfirm = () => {
    if (tempTime && collectionDateTime) {
      const now = new Date();
      const selectedDateTime = new Date(tempTime);

      if (
        collectionDateTime &&
        collectionDateTime.toDateString() === now.toDateString()
      ) {
        if (
          selectedDateTime.getHours() < now.getHours() ||
          (selectedDateTime.getHours() === now.getHours() &&
            selectedDateTime.getMinutes() < now.getMinutes())
        ) {
          Alert.alert("Invalid Time", "Cannot select past time for today");
          setShowTimePicker(false);
          return;
        }
      }

      const updated = new Date(collectionDateTime);
      updated.setHours(tempTime.getHours());
      updated.setMinutes(tempTime.getMinutes());
      setCollectionDateTime(updated);
      setShowTimePicker(false);
    } else if (tempTime && !collectionDateTime) {
      const newDate = new Date();
      newDate.setHours(tempTime.getHours());
      newDate.setMinutes(tempTime.getMinutes());
      setCollectionDateTime(newDate);
      setShowTimePicker(false);
    }
  };

  const handleSearchPincode = async () => {
    try {
      if (!pincode || pincode.length !== 6) {
        Alert.alert("Invalid", "Please enter valid 6 digit pincode");
        return;
      }

      const response = await getFullLocation(pincode);

      console.log("location", response?.data);

      const locations = response?.data || [];
      setPincodeResponse(locations);

      if (locations.length > 0) {
        const first = locations[0];
        setCity(first);
        setDistrict(first);
        setState(first);
        setCountry(first?.CountryName || "India");
      } else {
        setCity(null);
        setDistrict(null);
        setState(null);
        Alert.alert("Not found", "No location found for this pincode");
      }
    } catch (error) {
      console.log("location error", error);
      Alert.alert("Error", error?.message || "Failed to fetch location");
    }
  };



  const GetReferedLabList = async () => {
    try {
      const response = await referLabList();
      console.log('Refer Lab List:', response);
    } catch (error) {
      console.error('Error fetching refer lab list:', error);
    }
  };

  const getInvestigationList = async (query) => {
    console.log('Fetching investigation list for query:', query);
    try {
      const response = await searchInvestigation(query);
      console.log('Investigation List:', response);
    } catch (error) {
      console.error('Error fetching investigation list:', error);
    }
  };



  const formatDateTime = (dateTime) => {
    if (!dateTime || !(dateTime instanceof Date)) return '- Collection Date Time -';

    const dd = String(dateTime.getDate()).padStart(2, '0');
    const mm = String(dateTime.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dateTime.getFullYear());
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const hours24 = dateTime.getHours();
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const hh = String(hours12).padStart(2, '0');

    // Example: 26/05/2026 09:15 AM
    return `${dd}/${mm}/${yyyy} ${hh}:${minutes} ${period}`;
  };

  return (
    <SafeAreaView style={themed.screen}>
      <ScrollView style={tw`p-2 mb-15`}>
        <CenterInfo />
        {/* patient information */}
        <View style={[themed.card, themed.childScreen, themed.cardPadding]}>
          <Text style={styles.patientInfoText}>Patient Info:</Text>
          <View style={tw`flex flex-row justify-between items-center gap-1 mb-3`}>
            <View style={tw`flex flex-col gap-1 w-[25%]`}>
              <View style={tw`flex flex-row items-center`}>
                <Text style={themed.inputLabel}>Title</Text>
                <Text style={tw`text-red-500  -mt-2`}>*</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectTitleModal(true)}
                style={[themed.inputBox, themed.inputText]}
              >
                <Text style={themed.inputText}>
                  {selectedTitle || "Mr."}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={tw`flex flex-col py-0.5 gap-1 w-[74%]`}>
              <View style={tw`flex flex-row items-center`}>
                <Text style={themed.inputLabel}>Name</Text>
                <Text style={tw`text-red-500  -mt-2`}>*</Text>
              </View>
              <TextInput
                value={firstName}
                onChangeText={(text) => {
                  // Allow only letters + space, max 50 chars
                  const filtered = text.replace(/[^a-zA-Z ]/g, '').slice(0, 50)
                  setFirstName(filtered)
                }}
                style={[themed.inputBox, themed.inputText]}
                autoCapitalize="words"
                placeholder='Name'
                placeholderTextColor={themed.inputPlaceholder}
                keyboardType='default'
              />
              {/* {error&&<Text style={tw`text-red-500`}>Enter Name</Text>} */}
            </View>
          </View>

          <View style={tw`flex flex-row justify-between items-center gap-1`}>
            <View style={tw`flex flex-col py-0.5  w-[20%]`}>
              <Text style={themed.inputLabel}>Age Y</Text>
              <TextInput
                value={ageYears}
                onChangeText={(text) => {
                  setAgeLastEdited('age');
                  let numeric = text.replace(/[^0-9]/g, '')
                  let num = Number(numeric)
                  if (numeric === '') {
                    setAgeYears('')
                  } else if (num < 200) {
                    setAgeYears(String(num))
                  }
                }}
                style={[themed.inputBox, themed.inputText]}
                placeholder='0'
                placeholderTextColor={colors.placeholder}
                keyboardType='numeric'
              />
            </View>
            <View style={tw`flex flex-col py-0.5  w-[20%]`}>
              <Text style={themed.inputLabel}>Age M</Text>
              <TextInput
                value={ageMonths}
                onChangeText={(text) => {
                  setAgeLastEdited('age');
                  let numeric = text.replace(/[^0-9]/g, '')
                  let num = Number(numeric)
                  if (numeric === '') {
                    setAgeMonths('')
                  } else if (num <= 12) {
                    setAgeMonths(String(num))
                  }
                }}
                style={[themed.inputBox, themed.inputText]}
                placeholder='00'
                placeholderTextColor={colors.placeholder}
                keyboardType='numeric'
                maxLength={2}
              />
            </View>
            <View style={tw`flex flex-col py-0.5  w-[20%]`}>
              <Text style={themed.inputLabel}>Age D</Text>
              <TextInput
                value={ageDays}
                onChangeText={(text) => {
                  setAgeLastEdited('age');
                  let numeric = text.replace(/[^0-9]/g, '')
                  let num = Number(numeric)
                  if (numeric === '') {
                    setAgeDays('')
                  } else if (num <= 31) {
                    setAgeDays(String(num))
                  }
                }}
                style={[themed.inputBox, themed.inputText]}
                placeholder='12'
                placeholderTextColor={colors.placeholder}
                keyboardType='numeric'
                maxLength={2}
              />
            </View>
            <View style={tw`flex flex-col py-0.5  w-[30%]`}>
              <View style={tw`flex flex-row items-center`}>
                <Text style={themed.inputLabel}>DOB</Text>
                <Text style={tw`text-red-500  -mt-2`}>*</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPicker(true)}>
                <TextInput
                  value={dob ? dob.toLocaleDateString() : ''}
                  editable={false}
                  pointerEvents="none"
                  placeholder="D/MM/YYYY"
                  placeholderTextColor={themed.inputPlaceholder}
                  style={[themed.inputBox, themed.inputText]}
                />
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={dob || new Date()}
                  mode="date"
                  display="default"
                  onChange={onChangeDate1}
                />
              )}
            </View>
          </View>

          <View style={tw`my-3`}>
            <RadioButton.Group
              onValueChange={value => setGender(value)}
              value={gender}
            >
              <View style={tw`flex flex-row items-center`}>
                <Text style={themed.inputLabel}>Gender</Text>
                <Text style={tw`text-red-500  -mt-2`}>*</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <TouchableOpacity
                  style={[tw`flex-row items-center mr-4`]}
                  onPress={() => setGender('MALE')}
                  activeOpacity={0.8}
                >
                  <RadioButton.Android value="MALE" />
                  <Text style={[themed.inputText, tw`ml-1`]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-row items-center mr-4`}
                  onPress={() => setGender('FEMALE')}
                  activeOpacity={0.8}
                >
                  <RadioButton.Android value="FEMALE" />
                  <Text style={[themed.inputText, tw`ml-1`]}>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-row items-center`}
                  onPress={() => setGender('OTHER')}
                  activeOpacity={0.8}
                >
                  <RadioButton.Android value="OTHER" />
                  <Text style={[themed.inputText, tw`ml-1`]}>Other</Text>
                </TouchableOpacity>
              </View>
            </RadioButton.Group>
          </View>

          <View style={tw`mt-2`}>
            <View style={tw`flex-row items-end `}>
              <View style={tw`flex-1 `}>
                <Text style={themed.inputLabel}>Referred Doctor</Text>
                <TouchableOpacity
                  onPress={() => setReferDoctorModal(true)}
                  style={[
                    themed.inputBox,
                    tw`mt-1 mb-3 flex-row justify-between items-center `
                  ]}
                >
                  <Text
                    style={[themed.inputText, tw`flex-1 mr-2`]}
                    numberOfLines={1}
                  >
                    {selectedReferDoctor ? selectedReferDoctor.name : '- Select Doctor -'}
                  </Text>

                  <Icon name="chevron-down" size={18} color="gray" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setAddReferDoctorModal(true)}
                style={[
                  themed.addButton,
                  tw`mb-3  flex-0.2 items-center justify-center  ml-2`
                ]}
              >
                <Text style={styles.buttonTextAdd}>+</Text>
              </TouchableOpacity>
            </View>

            {/* <View style={tw`w-full`}>
              <Text style={themed.inputLabel}>Referred Lab</Text>

              <TouchableOpacity
                onPress={() => setReferLabListModal(true)}
                style={[
                  styles.dropDownButton,
                  tw`mt-1 mb-3 flex-row justify-between items-center`
                ]}
              >
                <Text
                  style={[styles.insideDropDownText, tw`flex-1 mr-2`]}
                  numberOfLines={1}
                >
                  {selectedReferLab ? selectedReferLab.outSourceLab : 'Select Refer Lab'}
                </Text>

                <Icon name="chevron-down" size={18} color="gray" />
              </TouchableOpacity>
            </View> */}
          </View>

          <View style={tw`mt-1 flex flex-row justify-center items-center gap-2`}>
            {/* <View style={tw`flex flex-col py-0.5 gap-1 w-[48%]`}>
              <View style={tw`flex flex-row items-center`}>
                <Text style={themed.inputLabel}>Contact No (Self)</Text>
                <Text style={tw`text-red-500  -mt-2`}>*</Text>
              </View>
              <TextInput
                value={contactNumber}
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9]/g, '').slice(0, 10)
                  setContactNumber(numeric)
                }}
                style={styles.inputBox}
                placeholder='8991212131'
                placeholderTextColor={colors.placeholder}
                keyboardType='numeric'
                maxLength={10}
              />
            </View> */}
            {/* <View style={tw`flex flex-col py-0.5 gap-1 w-[48%]`}>
              <Text style={themed.inputLabel}>Email</Text>
              <TextInput
                placeholder='test@gmail.com'
                value={email}
                onChangeText={(text) => setEmail(text)}
                style={styles.inputBox}
                placeholderTextColor={colors.placeholder}

              />
            </View> */}
          </View>

          {/* <View style={tw`mt-2`}>
            <Text style={themed.inputLabel}>Address</Text>
            <TextInput
              placeholder="Enter address"
              value={address}
              onChangeText={(text) => setAddress(text)}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.inputBox, tw`h-[80px]`]}
              placeholderTextColor={colors.placeholder}

            />
          </View> */}
          {/* <View style={tw`mt-2`}>
            <Text style={themed.inputLabel}>Pincode</Text>
            <View style={tw`flex-row items-center`}>

              <TextInput
                placeholder="Enter pincode"
                value={pincode}
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '');
                  if (numericText.length <= 6) {
                    setPincode(numericText);
                  }
                }}
                style={[themed.inputBox, themed.inputText, tw`flex-1 mr-2`]}
                placeholderTextColor={themed.inputPlaceholder}
              />
              <TouchableOpacity
                onPress={handleSearchPincode}
                style={[themed.searchButton, tw`px-4 py-3`]}>
                <Text style={themed.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View> */}

          {pincodeResponse?.length > 0 && (
            <View>
              <Text style={[themed.labelText, tw`my-1`]}>City</Text>

              <TouchableOpacity
                onPress={() => setIsCityModal(true)}
                style={[
                  themed.inputBox,
                  themed.inputText,
                  tw`flex-row justify-between items-center`
                ]}
              >
                <Text style={themed.inputText}>
                  {city?.cityName || "Select City"}
                </Text>

                <Text style={themed.inputText}>▼</Text>
              </TouchableOpacity>

              <View style={tw`flex-row gap-2`}>
                <View style={tw`flex-1`}>
                  <Text style={[themed.labelText, tw`my-1`]}>District</Text>
                  <TextInput
                    value={district?.districtName || ""}
                    editable={false}
                    style={[themed.inputBox, themed.inputText]}
                  />
                </View>

                <View style={tw`flex-1`}>
                  <Text style={[themed.labelText, tw`my-1`]}>State</Text>
                  <TextInput
                    value={state?.stateName || ""}
                    editable={false}
                    style={[themed.inputBox, themed.inputText]}
                  />
                </View>
              </View>

              <View style={tw`mt-2`}>
                <Text style={[themed.labelText, tw`my-1`]}>Country</Text>
                <TextInput
                  value={country || "India"}
                  editable={false}
                  style={[themed.inputBox, themed.inputText]}
                />
              </View>
            </View>
          )}


          {/* <View style={tw`mt-2`}>
            <Text style={themed.inputLabel}>Medical history</Text>
            <TextInput
              placeholder="history"
              value={medicalHistory}
              onChangeText={(text) => setMedicalHistory(text)}
              multiline={true}
              numberOfLines={2}
              textAlignVertical="top"
              style={[styles.inputBox, tw`h-[60px]`]}
              placeholderTextColor={colors.placeholder}

            />
          </View> */}

          <View style={tw`my-3`}>
            <View>
              <Text style={[{ fontWeight: 'bold', marginBottom: 5 }, themed.labelText]}>
                Visit type
              </Text>

              <RadioButton.Group
                onValueChange={value => setVisitype(value)}
                value={vistType}
              >

                <View style={tw`flex-row items-center`}>

                  {/* <TouchableOpacity
                    style={tw`flex-row items-center mr-5`}
                    onPress={() => setVisitype('Clinic Visit')}
                   >
                    <RadioButton.Android value="Clinic Visit" />
                    <Text style={[themed.inputText]}>Clinic Visit</Text>
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={tw`flex-row items-center`}
                    onPress={() => setVisitype('Home Collection')}
                  >
                    <RadioButton.Android value="Home Collection" />
                    <Text style={[themed.inputText]}>Home Collection</Text>
                  </TouchableOpacity>

                </View>

              </RadioButton.Group>
            </View>

            {vistType === "Home Collection" && (
              <View style={tw`flex flex-col justify-center items-center gap-2 mt-1`}>
                {/* <View style={tw`flex-1  w-full`}>
                  <Text style={themed.inputLabel}>Field Boy</Text>
                  <TouchableOpacity onPress={() => setFieldBoyModal(true)} style={[themed.inputBox, tw` p-3 mb-3 mt-1`]}>
                    <Text style={[themed.inputText]}>{selectedFieldBoy ? selectedFieldBoy.fieldBoyName : 'Select Field Boy'}</Text>
                  </TouchableOpacity>
                </View> */}

                <View style={tw`flex-1 w-full`}>
                  <Text style={themed.inputLabel}>Collection Date Time</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setTempDate(collectionDateTime || new Date());
                      setShowDatePicker(true);
                    }}
                    style={[themed.inputBox, tw` p-3  mb-3 mt-1`]}
                  >
                    <Text style={[themed.inputText]}>{formatDateTime(collectionDateTime)}</Text>
                  </TouchableOpacity>

                  {/* ================= DATE PICKER ================= */}
                  {showDatePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={collectionDateTime || new Date()}
                      mode="date"
                      display="default"
                      onChange={onChangeDate}
                      minimumDate={new Date()}
                    />
                  )}

                  {/* iOS DATE MODAL */}
                  {showDatePicker && Platform.OS === 'ios' && (
                    <Modal transparent animationType="slide">
                      <View style={tw`flex-1 justify-end bg-black/40`}>
                        <View style={tw`bg-white p-4 rounded-t-3xl`}>
                          <View style={tw`flex-row justify-between items-center mb-4`}>
                            <Text style={tw`font-bold text-base`}>Select Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                              <Text style={{ color: 'red', fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                          </View>

                          <DateTimePicker
                            value={tempDate || new Date()}
                            mode="date"
                            display="spinner"
                            onChange={(event, selectedDate) => {
                              if (selectedDate) {
                                setTempDate(selectedDate);
                              }
                            }}
                            minimumDate={new Date()}
                            style={{ height: 150 }}
                          />

                          <TouchableOpacity
                            onPress={onIOSDateConfirm}
                            style={tw`bg-blue-500 p-3 rounded-xl mt-3`}
                          >
                            <Text style={tw`text-white text-center font-bold`}>
                              Confirm Date
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Modal>
                  )}

                  {/* ================= TIME PICKER ================= */}
                  {showTimePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={collectionDateTime || new Date()}
                      mode="time"
                      display="default"
                      onChange={(event, selectedTime) => {
                        if (!selectedTime) {
                          setShowTimePicker(false);
                          return;
                        }
                        const now = new Date();
                        const selectedDateTime = new Date(selectedTime);
                        if (
                          collectionDateTime &&
                          collectionDateTime.toDateString() === now.toDateString()
                        ) {
                          if (
                            selectedDateTime.getHours() < now.getHours() ||
                            (selectedDateTime.getHours() === now.getHours() &&
                              selectedDateTime.getMinutes() < now.getMinutes())
                          ) {
                            Alert.alert("Invalid Time", "Cannot select past time for today");
                            setShowTimePicker(false);
                            return;
                          }
                        }
                        onChangeTime(event, selectedTime);
                      }}
                    />
                  )}

                  {/* iOS TIME MODAL */}
                  {showTimePicker && Platform.OS === 'ios' && (
                    <Modal transparent animationType="slide">
                      <View style={tw`flex-1 justify-end bg-black/40`}>
                        <View style={tw`bg-white p-4 rounded-t-3xl`}>
                          <View style={tw`flex-row justify-between items-center mb-4`}>
                            <Text style={tw`font-bold text-base`}>Select Time</Text>
                            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                              <Text style={{ color: 'red', fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                          </View>

                          <DateTimePicker
                            value={tempTime || collectionDateTime || new Date()}
                            mode="time"
                            display="spinner"
                            onChange={(event, selectedTime) => {
                              if (selectedTime) {
                                setTempTime(selectedTime);
                              }
                            }}
                            style={{ height: 150 }}
                          />

                          <TouchableOpacity
                            onPress={onIOSTimeConfirm}
                            style={tw`bg-green-500 p-3 rounded-xl mt-3`}
                          >
                            <Text style={tw`text-white text-center font-bold`}>
                              Confirm Time
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Modal>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={[themed.card, themed.childScreen, themed.cardPadding, tw`mt-3`]}>
          <Text style={styles.patientInfoText}>Investigation Details:</Text>

          {/* Search Service */}
          <View style={tw`flex-1`}>
            <View style={tw`flex flex-row items-center`}>
              <Text style={themed.inputLabel}>Search Test</Text>
              <Text style={tw`text-red-500 -mt-2`}>* </Text>
            </View>

            <TouchableOpacity
              onPress={() => setSearchSelectModal(true)}
              style={[themed.inputBox, tw`p-3  mb-3 flex-row items-center justify-start`]}
            >
              <MaterialCommunityIcons name="magnify" size={20} color="gray" style={tw`mr-2`} />
              <Text style={themed.inputText}>
                Search Tests
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`flex-row items-center`}
          >
            {(serviceItem?.Services || [])
              .filter((s) => !isUnderPackage(s))
              .map((s, index) => (
                <View key={`${getServiceItemId(s)}-${index}`} style={tw`mr-2 mb-2 pt-2`}>
                  <View style={tw`relative bg-blue-100 px-3 py-2 rounded-full flex-row items-center`}>
                    <Text
                      numberOfLines={1}
                      style={tw`text-blue-700 text-xs font-medium mr-2`}
                    >
                      {s.ServiceName.replace('\n', ' ').slice(0, 15)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveService(s)}
                      style={tw`ml-1`}
                    >
                      <MaterialCommunityIcons name="close-circle" size={16} color="#ef4444" />
                    </TouchableOpacity>
                    {Number(s?.IsUrgent ?? s?.isUrgent ?? 0) === 1 && (
                      <View style={tw`absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[16px] h-[16px] items-center justify-center px-[3px]`}>
                        <Text style={tw`text-white text-[9px] font-bold`}>U</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
          </ScrollView>

          <View style={tw`flex-row items-center mt-1`}>
            <Checkbox
              status={addBarcode ? 'checked' : 'unchecked'}
              disabled={true}
              color={themed.checkboxColor}
              uncheckedColor={themed.checkboxUncheckedColor}
              style={themed.checkbox}
            />
            <Text style={themed.mutedText}>
              Add Barcode & Test Remark on save
            </Text>
          </View>
        </View>

        {netAmount > 0 && (
          <View style={[themed.card, themed.childScreen, themed.cardPadding, tw`mt-3`]}>
            {/* Toggle Header for Billing Info */}
            <TouchableOpacity
              onPress={() => setShowBillingInfo(!showBillingInfo)}
              activeOpacity={0.7}
              style={tw`flex-row justify-between items-center mb-3`}
            >
              <Text style={styles.patientInfoText}>Billing Info:</Text>
              <MaterialIcons
                style={[
                  tw`rounded-full p-1`,
                  themed.modalCloseButton,
                ]}
                name={showBillingInfo ? "expand-less" : "expand-more"}
                size={20}
                color={themed.chevronColor}
              />
            </TouchableOpacity>

            {showBillingInfo && (
              <>
                <View style={tw`flex-row items-center gap-2.5`}>
                  {/* Gross Amount */}
                  <View style={tw`w-[30%] mr-1`}>
                    <Text style={themed.inputLabel}>Gross Amount</Text>
                    <TextInput
                      editable={false}
                      value={grossAmount ? String(grossAmount) : ""}
                      style={[themed.inputBox, themed.inputText]}
                      placeholder=''
                    />
                  </View>

                  {/* Discount % */}
                  <View style={tw`w-[30%] mx-1`}>
                    <Text style={themed.inputLabel}>Disc (%)</Text>
                    <TextInput
                      value={discountPercent ? String(discountPercent) : ""}
                      keyboardType="numeric"
                      onChangeText={(txt) => {
                        setDiscountLastEdited('percent');
                        const cleaned = txt.replace(/[^0-9.]/g, '');
                        const num = cleaned === '' ? 0 : Number(cleaned);
                        setDiscountPercent(num);
                      }}
                      style={[themed.inputBox, themed.inputText]}
                      placeholder='%'
                      placeholderTextColor={themed.inputPlaceholder}

                    />
                  </View>

                  {/* Discount Amount */}
                  <View style={tw`w-[30%] ml-1`}>
                    <Text style={themed.inputLabel}>Disc Amt</Text>
                    <TextInput
                      value={discountAmount ? String(discountAmount) : ""}
                      keyboardType="numeric"
                      onChangeText={(txt) => {
                        setDiscountLastEdited('amount');
                        const cleaned = txt.replace(/[^0-9.]/g, '');
                        const num = cleaned === '' ? 0 : Number(cleaned);
                        setDiscountAmount(num);
                      }}
                      style={[themed.inputBox, themed.inputText]}
                    />
                  </View>
                </View>

                <View style={tw`flex-row items-center gap-2.5 mt-2`}>
                  {/* Round off Amount */}
                  <View style={tw`w-[30%] mr-1`}>
                    <Text style={themed.inputLabel}>Round off</Text>
                    <TextInput
                      editable={false}
                      value={String(roundOff || 0)}
                      keyboardType="numeric"
                      style={[themed.inputBox, themed.inputText]}
                      placeholder='0'
                      placeholderTextColor={themed.inputPlaceholder}
                    />
                  </View>

                  {/* Net Amount */}
                  <View style={tw`w-[30%] mx-1`}>
                    <Text style={themed.inputLabel}>Net Amount</Text>
                    <TextInput
                      value={netAmount ? String(netAmount) : ""}
                      editable={false}
                      style={[themed.inputBox, themed.inputText]}
                      placeholder='120'
                      placeholderTextColor={themed.inputBox}

                    />
                  </View>

                  {/* Balance Amount */}
                  <View style={tw`w-[30%] ml-1`}>
                    <Text style={themed.inputLabel}>Balance Amt</Text>
                    <TextInput
                      value={balanceAmount ? String(balanceAmount) : 0}
                      editable={false}
                      style={[themed.inputBox, themed.inputText]}
                      placeholder='Avl Bal'
                      placeholderTextColor={themed.inputPlaceholder}

                    />
                  </View>
                </View>

                {/* discount reason section */}
                <View style={tw`flex-row items-center gap-2.5 mt-2`}>
                  {/* Discount approved by */}
                  <View style={tw`w-[30%] mr-1`}>
                    <Text numberOfLines={1} style={themed.inputLabel}>Dis Approved by</Text>
                    <TouchableOpacity
                      onPress={() => setDiscountApprovalModal(true)}
                      style={[themed.inputBox, tw`flex-row items-center justify-between px-3`,
                      ]} activeOpacity={0.7}>
                      <Text numberOfLines={1} style={[themed.inputText, tw`flex-1`]}>
                        {selectedDiscountApproval?.name || 'Select Approval'}
                      </Text>
                      <Icon name="chevron-down" size={18} color={themed.chevronColor} />
                    </TouchableOpacity>
                  </View>

                  {/* Discount reason */}
                  <View style={tw`w-[30%] mx-1`}>
                    <Text style={themed.inputLabel}>Disc Reason</Text>
                    <TextInput
                      value={discountReason}
                      onChangeText={setDiscountReason}
                      style={[themed.inputBox, themed.inputText]}
                      placeholder='test'
                      placeholderTextColor={themed.inputPlaceholder}

                    />
                  </View>

                  {/* Remark */}
                  <View style={tw`w-[30%] mx-1`}>
                    <Text style={themed.inputLabel}>Remark</Text>
                    <TextInput
                      value={remark}
                      onChangeText={setRemark}
                      style={[themed.inputBox, themed.inputText]}
                      placeholder='Remark'
                      placeholderTextColor={themed.inputPlaceholder}

                    />
                  </View>
                </View>
              </>
            )}
          </View>
        )}
        {netAmount > 0 && (
          < PaymentInfo
            netAmount={netAmount}
            cash={cash}
            setCash={setCash}
            debitCardAmt={debitCardAmt}
            setDebitCardAmt={setDebitCardAmt}
            chequeAmt={chequeAmt}
            setChequeAmt={setChequeAmt}
            neftrtgsAmt={neftrtgsAmt}
            setNeftRtgsAmt={setNeftRtgsAmt}
            payTmAmt={payTmAmt}
            setPayTm={setPayTm}
            phonePayAmt={phonePayAmt}
            setPhonePayAmt={setPhonePayAmt}
            selectedBank={selectedBank}
            openBankModal={() => setBankModal(true)}
            setSelectedBank={setSelectedBank}
            chequeRefrence={chequeRefrence}
            setChequeRefrence={setChequeRefrence}
            neftRefrence={neftRefrence}
            setNeftReference={setNeftReference}
            paytmRefrence={paytmRefrence}
            setPaytmRefrence={setPaytmRefrence}
            phonePayReference={phonePayReference}
            setPhonePayReference={setPhonePayReference}
            debitCardReference={debitCardReference}
            setDebitCardReference={setDebitCardReference}
            parseMoney={parseMoney}
            onPaymentChange={setPaymentData}
            onBalanceChange={setBalanceAmount}
            onReceiptAmountChange={setReceiptAmount}
          />
        )}


        <TouchableOpacity
          onPress={handleSavePatient}
          style={[
            styles.saveButton,
            tw`flex-row justify-center items-center `,
            (!serviceItem?.Services?.length) && tw`bg-gray-400 opacity-50`
          ]}
          disabled={loading || !serviceItem?.Services?.length}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="save" size={18} color="#fff" style={tw`mr-2`} />
              <Text style={styles.saveButtonText}>Save Patient</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Barcode + remark modal (shown only when addBarcode is enabled) */}
        <AddBarcodePatientRegistration
          visible={barcodeModalVisible}
          onClose={() => setBarcodeModalVisible(false)}
          onSave={handleBarcodeModalSave}
          themed={themed}
          groups={groupedServicesForBarcode()}
          groupBarcodeDraft={groupBarcodeDraft}
          setGroupBarcodeDraft={setGroupBarcodeDraft}
          barcodeDraft={barcodeDraft}
          setBarcodeDraft={setBarcodeDraft}
          sampleGroupExpanded={sampleGroupExpanded}
          setSampleGroupExpanded={setSampleGroupExpanded}
          remarkExpanded={remarkExpanded}
          setRemarkExpanded={setRemarkExpanded}
          setBarcodeForServiceIds={setBarcodeForServiceIds}
        />

        {/* refer doctor modal */}
        <Modal
          visible={refrDoctrorModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setReferDoctorModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setReferDoctorModal(false)}>
            <View style={[themed.modalOverlay]}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={[themed.modalContainer2, tw` rounded-t-2xl w-full h-[70%] p-4`]}>
                  <ReferDoctor
                    onSelectDoctor={(doctor) => {
                      setSelectedReferDoctor(doctor);
                    }}
                    onClose={() => setReferDoctorModal(false)}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Add refer doctor modal */}
        <Modal
          visible={addreferDoctorModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setAddReferDoctorModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setAddReferDoctorModal(false)}>
            <View style={[themed.modalOverlay]}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={[themed.modalContainer, tw` rounded-t-2xl w-full   p-4`]}>
                  <AddReferDoctor
                    onClose={() => { setAddReferDoctorModal(false), referDoctorList() }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* doctor list modal */}
        <Modal
          visible={doctorlistModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDoctorListModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setDoctorListModal(false)}>
            <View style={tw`flex-1 justify-end bg-black/50`}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={tw`bg-white w-full h-[70%] rounded-t-2xl p-4`}>
                  <DoctorList
                    onSelectDoctor={(doctor) => {
                      setSelectedDoctorList(doctor);
                      setDoctorListModal(false);
                    }}
                    onClose={() => setDoctorListModal(false)}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* refer lab Modal */}
        <Modal
          visible={referLabListModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setReferLabListModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setReferLabListModal(false)}>
            <View style={tw`flex-1 justify-end bg-black/50`}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={tw`bg-white px-4 rounded-t-3xl w-full h-[70%]`}>
                  <View style={tw`flex-1`}>
                    <View style={tw`items-center pt-2 pb-1`}>
                      <View style={tw`w-12 h-1 bg-gray-300 rounded-full`} />
                    </View>
                    <ReferLab
                      onSelectDoctor={(doctor) => {
                        setSelectedReferLab(doctor);
                      }}
                      onClose={() => setReferLabListModal(false)}
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* search select modal */}
        <Modal
          visible={searchSelectModal}
          transparent
          animationType="slide"
          onRequestClose={() => setSearchSelectModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setSearchSelectModal(false)}>
            <View style={tw`flex-1 justify-end bg-black/40`}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={tw`bg-white w-full h-[70%] rounded-t-3xl overflow-hidden`}>
                  <SearchSelectService onClose={() => setSearchSelectModal(false)} />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Field boy modal */}
        <Modal
          visible={fieldBoyModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setFieldBoyModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setFieldBoyModal(false)}>
            <View style={tw`flex-1 justify-end bg-black/50`}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={tw`bg-white rounded-t-3xl w-full h-[60%] p-4`}>
                  <View style={tw`w-12 h-1 bg-gray-300 self-center mb-3 rounded-full`} />
                  <View style={tw`flex-1`}>
                    <FieldBoy
                      onSelectFieldBoy={setSelectedFieldBoy}
                      onClose={() => setFieldBoyModal(false)}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setFieldBoyModal(false)}
                    style={tw`bg-purple-500 py-4 rounded-xl mt-2`}
                  >
                    <Text style={tw`text-white text-center font-semibold`}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* title modal */}
        <BottomModal
          visible={selectTitleModal}
          onClose={() => setSelectTitleModal(false)}
        >
          <SelectTitle
            onClose={() => setSelectTitleModal(false)}
            onSelectTitle={(item) => {
              setSelectedTitle(item);
              setSelectTitleModal(false);
            }}
          />
        </BottomModal>

        {/* bank Modal */}
        <Modal
          visible={bankModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setBankModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setBankModal(false)}>
            <View style={tw`flex-1 justify-end bg-black/50`}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={tw`bg-white rounded-t-3xl w-full h-[60%] p-4`}>
                  <View style={tw`w-12 h-1 bg-gray-300 self-center mb-3 rounded-full`} />
                  <View style={tw`flex-1`}>
                    <SelectBank
                      onSelectBankItem={setSelectedBank}
                      onClose={() => setBankModal(false)}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setBankModal(false)}
                    style={tw`bg-purple-500 py-4 rounded-xl mt-2`}
                  >
                    <Text style={tw`text-white text-center font-semibold`}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* city modal */}
        <Modal
          visible={isCityModal}
          transparent
          animationType="slide"
          onRequestClose={() => setIsCityModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsCityModal(false)}>
            <View style={tw`flex-1 bg-black/50 justify-end`}>

              <TouchableWithoutFeedback>
                <View style={[themed.childScreen, tw`rounded-t-3xl p-4 max-h-[80%]`]}>

                  {/* Header */}
                  <View style={tw`flex-row justify-between items-center mb-3`}>
                    <Text style={[themed.inputText, tw`text-lg font-semibold`]}>
                      Select City
                    </Text>

                    <TouchableOpacity onPress={() => setIsCityModal(false)}>
                      <Text style={themed.chevronColor}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* City List */}
                  <ScrollView>
                    {pincodeResponse.map((item, index) => (
                      <TouchableOpacity
                        key={`${item.cityCode}-${index}`}
                        onPress={() => {
                          setCity(item);
                          setDistrict(item);
                          setState(item);
                          setCountry("India");
                          setIsCityModal(false);
                        }}
                        style={[
                          themed.inputBox,
                          tw`mb-2`,
                          city?.cityCode === item.cityCode && tw`border-blue-500`
                        ]}
                      >
                        <Text style={themed.inputText}>
                          {item.cityName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                </View>
              </TouchableWithoutFeedback>

            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Approval discount modal */}
        <Modal
          visible={discountApprovalModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDiscountApprovalModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setDiscountApprovalModal(false)}>
            <View style={[themed.modalOverlay]}>
              <TouchableWithoutFeedback onPress={() => { }}>
                <View style={[themed.modalContainer, tw` rounded-t-2xl w-full h-100 `]}>
                  <SelectApproval
                    loginBranchId={loginBranchId}
                    onClose={() => setDiscountApprovalModal(false)}
                    onSelectedApproval={(item) => {
                      setSelectedDiscountApproval(item);
                      setDiscountApprovalId(item?.id || 0);
                    }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const Registration = (props) => <RegistrationScreen {...props} />;

export default Registration;
