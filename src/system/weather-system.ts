/**
 * WeatherSystem - Fetches weather from open-meteo based on IP location.
 */

export interface WeatherState {
  code: number;
  temperature: number;
  isRaining: boolean;
  isSunny: boolean;
  isCloudy: boolean;
  lastUpdated: number;
}

export interface WeatherSystem {
  getState(): WeatherState | null;
  start(): void;
  setLocation(locationStr: string): void;
}

  export function createWeatherSystem(): WeatherSystem {
    let currentState: WeatherState | null = null;
    let hasStarted = false;
    let customLocation = "";
    const fetchWeather = async () => {
      try {
        let lat: number | null = null;
        let lon: number | null = null;
  
        if (customLocation && customLocation.trim() !== "") {
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(customLocation)}&count=1`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              lat = geoData.results[0].latitude;
              lon = geoData.results[0].longitude;
            }
          }
        } else {
          try {
            const locRes = await fetch("https://ipapi.co/json/");
            if (locRes.ok) {
              const locData = await locRes.json();
              if (locData.latitude) lat = locData.latitude;
              if (locData.longitude) lon = locData.longitude;
            }
          } catch(e) {
            console.error("Weather API error:", e);
           }
        }
      
      if (lat === null || lon === null) {
          throw new Error("Could not determine location for weather.");
      }
      
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
      if (!weatherRes.ok) throw new Error("Weather fetch failed");
      const weatherData = await weatherRes.json();
      
      const code = weatherData.current.weather_code;
      // WMO Weather interpretation codes (WW)
      // Only treat actual rain (61+) or showers (80+) as raining, exclude light drizzle (51, 53, 55).
      const rainCodes = [61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
      const sunnyCodes = [0, 1]; // Clear sky, mainly clear
      const cloudyCodes = [2, 3]; // Partly cloudy, overcast
      
      currentState = {
        code,
        temperature: weatherData.current.temperature_2m,
        isRaining: rainCodes.includes(code),
        isSunny: sunnyCodes.includes(code),
        isCloudy: cloudyCodes.includes(code),
        lastUpdated: Date.now()
      };
      
      // Weather updated silently
    } catch (err) {
      // Fail silently to treat weather as an optional context, not a strict dependency.
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
    setLocation(locationStr: string) {
      if (customLocation !== locationStr) {
        customLocation = locationStr;
        if (hasStarted) fetchWeather(); // Refetch immediately
      }
    },
    getState() {
      return currentState;
    }
  };
}
