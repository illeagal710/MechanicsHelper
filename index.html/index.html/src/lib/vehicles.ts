export const VEHICLE_DATA: Record<string, string[]> = {
  Acura: ["CL", "CSX", "EL", "ILX", "Integra", "Integra Type S", "Legend", "MDX", "MDX Type S", "NSX", "RDX", "RL", "RLX", "RSX", "SLX", "TL", "TLX", "TLX Type S", "TSX", "Vigor", "ZDX", "Other"],
  "Alfa Romeo": ["147", "156", "159", "164", "166", "4C", "4C Spider", "8C", "Brera", "Giulia", "Giulia Quadrifoglio", "Giulietta", "GT", "GTV", "Milano", "Spider", "Stelvio", "Stelvio Quadrifoglio", "Tonale", "Other"],
  Audi: ["80", "90", "A3", "A3 Sportback", "A4", "A4 Allroad", "A5", "A5 Sportback", "A6", "A6 Allroad", "A7", "A8", "Allroad", "Cabriolet", "e-tron", "e-tron GT", "Q3", "Q4 e-tron", "Q5", "Q5 Sportback", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "RS e-tron GT", "RS Q8", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8", "TT", "TT RS", "TTS", "Other"],
  BMW: ["1 Series", "2 Series", "2 Series Gran Coupe", "3 Series", "3 Series Gran Turismo", "325i", "328i", "330i", "335i", "4 Series", "4 Series Gran Coupe", "5 Series", "5 Series Gran Turismo", "6 Series", "6 Series Gran Coupe", "7 Series", "8 Series", "i3", "i4", "i5", "i7", "i8", "iX", "iX3", "M2", "M3", "M4", "M5", "M6", "M8", "X1", "X2", "X3", "X3 M", "X4", "X4 M", "X5", "X5 M", "X6", "X6 M", "X7", "XM", "Z3", "Z4", "Z8", "Other"],
  Buick: ["Cascada", "Century", "Electra", "Enclave", "Encore", "Encore GX", "Envision", "Envista", "LaCrosse", "LeSabre", "Lucerne", "Park Avenue", "Rainier", "Reatta", "Regal", "Regal Sportback", "Regal TourX", "Rendezvous", "Riviera", "Roadmaster", "Skylark", "Terraza", "Verano", "Other"],
  Cadillac: ["ATS", "ATS-V", "Allante", "Brougham", "CT4", "CT4-V", "CT5", "CT5-V", "CT6", "CTS", "CTS-V", "Catera", "DTS", "DeVille", "Eldorado", "Escalade", "Escalade ESV", "Escalade EXT", "Escalade IQ", "Fleetwood", "Lyriq", "Optiq", "SRX", "STS", "Seville", "Vistiq", "XLR", "XT4", "XT5", "XT6", "XTS", "Other"],
  Chevrolet: ["Astro", "Avalanche", "Aveo", "Beretta", "Blazer", "Blazer EV", "Bolt EUV", "Bolt EV", "C/K 1500", "C/K 2500", "C/K 3500", "Camaro", "Caprice", "Captiva", "Cavalier", "Celebrity", "Chevy Van", "City Express", "Classic", "Cobalt", "Colorado", "Corsica", "Corvette", "Cruze", "El Camino", "Equinox", "Equinox EV", "Express", "HHR", "Impala", "Lumina", "Malibu", "Malibu Maxx", "Monte Carlo", "Prizm", "S-10", "Silverado", "Silverado 1500", "Silverado 2500HD", "Silverado 3500HD", "Silverado EV", "Sonic", "Spark", "SS", "SSR", "Suburban", "Tahoe", "Tracker", "Trailblazer", "Traverse", "Trax", "Uplander", "Venture", "Volt", "Other"],
  Chrysler: ["200", "300", "300M", "Aspen", "Cirrus", "Concorde", "Crossfire", "Grand Voyager", "LHS", "New Yorker", "PT Cruiser", "Pacifica", "Pacifica Hybrid", "Prowler", "Sebring", "Town & Country", "Voyager", "Other"],
  Dodge: ["Avenger", "Caliber", "Caravan", "Challenger", "Charger", "Dakota", "Dart", "Durango", "Grand Caravan", "Hornet", "Intrepid", "Journey", "Magnum", "Neon", "Nitro", "Ram 1500", "Ram 2500", "Ram 3500", "Ram Van", "Shadow", "Spirit", "Stealth", "Stratus", "Viper", "Other"],
  Fiat: ["124 Spider", "500", "500 Abarth", "500e", "500L", "500X", "Doblo", "Panda", "Punto", "Spider", "Other"],
  Ford: ["Aerostar", "Bronco", "Bronco Sport", "C-Max", "Contour", "Crown Victoria", "E-150", "E-250", "E-350", "E-Series", "E-Transit", "EcoSport", "Edge", "Escape", "Escort", "Excursion", "Expedition", "Expedition Max", "Explorer", "Explorer Sport", "Explorer Sport Trac", "F-150", "F-150 Lightning", "F-250", "F-350", "F-450", "F-550", "Fiesta", "Five Hundred", "Flex", "Focus", "Focus RS", "Focus ST", "Freestar", "Freestyle", "Fusion", "Fusion Energi", "Fusion Hybrid", "GT", "Maverick", "Mustang", "Mustang GT", "Mustang Mach-E", "Probe", "Ranger", "Taurus", "Taurus X", "Thunderbird", "Transit", "Transit Connect", "Windstar", "Other"],
  Genesis: ["Electrified G80", "Electrified GV70", "G70", "G80", "G90", "GV60", "GV70", "GV80", "GV80 Coupe", "Other"],
  GMC: ["Acadia", "Canyon", "Envoy", "Envoy XL", "Hummer EV", "Jimmy", "Safari", "Savana", "Sierra", "Sierra 1500", "Sierra 2500HD", "Sierra 3500HD", "Sierra EV", "Sonoma", "Terrain", "Yukon", "Yukon Denali", "Yukon XL", "Other"],
  Honda: ["Accord", "Accord Coupe", "Accord Hybrid", "Civic", "Civic Coupe", "Civic Hatchback", "Civic Hybrid", "Civic Si", "Civic Type R", "Clarity", "CR-V", "CR-V Hybrid", "CR-Z", "CRX", "Crosstour", "del Sol", "Element", "Fit", "HR-V", "Insight", "Odyssey", "Passport", "Pilot", "Prelude", "Prologue", "Ridgeline", "S2000", "Other"],
  Hummer: ["H1", "H2", "H3", "H3T", "Other"],
  Hyundai: ["Accent", "Azera", "Elantra", "Elantra GT", "Elantra Hybrid", "Elantra N", "Entourage", "Equus", "Genesis", "Genesis Coupe", "Ioniq", "Ioniq 5", "Ioniq 5 N", "Ioniq 6", "Ioniq 9", "Kona", "Kona Electric", "Kona N", "Palisade", "Santa Cruz", "Santa Fe", "Santa Fe Hybrid", "Santa Fe Sport", "Sonata", "Sonata Hybrid", "Tiburon", "Tucson", "Tucson Hybrid", "Veloster", "Veloster N", "Venue", "Veracruz", "XG300", "XG350", "Other"],
  Infiniti: ["EX35", "EX37", "FX35", "FX37", "FX45", "FX50", "G20", "G25", "G35", "G37", "I30", "I35", "J30", "JX35", "M35", "M37", "M45", "M56", "Q45", "Q50", "Q60", "Q70", "QX30", "QX4", "QX50", "QX55", "QX56", "QX60", "QX70", "QX80", "Other"],
  Isuzu: ["Amigo", "Ascender", "Axiom", "Hombre", "i-280", "i-290", "i-350", "i-370", "NPR", "Rodeo", "Trooper", "VehiCROSS", "Other"],
  Jaguar: ["E-PACE", "F-PACE", "F-PACE SVR", "F-TYPE", "I-PACE", "S-Type", "XE", "XF", "XJ", "XJ8", "XJR", "XK", "XK8", "XKR", "X-Type", "Other"],
  Jeep: ["Cherokee", "CJ", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Grand Cherokee 4xe", "Grand Cherokee L", "Grand Wagoneer", "Grand Wagoneer L", "Liberty", "Patriot", "Renegade", "Wagoneer", "Wagoneer L", "Wrangler", "Wrangler 4xe", "Wrangler Unlimited", "Other"],
  Kia: ["Amanti", "Borrego", "Cadenza", "Carnival", "EV6", "EV9", "Forte", "Forte5", "K4", "K5", "K900", "Niro", "Niro EV", "Niro PHEV", "Optima", "Optima Hybrid", "Rio", "Rio5", "Rondo", "Sedona", "Seltos", "Sorento", "Sorento Hybrid", "Soul", "Soul EV", "Spectra", "Sportage", "Sportage Hybrid", "Stinger", "Telluride", "Other"],
  "Land Rover": ["Defender", "Defender 110", "Defender 130", "Defender 90", "Discovery", "Discovery Sport", "Freelander", "LR2", "LR3", "LR4", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar", "Other"],
  Lexus: ["CT", "ES", "GS", "GS F", "GX", "HS", "IS", "IS F", "LC", "LFA", "LS", "LX", "NX", "RC", "RC F", "RX", "RZ", "SC", "TX", "UX", "Other"],
  Lincoln: ["Aviator", "Blackwood", "Continental", "Corsair", "LS", "Mark LT", "Mark VIII", "MKC", "MKS", "MKT", "MKX", "MKZ", "Nautilus", "Navigator", "Navigator L", "Town Car", "Zephyr", "Other"],
  Lucid: ["Air", "Gravity", "Other"],
  Mazda: ["323", "626", "B-Series", "CX-3", "CX-30", "CX-5", "CX-50", "CX-70", "CX-7", "CX-9", "CX-90", "Mazda2", "Mazda3", "Mazda5", "Mazda6", "Millenia", "MPV", "MX-5 Miata", "MX-30", "Protege", "Protege5", "RX-7", "RX-8", "Tribute", "Other"],
  "Mercedes-Benz": ["190E", "A-Class", "AMG GT", "B-Class", "C-Class", "C230", "C230 Kompressor", "C240", "C250", "C280", "C300", "C320", "C350", "C55 AMG", "C63 AMG", "CL-Class", "CLA", "CLK", "CLK320", "CLK350", "CLS", "E-Class", "E320", "E350", "E63 AMG", "EQB", "EQE", "EQE SUV", "EQS", "EQS SUV", "G-Class", "GL-Class", "GLA", "GLB", "GLC", "GLC Coupe", "GLE", "GLE Coupe", "GLK", "GLS", "M-Class", "ML320", "ML350", "Maybach S-Class", "Metris", "R-Class", "S-Class", "SL", "SLC", "SLK", "SLK230", "SLK320", "SLR", "SLS", "Sprinter", "Other"],
  Mercury: ["Cougar", "Grand Marquis", "Marauder", "Mariner", "Milan", "Montego", "Monterey", "Mountaineer", "Mystique", "Sable", "Villager", "Other"],
  Mini: ["Clubman", "Convertible", "Cooper", "Cooper S", "Countryman", "Coupe", "Hardtop", "John Cooper Works", "Paceman", "Roadster", "Other"],
  Mitsubishi: ["3000GT", "Diamante", "Eclipse", "Eclipse Cross", "Endeavor", "Galant", "Lancer", "Lancer Evolution", "Mirage", "Mirage G4", "Montero", "Montero Sport", "Outlander", "Outlander PHEV", "Outlander Sport", "Raider", "Other"],
  Nissan: ["200SX", "240SX", "300ZX", "350Z", "370Z", "Altima", "Ariya", "Armada", "cube", "Frontier", "GT-R", "Juke", "Kicks", "Leaf", "Maxima", "Murano", "NV", "NV200", "Pathfinder", "Pickup", "Quest", "Rogue", "Rogue Select", "Rogue Sport", "Sentra", "Titan", "Titan XD", "Versa", "Versa Note", "Xterra", "Z", "Other"],
  Polestar: ["Polestar 1", "Polestar 2", "Polestar 3", "Polestar 4", "Other"],
  Pontiac: ["Aztek", "Bonneville", "Firebird", "G5", "G6", "G8", "Grand Am", "Grand Prix", "GTO", "Montana", "Solstice", "Sunfire", "Torrent", "Trans Am", "Vibe", "Other"],
  Porsche: ["718 Boxster", "718 Cayman", "718 Spyder", "911", "911 Carrera", "911 GT3", "911 Turbo", "928", "944", "968", "Boxster", "Cayenne", "Cayenne Coupe", "Cayman", "Macan", "Panamera", "Taycan", "Taycan Cross Turismo", "Other"],
  Ram: ["1500", "1500 REV", "2500", "3500", "4500", "5500", "C/V", "Dakota", "ProMaster", "ProMaster City", "Other"],
  Rivian: ["R1S", "R1T", "R2", "Other"],
  Saturn: ["Astra", "Aura", "Ion", "L-Series", "LW", "Outlook", "Relay", "S-Series", "SC", "Sky", "SL", "SW", "Vue", "Other"],
  Scion: ["FR-S", "iA", "iM", "iQ", "tC", "xA", "xB", "xD", "Other"],
  Subaru: ["Ascent", "Baja", "BRZ", "Crosstrek", "Forester", "Impreza", "Impreza WRX", "Legacy", "Outback", "Solterra", "SVX", "Tribeca", "WRX", "WRX STI", "XV Crosstrek", "Other"],
  Suzuki: ["Aerio", "Equator", "Esteem", "Forenza", "Grand Vitara", "Kizashi", "Reno", "SX4", "Samurai", "Sidekick", "Swift", "Verona", "Vitara", "XL-7", "Other"],
  Tesla: ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y", "Roadster", "Semi", "Other"],
  Toyota: ["4Runner", "86", "Avalon", "Avalon Hybrid", "bZ4X", "C-HR", "Camry", "Camry Hybrid", "Camry Solara", "Celica", "Corolla", "Corolla Cross", "Corolla Hatchback", "Corolla Hybrid", "Cressida", "Crown", "Crown Signia", "Echo", "FJ Cruiser", "GR86", "GR Corolla", "GR Supra", "Grand Highlander", "Highlander", "Highlander Hybrid", "Land Cruiser", "Matrix", "Mirai", "MR2", "Paseo", "Previa", "Prius", "Prius C", "Prius Plug-in", "Prius Prime", "Prius V", "RAV4", "RAV4 Hybrid", "RAV4 Prime", "Sequoia", "Sienna", "Sienna Hybrid", "Solara", "Supra", "T100", "Tacoma", "Tercel", "Tundra", "Tundra Hybrid", "Venza", "Yaris", "Yaris iA", "Other"],
  VinFast: ["VF 6", "VF 7", "VF 8", "VF 9", "Other"],
  Volkswagen: ["Arteon", "Atlas", "Atlas Cross Sport", "Beetle", "Cabrio", "CC", "e-Golf", "Eos", "Eurovan", "Golf", "Golf Alltrack", "Golf GTI", "Golf R", "Golf SportWagen", "ID.4", "ID. Buzz", "Jetta", "Jetta GLI", "Jetta SportWagen", "Passat", "Phaeton", "Rabbit", "Routan", "Taos", "Tiguan", "Tiguan Limited", "Touareg", "Other"],
  Volvo: ["850", "940", "960", "C30", "C40", "C70", "EX30", "EX90", "S40", "S60", "S60 Recharge", "S70", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90", "Other"],
  Other: ["Other"],
};

export const OTHER_VALUE = "Other";

export function resolveListedOrOther(selected: string, otherText = "") {
  const listed = String(selected || "").trim();
  if (!listed) return "";
  if (listed !== OTHER_VALUE) return listed;
  return String(otherText || "").trim() || OTHER_VALUE;
}

export const YEARS: string[] = [];
(function buildYears() {
  const now = new Date().getFullYear() + 1;
  for (let y = now; y >= 1990; y--) YEARS.push(String(y));
})();

export function vehicleKind(j: { make?: string; model?: string }) {
  const blob = `${j.make || ""} ${j.model || ""}`.toLowerCase();
  if (/f-150|f-250|f-350|f150|silverado|sierra|ram |tacoma|tundra|t100|ranger|frontier|gladiator|ridgeline|canyon|colorado|maverick|titan|santa cruz|avalanche|cybertruck|r1t|1500|2500|3500|c\/k|mark lt|baja|sonoma|dakota|s-10|pickup/.test(blob)) return "truck";
  if (/odyssey|pacifica|sienna|carnival|sedona|town & country|voyager|caravan|quest|entorage|uplander|venture|freestar|windstar|transit|promaster|express|savana|metris|sprinter|routan|mazda5|id. buzz|aerostar|previa/.test(blob)) return "van";
  if (/mustang|camaro|challenger|corvette|supra|370z|350z|300zx|gt-r|gtr|911|718|boxster|cayman|miata|mx-5|brz|gr86|86|s2000|nsx|viper|stinger|rc |z4|tt\b|r8|f-type|gr corolla|civic si|civic type r|elantra n|charger|crx/.test(blob)) return "sports";
  if (/suv|crossover|rav4|cr-v|crv|hr-v|hrv|pilot|passport|prologue|highlander|4runner|sequoia|land cruiser|fj cruiser|venza|c-hr|corolla cross|tahoe|suburban|yukon|expedition|explorer|escape|edge|bronco|equinox|traverse|blazer|trailblazer|trax|acadia|terrain|envoy|wrangler|cherokee|compass|renegade|wagoneer|durango|journey|nitro|telluride|sorento|sportage|seltos|soul|niro|tucson|santa fe|palisade|kona|venue|veracruz|outback|forester|ascent|crosstrek|tribeca|solterra|cx-3|cx-30|cx-5|cx-50|cx-7|cx-9|cx-90|mdx|rdx|zdx|rx|gx|nx|ux|tx|lx|rz|x1|x2|x3|x4|x5|x6|x7|xm|ix\b|glc|gle|gls|gla|glb|glk|g-class|gl-class|m-class|ml320|ml350|r-class|eqb|q3|q4|q5|q7|q8|e-tron|tiguan|atlas|taos|touareg|id.4|xc40|xc60|xc70|xc90|c40|model y|model x|enclave|envision|encore|envista|xt4|xt5|xt6|escalade|srx|lyriq|aviator|nautilus|corsair|navigator|mkc|mkx|mkt|gv60|gv70|gv80|stelvio|tonale|macan|cayenne|discovery|defender|freelander|range rover|lr2|lr3|lr4|qx50|qx55|qx60|qx70|qx80|fx35|fx45|fx50|ex35|jx35|outlander|eclipse cross|endeavor|montero| Countryman|countryman|paceman|f-pace|e-pace|i-pace|r1s|hummer|ariya/.test(blob)) return "suv";
  return "sedan";
}

export function carImage(j: { make?: string; model?: string }) {
  return "/img/car-" + vehicleKind(j) + ".jpg";
}

export const SYMPTOM_CHIPS = [
  "Check engine light",
  "Strange noise",
  "Won't start",
  "Brakes squeaking",
  "Overheating",
  "Vibration",
  "Leaking fluid",
  "A/C not cold",
  "Oil change / service",
  "Inspection / diagnosis"
];
