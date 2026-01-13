// debug.ts
// ============================================================================
// DEBUG MODULE FOR AIRBLOX
// ----------------------------------------------------------------------------
// Contains:
//  - HUD overlay for live flight parameters
//  - structured logging of events (input, state, stabilization, etc.)
//  - log export to JSON (F9)
//  - log copy to clipboard (F8)
//  - toast notifications
// ============================================================================

export const Debug = {
  enabled: true,            // global switch for all debug features
  logs: [] as any[],        // ring buffer for log entries
  hud: null as HTMLDivElement | null,
  toast: null as HTMLDivElement | null,

  init() {
    if (!this.enabled) return;
    if (this.hud) return; // prevent double init

    // === HUD overlay ===
    // Shows key flight parameters:
    //  - angles (pitch/roll)
    //  - angular velocities
    //  - altitude above ground
    //  - distance to camera
    //  - relative orientation to camera
    const hud = document.createElement("div");
    hud.style.position = "fixed";
    hud.style.top = "10px";
    hud.style.left = "10px";
    hud.style.padding = "8px 12px";
    hud.style.background = "rgba(0, 0, 0, 0.5)";
    hud.style.color = "#0f0";
    hud.style.fontFamily = "monospace";
    hud.style.fontSize = "12px";
    hud.style.whiteSpace = "pre";
    hud.style.pointerEvents = "none";
    hud.style.zIndex = "9999";
    document.body.appendChild(hud);
    this.hud = hud;

    // === Toast notifications ===
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
      // F8 — copy log to clipboard
      if (e.key === "F8") {
        const text = JSON.stringify(this.logs, null, 2);
        navigator.clipboard.writeText(text);
        this.showToast("Log copied to clipboard");
      }

      // F9 — download JSON log file
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

  // Show short toast notification
  showToast(text: string) {
    if (!this.toast) return;
    this.toast.textContent = text;
    this.toast.style.opacity = "1";
    setTimeout(() => {
      if (this.toast) this.toast.style.opacity = "0";
    }, 800);
  },

  // Add entry to log
  // event — event name
  // data  — arbitrary payload (angles, velocities, inputs, etc.)
  log(event: string, data: any = {}) {
    if (!this.enabled) return;

    const entry = {
      time: performance.now(),
      event,
      ...data
    };

    this.logs.push(entry);
    if (this.logs.length > 300) this.logs.shift(); // ring buffer

    console.log("[DBG]", event, data);
  },

  // Update HUD content with key-value pairs
  updateHUD(values: Record<string, any>) {
    if (!this.enabled || !this.hud) return;

    this.hud.textContent = Object.entries(values)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }
};
