# Статус: War Thunder mouse-aim + кружок упреждения

Источник плана: `.cursor/plans/war-thunder-mouse-aim-and-lead-circle_3ca66a74.plan.md`

## Прогресс

- ✅ **Этап 1.1**: расширен `AirplaneStats` (добавлены `yawAccel`, `yawDamping`, опциональные `max*Rate`).
- ✅ **Этап 1.2**: расширен `flight-model` (добавлен `yawVelocity`, поддержка yaw во входах/демпфировании; добавлены `updateInertiaInto/applyDampingInto` для безаллокаторного пути).
- ✅ **Этап 1.3**: добавлен yaw в `controls.update()` (клавиши Q/E, `yawVelocity`, clamp, `rotateY`; инерция/демпфирование — через `*Into` без аллокаций).
- ✅ **Этап 2.1**: новый модуль ввода мыши `src/input/mouse-input.ts` (накопление dx/dy, `getMouseDeltas(out)`, подписка на `renderer.domElement`); подключение в `main.ts`.
- ✅ **Этап 2.2**: ReticleState в `createControls` — `reticleX_ndc`/`reticleY_ndc` (NDC [-1..1]), sensitivity, clamp по радиусу (круг 0.6), опциональный возврат к центру; `getReticle(out)` для overlay/aim; без аллокаций в update.
- ✅ **Этап 3.1**: Ray от камеры через перекрестие — `aimDir_world`, `getAimDir(out)` (уже было).
- ✅ **Этап 3.2**: Ошибки yaw/pitch в локальном базисе самолёта — forward/right/up из quaternion, `yawError = atan2(lx, lz)`, `pitchError = -atan2(ly, lz)`, deadzone ~1°, `getAimErrors(out)`; без аллокаций в update.
- ✅ **Этап 4.1**: Чистые функции контроллера в `src/physics/aim-controller.ts` — `computeAxisInputSpringDamper`, `computeBankTarget`, `computeRollInputToBank`; только числа, без побочных эффектов.
- ✅ **Этап 4.2**: Параметры (дефолты) — экспорт `AIM_CONTROLLER_DEFAULTS` (kpYaw/kpPitch/kpRoll ∈ [2..8], kdYaw/kdPitch/kdRoll ∈ [0.5..2], deadzoneRad).
- ✅ **Этап 4.3**: Микширование с клавиатурой — в `controls.update()` при нажатии клавиш по оси pitch/yaw mouse-aim по этой оси отключён; иначе используется выход spring-damper контроллера; крен остаётся ручным.
- ✅ **Этап 4.4**: Ограничители для «задержки» — в `AirplaneStats` добавлены опциональные `maxPitchRateChange`, `maxYawRateChange`, `maxRollRateChange` (макс. приращение угл. скорости за кадр); в `flight-model` приращение ограничивается через `clampDelta()` перед добавлением к скорости; clamp по `max*Rate` уже применяется в `controls.update()`. Во всех пресетах заданы `max*Rate` и `max*RateChange`.
- ✅ **Этап 5.1**: DOM overlay — `src/ui/aim-overlay.ts`: `initAimOverlay(canvas?)`, `updateAimOverlay(reticleX_ndc, reticleY_ndc, leadX_ndc?, leadY_ndc?)`; SVG перекрестие и кружок упреждения поверх canvas; подключение в `main.ts`.
- ✅ **Этап 5.2**: Привязка размеров — в `updateAimOverlay` пиксели из NDC: `px = (ndcX*0.5+0.5)*width`, `py = (-ndcY*0.5+0.5)*height`; при инициализации с canvas сохраняется `viewportCanvas`, размеры берутся из canvas (или overlay), при resize пересчёт — каждый кадр.
- ✅ **Этап 6.1**: Математика перехвата (чистая) — `src/physics/intercept.ts`: `solveInterceptTime(rVec, vVec, projectileSpeed)` → минимальный положительный `t` или `null`; без аллокаций.
- ✅ **Этап 6.2**: Тестовая цель — `src/game/test-target.ts`: `createTestTarget(scene, options)` — сфера в сцене, `pos`/`vel` (переиспользуемые Vector3), `update(dt)` без аллокаций; подключена в `main.ts`, в loop вызывается с реальным dt.
- ✅ **Этап 6.3**: Проекция leadPoint на экран — в `main.ts` в loop: `rVec = target.pos - airplane.position`, `t = solveInterceptTime(rVec, target.vel, PROJECTILE_SPEED)`; при `t !== null`: `leadPointWorld = target.pos + target.vel*t`, `leadPointWorld.project(camera)`; кружок отображается в `updateAimOverlay(..., leadX_ndc, leadY_ndc)`; при точке сзади камеры (`z > 1`) кружок скрыт.
- ✅ **Этап 7.1**: Debug HUD — в `Debug.updateHUD` добавлен вывод: `yawErrorDeg`, `pitchErrorDeg`, `yawVel`, `reticleNdc`, `leadNdc` (если есть); `leadNdc` передаётся из `main` в `controls.update(_, debugOptions)`.
- ✅ **Этап 7.2**: Крайние случаи — тесты по правилам (zero speed, stall, inverted flight): `flight-model.test.ts` (нулевой ввод/скорости, maxRateChange, damping), `aim-controller.test.ts` (deadzone, большая ошибка/inverted, высокая угловая скорость/stall, clamp ±1), `intercept.test.ts` (zero speed снаряда/цели, нет решения, граничная геометрия). Vitest добавлен, `npm run test` / `npm run test:watch`. Ограничение «aim behind» (lz < 0): ошибки yaw/pitch насыщаются до ±120° в `controls.ts`, чтобы не было резких флипов.

## Чеклист по плану

### Этап 1 — Добавить ось yaw в модель (без mouse-aim)

- [x] **1.1 Расширить `AirplaneStats`** (`src/airplanes.ts`)
- [x] **1.2 Расширить flight-model** (`src/physics/flight-model.ts`)
- [x] **1.3 Поддержать yaw в `controls.update()`** (`src/controls.ts`)

### Этап 2 — Ввод мыши и состояние перекрестия

- [x] **2.1 Новый модуль ввода мыши**
- [x] **2.2 ReticleState**

### Этап 3 — AimRay и расчёт ошибок наведения

- [x] **3.1 Ray от камеры через перекрестие**
- [x] **3.2 Ошибки yaw/pitch в локальном базисе самолёта**

### Этап 4 — Spring–Damper контроллер

- [x] **4.1 Чистые функции контроллера**
- [x] **4.2 Параметры (дефолты)**
- [x] **4.3 Микширование с клавиатурой**
- [x] **4.4 Ограничители для «задержки»**

### Этап 5 — HUD перекрестия (overlay)

- [x] **5.1 DOM overlay**
- [x] **5.2 Привязка размеров**

### Этап 6 — Кружок упреждения v1

- [x] **6.1 Математика перехвата (чистая)** (`src/physics/intercept.ts`)
- [x] **6.2 Тестовая цель**
- [x] **6.3 Проекция leadPoint на экран**

### Этап 7 — Отладка, настройки, крайние случаи

- [x] **7.1 Debug HUD**
- [x] **7.2 Крайние случаи**

## Проверка в рантайме

- **Лог в консоль**: при открытии с `?log=1` в URL или при `sessionStorage.setItem('airblox_log','1')` раз в 500 ms в консоль выводятся `reticleNdc`, `aimErrorsDeg`, `leadNdc` для сверки сигналов.
- **HUD**: на экране отображаются `yawErrorDeg`, `pitchErrorDeg`, `yawVel`, `reticleNdc`, `leadNdc` (DevOverlay).
- **Тесты**: `npm run test` — 26 тестов (flight-model, aim-controller, intercept, flight-recorder с передачей leadNdc и снимками).

