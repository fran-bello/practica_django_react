/**
 * Utilidades de formato de fechas para la UI.
 */

/**
 * Formatea un valor de fecha para mostrar en español (dd/mm/yyyy).
 * @param {string|null|undefined} value - Fecha ISO o YYYY-MM-DD
 * @returns {string} Fecha formateada o "—" si no hay valor
 */
export function formatDate(value) {
  if (!value) return "—";
  const d = value.includes("T")
    ? new Date(value)
    : new Date(value + "T00:00:00");
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Convierte fecha ISO o string a YYYY-MM-DD para input type="date".
 * @param {string|null|undefined} value - Fecha ISO o YYYY-MM-DD
 * @returns {string} YYYY-MM-DD o cadena vacía
 */
export function toInputDate(value) {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 10) : value;
}
