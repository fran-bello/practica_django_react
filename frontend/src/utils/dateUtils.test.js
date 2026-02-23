/**
 * Pruebas unitarias para dateUtils.js
 *
 * Cubre las funciones de formato de fechas usadas en la UI (p. ej. TareasList):
 * - formatDate: muestra fechas en español (dd/mm/yyyy) o "—" si no hay valor.
 * - toInputDate: convierte a YYYY-MM-DD para inputs type="date" o "" si no hay valor.
 *
 * Ejecución:
 *   npm run test          — una vez
 *   npm run test:watch    — en modo watch
 *   (en Docker) docker compose exec frontend npm run test
 */

import { describe, it, expect } from "vitest";
import { formatDate, toInputDate } from "./dateUtils";

describe("dateUtils", () => {
  describe("formatDate", () => {
    it("formatea fecha ISO a dd/mm/yyyy en español", () => {
      // Locale es-ES con day/month "2-digit" → siempre dos dígitos
      expect(formatDate("2025-02-22T12:00:00")).toBe("22/02/2025");
      expect(formatDate("2024-12-01T00:00:00")).toBe("01/12/2024");
    });

    it("formatea YYYY-MM-DD (sin hora) correctamente", () => {
      expect(formatDate("2025-02-22")).toBe("22/02/2025");
    });

    it("devuelve '—' para valor nulo o vacío", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });
  });

  describe("toInputDate", () => {
    it("convierte ISO a YYYY-MM-DD", () => {
      expect(toInputDate("2025-02-22T14:30:00")).toBe("2025-02-22");
    });

    it("deja YYYY-MM-DD igual", () => {
      expect(toInputDate("2025-02-22")).toBe("2025-02-22");
    });

    it("devuelve cadena vacía para valor nulo o vacío", () => {
      expect(toInputDate(null)).toBe("");
      expect(toInputDate(undefined)).toBe("");
      expect(toInputDate("")).toBe("");
    });
  });
});
