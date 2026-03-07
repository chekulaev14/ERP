# Backend Principles

Правила разработки backend. Архитектура слоёв, auth, API, сервисы. Принципы БД — в [DB-PRINCIPLES.md](DB-PRINCIPLES.md).

---

## 1. Чёткая граница слоёв

Route → Service → Prisma/DB. Route: парсинг запроса, auth context, формат ответа. Service: бизнес-логика. Route не работает напрямую с Prisma.

## 2. Любое критичное действие — транзакция

Операции, изменяющие несколько таблиц, выполняются только в транзакции. Пример: completeOrder = InventoryOperation + списание компонентов + приход продукции + обновление StockBalance + StatusHistory + смена статуса.

## 3. Аутентификация разделена

Гибридная модель: Worker + PIN для терминала, User + email/password для web. Worker может быть связан с User.

## 4. Авторизация через роли

RBAC: ADMIN, DIRECTOR, WAREHOUSE, WORKER. Роли проверяются в middleware (lib/auth.ts). Не разбрасывать проверки ролей по коду.

## 5. Валидация — zod на входе

Write-endpoints: zod-схемы в lib/schemas/. parseBody() для единого парсинга. handleRouteError() для единого формата ошибок. Discriminated union для action-based endpoints.

## 6. Никакой бизнес-логики в названиях

Запрещено кодировать логику в строках. Используются поля: side, type, status.

## 7. Docker — стандарт развёртывания

Каждый инстанс: app + postgres + .env. Без ручной настройки серверов.

---

## Главный принцип

Backend должен быть предсказуемым, безопасным и расширяемым.
