import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';

import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';

import * as signalR from '@microsoft/signalr';
import tw from 'twrnc';

import axiosInstance from '../../../Authorization/AxiosInstance';

const HUB_URL = 'http://192.168.31.237:5021/locationHub';
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const DEFAULT_LOCATION = {
  latitude: 20.5937,
  longitude: 78.9629,
};

const toNumber = value => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const haversineMeters = (a, b) => {
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const AdminTrackFieldBoy = () => {
  const cameraRef = useRef(null);
  const hubRef = useRef(null);
  const trackingUserIdRef = useRef('');

  const [fieldBoyList, setFieldBoyList] = useState([]);
  const [fieldBoyLoading, setFieldBoyLoading] = useState(false);
  const [fieldBoyModalVisible, setFieldBoyModalVisible] = useState(false);
  const [fieldBoySearch, setFieldBoySearch] = useState('');

  const [selectedFieldBoy, setSelectedFieldBoy] = useState(null);
  const [trackingUserId, setTrackingUserId] = useState('');

  const [socketConnected, setSocketConnected] = useState(false);
  const [adminRunning, setAdminRunning] = useState(false);
  const [adminLastFix, setAdminLastFix] = useState(null);
  const [path, setPath] = useState([]);
  const [status, setStatus] = useState('Waiting...');

  useEffect(() => {
    trackingUserIdRef.current = trackingUserId;
  }, [trackingUserId]);

  const filteredFieldBoyList = useMemo(() => {
    const search = fieldBoySearch.trim().toLowerCase();

    if (!search) {
      return fieldBoyList;
    }

    return fieldBoyList.filter(item => {
      return (
        String(item.fieldBoyName || '').toLowerCase().includes(search) ||
        String(item.fieldBoyId || '').includes(search)
      );
    });
  }, [fieldBoyList, fieldBoySearch]);

  const fetchFieldBoyList = async () => {
    try {
      setFieldBoyLoading(true);

      const response = await axiosInstance.get('FieldBoy/GetFieldBoyList');

      const list = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      setFieldBoyList(list);

      if (list.length > 0 && !selectedFieldBoy) {
        const first = list[0];
        setSelectedFieldBoy(first);
        setTrackingUserId(String(first.fieldBoyId));
        trackingUserIdRef.current = String(first.fieldBoyId);
      }
    } catch (error) {
      console.log(
        'FieldBoy list error:',
        error?.response?.data || error?.message,
      );

      Alert.alert('Error', 'Unable to fetch field boy list');
    } finally {
      setFieldBoyLoading(false);
    }
  };

  const moveCamera = coords => {
    try {
      cameraRef.current?.easeTo({
        center: [coords.longitude, coords.latitude],
        zoom: 16,
        duration: 800,
        easing: 'ease',
      });
    } catch (error) {
      console.log('Camera error:', error?.message);
    }
  };

  const addPathPoint = nextFix => {
    setPath(prev => {
      const last = prev[prev.length - 1];

      if (!last) {
        return [[nextFix.longitude, nextFix.latitude]];
      }

      const lastFix = {
        latitude: last[1],
        longitude: last[0],
      };

      const movedMeters = haversineMeters(lastFix, nextFix);

      if (movedMeters < 3) {
        return prev;
      }

      return [...prev, [nextFix.longitude, nextFix.latitude]];
    });
  };

  const connectSocket = async () => {
    try {
      if (
        hubRef.current &&
        hubRef.current.state === signalR.HubConnectionState.Connected
      ) {
        return;
      }

      console.log('Connecting admin websocket...');

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      connection.onreconnecting(error => {
        console.log('Socket reconnecting...', error);
        setSocketConnected(false);
        setStatus('Socket reconnecting...');
      });

      connection.onreconnected(() => {
        console.log('Socket reconnected');
        setSocketConnected(true);
        setStatus('Socket reconnected');
      });

      connection.onclose(error => {
        console.log('Socket disconnected', error);
        setSocketConnected(false);
        setStatus('Socket disconnected');
      });

      connection.on('ReceiveLocation', location => {
        try {
          console.log('Admin Received Live Location:', location);

          const selectedId = String(trackingUserIdRef.current || '');
          const receivedId = String(location.fieldBoyId || '');

          if (selectedId && selectedId !== receivedId) {
            console.log('Ignored location for other field boy:', receivedId);
            return;
          }

          const lat = toNumber(location.latitude);
          const lng = toNumber(location.longitude);

          if (lat == null || lng == null) {
            return;
          }

          const nextFix = {
            latitude: lat,
            longitude: lng,
          };

          setAdminLastFix(nextFix);
          addPathPoint(nextFix);
          moveCamera(nextFix);

          setStatus('Receiving live location');
        } catch (error) {
          console.log('ReceiveLocation Error:', error);
        }
      });

      await connection.start();
      await connection.invoke('JoinAdminGroup');

      console.log('================================');
      console.log('Admin socket connected');
      console.log('You are live');
      console.log('================================');

      hubRef.current = connection;
      setSocketConnected(true);
      setStatus('Socket connected');
    } catch (error) {
      console.log('Socket connection failed:', error);
      setSocketConnected(false);
      setStatus('Socket connection failed');
    }
  };

  const startTracking = async () => {
    if (!trackingUserId) {
      Alert.alert('Required', 'Please select field boy');
      return;
    }

    setPath([]);
    setAdminLastFix(null);

    await connectSocket();

    setAdminRunning(true);
    setStatus('Waiting for live location...');
  };

  const stopTracking = () => {
    setAdminRunning(false);
    setStatus('Tracking stopped');
  };

  const clearPath = () => {
    setPath([]);
    setAdminLastFix(null);
  };

  const handleSelectFieldBoy = item => {
    const id = String(item.fieldBoyId);

    setSelectedFieldBoy(item);
    setTrackingUserId(id);
    trackingUserIdRef.current = id;

    setPath([]);
    setAdminLastFix(null);
    setFieldBoyModalVisible(false);
    setFieldBoySearch('');
  };

  useEffect(() => {
    fetchFieldBoyList();

    return () => {
      if (hubRef.current) {
        hubRef.current.stop();
        hubRef.current = null;
      }
    };
  }, []);

  const latitude = adminLastFix?.latitude || DEFAULT_LOCATION.latitude;
  const longitude = adminLastFix?.longitude || DEFAULT_LOCATION.longitude;

  const markerGeoJSON = {
    type: 'FeatureCollection',
    features: adminLastFix
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

  const pathGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: path,
        },
        properties: {},
      },
    ],
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <Map
        style={tw`flex-1`}
        mapStyle={MAP_STYLE}
        logo={false}
        attribution={false}
        androidView={Platform.OS === 'android' ? 'texture' : undefined}>
        <Camera ref={cameraRef} zoom={5} center={[longitude, latitude]} />

        {path.length >= 2 && (
          <GeoJSONSource id="adminPathSource" data={pathGeoJSON}>
            <Layer
              id="adminPathLine"
              type="line"
              paint={{
                'line-color': '#2563eb',
                'line-width': 5,
                'line-opacity': 0.9,
              }}
            />
          </GeoJSONSource>
        )}

        {adminLastFix && (
          <GeoJSONSource id="adminCurrentLocationSource" data={markerGeoJSON}>
            <Layer
              id="adminCurrentLocationCircle"
              type="circle"
              paint={{
                'circle-radius': 10,
                'circle-color': '#dc2626',
                'circle-stroke-width': 4,
                'circle-stroke-color': '#ffffff',
              }}
            />
          </GeoJSONSource>
        )}
      </Map>

      <View
        style={tw`absolute top-0 left-0 right-0 z-50 bg-white pt-14 pb-4 px-3 rounded-b-3xl`}>
        <TouchableOpacity
          onPress={() => {
            fetchFieldBoyList();
            setFieldBoyModalVisible(true);
          }}
          style={tw`border border-gray-300 rounded-xl px-4 py-4 bg-white`}>
          <Text style={tw`text-black font-semibold text-base`}>
            {selectedFieldBoy ? selectedFieldBoy.fieldBoyName : 'Choose Field Boy'}
          </Text>
        </TouchableOpacity>

        <View style={tw`flex-row mt-4`}>
          <TouchableOpacity
            onPress={adminRunning ? stopTracking : startTracking}
            style={tw`flex-1 py-4 rounded-2xl ${
              adminRunning ? 'bg-red-600' : 'bg-green-600'
            } mr-2`}>
            <Text style={tw`text-white text-center font-bold text-base`}>
              {adminRunning ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={clearPath}
            style={tw`px-6 py-4 rounded-2xl bg-gray-800`}>
            <Text style={tw`text-white font-bold text-base`}>Clear</Text>
          </TouchableOpacity>
        </View>

        <Text style={tw`text-center mt-4 text-gray-700 font-bold text-lg`}>
          Socket: {socketConnected ? 'Connected ✅' : 'Disconnected ❌'}
        </Text>

        <Text style={tw`text-center mt-1 text-gray-500 text-sm`}>
          Status: {status}
        </Text>

        {adminLastFix && (
          <Text style={tw`text-center mt-1 text-gray-500 text-xs`}>
            Lat: {latitude} | Lng: {longitude}
          </Text>
        )}
      </View>

      <Modal
        visible={fieldBoyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFieldBoyModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setFieldBoyModalVisible(false)}>
          <View style={tw`flex-1 bg-black/50 justify-end`}>
            <TouchableWithoutFeedback>
              <View style={tw`bg-white rounded-t-3xl p-4 max-h-[80%]`}>
                <Text style={tw`text-lg font-bold text-black mb-3`}>
                  Select Field Boy
                </Text>

                <View style={tw`flex-row items-center mb-3`}>
                  <TextInput
                    value={fieldBoySearch}
                    onChangeText={setFieldBoySearch}
                    placeholder="Search field boy..."
                    placeholderTextColor="#777"
                    style={tw`flex-1 bg-gray-100 rounded-xl px-4 py-3 text-black`}
                  />

                  <TouchableOpacity
                    onPress={fetchFieldBoyList}
                    style={tw`bg-blue-100 rounded-xl px-4 py-3 ml-2`}>
                    <Text style={tw`text-blue-700 text-center font-bold`}>
                      Refresh
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {fieldBoyLoading ? (
                    <Text style={tw`text-center text-gray-500 py-5`}>
                      Loading field boys...
                    </Text>
                  ) : filteredFieldBoyList.length > 0 ? (
                    filteredFieldBoyList.map(item => {
                      const selected =
                        String(trackingUserId) === String(item.fieldBoyId);

                      return (
                        <TouchableOpacity
                          key={String(item.fieldBoyId)}
                          onPress={() => handleSelectFieldBoy(item)}
                          style={[
                            tw`rounded-xl px-4 py-4 mb-2 border`,
                            selected
                              ? tw`bg-blue-50 border-blue-600`
                              : tw`bg-white border-gray-200`,
                          ]}>
                          <View style={tw`flex-row justify-between items-center`}>
                            <Text style={tw`text-black font-bold text-base`}>
                              {item.fieldBoyName}
                            </Text>

                            {selected ? (
                              <Text style={tw`text-blue-600 font-bold`}>
                                Selected
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={tw`text-center text-red-500 py-5`}>
                      No field boy found
                    </Text>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default AdminTrackFieldBoy;