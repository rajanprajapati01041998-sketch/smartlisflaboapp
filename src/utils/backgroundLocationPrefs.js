import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_BG_LOCATION_ENABLED = 'bg_location_enabled_v1';
const KEY_LIVE_LOCATION_SESSION = 'live_location_session_v1';

export async function getBackgroundLocationEnabled() {
  const raw = await AsyncStorage.getItem(KEY_BG_LOCATION_ENABLED);
  return raw === '1';
}

export async function setBackgroundLocationEnabled(enabled) {
  await AsyncStorage.setItem(KEY_BG_LOCATION_ENABLED, enabled ? '1' : '0');
}

export async function getLiveLocationSession() {
  const raw = await AsyncStorage.getItem(KEY_LIVE_LOCATION_SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setLiveLocationSession(session) {
  if (!session) {
    await AsyncStorage.removeItem(KEY_LIVE_LOCATION_SESSION);
    return;
  }
  await AsyncStorage.setItem(KEY_LIVE_LOCATION_SESSION, JSON.stringify(session));
}

export async function startLiveLocationSession(sampleId) {
  await setLiveLocationSession({
    active: true,
    sampleId: sampleId ?? null,
    startedAt: new Date().toISOString(),
  });
}

export async function stopLiveLocationSession() {
  await setLiveLocationSession(null);
}

