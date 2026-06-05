import Geolocation from '@react-native-community/geolocation';
import * as signalR from '@microsoft/signalr';
import { Platform, PermissionsAndroid } from 'react-native';
import { API_BASE_URL } from '../../Authorization/api';

const HUB_URL = `${API_BASE_URL.replace('/api', '')}locationHub`;
const MIN_DISTANCE_METERS = 1;

class LiveTrackingManager {
  constructor() {
    this.isTracking = false;
    this.hubRef = null;
    this.watchId = null;
    this.lastSentCoords = null;
    this.pathCount = 0;
    this.lastSentTime = '';
    this.apiStatus = 'Waiting...';
    
    this.fieldBoyId = null;
    this.listeners = new Set();
  }

  addListener(callback) {
    this.listeners.add(callback);
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(cb => cb(state));
  }

  getState() {
    return {
      isTracking: this.isTracking,
      apiStatus: this.apiStatus,
      pathCount: this.pathCount,
      lastSentTime: this.lastSentTime,
      socketConnected: this.hubRef?.state === signalR.HubConnectionState.Connected
    };
  }

  setApiStatus(status) {
    this.apiStatus = status;
    this.notifyListeners();
  }

  getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = value => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  shouldSendLocation(coords) {
    if (!this.lastSentCoords) return true;
    const distance = this.getDistanceInMeters(
      this.lastSentCoords.latitude,
      this.lastSentCoords.longitude,
      coords.latitude,
      coords.longitude
    );
    return distance >= MIN_DISTANCE_METERS;
  }

  async connectSocket() {
    try {
      if (this.hubRef && this.hubRef.state === signalR.HubConnectionState.Connected) {
        this.notifyListeners();
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
        this.setApiStatus('Socket reconnecting...');
      });

      connection.onreconnected(async () => {
        this.setApiStatus('Socket reconnected');
        if (this.fieldBoyId) {
          await connection.invoke('JoinFieldBoyLive', Number(this.fieldBoyId));
        }
      });

      connection.onclose(() => {
        this.setApiStatus('Socket disconnected');
      });

      await connection.start();
      this.hubRef = connection;

      if (this.fieldBoyId) {
        await connection.invoke('JoinFieldBoyLive', Number(this.fieldBoyId));
      }

      this.setApiStatus('Socket connected');
      return true;
    } catch (error) {
      console.log('Socket Error:', error);
      this.setApiStatus(error?.message || 'Socket failed');
      return false;
    }
  }

  async sendLocationToServer(coords) {
    try {
      if (!this.fieldBoyId) {
        this.setApiStatus('FieldBoyId not found');
        return;
      }

      let connected = this.hubRef && this.hubRef.state === signalR.HubConnectionState.Connected;
      if (!connected) connected = await this.connectSocket();
      if (!connected) {
        this.setApiStatus('Socket not connected');
        return;
      }

      const payload = {
        fieldBoyId: Number(this.fieldBoyId),
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude),
        accuracyMeters: Number(coords.accuracy || 0),
        capturedAt: new Date().toISOString(),
      };

      const result = await this.hubRef.invoke('SendLocation', payload);

      if (result?.status === true) {
        this.lastSentCoords = coords;
        this.lastSentTime = new Date().toLocaleTimeString();
        this.setApiStatus('Live location sent');
      } else {
        this.setApiStatus(result?.message || 'Location send failed');
      }
    } catch (error) {
      console.log('Send Location Error:', error);
      this.setApiStatus(error?.message || 'Location send failed');
    }
  }

  handleCurrentLocation(coords, mapCallback) {
    this.pathCount += 1;
    
    if (mapCallback) {
      mapCallback(coords);
    }

    if (this.shouldSendLocation(coords)) {
      this.sendLocationToServer(coords);
    } else {
      this.setApiStatus(`Waiting for ${MIN_DISTANCE_METERS}m movement`);
    }
  }

  async startTracking(fieldBoyId, mapCallback) {
    if (this.isTracking) {
      // If already tracking, just update the map callback if provided
      if (mapCallback && this.lastSentCoords) {
        mapCallback(this.lastSentCoords);
      }
      return;
    }
    
    this.fieldBoyId = fieldBoyId;
    this.isTracking = true;
    this.setApiStatus('Live tracking starting...');

    await this.connectSocket();

    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
    }

    this.watchId = Geolocation.watchPosition(
      position => {
        const coords = {
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
          accuracy: Number(position.coords.accuracy || 0),
        };
        this.handleCurrentLocation(coords, mapCallback);
      },
      error => {
        console.log('Watch GPS Error:', error);
        this.setApiStatus(error?.message || 'Watch GPS error');
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 3000,
        fastestInterval: 2000,
        maximumAge: 0,
        timeout: 15000,
        forceLocationManager: true,
        showLocationDialog: true,
      }
    );

    this.setApiStatus('Live tracking started');
  }

  stopTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    Geolocation.stopObserving?.();

    if (this.hubRef) {
      this.hubRef.stop();
      this.hubRef = null;
    }

    this.isTracking = false;
    this.lastSentCoords = null;
    this.pathCount = 0;
    this.lastSentTime = '';
    this.setApiStatus('Tracking stopped');
  }

  clearPath() {
    this.lastSentCoords = null;
    this.pathCount = 0;
    this.lastSentTime = '';
    this.setApiStatus('Path cleared');
  }
}

export const liveTrackingManager = new LiveTrackingManager();
