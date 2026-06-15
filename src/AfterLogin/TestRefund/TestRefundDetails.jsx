import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import tw from 'twrnc';
import Entypo from 'react-native-vector-icons/Entypo';

import { ScrollView } from 'react-native-gesture-handler';
import { useTheme } from '../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../utils/themeStyles';
import { useToast } from '../../../Authorization/ToastContext';

const formatAmount = value => {
  const num = Number(value || 0);
  return num.toFixed(2);
};

const TestRefundDetails = ({ data, onRefundsUpdate }) => {
  const { theme } = useTheme();
  const themed = getThemeStyles(theme);
  const { showToast } = useToast()
  const [testSelectModal, setTestSelectModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [refundModal, setRefundModal] = useState(false);
  const [refundQty, setRefundQty] = useState('');
  const [refunds, setRefunds] = useState([]);
  const [refundReason, setRefundReason] = useState('');
  const [refundApprovedBy, setRefundApprovedBy] = useState('');
  const [remark, setRemark] = useState('');

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const patient = data[0];

  const openRefundModal = item => {
    const existing = refunds.find(r => r.FTDId === item?.FTDId);
    setSelectedTest(item);
    if (existing) {
      setRefundQty(String(existing.RefundQty));
      setRefundReason(existing.RefundReason || '');
      setRefundApprovedBy(existing.RefundApprovedBy || '');
      setRemark(existing.Remark || '');
    } else {
      setRefundQty('');
      setRefundReason('');
      setRefundApprovedBy('');
      setRemark('');
    }
    setTestSelectModal(false);
    setRefundModal(true);
  };

  const handleRefundQtyChange = text => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const maxQty = Number(selectedTest?.Qty || 0);

    if (cleaned !== '' && Number(cleaned) > maxQty) {
      // Alert.alert('Invalid Qty', );
      showToast(`Refund qty cannot be greater than ${maxQty}`, 'warning')
      return;
    }

    setRefundQty(cleaned);
  };

  const handleSaveRefund = () => {
    if (!refundQty || Number(refundQty) <= 0) {
      Alert.alert('Required', 'Please enter refund qty');
      return;
    }

    const amount = Number(refundQty) * Number(selectedTest?.Rate || 0);

    const payload = {
      FTDId: selectedTest?.FTDId,
      ServiceItemId: selectedTest?.ServiceItemId,
      ServiceName: selectedTest?.ServiceName,
      CategoryId: selectedTest?.CategoryId,
      SubSubCategoryId: selectedTest?.SubSubCategoryId,
      GrossAmt: Number(selectedTest?.Rate || 0) * Number(refundQty),
      NetAmt: amount,
      DiscAmt: Number(selectedTest?.DiscAmt || 0),
      DiscPer: Number(selectedTest?.DiscPer || 0),
      Code: selectedTest?.ServiceCode || selectedTest?.Code || '',
      CorporateAlias: selectedTest?.CorporateAlias || '',
      CorporateCode: selectedTest?.CorporateCode || '',
      DoctorId: selectedTest?.DoctorId ?? null,
      IsUnderPackage: selectedTest?.IsUnderPackage ?? 0,
      PackageId: selectedTest?.PackageId ?? 0,
      BillQty: Number(selectedTest?.Qty || 0),
      RefundQty: Number(refundQty),
      Rate: Number(selectedTest?.Rate || 0),
      RefundAmount: amount,
      RefundReason: refundReason,
      RefundApprovedBy: refundApprovedBy,
      Remark: remark,
    };

    setRefunds(prev => {
      const idx = prev.findIndex(r => r.FTDId === payload.FTDId);
      if (idx >= 0) {
        const newArr = [...prev];
        newArr[idx] = payload;
        onRefundsUpdate?.(newArr);
        return newArr;
      }
      const newArr = [...prev, payload];
      onRefundsUpdate?.(newArr);
      return newArr;
    });
    setRefundModal(false);
  };

  return (
    <ScrollView>
      <View style={[tw`p-4 my-3 rounded-xl`]}>
        <View
          style={[
            tw`flex-row justify-between items-center mb-3 pb-2`,
            themed.border_b,
          ]}
        >
          <Text style={themed.labelText}>Patient Details</Text>

          <View style={tw`items-end flex-1 ml-2`}>
            <Text style={[themed.labelText, tw`text-xs`]}>Client Name</Text>
            <Text style={[themed.inputText, tw`text-right`]}>
              {patient?.ClientName || '-'}
            </Text>
          </View>
        </View>

        <View style={tw`flex-row justify-between mb-3`}>
          <View style={tw`flex-1`}>
            <Text style={[themed.labelText, tw`text-xs`]}>UHID</Text>
            <Text style={[themed.inputText, tw`font-bold`]}>
              {patient?.UHID || '-'}
            </Text>
          </View>

          <View style={tw`flex-1 items-end`}>
            <Text style={[themed.labelText, tw`text-xs`]}>Bill Date</Text>
            <Text style={[themed.inputText, tw`font-bold`]}>
              {patient?.BillDate || '-'}
            </Text>
          </View>
        </View>

        <View style={tw`flex-row justify-between mb-3`}>
          <View style={tw`flex-1 pr-2`}>
            <Text style={[themed.labelText, tw`text-xs`]}>Patient Name</Text>
            <Text
              numberOfLines={2}
              style={[themed.inputText, tw`font-bold text-base`]}
            >
              {patient?.PatientName || '-'}
            </Text>
          </View>

          <View style={tw`flex-1 items-end`}>
            <Text style={[themed.labelText, tw`text-xs`]}>Bill No</Text>
            <Text
              numberOfLines={2}
              style={[themed.inputText, tw`font-semibold text-right`]}
            >
              {patient?.BillNo || '-'}
            </Text>
          </View>
        </View>

        <View style={tw`mt-6`}>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={[themed.labelText]}>Select Test </Text>
            <Text style={[themed.labelTextXs]}>Total Test ({data?.length}) </Text>
          </View>

          <TouchableOpacity
            onPress={() => setTestSelectModal(true)}
            style={[
              themed.inputBox,
              tw`flex-row justify-between items-center px-4 py-4`,
            ]}
          >
            <Text numberOfLines={1} style={[themed.inputText, tw`flex-1 pr-2`]}>
              {selectedTest?.ServiceName || '-- Select Test --'}
            </Text>
            <Entypo
              name={testSelectModal ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={themed.chevronColor}
            />
          </TouchableOpacity>

          {testSelectModal && (
            <Modal
              visible={testSelectModal}
              transparent
              animationType="slide"
              onRequestClose={() => setTestSelectModal(false)}
            >
              <View style={themed.modalOverlay}>
                <Pressable
                  style={tw`flex-1`}
                  onPress={() => setTestSelectModal(false)}
                />
                <View style={[themed.childScreen, tw`rounded-t-xl h-[70%]`]}>
                  <View
                    style={tw`flex-row justify-between items-center mb-4 px-4 py-2`}
                  >
                    <Text style={themed.labelText}>Select Test</Text>
                    <TouchableOpacity
                      onPress={() => setTestSelectModal(false)}
                      style={tw`bg-gray-200 rounded-full p-1`}
                    >
                      <Entypo name="cross" size={22} color="#374151" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={tw`px-4`}>
                    {data.map((item, idx) => (
                      <TouchableOpacity
                        key={item?.FTDId || idx}
                        onPress={() => openRefundModal(item)}
                        style={[themed.border,
                        tw`p-2`,
                        idx !== data.length - 1 && themed.border_b,
                        ]}
                      >
                        <Text style={[themed.inputText, tw`font-semibold`]}>
                          {idx + 1}. {item?.ServiceName || '-'}
                        </Text>
                        <View style={tw`flex-row justify-between mt-2`}>
                          <Text style={[themed.labelText, tw`text-xs`]}>
                            Qty: {Number(item?.Qty || 0)}
                          </Text>
                          <Text style={[themed.labelText, tw`text-xs`]}>
                            Rate: ₹ {formatAmount(item?.Rate)}
                          </Text>
                        </View>
                        {refunds.some(r => r.FTDId === item?.FTDId) && (
                          <View style={tw`flex-row items-center mt-2`}>
                            <Entypo name="check" size={16} color="green" />
                            <Text
                              style={[
                                themed.labelText,
                                tw`ml-1 text-green-600`,
                              ]}
                            >
                              Refunded
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          )}

          {refunds.length > 0 && (
            <View style={tw`my-4`}>
              {refunds.map((ref, idx) => (
                <View
                  key={ref.FTDId || idx}
                  style={[themed.border, tw`mb-4 p-3 `]}
                >
                  <Text style={[themed.labelText, tw`text-lg`]}>
                    {ref.ServiceName}
                  </Text>
                  <Text style={themed.inputText}>
                    Qty: {ref.RefundQty} * ₹{formatAmount(ref.Rate)} = ₹
                    {formatAmount(ref.RefundAmount)}
                  </Text>
                  {ref.RefundReason ? (
                    <Text style={themed.inputText}>
                      Reason: {ref.RefundReason}
                    </Text>
                  ) : null}
                  {ref.RefundApprovedBy ? (
                    <Text style={themed.inputText}>
                      Approved By: {ref.RefundApprovedBy}
                    </Text>
                  ) : null}
                  {ref.Remark ? (
                    <Text style={themed.inputText}>Remark: {ref.Remark}</Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={() =>
                      openRefundModal(data.find(d => d.FTDId === ref.FTDId))
                    }
                    style={tw`mt-2 self-start`}
                  >
                    <Text style={[tw`text-yellow-600 py-1 px-2 text-xs rounded-md border border-yellow-600 bg-yellow-700/10`]}>
                      Edit Refund
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <Modal
          visible={refundModal}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setRefundModal(false)}
        >
          <View style={themed.modalOverlay}>
            <Pressable
              style={tw`flex-1`}
              onPress={() => setRefundModal(false)}
            />

            <View style={[themed.childScreen, tw`rounded-t-3xl h-[65%]`]}>
              <View style={tw`flex-1 px-4 pt-4`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                  <Text style={themed.labelText}>Refund Test</Text>

                  <TouchableOpacity
                    onPress={() => setRefundModal(false)}
                    style={tw`bg-gray-200 rounded-full p-1`}
                  >
                    <Entypo name="cross" size={22} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View style={[themed.border, tw`border rounded-2xl p-3 mb-4`]}>
                  <Text style={[themed.labelText, tw`text-xs mb-1`]}>
                    Test Name
                  </Text>
                  <Text style={[themed.inputText, tw`font-bold text-base`]}>
                    {selectedTest?.ServiceName || '-'}
                  </Text>
                </View>

                <View style={tw`flex-row mb-4`}>
                  <View
                    style={[
                      themed.border,
                      tw`border rounded-lg p-3 flex-1 mr-2`,
                    ]}
                  >
                    <Text style={[themed.labelText, tw`text-xs mb-1`]}>
                      Bill Qty
                    </Text>
                    <Text style={[themed.inputText, tw`font-bold text-md`]}>
                      {Number(selectedTest?.Qty || 0)}
                    </Text>
                  </View>

                  <View
                    style={[
                      themed.border,
                      tw`border rounded-lg p-3 flex-1 ml-2`,
                    ]}
                  >
                    <Text style={[themed.labelText, tw`text-xs mb-1`]}>
                      Rate
                    </Text>
                    <Text style={[themed.inputText, tw`font-bold text-md`]}>
                      ₹ {formatAmount(selectedTest?.Rate)}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text style={[themed.labelText, tw`mb-2 font-semibold`]}>
                    Refund Qty
                  </Text>
                  <TextInput
                    value={refundQty}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9]/g, '');
                      handleRefundQtyChange(numericValue);
                    }}
                    placeholder="Enter refund qty"
                    placeholderTextColor={themed.inputPlaceholder}
                    keyboardType="number-pad"
                    maxLength={5}
                    style={[
                      themed.inputBox,
                      themed.inputText,
                      tw`h-14 text-md rounded-lg px-4`,
                    ]}
                  />
                </View>
              </View>

              {Number(refundQty || 0) > 0 && (
                <View style={[themed.borderTop, tw`border-t px-4 pt-4 pb-6`]}>
                  <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={[themed.labelText, tw`font-bold text-base`]}>
                      Refund Amount
                    </Text>

                    <Text style={tw`text-red-600 font-bold text-lg`}>
                      ₹{' '}
                      {formatAmount(
                        Number(refundQty || 0) *
                        Number(selectedTest?.Rate || 0),
                      )}
                    </Text>
                  </View>

                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      onPress={() => setRefundModal(false)}
                      activeOpacity={0.8}
                      style={[
                        themed.cancelButton,
                        tw`flex-1 h-12 rounded-lg items-center justify-center`,
                      ]}
                    >
                      <Text style={[themed.cancelButtonText, tw`font-bold`]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveRefund}
                      activeOpacity={0.8}
                      style={[
                        themed.saveButton,
                        tw`flex-1 h-12 rounded-lg items-center justify-center`,
                      ]}
                    >
                      <Text style={[themed.saveButtonText, tw`font-bold`]}>
                        Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

export default TestRefundDetails;
