/*
 * ESP32 Integration Example for FarmFlow Dashboard
 * This code demonstrates how to send sensor data to your dashboard
 * 
 * IMPORTANT: Replace the placeholder values with your actual configuration
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Dashboard Configuration
const char* dashboardUrl = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/esp32-data";
const char* apiKey = "YOUR_ACTUAL_API_KEY_HERE"; // Copy this from the dashboard when creating the API key

// Device Configuration
const String deviceId = "YOUR_DEVICE_UUID"; // Get this from the dashboard
const String zoneId = "YOUR_ZONE_UUID";     // Get this from the dashboard

// Sensor pins
const int moisturePin = 34;    // Analog pin for soil moisture sensor
const int temperaturePin = 35; // Analog pin for temperature sensor
const int humidityPin = 36;    // Analog pin for humidity sensor

// Timing
const unsigned long sendInterval = 30000; // Send data every 30 seconds
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize sensor pins
  pinMode(moisturePin, INPUT);
  pinMode(temperaturePin, INPUT);
  pinMode(humidityPin, INPUT);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check if it's time to send data
  if (currentTime - lastSendTime >= sendInterval) {
    sendSensorData();
    lastSendTime = currentTime;
  }
  
  // Small delay to prevent watchdog issues
  delay(100);
}

void sendSensorData() {
  // Read sensor values
  int moistureRaw = analogRead(moisturePin);
  int temperatureRaw = analogRead(temperaturePin);
  int humidityRaw = analogRead(humidityPin);
  
  // Convert raw values to meaningful units (adjust these based on your sensors)
  float moisture = map(moistureRaw, 0, 4095, 0, 100); // 0-100%
  float temperature = map(temperatureRaw, 0, 4095, -40, 80); // -40 to 80°C
  float humidity = map(humidityRaw, 0, 4095, 0, 100); // 0-100%
  
  // Send moisture data
  sendSensorReading("moisture", moisture, "%");
  delay(1000); // Small delay between requests
  
  // Send temperature data
  sendSensorReading("temperature", temperature, "C");
  delay(1000);
  
  // Send humidity data
  sendSensorReading("humidity", humidity, "%");
  
  Serial.println("All sensor data sent successfully!");
}

void sendSensorReading(String sensorType, float value, String unit) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Reconnecting...");
    WiFi.reconnect();
    delay(5000);
    return;
  }
  
  HTTPClient http;
  http.begin(dashboardUrl);
  
  // Set headers
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  
  // Create JSON payload
  DynamicJsonDocument doc(512);
  doc["device_id"] = deviceId;
  doc["zone_id"] = zoneId;
  doc["sensor_type"] = sensorType;
  doc["value"] = value;
  doc["unit"] = unit;
  doc["apiKey"] = apiKey;
  
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
    Serial.print("Response: ");
    Serial.println(response);
    
    // Parse response to check if irrigation is needed
    DynamicJsonDocument responseDoc(512);
    deserializeJson(responseDoc, response);
    
    if (responseDoc.containsKey("irrigation_needed") && responseDoc["irrigation_needed"]) {
      Serial.println("🚿 Irrigation needed! Moisture level is low.");
      // Add your irrigation logic here
    }
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
}

// Function to send device heartbeat/status
void sendDeviceStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String statusUrl = String(dashboardUrl).substring(0, String(dashboardUrl).lastIndexOf("/")) + "/device-status";
  http.begin(statusUrl);
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  
  DynamicJsonDocument doc(256);
  doc["device_id"] = deviceId;
  doc["is_online"] = true;
  doc["connection_status"] = "connected";
  doc["firmware_version"] = "v1.0.0";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  if (httpResponseCode > 0) {
    Serial.println("Device status updated successfully");
  }
  
  http.end();
}

/*
 * SETUP INSTRUCTIONS:
 * 
 * 1. Install required libraries:
 *    - ArduinoJson (by Benoit Blanchon)
 * 
 * 2. Update the configuration variables:
 *    - WiFi SSID and password
 *    - Your Supabase project URL
 *    - Your actual API key (copy this when creating the API key in the dashboard)
 *    - Your device UUID and zone UUID from the dashboard
 * 
 * 3. Connect your sensors:
 *    - Soil moisture sensor to pin 34
 *    - Temperature sensor to pin 35
 *    - Humidity sensor to pin 36
 *    (Adjust pins as needed)
 * 
 * 4. Upload the code to your ESP32
 * 
 * 5. Open the Serial Monitor to see the connection status and data transmission
 * 
 * DATA FORMAT SENT TO DASHBOARD:
 * {
 *   "device_id": "your-device-uuid",
 *   "zone_id": "your-zone-uuid",
 *   "sensor_type": "moisture|temperature|humidity",
 *   "value": 45.2,
 *   "unit": "%|C|%",
 *   "apiKey": "your-actual-api-key"
 * }
 * 
 * The dashboard will automatically:
 * - Store the sensor data
 * - Update real-time displays
 * - Check moisture thresholds
 * - Trigger alerts if needed
 * - Update device status
 */
