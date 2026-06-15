import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import React, { useEffect, useState } from 'react';

import { ScrollView } from 'react-native-gesture-handler';
import tw from 'twrnc';
import Entypo from 'react-native-vector-icons/Entypo';
import { getTestRefundDetails } from './services/searchTestRefund';
import TestRefundDetails from './TestRefundDetails';
import PaymentDetails from './PaymentDetails';
import { useNavigation } from '@react-navigation/native';
import api from '../../../Authorization/api';
import { useTheme } from '../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../utils/themeStyles';
import { useToast } from '../../../Authorization/ToastContext';
import { useAuth } from '../../../Authorization/AuthContext';

const normalizeServiceRow = row => {
    if (!row || typeof row !== 'object') return row;

    return {
        ...row,
        FTDId: row.FTDId ?? row.ftdId,
        ServiceItemId: row.ServiceItemId ?? row.serviceItemId,
        ServiceName: row.ServiceName ?? row.serviceName,
        Qty: row.Qty ?? row.qty,
        Rate: row.Rate ?? row.rate,
        CategoryId: row.CategoryId ?? row.categoryId,
        SubSubCategoryId: row.SubSubCategoryId ?? row.subSubCategoryId,
        GrossAmt: row.GrossAmt ?? row.grossAmt,
        NetAmt: row.NetAmt ?? row.netAmt,
        DiscAmt: row.DiscAmt ?? row.discAmt,
        DiscPer: row.DiscPer ?? row.discPer,
    };
};

const deriveOpdVisitDetailsFromRows = rows => {
    const first = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!first) return [];

    return [
        {
            uniqueId: first.UniqueId ?? first.uniqueId ?? '',
            branchId: first.BranchId ?? first.branchId ?? 0,
            corporateId: first.CorporateId ?? first.corporateId ?? 0,
            insuranceCompanyId:
                first.InsuranceCompanyId ?? first.insuranceCompanyId ?? 0,
            patientId: first.PatientId ?? first.patientId ?? 0,
            referDoctorId: first.ReferDoctorId ?? first.referDoctorId ?? 0,
            uhid: first.UHID ?? first.uhid ?? '',
            currentAge: first.DOB ?? first.DOB ?? '',
            discAprrovedById:
                first.DiscAprrovedById ?? first.discAprrovedById ?? 0,
            discountReason: first.DiscountReason ?? first.discountReason ?? '',
            roundOff: first.RoundOff ?? first.roundOff ?? 0,
            totalDiscAmtOnBill:
                first.TotalDiscAmtOnBill ?? first.totalDiscAmtOnBill ?? 0,
            totalDiscPerOnBill:
                first.TotalDiscPerOnBill ?? first.totalDiscPerOnBill ?? 0,
            remarks: first.Remarks ?? first.remarks ?? '',
            grossBillAmount: first.TotalBillAmount ?? first.grossBillAmount ?? 0,
            netAmount:
                first.TotalPaidAmount ??
                first.netAmount ??
                first.TotalBillAmount ??
                0,
        },
    ];
};

const parseDobToDate = dob => {
    if (!dob) return null;

    const s = String(dob).trim();

    const ddmmyyyy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddmmyyyy) {
        const [, dd, mm, yyyy] = ddmmyyyy;
        const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const yyyymmdd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (yyyymmdd) {
        const [, yyyy, mm, dd] = yyyymmdd;
        const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
};

const formatAgeFromDob = dob => {
    const birth = parseDobToDate(dob);
    if (!birth) return null;

    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
        const prevMonthDays = new Date(
            today.getFullYear(),
            today.getMonth(),
            0,
        ).getDate();

        days += prevMonthDays;
        months -= 1;
    }

    if (months < 0) {
        months += 12;
        years -= 1;
    }

    return `${Math.max(years, 0)}Y ${Math.max(months, 0)}M ${Math.max(
        days,
        0,
    )}D`;
};

const coalesceNonEmptyString = (...vals) => {
    for (const v of vals) {
        if (v === undefined || v === null) continue;
        const s = String(v);
        if (s.trim() !== '') return s;
    }
    return '';
};

const normalizeOpdVisitDetails = (visit, { totalRefundAmount, paymentForm }) => {
    const v = visit && typeof visit === 'object' ? visit : {};
    const amount = totalRefundAmount > 0 ? totalRefundAmount : 0;

    return {
        branchId: Number(v.branchId ?? v.BranchId ?? 0),
        patientId: Number(v.patientId ?? v.PatientId ?? 0),
        uhid: String(v.uhid ?? v.UHID ?? ''),
        currentAge:
            v.currentAge ??
            v.CurrentAge ??
            formatAgeFromDob(v.DOB ?? v.dob) ??
            '',

        corporateId: Number(v.corporateId ?? v.CorporateId ?? 0),
        insuranceCompanyId: Number(
            v.insuranceCompanyId ?? v.InsuranceCompanyId ?? 0,
        ),
        referDoctorId: Number(v.referDoctorId ?? v.ReferDoctorId ?? 0),

        grossBillAmount: Number(amount || v.grossBillAmount || v.TotalBillAmount || 0),
        totalDiscPerOnBill: Number(
            v.totalDiscPerOnBill ?? v.TotalDiscPerOnBill ?? 0,
        ),
        totalDiscAmtOnBill: Number(
            v.totalDiscAmtOnBill ?? v.TotalDiscAmtOnBill ?? 0,
        ),
        discAprrovedById: Number(
            v.discAprrovedById ??
            v.DiscAprrovedById ??
            paymentForm?.refundApprovedBy ??
            0,
        ),
        discountReason: coalesceNonEmptyString(
            v.discountReason,
            v.DiscountReason,
            paymentForm?.refundReason,
        ),
        roundOff: Number(v.roundOff ?? v.RoundOff ?? 0),
        netAmount: Number(amount || v.netAmount || v.TotalPaidAmount || 0),
        remarks: String(paymentForm?.remark ?? v.remarks ?? v.Remarks ?? ''),
        uniqueId: String(v.uniqueId ?? v.UniqueId ?? ''),
    };
};

const TestRefund = () => {
    const { theme } = useTheme();
    const themed = getThemeStyles(theme);
    const { loginBranchId, userId, ipAddress } = useAuth()
    const [refundsParent, setRefundsParent] = useState([]);
    const [searchBox, setSearchBox] = useState(true);
    const [uhid, setUhid] = useState('');
    const [receiptNo, setReceiptNo] = useState('');
    const [billNo, setBillNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [refundLoading, setRefundLoading] = useState(false);
    const [data, setData] = useState([]);
    const [apiData, setApiData] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [refundResponse, setRefundResponse] = useState(null);
    const navigation = useNavigation();
    const GLOBAL_VALUES = {
        hospId: 1,
        branchId: loginBranchId,
        userId: userId,
        ipAddress: ipAddress,
    };

    const [paymentForm, setPaymentForm] = useState({
        cashAmount: '0',
        chequeAmount: '0',
        chequeBankId: '',
        chequeBankName: '',
        chequeRefNo: '',
        refundApprovedBy: '',
        refundReason: '',
        remark: '',
    });

    const { showToast } = useToast();

    const handleSearch = async () => {
        const searchData = {
            uhid: uhid.trim(),
            receiptNo: receiptNo.trim(),
            billNo: billNo.trim(),
        };

        if (!searchData.uhid && !searchData.receiptNo && !searchData.billNo) {
            showToast('Please enter UHID, Receipt No or Bill No', 'warning');
            return;
        }

        try {
            setLoading(true);

            const response = await getTestRefundDetails(searchData);
            setApiData(response);

            const rows = response?.data ?? [];
            const normalized = Array.isArray(rows)
                ? rows.map(normalizeServiceRow)
                : [];

            setData(normalized);

            if (normalized.length > 0) {
                setSearchBox(false);
            } else {
                showToast('No refund data found', 'warning');
            }
        } catch (error) {
            console.log('Refund Error:', error);
            showToast('Something went wrong', 'error');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = refundsParent.reduce(
        (sum, r) => sum + Number(r.RefundAmount || 0),
        0,
    );

    useEffect(() => {
        const net = Number(totalAmount || 0);
        const cheque = Number(paymentForm.chequeAmount || 0);
        const nextCash = String(Math.max(net - cheque, 0));

        if (String(paymentForm.cashAmount ?? '') !== nextCash) {
            setPaymentForm(prev => ({ ...prev, cashAmount: nextCash }));
        }
    }, [totalAmount, paymentForm.chequeAmount]);

    const createRefundPayload = () => {
        const responseRows = apiData?.data ?? [];
        const visitDetails =
            apiData?.opdVisitDetails ??
            apiData?.OPDVisitDetails ??
            apiData?.opdVisitDetail ??
            apiData?.OPDVisitDetail ??
            deriveOpdVisitDetailsFromRows(responseRows);

        const totalRefundAmount = refundsParent.reduce(
            (sum, r) =>
                sum + Number(r?.RefundAmount ?? r?.NetAmt ?? r?.netAmt ?? 0),
            0,
        );

        const opdRefundServices = refundsParent.map(r => {
            const refundQty = Number(r.RefundQty ?? r.refundQty ?? 0);
            const rate = Number(r.Rate ?? r.rate ?? 0);
            const netAmt = Number(r.RefundAmount ?? r.netAmt ?? 0);
            const grossAmt = Number(r.GrossAmt ?? r.grossAmt ?? refundQty * rate);

            return {
                serviceItemId: Number(r.ServiceItemId ?? r.serviceItemId ?? 0),
                subSubCategoryId: Number(
                    r.SubSubCategoryId ?? r.subSubCategoryId ?? 0,
                ),
                categoryId: Number(r.CategoryId ?? r.categoryId ?? 0),
                serviceName: String(r.ServiceName ?? r.serviceName ?? ''),
                ftdId: Number(r.FTDId ?? r.ftdId ?? 0),
                grossAmt,
                netAmt,
                qty: refundQty,
                rate,
                discAmt: Number(r.DiscAmt ?? r.discAmt ?? 0),
                discPer: Number(r.DiscPer ?? r.discPer ?? 0),
                code: String(r.Code ?? r.code ?? ''),
                corporateAlias: String(r.CorporateAlias ?? r.corporateAlias ?? ''),
                corporateCode: String(r.CorporateCode ?? r.corporateCode ?? ''),
                doctorId: Number(r.DoctorId ?? r.doctorId ?? 0),
                isNonPayable: Number(r.IsNonPayable ?? r.isNonPayable ?? 0),
                isUnderPackage: Number(r.IsUnderPackage ?? r.isUnderPackage ?? 0),
                rateListId: Number(r.RateListId ?? r.rateListId ?? 0),
                packageId: Number(r.PackageId ?? r.packageId ?? 0),
            };
        });

        const opdVisitDetails = (
            Array.isArray(visitDetails) ? visitDetails : [visitDetails]
        ).map(v => normalizeOpdVisitDetails(v, { totalRefundAmount, paymentForm }));

        const paymentDetails = [];

        if (Number(paymentForm.cashAmount || 0) > 0) {
            paymentDetails.push({
                paymentModeId: 1,
                paymentModeTypeId: 1,
                amount: Number(paymentForm.cashAmount || 0),
                bankId: 0,
                refNo: '',
            });
        }

        if (Number(paymentForm.chequeAmount || 0) > 0) {
            paymentDetails.push({
                paymentModeId: 2,
                paymentModeTypeId: 2,
                amount: Number(paymentForm.chequeAmount || 0),
                bankId: Number(paymentForm.chequeBankId || 0),
                refNo: String(paymentForm.chequeRefNo || ''),
            });
        }

        return {
            globalValues: GLOBAL_VALUES,
            opdRefundServices,
            opdVisitDetails,
            paymentDetails,
        };
    };

    const goToDashboardHome = () => {
        try {
            navigation.popToTop?.();
        } catch (_e) { }

        try {
            const tabParent = navigation.getParent?.();
            if (tabParent?.navigate) {
                tabParent.navigate('Dashboard', { screen: 'DashboardHome' });
                return;
            }
        } catch (_e) { }

        try {
            navigation.navigate('DashboardHome');
        } catch (_e) { }
    };

    const showRefundSuccessModal = (result) => {
        setRefundResponse(result);
        setShowSuccessModal(true);
    };

    const handleViewReceipt = () => {
        setShowSuccessModal(false);
        navigation.navigate('Test Refund Receipts', {
            result: refundResponse,
        });
    };

    const handleOkPress = () => {
        setShowSuccessModal(false);
        goToDashboardHome();
    };

    const handleFinalRefund = async () => {
        if (refundsParent.length === 0) {
            showToast('Please select test for refund', 'warning');
            return;
        }
        const payload = createRefundPayload();

        if (payload.paymentDetails.length === 0) {
            showToast('Please enter refund payment amount', 'warning');
            return;
        }
        const paymentTotal = payload.paymentDetails.reduce(
            (sum, p) => sum + Number(p.amount || 0),
            0,
        );
        const refundTotal = payload.opdRefundServices.reduce(
            (sum, s) => sum + Number(s.netAmt || 0),
            0,
        );
        if (payload.opdVisitDetails[0].discAprrovedById < 0) {
            showToast("Select Refund Approved BY", 'warning')
            return;
        }
        if (!payload.opdVisitDetails[0].discountReason) {
            showToast("Enter Valid Reason", 'warning')
            return;
        }

        if (paymentTotal !== refundTotal) {
            showToast('Payment amount and refund amount must be same', 'warning');
            return;
        }

        try {
            setRefundLoading(true);
            const response = await api.post(`OPDRefund/save-opd-refund`, payload);
            const result = response?.data;
            console.log('Refund API Response:', result);
            // showToast(result?.message || 'Refund saved successfully', 'success');
            showRefundSuccessModal(true);
            setRefundResponse(result)

        } catch (error) {
            console.log('Refund API Error:', error);
            showToast('Server error while saving refund', 'error');
        } finally {
            setRefundLoading(false);
        }
    };

    return (
        <View style={[themed.screen, tw`flex-1`]}>
            <ScrollView style={tw`flex-1`}>
                <View
                    style={[
                        themed.border,
                        themed.childScreen2,
                        tw`p-4 mt-1`,
                    ]}>
                    <TouchableOpacity
                        onPress={() => setSearchBox(!searchBox)}
                        style={tw`flex-row justify-between items-center`}>
                        <Text style={[themed.labelText]}>Search</Text>

                        <Entypo
                            style={[tw`rounded-full p-1`, themed.modalCloseButton]}
                            name={searchBox ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={themed.chevronColor}
                        />
                    </TouchableOpacity>

                    {searchBox && (
                        <View>
                            <View style={tw`flex-row gap-2`}>
                                <View style={tw`flex-1`}>
                                    <Text style={[themed.labelText, tw`my-1`]}>UHID</Text>
                                    <TextInput
                                        value={uhid}
                                        onChangeText={setUhid}
                                        placeholder="Enter UHID"
                                        placeholderTextColor={themed.inputPlaceholder}
                                        autoCapitalize="characters"
                                        style={[themed.inputBox, themed.inputText]}
                                    />
                                </View>

                                <View style={tw`flex-1`}>
                                    <Text style={[themed.labelText, tw`my-1`]}>Receipt No</Text>
                                    <TextInput
                                        value={receiptNo}
                                        onChangeText={setReceiptNo}
                                        placeholder="Enter Receipt No"
                                        placeholderTextColor={themed.inputPlaceholder}
                                        autoCapitalize="characters"
                                        style={[themed.inputBox, themed.inputText]}
                                    />
                                </View>
                            </View>

                            <View style={tw`flex-row mt-2 items-end gap-2`}>
                                <View style={tw`flex-1`}>
                                    <Text style={[themed.labelText, tw`my-1`]}>Bill No</Text>
                                    <TextInput
                                        value={billNo}
                                        onChangeText={setBillNo}
                                        placeholder="Enter Bill No"
                                        placeholderTextColor={themed.inputPlaceholder}
                                        autoCapitalize="characters"
                                        style={[themed.inputBox, themed.inputText]}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleSearch}
                                    disabled={loading}
                                    style={[
                                        themed.searchButton,
                                        tw`justify-center items-center px-5 h-12 min-w-[110px] rounded-lg`,
                                        loading && tw`opacity-60`,
                                    ]}>
                                    {loading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text style={themed.searchButtonText}>Search</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {data?.length > 0 && (
                    <View
                        style={[
                            themed.childScreen2,
                            { flex: 0 },
                            themed.border,
                            tw`mt-2`,
                        ]}>
                        <TestRefundDetails
                            data={data}
                            onRefundsUpdate={setRefundsParent}
                        />
                    </View>
                )}

                {refundsParent?.length > 0 && (
                    <View style={tw`mt-2 mb-20`}>
                        <PaymentDetails
                            totalAmount={totalAmount}
                            values={paymentForm}
                            onChange={patch =>
                                setPaymentForm(prev => ({ ...prev, ...patch }))
                            }
                        />
                    </View>
                )}
            </ScrollView>

            {data?.length > 0 && (
                <View
                    style={[
                        themed.childScreen2,
                        themed.borderTop,
                        tw`absolute bottom-0 left-0 right-0 px-4 py-3 border-t`,
                    ]}>
                    <TouchableOpacity
                        onPress={handleFinalRefund}
                        disabled={refundLoading}
                        activeOpacity={0.8}
                        style={[
                            themed.searchButton,
                            tw`h-13 rounded-xl items-center justify-center`,
                            refundLoading && tw`opacity-60`,
                        ]}>
                        {refundLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={[themed.searchButtonText, tw`font-bold text-base`]}>
                                Refund Test
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}>
                <View style={tw`flex-1 justify-center items-center bg-black/50`}>
                    <View style={[
                        themed.childScreen2,themed.border,
                        tw`w-11/12 max-w-md rounded-2xl p-6 items-center`,
                        { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }
                    ]}>
                        {/* Success Icon */}
                        <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: '#4CAF50' }]}>
                            <Text style={tw`text-white text-4xl`}>✓</Text>
                        </View>

                        <Text style={[themed.headerTitle, tw`text-xl font-bold text-center mb-2`]}>
                            Refund Successful
                        </Text>

                        <Text style={[themed.labelText, tw`text-center mb-6`]}>
                          Would you like to view the receipt?
                        </Text>

                        <View style={tw`flex-row gap-3 w-full`}>
                            <TouchableOpacity
                                onPress={handleOkPress}
                                style={[
                                    themed.border,
                                    tw`flex-1 py-3 rounded-xl items-center justify-center`,
                                    { backgroundColor: themed.buttonSecondary || '#f0f0f0' }
                                ]}>
                                <Text>OK</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleViewReceipt}
                                style={[
                                    themed.searchButton,
                                    tw`flex-1 py-3 rounded-xl items-center justify-center`
                                ]}>
                                <Text style={themed.searchButtonText}>View Receipt</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default TestRefund;