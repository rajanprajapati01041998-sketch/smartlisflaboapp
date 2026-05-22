import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import {Map, Camera, GeoJSONSource, Layer} from '@maplibre/maplibre-react-native';
import * as signalR from '@microsoft/signalr';
import tw from 'twrnc';

import {useAuth} from '../../../../Authorization/AuthContext';
import api, {API_BASE_URL} from '../../../../Authorization/api';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const MIN_DISTANCE_METERS = 1;
const HUB_URL = `${API_BASE_URL.replace('/api', '')}locationHub`;

const FlaboShareLiveLocation = () => {
  const watchIdRef = useRef(null);
  const cameraRef = useRef(null);
  const lastSentCoordsRef = useRef(null);
  const hubRef = useRef(null);

  const {fieldBoyId, loginBranchId, fieldBoyData} = useAuth();

  const [branchLocation, setBranchLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSentTime, setLastSentTime] = useState('');
  const [apiStatus, setApiStatus] = useState('Waiting...');
  const [tracking, setTracking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(17);

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
    moveCamera({latitude, longitude}, nextZoom);
  };

  const zoomOut = () => {
    const nextZoom = Math.max(zoomLevel - 1, 3);
    setZoomLevel(nextZoom);
    moveCamera({latitude, longitude}, nextZoom);
  };

  const goToCurrentLocation = () => {
    moveCamera({latitude, longitude}, zoomLevel);
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

        return (
          granted['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED
        );
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
        return true;
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(String(HUB_URL), {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      connection.onreconnecting(() => {
        setSocketConnected(false);
        setApiStatus('Socket reconnecting...');
      });

      connection.onreconnected(() => {
        setSocketConnected(true);
        setApiStatus('Socket reconnected');
      });

      connection.onclose(() => {
        setSocketConnected(false);
        setApiStatus('Socket disconnected');
      });

      await connection.start();

      hubRef.current = connection;
      setSocketConnected(true);
      setApiStatus('Socket connected');

      return true;
    } catch (error) {
      console.log('Socket connection failed:', error);
      setSocketConnected(false);
      setApiStatus('Socket connection failed');
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
        enableHighAccuracy: true,
        timeout: 120000,
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
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 3000,
        fastestInterval: 2000,
        maximumAge: 0,
        timeout: 120000,
        forceLocationManager: true,
        showLocationDialog: true,
      },
    );
  };

  const stopWatchLocation = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTracking(false);
    setApiStatus('Tracking stopped');
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
  }, [fieldBoyId, loginBranchId]);

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
        mapStyle={MAP_STYLE}
        logo={false}
        attribution={false}
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

      <View style={tw`absolute bottom-5 left-4 right-4 bg-gray-300/50 border rounded-2xl p-4`}>
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
          Zoom: {zoomLevel}
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

        <View style={tw`flex-row mt-4`}>
          <TouchableOpacity
            onPress={tracking ? stopWatchLocation : startWatchLocation}
            style={tw`flex-1 ${tracking ? 'bg-red-500' : 'bg-green-600'} py-3 rounded-xl mr-2`}>
            <Text style={tw`text-white text-center font-bold`}>
              {tracking ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>

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