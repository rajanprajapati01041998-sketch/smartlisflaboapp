export const buildAddressText = ({ pincode, city, district, state, country }) => {
  const parts = [
    city?.cityName || city?.CityName || city?.name,
    district?.districtName || district?.DistrictName || district?.name,
    state?.stateName || state?.StateName || state?.name,
    country,
    pincode,
  ].filter((value) => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== '';
  });

  return parts.join(', ');
};