import {PermissionsAndroid, Platform, Alert} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'This app needs access to your location to track your current location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission granted');
        return true;
      } else {
        console.log('Location permission denied');
        Alert.alert(
          'Permission Denied',
          'Location permission is required.',
        );
        return false;
      }
    }

    if (Platform.OS === 'ios') {
      if (!Geolocation || typeof Geolocation.requestAuthorization !== 'function') {
        return true;
      }

      const status = await Geolocation.requestAuthorization('whenInUse');
      const normalized = String(status || '').toLowerCase();

      if (normalized === 'granted') {
        return true;
      }

      Alert.alert(
        'Permission Denied',
        'Location permission is required.',
      );
      return false;
    }

    return true;
  } catch (err) {
    console.log('Permission Error:', err);
    return false;
  }
};
