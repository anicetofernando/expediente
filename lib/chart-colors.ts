// Cores para visualização de dados.
// Paleta categórica validada (CVD-safe) para séries múltiplas sem significado semântico (ex: por tipo de documento).
export const CHART_CATEGORICAL = [
  "#2a78d6", // azul
  "#eb6834", // laranja
  "#1baf7a", // verde-água
  "#eda100", // amarelo
  "#e87ba4", // magenta
  "#008300", // verde
  "#4a3aa7", // violeta
  "#e34948", // vermelho
];

// Cores semânticas alinhadas ao sistema de estados (usar sempre com rótulo/legenda, nunca só cor).
export const CHART_STATUS = {
  navy: "#2c4160",
  info: "#3164ae",
  success: "#31834f",
  amber: "#bb7a18",
  crimson: "#a52a37",
  graphite: "#98a1ac",
};

// Rampa sequencial azul (100 → 700) para magnitude contínua.
export const CHART_SEQUENTIAL_BLUE = [
  "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b",
];

export const CHART_GRID = "#e5e8eb"; // graphite-150
export const CHART_AXIS = "#c0c6cd"; // graphite-300
export const CHART_MUTED_TEXT = "#727d89"; // graphite-500
