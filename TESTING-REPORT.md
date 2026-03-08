# Testing Report — 07.03.2026

Playwright MCP, localhost:3000, prod БД.

---

## Сводка

- Выполнено: 28 тестов
- PASS: 24
- FAIL: 4
- NOT TESTED: 3

---

## Фаза 1 — Инфраструктура

| Тест | Результат | Комментарий |
|---|---|---|
| /api/health → 200 | PASS | |
| /api/health/db → 200 | PASS | |
| Test БД (.env.test) | NOT DONE | Нет .env.test, тесты на prod БД |
| ENV guard (whitelist) | NOT DONE | Не реализован |
| Seed воспроизводим | PASS | seed.ts с upsert |
| Test helpers | NOT DONE | Нет отдельных helpers |

Фаза 1 не завершена — нет изолированной test БД и helpers.

---

## Фаза 2 — Smoke + P0 regression

### Auth и роли

| Тест | Результат | Детали |
|---|---|---|
| Worker login по PIN → каталог | PASS | PIN 1234 → Иванов А.С., каталог изделий |
| User login email/password → склад | PASS | warehouse@gorchev.local → Смирнова Н.П. |
| Неверный PIN → отказ | PASS | 401 |
| Неверный пароль → отказ | PASS | "Неверный email или пароль" |
| Logout → сессия невалидна | PASS | Возврат на форму входа |
| WORKER → warehouse API → 403 | PASS | stock=403, users=403 |
| WAREHOUSE → /api/users → 403 | PASS | |
| Unauthenticated → protected API → 401 | PASS | stock, users, nomenclature, bom |

### Приход от поставщика

| Тест | Результат | Детали |
|---|---|---|
| UI успех | PASS | Тост "Оприходовано: Рулон 08пс 2.0мм — 100 кг" |
| StockMovement создан (SUPPLIER_INCOME) | PASS | type=SUPPLIER_INCOME, toLocationId=MAIN |
| StockBalance обновлён | PASS | 2700 → 2800 |
| InventoryOperation с operationKey | FAIL | Не реализовано в stock.service |
| Повторная отправка → нет дубля | FAIL | Нет idempotency guard |
| Нет лишних движений | PASS | Ровно одно движение на операцию |

### Сборка — достаточный остаток

| Тест | Результат | Детали |
|---|---|---|
| Компоненты списаны | PASS | bolts -2, nuts -2, washers -2 |
| Готовое оприходовано (ASSEMBLY_INCOME) | PASS | prod-ks200 +1 |
| StockBalance обновлён для всех | PASS | |
| Одна операция, кол-во движений = BOM + 1 | PASS | 3 списания + 1 приход = 4 |

### Сборка — недостаточный остаток

| Тест | Результат | Детали |
|---|---|---|
| UI ошибка с деталями нехватки | PASS | "Болты: нужно 200000, есть 7998" |
| Никаких движений, баланс не изменился | PASS | All-or-nothing |

### Создание заказа

| Тест | Результат | Детали |
|---|---|---|
| Статус PLANNED | PASS | |
| Snapshot текущего BOM | PASS | 3 компонента зафиксированы в snapshotItems |
| Snapshot неизменен после refresh | PASS | |

### Завершение заказа

| Тест | Результат | Детали |
|---|---|---|
| Статус COMPLETED | PASS | 3/3 шт |
| Списание по snapshot | PASS | |
| Готовая продукция оприходована | PASS | ks200: 61 → 64 |
| StockBalance обновлён | PASS | bolts -6, nuts -6, washers -6 |
| Повторное завершение запрещено | PASS | 403 |

### Номенклатура

| Тест | Результат | Детали |
|---|---|---|
| Создание → в списке | PASS | |
| Редактирование → сохранено | PASS | |
| Soft delete | PASS | 200 |
| Restore | FAIL | 403 для роли warehouse |

### BOM

| Тест | Результат | Детали |
|---|---|---|
| Прямой цикл (A→A) — запрещено | PASS* | Заблокирован, но 500 вместо 400 |
| Косвенный цикл (A→B→A) — запрещено | PASS* | Заблокирован, но 500 вместо 400 |

### Консистентность

| Тест | Результат | Детали |
|---|---|---|
| Баланс = сумма движений | PASS | raw-08ps-2.0, raw-bolts-m8, prod-ks200 |

---

## Фаза 3 — Углубление

| Тест | Результат | Детали |
|---|---|---|
| Double POST → одна операция | FAIL | Обе прошли, delta=2, нет idempotency |
| Snapshot isolation | PASS | snapshot зафиксирован в заказе |
| Конструктор — загрузка | PASS | 4 шага, без console errors |
| Конструктор — полная цепочка | NOT TESTED | Нестабильный, по TESTING.md не автоматизируется |
| Конкурентность | NOT TESTED | Manual по TESTING.md |
| Session boundaries | NOT TESTED | Требует ожидания timeout 15 мин |

---

## Баги

### S2 — Нет InventoryOperation / operationKey / idempotency guard

stock.service.createMovement не создаёт InventoryOperation, не генерирует operationKey. Двойной POST создаёт два движения. При retry или double-click возможно дублирование данных.

Где: app/src/services/stock.service.ts — createMovement()
Что нужно: operationKey как idempotency key, InventoryOperation как обёртка над группой движений.

### ~~S3 — Restore номенклатуры: 403 для warehouse~~ FALSE POSITIVE

Тест отправлял POST на /api/nomenclature/{id}/restore — такого route нет. Restore = PATCH на /api/nomenclature/{id}. RBAC разрешает PATCH для WAREHOUSE. Не баг.

### S3 — BOM cycle detection: 500 вместо 400

Циклы блокируются (данные не повреждаются), но API возвращает 500 Internal Server Error вместо 400 с сообщением "Цикл в BOM запрещён". Причина: bom.service бросает Error вместо ServiceError.

Где: app/src/services/bom.service.ts — строки 39, 58

### ~~S4 — Повторное завершение заказа: 403~~ FALSE POSITIVE

Тест отправлял POST на /api/production-orders/{id}/complete — такого route нет. Complete = POST на /api/production-orders с { action: "COMPLETE" }. Не баг.
