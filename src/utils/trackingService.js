import axiosInstance from '../../Authorization/AxiosInstance';

const ENDPOINTS = {
  update: 'Tracking/update-location',
  latest: 'Tracking/latest-location',
  path: 'Tracking/location-path',
};

export const sendLiveLocation = async ({
  fieldBoyId,
  userId,
  latitude,
  longitude,
  accuracyMeters,
  capturedAtUtc = new Date().toISOString(),
}) => {
  const payload = {
    fieldBoyId,
    userId,
    latitude,
    longitude,
    accuracyMeters,
    capturedAtUtc,
  };

  console.log('Update Location Payload:', payload);

  const response = await axiosInstance.post(ENDPOINTS.update, payload);
  return response.data;
};

export const fetchLatestLocation = async ({fieldBoyId}) => {
  const response = await axiosInstance.get(ENDPOINTS.latest, {
    params: {fieldBoyId},
  });

  return response.data;
};

export const fetchLocationPath = async ({fieldBoyId, limit = 200}) => {
  const response = await axiosInstance.get(ENDPOINTS.path, {
    params: {fieldBoyId, limit},
  });

  return response.data;
};
