import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Keyboard,
  Alert,
} from 'react-native';

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';

const Location = () => {
  const mapRef = useRef(null);
  const bikeIntervalRef = useRef(null);

  const [startPlace, setStartPlace] = useState('Varanasi');
  const [endPlace, setEndPlace] = useState('Prayagraj');

  const [showSearchPanel, setShowSearchPanel] = useState(true);

  const [startLocation, setStartLocation] = useState({
    latitude: 25.3176,
    longitude: 82.9739,
  });

  const [endLocation, setEndLocation] = useState({
    latitude: 25.4358,
    longitude: 81.8463,
  });

  const [currentPosition, setCurrentPosition] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [remainingRouteCoordinates, setRemainingRouteCoordinates] = useState([]);

  const [totalDistance, setTotalDistance] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(0);

  const [routeError, setRouteError] = useState('');
  const [loading, setLoading] = useState(false);
  const [arrived, setArrived] = useState(false);

  const region = {
    latitude: startLocation.latitude,
    longitude: startLocation.longitude,
    latitudeDelta: 0.7,
    longitudeDelta: 0.7,
  };

  const safeJsonParse = text => {
    try {
      return JSON.parse(text);
    } catch (error) {
      console.log('Invalid JSON Response:', text);
      return null;
    }
  };

  const formatDuration = minutes => {
    const totalMinutes = Math.ceil(Number(minutes) || 0);

    if (totalMinutes <= 0) {
      return '0 min';
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours} hr ${mins} min`;
    }

    if (hours > 0) {
      return `${hours} hr`;
    }

    return `${mins} min`;
  };

  const getCoordinatesFromPlace = async place => {
    try {
      const cleanPlace = place.trim();

      if (!cleanPlace) {
        return null;
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanPlace,
      )}&limit=1`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ReactNativeLocationApp/1.0',
        },
      });

      const text = await response.text();
      const data = safeJsonParse(text);

      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }

      return {
        latitude: Number(data[0].lat),
        longitude: Number(data[0].lon),
      };
    } catch (error) {
      console.log('Geocoding Error:', error);
      return null;
    }
  };

  const stopBikeAnimation = () => {
    if (bikeIntervalRef.current) {
      clearInterval(bikeIntervalRef.current);
      bikeIntervalRef.current = null;
    }
  };

  const animateMarkerOnRoute = (coordinates, distanceKm) => {
    stopBikeAnimation();

    if (!coordinates || coordinates.length === 0) {
      return;
    }

    let index = 0;

    setArrived(false);

    bikeIntervalRef.current = setInterval(() => {
      if (index >= coordinates.length) {
        stopBikeAnimation();

        const lastPoint = coordinates[coordinates.length - 1];

        setCurrentPosition(lastPoint);
        setRemainingRouteCoordinates([]);
        setRemainingDistance(0);
        setSpeed(0);
        setArrived(true);

        mapRef.current?.animateCamera(
          {
            center: lastPoint,
            zoom: 16,
          },
          {
            duration: 800,
          },
        );

        return;
      }

      const position = coordinates[index];
      const remainingCoords = coordinates.slice(index);

      const remaining =
        ((coordinates.length - index) / coordinates.length) * distanceKm;

      const dynamicSpeed = Math.floor(Math.random() * 20) + 35;

      setSpeed(dynamicSpeed);
      setCurrentPosition(position);
      setRemainingRouteCoordinates(remainingCoords);
      setRemainingDistance(remaining);

      mapRef.current?.animateCamera(
        {
          center: position,
          zoom: 15,
        },
        {
          duration: 700,
        },
      );

      index += 5;
    }, 1000);
  };

  const getRoute = async (start, end) => {
    try {
      stopBikeAnimation();

      setRouteError('');
      setArrived(false);
      setRouteCoordinates([]);
      setRemainingRouteCoordinates([]);
      setCurrentPosition(null);
      setTotalDistance(0);
      setRemainingDistance(0);
      setDuration(0);
      setSpeed(0);

      const url =
        `https://router.project-osrm.org/route/v1/car/` +
        `${start.longitude},${start.latitude};` +
        `${end.longitude},${end.latitude}` +
        `?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const text = await response.text();
      const json = safeJsonParse(text);

      if (!json || !json.routes || json.routes.length === 0) {
        setRouteError('Route not found');
        return false;
      }

      const route = json.routes[0];

      const coordinates = route.geometry.coordinates.map(item => ({
        latitude: item[1],
        longitude: item[0],
      }));

      const distanceKm = route.distance / 1000;
      const durationMin = route.duration / 60;

      setRouteCoordinates(coordinates);
      setRemainingRouteCoordinates(coordinates);
      setTotalDistance(distanceKm);
      setRemainingDistance(distanceKm);
      setDuration(durationMin);
      setCurrentPosition(coordinates[0]);

      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 190,
          right: 60,
          bottom: 120,
          left: 60,
        },
        animated: true,
      });

      setTimeout(() => {
        animateMarkerOnRoute(coordinates, distanceKm);
      }, 1000);

      return true;
    } catch (error) {
      console.log('OSRM Route Error:', error);
      setRouteError('Unable to fetch route');
      return false;
    }
  };

  const handleShowPath = async () => {
    Keyboard.dismiss();

    if (!startPlace.trim()) {
      Alert.alert('Required', 'Please enter start location');
      return;
    }

    if (!endPlace.trim()) {
      Alert.alert('Required', 'Please enter destination');
      return;
    }

    try {
      setLoading(true);
      setRouteError('Searching location...');

      const start = await getCoordinatesFromPlace(startPlace);
      const end = await getCoordinatesFromPlace(endPlace);

      if (!start) {
        setRouteError('Start location not found');
        return;
      }

      if (!end) {
        setRouteError('Destination location not found');
        return;
      }

      setStartLocation(start);
      setEndLocation(end);

      const success = await getRoute(start, end);

      if (success) {
        setRouteError('');
        setShowSearchPanel(false);
      }
    } catch (error) {
      console.log('Show Path Error:', error);
      setRouteError('Unable to load route');
    } finally {
      setLoading(false);
    }
  };

  const zoomIn = async () => {
    const camera = await mapRef.current?.getCamera();

    if (camera) {
      mapRef.current?.animateCamera({
        center: camera.center,
        zoom: camera.zoom + 1,
      });
    }
  };

  const zoomOut = async () => {
    const camera = await mapRef.current?.getCamera();

    if (camera) {
      mapRef.current?.animateCamera({
        center: camera.center,
        zoom: camera.zoom - 1,
      });
    }
  };

  return (
    <View style={tw`flex-1`}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={tw`flex-1`}
        initialRegion={region}
        mapType="standard"
        showsTraffic
        showsBuildings
        showsIndoors
        showsCompass
        showsScale
        showsPointsOfInterest
        showsMyLocationButton
        toolbarEnabled>

        <Marker coordinate={endLocation} title="Destination" pinColor="red" />

        {remainingRouteCoordinates.length > 0 && (
          <Polyline
            coordinates={remainingRouteCoordinates}
            strokeColor="#2563EB"
            strokeWidth={7}
          />
        )}

        {currentPosition ? (
          <Marker coordinate={currentPosition} anchor={{ x: 0.5, y: 0.5 }}>
            {arrived ? (
              <View style={tw`items-center`}>
                <MaterialIcons name="location-on" size={50} color="green" />

                <View style={tw`bg-green-600 px-3 py-1 rounded-full`}>
                  <Text style={tw`text-white text-xs font-bold`}>
                    Arrived
                  </Text>
                </View>
              </View>
            ) : (
              <View style={tw`items-center justify-center`}>
                <View
                  style={tw`h-6 w-6 rounded-full bg-blue-600 border-4 border-white shadow-lg`}
                />

                <View
                  style={tw`h-14 w-14 rounded-full bg-blue-400 opacity-25 absolute`}
                />
              </View>
            )}
          </Marker>
        ) : (
          <Marker coordinate={startLocation}>
            <View
              style={tw`h-6 w-6 rounded-full bg-blue-600 border-4 border-white`}
            />
          </Marker>
        )}
      </MapView>

      <View
        style={tw`absolute top-5 left-3 right-3 bg-white rounded-3xl p-4 shadow-xl`}>
        <View style={tw`flex-row justify-between`}>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-gray-500 text-[10px]`}>TOTAL</Text>
            <Text style={tw`text-black text-sm font-bold`}>
              {totalDistance.toFixed(2)} km
            </Text>
          </View>

          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-gray-500 text-[10px]`}>REMAINING</Text>
            <Text style={tw`text-blue-700 text-sm font-bold`}>
              {remainingDistance.toFixed(2)} km
            </Text>
          </View>

          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-gray-500 text-[10px]`}>TIME</Text>
            <Text style={tw`text-black text-sm font-bold`}>
              {formatDuration(duration)}
            </Text>
          </View>

          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-gray-500 text-[10px]`}>SPEED</Text>
            <Text style={tw`text-green-600 text-sm font-bold`}>
              {speed} km/h
            </Text>
          </View>
        </View>

        {arrived ? (
          <View style={tw`mt-3 bg-green-100 rounded-2xl py-2`}>
            <Text style={tw`text-center text-green-700 font-bold`}>
              Arrived at Destination
            </Text>
          </View>
        ) : null}

        {routeError ? (
          <Text
            style={[
              tw`mt-3 font-semibold text-center`,
              routeError === 'Searching location...'
                ? tw`text-blue-600`
                : tw`text-red-600`,
            ]}>
            {routeError}
          </Text>
        ) : null}
      </View>

      {showSearchPanel && (
        <View
          style={tw`absolute bottom-5 left-4 right-4 bg-white rounded-3xl p-4 shadow-xl`}>
          <Text style={tw`text-black text-lg font-bold mb-3`}>
            Route Navigation
          </Text>

          <TextInput
            value={startPlace}
            onChangeText={setStartPlace}
            placeholder="Enter Start Location"
            placeholderTextColor="#666"
            style={tw`bg-gray-100 rounded-2xl px-4 py-3 text-black mb-3`}
          />

          <TextInput
            value={endPlace}
            onChangeText={setEndPlace}
            placeholder="Enter Destination"
            placeholderTextColor="#666"
            style={tw`bg-gray-100 rounded-2xl px-4 py-3 text-black`}
          />

          <TouchableOpacity
            onPress={handleShowPath}
            disabled={loading}
            style={[
              tw`rounded-2xl py-4 mt-4`,
              loading ? tw`bg-gray-400` : tw`bg-blue-700`,
            ]}>
            <Text style={tw`text-white text-center font-bold text-base`}>
              {loading ? 'Loading Route...' : 'Start Navigation'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!showSearchPanel && (
        <TouchableOpacity
          onPress={() => {
            stopBikeAnimation();
            setShowSearchPanel(true);
          }}
          style={tw`absolute bottom-6 left-5 bg-blue-700 h-14 w-14 rounded-full items-center justify-center shadow-lg`}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={tw`absolute right-4 bottom-10`}>
        <TouchableOpacity
          onPress={zoomIn}
          style={tw`bg-white h-14 w-14 rounded-full items-center justify-center mb-3 shadow-lg`}>
          <Ionicons name="add" size={30} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={zoomOut}
          style={tw`bg-white h-14 w-14 rounded-full items-center justify-center shadow-lg`}>
          <Ionicons name="remove" size={30} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Location;