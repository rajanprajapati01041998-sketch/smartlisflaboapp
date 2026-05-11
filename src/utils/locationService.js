import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

import { useAuth } from '../../Authorization/AuthContext';
import { requestLocationPermission } from './requestLocationPermission';

const useCurrentLocation = (options = {}) => {
    const { enabled = true } = options;
    const { setLatitude, setLongitude, latitude, longitude } = useAuth();
    const hasRequestedRef = useRef(false);
    const isMountedRef = useRef(true);

    const getCurrentLocation = async () => {
        try {
            if (!enabled) {
                return;
            }

            // In case the native module isn't linked/available, avoid crashing the app.
            if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
                console.log('Geolocation module is not available.');
                return;
            }

            const hasPermission = await requestLocationPermission();

            if (!hasPermission) {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required',
                );
                return;
            }

            Geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;

                    console.log('Latitude:', latitude);
                    console.log('Longitude:', longitude);

                    if (!isMountedRef.current) {
                        return;
                    }

                    setLatitude(latitude);
                    setLongitude(longitude);
                },
                error => {
                    console.log('Location Error:', error);

                    Alert.alert(
                        'Location Error',
                        'Unable to get current location',
                    );
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000,
                    forceRequestLocation: true,
                    showLocationDialog: true,
                },
            );
        } catch (error) {
            console.log('Get Location Error:', error);
        }
    };

    useEffect(() => {
        isMountedRef.current = true;

        if (hasRequestedRef.current) {
            return () => {
                isMountedRef.current = false;
            };
        }

        hasRequestedRef.current = true;
        getCurrentLocation();

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        latitude,
        longitude,
        getCurrentLocation,
    };
};

export default useCurrentLocation;
