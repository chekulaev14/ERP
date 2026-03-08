# Testing Plan — Gorchev-V

Solo-разработка + Claude Code + MCP Playwright. Цель — целостность данных и корректность бизнес-процессов, не только UI.

---

## Основное правило

Для критичных сценариев UI-успеха недостаточно. Каждый тест проверяет данные в БД:
- InventoryOperation создана
- StockMovement записаны корректно
- StockBalance обновлён
- ProductionOrderItem snapshot зафиксирован
- StatusHistory записана
- operationKey уникален
- Нет лишних записей сверх ожидаемых

UI показывает "успешно" — это не proof. Proof — данные в БД.

---

## System invariants

Правила, которые всегда должны быть истинны:

- StockMovement — источник истины
- StockBalance — производная, должен совпадать с ledger
- Один operationKey = одна операция
- COMPLETED заказ нельзя завершить повторно
- Завершение заказа использует snapshot BOM, не текущий
- Складские операции атомарны (all-or-nothing)
- BOM не может содержать циклов (ни A→A, ни A→B→C→A)
- Worker auth не даёт доступ к web-модулям
- WAREHOUSE не имеет доступа к admin API
- Unauthenticated не имеет доступа к protected API

---

## Smoke: два набора

Test smoke (после изменений):
- /api/health → 200
- Worker login по PIN → каталог
- User login по email/password → склад
- Основные страницы грузятся без ошибок
- Logout инвалидирует сессию
- WORKER не попадает на склад
- WAREHOUSE не попадает в управление пользователями
- Неверный PIN / пароль → отказ
- Unauthenticated → protected API → 401

Prod smoke (после деплоя, только read-only):
- /api/health → 200
- Login / logout работает
- Страницы доступны после login

На prod запрещено: приход, сборка, завершение заказов, любые write-операции.

---

## Regression policy

Inventory: supplier income, assembly (+/-), balance consistency
BOM: cycle check, snapshot isolation, constructor
Auth: worker login, user login, protected routes + API
Production orders: create, complete, repeat guard, status history

---

## Severity

S1 — повреждение данных, обход авторизации, частичная транзакция → блокирует релиз
S2 — неправильный статус/snapshot/остаток, доступ к чужому модулю → блокирует если P0
S3 — валидация, soft delete, UI flow → по согласованию
S4 — косметика → backlog

---

## Фаза 1 — Инфраструктура

Цель: отдельная test БД, воспроизводимый seed, test helpers.

- [ ] Test БД (PostgreSQL) с .env.test, изолирована от prod
- [ ] ENV guard: whitelist-подход, non-prod by default
- [ ] Seed: worker с PIN, users по ролям, items с BOM, location MAIN, стартовые остатки
- [ ] Test helpers:
  - [ ] Остаток по item + location
  - [ ] Движения по operationKey
  - [ ] Статус-история заказа
  - [ ] Пересчёт баланса по движениям
- [ ] /api/health и /api/health/db работают

Готово когда: test DB изолирована, seed воспроизводим, helpers работают.

### Фаза 1 завершена: [ ] дата: ___________

---

## Фаза 2 — Smoke + P0 regression

Цель: покрыть критичные потоки. UI + data assertions.

### Auth и роли

- [ ] Worker login по PIN → доступ к каталогу
- [ ] User login по email/password → доступ к складу
- [ ] Неверный PIN / пароль → отказ
- [ ] Logout → сессия невалидна
- [ ] WORKER → warehouse API → 403
- [ ] WAREHOUSE → /api/users → 403
- [ ] Unauthenticated → protected API → 401

### Приход от поставщика

- [ ] UI успех
- [ ] StockMovement создан (SUPPLIER_INCOME)
- [ ] StockBalance обновлён
- [ ] InventoryOperation с уникальным operationKey
- [ ] Повторная отправка → нет дубля
- [ ] Нет лишних движений

### Сборка — достаточный остаток

- [ ] Компоненты списаны (ASSEMBLY_WRITE_OFF)
- [ ] Готовое оприходовано (ASSEMBLY_INCOME)
- [ ] StockBalance обновлён для всех позиций
- [ ] Одна InventoryOperation, operationKey уникален
- [ ] Кол-во движений = компоненты в BOM + 1

### Сборка — недостаточный остаток

- [ ] UI показывает ошибку с деталями нехватки
- [ ] Никаких движений, баланс не изменился

### Создание заказа

- [ ] Статус PLANNED
- [ ] ProductionOrderItem = snapshot текущего BOM
- [ ] StatusHistory записана
- [ ] Snapshot неизменен после refresh

### Завершение заказа

- [ ] Статус COMPLETED
- [ ] Списание по snapshot, не по текущему BOM
- [ ] Готовая продукция оприходована
- [ ] StockBalance обновлён
- [ ] StatusHistory с корректным transition
- [ ] Всё в одной транзакции
- [ ] Кол-во движений = состав snapshot
- [ ] Нет лишних движений

### Повторное завершение

- [ ] Запрещено, данные не изменились

### Номенклатура

- [ ] Создание → в списке
- [ ] Редактирование → сохранено
- [ ] Soft delete → корзина
- [ ] Restore → вернулась

### BOM

- [ ] Прямой цикл (A→A) — запрещено
- [ ] Косвенный цикл (A→B→C→A) — запрещено
- [ ] Добавление / удаление компонента

### Консистентность

- [ ] Баланс = сумма движений после каждой операции
- [ ] Rebuild balances на test DB = текущий StockBalance

Готово когда: все чекбоксы выше пройдены с data assertions.

### Фаза 2 завершена: [ ] дата: ___________

---

## Фаза 3 — Углубление

Цель: edge-cases, идемпотентность, precision, конкурентность.

### Идемпотентность

- [ ] Double click submit → одна операция
- [ ] Retry после ошибки → нет дубля
- [ ] Повторный POST → ошибка или возврат существующей
- [ ] Refresh после отправки → нет дубля
- [ ] Browser back-forward cache → нет дубля

### Snapshot isolation

- [ ] Создать заказ → изменить BOM → завершить → используется snapshot

### Конструктор изделия

- [ ] Happy path — полная цепочка
- [ ] Уникальные коды, корректные BOM-связи
- [ ] Ошибка на шаге → частичные данные не сохранены
- [ ] Навигация назад → данные формы сохранены

### Decimal precision

- [ ] Quantity Decimal(10,4) сохраняется точно
- [ ] Price Decimal(10,2) сохраняется точно
- [ ] UI = persisted значения
- [ ] Серия операций без накопительных расхождений

### Session boundaries

- [ ] Timeout worker (15 мин) → автовыход
- [ ] Re-login после timeout
- [ ] Worker → logout → user login → корректная смена
- [ ] Worker и User cookie не конфликтуют

### Конкурентность (manual)

- [ ] Две сборки на один остаток → одна успешна, вторая нет
- [ ] Два завершения одного заказа → одно успешно
- [ ] Два прихода с одним operationKey → один создан
- [ ] Нет deadlock

### Rebuild balances

- [ ] Controlled mismatch на test DB → rebuild → восстановление

Готово когда: идемпотентность покрыта, snapshot подтверждён, конкурентность проверена manual.

### Фаза 3 завершена: [ ] дата: ___________

---

## Пока не автоматизируется

- Нестабильный UI конструктора
- Конкурентные операции (manual)
- Сценарии без test helpers
- Быстро меняющиеся фичи

Правило: сначала стабилизировать manual, потом автоматизировать.

---

## Открытые вопросы

Данные:
- [ ] Правило округления Decimal — какое?
- [ ] Повторный operationKey — молча успех, ошибка, или возврат?
- [ ] Источник истины при расхождении — UI, StockBalance, StockMovement?
- [ ] Rebuild нашёл расхождение — что делать?
- [ ] Частичная сборка допускается или all-or-nothing?

Заказы и BOM:
- [ ] Отмена COMPLETED заказа — возможна?
- [ ] Snapshot BOM — всегда без исключений?
- [ ] Completed order — полностью immutable?
- [ ] Редактирование BOM при активных заказах — можно?

Номенклатура:
- [ ] Удаление item с активными зависимостями?
- [ ] Уникальность item code — глобально или только среди активных?

Auth:
- [ ] Timeout во время ввода выработки — что с данными?
- [ ] Полный список terminal-only / admin-only маршрутов?

Аудит:
- [ ] Логировать кто инициировал операции?
- [ ] Auditability "кто / когда / из какого экрана"?
