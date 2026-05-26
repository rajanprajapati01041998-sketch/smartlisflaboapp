import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Geolocation from '@react-native-community/geolocation';
import { Map, Camera, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import * as signalR from '@microsoft/signalr';
import tw from 'twrnc';

import { useAuth } from '../../../../Authorization/AuthContext';
import api, { API_BASE_URL } from '../../../../Authorization/api';
import {
  getBackgroundLocationEnabled,
  getLiveLocationSession,
  startLiveLocationSession,
  stopLiveLocationSession,
} from '../../../utils/backgroundLocationPrefs';

const MAP_STYLE_PRIMARY = 'https://tiles.openfreemap.org/styles/liberty';
const MAP_STYLE_FALLBACK = 'https://demotiles.maplibre.org/style.json';
const MIN_DISTANCE_METERS = 1;
const HUB_URL = `${API_BASE_URL.replace('/api', '')}locationHub`;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function SlideToDeliver({ disabled, loading, done, onConfirm }) {
  const SLIDER_HEIGHT = 54;
  const KNOB_SIZE = 46;
  const H_PADDING = 6;
  const sliderWidth = Math.min(SCREEN_WIDTH - 32, 420);
  const maxTranslate = sliderWidth - KNOB_SIZE - H_PADDING * 2;
  const translateX = useSharedValue(0);

  const reset = () => {
    translateX.value = withTiming(0, { duration: 220 });
  };

  const pan = Gesture.Pan()
    .enabled(!disabled && !loading && !done)
    .onUpdate(e => {
      const next = Math.max(0, Math.min(maxTranslate, e.translationX));
      translateX.value = next;
    })
    .onEnd(() => {
      const threshold = maxTranslate * 0.82;
      if (translateX.value >= threshold) {
        translateX.value = withTiming(maxTranslate, { duration: 160 });
        runOnJS(reset)();
        runOnJS(onConfirm)?.();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + KNOB_SIZE + H_PADDING,
  }));

  return (
    <View style={tw`items-center  `}>
      <View
        style={[
          tw`overflow-hidden rounded-lg border`,
          {
            width: sliderWidth,
            height: SLIDER_HEIGHT,
            borderColor:
              disabled || done ? 'rgba(107,114,128,0.35)' : 'rgba(16,185,129,0.35)',
            backgroundColor:
              disabled || done ? 'rgba(107,114,128,0.10)' : 'rgba(16,185,129,0.12)',
          },
        ]}
      >
        <Animated.View
          style={[
            tw`absolute left-0 top-0 bottom-0 rounded-lg`,
            {
              backgroundColor:
                disabled || done ? 'rgba(107,114,128,0.18)' : 'rgba(16,185,129,0.45)',
            },
            fillStyle,
          ]}
        />

        <View style={tw`flex-1 items-center justify-center`}>
          <Text
            style={tw.style(
              `font-bold tracking-wide`,
              disabled || done ? 'text-gray-500' : 'text-emerald-900',
            )}
          >
            {done
              ? 'Delivered'
              : loading
                ? 'Updating...'
                : disabled
                  ? 'Delivered Locked'
                  : 'Slide to complete delivery'}
          </Text>
        </View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              tw`absolute top-0.8 left-0.5 rounded-lg items-center justify-center`,
              {
                width: KNOB_SIZE,
                height: KNOB_SIZE,
                backgroundColor: disabled || done ? '#9ca3af' : '#065f46',
              },
              knobStyle,
            ]}
          >
            <Text style={tw`text-white text-lg font-black`}>
              {loading ? '…' : '››'}
            </Text>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const FlaboShareLiveLocation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const watchIdRef = useRef(null);
  const cameraRef = useRef(null);
  const lastSentCoordsRef = useRef(null);
  const hubRef = useRef(null);

  const { fieldBoyId, loginBranchId, fieldBoyData } = useAuth();

  const [branchLocation, setBranchLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSentTime, setLastSentTime] = useState('');
  const [apiStatus, setApiStatus] = useState('Waiting...');
  const [tracking, setTracking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(17);
  const [bgLocationEnabled, setBgLocationEnabled] = useState(false);
  const [liveSession, setLiveSession] = useState(null);
  const [mapStyleUrl, setMapStyleUrl] = useState(MAP_STYLE_PRIMARY);
  const [mapError, setMapError] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [delivered, setDelivered] = useState(false);

  const sampleId = route?.params?.id ?? null;

  const latitude = currentLocation?.latitude || branchLocation?.latitude || 26.8467;
  const longitude = currentLocation?.longitude || branchLocation?.longitude || 80.9462;

  const moveCamera = (coords, zoom = zoomLevel) => {
    cameraRef.current?.easeTo({
      center: [Number(coords.longitude), Number(coords.latitude)],
      zoom,
      duration: 700,
      easing: 'ease',
    });
  };

  const zoomIn = () => {
    const nextZoom = Math.min(zoomLevel + 1, 20);
    setZoomLevel(nextZoom);
    moveCamera({ latitude, longitude }, nextZoom);
  };

  const zoomOut = () => {
    const nextZoom = Math.max(zoomLevel - 1, 3);
    setZoomLevel(nextZoom);
    moveCamera({ latitude, longitude }, nextZoom);
  };

  const goToCurrentLocation = () => {
    moveCamera({ latitude, longitude }, zoomLevel);
  };

  const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = value => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getBranchLocation = async () => {
    try {
      if (!loginBranchId) {
        setApiStatus('Branch ID not found');
        return null;
      }

      setApiStatus('Getting branch location...');

      const response = await api.get(
        `Location/getBranchLocationById_flabo?branchId=${loginBranchId}`,
      );

      const json = response?.data;

      if (json?.status === true && Array.isArray(json?.data) && json.data.length > 0) {
        const branch = json.data[0];

        const coords = {
          latitude: Number(branch.LatitudeApp),
          longitude: Number(branch.LongitudeApp),
        };

        if (Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude)) {
          setBranchLocation(coords);
          setCurrentLocation(prev => prev || coords);
          setPathCoordinates([[coords.longitude, coords.latitude]]);
          moveCamera(coords, zoomLevel);
          setApiStatus('Branch location loaded');
          return coords;
        }
      }

      setApiStatus('Branch location not found');
      return null;
    } catch (error) {
      console.log('Branch Location Error:', error?.response?.data || error?.message);
      setApiStatus('Branch location API failed');
      return null;
    }
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const fineGranted =
          granted['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED;

        if (fineGranted && bgLocationEnabled) {
          try {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            );
          } catch { }
        }

        return fineGranted;
      }

      const status = await Geolocation.requestAuthorization?.('always');
      return status === 'granted' || status === true || status === undefined;
    } catch (err) {
      console.log('Permission Error:', err);
      return false;
    }
  };

  const connectSocket = async () => {
    try {
      if (
        hubRef.current &&
        hubRef.current.state === signalR.HubConnectionState.Connected
      ) {
        setSocketConnected(true);
        return true;
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      connection.onreconnecting(() => {
        setSocketConnected(false);
        setApiStatus('Socket reconnecting...');
      });

      connection.onreconnected(async () => {
        setSocketConnected(true);
        setApiStatus('Socket reconnected');

        if (fieldBoyId) {
          await connection.invoke('JoinFieldBoyLive', Number(fieldBoyId));
        }
      });

      connection.onclose(() => {
        setSocketConnected(false);
        setApiStatus('Socket disconnected');
      });

      await connection.start();

      hubRef.current = connection;
      setSocketConnected(true);

      if (fieldBoyId) {
        const liveResult = await connection.invoke(
          'JoinFieldBoyLive',
          Number(fieldBoyId),
        );

        console.log('JoinFieldBoyLive result:', liveResult);
      }

      setApiStatus('Socket connected');

      return true;
    } catch (error) {
      console.log('Socket connection failed:', error);
      setSocketConnected(false);
      setApiStatus(error?.message || 'Socket connection failed');
      return false;
    }
  };

  const sendLocationToServer = async coords => {
    try {
      if (!fieldBoyId) {
        setApiStatus('Field Boy ID not found');
        return;
      }

      const payload = {
        fieldBoyId: Number(fieldBoyId),
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude),
        accuracyMeters: Number(coords.accuracy || 0),
        capturedAt: new Date().toISOString(),
      };

      let isConnected =
        hubRef.current &&
        hubRef.current.state === signalR.HubConnectionState.Connected;

      if (!isConnected) {
        isConnected = await connectSocket();
      }

      if (!isConnected) {
        setApiStatus('Socket not connected. Location not sent');
        return;
      }

      const result = await hubRef.current.invoke('SendLocation', payload);

      if (result?.status === true) {
        lastSentCoordsRef.current = coords;
        setLastSentTime(new Date().toLocaleTimeString());
        setApiStatus('Live location saved and sent');
      } else {
        setApiStatus(result?.message || 'Location save failed');
      }
    } catch (error) {
      console.log('Location Send Error:', error);
      setApiStatus(error?.message || 'Location send failed');
    }
  };

  const shouldSendLocation = coords => {
    const last = lastSentCoordsRef.current;

    if (!last) {
      return true;
    }

    const distance = getDistanceInMeters(
      last.latitude,
      last.longitude,
      coords.latitude,
      coords.longitude,
    );

    return distance >= MIN_DISTANCE_METERS;
  };

  const addPointToPath = coords => {
    const newPoint = [Number(coords.longitude), Number(coords.latitude)];

    setPathCoordinates(prev => {
      const lastPoint = prev[prev.length - 1];

      if (
        lastPoint &&
        lastPoint[0] === newPoint[0] &&
        lastPoint[1] === newPoint[1]
      ) {
        return prev;
      }

      return [...prev, newPoint];
    });
  };

  const handleCoordsUpdate = coords => {
    if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
      return;
    }

    setCurrentLocation(coords);
    addPointToPath(coords);
    setLoading(false);
    moveCamera(coords, zoomLevel);

    if (shouldSendLocation(coords)) {
      sendLocationToServer(coords);
    } else {
      setApiStatus(`Waiting for ${MIN_DISTANCE_METERS}m movement`);
    }
  };

  const getCurrentLocationOnce = () => {
    setApiStatus('Getting GPS location...');

    Geolocation.getCurrentPosition(
      position => {
        const coords = {
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
          accuracy: Number(position.coords.accuracy || 0),
        };

        handleCoordsUpdate(coords);
      },
      error => {
        console.log('Current Location Error:', error);
        setLoading(false);

        if (error.code === 3) {
          setApiStatus('GPS timeout. Move outside/open Maps');
        } else if (error.code === 2) {
          setApiStatus('GPS unavailable');
        } else if (error.code === 1) {
          setApiStatus('Location permission denied');
        } else {
          setApiStatus(error.message || 'GPS error');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 500,
        maximumAge: 0,
        distanceFilter: 0,
        forceRequestLocation: true,
        forceLocationManager: true,
        showLocationDialog: true,
      },
    );
  };

  const startWatchLocation = async () => {
    const permission = await requestLocationPermission();

    if (!permission) {
      setLoading(false);
      Alert.alert('Permission Denied', 'Location permission is required');
      return;
    }

    setLoading(true);

    await getBranchLocation();
    await connectSocket();

    setTracking(true);
    setApiStatus('Watching location...');

    getCurrentLocationOnce();

    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = Geolocation.watchPosition(
      position => {
        const coords = {
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
          accuracy: Number(position.coords.accuracy || 0),
        };

        handleCoordsUpdate(coords);
      },
      error => {
        console.log('Watch Location Error:', error);
        setApiStatus(error.code === 3 ? 'GPS timeout. Move outside' : error.message || 'Watch GPS error');
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        distanceFilter: 1,
        interval: 3000,
        fastestInterval: 2000,
        maximumAge: 0,
        timeout: 500,
        forceLocationManager: true,
        showLocationDialog: true,
      },
    );
  };

  const stopWatchLocation = () => {
    const mustKeepLive = bgLocationEnabled && liveSession?.active;
    if (mustKeepLive) {
      Alert.alert(
        'Live location is locked',
        'You can stop location sharing only after marking the sample as Delivered.',
      );
      return;
    }

    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTracking(false);
    setApiStatus('Tracking stopped');
    stopLiveLocationSession().catch(() => { });
  };

  const markSampleDelivered = async () => {
    if (delivering || delivered) return;

    if (!sampleId) {
      Alert.alert('Missing Sample', 'Sample ID not found for delivery.');
      return;
    }

    try {
      setDelivering(true);
      setApiStatus('Marking delivered...');
      await api.post('FlaboDashBoard/update-sample-status', {
        id: sampleId,
        sampleDelivered: true,
      });

      await stopLiveLocationSession();
      setLiveSession(null);

      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setTracking(false);

      setDelivered(true);
      setApiStatus('Sample delivered successfully');

      setTimeout(() => {
        navigation.navigate('MainTabs', {
          screen: 'Dashboard',
          params: { screen: 'DashboardHome' },
        });
      }, 250);
    } catch (error) {
      console.log('Deliver Error:', error?.response?.data || error);
      Alert.alert('Failed', 'Failed to mark sample delivered.');
      setApiStatus('Failed to mark delivered');
    } finally {
      setDelivering(false);
    }
  };

  const clearPath = () => {
    if (branchLocation) {
      setPathCoordinates([[branchLocation.longitude, branchLocation.latitude]]);
      setCurrentLocation(branchLocation);
      moveCamera(branchLocation, zoomLevel);
    } else {
      setPathCoordinates([]);
    }

    lastSentCoordsRef.current = null;
    setLastSentTime('');
    setApiStatus('Path cleared');
  };

  // Intentionally re-start tracking when identity/branch changes.
  useEffect(() => {
    startWatchLocation();

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }

      Geolocation.stopObserving?.();

      if (hubRef.current) {
        hubRef.current.stop();
        hubRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldBoyId, loginBranchId]);

  useEffect(() => {
    let mounted = true;

    const loadPrefs = async () => {
      try {
        const enabled = await getBackgroundLocationEnabled();
        if (mounted) setBgLocationEnabled(enabled);
      } catch { }

      try {
        const session = await getLiveLocationSession();
        if (mounted) setLiveSession(session);
      } catch { }
    };

    loadPrefs();
    const interval = setInterval(loadPrefs, 1500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!sampleId) return;
    startLiveLocationSession(sampleId)
      .then(() => getLiveLocationSession())
      .then(session => setLiveSession(session))
      .catch(() => { });
  }, [sampleId]);

  const onMapFail = e => {
    const msg =
      e?.nativeEvent?.error || e?.nativeEvent?.message || 'Map failed to load';
    setMapError(String(msg));
    if (mapStyleUrl !== MAP_STYLE_FALLBACK) {
      setMapStyleUrl(MAP_STYLE_FALLBACK);
    }
  };

  const currentMarkerGeoJSON = {
    type: 'FeatureCollection',
    features: currentLocation
      ? [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          properties: {},
        },
      ]
      : [],
  };

  const branchMarkerGeoJSON = {
    type: 'FeatureCollection',
    features: branchLocation
      ? [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [branchLocation.longitude, branchLocation.latitude],
          },
          properties: {},
        },
      ]
      : [],
  };

  const pathGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: pathCoordinates,
        },
        properties: {},
      },
    ],
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white px-5`}>
        <ActivityIndicator size="large" color="#16a34a" />

        <Text style={tw`mt-3 text-gray-600 font-semibold text-center`}>
          Getting branch and current location...
        </Text>

        <Text style={tw`mt-2 text-gray-400 text-xs text-center`}>
          {apiStatus}
        </Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      <Map
        style={tw`flex-1`}
        mapStyle={mapStyleUrl}
        logo={false}
        attribution={false}
        onDidFailLoadingMap={onMapFail}
        onDidFailLoadingStyle={onMapFail}
        onDidFailLoadingTile={onMapFail}
        androidView={Platform.OS === 'android' ? 'texture' : undefined}>
        <Camera ref={cameraRef} zoom={zoomLevel} center={[longitude, latitude]} />

        {pathCoordinates.length >= 2 && (
          <GeoJSONSource id="livePathSource" data={pathGeoJSON}>
            <Layer
              id="livePathLine"
              type="line"
              paint={{
                'line-color': '#16a34a',
                'line-width': 5,
                'line-opacity': 0.9,
              }}
            />
          </GeoJSONSource>
        )}

        {branchLocation && (
          <GeoJSONSource id="branchLocationSource" data={branchMarkerGeoJSON}>
            <Layer
              id="branchLocationCircle"
              type="circle"
              paint={{
                'circle-radius': 9,
                'circle-color': '#dc2626',
                'circle-stroke-width': 4,
                'circle-stroke-color': '#ffffff',
              }}
            />
          </GeoJSONSource>
        )}

        {currentLocation && (
          <GeoJSONSource id="currentLocationSource" data={currentMarkerGeoJSON}>
            <Layer
              id="currentLocationCircle"
              type="circle"
              paint={{
                'circle-radius': 10,
                'circle-color': '#2563eb',
                'circle-stroke-width': 4,
                'circle-stroke-color': '#ffffff',
              }}
            />
          </GeoJSONSource>
        )}
      </Map>

      {!!mapError && (
        <View style={tw`absolute top-18 left-4 right-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2`}>
          <Text style={tw`text-red-700 text-xs text-center`}>
            Map tiles offline. Check internet/DNS. ({mapStyleUrl.includes('demotiles') ? 'fallback' : 'primary'})
          </Text>
        </View>
      )}

      {/* Zoom Buttons */}
      <View style={tw`absolute right-4 top-28`}>
        <TouchableOpacity
          onPress={zoomIn}
          style={tw`h-11 w-11 bg-white rounded-full items-center justify-center mb-3 shadow-lg`}>
          <Text style={tw`text-black text-2xl font-bold`}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={zoomOut}
          style={tw`h-11 w-11 bg-white rounded-full items-center justify-center mb-3 shadow-lg`}>
          <Text style={tw`text-black text-3xl font-bold`}>−</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToCurrentLocation}
          style={tw`h-11 w-11 bg-blue-600 rounded-full items-center justify-center shadow-lg`}>
          <Text style={tw`text-white text-lg font-bold`}>◎</Text>
        </TouchableOpacity>
      </View>

      <View style={tw`absolute bottom-5 left-0 right-0 bg-gray-300/50 border border-gray-300 rounded-2xl p-2 `}>
        <Text style={tw`text-green-700 text-lg font-bold text-center`}>
          Flabo Live Location
        </Text>

        <Text style={tw`${socketConnected ? 'text-green-600' : 'text-gray-600'} text-center mt-2`}>
          Location: {socketConnected ? 'Connected' : 'Disconnected ❌'}
        </Text>

        <Text style={tw`text-gray-500 text-center mt-2 text-xs`}>
          Field Boy ID: {fieldBoyId || 'Not found'} {fieldBoyData?.fieldBoyName || ''}
        </Text>

        <Text style={tw`text-gray-500 text-center mt-1 text-xs`}>
          Branch ID: {loginBranchId || 'Not found'}
        </Text>

        <Text style={tw`text-gray-500 text-center mt-1 text-xs`}>
          Current Lat: {latitude}
        </Text>

        <Text style={tw`text-gray-500 text-center mt-1 text-xs`}>
          Current Lng: {longitude}
        </Text>



        <Text style={tw`text-gray-500 text-center mt-1 text-xs`}>
          Path Points: {pathCoordinates.length}
        </Text>

        <Text style={tw`text-gray-500 text-center mt-1 text-xs`}>
          Last Sent: {lastSentTime || 'Not sent yet'}
        </Text>

        <Text style={tw`text-gray-500 text-center mt-1 text-xs`}>
          Status: {apiStatus}
        </Text>

        {sampleId ? (
          <View style={tw`mt-4`}>
            <SlideToDeliver
              disabled={false}
              loading={delivering}
              done={delivered}
              onConfirm={markSampleDelivered}
            />
          </View>
        ) : null}

        <View style={tw`flex-row mt-4`}>
          {(() => {
            const mustKeepLive =
              bgLocationEnabled && liveSession?.active;
            const primaryBg = tracking
              ? mustKeepLive
                ? 'bg-gray-500'
                : 'bg-red-500'
              : 'bg-green-600';
            const primaryLabel = tracking
              ? mustKeepLive
                ? 'Locked (Deliver first)'
                : 'Stop Tracking'
              : 'Start Tracking';

            return (
              <TouchableOpacity
                onPress={tracking ? stopWatchLocation : startWatchLocation}
                style={tw`flex-1 ${primaryBg} py-3 rounded-xl mr-2`}>
                <Text style={tw`text-white text-center font-bold`}>
                  {primaryLabel}
                </Text>
              </TouchableOpacity>
            );
          })()}

          <TouchableOpacity
            onPress={clearPath}
            style={tw`bg-gray-700 px-4 py-3 rounded-xl`}>
            <Text style={tw`text-white text-center font-bold`}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default FlaboShareLiveLocation;
