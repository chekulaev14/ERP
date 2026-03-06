# Грабли и решения

## Запрещённые имена маршрутов в Next.js 16

Нельзя называть папки маршрутов зарезервированными свойствами JavaScript: `constructor`, `prototype`, `toString`, `valueOf`, `hasOwnProperty` и т.д.

Проблема: Next.js 16 devtools (SegmentViewNode) обходит дерево маршрутов как объект. При обращении к `t.children["constructor"]` возвращается `Object.prototype.constructor` вместо undefined — и приложение крашится с ошибкой `undefined is not an object (evaluating 't.children[d]')`.

Симптомы: страница отдаёт 200 на сервере, но в браузере Runtime TypeError. Другие страницы работают.

Решение: переименовали `/warehouse/constructor` → `/warehouse/builder`.

## Turbopack: повреждение filesystem cache

В Next.js 16 Turbopack filesystem cache включён по умолчанию. При принудительном убийстве dev-сервера (kill -9) SST-файлы кеша повреждаются. После этого сервер не может запуститься: `Persisting failed: Unable to write SST file`, `Failed to restore task data`, 500 на всех страницах.

Решение: отключили кеш в `next.config.ts`:
```ts
experimental: { turbopackFileSystemCacheForDev: false }
```

Если кеш уже повреждён: `rm -rf .next node_modules && npm install`, затем запуск. Просто `rm -rf .next` недостаточно — нужна полная переустановка node_modules.
