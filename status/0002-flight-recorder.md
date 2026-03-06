# Статус: Flight Recorder и очистка логов

Источник плана: `.cursor/plans/flight_recorder_и_очистка_логов_def95fef.plan.md`

## Подсистема Flight Recorder

- **Назначение**: запись снимков состояния полёта с настраиваемой частотой; единственный приёмник снимков вместо старого Debug.log; экспорт JSONL для анализа и агентов.
- **Частота по умолчанию**: 10 Hz (throttle внутри рекордера).
- **Формат снимка**: `FlightSnapshot` — `t`, `airplane` (pos, pitch, yaw, roll, угловые скорости), `controls`, `reticle`, `aim`, `camera`, `altitude`, опционально `leadNdc`. Все поля — числа (не строки).
- **Буфер**: кольцевой, макс. 6000 записей (~10 мин при 10 Hz). Поддержка меток `mark(label)` — запись `{ t, _mark: label }`.
- **Экспорт**: JSONL (одна строка JSON на запись); имя файла по умолчанию `flight-records/{subject}-{ISO-timestamp}.jsonl`.
- **Горячие клавиши** (после интеграции с DevOverlay): F7 — вкл/выкл записи, F8 — копирование/скачивание, F9 — download с именем по умолчанию.

## API

- `startRecording({ subject?, frequencyHz? })`, `stopRecording()`
- `setFrequency(hz)`, `setSubject(name)`
- `isRecording()`, `getLastSnapshot()`, `getRecordingBlob()`, `download(filename?)`
- `tick(snapshot)` — вызов из игрового цикла; при `!recording` без аллокаций
- `mark(label)` — опциональная метка в потоке

## Прогресс

- ✅ **Этап 1**: Реализован `src/flight-recorder.ts` (тип `FlightSnapshot`, буфер, throttle по frequencyHz, start/stop, getLastSnapshot, getRecordingBlob, download, mark).
- ⏳ **Этап 2**: В `controls.ts` — удалить все `Debug.log` и блок STATE; сборка снимка только при `FlightRecorder.isRecording()` и вызов `FlightRecorder.tick(snapshot)`; заменить Debug на DevOverlay для updateHUD; убрать Debug.init() из controls.
- ⏳ **Этап 3**: Упростить debug.ts до DevOverlay (HUD, toast, F7/F8/F9 через FlightRecorder).
- ⏳ **Этап 4**: В types удалить DebugLogEntry.
- ⏳ **Этап 5**: main.ts — вызов DevOverlay.init().
- ⏳ **Этап 6**: Статус в status/ обновлён (этот файл).
