/**
 * Mappatura alimenti → emoji.
 * Port da Python: food_emoji.py
 */

const FOOD_EMOJI_MAP: Record<string, string> = {
  // ALCOLICI
  "birra": "🍺", "birra rossa": "🍺", "limoncello": "🍋",
  "spritz": "🍹", "vino bianco": "🥂", "vino rosso": "🍷",
  "vodka": "🥃", "whisky": "🥃",
  // CARNE
  "agnello": "🐑", "anatra": "🦆", "bresaola": "🥩",
  "cervo": "🦌", "coniglio": "🐇", "coscia di pollo": "🍗",
  "costina di maiale": "🥩", "lardo": "🥓", "maiale filetto": "🥩",
  "manzo macinato": "🥩", "manzo magro": "🥩", "petto di pollo": "🍗",
  "petto di tacchino": "🦃", "prosciutto cotto": "🍖",
  "prosciutto crudo": "🍖", "prosciutto crudo magro": "🍖",
  "salame": "🥩", "salsiccia": "🌭", "speck": "🥩",
  "tacchino": "🦃", "vitello": "🥩", "wurstel": "🌭",
  // CEREALI
  "amaranto": "🌾", "avena": "🌾", "burghul": "🌾", "cous cous": "🌾",
  "farina 00": "🌾", "farina di mais": "🌽", "farina di mandorle": "🌰",
  "farina di riso": "🍚", "farina integrale": "🌾", "farro": "🌾",
  "fiocchi d'avena": "🌾", "grano saraceno": "🌾", "miglio": "🌾",
  "orzo": "🌾", "quinoa": "🌾", "riso": "🍚", "segale": "🌾", "sorgo": "🌾",
  // CEREALI ELABORATI
  "brioches": "🥐", "gallette": "🍘", "gallette di riso": "🍘",
  "gnocchi di patate": "🥔", "muesli e simili": "🥣", "pancacke": "🥞",
  "pane": "🍞", "pasta": "🍝", "pasta integrale": "🍝", "piadina": "🫓",
  "porridge": "🥣", "tortellini": "🍝", "wasa": "🍞",
  // FRUTTA
  "albicocche": "🍑", "ananas": "🍍", "anguria": "🍉",
  "arancia": "🍊", "avocado": "🥑", "banana": "🍌",
  "castagne arrosto": "🌰", "ciliegie": "🍒", "cocco": "🥥",
  "fragole": "🍓", "kiwi": "🥝", "lamponi": "🍓",
  "limone": "🍋", "mandarini": "🍊", "mango": "🥭",
  "mela": "🍎", "melone": "🍈", "mirtilli": "🫐",
  "more": "🫐", "pera": "🍐", "pesca": "🍑",
  "pompelmo": "🍊", "prugne": "🍑", "uva": "🍇",
  // FRUTTA SECCA
  "anacardi": "🥜", "arachidi": "🥜", "castagne": "🌰",
  "mandorle": "🥜", "nocciole": "🌰", "noci": "🌰",
  "pinoli": "🌲", "pistacchi": "🥜",
  // LATTICINI
  "burro": "🧈", "emmental": "🧀", "feta": "🧀",
  "fiocchi di latte": "🥛", "grana": "🧀", "kefir": "🥛",
  "latte intero": "🥛", "latte scremato": "🥛", "latte soia": "🥛",
  "mozzarella": "🧀", "ricotta": "🧀", "skyr": "🥛",
  "yogurt": "🥛", "yogurt greco": "🥛",
  // LEGUMI
  "ceci": "🫘", "edamame": "🫛", "fagioli": "🫘",
  "lenticchie": "🫘", "piselli": "🫛", "soia": "🫘", "tofu": "🫘",
  // OLI
  "cioccolato fondente 70% +": "🍫", "miele": "🍯",
  "olio evo/ olio di cocco": "🫒",
  // PESCE
  "branzino": "🐟", "calamari": "🦑", "gamberi": "🦐",
  "orata": "🐟", "polpo": "🐙", "salmone": "🐟",
  "salmone affumicato": "🐟", "sgombro": "🐟", "sogliola": "🐟",
  "tonno": "🐟", "trota": "🐟", "vongole": "🦪",
  // UOVA
  "uova": "🥚", "albumi": "🥚",
  // VERDURA
  "aglio": "🧄", "asparagi": "🌿", "broccoli": "🥦",
  "carciofi": "🌿", "carote": "🥕", "cavolfiore": "🥦",
  "cetrioli": "🥒", "cipolle": "🧅", "fagiolini": "🫛",
  "finocchi": "🌿", "funghi": "🍄", "lattuga": "🥬",
  "mais": "🌽", "melanzane": "🍆", "patate": "🥔",
  "peperoni": "🫑", "pomodori": "🍅", "spinaci": "🥬",
  "zucca": "🎃", "zucchine": "🥒",
};

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  ALCOLICI: "🍷",
  CARNE: "🥩",
  CEREALI: "🌾",
  CEREALI_ELABORATI: "🍞",
  FRUTTA: "🍎",
  FRUTTA_ESSICCATA: "🍇",
  FRUTTA_SECCA: "🥜",
  JUNK_FOOD: "🍔",
  LATTICINI_E_SOSTITUTI: "🧀",
  LEGUMI_E_PROTEINE_VEGETALI: "🫘",
  OLI_BURRO_E_CIOCCOLATA: "🫒",
  PESCE: "🐟",
  UOVA_E_ALBUMI: "🥚",
  VERDURA: "🥦",
  ALTRO: "🍽️",
};

export function getFoodEmoji(name: string, category?: string | null): string {
  const key = (name || "").toLowerCase().trim();
  const emoji = FOOD_EMOJI_MAP[key];
  if (emoji) return emoji;

  if (category) {
    const catEmoji = CATEGORY_EMOJI_MAP[category.toUpperCase().trim()];
    if (catEmoji) return catEmoji;
  }

  return "🍽️";
}

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI_MAP[category] ?? "🍽️";
}
