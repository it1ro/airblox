/**
 * Отрисовка HUD: формирование текста из values и присвоение element.textContent.
 */

/**
 * Обновляет содержимое HUD-элемента: формирует текст из values (key: value построчно)
 * и присваивает element.textContent.
 */
export function updateHUD(
  element: HTMLElement | null,
  values: Record<string, string>
): void {
  if (!element) return;

  element.textContent = Object.entries(values)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}
