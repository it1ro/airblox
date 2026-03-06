/**
 * Flight Recorder — запись снимков состояния полёта с настраиваемой частотой.
 * Throttle по frequencyHz, кольцевой буфер, экспорт JSONL, API для агентов/скриптов.
 */

/** Позиция в 3D (числа для JSONL). */
export interface SnapshotPos {
  x: number;
  y: number;
  z: number;
}

/** Состояние самолёта в снимке. */
export interface SnapshotAirplane {
  pos: SnapshotPos;
  pitch: number;
  yaw: number;
  roll: number;
  pitchVelocity: number;
  rollVelocity: number;
  yawVelocity: number;
}

/** Ввод управления. */
export interface SnapshotControls {
  pitchInput: number;
  rollInput: number;
  yawInput: number;
}

/** Перекрестие в NDC. */
export interface SnapshotReticle {
  x_ndc: number;
  y_ndc: number;
}

/** Ошибки наведения (радианы). */
export interface SnapshotAim {
  yawErrorRad: number;
  pitchErrorRad: number;
}

/** Камера относительно самолёта (числа; null если камера не задана). */
export interface SnapshotCamera {
  distanceToCamera: number;
  relPitch: number;
  relYaw: number;
  relRoll: number;
}

/** Один снимок состояния полёта (все поля — числа для удобного JSONL). */
export interface FlightSnapshot {
  t: number;
  airplane: SnapshotAirplane;
  controls: SnapshotControls;
  reticle: SnapshotReticle;
  aim: SnapshotAim;
  camera: SnapshotCamera | null;
  altitude: number | null;
  /** Опционально: lead circle в NDC (из main loop). */
  leadNdc?: { x: number; y: number };
}

/** Запись-метка в потоке (для mark()). */
export interface FlightRecorderMark {
  t: number;
  _mark: string;
}

/** Тип элемента буфера: снимок или метка. */
type BufferEntry = FlightSnapshot | FlightRecorderMark;

const DEFAULT_FREQUENCY_HZ = 10;
const DEFAULT_SUBJECT = "session";
/** Максимум снимков в буфере (~10 мин при 10 Hz). */
const MAX_SNAPSHOTS = 6000;

/** Состояние рекордера (синглтон). */
let recording = false;
let frequencyHz = DEFAULT_FREQUENCY_HZ;
let subject = DEFAULT_SUBJECT;
/** Время начала текущей сессии записи (для имени файла). */
let sessionStartTimestamp = "";
/** Время последней записанной записи (мс). */
let lastSnapshotTime = 0;
/** Кольцевой буфер: массив записей, при переполнении удаляются старые. */
const buffer: BufferEntry[] = [];
/** Последний переданный снимок (для getLastSnapshot). */
let lastSnapshot: FlightSnapshot | null = null;

/**
 * Проверяет, прошло ли достаточно времени для следующей записи (throttle).
 */
function shouldRecord(nowMs: number): boolean {
  const intervalMs = 1000 / frequencyHz;
  return nowMs - lastSnapshotTime >= intervalMs;
}

/**
 * Добавляет запись в буфер с учётом лимита (кольцевой буфер).
 */
function pushToBuffer(entry: BufferEntry): void {
  buffer.push(entry);
  if (buffer.length > MAX_SNAPSHOTS) {
    buffer.shift();
  }
}

/**
 * Сериализует буфер в JSONL (одна строка JSON на запись).
 */
function bufferToJSONL(): string {
  return buffer.map((entry) => JSON.stringify(entry)).join("\n");
}

export const FlightRecorder = {
  /**
   * Начать запись. Сбрасывает буфер и время последнего снимка.
   * @param options.subject — имя сессии (по умолчанию "session")
   * @param options.frequencyHz — частота снимков в Hz (по умолчанию 10)
   */
  startRecording(options?: { subject?: string; frequencyHz?: number }): void {
    subject = options?.subject ?? DEFAULT_SUBJECT;
    frequencyHz = options?.frequencyHz ?? DEFAULT_FREQUENCY_HZ;
    sessionStartTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
    buffer.length = 0;
    lastSnapshotTime = 0;
    lastSnapshot = null;
    recording = true;
  },

  /** Остановить запись. Буфер не очищается — можно вызвать download/getRecordingBlob несколько раз. */
  stopRecording(): void {
    recording = false;
  },

  /** Записать один тик: при включённой записи и прошедшем throttle пушит снимок в буфер. */
  tick(snapshot: FlightSnapshot): void {
    if (!recording) return;
    const now = snapshot.t;
    if (!shouldRecord(now)) return;
    lastSnapshotTime = now;
    lastSnapshot = snapshot;
    pushToBuffer(snapshot);
  },

  /** Записать метку в поток (опционально). */
  mark(label: string): void {
    if (!recording) return;
    const t = typeof performance !== "undefined" ? performance.now() : Date.now();
    pushToBuffer({ t, _mark: label });
  },

  setFrequency(hz: number): void {
    frequencyHz = hz;
  },

  setSubject(name: string): void {
    subject = name;
  },

  isRecording(): boolean {
    return recording;
  },

  /** Последний переданный снимок или null. */
  getLastSnapshot(): FlightSnapshot | null {
    return lastSnapshot;
  },

  /** Blob с содержимым буфера в формате JSONL, или null если буфер пуст. */
  getRecordingBlob(): Blob | null {
    if (buffer.length === 0) return null;
    const text = bufferToJSONL();
    return new Blob([text], { type: "application/x-ndjson" });
  },

  /**
   * Скачать запись. Если filename не передан — используется flight-records/{subject}-{ISO-timestamp}.jsonl.
   */
  download(filename?: string): void {
    const blob = this.getRecordingBlob();
    if (!blob) return;
    const name =
      filename ?? `flight-records/${subject}-${sessionStartTimestamp}.jsonl`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
};
