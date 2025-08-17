# ESP32 Smart Garden Monitor - Complete Setup Guide

This guide will help you set up your ESP32 to connect with your Supabase-powered dashboard for smart garden monitoring.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Hardware Setup](#hardware-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Arduino IDE Setup](#arduino-ide-setup)
5. [ESP32 Code Configuration](#esp32-code-configuration)
6. [Testing and Troubleshooting](#testing-and-troubleshooting)
7. [Advanced Features](#advanced-features)

## 🛠️ Prerequisites

### Hardware Requirements
- ESP32 development board (ESP32-WROOM-32 or similar)
- Soil moisture sensor (capacitive recommended)
- Temperature sensor (TMP36, DS18B20, or DHT22)
- Humidity sensor (DHT22 or SHT30)
- Light sensor (LDR or BH1750)
- Water pump and relay module (5V relay)
- Jumper wires and breadboard
- Power supply (5V/3.3V)
- Optional: Buzzer for alerts

### Software Requirements
- Arduino IDE (version 1.8.19 or later)
- ESP32 board package
- ArduinoJson library (version 6.x)
- Active Supabase project

## 🔌 Hardware Setup

### Pin Connections

| Component | ESP32 Pin | Notes |
|-----------|-----------|-------|
| Soil Moisture Sensor | GPIO 34 (A0) | Analog input |
| Temperature Sensor | GPIO 35 (A1) | Analog input |
| Humidity Sensor | GPIO 36 (A2) | Analog input |
| Light Sensor | GPIO 39 (A3) | Analog input |
| Water Pump Relay | GPIO 5 | Digital output |
| Status LED | GPIO 2 | Built-in LED |
| Buzzer (Optional) | GPIO 4 | Digital output |

### Wiring Diagram

```
ESP32                    Sensors/Components
======                   ==================
GPIO 34 (A0) ---------> Moisture Sensor (Signal)
GPIO 35 (A1) ---------> Temperature Sensor (Signal)
GPIO 36 (A2) ---------> Humidity Sensor (Signal)
GPIO 39 (A3) ---------> Light Sensor (Signal)
GPIO 5 ---------------> Relay Module (IN)
GPIO 2 ---------------> Built-in LED
GPIO 4 ---------------> Buzzer (Optional)

3.3V -----------------> Sensors VCC
GND ------------------> Sensors/Relay GND
5V -------------------> Relay VCC
```

### Important Notes
- Use capacitive soil moisture sensors for better longevity
- Add pull-up resistors (10kΩ) for digital sensors if needed
- Ensure proper power supply (ESP32 needs stable 3.3V)
- Use a relay module to control high-power water pumps safely

## ☁️ Supabase Configuration

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be fully provisioned

### 2. Get API Credentials
1. Go to Settings → API
2. Copy your **Project URL** and **anon public key**
3. Save these for later configuration

### 3. Deploy Edge Functions
Your project should already have the following edge functions deployed:
- `esp32-data` - Handles sensor data from ESP32
- `esp32-commands` - Manages remote commands
- `device-management` - Handles device registration

If not deployed, contact your system administrator.

### 4. Create Zone and API Key
1. Access your dashboard web interface
2. Create a new zone for your garden area
3. Generate an API key for your ESP32 device
4. Note the Zone UUID and API key for configuration

## 💻 Arduino IDE Setup

### 1. Install ESP32 Board Package
1. Open Arduino IDE
2. Go to File → Preferences
3. Add this URL to Additional Board Manager URLs:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Go to Tools → Board → Boards Manager
5. Search for "ESP32" and install the package by Espressif Systems

### 2. Install Required Libraries
1. Go to Sketch → Include Library → Manage Libraries
2. Install the following libraries:
   - **ArduinoJson** by Benoit Blanchon (version 6.x)
   - **WiFi** (should be included with ESP32 package)
   - **HTTPClient** (should be included with ESP32 package)

### 3. Select Board and Port
1. Go to Tools → Board → ESP32 Arduino
2. Select your ESP32 board (e.g., "ESP32 Dev Module")
3. Select the correct COM port under Tools → Port

## ⚙️ ESP32 Code Configuration

### 1. Download the Code
Download these files from the project:
- `ESP32_SUPABASE_INTEGRATION.ino` - Main firmware
- `ESP32_CONFIG_TEMPLATE.h` - Configuration template

### 2. Create Configuration File
1. Copy `ESP32_CONFIG_TEMPLATE.h` to `config.h` in your Arduino sketch folder
2. Update the configuration values:

```cpp
// WiFi Configuration
#define WIFI_SSID "Your_WiFi_Network_Name"
#define WIFI_PASSWORD "Your_WiFi_Password"

// Supabase Configuration
#define SUPABASE_URL "https://your-project-id.supabase.co"
#define SUPABASE_ANON_KEY "your_supabase_anon_key_here"

// Device Configuration
#define DEVICE_ID "esp32_garden_001"
#define ZONE_ID "your_zone_uuid_here"
```

### 3. Sensor Calibration
Test your sensors and adjust calibration values:

```cpp
// Sensor Calibration
#define MOISTURE_MIN 0        // Raw value when completely dry
#define MOISTURE_MAX 4095     // Raw value when completely wet
#define LIGHT_MIN 0           // Raw value in darkness
#define LIGHT_MAX 4095        // Raw value in bright light
```

## 🧪 Testing and Troubleshooting

### 1. Upload and Monitor
1. Connect your ESP32 to your computer
2. Upload the code using Arduino IDE
3. Open Serial Monitor (115200 baud rate)
4. Watch the startup sequence and connection status

### 2. Expected Serial Output
```
==========================================
ESP32 Smart Garden Monitor v3.0.0
Supabase Integration
==========================================
✅ Hardware pins initialized
📐 Sensor calibration loaded
Connecting to WiFi: Your_WiFi_Name
✅ WiFi connected successfully!
IP Address: 192.168.1.100
Signal Strength: -45 dBm
📋 Registering device... ✅ Success
==========================================
Device Configuration:
Device ID: esp32_garden_001
Zone ID: your_zone_uuid_here
Firmware: v3.0.0
Status: Online
==========================================
📊 Current Sensor Readings:
   🌱 Moisture: 45.2%
   🌡️  Temperature: 24.1°C
   💧 Humidity: 60.3%
   ☀️  Light: 78.9%
```

### 3. Common Issues and Solutions

#### WiFi Connection Failed
- **Problem**: ESP32 can't connect to WiFi
- **Solutions**:
  - Verify SSID and password are correct
  - Check WiFi signal strength
  - Ensure WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
  - Try moving closer to the router

#### Device Registration Failed
- **Problem**: "Device registration failed" message
- **Solutions**:
  - Verify Supabase URL and API key
  - Check if edge functions are deployed
  - Ensure Zone ID exists in dashboard
  - Check internet connectivity

#### Sensor Readings Incorrect
- **Problem**: Sensor values seem wrong
- **Solutions**:
  - Check wiring connections
  - Verify power supply (3.3V for sensors)
  - Adjust calibration values in config.h
  - Test sensors individually

#### Data Not Appearing in Dashboard
- **Problem**: ESP32 sends data but dashboard shows nothing
- **Solutions**:
  - Check API key validity
  - Verify Zone ID matches dashboard
  - Check edge function logs in Supabase
  - Ensure database schema is up to date

## 🚀 Advanced Features

### 1. Remote Commands
Your ESP32 can receive commands from the dashboard:
- `PUMP_ON` - Turn on water pump
- `PUMP_OFF` - Turn off water pump  
- `PUMP_DURATION` - Run pump for specified duration
- `READ_SENSORS` - Force sensor reading
- `CALIBRATE` - Trigger calibration mode

### 2. Automatic Irrigation
The system can automatically water your plants when:
- Soil moisture drops below threshold (set in dashboard)
- Zone has auto-watering enabled
- ESP32 receives irrigation command from server

### 3. Offline Operation
ESP32 handles network issues gracefully:
- Buffers sensor data when offline
- Automatically sends buffered data when reconnected
- Continues local irrigation based on moisture levels
- Status LED indicates connection status

### 4. Status LED Indicators
- **Solid ON**: Online and registered
- **Fast Blink**: Online but not registered
- **Slow Blink**: Offline/disconnected

### 5. Data Buffering
When offline, ESP32 stores up to 10 sensor readings in memory and transmits them when connection is restored.

## 🔧 Maintenance

### Regular Tasks
1. **Monitor Serial Output**: Check for errors or warnings
2. **Calibrate Sensors**: Recalibrate monthly or when readings seem off
3. **Update Firmware**: Check for firmware updates periodically
4. **Clean Sensors**: Keep moisture sensor clean and free of corrosion
5. **Check Connections**: Ensure all wires are secure

### Performance Optimization
1. **Adjust Timing**: Modify send intervals based on your needs
2. **Power Management**: Implement deep sleep for battery operation
3. **Sensor Selection**: Use I2C sensors for better accuracy
4. **Error Handling**: Monitor failed transmission counts

## 📞 Support

If you encounter issues:

1. **Check Serial Monitor**: Look for error messages and codes
2. **Verify Configuration**: Double-check all configuration values
3. **Test Components**: Test sensors and connectivity individually
4. **Check Documentation**: Review this guide and code comments
5. **Contact Support**: Provide serial monitor output and configuration details

## 📈 Next Steps

After successful setup, consider:

1. **Multiple Zones**: Set up additional ESP32s for different garden areas
2. **Advanced Sensors**: Add pH, EC, or NPK sensors
3. **Weather Integration**: Connect to weather APIs for better automation
4. **Mobile Alerts**: Set up push notifications for critical events
5. **Data Analytics**: Use dashboard analytics for garden optimization

---

**Happy Gardening! 🌱**

Your ESP32 Smart Garden Monitor is now ready to help you maintain the perfect growing environment for your plants.