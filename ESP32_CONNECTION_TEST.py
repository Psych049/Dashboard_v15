#!/usr/bin/env python3
"""
ESP32 Connection Test Script

This script simulates ESP32 data transmission to test your Supabase
edge functions and verify the complete integration pipeline.

Requirements:
    pip install requests

Usage:
    python ESP32_CONNECTION_TEST.py
"""

import requests
import json
import time
import random
from datetime import datetime

# Configuration - Update these with your actual values
SUPABASE_URL = "https://your-project-id.supabase.co"
API_KEY = "your_supabase_anon_key"
DEVICE_ID = "esp32_test_device"
ZONE_ID = "your_zone_uuid"

# API Endpoints
DATA_ENDPOINT = f"{SUPABASE_URL}/functions/v1/esp32-data"
COMMANDS_ENDPOINT = f"{SUPABASE_URL}/functions/v1/esp32-commands"
DEVICE_ENDPOINT = f"{SUPABASE_URL}/functions/v1/device-management"

# Headers for API requests
HEADERS = {
    "Content-Type": "application/json",
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}"
}

def test_device_registration():
    """Test device registration endpoint"""
    print("🔧 Testing device registration...")
    
    payload = {
        "device_id": DEVICE_ID,
        "name": "ESP32 Test Device",
        "device_type": "esp32",
        "ip_address": "192.168.1.100",
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "firmware_version": "v3.0.0-test",
        "apiKey": API_KEY
    }
    
    try:
        response = requests.post(DEVICE_ENDPOINT, headers=HEADERS, json=payload, timeout=10)
        
        if response.status_code in [200, 201]:
            print("✅ Device registration successful!")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Device registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error during device registration: {e}")
        return False

def test_sensor_data(sensor_type, value, unit):
    """Test sending sensor data"""
    print(f"📊 Testing {sensor_type} data transmission...")
    
    payload = {
        "device_id": DEVICE_ID,
        "zone_id": ZONE_ID,
        "sensor_type": sensor_type,
        "value": value,
        "unit": unit,
        "apiKey": API_KEY,
        "battery_level": random.randint(70, 100),
        "signal_strength": random.randint(-70, -30)
    }
    
    try:
        response = requests.post(DATA_ENDPOINT, headers=HEADERS, json=payload, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ {sensor_type} data sent successfully!")
            result = response.json()
            
            if result.get("irrigation_needed"):
                print("🚿 Server recommends irrigation!")
                
            return True
        else:
            print(f"❌ {sensor_type} data failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error sending {sensor_type} data: {e}")
        return False

def test_command_polling():
    """Test command polling endpoint"""
    print("🎯 Testing command polling...")
    
    try:
        url = f"{COMMANDS_ENDPOINT}?device_id={DEVICE_ID}&apiKey={API_KEY}"
        response = requests.get(url, headers=HEADERS, timeout=10)
        
        if response.status_code in [200, 404]:
            print("✅ Command polling successful!")
            if response.status_code == 200:
                commands = response.json().get("commands", [])
                print(f"   Found {len(commands)} pending commands")
                for cmd in commands:
                    print(f"   - {cmd.get('command_type', 'Unknown')}")
            else:
                print("   No pending commands")
            return True
        else:
            print(f"❌ Command polling failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error during command polling: {e}")
        return False

def test_heartbeat():
    """Test heartbeat/status update"""
    print("💓 Testing heartbeat...")
    
    payload = {
        "device_id": DEVICE_ID,
        "status": "online",
        "apiKey": API_KEY
    }
    
    try:
        response = requests.put(DEVICE_ENDPOINT, headers=HEADERS, json=payload, timeout=10)
        
        if response.status_code == 200:
            print("✅ Heartbeat successful!")
            return True
        else:
            print(f"❌ Heartbeat failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error during heartbeat: {e}")
        return False

def generate_realistic_sensor_data():
    """Generate realistic sensor data for testing"""
    # Simulate realistic sensor readings
    moisture = round(random.uniform(20, 80), 1)  # 20-80% moisture
    temperature = round(random.uniform(18, 35), 1)  # 18-35°C
    humidity = round(random.uniform(40, 90), 1)  # 40-90% humidity
    light = round(random.uniform(10, 95), 1)  # 10-95% light
    
    return [
        ("moisture", moisture, "%"),
        ("temperature", temperature, "C"),
        ("humidity", humidity, "%"),
        ("light", light, "%")
    ]

def run_complete_test():
    """Run complete ESP32 integration test"""
    print("=" * 60)
    print("🧪 ESP32 Supabase Integration Test")
    print("=" * 60)
    print(f"📅 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Supabase URL: {SUPABASE_URL}")
    print(f"🔑 Device ID: {DEVICE_ID}")
    print(f"📍 Zone ID: {ZONE_ID}")
    print("=" * 60)
    
    results = []
    
    # Test 1: Device Registration
    results.append(("Device Registration", test_device_registration()))
    time.sleep(1)
    
    # Test 2: Sensor Data Transmission
    sensor_data = generate_realistic_sensor_data()
    for sensor_type, value, unit in sensor_data:
        results.append((f"{sensor_type.title()} Data", test_sensor_data(sensor_type, value, unit)))
        time.sleep(0.5)
    
    # Test 3: Command Polling
    results.append(("Command Polling", test_command_polling()))
    time.sleep(1)
    
    # Test 4: Heartbeat
    results.append(("Heartbeat", test_heartbeat()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name:<20} : {status}")
        if success:
            passed += 1
    
    print("=" * 60)
    print(f"🎯 Results: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! Your ESP32 integration is working correctly.")
        print("💡 You can now upload the firmware to your ESP32 device.")
    else:
        print("⚠️  Some tests failed. Please check your configuration:")
        print("   - Verify Supabase URL and API key")
        print("   - Ensure edge functions are deployed")
        print("   - Check Zone ID exists in dashboard")
        print("   - Verify network connectivity")
    
    print("=" * 60)

def validate_configuration():
    """Validate configuration before running tests"""
    print("🔍 Validating configuration...")
    
    issues = []
    
    if SUPABASE_URL == "https://your-project-id.supabase.co":
        issues.append("❌ SUPABASE_URL not configured")
    
    if API_KEY == "your_supabase_anon_key":
        issues.append("❌ API_KEY not configured")
    
    if ZONE_ID == "your_zone_uuid":
        issues.append("❌ ZONE_ID not configured")
    
    if not SUPABASE_URL.startswith("https://"):
        issues.append("❌ SUPABASE_URL should start with https://")
    
    if len(API_KEY) < 50:
        issues.append("❌ API_KEY seems too short")
    
    if issues:
        print("\n⚠️  Configuration Issues Found:")
        for issue in issues:
            print(f"   {issue}")
        print("\n💡 Please update the configuration at the top of this script.")
        return False
    
    print("✅ Configuration looks good!")
    return True

if __name__ == "__main__":
    print("🚀 ESP32 Connection Test Script")
    print("This script will test your ESP32-Supabase integration")
    print()
    
    if not validate_configuration():
        print("\n❌ Please fix configuration issues before running tests.")
        exit(1)
    
    try:
        run_complete_test()
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        print("Please check your configuration and network connection.")