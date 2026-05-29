/**
 * Pakistan escrow-friendly categories — courier/parcel shippable items only.
 * No whole cars, bikes, or property. Auto/bike parts allowed.
 */

export const CATEGORY_TREE = [
  {
    id: "mobiles",
    name: "Mobiles & Tablets",
    subcategories: [
      { id: "smartphones", name: "Smartphones", subcategories: [{ id: "android", name: "Android" }, { id: "iphone", name: "iPhone" }] },
      { id: "tablets", name: "Tablets", subcategories: [{ id: "ipad", name: "iPad" }, { id: "android-tablet", name: "Android Tablet" }] },
      { id: "accessories-mobile", name: "Mobile Accessories", subcategories: [{ id: "cases", name: "Cases & Covers" }, { id: "chargers", name: "Chargers & Cables" }] },
    ],
  },
  {
    id: "laptops",
    name: "Laptops & PCs",
    subcategories: [
      { id: "laptops", name: "Laptops", subcategories: [{ id: "gaming", name: "Gaming" }, { id: "business", name: "Business" }, { id: "macbook", name: "MacBook" }] },
      { id: "desktops", name: "Desktop PCs", subcategories: [{ id: "prebuilt", name: "Pre-built" }, { id: "custom", name: "Custom Build" }] },
      { id: "pc-parts", name: "PC Parts", subcategories: [{ id: "gpu", name: "Graphics Card" }, { id: "ram-ssd", name: "RAM & SSD" }] },
    ],
  },
  {
    id: "gaming",
    name: "Gaming",
    subcategories: [
      { id: "consoles", name: "Consoles", subcategories: [{ id: "ps5", name: "PlayStation" }, { id: "xbox", name: "Xbox" }, { id: "nintendo", name: "Nintendo" }] },
      { id: "games", name: "Physical Games", subcategories: [{ id: "ps-games", name: "PlayStation" }, { id: "xbox-games", name: "Xbox" }] },
      { id: "gaming-gear", name: "Gaming Gear", subcategories: [{ id: "controllers", name: "Controllers" }, { id: "headsets-gaming", name: "Headsets" }] },
    ],
  },
  {
    id: "audio",
    name: "Audio & Earbuds",
    subcategories: [
      { id: "earbuds", name: "Earbuds & TWS", subcategories: [{ id: "apple-audio", name: "AirPods" }, { id: "samsung-audio", name: "Samsung" }, { id: "other-earbuds", name: "Other Brands" }] },
      { id: "headphones", name: "Headphones", subcategories: [{ id: "over-ear", name: "Over-ear" }, { id: "on-ear", name: "On-ear" }] },
      { id: "speakers", name: "Speakers", subcategories: [{ id: "bluetooth-speaker", name: "Bluetooth" }, { id: "soundbar", name: "Soundbar" }] },
    ],
  },
  {
    id: "wearables",
    name: "Wearables",
    subcategories: [
      { id: "smartwatches", name: "Smart Watches", subcategories: [{ id: "apple-watch", name: "Apple Watch" }, { id: "samsung-watch", name: "Galaxy Watch" }] },
      { id: "fitness-bands", name: "Fitness Bands", subcategories: [{ id: "mi-band", name: "Mi Band" }, { id: "other-band", name: "Other" }] },
    ],
  },
  {
    id: "cameras",
    name: "Cameras & Drones",
    subcategories: [
      { id: "dslr", name: "DSLR & Mirrorless", subcategories: [{ id: "canon", name: "Canon" }, { id: "sony-cam", name: "Sony" }] },
      { id: "action-cam", name: "Action Cameras", subcategories: [{ id: "gopro", name: "GoPro" }, { id: "dji-action", name: "DJI Action" }] },
      { id: "drones", name: "Drones", subcategories: [{ id: "dji-drone", name: "DJI" }, { id: "other-drone", name: "Other" }] },
    ],
  },
  {
    id: "tv-monitors",
    name: "TV & Monitors",
    subcategories: [
      { id: "led-tv", name: "LED / Smart TV", subcategories: [{ id: "32-43", name: "32–43 inch" }, { id: "50-plus", name: "50 inch+" }] },
      { id: "monitors", name: "Monitors", subcategories: [{ id: "gaming-monitor", name: "Gaming" }, { id: "office-monitor", name: "Office" }] },
    ],
  },
  {
    id: "appliances",
    name: "Home Appliances",
    subcategories: [
      { id: "ac-coolers", name: "AC & Coolers", subcategories: [{ id: "split-ac", name: "Split AC" }, { id: "portable-ac", name: "Portable" }] },
      { id: "kitchen-small", name: "Kitchen Small", subcategories: [{ id: "microwave", name: "Microwave" }, { id: "blender", name: "Blender / Juicer" }] },
      { id: "washing", name: "Washing Machines", subcategories: [{ id: "automatic", name: "Automatic" }, { id: "semi-auto", name: "Semi Auto" }] },
    ],
  },
  {
    id: "furniture",
    name: "Furniture & Decor",
    subcategories: [
      { id: "seating", name: "Sofa & Chairs", subcategories: [{ id: "sofa", name: "Sofa" }, { id: "office-chair", name: "Office Chair" }] },
      { id: "tables", name: "Tables & Storage", subcategories: [{ id: "dining", name: "Dining" }, { id: "wardrobe", name: "Wardrobe" }] },
      { id: "decor", name: "Decor", subcategories: [{ id: "lamps", name: "Lamps" }, { id: "rugs", name: "Rugs" }] },
    ],
  },
  {
    id: "fashion",
    name: "Fashion",
    subcategories: [
      { id: "mens-wear", name: "Men's Wear", subcategories: [{ id: "mens-shoes", name: "Shoes" }, { id: "mens-watches-fashion", name: "Watches" }] },
      { id: "womens-wear", name: "Women's Wear", subcategories: [{ id: "womens-bags", name: "Bags" }, { id: "womens-shoes", name: "Shoes" }] },
      { id: "unisex", name: "Unisex", subcategories: [{ id: "sunglasses", name: "Sunglasses" }, { id: "belts", name: "Belts" }] },
    ],
  },
  {
    id: "jewelry",
    name: "Watches & Jewelry",
    subcategories: [
      { id: "watches", name: "Watches", subcategories: [{ id: "luxury-watch", name: "Luxury" }, { id: "casual-watch", name: "Casual" }] },
      { id: "jewelry-items", name: "Jewelry", subcategories: [{ id: "gold", name: "Gold" }, { id: "silver", name: "Silver / Fashion" }] },
    ],
  },
  {
    id: "health-beauty",
    name: "Health & Beauty",
    subcategories: [
      { id: "skincare", name: "Skincare", subcategories: [{ id: "serums", name: "Serums" }, { id: "kits", name: "Kits" }] },
      { id: "haircare", name: "Hair Care Devices", subcategories: [{ id: "dryers", name: "Dryers" }, { id: "trimmers", name: "Trimmers" }] },
    ],
  },
  {
    id: "baby-kids",
    name: "Baby & Kids",
    subcategories: [
      { id: "toys", name: "Toys", subcategories: [{ id: "educational", name: "Educational" }, { id: "remote-toys", name: "Remote Control" }] },
      { id: "baby-gear", name: "Baby Gear", subcategories: [{ id: "strollers", name: "Strollers" }, { id: "car-seats", name: "Car Seats" }] },
    ],
  },
  {
    id: "sports",
    name: "Sports & Fitness",
    subcategories: [
      { id: "gym", name: "Gym Equipment", subcategories: [{ id: "dumbbells", name: "Weights" }, { id: "treadmill", name: "Cardio" }] },
      { id: "outdoor", name: "Outdoor Sports", subcategories: [{ id: "cricket", name: "Cricket" }, { id: "football", name: "Football" }] },
    ],
  },
  {
    id: "books",
    name: "Books & Stationery",
    subcategories: [
      { id: "books", name: "Books", subcategories: [{ id: "academic", name: "Academic" }, { id: "novels", name: "Novels" }] },
      { id: "stationery", name: "Stationery", subcategories: [{ id: "calculators", name: "Calculators" }, { id: "art-supplies", name: "Art Supplies" }] },
    ],
  },
  {
    id: "tools",
    name: "Tools & Hardware",
    subcategories: [
      { id: "power-tools", name: "Power Tools", subcategories: [{ id: "drills", name: "Drills" }, { id: "grinders", name: "Grinders" }] },
      { id: "hand-tools", name: "Hand Tools", subcategories: [{ id: "tool-kits", name: "Tool Kits" }] },
    ],
  },
  {
    id: "auto-parts",
    name: "Auto Parts",
    subcategories: [
      { id: "engine-parts", name: "Engine Parts", subcategories: [{ id: "filters", name: "Filters" }, { id: "spark-plugs", name: "Spark Plugs" }] },
      { id: "body-parts", name: "Body & Lights", subcategories: [{ id: "headlights", name: "Headlights" }, { id: "mirrors", name: "Mirrors" }] },
      { id: "tyres-rims", name: "Tyres & Rims", subcategories: [{ id: "tyres", name: "Tyres" }, { id: "rims", name: "Rims" }] },
    ],
  },
  {
    id: "bike-parts",
    name: "Bike Parts",
    subcategories: [
      { id: "bike-accessories", name: "Accessories", subcategories: [{ id: "helmets", name: "Helmets" }, { id: "bike-locks", name: "Locks" }] },
      { id: "bike-mechanical", name: "Mechanical Parts", subcategories: [{ id: "chains", name: "Chains & Sprockets" }, { id: "brakes-bike", name: "Brakes" }] },
    ],
  },
  {
    id: "music",
    name: "Musical Instruments",
    subcategories: [
      { id: "guitars", name: "Guitars", subcategories: [{ id: "acoustic", name: "Acoustic" }, { id: "electric-guitar", name: "Electric" }] },
      { id: "keyboards", name: "Keyboards & Pianos", subcategories: [{ id: "digital-piano", name: "Digital Piano" }] },
    ],
  },
  {
    id: "pets",
    name: "Pet Supplies",
    subcategories: [
      { id: "pet-food", name: "Food & Treats", subcategories: [{ id: "dog", name: "Dog" }, { id: "cat", name: "Cat" }] },
      { id: "pet-accessories", name: "Accessories", subcategories: [{ id: "collars", name: "Collars & Leashes" }] },
    ],
  },
  {
    id: "office",
    name: "Office & Business",
    subcategories: [
      { id: "printers", name: "Printers & Scanners", subcategories: [{ id: "inkjet", name: "Inkjet" }, { id: "laser", name: "Laser" }] },
      { id: "office-furniture", name: "Office Furniture", subcategories: [{ id: "desks", name: "Desks" }] },
    ],
  },
  {
    id: "digital",
    name: "Digital & Gift Cards",
    subcategories: [
      { id: "gift-cards", name: "Gift Cards", subcategories: [{ id: "gaming-cards", name: "Gaming" }, { id: "shopping-cards", name: "Shopping" }] },
      { id: "software-keys", name: "Software Keys", subcategories: [{ id: "windows", name: "Windows" }, { id: "antivirus", name: "Antivirus" }] },
    ],
  },
  {
    id: "crafts",
    name: "Handmade & Crafts",
    subcategories: [
      { id: "handmade", name: "Handmade Items", subcategories: [{ id: "art", name: "Art" }, { id: "custom-gifts", name: "Custom Gifts" }] },
    ],
  },
  {
    id: "jobs",
    name: "Jobs & Services",
    requiresApproval: true,
    subcategories: [
      { id: "freelance", name: "Freelance", subcategories: [{ id: "design", name: "Design" }, { id: "dev", name: "Development" }] },
      { id: "repair-services", name: "Repair Services", subcategories: [{ id: "mobile-repair", name: "Mobile Repair" }, { id: "laptop-repair", name: "Laptop Repair" }] },
    ],
  },
];

export function getCategoryPathLabels(categoryId, subcategoryId, leafId) {
  for (const cat of CATEGORY_TREE) {
    if (cat.id !== categoryId) continue;
    for (const sub of cat.subcategories || []) {
      if (sub.id !== subcategoryId) continue;
      for (const leaf of sub.subcategories || []) {
        if (leaf.id === leafId) return [cat.name, sub.name, leaf.name];
      }
      return [cat.name, sub.name];
    }
    return [cat.name];
  }
  return [];
}

export function findCategoryById(categoryId) {
  return CATEGORY_TREE.find((c) => c.id === categoryId) ?? null;
}

export function findSubcategory(categoryId, subcategoryId) {
  const cat = findCategoryById(categoryId);
  return cat?.subcategories?.find((s) => s.id === subcategoryId) ?? null;
}

export function categoryRequiresApproval(categoryId) {
  const cat = findCategoryById(categoryId);
  return Boolean(cat?.requiresApproval);
}

export const CATEGORY_ICONS = {
  mobiles: "smartphone",
  laptops: "laptop",
  gaming: "gamepad",
  audio: "headphones",
  wearables: "watch",
  cameras: "camera",
  "tv-monitors": "monitor",
  appliances: "refrigerator",
  furniture: "sofa",
  fashion: "shirt",
  jewelry: "gem",
  "health-beauty": "heart",
  "baby-kids": "baby",
  sports: "dumbbell",
  books: "book",
  tools: "wrench",
  "auto-parts": "cog",
  "bike-parts": "bike",
  music: "music",
  pets: "paw",
  office: "briefcase",
  digital: "credit-card",
  crafts: "palette",
  jobs: "briefcase",
};

export function getCategoryNavLinks() {
  return CATEGORY_TREE.map((c) => ({ label: c.name, href: `/category/${c.id}` }));
}

export function getFooterSubLinks() {
  const links = [];
  for (const cat of CATEGORY_TREE.slice(0, 8)) {
    links.push({ label: cat.name, href: `/category/${cat.id}` });
  }
  return links;
}

/** Flat list for searchable dropdowns */
export function flattenCategories() {
  const items = [];
  for (const cat of CATEGORY_TREE) {
    items.push({ id: cat.id, label: cat.name, level: 0, href: `/category/${cat.id}` });
    for (const sub of cat.subcategories || []) {
      items.push({
        id: `${cat.id}/${sub.id}`,
        label: `${cat.name} › ${sub.name}`,
        level: 1,
        href: `/category/${cat.id}?sub=${sub.id}`,
      });
    }
  }
  return items;
}
