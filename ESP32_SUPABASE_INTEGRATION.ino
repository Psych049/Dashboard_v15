/*
 * ESP32 Smart Garden Monitor - Supabase Integration
 * 
 * This firmware connects ESP32 to your Supabase-powered dashboard
 * Features:
 * - WiFi management with auto-reconnection
 * - Real-time sensor data transmission
 * - Command polling for remote control
 * - Data buffering for offline operation
 * - Device registration and heartbeat
 * - Irrigation control based on moisture thresholds
 * 
 * Author: ESP32 Integration System
 * Version: 3.0.0
 * Date: 2024
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <esp_wifi.h>
#include <esp_system.h>

// ===== CONFIGURATION SECTION =====
// ⚠️  IMPORTANT: Update these values with your actual configuration

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase Configuration
const char* supabaseUrl = "https://your-project.supabase.co";
const char* apiKey = "YOUR_SUPABASE_ANON_KEY";

// API Endpoints
String dataEndpoint = String(supabaseUrl) + "/functions/v1/esp32-data";
String commandsEndpoint = String(supabaseUrl) + "/functions/v1/esp32-commands";
String deviceEndpoint = String(supabaseUrl) + "/functions/v1/device-management";

// Device Configuration
const String deviceId = "esp32_garden_001";  // Unique device identifier
const String zoneId = "YOUR_ZONE_UUID";      // Zone UUID from dashboard
const String deviceName = "ESP32 Garden Monitor";
const String firmwareVersion = "v3.0.0";

// Hardware Pin Configuration
const int moisturePin = 34;      // Soil moisture sensor (analog)
const int temperaturePin = 35;   // Temperature sensor (analog)
const int humidityPin = 36;      // Humidity sensor (analog)  
const int lightPin = 39;         // Light sensor (analog)
const int pumpPin = 5;           // Water pump relay
const int statusLedPin = 2;      // Status LED (built-in)
const int buzzerPin = 4;         // Buzzer for alerts (optional)

// Timing Configuration
const unsigned long sendInterval = 30000;        // Send data every 30 seconds
const unsigned long commandCheckInterval = 15000; // Check commands every 15 seconds
const unsigned long heartbeatInterval = 60000;    // Heartbeat every 1 minute
const unsigned long wifiReconnectInterval = 30000; // WiFi reconnect attempts

// Sensor Calibration Values
struct SensorCalibration {
  int moistureMin = 0;
  int moistureMax = 4095;
  float temperatureOffset = 0.0;
  float humidityOffset = 0.0;
  int lightMin = 0;
  int lightMax = 4095;
};

SensorCalibration calibration;

// ===== GLOBAL VARIABLES =====
unsigned long lastSendTime = 0;
unsigned long lastCommandCheck = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastWifiReconnect = 0;

bool isOnline = false;
bool deviceRegistered = false;
int failedTransmissions = 0;
const int maxFailedTransmissions = 3;

// Data buffer for offline operation
const int maxBufferSize = 10;
struct SensorReading {
  String sensorType;
  float value;
  String unit;
  unsigned long timestamp;
};

SensorReading dataBuffer[maxBufferSize];
int bufferIndex = 0;

// Current sensor values
float currentMoisture = 0;
float currentTemperature = 0;
float currentHumidity = 0;
float currentLight = 0;

// ===== SETUP FUNCTION =====
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("==========================================");
  Serial.println("ESP32 Smart Garden Monitor v3.0.0");
  Serial.println("Supabase Integration");
  Serial.println("==========================================");
  
  // Initialize EEPROM for configuration storage
  EEPROM.begin(512);
  
  // Initialize hardware pins
  initializePins();
  
  // Load calibration from EEPROM
  loadCalibration();
  
  // Initialize WiFi connection
  initializeWiFi();
  
  // Register device with dashboard
  if (isOnline) {
    registerDevice();
  }
  
  Serial.println("==========================================");
  Serial.println("Device Configuration:");
  Serial.println("Device ID: " + deviceId);
  Serial.println("Zone ID: " + zoneId);
  Serial.println("Firmware: " + firmwareVersion);
  Serial.println("Status: " + String(isOnline ? "Online" : "Offline"));
  Serial.println("==========================================");
  
  // Initial sensor reading
  readAllSensors();
  displaySensorReadings();
}

// ===== MAIN LOOP =====
void loop() {
  unsigned long currentTime = millis();
  
  // Handle WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    handleWiFiDisconnection(currentTime);
  } else {
    if (!isOnline) {
      Serial.println("WiFi reconnected!");
      isOnline = true;
      failedTransmissions = 0;
      
      // Register device if not already done
      if (!deviceRegistered) {
        registerDevice();
      }
      
      // Send buffered data
      if (bufferIndex > 0) {
        Serial.println("Sending buffered data...");
        sendBufferedData();
      }
    }
    
    // Send sensor data
    if (currentTime - lastSendTime >= sendInterval) {
      readAllSensors();
      sendSensorData();
      lastSendTime = currentTime;
    }
    
    // Check for remote commands
    if (currentTime - lastCommandCheck >= commandCheckInterval) {
      checkForCommands();
      lastCommandCheck = currentTime;
    }
    
    // Send heartbeat
    if (currentTime - lastHeartbeat >= heartbeatInterval) {
      sendHeartbeat();
      lastHeartbeat = currentTime;
    }
  }
  
  // Update status LED
  updateStatusLED();
  
  // Small delay to prevent watchdog issues
  delay(100);
}

// ===== WIFI MANAGEMENT =====
void initializeWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi connected successfully!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    isOnline = true;
  } else {
    Serial.println();
    Serial.println("❌ WiFi connection failed!");
    isOnline = false;
  }
}

void handleWiFiDisconnection(unsigned long currentTime) {
  if (isOnline) {
    isOnline = false;
    Serial.println("⚠️  WiFi disconnected!");
  }
  
  // Try to reconnect periodically
  if (currentTime - lastWifiReconnect >= wifiReconnectInterval) {
    Serial.println("Attempting WiFi reconnection...");
    WiFi.reconnect();
    lastWifiReconnect = currentTime;
  }
}

// ===== HARDWARE INITIALIZATION =====
void initializePins() {
  // Configure sensor pins
  pinMode(moisturePin, INPUT);
  pinMode(temperaturePin, INPUT);
  pinMode(humidityPin, INPUT);
  pinMode(lightPin, INPUT);
  
  // Configure output pins
  pinMode(pumpPin, OUTPUT);
  pinMode(statusLedPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  
  // Set initial states
  digitalWrite(pumpPin, LOW);
  digitalWrite(statusLedPin, HIGH);
  digitalWrite(buzzerPin, LOW);
  
  Serial.println("✅ Hardware pins initialized");
}

// ===== SENSOR FUNCTIONS =====
void readAllSensors() {
  currentMoisture = readMoisture();
  currentTemperature = readTemperature();
  currentHumidity = readHumidity();
  currentLight = readLight();
}

float readMoisture() {
  int rawValue = analogRead(moisturePin);
  // Convert to percentage (0% = dry, 100% = wet)
  float moisture = map(rawValue, calibration.moistureMin, calibration.moistureMax, 0, 100);
  moisture = constrain(moisture, 0, 100);
  return moisture;
}

float readTemperature() {
  int rawValue = analogRead(temperaturePin);
  // Convert to Celsius (adjust based on your sensor)
  float voltage = (rawValue / 4095.0) * 3.3;
  float temperature = (voltage - 0.5) * 100; // For TMP36 sensor
  temperature += calibration.temperatureOffset;
  return constrain(temperature, -40, 80);
}

float readHumidity() {
  int rawValue = analogRead(humidityPin);
  // Convert to percentage
  float humidity = map(rawValue, 0, 4095, 0, 100);
  humidity += calibration.humidityOffset;
  return constrain(humidity, 0, 100);
}

float readLight() {
  int rawValue = analogRead(lightPin);
  // Convert to percentage (0% = dark, 100% = bright)
  float light = map(rawValue, calibration.lightMin, calibration.lightMax, 0, 100);
  return constrain(light, 0, 100);
}

void displaySensorReadings() {
  Serial.println("📊 Current Sensor Readings:");
  Serial.println("   🌱 Moisture: " + String(currentMoisture, 1) + "%");
  Serial.println("   🌡️  Temperature: " + String(currentTemperature, 1) + "°C");
  Serial.println("   💧 Humidity: " + String(currentHumidity, 1) + "%");
  Serial.println("   ☀️  Light: " + String(currentLight, 1) + "%");
  Serial.println();
}

// ===== DATA TRANSMISSION =====
void sendSensorData() {
  if (!isOnline) {
    // Buffer data for offline operation
    bufferSensorReading("moisture", currentMoisture, "%");
    bufferSensorReading("temperature", currentTemperature, "C");
    bufferSensorReading("humidity", currentHumidity, "%");
    bufferSensorReading("light", currentLight, "%");
    Serial.println("📦 Data buffered (offline mode)");
    return;
  }
  
  displaySensorReadings();
  
  // Send each sensor reading individually
  bool allSuccess = true;
  allSuccess &= sendSensorReading("moisture", currentMoisture, "%");
  delay(500);
  allSuccess &= sendSensorReading("temperature", currentTemperature, "C");
  delay(500);
  allSuccess &= sendSensorReading("humidity", currentHumidity, "%");
  delay(500);
  allSuccess &= sendSensorReading("light", currentLight, "%");
  
  if (allSuccess) {
    Serial.println("✅ All sensor data sent successfully!");
    failedTransmissions = 0;
  } else {
    Serial.println("❌ Some sensor data failed to send!");
    failedTransmissions++;
    
    if (failedTransmissions >= maxFailedTransmissions) {
      Serial.println("⚠️  Too many failed transmissions, buffering data...");
      bufferSensorReading("moisture", currentMoisture, "%");
      bufferSensorReading("temperature", currentTemperature, "C");
      bufferSensorReading("humidity", currentHumidity, "%");
      bufferSensorReading("light", currentLight, "%");
    }
  }
}

bool sendSensorReading(String sensorType, float value, String unit) {
  if (!isOnline) return false;
  
  HTTPClient http;
  http.begin(dataEndpoint);
  http.setTimeout(10000); // 10 second timeout
  
  // Set headers
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  http.addHeader("Authorization", "Bearer " + String(apiKey));
  
  // Create JSON payload matching the API schema
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["zone_id"] = zoneId;
  doc["sensor_type"] = sensorType;
  doc["value"] = value;
  doc["unit"] = unit;
  doc["apiKey"] = apiKey;
  doc["battery_level"] = getBatteryLevel();
  doc["signal_strength"] = WiFi.RSSI();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("📤 Sending " + sensorType + " data...");
  
  // Send POST request
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println(" ✅ Success (Code: " + String(httpResponseCode) + ")");
    
    // Parse response for irrigation commands
    DynamicJsonDocument responseDoc(1024);
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error && responseDoc.containsKey("irrigation_needed")) {
      if (responseDoc["irrigation_needed"]) {
        Serial.println("🚿 Irrigation needed! Moisture level is low.");
        triggerIrrigation();
      }
    }
    
    http.end();
    return true;
  } else {
    Serial.println(" ❌ Failed (Code: " + String(httpResponseCode) + ")");
    if (httpResponseCode < 0) {
      Serial.println("Error: " + http.errorToString(httpResponseCode));
    }
    http.end();
    return false;
  }
}

// ===== DATA BUFFERING =====
void bufferSensorReading(String sensorType, float value, String unit) {
  if (bufferIndex < maxBufferSize) {
    dataBuffer[bufferIndex] = {sensorType, value, unit, millis()};
    bufferIndex++;
  } else {
    // Buffer is full, overwrite oldest entry
    for (int i = 0; i < maxBufferSize - 1; i++) {
      dataBuffer[i] = dataBuffer[i + 1];
    }
    dataBuffer[maxBufferSize - 1] = {sensorType, value, unit, millis()};
  }
}

void sendBufferedData() {
  if (bufferIndex == 0) return;
  
  Serial.println("📤 Sending " + String(bufferIndex) + " buffered readings...");
  
  int successCount = 0;
  for (int i = 0; i < bufferIndex; i++) {
    if (sendSensorReading(dataBuffer[i].sensorType, dataBuffer[i].value, dataBuffer[i].unit)) {
      successCount++;
    }
    delay(1000); // Delay between requests
  }
  
  Serial.println("✅ Sent " + String(successCount) + "/" + String(bufferIndex) + " buffered readings");
  
  // Clear buffer
  bufferIndex = 0;
}

// ===== COMMAND HANDLING =====
void checkForCommands() {
  if (!isOnline) return;
  
  HTTPClient http;
  String url = commandsEndpoint + "?device_id=" + deviceId + "&apiKey=" + apiKey;
  http.begin(url);
  http.addHeader("apikey", apiKey);
  http.setTimeout(5000);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.containsKey("commands")) {
      JsonArray commands = doc["commands"];
      for (JsonObject command : commands) {
        executeCommand(command);
      }
    }
  } else if (httpResponseCode != 404) {
    Serial.println("⚠️  Command check failed: " + String(httpResponseCode));
  }
  
  http.end();
}

void executeCommand(JsonObject command) {
  String commandType = command["command_type"];
  String commandId = command["id"];
  
  Serial.println("🎯 Executing command: " + commandType);
  
  bool success = false;
  
  if (commandType == "PUMP_ON") {
    digitalWrite(pumpPin, HIGH);
    Serial.println("💧 Pump turned ON");
    success = true;
    
  } else if (commandType == "PUMP_OFF") {
    digitalWrite(pumpPin, LOW);
    Serial.println("💧 Pump turned OFF");
    success = true;
    
  } else if (commandType == "PUMP_DURATION") {
    int duration = command["parameters"]["duration"] | 5000;
    triggerIrrigation(duration);
    success = true;
    
  } else if (commandType == "READ_SENSORS") {
    readAllSensors();
    displaySensorReadings();
    success = true;
    
  } else if (commandType == "CALIBRATE") {
    // Calibration command - implement as needed
    Serial.println("🔧 Calibration requested");
    success = true;
    
  } else {
    Serial.println("❓ Unknown command: " + commandType);
  }
  
  // Report command execution status
  reportCommandExecution(commandId, success ? "executed" : "failed");
}

void reportCommandExecution(String commandId, String status) {
  if (!isOnline) return;
  
  HTTPClient http;
  http.begin(commandsEndpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  
  DynamicJsonDocument doc(512);
  doc["command_id"] = commandId;
  doc["status"] = status;
  doc["apiKey"] = apiKey;
  doc["device_id"] = deviceId;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.PUT(jsonString);
  if (httpResponseCode == 200) {
    Serial.println("✅ Command status reported: " + status);
  } else {
    Serial.println("⚠️  Failed to report command status: " + String(httpResponseCode));
  }
  
  http.end();
}

// ===== IRRIGATION CONTROL =====
void triggerIrrigation(int duration = 5000) {
  Serial.println("🚿 Starting irrigation for " + String(duration) + "ms");
  
  // Turn on pump
  digitalWrite(pumpPin, HIGH);
  digitalWrite(buzzerPin, HIGH);
  delay(100);
  digitalWrite(buzzerPin, LOW);
  
  // Wait for specified duration
  delay(duration);
  
  // Turn off pump
  digitalWrite(pumpPin, LOW);
  
  // Double beep to indicate completion
  digitalWrite(buzzerPin, HIGH);
  delay(100);
  digitalWrite(buzzerPin, LOW);
  delay(100);
  digitalWrite(buzzerPin, HIGH);
  delay(100);
  digitalWrite(buzzerPin, LOW);
  
  Serial.println("✅ Irrigation completed");
}

// ===== DEVICE MANAGEMENT =====
void registerDevice() {
  if (!isOnline) return;
  
  Serial.print("📋 Registering device...");
  
  HTTPClient http;
  http.begin(deviceEndpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  http.setTimeout(10000);
  
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["name"] = deviceName;
  doc["device_type"] = "esp32";
  doc["ip_address"] = WiFi.localIP().toString();
  doc["mac_address"] = WiFi.macAddress();
  doc["firmware_version"] = firmwareVersion;
  doc["apiKey"] = apiKey;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.println(" ✅ Success");
    deviceRegistered = true;
  } else {
    Serial.println(" ❌ Failed (Code: " + String(httpResponseCode) + ")");
    if (httpResponseCode > 0) {
      Serial.println("Response: " + http.getString());
    }
  }
  
  http.end();
}

void sendHeartbeat() {
  if (!isOnline || !deviceRegistered) return;
  
  HTTPClient http;
  http.begin(deviceEndpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  http.setTimeout(5000);
  
  DynamicJsonDocument doc(512);
  doc["device_id"] = deviceId;
  doc["status"] = "online";
  doc["apiKey"] = apiKey;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.PUT(jsonString);
  
  if (httpResponseCode == 200) {
    Serial.println("💓 Heartbeat sent");
  } else {
    Serial.println("⚠️  Heartbeat failed: " + String(httpResponseCode));
  }
  
  http.end();
}

// ===== UTILITY FUNCTIONS =====
int getBatteryLevel() {
  // Read battery voltage if you have a voltage divider
  // For now, return a calculated value based on system voltage
  float voltage = 3.3; // ESP32 operating voltage
  int batteryPercent = map(voltage * 100, 280, 420, 0, 100);
  return constrain(batteryPercent, 0, 100);
}

void updateStatusLED() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  
  unsigned long currentTime = millis();
  
  if (isOnline && deviceRegistered) {
    // Solid on when online and registered
    digitalWrite(statusLedPin, HIGH);
  } else if (isOnline) {
    // Fast blink when online but not registered
    if (currentTime - lastBlink >= 250) {
      ledState = !ledState;
      digitalWrite(statusLedPin, ledState);
      lastBlink = currentTime;
    }
  } else {
    // Slow blink when offline
    if (currentTime - lastBlink >= 1000) {
      ledState = !ledState;
      digitalWrite(statusLedPin, ledState);
      lastBlink = currentTime;
    }
  }
}

void loadCalibration() {
  // Load calibration values from EEPROM
  // This is a simplified version - expand based on your needs
  int address = 0;
  EEPROM.get(address, calibration);
  
  // Validate loaded values
  if (calibration.moistureMax <= calibration.moistureMin) {
    // Use default values
    calibration.moistureMin = 0;
    calibration.moistureMax = 4095;
    calibration.temperatureOffset = 0.0;
    calibration.humidityOffset = 0.0;
    calibration.lightMin = 0;
    calibration.lightMax = 4095;
    
    saveCalibration();
  }
  
  Serial.println("📐 Sensor calibration loaded");
}

void saveCalibration() {
  int address = 0;
  EEPROM.put(address, calibration);
  EEPROM.commit();
  Serial.println("💾 Sensor calibration saved");
}

/*
 * ===== SETUP INSTRUCTIONS =====
 * 
 * 1. Install Required Libraries:
 *    - ArduinoJson (by Benoit Blanchon) - Version 6.x
 *    - ESP32 Board Package
 * 
 * 2. Update Configuration:
 *    - Set your WiFi SSID and password
 *    - Set your Supabase project URL
 *    - Set your Supabase anon key
 *    - Set your device ID and zone ID (get from dashboard)
 * 
 * 3. Hardware Connections:
 *    - Soil moisture sensor → Pin 34
 *    - Temperature sensor → Pin 35  
 *    - Humidity sensor → Pin 36
 *    - Light sensor → Pin 39
 *    - Water pump relay → Pin 5
 *    - Status LED → Pin 2 (built-in)
 *    - Buzzer (optional) → Pin 4
 * 
 * 4. Dashboard Setup:
 *    - Create a zone in your dashboard
 *    - Generate an API key for your device
 *    - Note the zone UUID and API key
 * 
 * 5. Upload and Test:
 *    - Upload this code to your ESP32
 *    - Open Serial Monitor (115200 baud)
 *    - Check connection and data transmission
 * 
 * ===== FEATURES =====
 * - Automatic WiFi reconnection
 * - Offline data buffering
 * - Remote command execution
 * - Automatic irrigation based on moisture
 * - Device registration and heartbeat
 * - Sensor calibration support
 * - Status LED indicators
 * - Comprehensive error handling
 * - Serial monitoring and debugging
 * 
 * ===== TROUBLESHOOTING =====
 * - Check Serial Monitor for detailed logs
 * - Verify WiFi credentials and connection
 * - Confirm Supabase URL and API key
 * - Ensure zone ID exists in dashboard
 * - Check sensor wiring and power supply
 * - Verify API endpoints are accessible
 */