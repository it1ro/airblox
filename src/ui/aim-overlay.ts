/**
 * DOM overlay для перекрестия (прицела) и кружка упреждения.
 * Элементы позиционируются в пикселях из NDC [-1..1].
 * Без React, без аллокаций в update.
 */

let overlayRoot: HTMLDivElement | null = null;
let reticleEl: SVGSVGElement | null = null;
let leadCircleEl: SVGSVGElement | null = null;
/** Canvas (viewport рендерера) для привязки размеров: при resize пиксели пересчитываются из NDC по его ширине/высоте. */
let viewportCanvas: HTMLCanvasElement | null = null;

/** NDC → пиксели (привязка размеров 5.2): px = (ndcX*0.5+0.5)*width, py = (-ndcY*0.5+0.5)*height */
function ndcToPx(
  ndcX: number,
  ndcY: number,
  width: number,
  height: number,
  out: { x: number; y: number }
): void {
  out.x = (ndcX * 0.5 + 0.5) * width;
  out.y = (-ndcY * 0.5 + 0.5) * height;
}

/**
 * Создаёт overlay-контейнер поверх canvas: перекрестие и опционально кружок упреждения.
 * Если передан canvas, overlay вставляется в parent canvas после canvas (чтобы быть сверху).
 */
export function initAimOverlay(canvas?: HTMLCanvasElement): void {
  if (overlayRoot) return;

  const root = document.createElement("div");
  root.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    "width: 100%",
    "height: 100%",
    "pointer-events: none",
    "z-index: 1"
  ].join("; ");

  // Перекрестие — SVG плюс
  const reticle = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  reticle.setAttribute("viewBox", "-20 -20 40 40");
  reticle.setAttribute("width", "40");
  reticle.setAttribute("height", "40");
  reticle.style.cssText = [
    "position: absolute",
    "transform: translate(-50%, -50%)",
    "pointer-events: none"
  ].join("; ");
  reticle.innerHTML = [
    '<line x1="-15" y1="0" x2="15" y2="0" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>',
    '<line x1="0" y1="-15" x2="0" y2="15" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>',
    '<circle cx="0" cy="0" r="2" fill="rgba(255,255,255,0.9)"/>'
  ].join("");
  root.appendChild(reticle);

  // Кружок упреждения — SVG круг (изначально скрыт)
  const leadCircle = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  leadCircle.setAttribute("viewBox", "-25 -25 50 50");
  leadCircle.setAttribute("width", "50");
  leadCircle.setAttribute("height", "50");
  leadCircle.style.cssText = [
    "position: absolute",
    "transform: translate(-50%, -50%)",
    "pointer-events: none",
    "visibility: hidden"
  ].join("; ");
  leadCircle.innerHTML =
    '<circle cx="0" cy="0" r="20" fill="none" stroke="rgba(255,200,0,0.8)" stroke-width="2"/>';
  root.appendChild(leadCircle);

  if (canvas && canvas.parentNode) {
    canvas.parentNode.insertBefore(root, canvas.nextSibling);
    viewportCanvas = canvas;
  } else {
    document.body.appendChild(root);
  }

  overlayRoot = root;
  reticleEl = reticle;
  leadCircleEl = leadCircle;
}

const _px = { x: 0, y: 0 };

/**
 * Обновляет позиции перекрестия и (опционально) кружка упреждения из NDC.
 * Привязка размеров (5.2): при resize width/height берутся из viewport (canvas или overlay);
 * пиксели пересчитываются каждый кадр: px = (ndcX*0.5+0.5)*width, py = (-ndcY*0.5+0.5)*height.
 */
export function updateAimOverlay(
  reticleX_ndc: number,
  reticleY_ndc: number,
  leadX_ndc?: number,
  leadY_ndc?: number
): void {
  if (!overlayRoot || !reticleEl || !leadCircleEl) return;

  const c = viewportCanvas;
  const w = (c ? c.clientWidth : overlayRoot.clientWidth) || 1;
  const h = (c ? c.clientHeight : overlayRoot.clientHeight) || 1;

  ndcToPx(reticleX_ndc, reticleY_ndc, w, h, _px);
  reticleEl.style.left = `${_px.x}px`;
  reticleEl.style.top = `${_px.y}px`;

  if (leadX_ndc !== undefined && leadY_ndc !== undefined) {
    ndcToPx(leadX_ndc, leadY_ndc, w, h, _px);
    leadCircleEl.style.left = `${_px.x}px`;
    leadCircleEl.style.top = `${_px.y}px`;
    leadCircleEl.style.visibility = "visible";
  } else {
    leadCircleEl.style.visibility = "hidden";
  }
}
