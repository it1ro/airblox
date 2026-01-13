// debug.ts
// ============================================================================
// DEBUG MODULE FOR AIRBLOX
// ----------------------------------------------------------------------------
// Features:
//  - HUD overlay for live flight parameters
//  - structured logging with categories
//  - logging presets (minimal, stabilizationDebug, full)
//  - logging ON/OFF toggle (F7)
//  - log copy to clipboard (F8)
//  - log export to JSON (F9)
//  - HUD color changes depending on logging state
//  - toast notifications
// ============================================================================

export const Debug = {
  enabled: true,             // global switch for debug system
  loggingEnabled: true,      // controls whether logs are recorded
  logs: [] as any[],         // ring buffer
  hud: null as HTMLDivElement | null,
  toast: null as HTMLDivElement | null,

  // Logging categories
  logConfig: {
    input: true,
    stabilization: true,
    anomalies: true,
    damping: true,
    zeroCross: true,
    altitude: true,
    camera: true,
    stateSnapshot: true
  } as Record<string, boolean>,

  // Presets
  presets: {
    minimal: {
      input: false,
      stabilization: false,
      anomalies: false,
      damping: false,
      zeroCross: false,
      altitude: true,
      camera: false,
      stateSnapshot: true
    },
    stabilizationDebug: {
      input: true,
      stabilization: true,
      anomalies: true,
      damping: true,
      zeroCross: true,
      altitude: false,
      camera: false,
      stateSnapshot: false
    },
    full: {
      input: true,
      stabilization: true,
      anomalies: true,
      damping: true,
      zeroCross: true,
      altitude: true,
      camera: true,
      stateSnapshot: true
    }
  },

  // Apply preset
  applyPreset(name: string) {
    const preset = this.presets[name];
    if (!preset) {
      this.showToast(`Unknown preset: ${name}`);
      return;
    }
    this.logConfig = { ...preset };
    this.showToast(`Preset: ${name}`);
  },

  // HUD color depending on logging state
  updateHudStyle() {
    if (!this.hud) return;
    this.hud.style.color = this.loggingEnabled ? "#0f0" : "#fff";
  },

  init() {
    if (!this.enabled) return;
    if (this.hud) return;

    // === HUD ===
    const hud = document.createElement("div");
    hud.style.position = "fixed";
    hud.style.top = "10px";
    hud.style.left = "10px";
    hud.style.padding = "8px 12px";
    hud.style.background = "rgba(0, 0, 0, 0.5)";
    hud.style.fontFamily = "monospace";
    hud.style.fontSize = "12px";
    hud.style.whiteSpace = "pre";
    hud.style.pointerEvents = "none";
    hud.style.zIndex = "9999";
    document.body.appendChild(hud);
    this.hud = hud;
    this.updateHudStyle();

    // === Toast ===
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.padding = "8px 14px";
    toast.style.background = "rgba(0,0,0,0.7)";
    toast.style.color = "#0f0";
    toast.style.fontFamily = "monospace";
    toast.style.fontSize = "14px";
    toast.style.borderRadius = "6px";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.25s";
    toast.style.pointerEvents = "none";
    toast.style.zIndex = "10001";
    document.body.appendChild(toast);
    this.toast = toast;

    // === Hotkeys ===
    window.addEventListener("keydown", e => {
      // Toggle logging
      if (e.key === "F7") {
        this.loggingEnabled = !this.loggingEnabled;
        this.updateHudStyle();
        this.showToast(this.loggingEnabled ? "Logging ON" : "Logging OFF");
      }

      // Presets
      if (e.key === "F5") this.applyPreset("minimal");
      if (e.key === "F6") this.applyPreset("stabilizationDebug");
      if (e.key === "F10") this.applyPreset("full");

      // Copy log
      if (e.key === "F8") {
        const text = JSON.stringify(this.logs, null, 2);
        navigator.clipboard.writeText(text);
        this.showToast("Log copied");
      }

      // Export JSON
      if (e.key === "F9") {
        const blob = new Blob(
          [JSON.stringify(this.logs, null, 2)],
          { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "airblox-debug-log.json";
        a.click();
      }
    });
  },

  showToast(text: string) {
    if (!this.toast) return;
    this.toast.textContent = text;
    this.toast.style.opacity = "1";
    setTimeout(() => {
      if (this.toast) this.toast.style.opacity = "0";
    }, 800);
  },

  // Main logging function
  log(type: string, event: string, data: any = {}) {
    if (!this.enabled) return;
    if (!this.loggingEnabled) return;
    if (!this.logConfig[type]) return;

    const entry = {
      time: performance.now(),
      type,
      event,
      ...data
    };

    this.logs.push(entry);
    if (this.logs.length > 3000) this.logs.shift();

    console.log("[DBG]", type, event, data);
  },

  updateHUD(values: Record<string, any>) {
    if (!this.enabled || !this.hud) return;

    this.hud.textContent = Object.entries(values)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }
};
