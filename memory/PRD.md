# PRD: Кофейня — Мастерская вкуса

## Problem Statement
Веб-игра в жанре экономического менеджера, где игрок управляет кофейней. Пошаговая (день за днём) с элементами случайных событий.

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI (game rendered in fixed 1024x768 window)
- **Backend**: FastAPI (Python) — вся игровая логика
- **Database**: MongoDB — сохранение прогресса, статистика, лог событий

## User Personas
- Любители казуальных симуляторов и менеджеров ресурсов

## Core Requirements
- Управление запасами ингредиентов (6 видов)
- Меню из 6 позиций с ценообразованием
- 11 улучшений: оборудование, персонал, маркетинг
- Симуляция рабочего дня с генерацией посетителей
- Случайные события (20-30% шанс)
- Условие победы: 100 000 ₽ | Поражение: банкротство или 0 репутации
- Полностью на русском языке

## What's Been Implemented (2026-04-14)
- [x] Стартовый экран (новая игра / загрузка)
- [x] Главный игровой экран с обзором дня
- [x] Склад и закупки с контролем количества
- [x] Меню и цены с переключателями
- [x] Дерево улучшений (оборудование/персонал/маркетинг)
- [x] Статистика с графиками (Recharts)
- [x] Лог событий
- [x] Модальное окно отчёта дня
- [x] Модальное окно победы/поражения
- [x] Автозакуп менеджером
- [x] Случайные события (8 типов)
- [x] Сохранение/загрузка/удаление игры
- [x] Полная API на FastAPI (12 эндпоинтов)
- [x] 100% тестов пройдено

## Prioritized Backlog
### P0 (Done)
- Core game loop, all screens, save/load

### P1
- Export statistics to CSV
- Sound effects (click sounds, background music)
- More detailed customer order animations

### P2
- Multilingual support
- More random events
- Second coffee shop expansion (as win condition #2)
- Daily challenge mode
- Leaderboard

## Next Tasks
1. Add CSV export for statistics
2. Consider adding more visual feedback during day simulation
3. Add more random events variety
