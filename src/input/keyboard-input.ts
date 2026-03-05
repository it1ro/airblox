/**
 * Модуль ввода с клавиатуры: подписка на keydown/keyup и доступ к множеству нажатых клавиш.
 */

const keys = new Set<string>();

type KeyListener = (key: string, down: boolean) => void;
let listener: KeyListener | null = null;

function onKeyDown(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  keys.add(key);
  listener?.(key, true);
}

function onKeyUp(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  keys.delete(key);
  listener?.(key, false);
}

/**
 * Возвращает текущее множество нажатых клавиш (в нижнем регистре).
 */
export function getKeys(): Set<string> {
  return keys;
}

/**
 * Подписаться на ввод: вешает keydown/keyup на window, опционально вызывает listener при нажатии/отпускании.
 */
export function subscribe(keyListener?: KeyListener): void {
  if (listener !== null) return; // уже подписаны
  listener = keyListener ?? null;
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
}

/**
 * Отписаться: снять слушатели с window.
 */
export function unsubscribe(): void {
  listener = null;
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  keys.clear();
}
