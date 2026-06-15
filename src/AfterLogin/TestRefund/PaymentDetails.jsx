import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import tw from 'twrnc';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../../Authorization/AuthContext';
import { useTheme } from '../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../utils/themeStyles';
import { allBankList } from '../Screens/PatientRegistration/services/doctorService';
import SelectApproval from '../Screens/PatientRegistration/SelectApproval';

const PaymentDetails = ({ totalAmount, grossAmount, values, onChange }) => {
  const { loginBranchId } = useAuth();
  const { theme } = useTheme();
  const themed = getThemeStyles(theme);
  const [selectedDiscountApproval, setSelectedDiscountApproval] = useState(null);
  const [discountApprovalModal, setDiscountApprovalModal] = useState(false);
  const [bankList, setBankList] = useState([]);
  const [bankModalVisible, setBankModalVisible] = useState(false);

  const formatAmount = value => {
    const num = Number(value || 0);
    return num.toFixed(2);
  };

  const cashAmount = useMemo(() => Number(values?.cashAmount || 0), [values]);
  const chequeAmount = useMemo(
    () => Number(values?.chequeAmount || 0),
    [values],
  );

  const setCashAmount = text => {
    const cleaned = String(text ?? '').replace(/[^0-9.]/g, '');
    onChange?.({ cashAmount: cleaned });
  };

  const setChequeAmount = text => {
    const cleaned = String(text ?? '').replace(/[^0-9.]/g, '');
    const newCheque = Number(cleaned || 0);
    const net = Number(totalAmount || 0);

    onChange?.({
      chequeAmount: cleaned,
      cashAmount: String(Math.max(net - newCheque, 0)),
    });
  };

  const getBankId = item => item?.BankId || item?.bankId || item?.Id || item?.id;

  const getBankName = item =>
    item?.BankName || item?.bankName || item?.Name || item?.name || '';

  const getAllPaymentMode = useCallback(async () => {
    try {
      const response = await allBankList();
      console.log('bank response', response);

      const list = response?.data || response || [];
      setBankList(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log('bank error', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      getAllPaymentMode();
    }, [getAllPaymentMode]),
  );

  return (
    <View style={[themed.childScreen2, themed.border, tw`p-4`]}>
      <Text style={[themed.labelText, tw`mb-3`]}>Payment Details</Text>
      <View style={tw`flex-row justify-between mb-3`}>
        <View style={tw`flex-1 mr-2`}>
          <Text style={[themed.labelText, tw`my-1`]}>Gross Bill Amount</Text>
          <TextInput
            editable={false}
            value={formatAmount(grossAmount ?? totalAmount)}
            style={[themed.inputBox, themed.inputText]}
          />
        </View>

        <View style={tw`flex-1 ml-2`}>
          <Text style={[themed.labelText, tw`my-1`]}>Net Amount</Text>
          <TextInput
            editable={false}
            value={formatAmount(totalAmount)}
            style={[themed.inputBox, tw`text-red-600 font-bold`]}
          />
        </View>
      </View>

      <View style={[themed.border, tw`p-2`]}>
        <View style={tw``}>
          <Text style={[themed.labelText, tw`py-1`]}>Cash</Text>
          <TextInput
            value={String(values?.cashAmount ?? cashAmount)}
            keyboardType="numeric"
            onChangeText={setCashAmount}
            style={[themed.inputBox, themed.inputText, tw``]}
          />
        </View>
        <View>
          <Text style={[themed.labelText, tw`py-1`]}>Cheque</Text>
          <TextInput
            value={String(values?.chequeAmount ?? chequeAmount)}
            keyboardType="numeric"
            onChangeText={setChequeAmount}
            style={[themed.inputBox, themed.inputText]}
          />
        </View>
        {console.log(values?.chequeAmount)}
        {values?.chequeAmount > 0 && <View>
          <Text style={[themed.labelText, tw`py-1`]}>Select Bank</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setBankModalVisible(true)}
            style={[
              themed.inputBox,
              tw`h-11 py-0 flex-row items-center justify-between px-2`,
            ]}
          >
            <Text numberOfLines={1} style={[themed.inputText, tw`flex-1 text-xs`]}>
              {values?.chequeBankName || 'Select Bank'}
            </Text>
            <Text style={tw`text-gray-500 text-xs ml-1`}>▼</Text>
          </TouchableOpacity>
        </View>}

        {values?.chequeAmount > 0 && <View>
          <Text style={[themed.labelText, tw`py-1`]}>Reference No.</Text>
          <TextInput
            value={values?.chequeRefNo || ''}
            onChangeText={text => onChange?.({ chequeRefNo: text })}
            style={[themed.inputBox, themed.inputText, tw``]}
            placeholder="Reference number"
            placeholderTextColor={themed.inputPlaceholder}
          />
        </View>}
      </View>

      <View style={tw`flex-row justify-between mb-3 mt-2`}>
        <View style={tw`flex-1 mr-2`}>
          <Text style={[themed.labelText, tw`my-1`]}>Refund Approved by</Text>
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

        <View style={tw`flex-1 ml-2`}>
          <Text style={[themed.labelText, tw`my-1`]}>Refund Reason</Text>
          <TextInput
            value={values?.refundReason ?? ''}
            onChangeText={text => onChange?.({ refundReason: text })}
            style={[themed.inputBox, themed.inputText]}
          />
        </View>
      </View>

      <View>
        <Text style={[themed.labelText, tw`my-1`]}>Remark</Text>
        <TextInput
          value={values?.remark ?? ''}
          onChangeText={text => onChange?.({ remark: text })}
          placeholder="Enter remark"
          placeholderTextColor={themed.inputPlaceholder}
          style={[themed.inputBox, themed.inputText]}
        />
      </View>

      <Modal
        visible={bankModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBankModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          style={tw`flex-1 bg-black/50 justify-end`}
          onPress={() => setBankModalVisible(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[themed.childScreen,tw` rounded-t-xl p-4 max-h-100`]}>
            <Text style={[themed.modalHeaderTitle,tw`text-lg font-bold  mb-4 `]}>
              Select Bank
            </Text>

            <FlatList
              data={bankList}
              keyExtractor={(item, index) => String(getBankId(item) || index)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[themed.border,tw`p-4`]}
                  onPress={() => {
                    onChange?.({
                      chequeBankId: getBankId(item),
                      chequeBankName: getBankName(item),
                    });
                    setBankModalVisible(false);
                  }}>
                  <Text style={[themed.inputText]}>
                    {getBankName(item)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={tw`text-center text-gray-500 py-6`}>
                  No Banks Found
                </Text>
              }
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={discountApprovalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDiscountApprovalModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDiscountApprovalModal(false)}>
          <View style={[themed.modalOverlay]}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={[themed.modalContainer, tw`rounded-md w-full h-100 `]}>
                <SelectApproval
                  loginBranchId={loginBranchId}
                  onClose={() => setDiscountApprovalModal(false)}
                  onSelectedApproval={(item) => {
                    setSelectedDiscountApproval(item);
                    onChange?.({ refundApprovedBy: String(item?.id ?? '') });
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default PaymentDetails;
