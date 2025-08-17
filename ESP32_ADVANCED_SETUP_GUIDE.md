# ESP32 Advanced Integration Setup Guide

## 🎯 **Complete ESP32 Advanced Setup with Enhanced Features**

This comprehensive guide covers the advanced ESP32 integration with enhanced error handling, offline operation, and remote control capabilities.

---

## 🚀 **New Advanced Features**

### **Enhanced Reliability**
- ✅ **Automatic WiFi Reconnection** - Self-healing network connections
- ✅ **Data Buffering** - Stores sensor data when offline, sends when reconnected
- ✅ **Command Polling** - Checks for remote commands every 10 seconds
- ✅ **Heartbeat Monitoring** - Reports device status every minute
- ✅ **Sensor Calibration** - Configurable sensor ranges and mapping

### **Smart Irrigation Control**
- ✅ **Remote Pump Control** - Turn pump on/off from dashboard
- ✅ **Timed Irrigation** - Set specific watering durations
- ✅ **Automatic Irrigation** - Triggers based on moisture thresholds
- ✅ **Command Execution Reporting** - Confirms command completion

### **Advanced Monitoring**
- ✅ **Battery Level Tracking** - Monitor device power status
- ✅ **Signal Strength Reporting** - WiFi connection quality
- ✅ **Firmware Version Tracking** - OTA update support (coming soon)
- ✅ **Device Registration** - Automatic device setup

---

## 📋 **Step 1: Hardware Setup**

### **Required Components**
| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP32 Development Board | 1 | Main microcontroller |
| Soil Moisture Sensor | 1 | Monitor soil water content |
| DHT22 Temperature/Humidity Sensor | 1 | Environment monitoring |
| Light Sensor (LDR) | 1 | Sunlight intensity |
| 5V Relay Module | 1 | Water pump control |
| Water Pump | 1 | Irrigation system |
| Status LED | 1 | Visual feedback |
| Breadboard & Jumper Wires | - | Connections |
| Power Supply | 1 | 5V/2A recommended |

### **Pin Connections**
```
ESP32 Pin  →  Component
GPIO 34    →  Soil Moisture Sensor (Analog)
GPIO 35    →  Temperature Sensor (Analog)
GPIO 36    →  Humidity Sensor (Analog)
GPIO 39    →  Light Sensor (Analog)
GPIO 5     →  Relay Module (Digital)
GPIO 2     →  Status LED (Digital)
3.3V       →  Sensor Power
GND        →  Common Ground
5V         →  Relay Module Power
```

### **Wiring Diagram**
```
ESP32                    Sensors
┌─────────┐             ┌─────────────┐
│ GPIO 34 ├─────────────┤ Moisture   │
│ GPIO 35 ├─────────────┤ Temp       │
│ GPIO 36 ├─────────────┤ Humidity   │
│ GPIO 39 ├─────────────┤ Light      │
│ GPIO 5  ├─────────────┤ Relay      │
│ GPIO 2  ├─────────────┤ LED        │
│ 3.3V    ├─────────────┤ VCC        │
│ GND     ├─────────────┤ GND        │
└─────────┘             └─────────────┘
```

---

## 🔧 **Step 2: Software Setup**

### **2.1 Install Required Libraries**
In Arduino IDE, go to **Tools → Manage Libraries** and install:

1. **ArduinoJson** (by Benoit Blanchon) - Version 6.x
2. **WiFi** (built-in with ESP32 board package)
3. **HTTPClient** (built-in with ESP32 board package)
4. **EEPROM** (built-in with ESP32 board package)

### **2.2 Board Configuration**
1. **Board**: "ESP32 Dev Module"
2. **Upload Speed**: "115200"
3. **CPU Frequency**: "240MHz (WiFi/BT)"
4. **Flash Frequency**: "80MHz"
5. **Flash Mode**: "QIO"
6. **Flash Size**: "4MB (32Mb)"
7. **Partition Scheme**: "Default 4MB with spiffs"

---

## ⚙️ **Step 3: Configuration**

### **3.1 Get Dashboard Configuration**
1. Go to **System** page in your dashboard
2. Click **"Add Device"**
3. Fill in device details:
   - **Device Name**: "ESP32_Advanced_001"
   - **Device ID**: "ESP32_ADV_001" (use this exact ID)
   - **Firmware Version**: "v2.0.0"
   - **Zone**: Select your zone

4. **Copy the API Key** from the "Device Configuration" section

### **3.2 Update ESP32 Code**
Open `ESP32_ADVANCED_INTEGRATION.ino` and update these sections:

```cpp
// WiFi Configuration
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Dashboard Configuration
const char* dashboardUrl = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/esp32-data";
const char* commandsUrl = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/esp32-commands";
const char* deviceManagementUrl = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/device-management";
const char* apiKey = "YOUR_ACTUAL_API_KEY_HERE";

// Device Configuration
const String deviceId = "ESP32_ADV_001";        // Must match dashboard
const String zoneId = "YOUR_ZONE_UUID";         // From Plants page
const String deviceName = "ESP32_Advanced_001";
const String firmwareVersion = "v2.0.0";
```

### **3.3 Sensor Calibration**
Update the calibration values based on your sensors:

```cpp
SensorCalibration calibration = {
  0, 4095,    // Moisture: 0-4095 (adjust based on your sensor)
  0, 4095,    // Temperature: 0-4095
  0, 4095,    // Humidity: 0-4095
  0, 4095     // Light: 0-4095
};
```

**Calibration Tips:**
- **Moisture**: Test in dry soil (should read ~0) and wet soil (should read ~100)
- **Temperature**: Compare with room thermometer
- **Humidity**: Use a hygrometer for reference
- **Light**: Test in dark room vs. bright sunlight

---

## 📤 **Step 4: Upload and Test**

### **4.1 Upload Code**
1. Connect ESP32 to computer
2. Select correct board and port
3. Click **Upload** button
4. Wait for upload to complete

### **4.2 Monitor Serial Output**
Open Serial Monitor (115200 baud) and look for:

```
==========================================
ESP32 Advanced Plant Monitor
==========================================
Device ID: ESP32_ADV_001
Zone ID: YOUR_ZONE_UUID
Firmware: v2.0.0
==========================================
Pins initialized successfully
Connecting to WiFi: YOUR_WIFI_NAME
WiFi connected successfully!
IP Address: 192.168.1.xxx
Signal Strength: -45
Device registered successfully!
ESP32 Advanced Plant Monitor initialized successfully!
```

### **4.3 Verify Dashboard Integration**
1. **System Page**: Device should show as "online"
2. **Dashboard**: Real-time sensor data should appear
3. **Plants Page**: Zone should show current sensor values

---

## 🎮 **Step 5: Remote Control Testing**

### **5.1 Test Pump Control**
1. Go to **System** page
2. Find your device in the list
3. Click **"Send Command"**
4. Select **"PUMP_ON"** and click **Send**
5. Watch the ESP32 Serial Monitor for command execution
6. The pump should turn on for 5 seconds

### **5.2 Test Timed Irrigation**
1. Send command: **"PUMP_DURATION"**
2. Set parameters: `{"duration": 10000}` (10 seconds)
3. The pump should run for exactly 10 seconds

### **5.3 Monitor Command Status**
- Commands show as "pending" when sent
- Status updates to "executed" when completed
- Failed commands show as "failed"

---

## 🔧 **Advanced Configuration**

### **Timing Adjustments**
```cpp
const unsigned long sendInterval = 30000;        // Send data every 30 seconds
const unsigned long commandCheckInterval = 10000; // Check commands every 10 seconds
const unsigned long heartbeatInterval = 60000;    // Heartbeat every 1 minute
const unsigned long wifiReconnectInterval = 30000; // Reconnect every 30 seconds
```

### **Buffer Configuration**
```cpp
const int maxBufferSize = 20; // Store up to 20 sensor readings when offline
```

### **Sensor Pin Changes**
```cpp
const int moisturePin = 34;    // Change if needed
const int temperaturePin = 35; // Change if needed
const int humidityPin = 36;    // Change if needed
const int lightPin = 39;       // Change if needed
const int pumpPin = 5;         // Change if needed
const int statusLedPin = 2;    // Change if needed
```

---

## 🚨 **Troubleshooting Guide**

### **WiFi Connection Issues**
```
Problem: WiFi connection failed!
Solution: 
- Check SSID and password
- Ensure ESP32 is within WiFi range
- Try restarting ESP32
- Check WiFi router settings
```

### **API Key Issues**
```
Problem: Invalid or inactive API key
Solution:
- Copy the entire API key from dashboard
- Check for extra spaces or characters
- Verify API key is from correct device
- Ensure device is registered in dashboard
```

### **Sensor Reading Problems**
```
Problem: Sensor values seem incorrect
Solution:
- Check wiring connections
- Calibrate sensor ranges
- Test sensors individually
- Verify power supply (3.3V for sensors)
```

### **Pump Not Working**
```
Problem: Pump doesn't turn on
Solution:
- Check relay module connections
- Verify 5V power to relay
- Test relay with multimeter
- Check pumpPin assignment
```

### **Data Not Appearing in Dashboard**
```
Problem: No sensor data in dashboard
Solution:
- Check Serial Monitor for errors
- Verify device ID matches dashboard
- Check zone ID is correct
- Ensure API key is valid
```

---

## 📊 **Performance Monitoring**

### **Serial Monitor Indicators**
- **WiFi Status**: Connection quality and IP address
- **Data Transmission**: Success/failure of each sensor reading
- **Command Execution**: Remote command processing
- **Buffer Status**: Offline data storage and transmission
- **Error Messages**: Detailed troubleshooting information

### **Dashboard Indicators**
- **Device Status**: Online/offline status
- **Last Seen**: When device last communicated
- **Sensor Values**: Real-time data updates
- **Command History**: Remote control actions
- **Connection Quality**: Signal strength and battery level

---

## 🔮 **Future Enhancements**

### **Coming Soon**
- **OTA Updates**: Update firmware wirelessly
- **Advanced Calibration**: Web-based sensor calibration
- **Data Logging**: Local SD card storage
- **Multiple Zones**: Support for multiple garden areas
- **Weather Integration**: Local weather data integration
- **Smart Scheduling**: AI-powered watering optimization

---

## ✅ **Success Checklist**

Your advanced ESP32 setup is working when:

- ✅ **ESP32 connects to WiFi automatically**
- ✅ **Device appears online in dashboard**
- ✅ **Sensor data updates every 30 seconds**
- ✅ **Commands execute within 10 seconds**
- ✅ **Heartbeat updates every minute**
- ✅ **Offline data buffers and transmits when reconnected**
- ✅ **Pump responds to remote commands**
- ✅ **No errors in Serial Monitor**
- ✅ **Dashboard shows real-time data**

---

## 🎯 **Quick Reference Commands**

### **Dashboard Commands**
- **PUMP_ON**: Turn pump on
- **PUMP_OFF**: Turn pump off  
- **PUMP_DURATION**: Run pump for specified time

### **Serial Monitor Commands**
- Monitor at 115200 baud
- Look for status indicators
- Check error messages
- Verify data transmission

### **Troubleshooting Commands**
- Restart ESP32: Power cycle or reset button
- WiFi reconnect: Automatic every 30 seconds
- Buffer clear: Automatic when reconnected
- Command retry: Automatic every 10 seconds

---

## 🚀 **You're Ready for Advanced Operation!**

With this enhanced setup, your ESP32 now provides:

- **Professional-grade reliability** with automatic error recovery
- **Smart offline operation** with data buffering
- **Remote control capabilities** for irrigation management
- **Advanced monitoring** with battery and signal tracking
- **Scalable architecture** for future enhancements

Your smart garden system is now enterprise-ready! 🌱💧🚀 