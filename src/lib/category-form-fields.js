/**
 * Category-aware post-ad fields — only relevant inputs per selection.
 */

const FIELD_DEFS = {
  brand: { key: "brand", label: "Brand", placeholder: "e.g. Samsung, Sony" },
  model: { key: "model", label: "Model", placeholder: "e.g. Galaxy Buds 3" },
  year: { key: "year", label: "Year", placeholder: "e.g. 2024", type: "number" },
  ram: { key: "ram", label: "RAM", placeholder: "e.g. 8GB" },
  storage: { key: "storage", label: "Storage", placeholder: "e.g. 256GB" },
  color: { key: "color", label: "Color", placeholder: "e.g. Midnight Black" },
  warranty: { key: "warranty", label: "Warranty", placeholder: "e.g. 6 months official" },
  batteryHealth: { key: "batteryHealth", label: "Battery health", placeholder: "e.g. 92%" },
  screenSize: { key: "screenSize", label: "Screen size", placeholder: 'e.g. 6.7"' },
  connectivity: { key: "connectivity", label: "Connectivity", placeholder: "e.g. Bluetooth 5.3, ANC" },
  noiseCancellation: { key: "noiseCancellation", label: "ANC", placeholder: "Yes / No" },
  driverSize: { key: "driverSize", label: "Driver size", placeholder: "e.g. 10mm" },
  partNumber: { key: "partNumber", label: "Part number", placeholder: "OEM / compatible" },
  compatibility: { key: "compatibility", label: "Fits vehicle/bike", placeholder: "e.g. Honda Civic 2018" },
  size: { key: "size", label: "Size", placeholder: "e.g. Large / EU 42" },
  material: { key: "material", label: "Material", placeholder: "e.g. Leather" },
  licenseType: { key: "licenseType", label: "License type", placeholder: "e.g. Windows 11 Pro" },
  validity: { key: "validity", label: "Validity", placeholder: "e.g. Lifetime" },
  platform: { key: "platform", label: "Platform", placeholder: "e.g. Steam, PlayStation" },
  duration: { key: "duration", label: "Service duration", placeholder: "e.g. 3 days delivery" },
};

const MATRIX = {
  mobiles: {
    smartphones: ["brand", "model", "storage", "color", "batteryHealth", "warranty"],
    tablets: ["brand", "model", "storage", "color", "warranty"],
    "accessories-mobile": ["brand", "model", "color", "compatibility"],
    default: ["brand", "model", "color"],
  },
  laptops: {
    laptops: ["brand", "model", "ram", "storage", "year", "warranty"],
    desktops: ["brand", "model", "ram", "storage", "year"],
    "pc-parts": ["brand", "model", "compatibility"],
    default: ["brand", "model", "ram", "storage"],
  },
  gaming: {
    consoles: ["brand", "model", "storage", "warranty"],
    games: ["platform", "model"],
    "gaming-gear": ["brand", "model"],
    default: ["brand", "model"],
  },
  audio: {
    earbuds: ["brand", "model", "color", "connectivity", "noiseCancellation", "warranty"],
    headphones: ["brand", "model", "connectivity", "driverSize", "warranty"],
    speakers: ["brand", "model", "connectivity", "warranty"],
    default: ["brand", "model", "connectivity"],
  },
  wearables: {
    smartwatches: ["brand", "model", "color", "batteryHealth", "warranty"],
    "fitness-bands": ["brand", "model", "color", "warranty"],
    default: ["brand", "model", "color"],
  },
  cameras: {
    dslr: ["brand", "model", "year", "warranty"],
    "action-cam": ["brand", "model", "warranty"],
    drones: ["brand", "model", "warranty"],
    default: ["brand", "model"],
  },
  "tv-monitors": {
    "led-tv": ["brand", "model", "screenSize", "warranty"],
    monitors: ["brand", "model", "screenSize", "warranty"],
    default: ["brand", "model", "screenSize"],
  },
  appliances: {
    default: ["brand", "model", "warranty"],
  },
  furniture: {
    default: ["material", "color", "size"],
  },
  fashion: {
    default: ["brand", "size", "color"],
  },
  jewelry: {
    default: ["brand", "material", "size"],
  },
  "health-beauty": {
    default: ["brand", "model"],
  },
  "baby-kids": {
    default: ["brand", "model", "color"],
  },
  sports: {
    default: ["brand", "model", "size"],
  },
  books: {
    default: ["model"],
  },
  tools: {
    default: ["brand", "model", "warranty"],
  },
  "auto-parts": {
    default: ["brand", "partNumber", "compatibility"],
  },
  "bike-parts": {
    default: ["brand", "partNumber", "compatibility"],
  },
  music: {
    default: ["brand", "model", "color"],
  },
  pets: {
    default: ["brand", "model"],
  },
  office: {
    default: ["brand", "model", "warranty"],
  },
  digital: {
    default: ["platform", "licenseType", "validity"],
  },
  crafts: {
    default: ["material", "size"],
  },
  jobs: {
    freelance: ["duration", "platform"],
    "repair-services": ["duration", "compatibility"],
    default: ["duration"],
  },
};

export function getFieldsForCategory(categoryId, subcategoryId) {
  const cat = MATRIX[categoryId];
  if (!cat) return [];
  const keys = cat[subcategoryId] || cat.default || [];
  return keys.map((k) => FIELD_DEFS[k]).filter(Boolean);
}
