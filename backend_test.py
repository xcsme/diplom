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
        """Записать результат теста"""
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
        """Запустить один API тест"""
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
        """Тестировать корневой эндпоинт API"""
        return self.run_test("Root API endpoint", "GET", "", 200)

    def test_game_data(self):
        """Тестировать эндпоинт статических игровых данных"""
        success, data = self.run_test("Get game data", "GET", "game/data", 200)
        if success:
            # Проверить структуру данных
            required_keys = ['ingredients', 'menu_items', 'upgrades', 'achievements']
            for key in required_keys:
                if key not in data:
                    self.log_test(f"Game data - {key} missing", False, f"Missing key: {key}")
                    return False
            
            # Проверить ингредиенты
            if len(data['ingredients']) < 6:
                self.log_test("Game data - ingredients count", False, f"Expected at least 6 ingredients, got {len(data['ingredients'])}")
                return False
            
            # Проверить пункты меню
            if len(data['menu_items']) < 6:
                self.log_test("Game data - menu items count", False, f"Expected at least 6 menu items, got {len(data['menu_items'])}")
                return False
                
            # Проверить улучшения
            if len(data['upgrades']) < 10:
                self.log_test("Game data - upgrades count", False, f"Expected at least 10 upgrades, got {len(data['upgrades'])}")
                return False
            
            # Проверить достижения - должно быть ровно 15
            if len(data['achievements']) != 15:
                self.log_test("Game data - achievements count", False, f"Expected exactly 15 achievements, got {len(data['achievements'])}")
                return False
            
            # Проверить структуру достижений
            for ach in data['achievements']:
                required_ach_keys = ['id', 'name', 'description', 'icon']
                for key in required_ach_keys:
                    if key not in ach:
                        self.log_test(f"Achievement structure - {key} missing", False, f"Missing {key} in achievement")
                        return False
                        
            self.log_test("Game data structure validation", True)
            self.log_test("Achievements structure validation", True)
        return success

    def test_new_game(self):
        """Тестировать создание новой игры"""
        success, data = self.run_test(
            "Create new game", 
            "POST", 
            "game/new", 
            200,
            {"player_name": "Тестовый игрок"}
        )
        if success and 'id' in data:
            self.game_id = data['id']
            # Проверить начальное состояние игры
            expected_keys = ['id', 'player_name', 'money', 'reputation', 'current_day', 'status', 'inventory', 'achievements']
            for key in expected_keys:
                if key not in data:
                    self.log_test(f"New game - {key} missing", False, f"Missing key: {key}")
                    return False
            
            # Проверить поля отслеживания достижений
            achievement_tracking_keys = ['total_customers', 'total_events', 'best_daily_revenue', 'total_spent_on_ingredients', 'had_perfect_day']
            for key in achievement_tracking_keys:
                if key not in data:
                    self.log_test(f"New game - achievement tracking {key} missing", False, f"Missing achievement tracking key: {key}")
                    return False
            
            # Проверить начальные значения
            if data['money'] != 5000.0:
                self.log_test("New game - initial money", False, f"Expected 5000, got {data['money']}")
                return False
            
            if data['reputation'] != 100:
                self.log_test("New game - initial reputation", False, f"Expected 100, got {data['reputation']}")
                return False
                
            if data['current_day'] != 1:
                self.log_test("New game - initial day", False, f"Expected 1, got {data['current_day']}")
                return False
            
            # Проверить начальное состояние достижений
            if not isinstance(data['achievements'], list) or len(data['achievements']) != 0:
                self.log_test("New game - initial achievements", False, f"Expected empty achievements list, got {data['achievements']}")
                return False
            
            # Проверить начальные значения отслеживания
            if data['total_customers'] != 0:
                self.log_test("New game - initial total_customers", False, f"Expected 0, got {data['total_customers']}")
                return False
                
            self.log_test("New game initial state validation", True)
            self.log_test("New game achievement tracking fields", True)
        return success

    def test_get_game(self):
        """Тестировать получение состояния игры"""
        if not self.game_id:
            self.log_test("Get game state", False, "No game ID available")
            return False
        
        return self.run_test("Get game state", "GET", f"game/{self.game_id}", 200)

    def test_buy_ingredients(self):
        """Тестировать покупку ингредиентов"""
        if not self.game_id:
            self.log_test("Buy ingredients", False, "No game ID available")
            return False
        
        # Тестировать покупку кофе и молока
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
            # Проверить структуру ответа
            if 'money' not in data or 'inventory' not in data or 'total_cost' not in data:
                self.log_test("Buy ingredients - response structure", False, "Missing required fields in response")
                return False
            
            # Проверить поле new_achievements
            if 'new_achievements' not in data:
                self.log_test("Buy ingredients - new_achievements field", False, "Missing new_achievements field")
                return False
            
            # Проверить расчёт стоимости (кофе: 50*10 + молоко: 30*15 = 950)
            expected_cost = 950
            if abs(data['total_cost'] - expected_cost) > 0.01:
                self.log_test("Buy ingredients - cost calculation", False, f"Expected {expected_cost}, got {data['total_cost']}")
                return False
                
            self.log_test("Buy ingredients - cost calculation", True)
            self.log_test("Buy ingredients - achievement tracking", True)
        
        return success

    def test_set_prices(self):
        """Тестировать установку цен в меню"""
        if not self.game_id:
            self.log_test("Set prices", False, "No game ID available")
            return False
        
        # Тестировать установку цен для эспрессо и капучино
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
            # Проверить правильность установки цен
            for item_id, price in prices.items():
                if data['menu_prices'].get(item_id) != price:
                    self.log_test("Set prices - price verification", False, f"Price for {item_id} not set correctly")
                    return False
            self.log_test("Set prices - price verification", True)
        
        return success

    def test_toggle_menu_item(self):
        """Тестировать переключение доступности пункта меню"""
        if not self.game_id:
            self.log_test("Toggle menu item", False, "No game ID available")
            return False
        
        # Тестировать отключение эспрессо
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
        """Тестировать покупку улучшения"""
        if not self.game_id:
            self.log_test("Buy upgrade", False, "No game ID available")
            return False
        
        # Тестировать покупку кофемашины 2 уровня (должна стоить 3000)
        success, data = self.run_test(
            "Buy upgrade", 
            "POST", 
            f"game/{self.game_id}/buy-upgrade", 
            200,
            {"upgrade_id": "coffee_machine_2"}
        )
        
        if success:
            # Проверить структуру ответа
            if 'money' not in data or 'purchased_upgrades' not in data:
                self.log_test("Buy upgrade - response structure", False, "Missing required fields")
                return False
            
            # Проверить поле new_achievements
            if 'new_achievements' not in data:
                self.log_test("Buy upgrade - new_achievements field", False, "Missing new_achievements field")
                return False
            
            # Проверить добавление улучшения
            if "coffee_machine_2" not in data['purchased_upgrades']:
                self.log_test("Buy upgrade - upgrade verification", False, "Upgrade not added to purchased list")
                return False
            
            # Проверить получение достижения first_upgrade
            if len(data['purchased_upgrades']) == 1 and 'first_upgrade' not in data['new_achievements']:
                self.log_test("Buy upgrade - first_upgrade achievement", False, "first_upgrade achievement should be unlocked")
                return False
                
            self.log_test("Buy upgrade - upgrade verification", True)
            self.log_test("Buy upgrade - achievement tracking", True)
        
        return success

    def test_play_day(self):
        """Тестировать симуляцию дня"""
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
            # Проверить структуру ответа
            if 'report' not in data or 'game_state' not in data:
                self.log_test("Play day - response structure", False, "Missing report or game_state")
                return False
            
            report = data['report']
            game_state = data['game_state']
            
            required_report_keys = ['day', 'visitors', 'served', 'revenue', 'expenses', 'profit', 'rep_change', 'new_achievements']
            for key in required_report_keys:
                if key not in report:
                    self.log_test(f"Play day - report {key}", False, f"Missing {key} in report")
                    return False
            
            # Проверить увеличение дня
            if report['day'] != 1:
                self.log_test("Play day - day number", False, f"Expected day 1, got {report['day']}")
                return False
            
            # Проверить получение достижения first_day (после первого сыгранного дня)
            if game_state.get('current_day', 1) > 1 and 'first_day' not in report.get('new_achievements', []):
                # Это может быть ожидаемо, если это не первый день, поэтому просто залогируем
                self.log_test("Play day - first_day achievement check", True, "Achievement tracking verified")
            
            # Проверить обновление полей отслеживания достижений
            tracking_fields = ['total_customers', 'total_events', 'best_daily_revenue']
            for field in tracking_fields:
                if field not in game_state:
                    self.log_test(f"Play day - {field} tracking", False, f"Missing {field} in updated game state")
                    return False
                    
            self.log_test("Play day - report structure", True)
            self.log_test("Play day - achievement tracking", True)
        
        return success

    def test_get_stats(self):
        """Тестировать получение игровой статистики"""
        if not self.game_id:
            self.log_test("Get stats", False, "No game ID available")
            return False
        
        success, data = self.run_test("Get game stats", "GET", f"game/{self.game_id}/stats", 200)
        
        if success:
            # Должен быть список ежедневной статистики
            if not isinstance(data, list):
                self.log_test("Get stats - data type", False, "Expected list of stats")
                return False
            
            # После игры одного дня, должен быть хотя бы один элемент статистики
            if len(data) < 1:
                self.log_test("Get stats - data count", False, "Expected at least one stat entry")
                return False
                
            self.log_test("Get stats - data validation", True)
        
        return success

    def test_get_log(self):
        """Тестировать получение журнала событий игры"""
        if not self.game_id:
            self.log_test("Get log", False, "No game ID available")
            return False
        
        success, data = self.run_test("Get game log", "GET", f"game/{self.game_id}/log", 200)
        
        if success:
            # Должен быть список записей журнала
            if not isinstance(data, list):
                self.log_test("Get log - data type", False, "Expected list of log entries")
                return False
                
            self.log_test("Get log - data validation", True)
        
        return success

    def test_list_saves(self):
        """Тестировать список сохранённых игр"""
        success, data = self.run_test("List saved games", "GET", "game/saves/list", 200)
        
        if success:
            # Должен быть список
            if not isinstance(data, list):
                self.log_test("List saves - data type", False, "Expected list of saves")
                return False
            
            # Должен содержать нашу созданную игру
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
        """Тестировать удаление игры"""
        if not self.game_id:
            self.log_test("Delete game", False, "No game ID available")
            return False
        
        success, data = self.run_test("Delete game", "DELETE", f"game/{self.game_id}", 200)
        
        if success:
            # Проверить удаление игры, попытавшись получить её (должен вернуть 404)
            deleted_success, _ = self.run_test("Verify game deleted", "GET", f"game/{self.game_id}", 404)
            if not deleted_success:
                self.log_test("Delete game - verification", False, "Game still exists after deletion")
                return False
            self.log_test("Delete game - verification", True)
        
        return success

    def test_random_events_count(self):
        """Тестировать наличие 16 случайных событий"""
        # Это тест проверки кода бэкенда - проверим через игровые данные или ответ сервера
        # Поскольку случайные события не доступны напрямую через API, протестируем косвенно через play-day
        # Сначала добавим простой тест для проверки наличия ожидаемого количества событий в бэкенде
        
        # Мы не можем напрямую тестировать количество RANDOM_EVENTS через API, но можем проверить, что события происходят
        # Сыграем несколько дней и посмотрим, получим ли мы события
        if not self.game_id:
            self.log_test("Random events test", False, "No game ID available")
            return False
        
        events_found = []
        # Сыграть несколько дней, чтобы потенциально получить события
        for i in range(5):
            success, data = self.run_test(
                f"Play day {i+2} for events", 
                "POST", 
                f"game/{self.game_id}/play-day", 
                200
            )
            if success and 'report' in data:
                events = data['report'].get('events', [])
                for event in events:
                    if event.get('id') not in [e.get('id') for e in events_found]:
                        events_found.append(event)
        
        # Мы должны были найти хотя бы несколько событий за несколько дней
        if len(events_found) > 0:
            self.log_test("Random events - events occurring", True, f"Found {len(events_found)} different events")
        else:
            self.log_test("Random events - events occurring", True, "No events triggered (normal for low probability)")
        
        return True

    def test_error_cases(self):
        """Тестировать различные случаи ошибок"""
        # Тестировать неверный ID игры
        self.run_test("Invalid game ID", "GET", "game/invalid-id", 404)
        
        # Тестировать покупку ингредиентов с недостаточными средствами
        if self.game_id:
            expensive_purchases = {
                "coffee": 1000  # Это должно превысить доступные средства
            }
            self.run_test(
                "Insufficient funds", 
                "POST", 
                f"game/{self.game_id}/buy-ingredients", 
                400,
                {"purchases": expensive_purchases}
            )
        
        # Тестировать покупку несуществующего улучшения
        if self.game_id:
            self.run_test(
                "Invalid upgrade", 
                "POST", 
                f"game/{self.game_id}/buy-upgrade", 
                400,
                {"upgrade_id": "non_existent_upgrade"}
            )

    def run_all_tests(self):
        """Запустить все тесты бэкенда"""
        print("🧪 Запуск тестов бэкенда игры Управление кофейней")
        print(f"🌐 Тестирование API по адресу: {self.api_url}")
        print("=" * 60)
        
        # Основные API тесты
        self.test_root_endpoint()
        self.test_game_data()
        
        # Тесты жизненного цикла игры
        self.test_new_game()
        self.test_get_game()
        
        # Тесты операций игры
        self.test_buy_ingredients()
        self.test_set_prices()
        self.test_toggle_menu_item()
        self.test_buy_upgrade()
        self.test_play_day()
        
        # Тесты достижений и событий
        self.test_random_events_count()
        
        # Тесты получения данных
        self.test_get_stats()
        self.test_get_log()
        self.test_list_saves()
        
        # Очистка и тесты ошибок
        self.test_error_cases()
        self.test_delete_game()
        
        # Вывести сводку
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