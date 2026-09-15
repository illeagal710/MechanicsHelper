const GENERIC = [
  "Base",
  "I4",
  "I4 Turbo",
  "V6",
  "V8",
  "Hybrid",
  "Plug-in Hybrid",
  "Electric",
  "Diesel",
  "AWD / 4WD",
  "Other",
];

const MAKE_DEFAULTS: Record<string, string[]> = {
  Acura: ["Base", "Technology", "A-Spec", "Advance", "Type S", "2.0T", "3.5 V6", "Hybrid", "SH-AWD", "Other"],
  "Alfa Romeo": ["Sprint", "Ti", "Veloce", "Quadrifoglio", "2.0T", "2.9 V6", "AWD", "Other"],
  Audi: ["Premium", "Premium Plus", "Prestige", "S line", "2.0T", "3.0T", "e-tron", "Quattro", "Other"],
  BMW: ["sDrive", "xDrive", "M Sport", "M", "2.0T", "3.0T", "Hybrid", "Electric", "Other"],
  Buick: ["Preferred", "Essence", "Avenir", "Sport Touring", "1.3T", "2.0T", "3.6 V6", "AWD", "Other"],
  Cadillac: ["Luxury", "Premium Luxury", "Sport", "V-Series", "2.0T", "3.6 V6", "6.2 V8", "Electric", "AWD", "Other"],
  Chevrolet: ["WT", "LS", "LT", "RST", "Z71", "Premier", "High Country", "SS", "2.5 I4", "2.7T", "3.6 V6", "5.3 V8", "6.2 V8", "Duramax", "Electric", "4WD", "Other"],
  Chrysler: ["Touring", "Limited", "S", "3.6 V6", "Hybrid", "AWD", "Other"],
  Dodge: ["SXT", "GT", "R/T", "Scat Pack", "SRT", "2.0T", "3.6 V6", "5.7 V8", "6.4 V8", "Hellcat", "AWD", "Other"],
  Fiat: ["Pop", "Lounge", "Trekking", "Abarth", "1.4", "Electric", "Other"],
  Ford: ["XL", "XLT", "STX", "Lariat", "King Ranch", "Platinum", "Limited", "ST", "RS", "2.0T", "2.3T", "2.7T", "3.5 V6", "3.5 EcoBoost", "5.0 V8", "Power Stroke", "Hybrid", "Electric", "4WD", "Other"],
  Genesis: ["Standard", "Select", "Advanced", "Sport Prestige", "2.5T", "3.5T", "Electric", "AWD", "Other"],
  GMC: ["SLE", "Elevation", "SLT", "AT4", "Denali", "2.7T", "3.0 diesel", "5.3 V8", "6.2 V8", "Electric", "4WD", "Other"],
  Honda: ["LX", "Sport", "EX", "EX-L", "Touring", "TrailSport", "1.5T", "2.0 I4", "2.0T", "3.5 V6", "Hybrid", "AWD", "Other"],
  Hummer: ["Base", "Adventure", "Omega", "6.0 V8", "Diesel", "Other"],
  Hyundai: ["SE", "SEL", "Limited", "N Line", "N", "2.0 I4", "1.6T", "2.5 I4", "2.5T", "Hybrid", "Electric", "AWD", "Other"],
  Infiniti: ["Pure", "Luxe", "Sport", "Sensory", "2.0T", "3.0T", "3.5 V6", "5.6 V8", "AWD", "Other"],
  Isuzu: ["S", "LS", "2.2 I4", "3.5 V6", "Diesel", "4WD", "Other"],
  Jaguar: ["P250", "P340", "P400", "P300e", "R-Dynamic", "SVR", "AWD", "Other"],
  Jeep: ["Sport", "Sport S", "Willys", "Latitude", "Limited", "Trailhawk", "Overland", "Summit", "Rubicon", "392", "2.0T", "3.6 V6", "6.4 V8", "4xe Hybrid", "4WD", "Other"],
  Kia: ["LX", "S", "EX", "EX-L", "SX", "SX Prestige", "GT", "GT-Line", "1.6T", "2.5 I4", "2.5T", "Hybrid", "Electric", "AWD", "Other"],
  "Land Rover": ["S", "SE", "HSE", "Autobiography", "SVR", "P300", "P400", "P440e", "Diesel", "AWD", "Other"],
  Lexus: ["Premium", "Luxury", "F Sport", "Ultra Luxury", "2.0T", "2.4T", "3.5 V6", "Hybrid", "AWD", "Other"],
  Lincoln: ["Standard", "Reserve", "Black Label", "2.0T", "3.0T", "3.5 V6", "Hybrid", "AWD", "Other"],
  Lucid: ["Pure", "Touring", "Grand Touring", "Sapphire", "Electric", "AWD", "Other"],
  Mazda: ["S", "Select", "Preferred", "Premium", "Carbon", "Turbo", "2.0 I4", "2.5 I4", "2.5T", "AWD", "Other"],
  "Mercedes-Benz": ["Base", "AMG Line", "AMG", "4MATIC", "2.0T", "3.0 I6", "4.0 V8", "Electric", "Diesel", "Other"],
  Mercury: ["Base", "Premier", "3.0 V6", "AWD", "Other"],
  Mini: ["Classic", "Signature", "Iconic", "S", "JCW", "2.0T", "Electric", "AWD", "Other"],
  Mitsubishi: ["ES", "LE", "SE", "SEL", "GT", "2.0 I4", "2.4 I4", "2.5 I4", "PHEV", "4WD", "Other"],
  Nissan: ["S", "SV", "SV Plus", "SL", "SR", "Platinum", "Pro-4X", "2.0 I4", "2.5 I4", "3.5 V6", "5.6 V8", "Electric", "4WD", "Other"],
  Polestar: ["Standard", "Long Range", "Performance", "Electric", "AWD", "Other"],
  Pontiac: ["Base", "GT", "GXP", "2.4 I4", "3.6 V6", "5.7 V8", "Other"],
  Porsche: ["Base", "S", "GTS", "Turbo", "GT3", "2.0T", "2.9T", "3.0T", "4.0", "Electric", "Other"],
  Ram: ["Tradesman", "Big Horn", "Rebel", "Laramie", "Limited", "TRX", "3.6 V6", "5.7 V8", "6.4 V8", "6.7 Cummins", "Electric", "4WD", "Other"],
  Rivian: ["Dual Motor", "Tri Motor", "Quad Motor", "Adventure", "Launch", "Electric", "Other"],
  Saturn: ["Base", "XE", "XR", "2.2 I4", "3.5 V6", "Other"],
  Scion: ["Base", "RS", "Release Series", "2.4 I4", "2.0 I4", "Other"],
  Subaru: ["Base", "Premium", "Sport", "Limited", "Touring", "Wilderness", "2.0 I4", "2.4 I4", "2.4T", "Hybrid", "AWD", "Other"],
  Suzuki: ["Base", "Premium", "2.0 I4", "2.7 V6", "4WD", "Other"],
  Tesla: ["Rear-Wheel Drive", "Long Range", "Performance", "Plaid", "Electric", "Other"],
  Toyota: ["SR", "LE", "XLE", "SE", "XSE", "Limited", "Platinum", "TRD", "TRD Off-Road", "TRD Pro", "Nightshade", "2.0 I4", "2.4 I4", "2.5 I4", "3.5 V6", "Hybrid", "Prime", "4WD", "Other"],
  VinFast: ["City", "Plus", "Eco", "Plus AWD", "Electric", "Other"],
  Volkswagen: ["S", "SE", "SEL", "SEL Premium", "R-Line", "GLI", "GTI", "R", "1.4T", "1.5T", "2.0T", "3.6 V6", "Electric", "4MOTION", "Other"],
  Volvo: ["Core", "Plus", "Ultimate", "R-Design", "Inscription", "B5", "B6", "T8", "Electric", "AWD", "Other"],
};

const MODEL_TRIMS: Record<string, string[]> = {
  "honda|civic": ["LX", "Sport", "EX", "EX-L", "Touring", "Si", "Type R", "Hybrid", "1.5T", "2.0L", "Other"],
  "honda|accord": ["LX", "Sport", "EX-L", "Touring", "2.0T", "1.5T", "2.0 Hybrid", "Other"],
  "honda|cr-v": ["LX", "EX", "EX-L", "Sport", "Sport-L", "Sport Touring", "Touring", "Hybrid", "TrailSport", "AWD", "Other"],
  "honda|pilot": ["LX", "EX-L", "Sport", "TrailSport", "Touring", "Elite", "Black Edition", "3.5 V6", "AWD", "Other"],
  "honda|odyssey": ["LX", "EX", "EX-L", "Sport", "Touring", "Elite", "3.5 V6", "Other"],
  "honda|hr-v": ["LX", "Sport", "EX-L", "2.0 I4", "AWD", "Other"],
  "honda|ridgeline": ["Sport", "RTL", "RTL-E", "Black Edition", "TrailSport", "3.5 V6", "AWD", "Other"],
  "toyota|camry": ["LE", "SE", "XLE", "XSE", "TRD", "Nightshade", "2.5 I4", "3.5 V6", "Hybrid LE", "Hybrid XLE", "Other"],
  "toyota|corolla": ["L", "LE", "SE", "XLE", "XSE", "Nightshade", "Hatchback", "Hybrid", "GR Corolla", "2.0 I4", "Other"],
  "toyota|rav4": ["LE", "XLE", "XLE Premium", "Adventure", "TRD Off-Road", "Limited", "Woodland", "Hybrid LE", "Hybrid XLE", "Prime", "AWD", "Other"],
  "toyota|highlander": ["L", "LE", "XLE", "Limited", "Platinum", "XSE", "Hybrid LE", "Hybrid XLE", "3.5 V6", "AWD", "Other"],
  "toyota|tacoma": ["SR", "SR5", "TRD Sport", "TRD Off-Road", "Limited", "TRD Pro", "Trailhunter", "2.4T", "3.5 V6", "Hybrid", "4WD", "Other"],
  "toyota|tundra": ["SR", "SR5", "Limited", "Platinum", "1794", "TRD Pro", "Capstone", "3.5 V6", "Hybrid", "4WD", "Other"],
  "toyota|4runner": ["SR5", "TRD Sport", "TRD Off-Road", "Limited", "TRD Pro", "Trailhunter", "4.0 V6", "4WD", "Other"],
  "toyota|sienna": ["LE", "XLE", "XSE", "Limited", "Platinum", "Woodland", "Hybrid", "AWD", "Other"],
  "toyota|prius": ["LE", "XLE", "Limited", "Nightshade", "Prime", "Other"],
  "ford|f-150": ["XL", "XLT", "STX", "Lariat", "King Ranch", "Platinum", "Limited", "Tremor", "Raptor", "2.7 EcoBoost", "3.5 EcoBoost", "5.0 V8", "PowerBoost Hybrid", "Lightning", "4WD", "Other"],
  "ford|f-250": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Tremor", "6.8 V8", "7.3 V8", "6.7 Power Stroke", "4WD", "Other"],
  "ford|mustang": ["EcoBoost", "GT", "Mach 1", "Dark Horse", "Dark Horse Premium", "Shelby GT350", "Shelby GT500", "Mach-E", "Other"],
  "ford|explorer": ["Base", "XLT", "ST-Line", "Limited", "ST", "Platinum", "Timberline", "2.3T", "3.0T", "Hybrid", "Other"],
  "ford|escape": ["Active", "ST-Line", "ST-Line Select", "Platinum", "1.5T", "2.0T", "Hybrid", "PHEV", "AWD", "Other"],
  "ford|bronco": ["Base", "Big Bend", "Black Diamond", "Outer Banks", "Badlands", "Wildtrak", "Raptor", "Heritage", "2.3T", "2.7T", "4WD", "Other"],
  "chevrolet|silverado 1500": ["WT", "Custom", "LT", "RST", "LTZ", "Trail Boss", "ZR2", "High Country", "2.7T", "5.3 V8", "6.2 V8", "3.0 Duramax", "EV", "4WD", "Other"],
  "chevrolet|equinox": ["LS", "LT", "RS", "Activ", "Premier", "1.5T", "EV", "AWD", "Other"],
  "chevrolet|malibu": ["LS", "RS", "LT", "Premier", "1.5T", "2.0T", "Other"],
  "chevrolet|tahoe": ["LS", "LT", "RST", "Z71", "Premier", "High Country", "5.3 V8", "6.2 V8", "3.0 Duramax", "4WD", "Other"],
  "chevrolet|camaro": ["LS", "LT", "SS", "ZL1", "2.0T", "3.6 V6", "6.2 V8", "Other"],
  "chevrolet|colorado": ["WT", "LT", "Z71", "Trail Boss", "ZR2", "2.7T", "4WD", "Other"],
  "gmc|sierra 1500": ["Pro", "SLE", "Elevation", "SLT", "AT4", "AT4X", "Denali", "Denali Ultimate", "2.7T", "5.3 V8", "6.2 V8", "3.0 diesel", "4WD", "Other"],
  "ram|1500": ["Tradesman", "Big Horn", "Rebel", "Laramie", "Limited", "Longhorn", "TRX", "RHO", "3.6 V6", "5.7 V8", "3.0 Hurricane", "6.2 Supercharged", "4WD", "Other"],
  "jeep|wrangler": ["Sport", "Sport S", "Willys", "Sahara", "Rubicon", "Rubicon 392", "4xe", "3.6 V6", "2.0T", "4WD", "Other"],
  "jeep|grand cherokee": ["Laredo", "Altitude", "Limited", "Overland", "Summit", "Trailhawk", "4xe", "3.6 V6", "5.7 V8", "2.0T 4xe", "4WD", "Other"],
  "nissan|altima": ["S", "SV", "SR", "SL", "Platinum", "2.5 I4", "2.0T", "AWD", "Other"],
  "nissan|rogue": ["S", "SV", "SL", "Platinum", "Rock Creek", "1.5T", "AWD", "Other"],
  "nissan|sentra": ["S", "SV", "SR", "2.0 I4", "Other"],
  "nissan|frontier": ["S", "SV", "PRO-4X", "SL", "3.8 V6", "4WD", "Other"],
  "hyundai|elantra": ["SE", "SEL", "Limited", "N Line", "N", "Hybrid", "2.0 I4", "1.6T", "Other"],
  "hyundai|tucson": ["SE", "SEL", "XRT", "Limited", "N Line", "Hybrid", "PHEV", "AWD", "Other"],
  "hyundai|santa fe": ["SE", "SEL", "XRT", "Limited", "Calligraphy", "Hybrid", "AWD", "Other"],
  "kia|forte": ["LXS", "GT-Line", "GT", "2.0 I4", "1.6T", "Other"],
  "kia|sportage": ["LX", "EX", "X-Line", "SX", "SX Prestige", "Hybrid", "AWD", "Other"],
  "kia|telluride": ["LX", "S", "EX", "SX", "SX Prestige", "X-Pro", "X-Line", "3.8 V6", "AWD", "Other"],
  "subaru|outback": ["Base", "Premium", "Onyx", "Limited", "Touring", "Wilderness", "2.5 I4", "2.4T", "AWD", "Other"],
  "subaru|forester": ["Base", "Premium", "Sport", "Limited", "Touring", "Wilderness", "2.5 I4", "AWD", "Other"],
  "subaru|crosstrek": ["Base", "Premium", "Sport", "Limited", "Wilderness", "2.0 I4", "2.5 I4", "Hybrid", "AWD", "Other"],
  "subaru|wrx": ["Base", "Premium", "Limited", "GT", "STI", "2.4T", "AWD", "Other"],
  "mazda|cx-5": ["S", "Select", "Preferred", "Premium", "Carbon Turbo", "Turbo", "Turbo Signature", "2.5 I4", "2.5T", "AWD", "Other"],
  "mazda|mazda3": ["2.5 S", "Select", "Preferred", "Premium", "Turbo", "AWD", "Other"],
  "volkswagen|jetta": ["S", "Sport", "SE", "SEL", "GLI", "1.5T", "2.0T", "Other"],
  "volkswagen|tiguan": ["S", "SE", "SEL", "SEL R-Line", "2.0T", "4MOTION", "Other"],
  "tesla|model 3": ["Rear-Wheel Drive", "Long Range", "Performance", "Other"],
  "tesla|model y": ["Rear-Wheel Drive", "Long Range", "Performance", "Juniper", "Other"],
  "tesla|model s": ["Long Range", "Plaid", "Other"],
  "tesla|model x": ["Long Range", "Plaid", "Other"],
  "bmw|3 series": ["330i", "330e", "M340i", "M3", "xDrive", "Other"],
  "bmw|x5": ["sDrive40i", "xDrive40i", "xDrive50e", "M60i", "X5 M", "Other"],
  "mercedes-benz|c-class": ["C300", "C43 AMG", "C63 AMG", "4MATIC", "Other"],
  "mercedes-benz|e-class": ["E350", "E450", "E53 AMG", "E63 AMG", "4MATIC", "Other"],
  "lexus|rx": ["350", "350h", "450h", "500h", "F Sport", "Luxury", "AWD", "Other"],
  "lexus|es": ["250", "300h", "350", "F Sport", "Luxury", "Other"],
};

function unique(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const k = item.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  if (!out.includes("Other")) out.push("Other");
  return out;
}

export function trimOptions(make: string, model: string) {
  if (!make || !model || model === "Other") return MAKE_DEFAULTS[make] || GENERIC;
  const key = `${make}|${model}`.toLowerCase();
  const stripped = `${make}|${model.replace(/\s+(hybrid|hatchback|coupe|sportback|unlimited)$/i, "")}`.toLowerCase();
  return unique(MODEL_TRIMS[key] || MODEL_TRIMS[stripped] || MAKE_DEFAULTS[make] || GENERIC);
}
