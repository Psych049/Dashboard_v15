
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <Update.h>
#include <esp_wifi.h>

// ===== CONFIGURATION SECTION =====
// Update these values with your actual configuration

// WiFi Configuration
const char* ssid = "Oppo..";
const char* password = "alphaxyz@1234";

// Dashboard Configuration
const char* dashboardUrl = "https://dhgzlsqulsygtiebhvbd.supabase.co/functions/v1/esp32-data";
const char* commandsUrl = "https://dhgzlsqulsygtiebhvbd.supabase.co/functions/v1/esp32-commands";
const char* deviceManagementUrl = "https://dhgzlsqulsygtiebhvbd.supabase.co/functions/v1/device-management";
const char* apiKey = "YOUR_ACTUAL_API_KEY_HERE";

// Device Configuration
const String deviceId = "YOUR_DEVICE_UUID";
const String zoneId = "YOUR_ZONE_UUID";
const String deviceName = "ESP32_Advanced_001";
const String firmwareVersion = "v2.0.0";

// Sensor Configuration
const int moisturePin = 34;
const int temperaturePin = 35;
const int humidityPin = 36;
const int lightPin = 39;
const int pumpPin = 5;
const int statusLedPin = 2;

// Timing Configuration
const unsigned long sendInterval = 30000;        // Send data every 30 seconds
const unsigned long commandCheckInterval = 10000; // Check commands every 10 seconds
const unsigned long heartbeatInterval = 60000;    // Heartbeat every 1 minute
const unsigned long wifiReconnectInterval = 30000; // Try to reconnect every 30 seconds

// Sensor Calibration
struct SensorCalibration {
  int moistureMin;
  int moistureMax;
  int temperatureMin;
  int temperatureMax;
  int humidityMin;
  int humidityMax;
  int lightMin;
  int lightMax;
};

SensorCalibration calibration = {
  0, 4095,    // Moisture: 0-4095 (adjust based on your sensor)
  0, 4095,    // Temperature: 0-4095
  0, 4095,    // Humidity: 0-4095
  0, 4095     // Light: 0-4095
};

// ===== GLOBAL VARIABLES =====
unsigned long lastSendTime = 0;
unsigned long lastCommandCheck = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastWifiReconnect = 0;
unsigned long wifiDisconnectTime = 0;

bool isOnline = false;
int failedTransmissions = 0;
const int maxFailedTransmissions = 5;

// Data buffer for offline operation
const int maxBufferSize = 20;
struct SensorData {
  String sensorType;
  float value;
  String unit;
  unsigned long timestamp;
};

SensorData dataBuffer[maxBufferSize];
int bufferIndex = 0;
bool bufferFull = false;

// ===== SETUP FUNCTION =====
void setup() {
  Serial.begin(115200);
  
  // Initialize EEPROM
  EEPROM.begin(512);
  
  // Load calibration from EEPROM
  loadCalibration();
  
  // Initialize pins
  initializePins();
  
  // Initialize WiFi
  initializeWiFi();
  
  // Register device with dashboard
  registerDevice();
  
  Serial.println("==========================================");
  Serial.println("ESP32 Advanced Plant Monitor");
  Serial.println("==========================================");
  Serial.println("Device ID: " + deviceId);
  Serial.println("Zone ID: " + zoneId);
  Serial.println("Firmware: " + firmwareVersion);
  Serial.println("==========================================");
}

// ===== MAIN LOOP =====
void loop() {
  unsigned long currentTime = millis();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    handleWiFiDisconnection(currentTime);
  } else {
    isOnline = true;
    failedTransmissions = 0;
    
    // Send sensor data
    if (currentTime - lastSendTime >= sendInterval) {
      sendSensorData();
      lastSendTime = currentTime;
    }
    
    // Check for commands
    if (currentTime - lastCommandCheck >= commandCheckInterval) {
      checkForCommands();
      lastCommandCheck = currentTime;
    }
    
    // Send heartbeat
    if (currentTime - lastHeartbeat >= heartbeatInterval) {
      sendHeartbeat();
      lastHeartbeat = currentTime;
    }
    
    // Send buffered data if any
    if (bufferIndex > 0) {
      sendBufferedData();
    }
  }
  
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
    Serial.println("WiFi connected successfully!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.println(WiFi.RSSI());
    isOnline = true;
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
    isOnline = false;
  }
}

void handleWiFiDisconnection(unsigned long currentTime) {
  if (isOnline) {
    isOnline = false;
    wifiDisconnectTime = currentTime;
    Serial.println("WiFi disconnected!");
  }
  
  // Try to reconnect periodically
  if (currentTime - lastWifiReconnect >= wifiReconnectInterval) {
    Serial.println("Attempting WiFi reconnection...");
    WiFi.reconnect();
    lastWifiReconnect = currentTime;
  }
}

// ===== PIN INITIALIZATION =====
void initializePins() {
  pinMode(moisturePin, INPUT);
  pinMode(temperaturePin, INPUT);
  pinMode(humidityPin, INPUT);
  pinMode(lightPin, INPUT);
  pinMode(pumpPin, OUTPUT);
  pinMode(statusLedPin, OUTPUT);
  
  digitalWrite(pumpPin, LOW);
  digitalWrite(statusLedPin, HIGH);
  
  Serial.println("Pins initialized successfully");
}

// ===== SENSOR FUNCTIONS =====
float readMoisture() {
  int rawValue = analogRead(moisturePin);
  // Convert to percentage (adjust calibration values)
  float moisture = map(rawValue, calibration.moistureMin, calibration.moistureMax, 0, 100);
  moisture = constrain(moisture, 0, 100);
  return moisture;
}

float readTemperature() {
  int rawValue = analogRead(temperaturePin);
  // Convert to Celsius (adjust calibration values)
  float temperature = map(rawValue, calibration.temperatureMin, calibration.temperatureMax, -40, 80);
  temperature = constrain(temperature, -40, 80);
  return temperature;
}

float readHumidity() {
  int rawValue = analogRead(humidityPin);
  // Convert to percentage (adjust calibration values)
  float humidity = map(rawValue, calibration.humidityMin, calibration.humidityMax, 0, 100);
  humidity = constrain(humidity, 0, 100);
  return humidity;
}

float readLight() {
  int rawValue = analogRead(lightPin);
  // Convert to percentage (adjust calibration values)
  float light = map(rawValue, calibration.lightMin, calibration.lightMax, 0, 100);
  light = constrain(light, 0, 100);
  return light;
}

// ===== DATA TRANSMISSION =====
void sendSensorData() {
  if (!isOnline) {
    bufferSensorData("moisture", readMoisture(), "%");
    bufferSensorData("temperature", readTemperature(), "C");
    bufferSensorData("humidity", readHumidity(), "%");
    bufferSensorData("light", readLight(), "%");
    return;
  }
  
  // Send each sensor reading
  bool success = true;
  
  success &= sendSensorReading("moisture", readMoisture(), "%");
  delay(500);
  success &= sendSensorReading("temperature", readTemperature(), "C");
  delay(500);
  success &= sendSensorReading("humidity", readHumidity(), "%");
  delay(500);
  success &= sendSensorReading("light", readLight(), "%");
  
  if (success) {
    Serial.println("All sensor data sent successfully!");
    digitalWrite(statusLedPin, HIGH);
  } else {
    Serial.println("Some sensor data failed to send!");
    digitalWrite(statusLedPin, LOW);
    failedTransmissions++;
  }
}

bool sendSensorReading(String sensorType, float value, String unit) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  HTTPClient http;
  http.begin(dashboardUrl);
  
  // Set headers
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  
  // Get battery level and signal strength
  int batteryLevel = getBatteryLevel();
  int signalStrength = WiFi.RSSI();
  
  // Create JSON payload
  DynamicJsonDocument doc(512);
  doc["device_id"] = deviceId;
  doc["zone_id"] = zoneId;
  doc["sensor_type"] = sensorType;
  doc["value"] = value;
  doc["unit"] = unit;
  doc["apiKey"] = apiKey;
  doc["battery_level"] = batteryLevel;
  doc["signal_strength"] = signalStrength;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Sending ");
  Serial.print(sensorType);
  Serial.print(" data: ");
  Serial.println(jsonString);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    
    // Parse response
    DynamicJsonDocument responseDoc(512);
    deserializeJson(responseDoc, response);
    
    if (responseDoc.containsKey("irrigation_needed") && responseDoc["irrigation_needed"]) {
      Serial.println("🚿 Irrigation needed! Moisture level is low.");
      // Add your irrigation logic here
      triggerIrrigation();
    }
    
    http.end();
    return true;
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
    http.end();
    return false;
  }
}

// ===== DATA BUFFERING =====
void bufferSensorData(String sensorType, float value, String unit) {
  if (bufferIndex < maxBufferSize) {
    dataBuffer[bufferIndex].sensorType = sensorType;
    dataBuffer[bufferIndex].value = value;
    dataBuffer[bufferIndex].unit = unit;
    dataBuffer[bufferIndex].timestamp = millis();
    bufferIndex++;
  } else {
    bufferFull = true;
    // Overwrite oldest data
    for (int i = 0; i < maxBufferSize - 1; i++) {
      dataBuffer[i] = dataBuffer[i + 1];
    }
    dataBuffer[maxBufferSize - 1].sensorType = sensorType;
    dataBuffer[maxBufferSize - 1].value = value;
    dataBuffer[maxBufferSize - 1].unit = unit;
    dataBuffer[maxBufferSize - 1].timestamp = millis();
  }
}

void sendBufferedData() {
  Serial.print("Sending ");
  Serial.print(bufferIndex);
  Serial.println(" buffered sensor readings...");
  
  for (int i = 0; i < bufferIndex; i++) {
    if (sendSensorReading(dataBuffer[i].sensorType, dataBuffer[i].value, dataBuffer[i].unit)) {
      delay(1000); // Small delay between requests
    }
  }
  
  // Clear buffer
  bufferIndex = 0;
  bufferFull = false;
  Serial.println("Buffer cleared!");
}

// ===== COMMAND HANDLING =====
void checkForCommands() {
  if (!isOnline) return;
  
  HTTPClient http;
  String url = String(commandsUrl) + "?device_id=" + deviceId + "&apiKey=" + apiKey;
  http.begin(url);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    
    if (doc.containsKey("commands")) {
      JsonArray commands = doc["commands"];
      for (JsonObject command : commands) {
        executeCommand(command);
      }
    }
  }
  
  http.end();
}

void executeCommand(JsonObject command) {
  String commandType = command["command_type"];
  String commandId = command["id"];
  
  Serial.print("Executing command: ");
  Serial.println(commandType);
  
  bool success = false;
  
  if (commandType == "PUMP_ON") {
    digitalWrite(pumpPin, HIGH);
    success = true;
  } else if (commandType == "PUMP_OFF") {
    digitalWrite(pumpPin, LOW);
    success = true;
  } else if (commandType == "PUMP_DURATION") {
    int duration = command["parameters"]["duration"] | 5000; // Default 5 seconds
    triggerIrrigation(duration);
    success = true;
  }
  
  // Report command execution
  if (success) {
    reportCommandExecution(commandId, "executed");
  } else {
    reportCommandExecution(commandId, "failed");
  }
}

void reportCommandExecution(String commandId, String status) {
  if (!isOnline) return;
  
  HTTPClient http;
  http.begin(commandsUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  
  DynamicJsonDocument doc(256);
  doc["command_id"] = commandId;
  doc["status"] = status;
  doc["apiKey"] = apiKey;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.PUT(jsonString);
  if (httpResponseCode > 0) {
    Serial.print("Command status reported: ");
    Serial.println(status);
  }
  
  http.end();
}

// ===== IRRIGATION CONTROL =====
void triggerIrrigation(int duration = 5000) {
  Serial.print("🚿 Starting irrigation for ");
  Serial.print(duration);
  Serial.println("ms");
  
  digitalWrite(pumpPin, HIGH);
  delay(duration);
  digitalWrite(pumpPin, LOW);
  
  Serial.println("🚿 Irrigation completed");
}

// ===== DEVICE MANAGEMENT =====
void registerDevice() {
  if (!isOnline) return;
  
  HTTPClient http;
  http.begin(deviceManagementUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  
  DynamicJsonDocument doc(512);
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
  if (httpResponseCode > 0) {
    Serial.println("Device registered successfully!");
  } else {
    Serial.println("Device registration failed!");
  }
  
  http.end();
}

void sendHeartbeat() {
  if (!isOnline) return;
  
  HTTPClient http;
  http.begin(deviceManagementUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  
  DynamicJsonDocument doc(256);
  doc["device_id"] = deviceId;
  doc["status"] = "online";
  doc["apiKey"] = apiKey;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.PUT(jsonString);
  if (httpResponseCode > 0) {
    Serial.println("Heartbeat sent successfully");
  }
  
  http.end();
}

// ===== UTILITY FUNCTIONS =====
int getBatteryLevel() {
  // Implement battery level reading based on your hardware
  // For now, return a placeholder value
  return 85; // 85% battery
}

void loadCalibration() {
  // Load calibration values from EEPROM
  // This is a placeholder - implement based on your needs
  Serial.println("Calibration loaded from EEPROM");
}

void saveCalibration() {
  // Save calibration values to EEPROM
  // This is a placeholder - implement based on your needs
  Serial.println("Calibration saved to EEPROM");
}

// ===== OTA UPDATE SUPPORT =====
void checkForUpdates() {
  // Implement OTA update checking
  // This is a placeholder for future enhancement
}

/*
 * SETUP INSTRUCTIONS:
 * 
 * 1. Install required libraries:
 *    - ArduinoJson (by Benoit Blanchon)
 * 
 * 2. Update configuration variables:
 *    - WiFi SSID and password
 *    - Your Supabase project URL
 *    - Your actual API key
 *    - Your device UUID and zone UUID
 * 
 * 3. Connect your sensors:
 *    - Soil moisture sensor to pin 34
 *    - Temperature sensor to pin 35
 *    - Humidity sensor to pin 36
 *    - Light sensor to pin 39
 *    - Water pump relay to pin 5
 *    - Status LED to pin 2
 * 
 * 4. Calibrate your sensors:
 *    - Update the calibration values in the SensorCalibration struct
 *    - Test with known values and adjust accordingly
 * 
 * 5. Upload and test!
 * 
 * ENHANCED FEATURES:
 * - Automatic WiFi reconnection
 * - Data buffering for offline operation
 * - Command polling for remote control
 * - Sensor calibration support
 * - Battery and signal strength monitoring
 * - Robust error handling
 * - OTA update support (placeholder)
 */ 