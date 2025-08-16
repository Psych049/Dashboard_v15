// Mock data for FarmFlow Dashboard

// Temperature Trend Data (24 hours)
export const temperatureData = [
  { time: '00:00', temperature: 18 },
  { time: '02:00', temperature: 17 },
  { time: '04:00', temperature: 16 },
  { time: '06:00', temperature: 15 },
  { time: '08:00', temperature: 18 },
  { time: '10:00', temperature: 21 },
  { time: '12:00', temperature: 24 },
  { time: '14:00', temperature: 26 },
  { time: '16:00', temperature: 25 },
  { time: '18:00', temperature: 23 },
  { time: '20:00', temperature: 21 },
  { time: '22:00', temperature: 19 },
];

// Moisture & Humidity Trends Data (24 hours)
export const moistureHumidityData = [
  { time: '00:00', moisture: 35, humidity: 60 },
  { time: '02:00', moisture: 35, humidity: 62 },
  { time: '04:00', moisture: 34, humidity: 65 },
  { time: '06:00', moisture: 33, humidity: 67 },
  { time: '08:00', moisture: 32, humidity: 63 },
  { time: '10:00', moisture: 30, humidity: 55 },
  { time: '12:00', moisture: 28, humidity: 50 },
  { time: '14:00', moisture: 26, humidity: 45 },
  { time: '16:00', moisture: 28, humidity: 48 },
  { time: '18:00', moisture: 30, humidity: 52 },
  { time: '20:00', moisture: 32, humidity: 55 },
  { time: '22:00', moisture: 34, humidity: 58 },
];

// Stats Cards Data
export const mockStats = [
  {
    title: 'Temperature',
    value: '24 °C',
    change: '+2%',
    trend: 'up',
    icon: {
      path: 'M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z',
      bgColor: 'bg-orange-500'
    }
  },
  {
    title: 'Humidity',
    value: '45%',
    change: '-5%',
    trend: 'down',
    icon: {
      path: 'M7.5 6.75V0h9v6.75h-9zm9 0h1.5v6.75h-1.5V6.75zM13.5 0h3v6.75h-3V0zM7.5 18v-6.75h9V18h-9zm9 0h1.5v-6.75h-1.5V18zm-10.5 0v-6.75h-6v6.75h6zm-6-10.5v3.75h6V7.5h-6zm0 0V0h6v7.5h-6z',
      bgColor: 'bg-purple-500'
    }
  },
  {
    title: 'Soil Moisture',
    value: '38%',
    change: '+3%',
    trend: 'up',
    icon: {
      path: 'M13 7.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V8a.5.5 0 0 1 .5-.5zM13 3.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm-6.5 2a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 1 0V6a.5.5 0 0 0-.5-.5zM6 11.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0-.5.5zm-1.5-7a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1zM5 8.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0-.5.5zm3 .5a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1H8zm5 0a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1zm.5-3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-.5-.5zm-9-1a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5zm9 3.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-3a.5.5 0 0 0-.5-.5zm-3 1a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1zm-3-4a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1H7z',
      bgColor: 'bg-blue-500'
    }
  },
  {
    title: 'Water Usage',
    value: '12.4L',
    change: '-0.8L',
    trend: 'down',
    icon: {
      path: 'M6.75 5C6.75 2.58 7.5 1 9 1c1.49 0 2.24 1.58 2.24 4 0 .56-.5.75-1.24.75-.73 0-1.24-.19-1.24-.75 0-1.04.5-1.87 1.24-1.87.73 0 1.24.83 1.24 1.87 0 .14-.03.27-.07.39a4.99 4.99 0 0 0-4.66 4.96c0 .75.17 1.47.46 2.11a4.98 4.98 0 0 0-2.19 2.6A5 5 0 0 1 3 9a5 5 0 0 1 3.75-4.84V5Zm2.5 5c0-.44.1-.86.29-1.23A2.99 2.99 0 0 1 13 12a2.996 2.996 0 0 1-3 3 2.99 2.99 0 0 1-2.99-2.96 3 3 0 0 1 2.24-2.93V10Z',
      bgColor: 'bg-green-500'
    }
  }
];

// Weather Forecast Data
export const weatherForecast = [
  { day: 'Today', high: 26, low: 15, condition: 'sunny', icon: '☀️' },
  { day: 'Thu', high: 25, low: 16, condition: 'partly_cloudy', icon: '⛅' },
  { day: 'Fri', high: 24, low: 15, condition: 'cloudy', icon: '☁️' },
  { day: 'Sat', high: 23, low: 14, condition: 'rainy', icon: '🌧️' },
  { day: 'Sun', high: 22, low: 13, condition: 'partly_cloudy', icon: '⛅' }
];

// Current Weather Data
export const currentWeather = {
  temperature: 24,
  condition: 'Sunny',
  feelsLike: 26,
  wind: '8 km/h NE',
  uvIndex: '7 (High)',
  humidity: '45%',
  precipitation: '0 mm'
};

// System Alerts
export const systemAlerts = [
  { type: 'warning', zone: 'Vegetable Garden', message: 'Soil moisture dropping below optimal levels', timeAgo: '10 min ago' },
  { type: 'info', zone: 'Flower Bed', message: 'Scheduled watering completed successfully', timeAgo: '1 hour ago' },
  { type: 'error', zone: 'Herb Garden', message: 'Valve #3 reported possible malfunction', timeAgo: '3 hours ago' }
];

// Plant Zones Data
export const plantZones = [
  { name: 'Vegetable Garden', soilType: 'Loam soil', moistureLevel: 35 },
  { name: 'Flower Bed', soilType: 'Sandy soil', moistureLevel: 28 },
  { name: 'Herb Garden', soilType: 'Potting Mix', moistureLevel: 45 },
  { name: 'Indoor Plants', soilType: 'Peat soil', moistureLevel: 50 }
];

// Soil Recommendations
export const soilRecommendations = {
  'Loam soil': {
    characteristics: 'Equal parts of sand, silt, and clay. Excellent drainage and moisture retention.',
    idealPlants: ['Tomatoes', 'Peppers', 'Cucumbers', 'Zucchini', 'Roses'],
    wateringTips: 'Water deeply but less frequently to encourage root growth.',
    amendments: 'Add compost yearly to maintain organic content.'
  },
  'Sandy soil': {
    characteristics: 'Gritty texture with large particles. Drains quickly but retains little moisture.',
    idealPlants: ['Lavender', 'Rosemary', 'Cacti', 'Sedums', 'Zinnias'],
    wateringTips: 'Water more frequently but in smaller amounts.',
    amendments: 'Add compost and mulch to improve water retention.'
  },
  'Potting Mix': {
    characteristics: 'Lightweight and sterile. Good drainage with adequate water retention.',
    idealPlants: ['Basil', 'Mint', 'Parsley', 'Thyme', 'Cilantro'],
    wateringTips: 'Check moisture level daily, water when top inch feels dry.',
    amendments: 'Replace or refresh annually with fresh mix.'
  },
  'Peat soil': {
    characteristics: 'Dark, rich organic material. Excellent water retention but can become compacted.',
    idealPlants: ['Ferns', 'Orchids', 'African Violets', 'Peace Lily', 'Spider Plant'],
    wateringTips: 'Water thoroughly when top layer becomes dry, avoid overwatering.',
    amendments: 'Mix with perlite or sand to improve drainage.'
  }
};