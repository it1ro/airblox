/**
 * Модуль ввода мыши: накопление dx/dy от mousemove, API без аллокаций в hot path.
 * Подписка на элемент (например renderer.domElement), а не на window — проще управлять захватом.
 */

let dxAccum = 0;
let dyAccum = 0;
let bound = false;
let targetElement: HTMLElement | null = null;

function onMouseMove(e: MouseEvent) {
  dxAccum += e.movementX;
  dyAccum += e.movementY;
}

export interface MouseDeltas {
  dx: number;
  dy: number;
}

/**
 * Записывает накопленные дельты мыши в out и обнуляет накопление.
 * Без аллокаций: вызывающий передаёт объект для результата.
 */
export function getMouseDeltas(out: MouseDeltas): void {
  out.dx = dxAccum;
  out.dy = dyAccum;
  dxAccum = 0;
  dyAccum = 0;
}

/**
 * Подписаться на mousemove на заданном элементе (например renderer.domElement).
 * Повторный вызов с тем же или другим элементом переподписывает на новый элемент.
 * @returns функция очистки (unsubscribe)
 */
export function subscribe(domElement: HTMLElement): () => void {
  if (targetElement) {
    targetElement.removeEventListener("mousemove", onMouseMove);
  }
  targetElement = domElement;
  dxAccum = 0;
  dyAccum = 0;
  domElement.addEventListener("mousemove", onMouseMove);
  bound = true;

  return () => {
    if (targetElement) {
      targetElement.removeEventListener("mousemove", onMouseMove);
      targetElement = null;
    }
    bound = false;
    dxAccum = 0;
    dyAccum = 0;
  };
}

/**
 * Отписаться от mousemove и обнулить накопленные дельты.
 */
export function unsubscribe(): void {
  if (targetElement) {
    targetElement.removeEventListener("mousemove", onMouseMove);
    targetElement = null;
  }
  bound = false;
  dxAccum = 0;
  dyAccum = 0;
}
