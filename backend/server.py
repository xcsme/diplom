from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import math
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

INGREDIENTS = [
    {"id": "coffee", "name": "Кофейные зёрна", "base_price": 50, "unit": "кг", "icon": "coffee"},
    {"id": "milk", "name": "Молоко", "base_price": 30, "unit": "л", "icon": "milk"},
    {"id": "sugar", "name": "Сахар", "base_price": 15, "unit": "кг", "icon": "candy"},
    {"id": "syrup", "name": "Сиропы", "base_price": 80, "unit": "бут.", "icon": "wine"},
    {"id": "pastry", "name": "Выпечка", "base_price": 40, "unit": "шт.", "icon": "croissant"},
    {"id": "cups", "name": "Стаканы", "base_price": 10, "unit": "шт.", "icon": "cup-soda"},
]

MENU_ITEMS = [
    {
        "id": "espresso", "name": "Эспрессо", "base_price": 120, "prep_time": 2,
        "popularity": 1.0, "is_available": True,
        "recipe": {"coffee": 2, "sugar": 0.5, "cups": 1}
    },
    {
        "id": "cappuccino", "name": "Капучино", "base_price": 180, "prep_time": 3,
        "popularity": 1.2, "is_available": True,
        "recipe": {"coffee": 2, "milk": 3, "sugar": 1, "cups": 1}
    },
    {
        "id": "latte", "name": "Латте", "base_price": 200, "prep_time": 3,
        "popularity": 1.3, "is_available": True,
        "recipe": {"coffee": 1.5, "milk": 5, "sugar": 1, "cups": 1}
    },
    {
        "id": "mocha", "name": "Мокко", "base_price": 220, "prep_time": 4,
        "popularity": 0.9, "is_available": True,
        "recipe": {"coffee": 2, "milk": 3, "syrup": 1, "sugar": 1, "cups": 1}
    },
    {
        "id": "croissant", "name": "Круассан", "base_price": 100, "prep_time": 1,
        "popularity": 1.1, "is_available": True,
        "recipe": {"pastry": 1}
    },
    {
        "id": "muffin", "name": "Шоколадный маффин", "base_price": 90, "prep_time": 1,
        "popularity": 0.8, "is_available": True,
        "recipe": {"pastry": 1, "sugar": 0.5}
    },
]

UPGRADES = [
    {"id": "coffee_machine_2", "name": "Кофемашина ур.2", "type": "equipment", "cost": 3000,
     "effect_type": "speed", "effect_value": 1.3, "required_upgrade_id": None,
     "description": "Увеличивает скорость обслуживания на 30%"},
    {"id": "coffee_machine_3", "name": "Кофемашина ур.3", "type": "equipment", "cost": 8000,
     "effect_type": "speed", "effect_value": 1.5, "required_upgrade_id": "coffee_machine_2",
     "description": "Увеличивает скорость обслуживания на 50%"},
    {"id": "fridge_2", "name": "Холодильник ур.2", "type": "equipment", "cost": 2000,
     "effect_type": "capacity", "effect_value": 1.5, "required_upgrade_id": None,
     "description": "Увеличивает вместимость склада на 50%"},
    {"id": "fridge_3", "name": "Холодильник ур.3", "type": "equipment", "cost": 5000,
     "effect_type": "capacity", "effect_value": 2.0, "required_upgrade_id": "fridge_2",
     "description": "Удваивает вместимость склада"},
    {"id": "display_2", "name": "Витрина ур.2", "type": "equipment", "cost": 2500,
     "effect_type": "quality", "effect_value": 1.2, "required_upgrade_id": None,
     "description": "Повышает привлекательность выпечки на 20%"},
    {"id": "barista_2", "name": "Бариста ур.2", "type": "staff", "cost": 4000,
     "effect_type": "quality", "effect_value": 1.3, "required_upgrade_id": None,
     "description": "Повышает качество напитков на 30%"},
    {"id": "barista_3", "name": "Бариста ур.3", "type": "staff", "cost": 10000,
     "effect_type": "quality", "effect_value": 1.5, "required_upgrade_id": "barista_2",
     "description": "Повышает качество напитков на 50%"},
    {"id": "manager", "name": "Менеджер", "type": "staff", "cost": 6000,
     "effect_type": "auto_buy", "effect_value": 1, "required_upgrade_id": None,
     "description": "Автозакуп ингредиентов перед началом дня"},
    {"id": "marketing_1", "name": "Реклама в соцсетях", "type": "marketing", "cost": 1500,
     "effect_type": "rep_bonus", "effect_value": 50, "required_upgrade_id": None,
     "description": "Единоразовый бонус к репутации +50"},
    {"id": "marketing_2", "name": "Статья в блоге", "type": "marketing", "cost": 3000,
     "effect_type": "rep_bonus", "effect_value": 100, "required_upgrade_id": "marketing_1",
     "description": "Единоразовый бонус к репутации +100"},
    {"id": "marketing_3", "name": "Сотрудничество с блогером", "type": "marketing", "cost": 7000,
     "effect_type": "rep_bonus", "effect_value": 200, "required_upgrade_id": "marketing_2",
     "description": "Единоразовый бонус к репутации +200"},
]

RANDOM_EVENTS = [
    {"id": "critic", "name": "Кофейный критик", "description": "Сегодня к вам заглянул известный кофейный критик! Репутация изменится сильнее.",
     "effect": {"rep_multiplier": 2.0}, "probability": 0.08},
    {"id": "machine_break", "name": "Поломка кофемашины", "description": "Кофемашина сломалась! Скорость обслуживания снижена на сегодня.",
     "effect": {"speed_multiplier": 0.5}, "probability": 0.07},
    {"id": "supplier_sale", "name": "Распродажа у поставщика", "description": "Сезонная распродажа! Скидка 30% на все закупки сегодня.",
     "effect": {"buy_discount": 0.3}, "probability": 0.08},
    {"id": "flashmob", "name": "Флешмоб в соцсетях", "description": "Ваша кофейня стала вирусной! Временный приток посетителей.",
     "effect": {"visitor_multiplier": 1.8}, "probability": 0.06},
    {"id": "rain", "name": "Дождливый день", "description": "Из-за дождя меньше людей на улице. Посетителей меньше обычного.",
     "effect": {"visitor_multiplier": 0.6}, "probability": 0.08},
    {"id": "holiday", "name": "Праздничный день", "description": "Сегодня праздник! Больше посетителей, но они готовы платить больше.",
     "effect": {"visitor_multiplier": 1.5, "price_tolerance": 1.3}, "probability": 0.05},
    {"id": "milk_price", "name": "Рост цен на молоко", "description": "Цены на молоко выросли на 40%. Закупки молока дороже.",
     "effect": {"ingredient_price": {"milk": 1.4}}, "probability": 0.06},
    {"id": "competition", "name": "Новая кофейня рядом", "description": "Рядом открылась конкурирующая кофейня. Репутация снижена на 20.",
     "effect": {"rep_change": -20}, "probability": 0.05},
    {"id": "vip_guest", "name": "VIP-гость", "description": "Известная личность зашла выпить кофе и выложила фото! Репутация +30.",
     "effect": {"rep_change": 30}, "probability": 0.05},
    {"id": "power_outage", "name": "Перебои с электричеством", "description": "Кратковременное отключение света. Скорость обслуживания снижена.",
     "effect": {"speed_multiplier": 0.7}, "probability": 0.05},
    {"id": "coffee_festival", "name": "Фестиваль кофе в городе", "description": "В городе проходит кофейный фестиваль! Больше посетителей и выше репутация.",
     "effect": {"visitor_multiplier": 1.6, "rep_change": 15}, "probability": 0.04},
    {"id": "health_inspection", "name": "Проверка СЭС", "description": "Внеплановая проверка санитарной службы. Если запасы низкие — штраф.",
     "effect": {"rep_change": -10}, "probability": 0.05},
    {"id": "celebrity_post", "name": "Пост блогера", "description": "Популярный блогер написал хороший отзыв! Приток посетителей.",
     "effect": {"visitor_multiplier": 1.4, "rep_change": 20}, "probability": 0.04},
    {"id": "sugar_drop", "name": "Падение цен на сахар", "description": "Сахар подешевел на 50%! Отличный день для закупок.",
     "effect": {"ingredient_price": {"sugar": 0.5}}, "probability": 0.05},
    {"id": "barista_sick", "name": "Бариста заболел", "description": "Ваш бариста приболел. Качество напитков немного снижено сегодня.",
     "effect": {"speed_multiplier": 0.8}, "probability": 0.05},
    {"id": "sunny_weekend", "name": "Солнечный выходной", "description": "Прекрасная погода привлекла гуляющих! Больше посетителей.",
     "effect": {"visitor_multiplier": 1.3}, "probability": 0.06},
]

ACHIEVEMENTS = [
    {"id": "first_day", "name": "Первый рабочий день", "description": "Завершите первый день работы", "icon": "sunrise",
     "condition": lambda s: s.get("current_day", 1) > 1},
    {"id": "ten_days", "name": "Опытный управляющий", "description": "Проработайте 10 дней", "icon": "calendar-check",
     "condition": lambda s: s.get("current_day", 1) > 10},
    {"id": "thirty_days", "name": "Месяц в деле", "description": "Проработайте 30 дней", "icon": "calendar-heart",
     "condition": lambda s: s.get("current_day", 1) > 30},
    {"id": "hundred_customers", "name": "Сотня клиентов", "description": "Обслужите 100 клиентов суммарно", "icon": "users",
     "condition": lambda s: s.get("total_customers", 0) >= 100},
    {"id": "five_hundred_customers", "name": "Народная кофейня", "description": "Обслужите 500 клиентов суммарно", "icon": "heart-handshake",
     "condition": lambda s: s.get("total_customers", 0) >= 500},
    {"id": "first_upgrade", "name": "Первое улучшение", "description": "Купите первое улучшение", "icon": "sparkles",
     "condition": lambda s: len(s.get("purchased_upgrades", [])) >= 1},
    {"id": "all_upgrades", "name": "Полный апгрейд", "description": "Купите все улучшения", "icon": "crown",
     "condition": lambda s: len(s.get("purchased_upgrades", [])) >= len(UPGRADES)},
    {"id": "ten_thousand", "name": "Первые 10 тысяч", "description": "Накопите 10 000 ₽", "icon": "banknote",
     "condition": lambda s: s.get("money", 0) >= 10000},
    {"id": "fifty_thousand", "name": "Полпути к мечте", "description": "Накопите 50 000 ₽", "icon": "gem",
     "condition": lambda s: s.get("money", 0) >= 50000},
    {"id": "reputation_500", "name": "Уважаемое заведение", "description": "Достигните репутации 500", "icon": "award",
     "condition": lambda s: s.get("reputation", 0) >= 500},
    {"id": "reputation_max", "name": "Легенда города", "description": "Достигните максимальной репутации 1000", "icon": "trophy",
     "condition": lambda s: s.get("reputation", 0) >= 1000},
    {"id": "perfect_day", "name": "Идеальный день", "description": "Завершите день со 100% удовлетворённостью", "icon": "star",
     "condition": lambda s: s.get("had_perfect_day", False)},
    {"id": "event_survivor", "name": "Бывалый", "description": "Переживите 10 случайных событий", "icon": "shield",
     "condition": lambda s: s.get("total_events", 0) >= 10},
    {"id": "big_spender", "name": "Щедрый закупщик", "description": "Потратьте 20 000 ₽ на закупки суммарно", "icon": "shopping-cart",
     "condition": lambda s: s.get("total_spent_on_ingredients", 0) >= 20000},
    {"id": "profit_king", "name": "Король прибыли", "description": "Заработайте 5 000 ₽ за один день", "icon": "trending-up",
     "condition": lambda s: s.get("best_daily_revenue", 0) >= 5000},
]

def check_achievements(game_state: dict) -> list:
    current = set(game_state.get("achievements", []))
    newly_unlocked = []
    for ach in ACHIEVEMENTS:
        if ach["id"] not in current and ach["condition"](game_state):
            newly_unlocked.append(ach["id"])
    return newly_unlocked

class NewGameRequest(BaseModel):
    player_name: str = "Игрок"

class BuyIngredientsRequest(BaseModel):
    purchases: Dict[str, int]

class SetPricesRequest(BaseModel):
    prices: Dict[str, float]

class ToggleMenuItemRequest(BaseModel):
    item_id: str
    is_available: bool

class BuyUpgradeRequest(BaseModel):
    upgrade_id: str
def create_initial_game_state(player_name: str) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "player_name": player_name,
        "money": 5000.0,
        "reputation": 100,
        "current_day": 1,
        "status": "active",  # активная, победа, поражение
        "inventory": {i["id"]: 20 for i in INGREDIENTS},
        "menu_prices": {m["id"]: m["base_price"] for m in MENU_ITEMS},
        "menu_available": {m["id"]: m["is_available"] for m in MENU_ITEMS},
        "purchased_upgrades": [],
        "achievements": [],
        "total_customers": 0,
        "total_revenue": 0,
        "total_events": 0,
        "total_spent_on_ingredients": 0,
        "best_daily_revenue": 0,
        "had_perfect_day": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_save": datetime.now(timezone.utc).isoformat(),
    }

def get_speed_multiplier(upgrades: list) -> float:
    m = 1.0
    if "coffee_machine_3" in upgrades:
        m = 1.5
    elif "coffee_machine_2" in upgrades:
        m = 1.3
    return m

def get_quality_multiplier(upgrades: list) -> float:
    m = 1.0
    if "barista_3" in upgrades:
        m *= 1.5
    elif "barista_2" in upgrades:
        m *= 1.3
    if "display_2" in upgrades:
        m *= 1.2
    return m

def get_capacity_multiplier(upgrades: list) -> float:
    if "fridge_3" in upgrades:
        return 2.0
    elif "fridge_2" in upgrades:
        return 1.5
    return 1.0

def calculate_ingredient_cost(menu_item: dict) -> float:
    cost = 0
    for ing_id, qty in menu_item["recipe"].items():
        for ing in INGREDIENTS:
            if ing["id"] == ing_id:
                cost += ing["base_price"] * qty
                break
    return cost

def simulate_day(game_state: dict) -> dict:
    money = game_state["money"]
    reputation = game_state["reputation"]
    inventory = dict(game_state["inventory"])
    prices = game_state["menu_prices"]
    available = game_state["menu_available"]
    upgrades = game_state["purchased_upgrades"]
    day = game_state["current_day"]

    events_today = []
    day_effects = {
        "speed_multiplier": 1.0,
        "visitor_multiplier": 1.0,
        "rep_multiplier": 1.0,
        "buy_discount": 0,
        "price_tolerance": 1.0,
        "ingredient_price": {},
        "rep_change": 0,
    }

    for event in RANDOM_EVENTS:
        if random.random() < event["probability"]:
            events_today.append(event)
            for key, val in event["effect"].items():
                if key == "ingredient_price":
                    day_effects["ingredient_price"].update(val)
                elif key in day_effects:
                    if isinstance(day_effects[key], (int, float)):
                        if "multiplier" in key:
                            day_effects[key] *= val
                        else:
                            day_effects[key] += val

    day_effects["speed_multiplier"] *= get_speed_multiplier(upgrades)
    quality_mult = get_quality_multiplier(upgrades)

    auto_buy_cost = 0
    if "manager" in upgrades:
        for ing in INGREDIENTS:
            current = inventory.get(ing["id"], 0)
            if current < 15:
                to_buy = 25 - current
                cost = to_buy * ing["base_price"]
                auto_buy_cost += cost
                inventory[ing["id"]] = current + to_buy
        money -= auto_buy_cost

    base_visitors = max(5, int(reputation / 15) + random.randint(-3, 5))
    visitors = max(1, int(base_visitors * day_effects["visitor_multiplier"]))

    max_serve = int(20 * day_effects["speed_multiplier"])
    available_items = [m for m in MENU_ITEMS if available.get(m["id"], False)]
    if not available_items:
        available_items = [MENU_ITEMS[0]]

    served = 0
    revenue = 0
    total_satisfaction = 0
    orders_detail = {}

    for _ in range(min(visitors, max_serve)):
        weights = [m["popularity"] for m in available_items]
        chosen = random.choices(available_items, weights=weights, k=1)[0]

        can_make = True
        for ing_id, qty_needed in chosen["recipe"].items():
            if inventory.get(ing_id, 0) < qty_needed:
                can_make = False
                break

        if not can_make:
            continue

        for ing_id, qty_needed in chosen["recipe"].items():
            inventory[ing_id] = round(inventory[ing_id] - qty_needed, 2)

        sell_price = prices.get(chosen["id"], chosen["base_price"])
        revenue += sell_price

        cost = calculate_ingredient_cost(chosen)
        price_ratio = sell_price / (cost * 2) if cost > 0 else 1
        satisfaction = min(1.0, (1.0 / price_ratio) * quality_mult * day_effects["price_tolerance"])
        satisfaction = max(0.1, min(1.0, satisfaction))
        total_satisfaction += satisfaction

        served += 1
        orders_detail[chosen["id"]] = orders_detail.get(chosen["id"], 0) + 1

    if served > 0:
        avg_sat = total_satisfaction / served
        rep_change = int((avg_sat - 0.5) * 20 * day_effects["rep_multiplier"])
    else:
        avg_sat = 0
        rep_change = -5

    rep_change += day_effects["rep_change"]

    unserved = min(visitors, max_serve) - served
    if unserved > 0:
        rep_change -= int(unserved * 2)

    new_reputation = max(0, min(1000, reputation + rep_change))
    expenses = auto_buy_cost

    new_money = money + revenue
    status = "active"
    if new_money <= 0:
        status = "lost_money"
    elif new_reputation <= 0:
        status = "lost_reputation"
    elif new_money >= 100000:
        status = "won"

    report = {
        "day": day,
        "visitors": visitors,
        "served": served,
        "unserved": unserved,
        "revenue": round(revenue, 2),
        "expenses": round(expenses, 2),
        "profit": round(revenue - expenses, 2),
        "avg_satisfaction": round(avg_sat, 2) if served > 0 else 0,
        "rep_change": rep_change,
        "old_reputation": reputation,
        "new_reputation": new_reputation,
        "old_money": round(money, 2),
        "new_money": round(new_money, 2),
        "orders": orders_detail,
        "events": [{"id": e["id"], "name": e["name"], "description": e["description"]} for e in events_today],
        "auto_buy_cost": round(auto_buy_cost, 2),
        "status": status,
    }

    updated_state = {
        "money": round(new_money, 2),
        "reputation": new_reputation,
        "current_day": day + 1,
        "inventory": {k: round(v, 2) for k, v in inventory.items()},
        "status": status,
        "last_save": datetime.now(timezone.utc).isoformat(),
    }

    return report, updated_state

@api_router.get("/")
async def root():
    return {"message": "Кофейня: Мастерская вкуса API"}

@api_router.get("/game/data")
async def get_game_data():
    return {
        "ingredients": INGREDIENTS,
        "menu_items": [{**m, "cost": calculate_ingredient_cost(m)} for m in MENU_ITEMS],
        "upgrades": UPGRADES,
        "achievements": [{"id": a["id"], "name": a["name"], "description": a["description"], "icon": a["icon"]} for a in ACHIEVEMENTS],
    }

@api_router.post("/game/new")
async def new_game(req: NewGameRequest):
    state = create_initial_game_state(req.player_name)
    await db.game_states.insert_one({**state, "_id": state["id"]})
    return state

@api_router.get("/game/{game_id}")
async def get_game(game_id: str):
    state = await db.game_states.find_one({"id": game_id}, {"_id": 0})
    if not state:
        raise HTTPException(status_code=404, detail="Игра не найдена")
    return state

@api_router.get("/game/saves/list")
async def list_saves():
    saves = await db.game_states.find(
        {}, {"_id": 0, "id": 1, "player_name": 1, "current_day": 1, "money": 1, "reputation": 1, "status": 1, "last_save": 1}
    ).sort("last_save", -1).to_list(20)
    return saves

@api_router.delete("/game/{game_id}")
async def delete_game(game_id: str):
    await db.game_states.delete_one({"id": game_id})
    await db.game_logs.delete_many({"game_id": game_id})
    await db.daily_stats.delete_many({"game_id": game_id})
    return {"status": "deleted"}

@api_router.post("/game/{game_id}/buy-ingredients")
async def buy_ingredients(game_id: str, req: BuyIngredientsRequest):
    state = await db.game_states.find_one({"id": game_id}, {"_id": 0})
    if not state:
        raise HTTPException(status_code=404, detail="Игра не найдена")
    if state["status"] != "active":
        raise HTTPException(status_code=400, detail="Игра окончена")

    total_cost = 0
    new_inventory = dict(state["inventory"])
    capacity_mult = get_capacity_multiplier(state["purchased_upgrades"])
    max_stock = int(100 * capacity_mult)

    for ing_id, qty in req.purchases.items():
        if qty <= 0:
            continue
        ing = next((i for i in INGREDIENTS if i["id"] == ing_id), None)
        if not ing:
            raise HTTPException(status_code=400, detail=f"Неизвестный ингредиент: {ing_id}")
        current = new_inventory.get(ing_id, 0)
        if current + qty > max_stock:
            qty = max_stock - current
            if qty <= 0:
                continue
        cost = ing["base_price"] * qty
        total_cost += cost
        new_inventory[ing_id] = round(current + qty, 2)

    if total_cost > state["money"]:
        raise HTTPException(status_code=400, detail="Недостаточно средств")

    new_money = round(state["money"] - total_cost, 2)
    new_total_spent = round(state.get("total_spent_on_ingredients", 0) + total_cost, 2)
    await db.game_states.update_one(
        {"id": game_id},
        {"$set": {
            "inventory": new_inventory,
            "money": new_money,
            "total_spent_on_ingredients": new_total_spent,
            "last_save": datetime.now(timezone.utc).isoformat(),
        }}
    )

    updated = {**state, "money": new_money, "inventory": new_inventory, "total_spent_on_ingredients": new_total_spent}
    new_achs = check_achievements(updated)
    if new_achs:
        all_achs = state.get("achievements", []) + new_achs
        await db.game_states.update_one({"id": game_id}, {"$set": {"achievements": all_achs}})

    return {"money": new_money, "inventory": new_inventory, "total_cost": round(total_cost, 2), "new_achievements": new_achs}

@api_router.post("/game/{game_id}/set-prices")
async def set_prices(game_id: str, req: SetPricesRequest):
    state = await db.game_states.find_one({"id": game_id}, {"_id": 0})
    if not state:
        raise HTTPException(status_code=404, detail="Игра не найдена")

    new_prices = dict(state["menu_prices"])
    for item_id, price in req.prices.items():
        if price < 0:
            raise HTTPException(status_code=400, detail="Цена не может быть отрицательной")
        new_prices[item_id] = round(price, 2)

    await db.game_states.update_one(
        {"id": game_id},
        {"$set": {"menu_prices": new_prices, "last_save": datetime.now(timezone.utc).isoformat()}}
    )
    return {"menu_prices": new_prices}

@api_router.post("/game/{game_id}/toggle-menu-item")
async def toggle_menu_item(game_id: str, req: ToggleMenuItemRequest):
    state = await db.game_states.find_one({"id": game_id}, {"_id": 0})
    if not state:
        raise HTTPException(status_code=404, detail="Игра не найдена")

    new_available = dict(state["menu_available"])
    new_available[req.item_id] = req.is_available

    await db.game_states.update_one(
        {"id": game_id},
        {"$set": {"menu_available": new_available, "last_save": datetime.now(timezone.utc).isoformat()}}
    )
    return {"menu_available": new_available}

@api_router.post("/game/{game_id}/buy-upgrade")
async def buy_upgrade(game_id: str, req: BuyUpgradeRequest):
    state = await db.game_states.find_one({"id": game_id}, {"_id": 0})
    if not state:
        raise HTTPException(status_code=404, detail="Игра не найдена")
    if state["status"] != "active":
        raise HTTPException(status_code=400, detail="Игра окончена")

    upgrade = next((u for u in UPGRADES if u["id"] == req.upgrade_id), None)
    if not upgrade:
        raise HTTPException(status_code=400, detail="Неизвестное улучшение")

    if req.upgrade_id in state["purchased_upgrades"]:
        raise HTTPException(status_code=400, detail="Уже куплено")

    if upgrade["required_upgrade_id"] and upgrade["required_upgrade_id"] not in state["purchased_upgrades"]:
        raise HTTPException(status_code=400, detail="Сначала купите предыдущее улучшение")

    if state["money"] < upgrade["cost"]:
        raise HTTPException(status_code=400, detail="Недостаточно средств")

    new_money = round(state["money"] - upgrade["cost"], 2)
    new_upgrades = state["purchased_upgrades"] + [req.upgrade_id]

    update_data = {
        "money": new_money,
        "purchased_upgrades": new_upgrades,
        "last_save": datetime.now(timezone.utc).isoformat(),
    }

    if upgrade["effect_type"] == "rep_bonus":
        new_rep = min(1000, state["reputation"] + int(upgrade["effect_value"]))
        update_data["reputation"] = new_rep

    await db.game_states.update_one({"id": game_id}, {"$set": update_data})

    updated = {**state, **update_data}
    new_achs = check_achievements(updated)
    if new_achs:
        all_achs = updated.get("achievements", []) + new_achs
        await db.game_states.update_one({"id": game_id}, {"$set": {"achievements": all_achs}})

    result = {"money": new_money, "purchased_upgrades": new_upgrades, "new_achievements": new_achs}
    if "reputation" in update_data:
        result["reputation"] = update_data["reputation"]
    return result

@api_router.post("/game/{game_id}/play-day")
async def play_day(game_id: str):
    state = await db.game_states.find_one({"id": game_id}, {"_id": 0})
    if not state:
        raise HTTPException(status_code=404, detail="Игра не найдена")
    if state["status"] != "active":
        raise HTTPException(status_code=400, detail="Игра окончена")

    report, updated_state = simulate_day(state)

    updated_state["total_customers"] = state.get("total_customers", 0) + report["served"]
    updated_state["total_revenue"] = round(state.get("total_revenue", 0) + report["revenue"], 2)
    updated_state["total_events"] = state.get("total_events", 0) + len(report["events"])
    updated_state["best_daily_revenue"] = max(state.get("best_daily_revenue", 0), report["revenue"])
    if report["avg_satisfaction"] >= 0.99 and report["served"] > 0:
        updated_state["had_perfect_day"] = True
    else:
        updated_state["had_perfect_day"] = state.get("had_perfect_day", False)

    await db.game_states.update_one({"id": game_id}, {"$set": updated_state})

    merged = {**state, **updated_state}
    new_achs = check_achievements(merged)
    if new_achs:
        all_achs = state.get("achievements", []) + new_achs
        await db.game_states.update_one({"id": game_id}, {"$set": {"achievements": all_achs}})
        updated_state["achievements"] = all_achs

    stat_doc = {
        "game_id": game_id,
        "day": report["day"],
        "revenue": report["revenue"],
        "expenses": report["expenses"],
        "profit": report["profit"],
        "customers_served": report["served"],
        "avg_satisfaction": report["avg_satisfaction"],
        "reputation": report["new_reputation"],
        "money": report["new_money"],
    }
    await db.daily_stats.insert_one(stat_doc)

    logs = []
    for event in report["events"]:
        logs.append({
            "game_id": game_id,
            "day": report["day"],
            "event_type": "random_event",
            "description": f"{event['name']}: {event['description']}",
            "amount": 0,
        })
    logs.append({
        "game_id": game_id,
        "day": report["day"],
        "event_type": "daily_report",
        "description": f"День {report['day']}: выручка {report['revenue']}, обслужено {report['served']} из {report['visitors']}",
        "amount": report["revenue"],
    })
    if logs:
        await db.game_logs.insert_many(logs)

    report["new_achievements"] = new_achs
    return {"report": report, "game_state": {**state, **updated_state}}

@api_router.get("/game/{game_id}/stats")
async def get_stats(game_id: str):
    stats = await db.daily_stats.find(
        {"game_id": game_id}, {"_id": 0}
    ).sort("day", 1).to_list(1000)
    return stats

@api_router.get("/game/{game_id}/log")
async def get_log(game_id: str):
    logs = await db.game_logs.find(
        {"game_id": game_id}, {"_id": 0}
    ).sort("day", -1).to_list(500)
    return logs

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
