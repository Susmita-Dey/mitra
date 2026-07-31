/**
 * WeatherSystem - Fetches weather from open-meteo based on IP location.
 */

export interface WeatherState {
  code: number;
  temperature: number;
  isRaining: boolean;
  lastUpdated: number;
}

export interface WeatherSystem {
  getState(): WeatherState | null;
  start(): void;
}

export function createWeatherSystem(): WeatherSystem {
  let currentState: WeatherState | null = null;
  let hasStarted = false;

  const fetchWeather = async () => {
    try {
      // 1. Get Location
      const locRes = await fetch("https://ipapi.co/json/");
      if (!locRes.ok) throw new Error("Location fetch failed");
      const locData = await locRes.json();
      
      // 2. Get Weather
      const lat = locData.latitude;
      const lon = locData.longitude;
      
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
      if (!weatherRes.ok) throw new Error("Weather fetch failed");
      const weatherData = await weatherRes.json();
      
      const code = weatherData.current.weather_code;
      // WMO Weather interpretation codes (WW)
      // 51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82 are rain/drizzle
      const rainCodes = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
      
      currentState = {
        code,
        temperature: weatherData.current.temperature_2m,
        isRaining: rainCodes.includes(code),
        lastUpdated: Date.now()
      };
      
      console.log(`[WeatherSystem] Weather updated: Temp ${currentState.temperature}°C, Raining: ${currentState.isRaining}`);
    } catch (err) {
      console.warn("[WeatherSystem] Could not update weather:", err);
    }
  };

  return {
    start() {
      if (hasStarted) return;
      hasStarted = true;
      
      fetchWeather();
      // Fetch every hour
      setInterval(fetchWeather, 60 * 60 * 1000);
    },
    getState() {
      return currentState;
    }
  };
}
