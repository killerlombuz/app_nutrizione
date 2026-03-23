/**
 * Palette colori per report PDF nutrizionale.
 * Verde salvia / acquamarina / arancione caldo.
 */

export const PDF_COLORS = {
  primary: '#6B8F71',       // Verde salvia
  secondary: '#73BAAD',     // Acquamarina
  accent: '#D9896C',        // Arancione caldo
  dark: '#383C3F',          // Grigio antracite
  text: '#333333',          // Testo principale
  muted: '#808080',         // Testo secondario
  light: '#F5F6F7',         // Sfondo chiaro
  white: '#FFFFFF',
  tableHeader: '#6B8F71',   // Header tabelle (= primary)
  tableAlt: '#F2F7F2',      // Riga alternata verde chiaro
  border: '#D9D9D9',        // Bordi tabelle
  success: '#4DB366',
  warning: '#E6B333',
  danger: '#CC4D4D',
} as const;
