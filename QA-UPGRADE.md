# QA Upgrade — план фиксов по результатам тестирования

По итогам TESTING-REPORT.md от 07.03.2026.

---

## Уточнения по отчёту

Два "бага" из отчёта — ложные срабатывания теста:

- Restore 403 — тест отправлял POST на `/api/nomenclature/{id}/restore` (не существует). Restore = PATCH на `/api/nomenclature/{id}`. RBAC разрешает PATCH для WAREHOUSE. Не баг.
- Complete 403 — тест отправлял POST на `/api/production-orders/{id}/complete` (не существует). Complete = POST на `/api/production-orders` с `{ action: "COMPLETE" }`. Не баг.

---

## Порядок выполнения

### Шаг 1 — Исправить false positives тестов

Тесты бьют по несуществующим route. Пока это не исправлено, результаты тестирования нельзя доверять.

Что сделать:
- Restore: тест должен отправлять PATCH на `/api/nomenclature/{id}` с `{ deletedAt: null }`, а не POST на `/api/nomenclature/{id}/restore`
- Complete: тест должен отправлять POST на `/api/production-orders` с `{ action: "COMPLETE", orderId: id }`, а не POST на `/api/production-orders/{id}/complete`
- Перепрогнать оба теста и убедиться что PASS

Сложность: 10 мин.

---

### Шаг 2 — Error semantics cleanup

Три места бросают `Error` вместо `ServiceError`. handleRouteError ловит только ServiceError — всё остальное превращается в 500.

#### 2a. BOM cycle detection → ServiceError (400)

Файл: `app/src/services/bom.service.ts`

Строка 39:
```
- throw new Error("Позиция не может быть компонентом самой себя");
+ throw new ServiceError("Позиция не может быть компонентом самой себя", 400);
```

Строка 58:
```
- throw new Error("Обнаружен цикл: добавление этой связи создаст циклическую зависимость в BOM");
+ throw new ServiceError("Обнаружен цикл: добавление этой связи создаст циклическую зависимость в BOM", 400);
```

#### 2b. Stock insufficient balance → ServiceError (400)

Файл: `app/src/services/stock.service.ts`, строка 106

```
- throw new Error(`Недостаточно остатка: ${toNumber(row.quantity)} < ${data.quantity}`);
+ throw new ServiceError(`Недостаточно остатка: ${toNumber(row.quantity)} < ${data.quantity}`, 400);
```

#### 2c. Production order — повторное завершение → понятная ошибка

Файл: `app/src/services/production-order.service.ts`

Сейчас completeOrder для COMPLETED заказа молча возвращает существующий. Стоит добавить явную проверку:

```typescript
if (order.status === 'COMPLETED') {
  throw new ServiceError('Заказ уже завершён', 409);
}
```

409 Conflict — семантически правильно: ресурс уже в целевом состоянии.

Сложность: 10 мин на всё.

---

### Шаг 3 — Архитектурный фикс: все stock write через InventoryOperation

Это главная задача. Не локальный патч для одного route, а архитектурное правило.

#### Проблема

assembly.service и production-order.service уже работают правильно:
- Создают InventoryOperation с operationKey
- Проверяют existingOp перед созданием
- Привязывают все StockMovement к operationId

Но stock route для SUPPLIER_INCOME и PRODUCTION_INCOME вызывает `createMovement()` напрямую — без operationKey, без InventoryOperation. Double POST = два движения.

#### Правило (новое)

Любая операция, изменяющая остатки, обязана проходить через InventoryOperation. Нет InventoryOperation — нет движения.

#### Что сделать

1. Создать метод `createIncomeOperation()` в stock.service.ts:
   - Принимает: type (SUPPLIER_INCOME | PRODUCTION_INCOME), itemId, quantity, operationKey?, createdById, comment
   - Генерирует operationKey если не передан: `si-{timestamp}-{random}` / `pi-{timestamp}-{random}`
   - В транзакции: findUnique по operationKey → если есть, вернуть существующий → иначе create InventoryOperation → createMovement с operationId
   - Паттерн 1:1 с assembly.service (строки 50-73)

2. В stock route POST (case SUPPLIER_INCOME / PRODUCTION_INCOME):
   - Заменить прямой вызов `createMovement()` на `createIncomeOperation()`
   - Передавать operationKey из body (если есть)

3. Добавить `operationKey` в `createMovementSchema` (lib/schemas/stock.schema.ts) — опциональное поле

4. Клиент может генерировать operationKey и передавать его в POST. При retry — тот же ключ. Если operationKey не передан — сервер генерирует автоматически. Система устойчива в обоих случаях.

5. Обновить BACKEND-PRINCIPLES.md: добавить правило "все stock write через InventoryOperation" в секцию идемпотентности.

#### Проверка: а нет ли ещё мест?

Убедиться что НЕТ других route/service, которые вызывают createMovement() без InventoryOperation. Если есть — исправить по тому же паттерну.

Сложность: 40-50 мин.

---

### Шаг 4 — Post-fix regression

После шагов 2-3 прогнать конкретные проверки:

| Сценарий | Ожидание |
|---|---|
| Supplier income → POST | 200, InventoryOperation создана, operationKey заполнен |
| Supplier income → double POST с тем же operationKey | Второй возвращает существующий результат, одно движение |
| BOM cycle A→A | 400 с сообщением, не 500 |
| BOM cycle A→B→A | 400 с сообщением, не 500 |
| Списание при нехватке | 400 с деталями, не 500 |
| Повторное завершение заказа | 409 "Заказ уже завершён" |
| Сборка — happy path | Не сломалось после рефакторинга |
| Баланс = сумма движений | Консистентность сохранена |

Сложность: 20 мин.

---

### Шаг 5 — Test DB isolation

Делать после шагов 1-4. К этому моменту:
- Ложные срабатывания исправлены
- Ошибки семантически корректны
- Нет риска дублей
- Чистая база для тестового контура

Что нужно:
- `.env.test` с отдельной PostgreSQL БД
- ENV guard: whitelist, non-prod by default
- Seed для test DB
- Test helpers: остаток по item, движения по operationKey, пересчёт баланса

---

## Сводка

| # | Задача | Сложность | Тип |
|---|--------|-----------|-----|
| 1 | Test false positives — исправить route в тестах | 10 мин | Тест-фикс |
| 2 | Error semantics — Error → ServiceError (3 места) | 10 мин | Код-фикс |
| 3 | Архитектурный фикс — все stock write через InventoryOperation | 40-50 мин | Архитектура |
| 4 | Post-fix regression — прогон по 8 сценариям | 20 мин | Проверка |
| 5 | Test DB isolation | Отдельная задача | Инфраструктура |
