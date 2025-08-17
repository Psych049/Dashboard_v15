/*
 * ESP32 Configuration Template
 * 
 * Copy this file to "config.h" in your Arduino sketch folder
 * and update the values with your actual configuration.
 * 
 * DO NOT commit config.h to version control!
 */

#ifndef ESP32_CONFIG_H
#define ESP32_CONFIG_H

// ===== WIFI CONFIGURATION =====
#define WIFI_SSID "Your_WiFi_Network_Name"
#define WIFI_PASSWORD "Your_WiFi_Password"

// ===== SUPABASE CONFIGURATION =====
// Get these from your Supabase dashboard
#define SUPABASE_URL "https://your-project-id.supabase.co"
#define SUPABASE_ANON_KEY "your_supabase_anon_key_here"

// ===== DEVICE CONFIGURATION =====
// Create these in your dashboard
#define DEVICE_ID "esp32_garden_001"        // Unique identifier for this device
#define ZONE_ID "your_zone_uuid_here"       // UUID of the zone this device monitors
#define DEVICE_NAME "ESP32 Garden Monitor"  // Human-readable name

// ===== HARDWARE PIN CONFIGURATION =====
// Analog sensor pins
#define MOISTURE_PIN 34      // Soil moisture sensor
#define TEMPERATURE_PIN 35   // Temperature sensor (e.g., TMP36)
#define HUMIDITY_PIN 36      // Humidity sensor
#define LIGHT_PIN 39         // Light/LDR sensor

// Digital output pins
#define PUMP_PIN 5           // Water pump relay control
#define STATUS_LED_PIN 2     // Status LED (built-in LED)
#define BUZZER_PIN 4         // Buzzer for alerts (optional)

// ===== TIMING CONFIGURATION =====
#define SEND_INTERVAL 30000        // Send data every 30 seconds
#define COMMAND_CHECK_INTERVAL 15000  // Check for commands every 15 seconds
#define HEARTBEAT_INTERVAL 60000      // Send heartbeat every 60 seconds
#define WIFI_RECONNECT_INTERVAL 30000 // Try WiFi reconnect every 30 seconds

// ===== SENSOR CALIBRATION =====
// Adjust these values based on your specific sensors
#define MOISTURE_MIN 0        // Minimum raw value (dry)
#define MOISTURE_MAX 4095     // Maximum raw value (wet)
#define LIGHT_MIN 0           // Minimum raw value (dark)
#define LIGHT_MAX 4095        // Maximum raw value (bright)

// Temperature and humidity offsets for calibration
#define TEMPERATURE_OFFSET 0.0  // Add/subtract degrees Celsius
#define HUMIDITY_OFFSET 0.0     // Add/subtract humidity percentage

// ===== IRRIGATION SETTINGS =====
#define DEFAULT_IRRIGATION_DURATION 5000  // Default watering time in milliseconds
#define MOISTURE_THRESHOLD 30              // Auto-water below this moisture %

// ===== BUFFER SETTINGS =====
#define MAX_BUFFER_SIZE 10               // Maximum offline data buffer size
#define MAX_FAILED_TRANSMISSIONS 3      // Buffer data after this many failures

#endif // ESP32_CONFIG_H

/*
 * ===== SETUP GUIDE =====
 * 
 * 1. SUPABASE SETUP:
 *    - Go to https://supabase.com and create a new project
 *    - Get your project URL and anon key from Settings > API
 *    - Deploy the provided edge functions
 *    - Create a zone in your dashboard and note the UUID
 * 
 * 2. HARDWARE SETUP:
 *    - Connect sensors to the specified pins
 *    - Use a relay module for pump control
 *    - Add pull-up resistors if needed for sensors
 * 
 * 3. ARDUINO IDE SETUP:
 *    - Install ESP32 board package
 *    - Install ArduinoJson library (version 6.x)
 *    - Copy this file to config.h and update values
 * 
 * 4. SENSOR CALIBRATION:
 *    - Test sensors with known conditions
 *    - Adjust MIN/MAX values for accurate readings
 *    - Use offset values for fine-tuning
 * 
 * 5. TESTING:
 *    - Upload code and open Serial Monitor
 *    - Check WiFi connection and device registration
 *    - Verify sensor readings and data transmission
 *    - Test remote commands from dashboard
 */