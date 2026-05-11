import api from "../../../Authorization/api";

export const getFullLocation = async (pincode) => {
  try {
    if (!pincode) {
      throw new Error("Pincode is required");
    }
    const response = await api.get(
      `/Country/GetFullLocationByPincode`,
      {
        params: { pincode: pincode }
      }
    );
    return response?.data;
  } catch (error) {
    throw error?.response?.data?.message || error?.message || "Something went wrong";
  }
};


export const getAddressFromLatLng = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) {
      return 'Location not available';
    }

    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();

    let data;
    
    try {
      data = JSON.parse(text);
      console.log("data",data)
    } catch (e) {
      console.log('Invalid address response:', text);
      return 'Unable to fetch address';
    }

    const address = [
      data.locality,
      data.city,
      data.principalSubdivision,
      data.countryName,
    ]
      .filter(Boolean)
      .join(', ');

    return address || 'Address not found';
  } catch (error) {
    console.log('address error', error);
    return 'Unable to fetch address';
  }
};