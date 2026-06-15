import api from "../../Authorization/api";

export const getPageSetting = async (branchId) => {
  try {
    const { data } = await api.get(
      `PageMasterApp/get-page-setting`,
      {
        params: {
          branchId,
        },
      }
    );

    return data;
  } catch (error) {
    throw error?.response?.data || error.message;
  }
};


export const updatePageSetting = async (payload) => {
  try {
    const response = await api.post(
      "PageMasterApp/update-page-setting",
      payload
    );

    return response.data;
  } catch (error) {
    throw error?.response?.data || error.message;
  }
};