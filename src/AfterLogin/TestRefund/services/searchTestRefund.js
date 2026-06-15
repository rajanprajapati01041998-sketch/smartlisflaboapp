import api from "../../../../Authorization/api";

export const getTestRefundDetails = async params => {
  try {
    const response = await api.get('Refund/get-opd-bill-details-for-refund', {
      params: {
        receiptNo: params?.receiptNo || '',
        billNo: params?.billNo || '',
        uhid: params?.uhid || '',
      },
    });

    return response?.data;
  } catch (error) {
    throw error?.response?.data || error?.message;
  }
};

