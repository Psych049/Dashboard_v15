# ESP32 Configuration Guide

## 🎯 **Complete ESP32 Setup with Dashboard Integration**

This guide shows you exactly how to get all the configuration data you need from your dashboard to set up your ESP32 device.

---

## 📋 **Step 1: Add Device to Dashboard**

### 1.1 Go to System Page
1. Open your dashboard
2. Navigate to **System** page
3. Click **"Add Device"** button

### 1.2 Fill Device Information
- **Device Name**: "My Real ESP32" (or any name you prefer)
- **Device ID**: "ESP32_REAL_001" (use this exact ID in your ESP32 code)
- **Firmware Version**: "v1.0.0"
- **Zone**: Select a zone from the dropdown (create one first if needed)

### 1.3 Create Zone (if needed)
If you don't see any zones in the dropdown:
1. Go to **Plants** page
2. Click **"Add Zone"**
3. Fill in zone details:
   - **Name**: "Garden Zone 1"
   - **Description**: "Main garden area"
   - **Soil Type**: "Loamy"
   - **Moisture Threshold**: 40
4. Click **"Add Zone"**
5. Go back to **System** page and add your device

---

## 🔑 **Step 2: Get Your Configuration Data**

### 2.1 Find Your API Key
After adding your device, scroll down to the **"Device Configuration"** section. You'll see:

```
API Key (for ESP32 code)
[long-api-key-string] [Copy]
```

**Click the "Copy" button** to copy your API key.

### 2.2 Get Device Configuration
In the same section, you'll see a **"Device Configuration (for ESP32 code)"** box with:

```cpp
const String deviceId = "ESP32_REAL_001";
const String deviceName = "My Real ESP32";
const char* apiKey = "your-actual-api-key-here";
const String sensorZoneId = "ZONE_001"; // Update this
```

### 2.3 Get Zone ID
To get the correct zone ID:
1. Go to **Plants** page
2. Find your zone in the list
3. Note the zone ID (it will be something like "ZONE_001" or a UUID)
4. Update the `sensorZoneId` in your ESP32 code

### 2.4 Get Supabase Configuration
The dashboard also shows the **"Supabase Configuration"**:

```cpp
const char* supabaseUrl = "https://gqzaxkczxcudxbbkudmm.supabase.co";
const char* supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

---

## 🔧 **Step 3: Configure ESP32 Code**

### 3.1 Update Configuration Section
Open `esp32_real_device.ino` and update these lines:

```cpp
// WiFi Configuration - UPDATE THESE
const char* ssid = "YOUR_WIFI_NAME";           // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password

// Device Configuration - MUST MATCH DASHBOARD
const String deviceId = "ESP32_REAL_001";      // From dashboard
const String deviceName = "My Real ESP32";     // From dashboard
const String sensorZoneId = "ZONE_001";        // From Plants page

// API Key - FROM DASHBOARD
const char* apiKey = "your-actual-api-key-here";  // From dashboard copy button

// Supabase Configuration - FROM DASHBOARD
const char* supabaseUrl = "https://gqzaxkczxcudxbbkudmm.supabase.co";
const char* supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### 3.2 Quick Copy Method
1. In the dashboard, click **"Copy"** next to your API key
2. Paste it directly into your ESP32 code
3. Update the device ID and zone ID to match your dashboard

---

## 🔌 **Step 4: Hardware Connections**

Connect your sensors to these pins:

| Component | ESP32 Pin | Connection |
|-----------|-----------|------------|
| DHT22 | GPIO 4 | VCC → 3.3V, GND → GND, DATA → GPIO 4 |
| Soil Moisture | GPIO 36 | VCC → 3.3V, GND → GND, SIG → GPIO 36 |
| Relay/Pump | GPIO 5 | VCC → 5V, GND → GND, IN → GPIO 5 |
| Status LED | GPIO 2 | Anode → GPIO 2, Cathode → GND (with 220Ω resistor) |

---

## 📤 **Step 5: Upload and Test**

### 5.1 Upload Code
1. Connect ESP32 to computer
2. Select correct board and port in Arduino IDE
3. Upload `esp32_real_device.ino`

### 5.2 Monitor Serial Output
Open Serial Monitor (115200 baud) and look for:

```
========================================
ESP32 Plant Monitor - REAL DEVICE
========================================
Device ID: ESP32_REAL_001
Device Name: My Real ESP32
Zone ID: ZONE_001
========================================
Initializing DHT sensor...
Connecting to WiFi: YOUR_WIFI_NAME
WiFi connected successfully!
IP Address: 192.168.1.xxx
Signal Strength: -45
Device status updated successfully
ESP32 Plant Monitor initialized successfully!
```

### 5.3 Verify Dashboard Integration
1. Go to **System** page
2. Your device should show as **"online"**
3. Go to **Dashboard** page
4. You should see real sensor data

---

## ✅ **Success Checklist**

Your setup is working when:

- ✅ **ESP32 connects to WiFi**
- ✅ **Device appears online in dashboard**
- ✅ **API key is copied correctly**
- ✅ **Device ID matches dashboard**
- ✅ **Zone ID is correct**
- ✅ **Sensor data appears in dashboard**
- ✅ **No errors in Serial Monitor**

---

## 🔧 **Troubleshooting**

### **API Key Issues**
- Make sure you copied the entire API key
- Check that there are no extra spaces
- Verify the API key is from the correct device

### **Device ID Mismatch**
- Device ID in ESP32 code must exactly match dashboard
- Check for typos or extra characters
- Case-sensitive matching

### **Zone ID Issues**
- Go to Plants page to see your zone ID
- Update `sensorZoneId` in ESP32 code
- Make sure zone exists in dashboard

### **WiFi Connection**
- Check WiFi name and password
- Ensure ESP32 is within WiFi range
- Try restarting ESP32

---

## 🎯 **Quick Reference**

### **Dashboard Locations:**
- **Add Device**: System page → "Add Device" button
- **API Keys**: System page → "Device Configuration" section
- **Zone IDs**: Plants page → Zone list
- **Device Status**: System page → "Connected Devices" section

### **ESP32 Code Sections:**
- **WiFi Config**: Lines 25-26
- **Device Config**: Lines 29-32
- **API Key**: Line 35
- **Supabase Config**: Lines 38-39

### **Copy Commands:**
- **API Key**: Click "Copy" button in dashboard
- **Device Config**: Copy from "Device Configuration" box
- **Supabase Config**: Copy from "Supabase Configuration" box

---

## 🚀 **You're Ready!**

Once you've completed these steps, your ESP32 will be fully integrated with your dashboard. You can:

- View real-time sensor data
- Send commands to your device
- Monitor device status
- Set up automated watering schedules
- Receive alerts and notifications

Your smart garden system is now operational! 🌱💧 