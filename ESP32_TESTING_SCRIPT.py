#!/usr/bin/env python3
"""
ESP32 Integration Testing Script
Tests all aspects of the ESP32 integration with your dashboard

Usage:
    python ESP32_TESTING_SCRIPT.py

Requirements:
    - requests library: pip install requests
    - Your Supabase project URL and anon key
    - A registered device in your dashboard
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

class ESP32IntegrationTester:
    def __init__(self, supabase_url, anon_key):
        self.supabase_url = supabase_url.rstrip('/')
        self.anon_key = anon_key
        self.headers = {
            'apikey': anon_key,
            'Authorization': f'Bearer {anon_key}',
            'Content-Type': 'application/json'
        }
        
        # Test results
        self.test_results = []
        self.device_id = None
        self.zone_id = None
        
    def log_test(self, test_name, success, message, details=None):
        """Log a test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        print()
        
    def test_supabase_connection(self):
        """Test basic Supabase connection"""
        try:
            # Test with a simple query to the realtime_cache table
            url = f"{self.supabase_url}/rest/v1/realtime_cache"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                self.log_test("Supabase Connection", True, "Successfully connected to Supabase")
                return True
            else:
                self.log_test("Supabase Connection", False, f"Connection failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Supabase Connection", False, f"Connection error: {str(e)}")
            return False
    
    def test_edge_functions(self):
        """Test all ESP32-related edge functions"""
        functions = [
            'esp32-data',
            'esp32-commands',
            'device-management'
        ]
        
        all_passed = True
        
        for func in functions:
            try:
                url = f"{self.supabase_url}/functions/v1/{func}"
                response = requests.options(url, headers=self.headers)
                
                if response.status_code == 200:
                    self.log_test(f"Edge Function: {func}", True, "Function accessible")
                else:
                    self.log_test(f"Edge Function: {func}", False, f"Function returned status {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Edge Function: {func}", False, f"Function error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_device_registration(self, device_name="Test_ESP32_Device"):
        """Test device registration functionality"""
        try:
            # First, try to get existing devices
            url = f"{self.supabase_url}/rest/v1/devices"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                devices = response.json()
                if devices:
                    # Use first available device
                    self.device_id = devices[0]['id']
                    self.log_test("Device Registration", True, f"Using existing device: {devices[0]['name']}")
                    return True
                else:
                    # Try to create a test device
                    device_data = {
                        'device_id': f"TEST_DEVICE_{int(time.time())}",
                        'name': device_name,
                        'device_type': 'esp32',
                        'status': 'online'
                    }
                    
                    response = requests.post(url, headers=self.headers, json=device_data)
                    
                    if response.status_code == 201:
                        device = response.json()
                        self.device_id = device['id']
                        self.log_test("Device Registration", True, f"Created test device: {device['name']}")
                        return True
                    else:
                        self.log_test("Device Registration", False, f"Failed to create device: {response.status_code}")
                        return False
            else:
                self.log_test("Device Registration", False, f"Failed to access devices: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Device Registration", False, f"Registration error: {str(e)}")
            return False
    
    def test_zone_creation(self, zone_name="Test_Zone"):
        """Test zone creation functionality"""
        try:
            # First, try to get existing zones
            url = f"{self.supabase_url}/rest/v1/zones"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                zones = response.json()
                if zones:
                    # Use first available zone
                    self.zone_id = zones[0]['id']
                    self.log_test("Zone Creation", True, f"Using existing zone: {zones[0]['name']}")
                    return True
                else:
                    # Try to create a test zone
                    zone_data = {
                        'name': zone_name,
                        'description': 'Test zone for ESP32 integration testing',
                        'soil_type': 'Loamy',
                        'moisture_threshold': 40
                    }
                    
                    response = requests.post(url, headers=self.headers, json=zone_data)
                    
                    if response.status_code == 201:
                        zone = response.json()
                        self.zone_id = zone['id']
                        self.log_test("Zone Creation", True, f"Created test zone: {zone['name']}")
                        return True
                    else:
                        self.log_test("Zone Creation", False, f"Failed to create zone: {response.status_code}")
                        return False
            else:
                self.log_test("Zone Creation", False, f"Failed to access zones: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Zone Creation", False, f"Zone creation error: {str(e)}")
            return False
    
    def test_sensor_data_transmission(self):
        """Test sensor data transmission simulation"""
        if not self.device_id or not self.zone_id:
            self.log_test("Sensor Data Transmission", False, "Device or zone not available")
            return False
        
        try:
            # Simulate sensor data transmission
            sensor_data = {
                'device_id': self.device_id,
                'zone_id': self.zone_id,
                'sensor_type': 'moisture',
                'value': 65.5,
                'unit': '%',
                'battery_level': 85,
                'signal_strength': -45
            }
            
            url = f"{self.supabase_url}/functions/v1/esp32-data"
            response = requests.post(url, headers=self.headers, json=sensor_data)
            
            if response.status_code == 200:
                result = response.json()
                self.log_test("Sensor Data Transmission", True, "Data transmitted successfully", 
                            f"Response: {result.get('message', 'No message')}")
                return True
            else:
                self.log_test("Sensor Data Transmission", False, f"Transmission failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Sensor Data Transmission", False, f"Transmission error: {str(e)}")
            return False
    
    def test_command_system(self):
        """Test command sending and retrieval system"""
        if not self.device_id:
            self.log_test("Command System", False, "Device not available")
            return False
        
        try:
            # Test sending a command
            command_data = {
                'device_id': self.device_id,
                'command_type': 'GET_STATUS',
                'parameters': {},
                'priority': 'normal'
            }
            
            url = f"{self.supabase_url}/functions/v1/esp32-commands"
            response = requests.post(url, headers=self.headers, json=command_data)
            
            if response.status_code == 200:
                result = response.json()
                command_id = result.get('command', {}).get('id')
                
                if command_id:
                    self.log_test("Command System", True, "Command sent successfully", 
                                f"Command ID: {command_id}")
                    
                    # Test command retrieval (simulating ESP32)
                    retrieve_url = f"{url}?device_id={self.device_id}&apiKey={self.anon_key}"
                    retrieve_response = requests.get(retrieve_url, headers=self.headers)
                    
                    if retrieve_response.status_code == 200:
                        retrieve_result = retrieve_response.json()
                        commands = retrieve_result.get('commands', [])
                        
                        if commands:
                            self.log_test("Command Retrieval", True, "Commands retrieved successfully", 
                                        f"Retrieved {len(commands)} commands")
                        else:
                            self.log_test("Command Retrieval", False, "No commands retrieved")
                            return False
                    else:
                        self.log_test("Command Retrieval", False, f"Retrieval failed: {retrieve_response.status_code}")
                        return False
                    
                    return True
                else:
                    self.log_test("Command System", False, "No command ID returned")
                    return False
            else:
                self.log_test("Command System", False, f"Command sending failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Command System", False, f"Command system error: {str(e)}")
            return False
    
    def test_device_management(self):
        """Test device management functionality"""
        if not self.device_id:
            self.log_test("Device Management", False, "Device not available")
            return False
        
        try:
            # Test device status update
            status_data = {
                'device_id': self.device_id,
                'status': 'online',
                'apiKey': self.anon_key
            }
            
            url = f"{self.supabase_url}/functions/v1/device-management"
            response = requests.put(url, headers=self.headers, json=status_data)
            
            if response.status_code == 200:
                result = response.json()
                self.log_test("Device Management", True, "Device status updated successfully")
                return True
            else:
                self.log_test("Device Management", False, f"Status update failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Device Management", False, f"Device management error: {str(e)}")
            return False
    
    def test_data_flow(self):
        """Test complete data flow from ESP32 to dashboard"""
        if not self.device_id or not self.zone_id:
            self.log_test("Data Flow", False, "Device or zone not available")
            return False
        
        try:
            # Send multiple sensor readings
            sensor_types = ['moisture', 'temperature', 'humidity', 'light']
            all_successful = True
            
            for sensor_type in sensor_types:
                sensor_data = {
                    'device_id': self.device_id,
                    'zone_id': self.zone_id,
                    'sensor_type': sensor_type,
                    'value': 50.0 + (hash(sensor_type) % 30),  # Generate different values
                    'unit': '%' if sensor_type in ['moisture', 'humidity', 'light'] else 'C',
                    'battery_level': 85,
                    'signal_strength': -45
                }
                
                url = f"{self.supabase_url}/functions/v1/esp32-data"
                response = requests.post(url, headers=self.headers, json=sensor_data)
                
                if response.status_code != 200:
                    all_successful = False
                    self.log_test(f"Data Flow - {sensor_type}", False, f"Failed: {response.status_code}")
                else:
                    self.log_test(f"Data Flow - {sensor_type}", True, "Data sent successfully")
                
                time.sleep(0.5)  # Small delay between requests
            
            # Check if data appears in realtime cache
            time.sleep(2)  # Wait for data to be processed
            
            cache_url = f"{self.supabase_url}/rest/v1/realtime_cache"
            response = requests.get(cache_url, headers=self.headers)
            
            if response.status_code == 200:
                cache_data = response.json()
                if cache_data:
                    self.log_test("Data Flow - Cache", True, f"Data appears in cache: {len(cache_data)} entries")
                else:
                    self.log_test("Data Flow - Cache", False, "No data in cache")
                    all_successful = False
            else:
                self.log_test("Data Flow - Cache", False, f"Cache access failed: {response.status_code}")
                all_successful = False
            
            return all_successful
                
        except Exception as e:
            self.log_test("Data Flow", False, f"Data flow error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 ESP32 Integration Testing Suite")
        print("=" * 50)
        print()
        
        # Run tests in order
        tests = [
            ("Supabase Connection", self.test_supabase_connection),
            ("Edge Functions", self.test_edge_functions),
            ("Device Registration", self.test_device_registration),
            ("Zone Creation", self.test_zone_creation),
            ("Sensor Data Transmission", self.test_sensor_data_transmission),
            ("Command System", self.test_command_system),
            ("Device Management", self.test_device_management),
            ("Data Flow", self.test_data_flow)
        ]
        
        for test_name, test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log_test(test_name, False, f"Test crashed: {str(e)}")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if failed_tests > 0:
            print("Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
            print()
            print("🔧 Troubleshooting Tips:")
            print("  1. Check your Supabase project URL and anon key")
            print("  2. Ensure all edge functions are deployed")
            print("  3. Verify database schema matches expected structure")
            print("  4. Check device and zone registration")
        else:
            print("🎉 All tests passed! Your ESP32 integration is working correctly.")
            print()
            print("Next steps:")
            print("  1. Upload the ESP32 code to your device")
            print("  2. Configure WiFi and device settings")
            print("  3. Test with real sensors")
            print("  4. Monitor the dashboard for real-time data")

def main():
    """Main function to run the testing suite"""
    print("ESP32 Integration Testing Script")
    print("This script will test your ESP32 integration setup.")
    print()
    
    # Get configuration from user
    supabase_url = input("Enter your Supabase project URL: ").strip()
    if not supabase_url:
        print("❌ Supabase URL is required")
        sys.exit(1)
    
    anon_key = input("Enter your Supabase anon key: ").strip()
    if not anon_key:
        print("❌ Supabase anon key is required")
        sys.exit(1)
    
    print()
    print("Starting tests...")
    print()
    
    # Create tester and run tests
    tester = ESP32IntegrationTester(supabase_url, anon_key)
    tester.run_all_tests()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️ Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {str(e)}")
        sys.exit(1) 