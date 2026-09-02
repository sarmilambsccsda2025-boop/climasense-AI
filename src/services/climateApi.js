const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';

export async function searchLocations(query) {
  if (!query.trim()) return [];
  const response = await fetch(`${GEOCODE}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`);
  if (!response.ok) throw new Error('Location search is unavailable');
  const data = await response.json();
  return (data.results || []).map(item => ({
    id: `${item.latitude}-${item.longitude}`,
    name: item.name,
    country: item.country || item.country_code,
    admin: item.admin1,
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone
  }));
}

export async function getWeather(location) {
  const params = new URLSearchParams({
    latitude: location.latitude, longitude: location.longitude, timezone: 'auto',
    forecast_days: '7',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure,uv_index',
    hourly: 'temperature_2m,precipitation_probability,precipitation,relative_humidity_2m,wind_speed_10m,uv_index,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset'
  });
  const response = await fetch(`${FORECAST}?${params}`);
  if (!response.ok) throw new Error('Weather data is unavailable');
  return response.json();
}

export function riskFromWeather(weather) {
  const current = weather.current || {};
  const daily = weather.daily || {};
  const heat = clamp(Math.round(((daily.temperature_2m_max?.[0] || 20) - 18) * 3.4 + (current.uv_index || 0) * 3));
  const flood = clamp(Math.round((daily.precipitation_sum?.[0] || 0) * 4 + (daily.precipitation_probability_max?.[0] || 0) * .25));
  const drought = clamp(Math.round(Math.max(0, 34 - (daily.precipitation_sum?.[0] || 0)) * 1.4 + Math.max(0, (current.temperature_2m || 20) - 20) * 1.2));
  const storm = clamp(Math.round((current.wind_speed_10m || 0) * 1.7 + (daily.precipitation_probability_max?.[0] || 0) * .2));
  const overall = clamp(Math.round(heat * .28 + flood * .23 + drought * .2 + storm * .29));
  return {heat, flood, drought, storm, overall};
}
function clamp(value) { return Math.max(0, Math.min(100, value)); }
export const weatherLabel = code => ({0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Light drizzle',53:'Drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',80:'Rain showers',81:'Rain showers',82:'Heavy showers',95:'Thunderstorm',96:'Storm with hail',99:'Storm with hail'}[code] || 'Variable conditions');
