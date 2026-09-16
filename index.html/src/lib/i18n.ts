export type Locale = "en" | "es";

export const LOCALES: Locale[] = ["en", "es"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_KEY = "mh.locale";

const en = {
  "app.name": "Mechanics Helper",
  "app.tagline": "Shop · Independent · Customer",
  "app.bay": "Bay",

  "lang.groupAria": "Language",
  "lang.en": "English",
  "lang.es": "Español",
  "lang.enShort": "EN",
  "lang.esShort": "ES",

  "nav.jobs": "Jobs",
  "nav.share": "Share",
  "nav.account": "Account",
  "nav.home": "Home",
  "nav.diagnose": "Diagnose",
  "nav.book": "Book",
  "nav.myCar": "My car",
  "nav.back": "Back",

  "welcome.referred": "You were referred",
  "welcome.referredCode": "{detail} · code {code}",
  "welcome.referredLogin": "Log in as a customer to book this mechanic.",
  "welcome.title1": "Sign in to book",
  "welcome.title2": "or run the bay.",
  "welcome.body":
    "Customers track repairs. Shops and independents share a find code so people land on the right bay.",
  "welcome.haveCode": "Have a shop or mechanic code?",
  "welcome.codePlaceholder": "RIV4 or LEON",
  "welcome.find": "Find",
  "welcome.login": "Log in",
  "welcome.createAccount": "Create an account",
  "welcome.demoLogins": "Demo logins · password demo123",
  "welcome.demoCustomer": "Customer: maya@example.com",
  "welcome.demoShop": "Shop: shop@example.com",
  "welcome.demoIndependent": "Independent: indy@example.com",
  "welcome.demoCodes": "Find codes: RIV4 · LEON",

  "login.title": "Log in",
  "login.id": "Email or phone",
  "login.password": "Password",
  "login.submit": "Log in",
  "login.needAccount": "Need an account?",

  "register.title": "Create account",
  "register.name": "Full name",
  "register.email": "Email",
  "register.phone": "Phone",
  "register.password": "Password",
  "register.iAm": "I am",
  "register.roleCustomer": "Customer",
  "register.roleShop": "Shop",
  "register.roleIndependent": "Independent",
  "register.createShop": "Create shop",
  "register.joinShop": "Join shop",
  "register.shopName": "Shop name",
  "register.shopNamePh": "Riverside Auto",
  "register.shopCode": "Shop team code",
  "register.shopCodePh": "RIV4",
  "register.bizName": "Business name",
  "register.bizPh": "Leon Mobile Repair",
  "register.howYouWork": "How you work",
  "register.modeMobile": "I go to the customer",
  "register.modeShop": "They come to me",
  "register.modeBoth": "Both",
  "register.submit": "Create account",

  "home.bookingWith": "Booking with",
  "home.chooseDifferent": "Choose a different shop",
  "home.headline": "Get the car in. Stay in the loop.",
  "home.sub": "Ask the helper, book a bay, and watch progress instead of calling the desk.",
  "home.askHelper": "Ask the helper",
  "home.bookAppt": "Book an appointment",
  "home.trackRepair": "Track a repair",
  "home.account": "Account",

  "book.title": "New appointment",
  "book.booking": "Booking {name} · {code}",
  "book.chooseElse": "Choose someone else",
  "book.who": "Who should get this job?",
  "book.chooseProvider": "Choose a shop or mechanic",
  "book.yourName": "Your name",
  "book.phone": "Phone",
  "book.email": "Email",
  "book.year": "Year",
  "book.make": "Make",
  "book.model": "Model",
  "book.selectModel": "Select model",
  "book.selectMakeFirst": "Select make first",
  "book.whatsGoingOn": "What’s going on?",
  "book.preferredTime": "Preferred time",
  "book.chooseSlot": "Choose a slot",
  "book.request": "Request appointment",

  "confirm.title": "You’re on the board",
  "confirm.jobCode": "Job code",
  "confirm.goingTo": "Going to {name}",
  "confirm.track": "Track this job",

  "track.title": "Track a repair",
  "track.placeholder": "Job code or phone",
  "track.empty": "No jobs matched. Try MH-4821.",

  "shop.yourJobs": "Your jobs",
  "shop.findCode": "Customer find code",
  "shop.qrShare": "QR & share",
  "shop.findHint": "Give this to customers so they book you, not a random shop.",
  "shop.open": "Open",
  "shop.active": "Active",
  "shop.inBay": "In bay",
  "shop.ready": "Ready",
  "shop.all": "All",
  "shop.empty": "No jobs in this filter.",
  "shop.independent": "Independent",
  "shop.shop": "Shop",
  "share.title": "Share with customers",
  "share.yourShop": "Your shop",
  "share.rotateShop":
    "A new code also replaces the employee join code. Old printed QRs stop working.",
  "share.rotateIndy": "Old printed QRs stop working after you generate a new code.",

  "job.notFound": "Job not found.",
  "job.progress": "Progress",
  "job.current": "Current · {when}",
  "job.assign": "Assign technician",
  "job.unassigned": "Unassigned",
  "job.moveStatus": "Move status",
  "job.customerUpdate": "Customer-facing update",
  "job.notePh": "Pads and rotors installed.",
  "job.postUpdate": "Post update",
  "job.updates": "Updates",
  "job.shopUpdate": "Shop update",
  "job.system": "System",

  "diag.title": "Shop helper",
  "diag.helper": "Helper",
  "diag.placeholder": "2018 Civic, grinds when braking…",
  "diag.send": "Send",
  "diag.greet":
    "I'm the shop helper. Tell me the year, make, and model if you have them, then what's going on — a noise, a light, a smell, a leak, or how it drives.\n\nI can narrow likely causes. If the car isn't safe to drive, say so.",
  "diag.chip.checkEngine": "Check engine light",
  "diag.chip.wontStart": "Won't start",
  "diag.chip.brakeNoise": "Brake noise",
  "diag.chip.overheating": "Overheating",
  "diag.chip.shaking": "Shaking",
  "diag.chip.leak": "Leak under the car",
  "diag.urgentTag": "Urgency: don't keep driving it if you can avoid it.",
  "diag.soonTag": "Urgency: book this week, sooner if it's changing fast.",
  "diag.normalTag": "Urgency: a normal appointment is fine unless something new shows up.",
  "diag.overheat.lead": "Overheating is one of the fastest ways to wreck an engine.",
  "diag.overheat.b1": "If the gauge is high or you see steam: pull over and shut it down.",
  "diag.overheat.b2": "Common causes: low coolant, thermostat, water pump, fan, head gasket.",
  "diag.overheat.b3": "Book a cooling-system check.",
  "diag.overheat.chip": "Book cooling-system check",
  "diag.nostart.lead": "A no-start is very bookable — we don't need you to guess the part.",
  "diag.nostart.b1": "Clicks usually mean a weak battery or a bad connection.",
  "diag.nostart.b2": "If it cranks but never catches, think fuel, spark, or a sensor.",
  "diag.nostart.chip": "Book no-start diagnosis",
  "diag.cel.lead": "A check-engine light is a stored fault code — a clue, not a parts list.",
  "diag.cel.b1": "We scan it first. Same light can be a gas cap or a misfire.",
  "diag.cel.b2": "A flashing light is an active misfire — don't ignore it.",
  "diag.cel.chip": "Book a scan + diagnosis",
  "diag.brake.lead": "Brake noise can be cheap wear indicators or pads that are gone.",
  "diag.brake.b1": "Tell us which end, and whether it happens cold or after a drive.",
  "diag.brake.b2": "A soft or sinking pedal is urgent — hydraulic problem.",
  "diag.brake.chip": "Book brake inspection",
  "diag.shake.lead": "Vibration is usually tires, a bent wheel, or rotors if it happens while braking.",
  "diag.shake.b1": "Note the mph when it starts and whether the steering wheel shakes.",
  "diag.shake.chip": "Book vibration diagnosis",
  "diag.leak.lead": "A drip is easier to find when it's still wet.",
  "diag.leak.b1": "Sweet green/orange is often coolant. Thick brown/black is oil.",
  "diag.leak.b2": "Park on cardboard overnight if you can.",
  "diag.leak.chip": "Book leak inspection",
  "diag.more":
    "Give me a bit more. For example: “2018 Civic, grinds when I brake going downhill.”",
  "diag.generic.lead": "I have enough to start a ticket, even if the cause isn't obvious yet.",
  "diag.generic.b1": "A good visit starts with what you feel/hear/smell and when it started.",
  "diag.generic.b2": "I can drop this description into a booking.",
  "diag.generic.chip": "Book this diagnosis",

  "account.title": "Account",
  "account.noEmail": "No email",
  "account.noPhone": "No phone",
  "account.shopOwner": "Shop owner",
  "account.shopTech": "Shop technician",
  "account.indyMech": "Independent mechanic",
  "account.customer": "Customer",
  "account.language": "Language",
  "account.languageHint": "Choose English or Spanish. Your choice is saved on this device.",
  "account.publicShop": "Public shop profile",
  "account.shopName": "Shop name",
  "account.bioCustomers": "Bio — what customers see",
  "account.shopBioPh": "Brakes, diagnostics, how you work, what makes the bay yours.",
  "account.noBio": "The owner hasn’t written a bio yet.",
  "account.saveShop": "Save shop profile",
  "account.teamCode": "Team join code — employees use this when they create an account",
  "account.team": "Team: {names}",
  "account.addTechPh": "Add technician name",
  "account.add": "Add",
  "account.customersUseCode": "Customers use the same code (or the QR on Share) to find this shop.",
  "account.publicMech": "Public mechanic profile",
  "account.bizName": "Business name",
  "account.howYouWork": "How you work",
  "account.indyBioPh": "Your specialties, how you work, and why they should pick you.",
  "account.saveProfile": "Save profile",
  "account.qrOnShare": "Your customer QR is on the Share tab.",
  "account.logout": "Log out",

  "qr.findCode": "Customer find code",
  "qr.hint":
    "Print, text, or leave on the counter. Customers scan or type this and book you — not a random shop.",
  "qr.fourLetter": "4-letter find code",
  "qr.copied": "Copied",
  "qr.copyCode": "Copy code",
  "qr.copyLink": "Copy link",
  "qr.saveQr": "Save QR",
  "qr.share": "Share",
  "qr.newCode": "Generate a new code",
  "qr.shareText": "Book with {title}. Find code {code}",
  "qr.alt": "QR code for {code}",

  "toast.hi": "Hi {name}",
  "toast.noCode": "No shop or mechanic with that code.",
  "toast.found": "Found {name}",
  "toast.unlocked": "Shop unlocked — pick anyone",
  "toast.pickAny": "Pick any shop or mechanic",
  "toast.newCode": "New code: {code}",
  "toast.assigned": "Assigned",
  "toast.statusUpdated": "Status updated",
  "toast.updateSent": "Update sent to customer",
  "toast.shopSaved": "Shop profile saved",
  "toast.techAdded": "Technician added",
  "toast.profileSaved": "Profile saved",

  "err.chooseProvider": "Choose a shop or mechanic",
  "err.fillAll": "Fill in all fields",
  "err.loginWrong": "Email/phone or password is wrong.",
  "err.registerRequired": "Name, password, and email or phone are required.",
  "err.passwordShort": "Password must be at least 6 characters.",
  "err.accountExists": "That email or phone already has an account.",
  "err.noShopCode": "No shop with that code.",
  "err.onlyOwner": "Only the shop owner can edit this.",
  "err.shopNotFound": "Shop not found.",
  "err.shopNameRequired": "Shop name is required.",
  "err.onlyIndy": "Only independents can edit this.",
  "err.accountNotFound": "Account not found.",
  "err.bizNameRequired": "Business name is required.",

  "status.scheduled.label": "Scheduled",
  "status.scheduled.customer": "Appointment booked",
  "status.enroute.label": "On the way",
  "status.enroute.customer": "Mechanic is heading to you",
  "status.checkedin.label": "Checked in",
  "status.checkedin.customer": "Vehicle is with the mechanic",
  "status.diagnosing.label": "Diagnosing",
  "status.diagnosing.customer": "Technician is inspecting the vehicle",
  "status.parts.label": "Waiting on parts",
  "status.parts.customer": "Parts ordered — we'll update when they arrive",
  "status.repair.label": "In repair",
  "status.repair.customer": "Work is underway",
  "status.ready.label": "Ready for pickup",
  "status.ready.customer": "Your vehicle is ready",
  "status.done.label": "Completed",
  "status.done.customer": "Picked up — thank you",

  "kind.truck": "truck",
  "kind.van": "van",
  "kind.sports": "sports",
  "kind.suv": "suv",
  "kind.sedan": "sedan",

  "detail.repairShop": "Repair shop",
  "detail.mobile": "Mobile mechanic",
  "detail.indyShop": "Independent shop",
  "detail.mobileOrDrop": "Mobile or drop-off",

  "note.bookedApp": "Booked from customer app.",
  "note.bookedOnline": "Booked online.",
  "note.statusSet": "Status set to {label}",

  "vehicle.other": "Other",

  "error.title": "Something went wrong",
  "error.fallback": "An unexpected error occurred. Try reloading the page.",
} as const;

export type MessageKey = keyof typeof en;

const es: Record<MessageKey, string> = {
  "app.name": "Mechanics Helper",
  "app.tagline": "Taller · Independiente · Cliente",
  "app.bay": "Bahía",

  "lang.groupAria": "Idioma",
  "lang.en": "English",
  "lang.es": "Español",
  "lang.enShort": "EN",
  "lang.esShort": "ES",

  "nav.jobs": "Trabajos",
  "nav.share": "Compartir",
  "nav.account": "Cuenta",
  "nav.home": "Inicio",
  "nav.diagnose": "Diagnóstico",
  "nav.book": "Cita",
  "nav.myCar": "Mi auto",
  "nav.back": "Atrás",

  "welcome.referred": "Te recomendaron",
  "welcome.referredCode": "{detail} · código {code}",
  "welcome.referredLogin": "Inicia sesión como cliente para reservar con este mecánico.",
  "welcome.title1": "Inicia sesión para reservar",
  "welcome.title2": "o atender el taller.",
  "welcome.body":
    "Los clientes siguen las reparaciones. Talleres e independientes comparten un código para que la gente llegue al lugar correcto.",
  "welcome.haveCode": "¿Tienes un código de taller o mecánico?",
  "welcome.codePlaceholder": "RIV4 o LEON",
  "welcome.find": "Buscar",
  "welcome.login": "Iniciar sesión",
  "welcome.createAccount": "Crear una cuenta",
  "welcome.demoLogins": "Accesos de demo · contraseña demo123",
  "welcome.demoCustomer": "Cliente: maya@example.com",
  "welcome.demoShop": "Taller: shop@example.com",
  "welcome.demoIndependent": "Independiente: indy@example.com",
  "welcome.demoCodes": "Códigos: RIV4 · LEON",

  "login.title": "Iniciar sesión",
  "login.id": "Correo o teléfono",
  "login.password": "Contraseña",
  "login.submit": "Iniciar sesión",
  "login.needAccount": "¿Necesitas una cuenta?",

  "register.title": "Crear cuenta",
  "register.name": "Nombre completo",
  "register.email": "Correo",
  "register.phone": "Teléfono",
  "register.password": "Contraseña",
  "register.iAm": "Soy",
  "register.roleCustomer": "Cliente",
  "register.roleShop": "Taller",
  "register.roleIndependent": "Independiente",
  "register.createShop": "Crear taller",
  "register.joinShop": "Unirme al taller",
  "register.shopName": "Nombre del taller",
  "register.shopNamePh": "Riverside Auto",
  "register.shopCode": "Código de equipo del taller",
  "register.shopCodePh": "RIV4",
  "register.bizName": "Nombre del negocio",
  "register.bizPh": "Leon Mobile Repair",
  "register.howYouWork": "Cómo trabajas",
  "register.modeMobile": "Voy al cliente",
  "register.modeShop": "Ellos vienen a mí",
  "register.modeBoth": "Ambos",
  "register.submit": "Crear cuenta",

  "home.bookingWith": "Reservando con",
  "home.chooseDifferent": "Elegir otro taller",
  "home.headline": "Lleva el auto. Entérate de todo.",
  "home.sub": "Pregunta al asistente, reserva un espacio y sigue el avance sin llamar al mostrador.",
  "home.askHelper": "Preguntar al asistente",
  "home.bookAppt": "Reservar una cita",
  "home.trackRepair": "Seguir una reparación",
  "home.account": "Cuenta",

  "book.title": "Nueva cita",
  "book.booking": "Reservando con {name} · {code}",
  "book.chooseElse": "Elegir a otra persona",
  "book.who": "¿Quién debe recibir este trabajo?",
  "book.chooseProvider": "Elige un taller o mecánico",
  "book.yourName": "Tu nombre",
  "book.phone": "Teléfono",
  "book.email": "Correo",
  "book.year": "Año",
  "book.make": "Marca",
  "book.model": "Modelo",
  "book.selectModel": "Selecciona el modelo",
  "book.selectMakeFirst": "Primero elige la marca",
  "book.whatsGoingOn": "¿Qué le pasa al auto?",
  "book.preferredTime": "Horario preferido",
  "book.chooseSlot": "Elige un horario",
  "book.request": "Solicitar cita",

  "confirm.title": "Ya estás en la lista",
  "confirm.jobCode": "Código del trabajo",
  "confirm.goingTo": "Va a {name}",
  "confirm.track": "Seguir este trabajo",

  "track.title": "Seguir una reparación",
  "track.placeholder": "Código o teléfono",
  "track.empty": "No hay trabajos. Prueba con MH-4821.",

  "shop.yourJobs": "Tus trabajos",
  "shop.findCode": "Código para clientes",
  "shop.qrShare": "QR y compartir",
  "shop.findHint": "Dáselo a tus clientes para que te reserven a ti, no a un taller al azar.",
  "shop.open": "Abiertos",
  "shop.active": "Activos",
  "shop.inBay": "En bahía",
  "shop.ready": "Listos",
  "shop.all": "Todos",
  "shop.empty": "No hay trabajos en este filtro.",
  "shop.independent": "Independiente",
  "shop.shop": "Taller",
  "share.title": "Compartir con clientes",
  "share.yourShop": "Tu taller",
  "share.rotateShop":
    "Un código nuevo también reemplaza el código de ingreso de empleados. Los QR impresos dejan de funcionar.",
  "share.rotateIndy": "Los QR impresos dejan de funcionar cuando generas un código nuevo.",

  "job.notFound": "Trabajo no encontrado.",
  "job.progress": "Progreso",
  "job.current": "Actual · {when}",
  "job.assign": "Asignar técnico",
  "job.unassigned": "Sin asignar",
  "job.moveStatus": "Cambiar estado",
  "job.customerUpdate": "Actualización para el cliente",
  "job.notePh": "Balatas y discos instalados.",
  "job.postUpdate": "Publicar actualización",
  "job.updates": "Actualizaciones",
  "job.shopUpdate": "Actualización del taller",
  "job.system": "Sistema",

  "diag.title": "Asistente del taller",
  "diag.helper": "Asistente",
  "diag.placeholder": "Civic 2018, rechina al frenar…",
  "diag.send": "Enviar",
  "diag.greet":
    "Soy el asistente del taller. Dime el año, la marca y el modelo si los tienes, y luego qué ocurre: un ruido, una luz, un olor, una fuga o cómo se conduce.\n\nPuedo acotar las causas más probables. Si el auto no es seguro para manejar, dímelo.",
  "diag.chip.checkEngine": "Luz del motor",
  "diag.chip.wontStart": "No arranca",
  "diag.chip.brakeNoise": "Ruido de frenos",
  "diag.chip.overheating": "Se sobrecalienta",
  "diag.chip.shaking": "Vibra",
  "diag.chip.leak": "Fuga debajo del auto",
  "diag.urgentTag": "Urgencia: no sigas manejando si puedes evitarlo.",
  "diag.soonTag": "Urgencia: reserva esta semana; antes si empeora rápido.",
  "diag.normalTag": "Urgencia: una cita normal está bien, salvo que aparezca algo nuevo.",
  "diag.overheat.lead": "El sobrecalentamiento es una de las formas más rápidas de dañar el motor.",
  "diag.overheat.b1": "Si el indicador está alto o ves vapor: oríllate y apaga el motor.",
  "diag.overheat.b2": "Causas comunes: poco refrigerante, termostato, bomba de agua, ventilador, junta de cabeza.",
  "diag.overheat.b3": "Reserva una revisión del sistema de enfriamiento.",
  "diag.overheat.chip": "Reservar revisión de enfriamiento",
  "diag.nostart.lead": "Si no arranca, conviene agendarlo: no hace falta que adivines la pieza.",
  "diag.nostart.b1": "Los clics suelen ser batería débil o una mala conexión.",
  "diag.nostart.b2": "Si gira pero no prende, piensa en combustible, chispa o un sensor.",
  "diag.nostart.chip": "Reservar diagnóstico de no arranque",
  "diag.cel.lead": "La luz del motor es un código guardado: una pista, no una lista de piezas.",
  "diag.cel.b1": "Primero lo escaneamos. La misma luz puede ser el tapón de gasolina o una falla de encendido.",
  "diag.cel.b2": "Si parpadea, hay una falla activa: no la ignores.",
  "diag.cel.chip": "Reservar escaneo y diagnóstico",
  "diag.brake.lead": "El ruido de frenos puede ser un testigo barato o balatas ya gastadas.",
  "diag.brake.b1": "Dinos en qué eje y si ocurre en frío o después de manejar.",
  "diag.brake.b2": "Un pedal suave o que se hunde es urgente: problema hidráulico.",
  "diag.brake.chip": "Reservar inspección de frenos",
  "diag.shake.lead": "La vibración suele ser llantas, un rin doblado o discos si ocurre al frenar.",
  "diag.shake.b1": "Anota a qué velocidad empieza y si tiembla el volante.",
  "diag.shake.chip": "Reservar diagnóstico de vibración",
  "diag.leak.lead": "Una gotera es más fácil de encontrar cuando todavía está mojada.",
  "diag.leak.b1": "Verde/naranja dulce suele ser refrigerante. Marrón/negro espeso es aceite.",
  "diag.leak.b2": "Si puedes, deja el auto sobre cartón durante la noche.",
  "diag.leak.chip": "Reservar inspección de fuga",
  "diag.more":
    "Dame un poco más. Por ejemplo: “Civic 2018, rechina cuando freno bajando.”",
  "diag.generic.lead": "Tengo suficiente para abrir un ticket, aunque la causa aún no sea obvia.",
  "diag.generic.b1": "Una buena visita empieza con lo que sientes, oyes u hueles y cuándo empezó.",
  "diag.generic.b2": "Puedo pasar esta descripción a una reserva.",
  "diag.generic.chip": "Reservar este diagnóstico",

  "account.title": "Cuenta",
  "account.noEmail": "Sin correo",
  "account.noPhone": "Sin teléfono",
  "account.shopOwner": "Dueño del taller",
  "account.shopTech": "Técnico del taller",
  "account.indyMech": "Mecánico independiente",
  "account.customer": "Cliente",
  "account.language": "Idioma",
  "account.languageHint": "Elige inglés o español. Tu elección se guarda en este dispositivo.",
  "account.publicShop": "Perfil público del taller",
  "account.shopName": "Nombre del taller",
  "account.bioCustomers": "Bio — lo que ven los clientes",
  "account.shopBioPh": "Frenos, diagnóstico, cómo trabajan y qué hace único al taller.",
  "account.noBio": "El dueño todavía no ha escrito una bio.",
  "account.saveShop": "Guardar perfil del taller",
  "account.teamCode": "Código de equipo — los empleados lo usan al crear su cuenta",
  "account.team": "Equipo: {names}",
  "account.addTechPh": "Nombre del técnico",
  "account.add": "Agregar",
  "account.customersUseCode": "Los clientes usan el mismo código (o el QR en Compartir) para encontrar este taller.",
  "account.publicMech": "Perfil público del mecánico",
  "account.bizName": "Nombre del negocio",
  "account.howYouWork": "Cómo trabajas",
  "account.indyBioPh": "Tus especialidades, cómo trabajas y por qué deberían elegirte.",
  "account.saveProfile": "Guardar perfil",
  "account.qrOnShare": "Tu QR para clientes está en la pestaña Compartir.",
  "account.logout": "Cerrar sesión",

  "qr.findCode": "Código para clientes",
  "qr.hint":
    "Imprímelo, envíalo o déjalo en el mostrador. Los clientes lo escanean o lo escriben y te reservan a ti, no a un taller al azar.",
  "qr.fourLetter": "Código de 4 letras",
  "qr.copied": "Copiado",
  "qr.copyCode": "Copiar código",
  "qr.copyLink": "Copiar enlace",
  "qr.saveQr": "Guardar QR",
  "qr.share": "Compartir",
  "qr.newCode": "Generar un código nuevo",
  "qr.shareText": "Reserva con {title}. Código {code}",
  "qr.alt": "Código QR de {code}",

  "toast.hi": "Hola {name}",
  "toast.noCode": "No hay taller ni mecánico con ese código.",
  "toast.found": "Encontramos {name}",
  "toast.unlocked": "Taller desbloqueado — elige a cualquiera",
  "toast.pickAny": "Elige cualquier taller o mecánico",
  "toast.newCode": "Código nuevo: {code}",
  "toast.assigned": "Asignado",
  "toast.statusUpdated": "Estado actualizado",
  "toast.updateSent": "Actualización enviada al cliente",
  "toast.shopSaved": "Perfil del taller guardado",
  "toast.techAdded": "Técnico agregado",
  "toast.profileSaved": "Perfil guardado",

  "err.chooseProvider": "Elige un taller o mecánico",
  "err.fillAll": "Completa todos los campos",
  "err.loginWrong": "El correo/teléfono o la contraseña es incorrecta.",
  "err.registerRequired": "Se requieren nombre, contraseña y correo o teléfono.",
  "err.passwordShort": "La contraseña debe tener al menos 6 caracteres.",
  "err.accountExists": "Ese correo o teléfono ya tiene una cuenta.",
  "err.noShopCode": "No hay un taller con ese código.",
  "err.onlyOwner": "Solo el dueño del taller puede editar esto.",
  "err.shopNotFound": "Taller no encontrado.",
  "err.shopNameRequired": "El nombre del taller es obligatorio.",
  "err.onlyIndy": "Solo los independientes pueden editar esto.",
  "err.accountNotFound": "Cuenta no encontrada.",
  "err.bizNameRequired": "El nombre del negocio es obligatorio.",

  "status.scheduled.label": "Programado",
  "status.scheduled.customer": "Cita reservada",
  "status.enroute.label": "En camino",
  "status.enroute.customer": "El mecánico va hacia ti",
  "status.checkedin.label": "Recibido",
  "status.checkedin.customer": "El vehículo está con el mecánico",
  "status.diagnosing.label": "Diagnosticando",
  "status.diagnosing.customer": "El técnico está revisando el vehículo",
  "status.parts.label": "Esperando piezas",
  "status.parts.customer": "Piezas pedidas — te avisamos cuando lleguen",
  "status.repair.label": "En reparación",
  "status.repair.customer": "El trabajo está en curso",
  "status.ready.label": "Listo para recoger",
  "status.ready.customer": "Tu vehículo está listo",
  "status.done.label": "Completado",
  "status.done.customer": "Recogido — gracias",

  "kind.truck": "camioneta",
  "kind.van": "van",
  "kind.sports": "deportivo",
  "kind.suv": "suv",
  "kind.sedan": "sedán",

  "detail.repairShop": "Taller de reparación",
  "detail.mobile": "Mecánico a domicilio",
  "detail.indyShop": "Taller independiente",
  "detail.mobileOrDrop": "A domicilio o en taller",

  "note.bookedApp": "Reservado desde la app del cliente.",
  "note.bookedOnline": "Reservado en línea.",
  "note.statusSet": "Estado cambiado a {label}",

  "vehicle.other": "Otro",

  "error.title": "Algo salió mal",
  "error.fallback": "Ocurrió un error inesperado. Intenta recargar la página.",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, es };

const STORE_ERROR_KEYS: Record<string, MessageKey> = {
  "Email/phone or password is wrong.": "err.loginWrong",
  "Name, password, and email or phone are required.": "err.registerRequired",
  "Password must be at least 6 characters.": "err.passwordShort",
  "That email or phone already has an account.": "err.accountExists",
  "No shop with that code.": "err.noShopCode",
  "Only the shop owner can edit this.": "err.onlyOwner",
  "Shop not found.": "err.shopNotFound",
  "Shop name is required.": "err.shopNameRequired",
  "Only independents can edit this.": "err.onlyIndy",
  "Account not found.": "err.accountNotFound",
  "Business name is required.": "err.bizNameRequired",
};

const DETAIL_KEYS: Record<string, MessageKey> = {
  "Repair shop": "detail.repairShop",
  "Mobile mechanic": "detail.mobile",
  "Independent shop": "detail.indyShop",
  "Mobile or drop-off": "detail.mobileOrDrop",
};

const NOTE_KEYS: Record<string, MessageKey> = {
  "Booked from customer app.": "note.bookedApp",
  "Booked online.": "note.bookedOnline",
};

const STATUS_LABEL_EN: Record<string, string> = {
  Scheduled: "scheduled",
  "On the way": "enroute",
  "Checked in": "checkedin",
  Diagnosing: "diagnosing",
  "Waiting on parts": "parts",
  "In repair": "repair",
  "Ready for pickup": "ready",
  Completed: "done",
};

export type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}

export function readLocale(): Locale {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_LOCALE;
    const raw = localStorage.getItem(LOCALE_KEY);
    return isLocale(raw) ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeLocale(locale: Locale) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* ignore quota / private mode */
  }
}

export function localeTag(locale: Locale): string {
  return locale === "es" ? "es" : "en-US";
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined || vars[key] === null ? "" : String(vars[key]),
  );
}

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const table = messages[locale] || messages.en;
  return interpolate(table[key] ?? messages.en[key] ?? key, vars);
}

export function translateStoreError(locale: Locale, error: string): string {
  const key = STORE_ERROR_KEYS[error];
  return key ? translate(locale, key) : error;
}

export function translateDetail(locale: Locale, detail: string): string {
  const key = DETAIL_KEYS[detail];
  return key ? translate(locale, key) : detail;
}

export function translateNote(locale: Locale, text: string): string {
  const direct = NOTE_KEYS[text];
  if (direct) return translate(locale, direct);
  const statusMatch = text.match(/^Status set to (.+)$/);
  if (statusMatch) {
    const id = STATUS_LABEL_EN[statusMatch[1]];
    const label = id
      ? translate(locale, `status.${id}.label` as MessageKey)
      : statusMatch[1];
    return translate(locale, "note.statusSet", { label });
  }
  return text;
}

export function statusText(
  locale: Locale,
  id: string,
  audience: "shop" | "customer",
): string {
  const key = `status.${id}.${audience === "shop" ? "label" : "customer"}` as MessageKey;
  if (key in messages.en) return translate(locale, key);
  return id;
}

export function kindText(locale: Locale, kind: string): string {
  const key = `kind.${kind}` as MessageKey;
  if (key in messages.en) return translate(locale, key);
  return kind;
}

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}
