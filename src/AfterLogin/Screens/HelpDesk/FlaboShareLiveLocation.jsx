import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../../../Authorization/AuthContext';
import api from '../../../../Authorization/api';
import { liveTrackingManager } from '../../../utils/LiveTrackingManager';
import SwipeButton from '../../../components/SwipeButton';
import { useRoute } from '@react-navigation/native';
import { useToast } from '../../../../Authorization/ToastContext';
import { setLiveLocationSession } from '../../../utils/backgroundLocationPrefs';

const FlaboShareLiveLocation = () => {
  const webViewRef = useRef(null);
  const route = useRoute();
  const navigation = useNavigation();

  const sampleId = route?.params?.id;
  const { showToast } = useToast();

  // console.log('Received ID:', sampleId);

  const { fieldBoyId, loginBranchId, fieldBoyData, latitude, longitude } =
    useAuth();

  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [branchLocation, setBranchLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(
    latitude && longitude ? { latitude, longitude } : null,
  );
  const [apiStatus, setApiStatus] = useState('Waiting...');
  const [pathCount, setPathCount] = useState(0);
  const [lastSentTime, setLastSentTime] = useState('');

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      return (
        result['android.permission.ACCESS_FINE_LOCATION'] ===
        PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const status = await Geolocation.requestAuthorization?.('always');
    return status === 'granted' || status === true || status === undefined;
  };

  const injectMapLocation = (type, coords) => {
    if (!webViewRef.current) {
      return;
    }

    const script = `
      ${type}(${Number(coords.latitude)}, ${Number(coords.longitude)});
      true;
    `;

    webViewRef.current.injectJavaScript(script);
  };

  const getBranchLocation = async () => {
    try {
      setApiStatus('Getting branch location...');

      const branchId = loginBranchId || 8066;

      const response = await api.get(
        `Location/getBranchLocationById_flabo?branchId=${branchId}`,
      );
      const json = response?.data;
      if (json?.status === true && json?.data?.length > 0) {
        const branch = json.data[0];
        const coords = {
          latitude: Number(branch.LatitudeApp),
          longitude: Number(branch.LongitudeApp),
        };

        if (
          Number.isFinite(coords.latitude) &&
          Number.isFinite(coords.longitude)
        ) {
          setBranchLocation(coords);
          injectMapLocation('setBranchLocation', coords);
          setApiStatus('Branch location loaded');
          return coords;
        }
      }

      setApiStatus('Branch location not found');
      return null;
    } catch (error) {
      console.log('Branch API Error:', error?.response?.data || error.message);
      setApiStatus('Branch API failed');
      return null;
    }
  };

  const handleMapCallback = coords => {
    setCurrentLocation(coords);
    injectMapLocation('updateCurrentLocation', coords);
  };

  const startTracking = async () => {
    const permission = await requestLocationPermission();

    if (!permission) {
      setLoading(false);
      Alert.alert('Permission Denied', 'Location permission is required');
      return;
    }

    setLoading(true);

    if (!branchLocation) {
      await getBranchLocation();
    }

    await liveTrackingManager.startTracking(fieldBoyId, handleMapCallback);

    setLoading(false);
  };

  const stopTracking = () => {
    liveTrackingManager.stopTracking();
  };

  const handleSampleStatusUpdate = async () => {
    try {
      setApiStatus('Updating sample status...');
      const payload = {
        id: sampleId,
        sampleDelivered: true,
      };

      const response = await api.post(
        'FlaboDashBoard/update-sample-status',
        payload,
      );

      setApiStatus('Sample delivered');
      stopTracking();
      showToast('Sample delivered successfully', 'success');
      stopTracking();
      await setLiveLocationSession(null);
      navigation.navigate('DashboardHome');
      return true;
    } catch (error) {
      console.log('Update Sample Error:', error);
      setApiStatus('Sample status update error');
      showToast('Sample status update error', 'error');
      return false;
    }
  };

  const zoomIn = () => {
    webViewRef.current?.injectJavaScript(`map.zoomIn(); true;`);
  };

  const zoomOut = () => {
    webViewRef.current?.injectJavaScript(`map.zoomOut(); true;`);
  };

  const goToCurrent = () => {
    if (!currentLocation) {
      return;
    }

    webViewRef.current?.injectJavaScript(`
      map.setView([${currentLocation.latitude}, ${currentLocation.longitude}], 18);
      true;
    `);
  };

  const clearPath = () => {
    webViewRef.current?.injectJavaScript(`
      clearLivePath();
      true;
    `);

    liveTrackingManager.clearPath();
  };

  useEffect(() => {
    const unsubscribe = liveTrackingManager.addListener(state => {
      setTracking(state.isTracking);
      setApiStatus(state.apiStatus);
      setPathCount(state.pathCount);
      setLastSentTime(state.lastSentTime);
      setSocketConnected(state.socketConnected);
    });

    const timer = setTimeout(() => {
      startTracking();
    }, 800);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [fieldBoyId, loginBranchId]);

  const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }

    .branch-marker {
      background: #dc2626;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    }

    .current-marker {
      background: #2563eb;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 0 0 8px rgba(37,99,235,0.25);
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <script>
    var map = L.map('map', {
      zoomControl: false
    }).setView([${latitude || 25.2954}, ${longitude || 82.9626}], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22
    }).addTo(map);

    var branchMarker = null;
    var currentMarker = null;
    var branchLatLng = null;
    var livePath = L.polyline([], {
      color: '#2563eb',
      weight: 7,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    var branchIcon = L.divIcon({
      className: '',
      html: '<div class="branch-marker"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    var currentIcon = L.divIcon({
      className: '',
      html: '<div class="current-marker"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    ${
      latitude && longitude
        ? `
    var initialLatLng = [${latitude}, ${longitude}];
    currentMarker = L.marker(initialLatLng, {
      icon: currentIcon
    }).addTo(map).bindPopup('Current Location');
    livePath.addLatLng(initialLatLng);
    `
        : ''
    }

    function setBranchLocation(lat, lng) {
      branchLatLng = [lat, lng];

      if (!branchMarker) {
        branchMarker = L.marker(branchLatLng, {
          icon: branchIcon
        }).addTo(map).bindPopup('Branch Location');
      } else {
        branchMarker.setLatLng(branchLatLng);
      }

      livePath.setLatLngs([branchLatLng]);

      map.setView(branchLatLng, 17);
    }

    function updateCurrentLocation(lat, lng) {
      var currentLatLng = [lat, lng];

      if (!currentMarker) {
        currentMarker = L.marker(currentLatLng, {
          icon: currentIcon
        }).addTo(map).bindPopup('Current Location');
      } else {
        currentMarker.setLatLng(currentLatLng);
      }

      var points = livePath.getLatLngs();

      if (points.length === 0 && branchLatLng) {
        livePath.addLatLng(branchLatLng);
      }

      livePath.addLatLng(currentLatLng);

      if (branchLatLng) {
        var bounds = L.latLngBounds([branchLatLng, currentLatLng]);
        map.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 18
        });
      } else {
        map.setView(currentLatLng, 18);
      }
    }

    function clearLivePath() {
      if (branchLatLng) {
        livePath.setLatLngs([branchLatLng]);
      } else {
        livePath.setLatLngs([]);
      }
    }
  </script>
</body>
</html>
`;

  return (
    <View style={tw`flex-1 bg-white`}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        style={tw`flex-1`}
      />

      {loading && (
        <View
          style={tw`absolute inset-0 bg-white/70 justify-center items-center`}
        >
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={tw`mt-3 text-gray-700 font-bold`}>
            Loading live location...
          </Text>
        </View>
      )}

      <View style={tw`absolute right-4 top-24`}>
        <TouchableOpacity
          onPress={zoomIn}
          style={tw`h-11 w-11 bg-white rounded-full items-center justify-center mb-3 shadow-lg`}
        >
          <Text style={tw`text-black text-2xl font-bold`}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={zoomOut}
          style={tw`h-11 w-11 bg-white rounded-full items-center justify-center mb-3 shadow-lg`}
        >
          <Text style={tw`text-black text-3xl font-bold`}>−</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToCurrent}
          style={tw`h-11 w-11 bg-blue-600 rounded-full items-center justify-center shadow-lg`}
        >
          <Text style={tw`text-white text-lg font-bold`}>◎</Text>
        </TouchableOpacity>
      </View>

      <View style={tw`absolute bottom-5 left-4 right-4`}>
        {/* GLASS STATUS CARD */}
        <View
          style={[
            tw`rounded-3xl px-5 py-4 mb-4 border border-white/70`,
            {
              backgroundColor: socketConnected
                ? 'rgba(102, 181, 95, 0.29)'
                : 'rgba(233, 196, 196, 0.6)',
              borderColor: socketConnected ? 'green' : 'red',
            },
          ]}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <View
                style={tw`h-8 w-8 rounded-full  items-center justify-center mr-4`}
              >
                <Icon name="map" size={23} color="#2563eb" />
              </View>
              <Text style={tw`text-gray-700 font-bold`}>Path Points</Text>
            </View>
            <Text style={tw`text-blue-600  font-black`}>{pathCount}</Text>
          </View>
          <View style={tw`flex-row items-center justify-between py-2`}>
            <View style={tw`flex-row items-center`}>
              <View
                style={tw`h-8 w-8 rounded-full bg-blue-100 items-center justify-center mr-4`}
              >
                <Icon name="map" size={23} color="#2563eb" />
              </View>
              <Text style={tw`text-gray-700 font-bold`}> Lat/Lng</Text>
            </View>
            <Text style={tw`text-blue-600  font-black w-48 text-right`}>
              {currentLocation
                ? `${currentLocation.latitude}, ${currentLocation.longitude}`
                : 'Loading'}
            </Text>
          </View>

          <View style={tw`flex-row items-center justify-between `}>
            <View style={tw`flex-row items-center`}>
              <View
                style={tw`h-8 w-8 rounded-full bg-emerald-100 items-center justify-center mr-4`}
              >
                <Icon name="time-outline" size={25} color="#10b981" />
              </View>
              <Text style={tw`text-gray-700  font-bold`}>Last Sent</Text>
            </View>
            <Text style={tw`text-emerald-500  font-black`}>
              {lastSentTime || 'Not sent'}
            </Text>
          </View>

          <View style={tw`flex-row items-center justify-between `}>
            <View style={tw`flex-row items-center`}>
              <View
                style={tw`h-8 w-8 rounded-full bg-purple-100 items-center justify-center mr-4`}
              >
                <Icon name="navigate-outline" size={25} color="#7c3aed" />
              </View>
              <Text style={tw`text-gray-700  font-bold`}>Status</Text>
            </View>
            <Text
              numberOfLines={1}
              style={tw`text-purple-600  font-black max-w-48 text-right`}
            >
              {apiStatus}
            </Text>
          </View>
        </View>

        {/* BUTTON ROW */}
        <View style={tw`flex-row items-center mb-1`}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={tracking ? stopTracking : startTracking}
            style={[
              tw`flex-1 rounded-3xl overflow-hidden mr-3`,
              {
                height: 60,
                shadowColor: tracking ? '#ef4444' : '#16a34a',
                shadowOpacity: 0.35,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              },
            ]}
          >
            <LinearGradient
              colors={
                tracking
                  ? ['#ff3347', '#dc2626', '#b91c1c']
                  : ['#22c55e', '#16a34a', '#15803d']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tw`flex-1 flex-row items-center justify-center`}
            >
              <View
                style={[
                  tw`absolute left-4 h-10 w-10 rounded-full items-center justify-center border border-white/25`,
                  { backgroundColor: 'rgba(255,255,255,0.14)' },
                ]}
              >
                <Icon
                  name={tracking ? 'stop' : 'play'}
                  size={20}
                  color="#fff"
                />
              </View>

              <Text style={tw`text-white text-lg font-black`}>
                {tracking ? 'Stop Tracking' : 'Start Tracking'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={clearPath}
            style={[
              tw`rounded-3xl overflow-hidden`,
              {
                width: 86,
                height: 60,
                shadowColor: '#111827',
                shadowOpacity: 0.35,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              },
            ]}
          >
            <LinearGradient
              colors={['#374151', '#1f2937', '#111827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tw`flex-1 items-center justify-center`}
            >
              <Icon name="trash-outline" size={24} color="#fff" />
              <Text style={tw`text-white font-bold mt-1`}>Clear</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* DELIVERY SLIDER */}
        <SwipeButton
          onComplete={handleSampleStatusUpdate}
          title="Slide To Complete Delivery"
        />
      </View>
    </View>
  );
};

export default FlaboShareLiveLocation;
