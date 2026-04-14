#!/usr/bin/env python3
"""
Coffee Shop Management Game - Backend API Testing
Tests all game endpoints for the Russian coffee shop simulator
"""

import requests
import sys
import json
from datetime import datetime

class CoffeeShopAPITester:
    def __init__(self, base_url="https://desktop-game-builder.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.game_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True)
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response.text[:200]}")

            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API endpoint", "GET", "", 200)

    def test_game_data(self):
        """Test static game data endpoint"""
        success, data = self.run_test("Get game data", "GET", "game/data", 200)
        if success:
            # Verify data structure
            required_keys = ['ingredients', 'menu_items', 'upgrades']
            for key in required_keys:
                if key not in data:
                    self.log_test(f"Game data - {key} missing", False, f"Missing key: {key}")
                    return False
            
            # Check ingredients
            if len(data['ingredients']) < 6:
                self.log_test("Game data - ingredients count", False, f"Expected at least 6 ingredients, got {len(data['ingredients'])}")
                return False
            
            # Check menu items
            if len(data['menu_items']) < 6:
                self.log_test("Game data - menu items count", False, f"Expected at least 6 menu items, got {len(data['menu_items'])}")
                return False
                
            # Check upgrades
            if len(data['upgrades']) < 10:
                self.log_test("Game data - upgrades count", False, f"Expected at least 10 upgrades, got {len(data['upgrades'])}")
                return False
                
            self.log_test("Game data structure validation", True)
        return success

    def test_new_game(self):
        """Test creating a new game"""
        success, data = self.run_test(
            "Create new game", 
            "POST", 
            "game/new", 
            200,
            {"player_name": "Тестовый игрок"}
        )
        if success and 'id' in data:
            self.game_id = data['id']
            # Verify initial game state
            expected_keys = ['id', 'player_name', 'money', 'reputation', 'current_day', 'status', 'inventory']
            for key in expected_keys:
                if key not in data:
                    self.log_test(f"New game - {key} missing", False, f"Missing key: {key}")
                    return False
            
            # Check initial values
            if data['money'] != 5000.0:
                self.log_test("New game - initial money", False, f"Expected 5000, got {data['money']}")
                return False
            
            if data['reputation'] != 100:
                self.log_test("New game - initial reputation", False, f"Expected 100, got {data['reputation']}")
                return False
                
            if data['current_day'] != 1:
                self.log_test("New game - initial day", False, f"Expected 1, got {data['current_day']}")
                return False
                
            self.log_test("New game initial state validation", True)
        return success

    def test_get_game(self):
        """Test retrieving game state"""
        if not self.game_id:
            self.log_test("Get game state", False, "No game ID available")
            return False
        
        return self.run_test("Get game state", "GET", f"game/{self.game_id}", 200)

    def test_buy_ingredients(self):
        """Test buying ingredients"""
        if not self.game_id:
            self.log_test("Buy ingredients", False, "No game ID available")
            return False
        
        # Test buying some coffee and milk
        purchases = {
            "coffee": 10,
            "milk": 15
        }
        
        success, data = self.run_test(
            "Buy ingredients", 
            "POST", 
            f"game/{self.game_id}/buy-ingredients", 
            200,
            {"purchases": purchases}
        )
        
        if success:
            # Verify response structure
            if 'money' not in data or 'inventory' not in data or 'total_cost' not in data:
                self.log_test("Buy ingredients - response structure", False, "Missing required fields in response")
                return False
            
            # Verify cost calculation (coffee: 50*10 + milk: 30*15 = 950)
            expected_cost = 950
            if abs(data['total_cost'] - expected_cost) > 0.01:
                self.log_test("Buy ingredients - cost calculation", False, f"Expected {expected_cost}, got {data['total_cost']}")
                return False
                
            self.log_test("Buy ingredients - cost calculation", True)
        
        return success

    def test_set_prices(self):
        """Test setting menu prices"""
        if not self.game_id:
            self.log_test("Set prices", False, "No game ID available")
            return False
        
        # Test setting prices for espresso and cappuccino
        prices = {
            "espresso": 150.0,
            "cappuccino": 200.0
        }
        
        success, data = self.run_test(
            "Set menu prices", 
            "POST", 
            f"game/{self.game_id}/set-prices", 
            200,
            {"prices": prices}
        )
        
        if success and 'menu_prices' in data:
            # Verify prices were set correctly
            for item_id, price in prices.items():
                if data['menu_prices'].get(item_id) != price:
                    self.log_test("Set prices - price verification", False, f"Price for {item_id} not set correctly")
                    return False
            self.log_test("Set prices - price verification", True)
        
        return success

    def test_toggle_menu_item(self):
        """Test toggling menu item availability"""
        if not self.game_id:
            self.log_test("Toggle menu item", False, "No game ID available")
            return False
        
        # Test disabling espresso
        success, data = self.run_test(
            "Toggle menu item", 
            "POST", 
            f"game/{self.game_id}/toggle-menu-item", 
            200,
            {"item_id": "espresso", "is_available": False}
        )
        
        if success and 'menu_available' in data:
            if data['menu_available'].get('espresso') != False:
                self.log_test("Toggle menu item - availability check", False, "Espresso should be disabled")
                return False
            self.log_test("Toggle menu item - availability check", True)
        
        return success

    def test_buy_upgrade(self):
        """Test buying an upgrade"""
        if not self.game_id:
            self.log_test("Buy upgrade", False, "No game ID available")
            return False
        
        # Test buying coffee machine level 2 (should cost 3000)
        success, data = self.run_test(
            "Buy upgrade", 
            "POST", 
            f"game/{self.game_id}/buy-upgrade", 
            200,
            {"upgrade_id": "coffee_machine_2"}
        )
        
        if success:
            # Verify response structure
            if 'money' not in data or 'purchased_upgrades' not in data:
                self.log_test("Buy upgrade - response structure", False, "Missing required fields")
                return False
            
            # Verify upgrade was added
            if "coffee_machine_2" not in data['purchased_upgrades']:
                self.log_test("Buy upgrade - upgrade verification", False, "Upgrade not added to purchased list")
                return False
                
            self.log_test("Buy upgrade - upgrade verification", True)
        
        return success

    def test_play_day(self):
        """Test playing a day simulation"""
        if not self.game_id:
            self.log_test("Play day", False, "No game ID available")
            return False
        
        success, data = self.run_test(
            "Play day simulation", 
            "POST", 
            f"game/{self.game_id}/play-day", 
            200
        )
        
        if success:
            # Verify response structure
            if 'report' not in data or 'game_state' not in data:
                self.log_test("Play day - response structure", False, "Missing report or game_state")
                return False
            
            report = data['report']
            required_report_keys = ['day', 'visitors', 'served', 'revenue', 'expenses', 'profit', 'rep_change']
            for key in required_report_keys:
                if key not in report:
                    self.log_test(f"Play day - report {key}", False, f"Missing {key} in report")
                    return False
            
            # Verify day incremented
            if report['day'] != 1:
                self.log_test("Play day - day number", False, f"Expected day 1, got {report['day']}")
                return False
                
            self.log_test("Play day - report structure", True)
        
        return success

    def test_get_stats(self):
        """Test getting game statistics"""
        if not self.game_id:
            self.log_test("Get stats", False, "No game ID available")
            return False
        
        success, data = self.run_test("Get game stats", "GET", f"game/{self.game_id}/stats", 200)
        
        if success:
            # Should be a list of daily stats
            if not isinstance(data, list):
                self.log_test("Get stats - data type", False, "Expected list of stats")
                return False
            
            # After playing one day, should have at least one stat entry
            if len(data) < 1:
                self.log_test("Get stats - data count", False, "Expected at least one stat entry")
                return False
                
            self.log_test("Get stats - data validation", True)
        
        return success

    def test_get_log(self):
        """Test getting game event log"""
        if not self.game_id:
            self.log_test("Get log", False, "No game ID available")
            return False
        
        success, data = self.run_test("Get game log", "GET", f"game/{self.game_id}/log", 200)
        
        if success:
            # Should be a list of log entries
            if not isinstance(data, list):
                self.log_test("Get log - data type", False, "Expected list of log entries")
                return False
                
            self.log_test("Get log - data validation", True)
        
        return success

    def test_list_saves(self):
        """Test listing saved games"""
        success, data = self.run_test("List saved games", "GET", "game/saves/list", 200)
        
        if success:
            # Should be a list
            if not isinstance(data, list):
                self.log_test("List saves - data type", False, "Expected list of saves")
                return False
            
            # Should contain our created game
            game_found = False
            for save in data:
                if save.get('id') == self.game_id:
                    game_found = True
                    break
            
            if not game_found:
                self.log_test("List saves - game found", False, "Created game not found in saves list")
                return False
                
            self.log_test("List saves - game found", True)
        
        return success

    def test_delete_game(self):
        """Test deleting a game"""
        if not self.game_id:
            self.log_test("Delete game", False, "No game ID available")
            return False
        
        success, data = self.run_test("Delete game", "DELETE", f"game/{self.game_id}", 200)
        
        if success:
            # Verify game is deleted by trying to get it (should return 404)
            deleted_success, _ = self.run_test("Verify game deleted", "GET", f"game/{self.game_id}", 404)
            if not deleted_success:
                self.log_test("Delete game - verification", False, "Game still exists after deletion")
                return False
            self.log_test("Delete game - verification", True)
        
        return success

    def test_error_cases(self):
        """Test various error cases"""
        # Test invalid game ID
        self.run_test("Invalid game ID", "GET", "game/invalid-id", 404)
        
        # Test buying ingredients with insufficient funds
        if self.game_id:
            expensive_purchases = {
                "coffee": 1000  # This should exceed available money
            }
            self.run_test(
                "Insufficient funds", 
                "POST", 
                f"game/{self.game_id}/buy-ingredients", 
                400,
                {"purchases": expensive_purchases}
            )
        
        # Test buying non-existent upgrade
        if self.game_id:
            self.run_test(
                "Invalid upgrade", 
                "POST", 
                f"game/{self.game_id}/buy-upgrade", 
                400,
                {"upgrade_id": "non_existent_upgrade"}
            )

    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 Starting Coffee Shop Management Game Backend Tests")
        print(f"🌐 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Basic API tests
        self.test_root_endpoint()
        self.test_game_data()
        
        # Game lifecycle tests
        self.test_new_game()
        self.test_get_game()
        
        # Game operations tests
        self.test_buy_ingredients()
        self.test_set_prices()
        self.test_toggle_menu_item()
        self.test_buy_upgrade()
        self.test_play_day()
        
        # Data retrieval tests
        self.test_get_stats()
        self.test_get_log()
        self.test_list_saves()
        
        # Cleanup and error tests
        self.test_error_cases()
        self.test_delete_game()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = CoffeeShopAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())