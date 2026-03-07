// debug.ts — DevOverlay: HUD, toast, горячие клавиши F7/F8/F9 через FlightRecorder
// ============================================================================
import { updateHUD as renderHUD } from "./debug/hud";
import { FlightRecorder } from "./flight-recorder";

// ----------------------------------------------------------------------------
// DevOverlay: только HUD, toast и F7 (вкл/выкл записи), F8 (копирование), F9 (download).
// Логирование снимков — только через FlightRecorder.
// ============================================================================

let hudEl: HTMLDivElement | null = null;
let toastEl: HTMLDivElement | null = null;

function updateHudStyle(): void {
  if (!hudEl) return;
  hudEl.style.color = FlightRecorder.isRecording() ? "#0f0" : "#fff";
}

export const DevOverlay = {
  init() {
    if (hudEl) return;

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
    hudEl = hud;
    updateHudStyle();

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
    toastEl = toast;

    // === Hotkeys: F7 — запись вкл/выкл, F8 — копирование, F9 — download ===
    window.addEventListener("keydown", (e) => {
      if (e.key === "F7") {
        if (FlightRecorder.isRecording()) {
          FlightRecorder.stopRecording();
          DevOverlay.showToast("Recording OFF");
        } else {
          FlightRecorder.startRecording();
          DevOverlay.showToast("Recording ON");
        }
        updateHudStyle();
      }

      if (e.key === "F8") {
        const blob = FlightRecorder.getRecordingBlob();
        if (!blob) {
          DevOverlay.showToast("No recording to copy");
          return;
        }
        blob.text().then((text) => {
          navigator.clipboard.writeText(text);
          DevOverlay.showToast("Recording copied");
        });
      }

      if (e.key === "F9") {
        const blob = FlightRecorder.getRecordingBlob();
        if (!blob) {
          DevOverlay.showToast("No recording to download");
          return;
        }
        FlightRecorder.download();
        DevOverlay.showToast("Recording downloaded");
      }
    });
  },

  showToast(text: string) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.style.opacity = "1";
    setTimeout(() => {
      if (toastEl) toastEl.style.opacity = "0";
    }, 800);
  },

  updateHUD(values: Record<string, string>) {
    if (!hudEl) return;
    renderHUD(hudEl, values);
  }
};
