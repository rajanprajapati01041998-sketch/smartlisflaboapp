import api from "../../../Authorization/api";

export const logoutUser = async (sessionId) => {
  try {
    const response = await api.post('Login/logout',{
        sessionId: sessionId,
      },
    );
    console.log("logout",response)
    return response.data
  } catch (error) {
    console.log('Logout Error:', error?.response?.data || error.message);
    return {
      success: false,
      message:
        error?.response?.data?.message || 'Logout failed',
    };
  }
};