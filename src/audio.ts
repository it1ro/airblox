export class AudioManager {
  static ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

  static engineGain = AudioManager.ctx.createGain();
  static windGain = AudioManager.ctx.createGain();
  static musicGain = AudioManager.ctx.createGain();

  static engineSource: AudioBufferSourceNode | null = null;
  static windSource: AudioBufferSourceNode | null = null;
  static musicSource: AudioBufferSourceNode | null = null;

  // Базовый тон двигателя (ниже 1.0, чтобы не звучал пискляво)
  static baseEnginePitch = 0.1;

  static async loadSound(url: string): Promise<AudioBuffer | null> {
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      return await AudioManager.ctx.decodeAudioData(arr);
    } catch (e) {
      console.error(`Ошибка загрузки звука ${url}:`, e);
      return null;
    }
  }

  static async init() {
    // Подключаем каналы к выходу
    AudioManager.engineGain.connect(AudioManager.ctx.destination);
    AudioManager.windGain.connect(AudioManager.ctx.destination);
    AudioManager.musicGain.connect(AudioManager.ctx.destination);

    // Начальные громкости
    AudioManager.engineGain.gain.value = 0.1;
    AudioManager.windGain.gain.value = 0.2;
    AudioManager.musicGain.gain.value = 0.15;

    // Загружаем звуки (при ошибке канал отключается, игра продолжает работать)
    const engine = await AudioManager.loadSound("/sounds/engine.wav");
    const wind = await AudioManager.loadSound("/sounds/wind.wav");
    const music = await AudioManager.loadSound("/sounds/music.ogg");

    // Двигатель
    if (engine) {
      AudioManager.engineSource = AudioManager.ctx.createBufferSource();
      AudioManager.engineSource.buffer = engine;
      AudioManager.engineSource.loop = true;
      AudioManager.engineSource.connect(AudioManager.engineGain);
      AudioManager.engineSource.playbackRate.value = AudioManager.baseEnginePitch;
      AudioManager.engineSource.start(0);
    } else {
      console.warn("Двигатель: звук не загружен, канал отключён");
    }

    // Ветер
    if (wind) {
      AudioManager.windSource = AudioManager.ctx.createBufferSource();
      AudioManager.windSource.buffer = wind;
      AudioManager.windSource.loop = true;
      AudioManager.windSource.connect(AudioManager.windGain);
      AudioManager.windSource.start(0);
    } else {
      console.warn("Ветер: звук не загружен, канал отключён");
    }

    // Музыка
    if (music) {
      AudioManager.musicSource = AudioManager.ctx.createBufferSource();
      AudioManager.musicSource.buffer = music;
      AudioManager.musicSource.loop = true;
      AudioManager.musicSource.connect(AudioManager.musicGain);
      AudioManager.musicSource.start(0);
    } else {
      console.warn("Музыка: звук не загружен, канал отключён");
    }
  }

  // RPM двигателя → pitch
  static setEngineRPM(rpm: number) {
    if (AudioManager.engineSource) {
      // rpm = 0..1
      // итоговый pitch = 0.75..1.15
      const pitch = AudioManager.baseEnginePitch + rpm * 0.4;
      AudioManager.engineSource.playbackRate.value = pitch;
    }
  }

  // Скорость → шум ветра
  static setWindIntensity(intensity: number) {
    AudioManager.windGain.gain.value = intensity;
  }
}

