import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as QrCode, c as House, d as ClipboardList, f as Check, i as RefreshCw, l as Download, m as ArrowLeft, o as MessageCircle, p as CalendarPlus, r as Share2, s as MapPin, t as UserRound, u as Copy } from "../_libs/lucide-react.mjs";
import { t as require_lib } from "../_libs/qrcode.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-N892OQmm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_lib = /* @__PURE__ */ __toESM(require_lib());
function referralUrl(code) {
	return `${typeof window === "undefined" ? "" : window.location.origin}${typeof window === "undefined" ? "/" : window.location.pathname}?ref=${encodeURIComponent(code)}`;
}
async function qrDataUrl(text) {
	return import_lib.toDataURL(text, {
		margin: 1,
		width: 280,
		color: {
			dark: "#0c1220",
			light: "#fff7ed"
		},
		errorCorrectionLevel: "M"
	});
}
function QrShare({ code, title, onRotate, canRotate, rotateHint }) {
	const [src, setSrc] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)("");
	const link = typeof window === "undefined" ? "" : referralUrl(code);
	const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
	(0, import_react.useEffect)(() => {
		if (!code) return;
		qrDataUrl(referralUrl(code)).then(setSrc);
	}, [code]);
	async function copy(kind) {
		const text = kind === "code" ? code : link;
		try {
			await navigator.clipboard.writeText(text);
		} catch {}
		setCopied(kind);
		setTimeout(() => setCopied(""), 1600);
	}
	function download() {
		if (!src) return;
		const a = document.createElement("a");
		a.href = src;
		a.download = `find-code-${code}.png`;
		a.click();
	}
	async function shareNative() {
		try {
			await navigator.share({
				title,
				text: `Book with ${title}. Find code ${code}`,
				url: link
			});
		} catch {}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold uppercase tracking-wide text-muted",
				children: "Customer find code"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 text-lg font-semibold",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Print, text, or leave on the counter. Customers scan or type this and book you — not a random shop."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center gap-3 rounded-xl bg-bg2 p-3",
				children: [src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src,
					alt: `QR code for ${code}`,
					className: "size-36 shrink-0 rounded-lg bg-accent/10 p-1.5"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-36 shrink-0 animate-pulse rounded-lg bg-surface2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-3xl font-semibold tracking-[0.18em] text-accent",
						children: code
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-dim",
						children: "4-letter find code"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-ink",
						onClick: () => void copy("code"),
						children: [copied === "code" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied === "code" ? "Copied" : "Copy code"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold",
						onClick: () => void copy("link"),
						children: [copied === "link" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied === "link" ? "Copied" : "Copy link"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold ${canNativeShare ? "" : "col-span-2"}`,
						onClick: download,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Save QR"]
					}),
					canNativeShare ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface2 text-sm font-semibold",
						onClick: () => void shareNative(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4" }), "Share"]
					}) : null
				]
			}),
			canRotate && onRotate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted",
				onClick: onRotate,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "Generate a new code"]
			}) : null,
			rotateHint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-dim",
				children: rotateHint
			}) : null
		]
	});
}
function greet() {
	return {
		text: "I'm the shop helper. Tell me the year, make, and model if you have them, then what's going on — a noise, a light, a smell, a leak, or how it drives.\n\nI can narrow likely causes. If the car isn't safe to drive, say so.",
		chips: [
			"Check engine light",
			"Won't start",
			"Brake noise",
			"Overheating",
			"Shaking",
			"Leak under the car"
		]
	};
}
function has(t, words) {
	return words.some((w) => t.includes(w));
}
function block(urgency, lead, bullets, chips) {
	const tag = urgency === "urgent" ? "Urgency: don't keep driving it if you can avoid it." : urgency === "soon" ? "Urgency: book this week, sooner if it's changing fast." : "Urgency: a normal appointment is fine unless something new shows up.";
	return {
		text: [
			lead,
			"",
			...bullets.map((b) => "• " + b),
			"",
			tag
		].join("\n"),
		chips,
		urgency
	};
}
function reply(text) {
	const t = (text || "").toLowerCase();
	if (has(t, [
		"overheat",
		"steam",
		"coolant",
		"running hot"
	])) return block("urgent", "Overheating is one of the fastest ways to wreck an engine.", [
		"If the gauge is high or you see steam: pull over and shut it down.",
		"Common causes: low coolant, thermostat, water pump, fan, head gasket.",
		"Book a cooling-system check."
	], ["Book cooling-system check"]);
	if (has(t, [
		"won't start",
		"wont start",
		"no start",
		"click",
		"dead battery"
	])) return block("soon", "A no-start is very bookable — we don't need you to guess the part.", ["Clicks usually mean a weak battery or a bad connection.", "If it cranks but never catches, think fuel, spark, or a sensor."], ["Book no-start diagnosis"]);
	if (has(t, ["check engine", "engine light"])) return block("soon", "A check-engine light is a stored fault code — a clue, not a parts list.", ["We scan it first. Same light can be a gas cap or a misfire.", "A flashing light is an active misfire — don't ignore it."], ["Book a scan + diagnosis"]);
	if (has(t, [
		"brake",
		"grinding",
		"squeak",
		"squeal",
		"pedal"
	])) return block("soon", "Brake noise can be cheap wear indicators or pads that are gone.", ["Tell us which end, and whether it happens cold or after a drive.", "A soft or sinking pedal is urgent — hydraulic problem."], ["Book brake inspection"]);
	if (has(t, [
		"shake",
		"vibration",
		"wobble"
	])) return block("soon", "Vibration is usually tires, a bent wheel, or rotors if it happens while braking.", ["Note the mph when it starts and whether the steering wheel shakes."], ["Book vibration diagnosis"]);
	if (has(t, [
		"leak",
		"puddle",
		"dripping"
	])) return block("soon", "A drip is easier to find when it's still wet.", ["Sweet green/orange is often coolant. Thick brown/black is oil.", "Park on cardboard overnight if you can."], ["Book leak inspection"]);
	if (t.length < 12) return {
		text: "Give me a bit more. For example: “2018 Civic, grinds when I brake going downhill.”",
		chips: [
			"Check engine light",
			"Won't start",
			"Brake noise"
		]
	};
	return block("normal", "I have enough to start a ticket, even if the cause isn't obvious yet.", ["A good visit starts with what you feel/hear/smell and when it started.", "I can drop this description into a booking."], ["Book this diagnosis"]);
}
var RIVERSIDE_BIO = "Family-run shop since 1998. Brakes, engines, and same-day diagnostics. We text you before we turn a wrench.";
var LEON_BIO = "I come to your driveway. Scan tools, common parts, and straight talk. Nights and weekends if the car is down.";
var STATUSES = [
	{
		id: "scheduled",
		label: "Scheduled",
		customer: "Appointment booked",
		badge: "scheduled"
	},
	{
		id: "enroute",
		label: "On the way",
		customer: "Mechanic is heading to you",
		badge: "enroute"
	},
	{
		id: "checkedin",
		label: "Checked in",
		customer: "Vehicle is with the mechanic",
		badge: "checkedin"
	},
	{
		id: "diagnosing",
		label: "Diagnosing",
		customer: "Technician is inspecting the vehicle",
		badge: "diagnosing"
	},
	{
		id: "parts",
		label: "Waiting on parts",
		customer: "Parts ordered — we'll update when they arrive",
		badge: "parts"
	},
	{
		id: "repair",
		label: "In repair",
		customer: "Work is underway",
		badge: "repair"
	},
	{
		id: "ready",
		label: "Ready for pickup",
		customer: "Your vehicle is ready",
		badge: "ready"
	},
	{
		id: "done",
		label: "Completed",
		customer: "Picked up — thank you",
		badge: "done"
	}
];
var KEY = "mechanicshelper.v4";
var SESSION = "mh.session";
var REF = "mh.ref";
function passHash(s) {
	let h = 2166136261;
	const str = "mh|" + String(s || "");
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0).toString(16);
}
function slotDays(days, hhmm) {
	const d = /* @__PURE__ */ new Date();
	d.setDate(d.getDate() + days);
	const [h, m] = hhmm.split(":").map(Number);
	d.setHours(h, m, 0, 0);
	return d.toISOString();
}
function shopCode() {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let s = "";
	for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * 32)];
	return s;
}
function defaultShops() {
	return [{
		id: "s-main",
		name: "Riverside Auto",
		code: "RIV4",
		ownerId: "u-shop",
		techs: ["Shop Desk", "Alex Ruiz"],
		bio: RIVERSIDE_BIO
	}];
}
function defaultUsers() {
	return [
		{
			id: "u-maya",
			name: "Maya Chen",
			email: "maya@example.com",
			phone: "5550148821",
			role: "customer",
			pass: passHash("demo123")
		},
		{
			id: "u-shop",
			name: "Shop Desk",
			email: "shop@example.com",
			phone: "5550100000",
			role: "shop",
			shopId: "s-main",
			shopName: "Riverside Auto",
			shopRole: "owner",
			pass: passHash("demo123")
		},
		{
			id: "u-alex",
			name: "Alex Ruiz",
			email: "alex@example.com",
			phone: "5550100001",
			role: "shop",
			shopId: "s-main",
			shopName: "Riverside Auto",
			shopRole: "tech",
			pass: passHash("demo123")
		},
		{
			id: "u-indy",
			name: "Leon Miles",
			email: "indy@example.com",
			phone: "5550166000",
			role: "independent",
			businessName: "Leon Mobile Repair",
			serviceMode: "mobile",
			code: "LEON",
			bio: LEON_BIO,
			pass: passHash("demo123")
		}
	];
}
function seed() {
	const now = Date.now();
	const data = {
		shops: defaultShops(),
		users: defaultUsers(),
		jobs: [
			{
				id: "MH-4821",
				createdAt: now - 1728e5,
				providerId: "s-main",
				providerType: "shop",
				providerName: "Riverside Auto",
				assignedTo: "Alex Ruiz",
				name: "Maya Chen",
				phone: "5550148821",
				email: "maya@example.com",
				year: "2019",
				make: "Honda",
				model: "CR-V",
				symptoms: "Grinding noise when braking, especially downhill.",
				slot: slotDays(1, "09:00"),
				status: "repair",
				notes: [{
					at: now - 1728e5,
					text: "Booked online.",
					by: "system"
				}, {
					at: now - 288e5,
					text: "Front pads at 2mm. Rotors scored. Customer approved pads + rotors.",
					by: "shop"
				}]
			},
			{
				id: "MH-4822",
				createdAt: now - 18e6,
				providerId: "u-indy",
				providerType: "independent",
				providerName: "Leon Mobile Repair",
				assignedTo: "Leon Miles",
				name: "James Ortiz",
				phone: "5550193304",
				email: "james@example.com",
				year: "2016",
				make: "Ford",
				model: "F-150",
				symptoms: "Check engine light. Rough idle after warmup.",
				slot: slotDays(0, "11:30"),
				status: "diagnosing",
				notes: [{
					at: now - 18e6,
					text: "Booked online.",
					by: "system"
				}, {
					at: now - 36e5,
					text: "Pulled codes P0302. Checking coil pack and injector.",
					by: "shop"
				}]
			},
			{
				id: "MH-4820",
				createdAt: now - 864e5,
				providerId: "s-main",
				providerType: "shop",
				providerName: "Riverside Auto",
				assignedTo: "Shop Desk",
				name: "Priya Shah",
				phone: "5550167742",
				email: "priya@example.com",
				year: "2022",
				make: "Toyota",
				model: "Camry",
				symptoms: "Oil change and 30k service.",
				slot: slotDays(0, "08:00"),
				status: "ready",
				notes: [{
					at: now - 864e5,
					text: "Booked online.",
					by: "system"
				}, {
					at: now - 72e5,
					text: "Service complete. Cabin filter replaced.",
					by: "shop"
				}]
			}
		]
	};
	save(data);
	return data;
}
function load() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return seed();
		const data = JSON.parse(raw);
		if (!data.jobs) return seed();
		if (!data.users?.length) data.users = defaultUsers();
		if (!data.shops?.length) data.shops = defaultShops();
		for (const u of data.users) if (u.role === "independent" && !u.code) u.code = uniqueCode(data);
		for (const s of data.shops) if (typeof s.bio !== "string") s.bio = s.id === "s-main" ? RIVERSIDE_BIO : "";
		for (const u of data.users) if (u.role === "independent" && typeof u.bio !== "string") u.bio = u.id === "u-indy" ? LEON_BIO : "";
		save(data);
		return data;
	} catch {
		return seed();
	}
}
function save(data) {
	localStorage.setItem(KEY, JSON.stringify(data));
}
function uniqueCode(data) {
	const used = /* @__PURE__ */ new Set();
	for (const s of data.shops) used.add(s.code);
	for (const u of data.users) if (u.code) used.add(u.code);
	let c = shopCode();
	while (used.has(c)) c = shopCode();
	return c;
}
function publicUser(u) {
	const { pass: _p, ...rest } = u;
	return {
		...rest,
		pass: ""
	};
}
var Store = {
	load,
	passHash: (s) => passHash(s),
	getSession() {
		try {
			const raw = localStorage.getItem(SESSION);
			if (!raw) return null;
			const parsed = JSON.parse(raw);
			const fresh = load().users.find((u) => u.id === parsed.id);
			return fresh ? publicUser(fresh) : parsed;
		} catch {
			return null;
		}
	},
	setSession(user) {
		if (!user) localStorage.removeItem(SESSION);
		else localStorage.setItem(SESSION, JSON.stringify(publicUser(user)));
	},
	getRefCode() {
		try {
			return localStorage.getItem(REF) || "";
		} catch {
			return "";
		}
	},
	setRefCode(code) {
		const c = String(code || "").trim().toUpperCase();
		if (!c) localStorage.removeItem(REF);
		else localStorage.setItem(REF, c);
	},
	findUser(emailOrPhone) {
		const q = String(emailOrPhone || "").trim().toLowerCase();
		const digits = q.replace(/\D/g, "");
		return load().users.find((u) => {
			if ((u.email || "").toLowerCase() === q) return true;
			const ph = (u.phone || "").replace(/\D/g, "");
			return digits.length >= 4 && ph === digits;
		}) || null;
	},
	login(emailOrPhone, password) {
		const user = this.findUser(emailOrPhone);
		if (!user || user.pass !== passHash(password)) return {
			ok: false,
			error: "Email/phone or password is wrong."
		};
		this.setSession(user);
		return {
			ok: true,
			user: publicUser(user)
		};
	},
	logout() {
		this.setSession(null);
	},
	register(fields) {
		const data = load();
		const emailL = (fields.email || "").trim().toLowerCase();
		const phoneD = String(fields.phone || "").replace(/\D/g, "");
		if (!fields.name || !fields.password || !emailL && !phoneD) return {
			ok: false,
			error: "Name, password, and email or phone are required."
		};
		if (fields.password.length < 6) return {
			ok: false,
			error: "Password must be at least 6 characters."
		};
		if (this.findUser(emailL || phoneD)) return {
			ok: false,
			error: "That email or phone already has an account."
		};
		const role = fields.role === "shop" || fields.role === "independent" ? fields.role : "customer";
		const user = {
			id: "u-" + Math.random().toString(36).slice(2, 8),
			name: String(fields.name).trim(),
			email: emailL,
			phone: phoneD,
			role,
			pass: passHash(fields.password)
		};
		if (role === "shop") {
			if (fields.shopJoin === "join") {
				const code = String(fields.shopCode || "").trim().toUpperCase();
				const shop = data.shops.find((s) => s.code === code);
				if (!shop) return {
					ok: false,
					error: "No shop with that code."
				};
				user.shopId = shop.id;
				user.shopName = shop.name;
				user.shopRole = "tech";
				if (!shop.techs.includes(user.name)) shop.techs.push(user.name);
			} else {
				const shopName = String(fields.shopName || "").trim() || user.name + "'s Shop";
				const shop = {
					id: "s-" + Math.random().toString(36).slice(2, 7),
					name: shopName,
					code: uniqueCode(data),
					ownerId: user.id,
					techs: [user.name],
					bio: ""
				};
				data.shops.push(shop);
				user.shopId = shop.id;
				user.shopName = shop.name;
				user.shopRole = "owner";
			}
		}
		if (role === "independent") {
			user.businessName = String(fields.businessName || "").trim() || user.name;
			user.serviceMode = fields.serviceMode || "both";
			user.code = uniqueCode(data);
			user.bio = "";
		}
		data.users.push(user);
		save(data);
		this.setSession(user);
		return {
			ok: true,
			user: publicUser(user)
		};
	},
	listProviders() {
		const data = load();
		const shops = data.shops.map((s) => ({
			id: s.id,
			type: "shop",
			name: s.name,
			detail: "Repair shop",
			code: s.code,
			bio: s.bio || ""
		}));
		const indy = data.users.filter((u) => u.role === "independent").map((u) => ({
			id: u.id,
			type: "independent",
			name: u.businessName || u.name,
			detail: u.serviceMode === "mobile" ? "Mobile mechanic" : u.serviceMode === "shop" ? "Independent shop" : "Mobile or drop-off",
			code: u.code || "",
			bio: u.bio || ""
		}));
		return [...shops, ...indy];
	},
	findProviderByCode(code) {
		const c = String(code || "").trim().toUpperCase();
		if (!c) return null;
		return this.listProviders().find((p) => p.code === c) || null;
	},
	customerCodeFor(user) {
		if (!user) return "";
		if (user.role === "shop" && user.shopId) return this.shopRecord(user.shopId)?.code || "";
		if (user.role === "independent") return user.code || "";
		return "";
	},
	rotateCustomerCode(user) {
		const data = load();
		const next = uniqueCode(data);
		if (user.role === "shop" && user.shopId) {
			const shop = data.shops.find((s) => s.id === user.shopId);
			if (!shop) return "";
			shop.code = next;
			save(data);
			return next;
		}
		if (user.role === "independent") {
			const u = data.users.find((x) => x.id === user.id);
			if (!u) return "";
			u.code = next;
			save(data);
			this.setSession(u);
			return next;
		}
		return "";
	},
	providerJobs(user) {
		const data = load();
		if (!user) return data.jobs;
		if (user.role === "shop") return data.jobs.filter((j) => j.providerId === user.shopId);
		if (user.role === "independent") return data.jobs.filter((j) => j.providerId === user.id);
		return data.jobs.filter((j) => j.email === user.email || j.phone === user.phone || j.userId === user.id);
	},
	shopRecord(shopId) {
		return load().shops.find((s) => s.id === shopId) || null;
	},
	updateShopProfile(user, patch) {
		if (user.role !== "shop" || user.shopRole !== "owner" || !user.shopId) return {
			ok: false,
			error: "Only the shop owner can edit this."
		};
		const data = load();
		const shop = data.shops.find((s) => s.id === user.shopId);
		if (!shop) return {
			ok: false,
			error: "Shop not found."
		};
		if (patch.name !== void 0) {
			const name = String(patch.name).trim();
			if (!name) return {
				ok: false,
				error: "Shop name is required."
			};
			shop.name = name;
			for (const u of data.users) if (u.shopId === shop.id) u.shopName = name;
		}
		if (patch.bio !== void 0) shop.bio = String(patch.bio).trim().slice(0, 320);
		save(data);
		const fresh = data.users.find((u) => u.id === user.id);
		if (fresh) this.setSession(fresh);
		return {
			ok: true,
			user: fresh ? publicUser(fresh) : publicUser(user)
		};
	},
	updateIndependentProfile(user, patch) {
		if (user.role !== "independent") return {
			ok: false,
			error: "Only independents can edit this."
		};
		const data = load();
		const u = data.users.find((x) => x.id === user.id);
		if (!u) return {
			ok: false,
			error: "Account not found."
		};
		if (patch.businessName !== void 0) {
			const name = String(patch.businessName).trim();
			if (!name) return {
				ok: false,
				error: "Business name is required."
			};
			u.businessName = name;
		}
		if (patch.bio !== void 0) u.bio = String(patch.bio).trim().slice(0, 320);
		if (patch.serviceMode) u.serviceMode = patch.serviceMode;
		save(data);
		this.setSession(u);
		return {
			ok: true,
			user: publicUser(u)
		};
	},
	addTechName(shopId, name) {
		const data = load();
		const shop = data.shops.find((s) => s.id === shopId);
		if (!shop) return null;
		name = String(name || "").trim();
		if (name && !shop.techs.includes(name)) shop.techs.push(name);
		save(data);
		return shop;
	},
	jobCode() {
		return "MH-" + Math.floor(1e3 + Math.random() * 9e3);
	},
	addJob(job) {
		const data = load();
		data.jobs.unshift(job);
		save(data);
		return job;
	},
	updateJob(id, patch) {
		const data = load();
		const j = data.jobs.find((x) => x.id === id);
		if (!j) return null;
		Object.assign(j, patch);
		save(data);
		return j;
	},
	addNote(id, text, by = "shop") {
		const data = load();
		const j = data.jobs.find((x) => x.id === id);
		if (!j) return null;
		j.notes = j.notes || [];
		j.notes.push({
			at: Date.now(),
			text,
			by
		});
		save(data);
		return j;
	},
	findJobs(q, user) {
		const raw = String(q || "").trim().toUpperCase();
		const digits = raw.replace(/\D/g, "");
		let jobs = load().jobs;
		if (user?.role === "customer") jobs = jobs.filter((j) => j.email === user.email || j.phone === user.phone || j.userId === user.id);
		return jobs.filter((j) => {
			if (j.id.toUpperCase() === raw) return true;
			const ph = (j.phone || "").replace(/\D/g, "");
			return digits.length >= 4 && (ph.endsWith(digits) || ph.includes(digits));
		});
	}
};
function statusMeta(id) {
	return STATUSES.find((s) => s.id === id) || STATUSES[0];
}
function fmtWhen(iso) {
	return new Date(iso).toLocaleString(void 0, {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
}
function fmtShort(isoOrMs) {
	return new Date(isoOrMs).toLocaleString(void 0, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
}
function vehicleLabel(j) {
	return `${j.year} ${j.make} ${j.model}`;
}
var VEHICLE_DATA = {
	Acura: [
		"CL",
		"CSX",
		"ILX",
		"Integra",
		"Legend",
		"MDX",
		"NSX",
		"RDX",
		"RL",
		"RLX",
		"RSX",
		"TL",
		"TLX",
		"TSX",
		"ZDX",
		"Other"
	],
	"Alfa Romeo": [
		"4C",
		"Giulia",
		"Stelvio",
		"Tonale",
		"Other"
	],
	Audi: [
		"A3",
		"A4",
		"A5",
		"A6",
		"A7",
		"A8",
		"e-tron",
		"e-tron GT",
		"Q3",
		"Q4 e-tron",
		"Q5",
		"Q7",
		"Q8",
		"R8",
		"RS3",
		"RS5",
		"RS6",
		"RS7",
		"S3",
		"S4",
		"S5",
		"S6",
		"S8",
		"SQ5",
		"SQ7",
		"SQ8",
		"TT",
		"Other"
	],
	BMW: [
		"1 Series",
		"2 Series",
		"3 Series",
		"4 Series",
		"5 Series",
		"6 Series",
		"7 Series",
		"8 Series",
		"i3",
		"i4",
		"i5",
		"i7",
		"iX",
		"M2",
		"M3",
		"M4",
		"M5",
		"X1",
		"X2",
		"X3",
		"X4",
		"X5",
		"X6",
		"X7",
		"XM",
		"Z3",
		"Z4",
		"Other"
	],
	Buick: [
		"Cascada",
		"Century",
		"Enclave",
		"Encore",
		"Encore GX",
		"Envision",
		"Envista",
		"LaCrosse",
		"LeSabre",
		"Lucerne",
		"Park Avenue",
		"Rainier",
		"Regal",
		"Rendezvous",
		"Terraza",
		"Verano",
		"Other"
	],
	Cadillac: [
		"ATS",
		"CT4",
		"CT5",
		"CT6",
		"CTS",
		"DTS",
		"DeVille",
		"Eldorado",
		"Escalade",
		"Escalade ESV",
		"Escalade EXT",
		"Lyriq",
		"SRX",
		"STS",
		"XT4",
		"XT5",
		"XT6",
		"XTS",
		"Other"
	],
	Chevrolet: [
		"Astro",
		"Avalanche",
		"Aveo",
		"Blazer",
		"Blazer EV",
		"Bolt EUV",
		"Bolt EV",
		"Camaro",
		"Caprice",
		"Captiva",
		"Cavalier",
		"City Express",
		"Cobalt",
		"Colorado",
		"Corvette",
		"Cruze",
		"Equinox",
		"Express",
		"HHR",
		"Impala",
		"Malibu",
		"Monte Carlo",
		"S-10",
		"Silverado 1500",
		"Silverado 2500HD",
		"Silverado 3500HD",
		"Sonic",
		"Spark",
		"SS",
		"SSR",
		"Suburban",
		"Tahoe",
		"Trailblazer",
		"Traverse",
		"Trax",
		"Uplander",
		"Venture",
		"Volt",
		"Other"
	],
	Chrysler: [
		"200",
		"300",
		"Aspen",
		"Concorde",
		"Crossfire",
		"Pacifica",
		"PT Cruiser",
		"Sebring",
		"Town & Country",
		"Voyager",
		"Other"
	],
	Dodge: [
		"Avenger",
		"Caliber",
		"Caravan",
		"Challenger",
		"Charger",
		"Dakota",
		"Dart",
		"Durango",
		"Grand Caravan",
		"Hornet",
		"Journey",
		"Magnum",
		"Neon",
		"Nitro",
		"Ram 1500",
		"Ram 2500",
		"Stratus",
		"Viper",
		"Other"
	],
	Fiat: [
		"124 Spider",
		"500",
		"500L",
		"500X",
		"Other"
	],
	Ford: [
		"Bronco",
		"Bronco Sport",
		"C-Max",
		"Contour",
		"Crown Victoria",
		"E-Series",
		"E-Transit",
		"EcoSport",
		"Edge",
		"Escape",
		"Escort",
		"Excursion",
		"Expedition",
		"Explorer",
		"Explorer Sport Trac",
		"F-150",
		"F-250",
		"F-350",
		"Fiesta",
		"Five Hundred",
		"Flex",
		"Focus",
		"Freestar",
		"Freestyle",
		"Fusion",
		"Maverick",
		"Mustang",
		"Mustang Mach-E",
		"Probe",
		"Ranger",
		"Taurus",
		"Thunderbird",
		"Transit",
		"Transit Connect",
		"Windstar",
		"Other"
	],
	Genesis: [
		"Electrified GV70",
		"G70",
		"G80",
		"G90",
		"GV60",
		"GV70",
		"GV80",
		"Other"
	],
	GMC: [
		"Acadia",
		"Canyon",
		"Envoy",
		"Hummer EV",
		"Jimmy",
		"Safari",
		"Savana",
		"Sierra 1500",
		"Sierra 2500HD",
		"Sierra 3500HD",
		"Sonoma",
		"Terrain",
		"Yukon",
		"Yukon XL",
		"Other"
	],
	Honda: [
		"Accord",
		"Accord Hybrid",
		"Civic",
		"Civic Hatchback",
		"Civic Si",
		"Civic Type R",
		"Clarity",
		"CR-V",
		"CR-V Hybrid",
		"CR-Z",
		"Crosstour",
		"Element",
		"Fit",
		"HR-V",
		"Insight",
		"Odyssey",
		"Passport",
		"Pilot",
		"Prelude",
		"Prologue",
		"Ridgeline",
		"S2000",
		"Other"
	],
	Hyundai: [
		"Accent",
		"Azera",
		"Elantra",
		"Elantra GT",
		"Elantra Hybrid",
		"Elantra N",
		"Entourage",
		"Equus",
		"Genesis",
		"Genesis Coupe",
		"Ioniq",
		"Ioniq 5",
		"Ioniq 6",
		"Kona",
		"Kona Electric",
		"Palisade",
		"Santa Cruz",
		"Santa Fe",
		"Sonata",
		"Tucson",
		"Tucson Hybrid",
		"Veloster",
		"Venue",
		"Veracruz",
		"XG350",
		"Other"
	],
	Infiniti: [
		"EX35",
		"FX35",
		"FX45",
		"FX50",
		"G25",
		"G35",
		"G37",
		"I35",
		"JX35",
		"M35",
		"M37",
		"M45",
		"Q50",
		"Q60",
		"Q70",
		"QX30",
		"QX50",
		"QX55",
		"QX60",
		"QX70",
		"QX80",
		"Other"
	],
	Jaguar: [
		"E-PACE",
		"F-PACE",
		"F-TYPE",
		"I-PACE",
		"S-Type",
		"XE",
		"XF",
		"XJ",
		"XK",
		"X-Type",
		"Other"
	],
	Jeep: [
		"Cherokee",
		"Commander",
		"Compass",
		"Gladiator",
		"Grand Cherokee",
		"Grand Cherokee L",
		"Grand Wagoneer",
		"Liberty",
		"Patriot",
		"Renegade",
		"Wagoneer",
		"Wrangler",
		"Wrangler 4xe",
		"Other"
	],
	Kia: [
		"Borrego",
		"Cadenza",
		"Carnival",
		"EV6",
		"EV9",
		"Forte",
		"K4",
		"K5",
		"K900",
		"Niro",
		"Niro EV",
		"Optima",
		"Rio",
		"Rondo",
		"Sedona",
		"Seltos",
		"Sorento",
		"Soul",
		"Soul EV",
		"Spectra",
		"Sportage",
		"Stinger",
		"Telluride",
		"Other"
	],
	"Land Rover": [
		"Defender",
		"Discovery",
		"Discovery Sport",
		"Freelander",
		"LR2",
		"LR3",
		"LR4",
		"Range Rover",
		"Range Rover Evoque",
		"Range Rover Sport",
		"Range Rover Velar",
		"Other"
	],
	Lexus: [
		"CT",
		"ES",
		"GS",
		"GX",
		"HS",
		"IS",
		"LC",
		"LFA",
		"LS",
		"LX",
		"NX",
		"RC",
		"RX",
		"RZ",
		"SC",
		"TX",
		"UX",
		"Other"
	],
	Lincoln: [
		"Aviator",
		"Continental",
		"Corsair",
		"LS",
		"Mark LT",
		"MKC",
		"MKS",
		"MKT",
		"MKX",
		"MKZ",
		"Nautilus",
		"Navigator",
		"Town Car",
		"Zephyr",
		"Other"
	],
	Mazda: [
		"CX-3",
		"CX-30",
		"CX-5",
		"CX-50",
		"CX-7",
		"CX-9",
		"CX-90",
		"Mazda2",
		"Mazda3",
		"Mazda5",
		"Mazda6",
		"MX-5 Miata",
		"MX-30",
		"Protege",
		"RX-8",
		"Tribute",
		"Other"
	],
	"Mercedes-Benz": [
		"A-Class",
		"B-Class",
		"C-Class",
		"CL-Class",
		"CLA",
		"CLK",
		"CLS",
		"E-Class",
		"EQB",
		"EQE",
		"EQS",
		"G-Class",
		"GL-Class",
		"GLA",
		"GLB",
		"GLC",
		"GLE",
		"GLK",
		"GLS",
		"M-Class",
		"Metris",
		"S-Class",
		"SL",
		"SLC",
		"SLK",
		"Sprinter",
		"Other"
	],
	Mini: [
		"Clubman",
		"Convertible",
		"Cooper",
		"Countryman",
		"Hardtop",
		"Paceman",
		"Other"
	],
	Mitsubishi: [
		"Eclipse",
		"Eclipse Cross",
		"Endeavor",
		"Galant",
		"Lancer",
		"Mirage",
		"Montero",
		"Outlander",
		"Outlander Sport",
		"Outlander PHEV",
		"Other"
	],
	Nissan: [
		"350Z",
		"370Z",
		"Altima",
		"Armada",
		"cube",
		"Frontier",
		"GT-R",
		"Juke",
		"Kicks",
		"Leaf",
		"Maxima",
		"Murano",
		"NV200",
		"Pathfinder",
		"Quest",
		"Rogue",
		"Rogue Sport",
		"Sentra",
		"Titan",
		"Titan XD",
		"Versa",
		"Versa Note",
		"Xterra",
		"Z",
		"Other"
	],
	Pontiac: [
		"Aztek",
		"Bonneville",
		"Firebird",
		"G5",
		"G6",
		"G8",
		"Grand Am",
		"Grand Prix",
		"GTO",
		"Solstice",
		"Sunfire",
		"Torrent",
		"Vibe",
		"Other"
	],
	Porsche: [
		"718 Boxster",
		"718 Cayman",
		"911",
		"Cayenne",
		"Macan",
		"Panamera",
		"Taycan",
		"Other"
	],
	Ram: [
		"1500",
		"2500",
		"3500",
		"ProMaster",
		"ProMaster City",
		"Other"
	],
	Rivian: [
		"R1S",
		"R1T",
		"Other"
	],
	Saturn: [
		"Astra",
		"Aura",
		"Ion",
		"L-Series",
		"Outlook",
		"Relay",
		"Sky",
		"Vue",
		"Other"
	],
	Subaru: [
		"Ascent",
		"Baja",
		"BRZ",
		"Crosstrek",
		"Forester",
		"Impreza",
		"Legacy",
		"Outback",
		"Solterra",
		"SVX",
		"Tribeca",
		"WRX",
		"WRX STI",
		"XV Crosstrek",
		"Other"
	],
	Tesla: [
		"Cybertruck",
		"Model 3",
		"Model S",
		"Model X",
		"Model Y",
		"Other"
	],
	Toyota: [
		"4Runner",
		"86",
		"Avalon",
		"bZ4X",
		"C-HR",
		"Camry",
		"Camry Hybrid",
		"Celica",
		"Corolla",
		"Corolla Cross",
		"Corolla Hatchback",
		"Corolla Hybrid",
		"Crown",
		"FJ Cruiser",
		"GR86",
		"GR Corolla",
		"GR Supra",
		"Highlander",
		"Highlander Hybrid",
		"Land Cruiser",
		"Matrix",
		"Mirai",
		"Prius",
		"Prius C",
		"Prius Prime",
		"Prius V",
		"RAV4",
		"RAV4 Hybrid",
		"RAV4 Prime",
		"Sequoia",
		"Sienna",
		"Solara",
		"Supra",
		"Tacoma",
		"Tundra",
		"Venza",
		"Yaris",
		"Yaris iA",
		"Other"
	],
	Volkswagen: [
		"Arteon",
		"Atlas",
		"Atlas Cross Sport",
		"Beetle",
		"CC",
		"e-Golf",
		"Eos",
		"Golf",
		"Golf GTI",
		"Golf R",
		"ID.4",
		"ID. Buzz",
		"Jetta",
		"Passat",
		"Phaeton",
		"Routan",
		"Taos",
		"Tiguan",
		"Touareg",
		"Other"
	],
	Volvo: [
		"C30",
		"C40",
		"C70",
		"S40",
		"S60",
		"S80",
		"S90",
		"V50",
		"V60",
		"V90",
		"XC40",
		"XC60",
		"XC70",
		"XC90",
		"Other"
	]
};
var YEARS = [];
(function buildYears() {
	const now = (/* @__PURE__ */ new Date()).getFullYear() + 1;
	for (let y = now; y >= 1990; y--) YEARS.push(String(y));
})();
function vehicleKind(j) {
	const blob = `${j.make || ""} ${j.model || ""}`.toLowerCase();
	if (/f-150|f-250|f-350|f150|silverado|sierra|ram |tacoma|tundra|ranger|frontier|gladiator|ridgeline|canyon|colorado|maverick|titan|santa cruz|avalanche|cybertruck|r1t|1500|2500|3500|mark lt|baja|sonoma|dakota|s-10/.test(blob)) return "truck";
	if (/odyssey|pacifica|sienna|carnival|sedona|town & country|voyager|caravan|quest|entorage|uplander|venture|freestar|windstar|transit|promaster|express|savana|metris|sprinter|routan|mazda5|id. buzz/.test(blob)) return "van";
	if (/mustang|camaro|challenger|corvette|supra|370z|350z|gt-r|gtr|911|718|boxster|cayman|miata|mx-5|brz|gr86|86|s2000|nsx|viper|stinger|rc |z4|tt\b|r8|f-type|gr corolla|civic si|civic type r|elantra n|charger/.test(blob)) return "sports";
	if (/suv|crossover|rav4|cr-v|crv|hr-v|hrv|pilot|passport|prologue|highlander|4runner|sequoia|land cruiser|fj cruiser|venza|c-hr|corolla cross|tahoe|suburban|yukon|expedition|explorer|escape|edge|bronco|equinox|traverse|blazer|trailblazer|trax|acadia|terrain|envoy|wrangler|cherokee|compass|renegade|wagoneer|durango|journey|nitro|telluride|sorento|sportage|seltos|soul|niro|tucson|santa fe|palisade|kona|venue|veracruz|outback|forester|ascent|crosstrek|tribeca|solterra|cx-3|cx-30|cx-5|cx-50|cx-7|cx-9|cx-90|mdx|rdx|zdx|rx|gx|nx|ux|tx|lx|rz|x1|x2|x3|x4|x5|x6|x7|xm|ix\b|glc|gle|gls|gla|glb|glk|g-class|gl-class|m-class|eqb|q3|q4|q5|q7|q8|e-tron|tiguan|atlas|taos|touareg|id.4|xc40|xc60|xc70|xc90|c40|model y|model x|enclave|envision|encore|envista|xt4|xt5|xt6|escalade|srx|lyriq|aviator|nautilus|corsair|navigator|mkc|mkx|mkt|gv60|gv70|gv80|stelvio|tonale|macan|cayenne|discovery|defender|freelander|range rover|lr2|lr3|lr4|qx50|qx55|qx60|qx70|qx80|fx35|fx45|fx50|ex35|jx35|outlander|eclipse cross|endeavor|montero| Countryman|countryman|paceman|f-pace|e-pace|i-pace|r1s|hummer/.test(blob)) return "suv";
	return "sedan";
}
function carImage(j) {
	return "/img/car-" + vehicleKind(j) + ".jpg";
}
function homeFor(role) {
	if (role === "shop" || role === "independent") return "shopHome";
	return "home";
}
function readRefFromUrl() {
	if (typeof window === "undefined") return "";
	return (new URLSearchParams(window.location.search).get("ref") || "").trim().toUpperCase();
}
function slots() {
	const out = [];
	const start = /* @__PURE__ */ new Date();
	start.setHours(0, 0, 0, 0);
	for (let d = 1; d <= 7; d++) for (const t of [
		"08:00",
		"09:30",
		"11:00",
		"13:00",
		"14:30",
		"16:00"
	]) {
		const [h, m] = t.split(":").map(Number);
		const dt = new Date(start);
		dt.setDate(dt.getDate() + d);
		dt.setHours(h, m, 0, 0);
		if (dt.getDay() === 0) continue;
		out.push(dt);
	}
	return out;
}
function MechanicsApp() {
	const [view, setView] = (0, import_react.useState)("welcome");
	const [user, setUser] = (0, import_react.useState)(null);
	const [toast, setToast] = (0, import_react.useState)("");
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [lockedProvider, setLockedProvider] = (0, import_react.useState)(null);
	const [codeInput, setCodeInput] = (0, import_react.useState)("");
	const [tick, setTick] = (0, import_react.useState)(0);
	const bump = () => setTick((n) => n + 1);
	function flash(msg) {
		setToast(msg);
		setTimeout(() => setToast(""), 2200);
	}
	function enter(u) {
		setUser(u);
		const next = homeFor(u.role);
		if (u.role === "customer" && lockedProvider) setView("book");
		else setView(next);
		flash("Hi " + u.name.split(" ")[0]);
	}
	(0, import_react.useEffect)(() => {
		const fromUrl = readRefFromUrl();
		if (fromUrl) Store.setRefCode(fromUrl);
		const code = fromUrl || Store.getRefCode();
		if (code) {
			const p = Store.findProviderByCode(code);
			if (p) setLockedProvider(p);
		}
		const s = Store.getSession();
		if (s) {
			setUser(s);
			setView(s.role === "customer" && Store.getRefCode() ? "book" : homeFor(s.role));
		}
	}, []);
	function applyCode(raw, goBook = true) {
		const p = Store.findProviderByCode(raw);
		if (!p) {
			flash("No shop or mechanic with that code.");
			return;
		}
		Store.setRefCode(p.code);
		setLockedProvider(p);
		flash("Found " + p.name);
		if (goBook && user?.role === "customer") setView("book");
	}
	const isProvider = user?.role === "shop" || user?.role === "independent";
	const shareCode = Store.customerCodeFor(user);
	const liveLocked = lockedProvider ? Store.findProviderByCode(lockedProvider.code) || lockedProvider : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh max-w-[430px] flex-col bg-bg shadow-[0_0_0_1px_var(--color-line)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between px-5 pt-3 text-xs font-semibold text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mechanics Helper" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-dim",
					children: isProvider ? shareCode || "Bay" : lockedProvider?.code || "Bay"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: `flex-1 overflow-y-auto px-4 pb-36 pt-3 ${view === "welcome" || view === "login" || view === "register" ? "pb-16" : ""}`,
				children: [
					view === "welcome" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Welcome, {
						locked: liveLocked,
						codeInput,
						setCodeInput,
						onApply: () => applyCode(codeInput, false),
						onLogin: () => setView("login"),
						onRegister: () => setView("register")
					}),
					view === "login" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Login, {
						onBack: () => setView("welcome"),
						onOk: enter,
						onErr: flash,
						onRegister: () => setView("register")
					}),
					view === "register" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Register, {
						onBack: () => setView("welcome"),
						onOk: enter,
						onErr: flash
					}),
					view === "home" && user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerHome, {
						user,
						locked: liveLocked,
						codeInput,
						setCodeInput,
						onApply: () => applyCode(codeInput),
						onClear: () => {
							Store.setRefCode("");
							setLockedProvider(null);
							setCodeInput("");
							flash("Shop unlocked — pick anyone");
						},
						go: setView
					}),
					view === "book" && user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Book, {
						user,
						locked: liveLocked,
						onClear: () => {
							Store.setRefCode("");
							setLockedProvider(null);
							flash("Pick any shop or mechanic");
						},
						onBack: () => setView("home"),
						onBooked: (j) => {
							setDraft(j);
							setView("confirm");
						},
						onErr: flash
					}),
					view === "confirm" && draft && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Confirm, {
						job: draft,
						onTrack: () => {
							setSelectedId(draft.id);
							setView("track");
						},
						onHome: () => setView("home")
					}),
					view === "track" && user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Track, {
						user,
						onOpen: (id) => {
							setSelectedId(id);
							setView("job");
						},
						onBack: () => setView("home")
					}),
					view === "job" && selectedId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobDetail, {
						id: selectedId,
						shop: false,
						onBack: () => setView("track"),
						bump,
						tick
					}),
					view === "diagnose" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Diagnose, {
						onBack: () => setView("home"),
						onBook: (text) => {
							sessionStorage.setItem("mh.symptoms", text);
							setView("book");
						}
					}),
					view === "shopHome" && user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHome, {
						user,
						tick,
						shareCode,
						onShare: () => setView("share"),
						onOpen: (id) => {
							setSelectedId(id);
							setView("shopJob");
						}
					}),
					view === "shopJob" && selectedId && user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobDetail, {
						id: selectedId,
						shop: true,
						user,
						onBack: () => setView("shopHome"),
						bump,
						flash,
						tick
					}),
					view === "share" && user && shareCode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Top, {
						title: "Share with customers",
						onBack: () => setView("shopHome")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrShare, {
						code: shareCode,
						title: user.role === "independent" ? user.businessName || user.name : user.shopName || "Your shop",
						canRotate: user.role === "independent" || user.shopRole === "owner",
						rotateHint: user.role === "shop" ? "A new code also replaces the employee join code. Old printed QRs stop working." : "Old printed QRs stop working after you generate a new code.",
						onRotate: () => {
							const next = Store.rotateCustomerCode(user);
							setUser(Store.getSession());
							flash("New code: " + next);
							bump();
						}
					}, shareCode)] }),
					view === "account" && user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Account, {
						user,
						onBack: () => setView(homeFor(user.role)),
						onLogout: () => {
							Store.logout();
							setUser(null);
							setView("welcome");
						},
						flash,
						bump,
						onSaved: (u) => {
							setUser(u);
							bump();
						}
					})
				]
			}),
			user && ![
				"welcome",
				"login",
				"register"
			].includes(view) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-bg/95 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur",
				children: isProvider ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, {
							active: view === "shopHome" || view === "shopJob",
							onClick: () => setView("shopHome"),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { className: "size-5" }),
							label: "Jobs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, {
							active: view === "share",
							onClick: () => setView("share"),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-5" }),
							label: "Share"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, {
							active: view === "account",
							onClick: () => setView("account"),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "size-5" }),
							label: "Account"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, {
							active: view === "home",
							onClick: () => setView("home"),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "size-5" }),
							label: "Home"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, {
							active: view === "diagnose",
							onClick: () => setView("diagnose"),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-5" }),
							label: "Diagnose"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, {
							active: view === "book" || view === "confirm",
							onClick: () => setView("book"),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPlus, { className: "size-5" }),
							label: "Book"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, {
							active: view === "track" || view === "job",
							onClick: () => setView("track"),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-5" }),
							label: "My car"
						})
					]
				})
			}),
			toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed bottom-24 left-1/2 z-50 max-w-[380px] -translate-x-1/2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-900",
				children: toast
			}) : null
		]
	});
}
function Tab({ active, onClick, icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: `flex flex-col items-center gap-1 py-1 text-[11px] font-semibold ${active ? "text-accent" : "text-dim"}`,
		children: [icon, label]
	});
}
function Logo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/img/logo.jpg",
		alt: "",
		className: "size-10 rounded-[11px] object-cover"
	});
}
function Top({ title, onBack }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-4 flex items-center gap-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onBack,
			className: "grid size-9 place-items-center rounded-[10px] border border-line bg-surface",
			"aria-label": "Back",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-lg font-semibold",
			children: title
		})]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted",
			children: label
		}), children]
	});
}
var inputClass = "w-full rounded-xl border border-line bg-bg2 px-3 py-3 text-base text-fg outline-none focus:border-accent/60";
function Welcome({ locked, codeInput, setCodeInput, onApply, onLogin, onRegister }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex items-center gap-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-bold",
				children: "Mechanics Helper"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted",
				children: "Shop · Independent · Customer"
			})] })]
		}),
		locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 rounded-xl border border-accent/40 bg-accent/10 p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-wide text-accent",
					children: "You were referred"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 text-xl font-semibold",
					children: locked.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						locked.detail,
						" · code ",
						locked.code
					]
				}),
				locked.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-fg",
					children: locked.bio
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Log in as a customer to book this mechanic."
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-line bg-linear-to-br from-surface2 to-bg2 p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "text-[26px] font-bold leading-tight tracking-tight",
				children: [
					"Sign in to book",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					"or run the bay."
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Customers track repairs. Shops and independents share a find code so people land on the right bay."
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 rounded-xl border border-line bg-surface p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold uppercase tracking-wide text-muted",
				children: "Have a shop or mechanic code?"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					placeholder: "RIV4 or LEON",
					value: codeInput,
					onChange: (e) => setCodeInput(e.target.value.toUpperCase()),
					onKeyDown: (e) => {
						if (e.key === "Enter") onApply();
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onApply,
					className: "h-12 shrink-0 rounded-xl bg-accent px-4 font-semibold text-ink",
					children: "Find"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-col gap-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onLogin,
				className: "h-12 rounded-xl bg-accent font-semibold text-ink",
				children: "Log in"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onRegister,
				className: "h-12 rounded-xl border border-line bg-surface font-semibold",
				children: "Create an account"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 rounded-xl border border-line bg-surface p-4 text-sm text-muted",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold text-fg",
					children: "Demo logins · password demo123"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2",
					children: "Customer: maya@example.com"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Shop: shop@example.com" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Independent: indy@example.com" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2",
					children: "Find codes: RIV4 · LEON"
				})
			]
		})
	] });
}
function Login({ onBack, onOk, onErr, onRegister }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "flex flex-col gap-3",
		onSubmit: (e) => {
			e.preventDefault();
			const fd = new FormData(e.currentTarget);
			const res = Store.login(String(fd.get("id")), String(fd.get("pw")));
			if (!res.ok) return onErr(res.error);
			onOk(res.user);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Top, {
				title: "Log in",
				onBack
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Email or phone",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "id",
					className: inputClass,
					autoComplete: "username",
					required: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Password",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "pw",
					type: "password",
					className: inputClass,
					autoComplete: "current-password",
					required: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				className: "h-12 rounded-xl bg-accent font-semibold text-ink",
				children: "Log in"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onRegister,
				className: "h-12 rounded-xl border border-line bg-surface font-semibold",
				children: "Need an account?"
			})
		]
	});
}
function Register({ onBack, onOk, onErr }) {
	const [role, setRole] = (0, import_react.useState)("customer");
	const [join, setJoin] = (0, import_react.useState)("create");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "flex flex-col gap-3",
		onSubmit: (e) => {
			e.preventDefault();
			const fd = new FormData(e.currentTarget);
			const res = Store.register({
				name: String(fd.get("name")),
				email: String(fd.get("email")),
				phone: String(fd.get("phone")),
				password: String(fd.get("pw")),
				role,
				shopJoin: join,
				shopName: String(fd.get("shopName") || ""),
				shopCode: String(fd.get("shopCode") || ""),
				businessName: String(fd.get("biz") || ""),
				serviceMode: String(fd.get("mode") || "both")
			});
			if (!res.ok) return onErr(res.error);
			onOk(res.user);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Top, {
				title: "Create account",
				onBack
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Full name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "name",
					className: inputClass,
					required: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Email",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "email",
					type: "email",
					className: inputClass
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Phone",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "phone",
					inputMode: "tel",
					className: inputClass
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Password",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "pw",
					type: "password",
					className: inputClass,
					required: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-semibold uppercase tracking-wide text-muted",
				children: "I am"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex rounded-xl bg-bg2 p-1",
				children: [
					"customer",
					"shop",
					"independent"
				].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setRole(r),
					className: `flex-1 rounded-lg py-2 text-xs font-semibold capitalize ${role === r ? "bg-surface2" : "text-muted"}`,
					children: r === "independent" ? "Independent" : r === "shop" ? "Shop" : "Customer"
				}, r))
			}),
			role === "shop" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex rounded-xl bg-bg2 p-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setJoin("create"),
					className: `flex-1 rounded-lg py-2 text-xs font-semibold ${join === "create" ? "bg-surface2" : "text-muted"}`,
					children: "Create shop"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setJoin("join"),
					className: `flex-1 rounded-lg py-2 text-xs font-semibold ${join === "join" ? "bg-surface2" : "text-muted"}`,
					children: "Join shop"
				})]
			}), join === "create" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Shop name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "shopName",
					className: inputClass,
					placeholder: "Riverside Auto"
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Shop team code",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "shopCode",
					className: inputClass,
					placeholder: "RIV4"
				})
			})] }),
			role === "independent" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Business name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "biz",
					className: inputClass,
					placeholder: "Leon Mobile Repair"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "How you work",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "mode",
					className: inputClass,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "mobile",
							children: "I go to the customer"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "shop",
							children: "They come to me"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "both",
							children: "Both"
						})
					]
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				className: "h-12 rounded-xl bg-accent font-semibold text-ink",
				children: "Create account"
			})
		]
	});
}
function CustomerHome({ user, locked, codeInput, setCodeInput, onApply, onClear, go }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex items-center gap-2.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-bold",
						children: "Mechanics Helper"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "truncate text-xs text-muted",
						children: user.name
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => go("account"),
					className: "h-9 rounded-xl border border-line px-3 text-sm font-semibold",
					children: "Account"
				})
			]
		}),
		locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 rounded-xl border border-accent/40 bg-accent/10 p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-wide text-accent",
					children: "Booking with"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-semibold",
					children: locked.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						locked.detail,
						" · ",
						locked.code
					]
				}),
				locked.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-fg",
					children: locked.bio
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClear,
					className: "mt-2 text-sm font-semibold text-accent",
					children: "Choose a different shop"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-line bg-surface p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-[26px] font-bold leading-tight",
				children: "Get the car in. Stay in the loop."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Ask the helper, book a bay, and watch progress instead of calling the desk."
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 rounded-xl border border-line bg-surface p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold uppercase tracking-wide text-muted",
				children: "Have a shop or mechanic code?"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: inputClass,
					placeholder: "RIV4 or LEON",
					value: codeInput,
					onChange: (e) => setCodeInput(e.target.value.toUpperCase()),
					onKeyDown: (e) => {
						if (e.key === "Enter") onApply();
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onApply,
					className: "h-12 shrink-0 rounded-xl bg-accent px-4 font-semibold text-ink",
					children: "Find"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex flex-col gap-2.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => go("diagnose"),
					className: "h-12 rounded-xl bg-accent font-semibold text-ink",
					children: "Ask the helper"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => go("book"),
					className: "h-12 rounded-xl border border-line bg-surface font-semibold",
					children: "Book an appointment"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => go("track"),
					className: "h-12 rounded-xl border border-line bg-surface font-semibold",
					children: "Track a repair"
				})
			]
		})
	] });
}
function Book({ user, locked, onClear, onBack, onBooked, onErr }) {
	const providers = Store.listProviders();
	const [make, setMake] = (0, import_react.useState)("");
	const [pick, setPick] = (0, import_react.useState)(locked ? `${locked.type}:${locked.id}` : "");
	const models = make ? VEHICLE_DATA[make] || [] : [];
	const pending = typeof window === "undefined" ? "" : sessionStorage.getItem("mh.symptoms") || "";
	const picked = locked || providers.find((p) => `${p.type}:${p.id}` === pick) || null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "flex flex-col gap-3",
		onSubmit: (e) => {
			e.preventDefault();
			const f = e.currentTarget;
			const fd = new FormData(f);
			const [ptype, pid] = (locked ? `${locked.type}:${locked.id}` : String(fd.get("provider") || "")).split(":");
			const provider = providers.find((p) => p.id === pid && p.type === ptype);
			if (!provider) return onErr("Choose a shop or mechanic");
			const job = {
				id: Store.jobCode(),
				userId: user.id,
				createdAt: Date.now(),
				name: String(fd.get("name")),
				phone: String(fd.get("phone")).replace(/\D/g, ""),
				email: String(fd.get("email")),
				year: String(fd.get("year")),
				make: String(fd.get("make")),
				model: String(fd.get("model")),
				symptoms: String(fd.get("symptoms")),
				slot: new Date(String(fd.get("slot"))).toISOString(),
				status: "scheduled",
				providerId: provider.id,
				providerType: provider.type,
				providerName: provider.name,
				assignedTo: "",
				notes: [{
					at: Date.now(),
					text: "Booked from customer app.",
					by: "system"
				}]
			};
			if (!job.year || !job.make || !job.model || !job.symptoms || !fd.get("slot")) return onErr("Fill in all fields");
			Store.addJob(job);
			sessionStorage.removeItem("mh.symptoms");
			onBooked(job);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Top, {
				title: "New appointment",
				onBack
			}),
			locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm",
				children: [
					"Booking ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold",
						children: locked.name
					}),
					" · ",
					locked.code,
					locked.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-muted",
						children: locked.bio
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClear,
						className: "mt-1 block text-sm font-semibold text-accent",
						children: "Choose someone else"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
				label: "Who should get this job?",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "provider",
					className: inputClass,
					required: true,
					value: pick,
					onChange: (e) => setPick(e.target.value),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Choose a shop or mechanic"
					}), providers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: `${p.type}:${p.id}`,
						children: [
							p.name,
							" · ",
							p.code
						]
					}, p.type + p.id))]
				}), picked?.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: picked.bio
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Your name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					name: "name",
					className: inputClass,
					defaultValue: user.name,
					required: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Phone",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						name: "phone",
						className: inputClass,
						defaultValue: user.phone,
						required: true
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Email",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						name: "email",
						type: "email",
						className: inputClass,
						defaultValue: user.email
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Year",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						name: "year",
						className: inputClass,
						required: true,
						defaultValue: "",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Year"
						}), YEARS.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: y }, y))]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Make",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						name: "make",
						className: inputClass,
						required: true,
						value: make,
						onChange: (e) => setMake(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Make"
						}), Object.keys(VEHICLE_DATA).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: m }, m))]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Model",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "model",
					className: inputClass,
					required: true,
					defaultValue: "",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: make ? "Select model" : "Select make first"
					}), models.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: m }, m))]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "What’s going on?",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					name: "symptoms",
					className: inputClass + " min-h-28",
					required: true,
					defaultValue: pending
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Preferred time",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					name: "slot",
					className: inputClass,
					required: true,
					defaultValue: "",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Choose a slot"
					}), slots().map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: d.toISOString(),
						children: fmtWhen(d.toISOString())
					}, d.toISOString()))]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				className: "h-12 rounded-xl bg-accent font-semibold text-ink",
				children: "Request appointment"
			})
		]
	});
}
function Confirm({ job, onTrack, onHome }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Top, {
			title: "You’re on the board",
			onBack: onHome
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-line bg-surface p-4 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Job code"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-2xl tracking-[0.18em]",
					children: job.id
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: ["Going to ", job.providerName]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 overflow-hidden rounded-xl border border-line bg-surface",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: carImage(job),
				alt: "",
				className: "h-36 w-full object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-semibold",
					children: vehicleLabel(job)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: fmtWhen(job.slot)
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onTrack,
			className: "mt-4 h-12 w-full rounded-xl bg-accent font-semibold text-ink",
			children: "Track this job"
		})
	] });
}
function JobCard({ job, shop, onClick }) {
	const st = statusMeta(job.status);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "w-full rounded-xl border border-line bg-surface p-3.5 text-left",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: carImage(job),
				alt: "",
				className: "h-11 w-14 rounded-[10px] object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-bold uppercase tracking-wide text-dim",
						children: vehicleKind(job)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "truncate font-semibold",
						children: shop ? job.name : vehicleLabel(job)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-sm text-muted",
						children: [
							shop ? vehicleLabel(job) : job.name,
							" · ",
							job.id,
							job.assignedTo ? ` · ${job.assignedTo}` : "",
							!shop && job.providerName ? ` · ${job.providerName}` : ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold badge-${st.badge}`,
						children: shop ? st.label : st.customer
					})
				]
			})]
		})
	});
}
function Track({ user, onOpen, onBack }) {
	const [q, setQ] = (0, import_react.useState)("");
	const jobs = (0, import_react.useMemo)(() => q ? Store.findJobs(q, user) : Store.providerJobs(user), [q, user]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Top, {
			title: "Track a repair",
			onBack
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: inputClass,
			placeholder: "Job code or phone",
			value: q,
			onChange: (e) => setQ(e.target.value)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 flex flex-col gap-2.5",
			children: jobs.length ? jobs.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobCard, {
				job: j,
				shop: false,
				onClick: () => onOpen(j.id)
			}, j.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "p-6 text-center text-sm text-muted",
				children: "No jobs matched. Try MH-4821."
			})
		})
	] });
}
function ShopHome({ user, onOpen, onShare, shareCode, tick }) {
	const [filter, setFilter] = (0, import_react.useState)("active");
	const jobs = Store.providerJobs(user).slice().sort((a, b) => +new Date(a.slot) - +new Date(b.slot));
	const active = jobs.filter((j) => j.status !== "done");
	const ready = jobs.filter((j) => j.status === "ready").length;
	const busy = jobs.filter((j) => [
		"enroute",
		"checkedin",
		"diagnosing",
		"parts",
		"repair"
	].includes(j.status)).length;
	const list = filter === "ready" ? jobs.filter((j) => j.status === "ready") : filter === "all" ? jobs : active;
	const title = user.role === "independent" ? user.businessName || "Independent" : user.shopName || "Shop";
	const publicBio = user.role === "independent" ? user.bio || "" : user.shopId ? Store.shopRecord(user.shopId)?.bio || "" : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex items-center gap-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-bold",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted",
					children: user.role === "independent" ? "Your jobs" : user.name
				})]
			})]
		}),
		publicBio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-muted",
			children: publicBio
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 rounded-xl border border-line bg-surface p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-wide text-muted",
					children: "Customer find code"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-2xl tracking-[0.2em] text-accent",
					children: shareCode || "—"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onShare,
					className: "h-11 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-ink",
					children: "QR & share"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-dim",
				children: "Give this to customers so they book you, not a random shop."
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 grid grid-cols-3 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-line bg-surface py-3 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xl font-bold",
						children: active.length
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] text-muted",
						children: "Open"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-line bg-surface py-3 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xl font-bold",
						children: busy
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] text-muted",
						children: user.role === "independent" ? "Active" : "In bay"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-line bg-surface py-3 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xl font-bold",
						children: ready
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] text-muted",
						children: "Ready"
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-3 flex rounded-xl bg-bg2 p-1",
			children: [
				"active",
				"ready",
				"all"
			].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setFilter(f),
				className: `flex-1 rounded-lg py-2 text-xs font-semibold capitalize ${filter === f ? "bg-surface2" : "text-muted"}`,
				children: f === "active" ? "Open" : f
			}, f))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-2.5",
			children: [list.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JobCard, {
				job: j,
				shop: true,
				onClick: () => onOpen(j.id)
			}, j.id)), !list.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "p-6 text-center text-sm text-muted",
				children: "No jobs in this filter."
			})]
		})
	] });
}
function JobDetail({ id, shop, user, onBack, bump, flash, tick }) {
	const job = Store.load().jobs.find((j) => j.id === id);
	if (!job) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-muted",
		children: "Job not found."
	});
	const st = statusMeta(job.status);
	const idx = [
		"scheduled",
		"enroute",
		"checkedin",
		"diagnosing",
		"parts",
		"repair",
		"ready",
		"done"
	].indexOf(job.status);
	const shopRec = user?.shopId ? Store.shopRecord(user.shopId) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Top, {
			title: job.id,
			onBack
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overflow-hidden rounded-xl border border-line bg-surface",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: carImage(job),
				alt: "",
				className: "h-36 w-full object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-bold uppercase tracking-wide text-dim",
						children: vehicleKind(job)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: vehicleLabel(job)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							job.name,
							" · ",
							job.providerName
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold badge-${st.badge}`,
						children: shop ? st.label : st.customer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 rounded-xl bg-bg2 p-2.5 text-sm text-muted",
						children: job.symptoms
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-2 mt-4 font-semibold",
			children: "Progress"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: statusMeta && [
			"scheduled",
			"enroute",
			"checkedin",
			"diagnosing",
			"parts",
			"repair",
			"ready",
			"done"
		].map((s, i) => {
			const meta = statusMeta(s);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[18px_1fr] gap-3 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `mt-0.5 size-[18px] rounded-full border-2 ${i <= idx ? "border-accent bg-accent" : "border-dim"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm font-semibold",
					children: shop ? meta.label : meta.customer
				}), i === idx && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-xs text-dim",
					children: ["Current · ", fmtShort(job.notes.slice(-1)[0]?.at || job.createdAt)]
				})] })]
			}, s);
		}) }),
		shop && user?.role === "shop" && shopRec && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Assign technician",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: inputClass,
				defaultValue: job.assignedTo || "",
				onChange: (e) => {
					Store.updateJob(job.id, { assignedTo: e.target.value });
					flash?.("Assigned");
					bump();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "",
					children: "Unassigned"
				}), shopRec.techs.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: n }, n))]
			})
		}),
		shop && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted",
					children: "Move status"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-2",
					children: [
						"scheduled",
						"enroute",
						"checkedin",
						"diagnosing",
						"parts",
						"repair",
						"ready",
						"done"
					].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `rounded-xl border px-3 py-3 text-left text-sm ${job.status === s ? "border-accent bg-accent/10" : "border-line bg-surface"}`,
						onClick: () => {
							Store.updateJob(job.id, { status: s });
							Store.addNote(job.id, "Status set to " + statusMeta(s).label, "shop");
							flash?.("Status updated");
							bump();
						},
						children: statusMeta(s).label
					}, s))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-3",
					onSubmit: (e) => {
						e.preventDefault();
						const t = new FormData(e.currentTarget).get("note");
						const text = String(t || "").trim();
						if (!text) return;
						Store.addNote(job.id, text, "shop");
						e.currentTarget.reset();
						flash?.("Update sent to customer");
						bump();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Customer-facing update",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							name: "note",
							className: inputClass + " min-h-24",
							placeholder: "Pads and rotors installed."
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink",
						children: "Post update"
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-2 mt-4 font-semibold",
			children: "Updates"
		}),
		[...job.notes].reverse().map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 rounded-xl bg-bg2 p-2.5 text-sm text-muted",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
					className: "text-fg",
					children: n.by === "shop" ? "Shop update" : "System"
				}),
				" · ",
				fmtShort(n.at),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
				n.text
			]
		}, i))
	] });
}
function Diagnose({ onBack, onBook }) {
	const g = greet();
	const [messages, setMessages] = (0, import_react.useState)([{
		role: "bot",
		text: g.text,
		chips: g.chips
	}]);
	function send(text) {
		[...messages.filter((m) => m.role === "user").map((m) => m.text)];
		const res = reply(text);
		setMessages((m) => [
			...m,
			{
				role: "user",
				text
			},
			{
				role: "bot",
				text: res.text,
				chips: res.chips
			}
		]);
	}
	const userText = messages.filter((m) => m.role === "user").map((m) => m.text).join(" — ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Top, {
			title: "Shop helper",
			onBack
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-2.5",
			children: messages.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm ${m.role === "user" ? "self-end bg-accent font-medium text-ink" : "self-start border border-line bg-surface"}`,
				children: [
					m.role === "bot" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-1 text-[11px] font-semibold text-dim",
						children: "Helper"
					}),
					m.text,
					m.chips && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: m.chips.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "rounded-full border border-line bg-bg2 px-2.5 py-1 text-xs font-semibold text-muted",
							onClick: () => /book/i.test(c) ? onBook(userText || c) : send(c),
							children: c
						}, c))
					})
				]
			}, i))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-3 grid grid-cols-[1fr_auto] gap-2",
			onSubmit: (e) => {
				e.preventDefault();
				const input = e.currentTarget.elements.namedItem("chat");
				const val = input.value.trim();
				if (!val) return;
				send(val);
				input.value = "";
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				name: "chat",
				className: inputClass,
				placeholder: "2018 Civic, grinds when braking…"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				className: "h-12 rounded-xl bg-accent px-4 font-semibold text-ink",
				children: "Send"
			})]
		})
	] });
}
function Account({ user, onBack, onLogout, flash, bump, onSaved }) {
	const shop = user.shopId ? Store.shopRecord(user.shopId) : null;
	const canEditShop = user.role === "shop" && user.shopRole === "owner" && !!shop;
	const [shopName, setShopName] = (0, import_react.useState)(shop?.name || "");
	const [shopBio, setShopBio] = (0, import_react.useState)(shop?.bio || "");
	const [bizName, setBizName] = (0, import_react.useState)(user.businessName || user.name);
	const [indyBio, setIndyBio] = (0, import_react.useState)(user.bio || "");
	const [mode, setMode] = (0, import_react.useState)(user.serviceMode || "both");
	const [techName, setTechName] = (0, import_react.useState)("");
	const label = user.role === "shop" ? user.shopRole === "owner" ? "Shop owner" : "Shop technician" : user.role === "independent" ? "Independent mechanic" : "Customer";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Top, {
			title: "Account",
			onBack
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl border border-line bg-surface p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: user.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						user.email || "No email",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						user.phone || "No phone"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-2 inline-flex rounded-full bg-surface2 px-2 py-0.5 text-[11px] font-semibold",
					children: label
				})
			]
		}),
		shop && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-3 rounded-xl border border-line bg-surface p-4",
			onSubmit: (e) => {
				e.preventDefault();
				if (!canEditShop) return;
				const res = Store.updateShopProfile(user, {
					name: shopName,
					bio: shopBio
				});
				if (!res.ok) return flash(res.error);
				onSaved(res.user);
				flash("Shop profile saved");
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-wide text-muted",
					children: "Public shop profile"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-col gap-3",
					children: [canEditShop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Shop name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: inputClass,
							value: shopName,
							onChange: (e) => setShopName(e.target.value),
							required: true
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: shop.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Bio — what customers see",
						children: canEditShop ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: inputClass + " min-h-28",
							value: shopBio,
							maxLength: 320,
							onChange: (e) => setShopBio(e.target.value.slice(0, 320)),
							placeholder: "Brakes, diagnostics, how you work, what makes the bay yours."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-right text-xs text-dim tabular-nums",
							children: [
								shopBio.length,
								"/",
								320
							]
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: shop.bio || "The owner hasn’t written a bio yet."
						})
					})]
				}),
				canEditShop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink",
					children: "Save shop profile"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Team join code — employees use this when they create an account"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "my-2 font-mono text-2xl tracking-[0.2em]",
					children: shop.code
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: ["Team: ", shop.techs.join(", ")]
				}),
				canEditShop && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: inputClass,
						placeholder: "Add technician name",
						value: techName,
						onChange: (e) => setTechName(e.target.value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-12 shrink-0 rounded-xl border border-line px-3 font-semibold",
						onClick: () => {
							Store.addTechName(shop.id, techName);
							setTechName("");
							flash("Technician added");
							bump();
						},
						children: "Add"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-dim",
					children: "Customers use the same code (or the QR on Share) to find this shop."
				})
			]
		}),
		user.role === "independent" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-3 rounded-xl border border-line bg-surface p-4",
			onSubmit: (e) => {
				e.preventDefault();
				const res = Store.updateIndependentProfile(user, {
					businessName: bizName,
					bio: indyBio,
					serviceMode: mode
				});
				if (!res.ok) return flash(res.error);
				onSaved(res.user);
				flash("Profile saved");
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-wide text-muted",
					children: "Public mechanic profile"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Business name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: inputClass,
								value: bizName,
								onChange: (e) => setBizName(e.target.value),
								required: true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "How you work",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: inputClass,
								value: mode,
								onChange: (e) => setMode(e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "mobile",
										children: "I go to the customer"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "shop",
										children: "They come to me"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "both",
										children: "Both"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
							label: "Bio — what customers see",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: inputClass + " min-h-28",
								value: indyBio,
								maxLength: 320,
								onChange: (e) => setIndyBio(e.target.value.slice(0, 320)),
								placeholder: "Your specialties, how you work, and why they should pick you."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-right text-xs text-dim tabular-nums",
								children: [
									indyBio.length,
									"/",
									320
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "mt-2 h-12 w-full rounded-xl bg-accent font-semibold text-ink",
					children: "Save profile"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-dim",
					children: "Your customer QR is on the Share tab."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onLogout,
			className: "mt-4 h-12 w-full rounded-xl border border-line bg-surface font-semibold",
			children: "Log out"
		})
	] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MechanicsApp, {});
}
//#endregion
export { Home as component };
