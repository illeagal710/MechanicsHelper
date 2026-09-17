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

  "theme.groupAria": "Theme",
  "theme.light": "Light",
  "theme.dark": "Dark",

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
    "Customers track repairs. Shops and independents each get a QR or referral code so people land on the right bay.",
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
  "login.forgot": "Forgot username or password?",

  "recover.title": "Account recovery",
  "recover.body": "Use the email or phone already on the account.",
  "recover.forgotPassword": "Forgot password",
  "recover.forgotUsername": "Forgot username",
  "recover.backToLogin": "Back to log in",

  "recover.pw.title": "Reset password",
  "recover.pw.id": "Email or phone",
  "recover.pw.send": "Send reset code",
  "recover.pw.sending": "Sending…",
  "recover.pw.code": "Reset code",
  "recover.pw.new": "New password",
  "recover.pw.confirm": "Confirm new password",
  "recover.pw.submit": "Set new password",
  "recover.pw.saving": "Saving…",
  "recover.pw.sentEmail": "If an account exists, we emailed a 6-digit code. It expires in 15 minutes.",
  "recover.pw.sentDev": "If an account exists, a 6-digit preview code appears below. It expires in 15 minutes.",
  "recover.pw.sentStub": "If an account exists, a reset code was saved. Email delivery is not connected on this server yet.",
  "recover.pw.devCode": "Preview code (not emailed)",
  "recover.pw.mismatch": "New passwords do not match.",
  "recover.pw.done": "Password updated. Log in with the new password.",

  "recover.user.title": "Find username",
  "recover.user.id": "Email or phone",
  "recover.user.submit": "Find username",
  "recover.user.searching": "Looking…",
  "recover.user.emptyTitle": "No account found",
  "recover.user.empty": "No account matches that email or phone.",
  "recover.user.found": "Account on file",
  "recover.user.login": "Username / login",
  "recover.user.name": "Name",
  "recover.user.email": "Email",
  "recover.user.phone": "Phone",
  "recover.user.none": "Not on file",
  "recover.user.emailed": "If this account has email and mail is connected, we also sent the login there.",

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
  "home.chooseDifferent": "Use a different find code",
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
  "book.withShop": "Booking with {name}",
  "book.linkTitle": "Link your shop",
  "book.linkHint":
    "Enter the find code from your shop’s QR or referral. This is not a directory of shops.",
  "book.linkCta": "Link shop",
  "book.backHome": "Back to Home",
  "book.yourName": "Your name",
  "book.phone": "Phone",
  "book.email": "Email",
  "book.year": "Year",
  "book.make": "Make",
  "book.model": "Model",
  "book.selectModel": "Select model",
  "book.selectMakeFirst": "Select make first",
  "book.whatsGoingOn": "What’s going on? (optional)",
  "book.symptomsHint": "Optional — you can book with this blank.",
  "book.symptomsPh": "Noise, light, leak, or how it drives",
  "book.noSymptoms": "No description",
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
  "shop.history": "History",
  "shop.empty": "No jobs in this filter.",
  "shop.historyEmpty": "No completed or declined jobs yet.",
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
  "job.shopUpdate": "Bay update",
  "job.bayUpdate": "Bay update",
  "job.mechanicUpdate": "Mechanic update",
  "job.updateFrom": "Update from {name}",
  "job.newUpdate": "New update",
  "job.latestUpdate": "Latest update",
  "job.tapToEnlarge": "Tap to enlarge",
  "job.closePhoto": "Close photo",
  "job.zoomIn": "Zoom in",
  "job.zoomOut": "Zoom out",
  "job.posting": "Posting…",
  "job.system": "System",
  "job.decline": "Decline booking",
  "job.declineHint": "Frees this time slot and notifies the customer.",
  "job.declineReason": "Reason (optional)",
  "job.declineReasonPh": "Bay is full that morning.",
  "job.declineConfirm": "Decline this booking",
  "job.declinedBanner": "This booking was declined.",
  "job.declinedReason": "Reason: {reason}",

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
  "diag.loading": "Looking that up…",
  "diag.refuse":
    "I only help with cars, vehicles, repair, and maintenance. Ask about a noise, a light, a leak, or how the car drives.",
  "diag.error": "The helper is busy. Using shop rules instead.",

  "account.title": "Account",
  "account.settings": "Settings",
  "account.settingsHint": "Language, theme, and app alerts.",
  "account.noEmail": "No email",
  "account.noPhone": "No phone",
  "account.shopOwner": "Shop owner",
  "account.shopTech": "Shop technician",
  "account.indyMech": "Independent mechanic",
  "account.customer": "Customer",
  "account.vehicles": "My vehicles",
  "account.vehiclesHint": "Cars from your tickets. Add another to reuse on booking.",
  "account.vehiclesEmpty": "No cars on file yet. Add one to reuse on booking.",
  "account.addVehicle": "+ Add vehicle",
  "account.saveVehicle": "Save vehicle",
  "account.cancelAdd": "Cancel",
  "account.vehiclePreview": "This car",
  "account.vehicleSaved": "Vehicle saved",
  "account.language": "Language",
  "account.languageHint": "Choose English or Spanish. Your choice is saved on this device.",
  "account.theme": "Theme",
  "account.themeHint": "Choose Light or Dark. Your choice is saved on this device.",
  "account.publicShop": "Public shop profile",
  "account.shopName": "Shop name",
  "account.bioCustomers": "Bio — what customers see",
  "account.shopBioPh": "Brakes, diagnostics, how you work, what makes the bay yours.",
  "account.noBio": "The owner hasn’t written a bio yet.",
  "account.specialties": "Specialties",
  "account.specialtiesHint": "What you work on. Customers see these on your card.",
  "account.credentials": "Credentials",
  "account.credentialsHint": "ASE, license, insurance, years — text only. No uploads.",
  "account.serviceArea": "Based in / service area",
  "account.serviceAreaPh": "Riverside, CA or Inland Empire · mobile",
  "account.yearsWrenching": "Years wrenching",
  "account.yearsPh": "e.g. 12",
  "account.otherTag": "Other",
  "account.addOther": "Add",
  "account.noSpecialties": "No specialties listed yet.",
  "account.noCredentials": "No credentials listed yet.",
  "account.noServiceArea": "No service area yet.",
  "spec.brakes": "Brakes",
  "spec.diagnostics": "Diagnostics",
  "spec.oil": "Oil",
  "spec.mobile": "Mobile service",
  "spec.tires": "Tires",
  "spec.engine": "Engine",
  "spec.electrical": "Electrical",
  "spec.ac": "A/C",
  "cred.ase": "ASE",
  "cred.mobile_license": "Mobile license",
  "cred.insured": "Insured",
  "profile.basedIn": "Based in {area}",
  "profile.years": "{n} years",
  "profile.specialties": "Specialties",
  "profile.credentials": "Credentials",
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
  "toast.unlocked": "Enter a find code to book with your shop",
  "toast.pickAny": "Enter a find code to book with your shop",
  "toast.newCode": "New code: {code}",
  "toast.assigned": "Assigned",
  "toast.statusUpdated": "Status updated",
  "toast.bookingDeclined": "Booking declined",
  "toast.updateSent": "Update posted",
  "toast.updateDuplicate": "That update was just posted",
  "toast.shopSaved": "Shop profile saved",
  "toast.techAdded": "Technician added",
  "toast.profileSaved": "Profile saved",

  "err.chooseProvider": "Link your shop with a find code first",
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
  "err.emailOrPhoneRequired": "Email or phone is required.",
  "err.resetCodeRequired": "Email/phone and reset code are required.",
  "err.resetCodeWrong": "That reset code is wrong or expired.",
  "err.cannotDecline": "Only incoming or scheduled bookings can be declined.",
  "err.jobNotFound": "Job not found.",

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
  "status.declined.label": "Declined",
  "status.declined.customer": "The shop declined this booking",

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
  "note.bookingDeclined": "Booking declined.",
  "note.bookingDeclinedReason": "Booking declined: {reason}",

  "vehicle.other": "Other",

  "error.title": "Something went wrong",
  "error.fallback": "An unexpected error occurred. Try reloading the page.",

  "nav.qr": "QR",
  "welcome.privacy": "Privacy",
  "welcome.terms": "Terms",
  "welcome.support": "Support",

  "home.bookSub": "Pick the car and a time — your shop already has the ticket.",
  "home.trackSub": "See status, parts, and ready for pickup.",
  "home.helperSub": "Describe the noise. Not a certified inspection.",
  "home.latestFromBay": "Latest from the bay",

  "book.slotTaken": "That time is already booked. Pick another slot.",
  "book.chooseOpenTime": "Choose an open time",
  "book.pickShopFirst": "Pick a shop first",
  "book.bayFull": "This bay is full for the next week. Check back later.",
  "book.takenHint": "Taken times are removed so two cars cannot grab the same slot.",
  "book.notifySms": "Text me when they are on the way, waiting on parts, or the car is ready. App alerts too if this phone allows them.",
  "book.yourVehicles": "Your vehicles",
  "book.useVehicle": "Use this car",

  "vehicle.title": "Vehicle on the ticket",
  "vehicle.sub": "Year, make, model, then trim if you know it",
  "vehicle.chooseYear": "Choose year",
  "vehicle.chooseMake": "Choose make",
  "vehicle.chooseModel": "Choose model",
  "vehicle.pickMakeFirst": "Pick a make first",
  "vehicle.trimOptional": "Trim or engine (optional)",
  "vehicle.skipTrim": "Skip or choose trim",
  "vehicle.pickModelFirst": "Pick a model first",
  "vehicle.whichMake": "Which make?",
  "vehicle.whichModel": "Which model?",
  "vehicle.whichTrim": "Which trim or engine?",
  "vehicle.typeHere": "Type it here",
  "vehicle.onAppointment": "On this appointment",
  "vehicle.notChosen": "Not chosen yet",

  "confirm.saveCode": "Job code — save this",

  "track.emptySearch": "No jobs matched that code or phone.",
  "track.emptyBoard": "No cars on the board yet. Book one and it shows up here.",

  "shop.findCodeShort": "Find code",
  "shop.qrTabHint": "QR, print sheet, and new codes are on the QR tab.",
  "share.titleQr": "QR & referral",

  "job.tapToSet": "Tap to set",
  "job.photoLabel": "Bay photo (optional)",
  "job.photoLabelIndy": "Progress photo (optional)",
  "job.replacePhoto": "Replace job photo",
  "job.addPhoto": "Add a photo of the car or part",
  "job.photoHint": "What you're working on or the part — customers can tap to enlarge.",
  "job.workPhoto": "Bay photo",
  "job.progressPhoto": "Progress photo",
  "job.workPhotoHint": "What they're working on or the part — tap to enlarge.",

  "photo.choose": "Choose photo",
  "photo.take": "Take photo",
  "photo.profileLabel": "Profile photo (optional)",
  "photo.shopLabel": "Shop logo or profile photo (optional)",
  "photo.profileHint": "This is your account photo. Photos from the bay stay on the job ticket.",
  "photo.shopHint": "Customers see this on your public shop page. Bay photos stay on the job ticket.",
  "photo.indyHint": "Customers see this on your public mechanic page. Bay photos stay on the job ticket.",
  "photo.silhouetteAlt": "Default profile silhouette for {name}",
  "photo.profileSet": "Profile photo on this account",
  "photo.profileEmpty": "No profile photo yet — silhouette until you add one",
  "photo.cameraTitle": "Take photo",
  "photo.cameraSnap": "Capture",
  "photo.cameraCancel": "Cancel",
  "photo.noBay": "No progress photo yet",

  "toast.photoOnTicket": "Photo on the ticket",
  "toast.accountDeleted": "Account deleted",
  "toast.photoReadyShop": "Photo ready — tap Save shop profile",
  "toast.photoReady": "Photo ready — tap Save",
  "toast.profilePhotoSaved": "Profile photo saved",
  "toast.bayPhotoSaved": "Bay photo saved on the ticket",
  "toast.alertsUnsupported": "This browser cannot do app alerts. The Play Store app will.",
  "toast.alertsOff": "App alerts are off",
  "toast.alertsOn": "App alerts on",

  "err.slotTaken": "That time is already booked. Pick another slot.",
  "err.passwordWrong": "Password is wrong.",
  "err.choosePhoto": "Choose a photo or logo image.",
  "err.readImage": "Could not read that image.",
  "err.photoFail": "Could not use that photo",

  "account.alerts": "Alerts",
  "account.alertsCustomer":
    "Texts go to the phone on the ticket when the shop marks on the way, parts, or ready. Turn on app alerts for the Play/App Store build.",
  "account.alertsProvider":
    "When you move a job to on the way, parts, or ready, the customer gets a text (once Twilio is on Railway) and an app alert if they allowed it.",
  "account.alertsOnBtn": "App alerts are on",
  "account.alertsTurnOn": "Turn on app alerts",
  "account.alertsNotifBody": "Alerts are on for this device.",
  "account.changeLogo": "Change logo or photo",
  "account.changePhoto": "Change photo or logo",
  "account.supportEmail": "Support email — customers see this",
  "account.supportPhone": "Support phone",
  "account.notSet": "Not set",
  "account.hours": "Work hours — customers see this",
  "account.deleteTitle": "Delete account",
  "account.deleteBody":
    "Removes your login. If you own a shop, the public find code comes down. Job tickets already on a board stay as work records.",
  "account.deletePw": "Confirm with your password",
  "account.deleteNeedPw": "Enter your password to delete the account",
  "account.deleteConfirm":
    "Delete this account? You will be signed out. Open jobs stay on the shop board.",
  "account.deleting": "Deleting…",
  "account.deleteBtn": "Delete my account",

  "hours.d0": "Sun",
  "hours.d1": "Mon",
  "hours.d2": "Tue",
  "hours.d3": "Wed",
  "hours.d4": "Thu",
  "hours.d5": "Fri",
  "hours.d6": "Sat",
  "hours.everyDay": "Every day",
  "hours.monFri": "Mon–Fri",
  "hours.monSat": "Mon–Sat",
  "hours.closed": "Closed",
  "hours.opens": "Opens {time}",
  "hours.closes": "Closes {time}",

  "qr.printSheet": "Print sheet",
  "qr.newCodeQr": "New code + QR",
  "qr.rotateConfirm":
    "Generate a new code?\n\nThrow away or cover the old QR. Any sticker, paper, or saved QR with the old code will not work anymore. Print a new sheet after this.",
  "qr.printScan": "Scan to book",
  "qr.printHint": "Or type this find code in Mechanics Helper.",
  "qr.printTitle": "{code} print",

  "legal.updated": "Mechanics Helper · last updated September 16, 2026",
  "legal.privacy": "Privacy Policy",
  "legal.terms": "Terms of Use",
  "legal.notAdvice":
    "This is a plain-language explanation for people using Mechanics Helper and for the app stores. It is not legal advice.",
  "legal.linksAria": "Privacy, terms, and support",

  "privacy.who.title": "Who this is for",
  "privacy.who.body":
    "Mechanics Helper is a booking and job-status app. You can create a shop account, an independent mechanic account, or a customer account. This page explains what is stored when you use the app.",
  "privacy.accounts.title": "Accounts",
  "privacy.accounts.body":
    "Shop accounts belong to a repair shop and can have staff on the same board. Independent accounts are for a solo mechanic. Customer accounts are for people booking and tracking a car. Each account stores a name, login (email or phone), and password.",
  "privacy.store.title": "Shop and customer data",
  "privacy.store.body":
    "A shop or independent can store a business name, find code, bio, specialties, credentials, service area, hours, support email or phone, and a profile photo or shop logo. Customers book jobs with that shop. Job tickets store the vehicle year, make, and model, optional symptoms, the time slot, job status, and notes the shop writes.",
  "privacy.photos.title": "Photos",
  "privacy.photos.body":
    "A profile photo or shop logo lives on the account and the public shop or mechanic page. A photo from the bay (the car or a part on a job) stays on that job ticket. A bay photo does not replace your profile photo.",
  "privacy.recovery.title": "Password and username recovery",
  "privacy.recovery.body":
    "If you forget your password or username, we can email a reset code or login reminder to the address on the account. That mail is sent with Resend. We use that email for account recovery, not for ads.",
  "privacy.helper.title": "Helper AI",
  "privacy.helper.body":
    "Helper AI (powered by Groq) answers car and vehicle questions you type in Helper. It is for automotive help only. We send the question you type to Groq to get an answer. Helper is a starting point, not a certified inspection, not a guarantee, and not a substitute for a mechanic looking at the car.",
  "privacy.not.title": "What we do not do",
  "privacy.not.body":
    "We do not sell your list to advertisers. We do not use Helper to train a public model on your name. Card numbers are not stored in this app today. If you opt in, we text the booking phone for on-the-way, parts, and ready. App alerts use those same moments after you allow notifications.",
  "privacy.see.title": "Who sees what",
  "privacy.see.body":
    "A customer sees their own jobs and the public shop or mechanic page (name, photo, bio, specialties, credentials, service area, find code, support line). A shop or independent sees jobs booked with them. Staff at a shop share that shop’s board.",
  "privacy.long.title": "How long it stays",
  "privacy.long.body":
    "Account data stays until you delete the account. Job tickets may stay on the shop board so the shop has a record of work already done. You can ask the shop to remove a note or vehicle detail on a closed ticket.",
  "privacy.delete.title": "Delete your account",
  "privacy.delete.body":
    "Open Account and use Delete account. That removes your login. Open jobs stay with the shop as work records unless the shop clears them. Shop owners who delete also take the public find code down.",
  "privacy.contact.title": "Contact",
  "privacy.contact.body":
    "Questions about this app: support@mechanicshelper.app. For a booking or a car on the board, use the shop’s support email or phone, or Account → Support in the app (Bay Support).",

  "terms.accept.title": "Using the app",
  "terms.accept.body":
    "By creating an account or using Mechanics Helper, you agree to these terms. Keep using the app only if you accept them.",
  "terms.who.title": "Who can use it",
  "terms.who.body":
    "You can sign up as a shop, an independent mechanic, or a customer. Use your own account. Do not pretend to be another shop or customer.",
  "terms.use.title": "Bookings and the board",
  "terms.use.body":
    "Use the app to book work, run a shop or independent board, and track jobs. Do not misuse find codes or try to open someone else’s account.",
  "terms.helper.title": "Helper AI",
  "terms.helper.body":
    "Helper AI (Groq) is for car and vehicle questions only. It is not a certified inspection. You are responsible for repair decisions. A mechanic still has to look at the car.",
  "terms.accounts.title": "Your login",
  "terms.accounts.body":
    "Keep your password private. You can recover a password or username by email (Resend) if that address is on the account.",
  "terms.photos.title": "Photos you upload",
  "terms.photos.body":
    "Only upload photos you have the right to use. Profile photos and shop logos can appear on the public shop or mechanic page. Bay photos stay on the job ticket for that shop and customer.",
  "terms.data.title": "Your data",
  "terms.data.body":
    "We store the account and job data described in the Privacy Policy. You can delete your account from Account.",
  "terms.asIs.title": "No repair promise",
  "terms.asIs.body":
    "The app is a booking and status board. We are not your mechanic and we do not guarantee a diagnosis or a repair outcome.",
  "terms.contact.title": "Questions",
  "terms.contact.body":
    "Email support@mechanicshelper.app. For a car already on the board, use Bay Support in the app (Account → Support) or the shop contact on that ticket.",

  "support.title": "Support",
  "support.intro": "Need help with Mechanics Helper? Email us. We keep this page short on purpose.",
  "support.noPhone": "No support phone on file yet.",
  "support.noEmail": "No support email on file yet.",
  "support.scanFirst":
    "Scan a shop code or open a job first. Shop owners add a public phone and email under Account.",
  "support.thisApp": "App support",
  "support.body":
    "Write to support@mechanicshelper.app for login trouble, the website, or the app itself. Helper AI is for car questions only and is not a certified inspection.",
  "support.bayTitle": "Bay Support",
  "support.bayBody":
    "If you already have a car on the board, start in the app. Open Account, then Support, or use the shop phone and email on that ticket.",
  "support.readPrivacy": "Read privacy",

  "diag.disclaimer": "Helper only — not a certified inspection. A mechanic still has to look at the car.",
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

  "theme.groupAria": "Tema",
  "theme.light": "Claro",
  "theme.dark": "Oscuro",

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
    "Los clientes siguen las reparaciones. Cada taller e independiente recibe un QR o un código de referido para que la gente llegue al lugar correcto.",
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
  "login.forgot": "¿Olvidaste el usuario o la contraseña?",

  "recover.title": "Recuperar cuenta",
  "recover.body": "Usa el correo o teléfono que ya está en la cuenta.",
  "recover.forgotPassword": "Olvidé la contraseña",
  "recover.forgotUsername": "Olvidé el usuario",
  "recover.backToLogin": "Volver a iniciar sesión",

  "recover.pw.title": "Restablecer contraseña",
  "recover.pw.id": "Correo o teléfono",
  "recover.pw.send": "Enviar código",
  "recover.pw.sending": "Enviando…",
  "recover.pw.code": "Código de restablecimiento",
  "recover.pw.new": "Nueva contraseña",
  "recover.pw.confirm": "Confirmar nueva contraseña",
  "recover.pw.submit": "Guardar contraseña",
  "recover.pw.saving": "Guardando…",
  "recover.pw.sentEmail": "Si existe una cuenta, enviamos un código de 6 dígitos por correo. Caduca en 15 minutos.",
  "recover.pw.sentDev": "Si existe una cuenta, el código de vista previa de 6 dígitos aparece abajo. Caduca en 15 minutos.",
  "recover.pw.sentStub": "Si existe una cuenta, se guardó un código. El envío de correo aún no está conectado en este servidor.",
  "recover.pw.devCode": "Código de vista previa (no se envió por correo)",
  "recover.pw.mismatch": "Las contraseñas nuevas no coinciden.",
  "recover.pw.done": "Contraseña actualizada. Inicia sesión con la nueva.",

  "recover.user.title": "Buscar usuario",
  "recover.user.id": "Correo o teléfono",
  "recover.user.submit": "Buscar usuario",
  "recover.user.searching": "Buscando…",
  "recover.user.emptyTitle": "No hay cuenta",
  "recover.user.empty": "Ninguna cuenta coincide con ese correo o teléfono.",
  "recover.user.found": "Cuenta encontrada",
  "recover.user.login": "Usuario / acceso",
  "recover.user.name": "Nombre",
  "recover.user.email": "Correo",
  "recover.user.phone": "Teléfono",
  "recover.user.none": "No registrado",
  "recover.user.emailed": "Si la cuenta tiene correo y el envío está conectado, también enviamos el usuario ahí.",

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
  "home.chooseDifferent": "Usar otro código",
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
  "book.withShop": "Reservando con {name}",
  "book.linkTitle": "Vincula tu taller",
  "book.linkHint":
    "Escribe el código del QR o referido de tu taller. Esto no es un directorio de talleres.",
  "book.linkCta": "Vincular taller",
  "book.backHome": "Volver a Inicio",
  "book.yourName": "Tu nombre",
  "book.phone": "Teléfono",
  "book.email": "Correo",
  "book.year": "Año",
  "book.make": "Marca",
  "book.model": "Modelo",
  "book.selectModel": "Selecciona el modelo",
  "book.selectMakeFirst": "Primero elige la marca",
  "book.whatsGoingOn": "¿Qué le pasa al auto? (opcional)",
  "book.symptomsHint": "Opcional — puedes reservar dejando esto en blanco.",
  "book.symptomsPh": "Ruido, luz, fuga o cómo se conduce",
  "book.noSymptoms": "Sin descripción",
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
  "shop.history": "Historial",
  "shop.empty": "No hay trabajos en este filtro.",
  "shop.historyEmpty": "Aún no hay trabajos completados o rechazados.",
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
  "job.shopUpdate": "Actualización de bahía",
  "job.bayUpdate": "Actualización de bahía",
  "job.mechanicUpdate": "Actualización del mecánico",
  "job.updateFrom": "Actualización de {name}",
  "job.newUpdate": "Nueva actualización",
  "job.latestUpdate": "Última actualización",
  "job.tapToEnlarge": "Toca para ampliar",
  "job.closePhoto": "Cerrar foto",
  "job.zoomIn": "Acercar",
  "job.zoomOut": "Alejar",
  "job.posting": "Publicando…",
  "job.system": "Sistema",
  "job.decline": "Rechazar cita",
  "job.declineHint": "Libera este horario y avisa al cliente.",
  "job.declineReason": "Motivo (opcional)",
  "job.declineReasonPh": "La bahía está llena esa mañana.",
  "job.declineConfirm": "Rechazar esta cita",
  "job.declinedBanner": "Esta cita fue rechazada.",
  "job.declinedReason": "Motivo: {reason}",

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
  "diag.loading": "Revisando eso…",
  "diag.refuse":
    "Solo ayudo con autos, vehículos, reparación y mantenimiento. Pregúntame por un ruido, una luz, una fuga o cómo se conduce el auto.",
  "diag.error": "El asistente está ocupado. Uso las reglas del taller.",

  "account.title": "Cuenta",
  "account.settings": "Ajustes",
  "account.settingsHint": "Idioma, tema y alertas de la app.",
  "account.noEmail": "Sin correo",
  "account.noPhone": "Sin teléfono",
  "account.shopOwner": "Dueño del taller",
  "account.shopTech": "Técnico del taller",
  "account.indyMech": "Mecánico independiente",
  "account.customer": "Cliente",
  "account.vehicles": "Mis vehículos",
  "account.vehiclesHint": "Autos de tus tickets. Agrega otro para usarlo al reservar.",
  "account.vehiclesEmpty": "Aún no hay autos. Agrega uno para usarlo al reservar.",
  "account.addVehicle": "+ Agregar vehículo",
  "account.saveVehicle": "Guardar vehículo",
  "account.cancelAdd": "Cancelar",
  "account.vehiclePreview": "Este auto",
  "account.vehicleSaved": "Vehículo guardado",
  "account.language": "Idioma",
  "account.languageHint": "Elige inglés o español. Tu elección se guarda en este dispositivo.",
  "account.theme": "Tema",
  "account.themeHint": "Elige claro u oscuro. Tu elección se guarda en este dispositivo.",
  "account.publicShop": "Perfil público del taller",
  "account.shopName": "Nombre del taller",
  "account.bioCustomers": "Bio — lo que ven los clientes",
  "account.shopBioPh": "Frenos, diagnóstico, cómo trabajan y qué hace único al taller.",
  "account.noBio": "El dueño todavía no ha escrito una bio.",
  "account.specialties": "Especialidades",
  "account.specialtiesHint": "En qué trabajan. Los clientes lo ven en tu ficha.",
  "account.credentials": "Credenciales",
  "account.credentialsHint": "ASE, licencia, seguro, años — solo texto. Sin archivos.",
  "account.serviceArea": "Zona / con base en",
  "account.serviceAreaPh": "Riverside, CA o Inland Empire · a domicilio",
  "account.yearsWrenching": "Años de oficio",
  "account.yearsPh": "p. ej. 12",
  "account.otherTag": "Otro",
  "account.addOther": "Agregar",
  "account.noSpecialties": "Aún no hay especialidades.",
  "account.noCredentials": "Aún no hay credenciales.",
  "account.noServiceArea": "Aún no hay zona de servicio.",
  "spec.brakes": "Frenos",
  "spec.diagnostics": "Diagnóstico",
  "spec.oil": "Aceite",
  "spec.mobile": "Servicio móvil",
  "spec.tires": "Llantas",
  "spec.engine": "Motor",
  "spec.electrical": "Eléctrico",
  "spec.ac": "A/C",
  "cred.ase": "ASE",
  "cred.mobile_license": "Licencia móvil",
  "cred.insured": "Asegurado",
  "profile.basedIn": "Con base en {area}",
  "profile.years": "{n} años",
  "profile.specialties": "Especialidades",
  "profile.credentials": "Credenciales",
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
  "toast.unlocked": "Escribe un código para reservar con tu taller",
  "toast.pickAny": "Escribe un código para reservar con tu taller",
  "toast.newCode": "Código nuevo: {code}",
  "toast.assigned": "Asignado",
  "toast.statusUpdated": "Estado actualizado",
  "toast.bookingDeclined": "Cita rechazada",
  "toast.updateSent": "Actualización publicada",
  "toast.updateDuplicate": "Esa actualización recién se publicó",
  "toast.shopSaved": "Perfil del taller guardado",
  "toast.techAdded": "Técnico agregado",
  "toast.profileSaved": "Perfil guardado",

  "err.chooseProvider": "Primero vincula tu taller con un código",
  "err.fillAll": "Completa todos los campos",
  "err.loginWrong": "El correo/teléfono o la contraseña es incorrecta.",
  "err.registerRequired": "Se requieren nombre, contraseña y correo o teléfono.",
  "err.passwordShort": "La contraseña debe tener al menos 6 caracteres.",
  "err.accountExists": "Ese correo o teléfono ya tiene una cuenta.",
  "err.noShopCode": "No hay un taller con ese código.",
  "err.onlyOwner": "Solo el dueño del taller puede editar esto.",
  "err.shopNotFound": "No se encontró el taller.",
  "err.shopNameRequired": "El nombre del taller es obligatorio.",
  "err.onlyIndy": "Solo los independientes pueden editar esto.",
  "err.accountNotFound": "No se encontró la cuenta.",
  "err.bizNameRequired": "El nombre del negocio es obligatorio.",
  "err.emailOrPhoneRequired": "Se requiere correo o teléfono.",
  "err.resetCodeRequired": "Se requieren correo/teléfono y el código.",
  "err.resetCodeWrong": "Ese código es incorrecto o ya caducó.",
  "err.cannotDecline": "Solo se pueden rechazar citas nuevas o programadas.",
  "err.jobNotFound": "Trabajo no encontrado.",

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
  "status.declined.label": "Rechazada",
  "status.declined.customer": "El taller rechazó esta cita",

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
  "note.bookingDeclined": "Cita rechazada.",
  "note.bookingDeclinedReason": "Cita rechazada: {reason}",

  "vehicle.other": "Otro",

  "error.title": "Algo salió mal",
  "error.fallback": "Ocurrió un error inesperado. Intenta recargar la página.",

  "nav.qr": "QR",
  "welcome.privacy": "Privacidad",
  "welcome.terms": "Términos",
  "welcome.support": "Soporte",

  "home.bookSub": "Elige el auto y un horario — tu taller ya tiene el ticket.",
  "home.trackSub": "Ve el estado, las piezas y cuándo está listo.",
  "home.helperSub": "Describe el ruido. No es una inspección certificada.",
  "home.latestFromBay": "Lo último de la bahía",

  "book.slotTaken": "Ese horario ya está ocupado. Elige otro.",
  "book.chooseOpenTime": "Elige un horario libre",
  "book.pickShopFirst": "Primero elige un taller",
  "book.bayFull": "Este espacio está lleno esta semana. Vuelve más tarde.",
  "book.takenHint": "Los horarios ocupados se quitan para que dos autos no tomen el mismo espacio.",
  "book.notifySms":
    "Envíame un mensaje cuando vayan en camino, esperen piezas o el auto esté listo. También alertas de la app si este teléfono las permite.",
  "book.yourVehicles": "Tus vehículos",
  "book.useVehicle": "Usar este auto",

  "vehicle.title": "Vehículo en el ticket",
  "vehicle.sub": "Año, marca, modelo y el trim si lo sabes",
  "vehicle.chooseYear": "Elige el año",
  "vehicle.chooseMake": "Elige la marca",
  "vehicle.chooseModel": "Elige el modelo",
  "vehicle.pickMakeFirst": "Primero elige la marca",
  "vehicle.trimOptional": "Trim o motor (opcional)",
  "vehicle.skipTrim": "Saltar o elegir trim",
  "vehicle.pickModelFirst": "Primero elige el modelo",
  "vehicle.whichMake": "¿Qué marca?",
  "vehicle.whichModel": "¿Qué modelo?",
  "vehicle.whichTrim": "¿Qué trim o motor?",
  "vehicle.typeHere": "Escríbelo aquí",
  "vehicle.onAppointment": "En esta cita",
  "vehicle.notChosen": "Aún no elegido",

  "confirm.saveCode": "Código del trabajo — guárdalo",

  "track.emptySearch": "No hay trabajos con ese código o teléfono.",
  "track.emptyBoard": "Aún no hay autos en la lista. Reserva uno y aparece aquí.",

  "shop.findCodeShort": "Código",
  "shop.qrTabHint": "El QR, la hoja para imprimir y los códigos nuevos están en la pestaña QR.",
  "share.titleQr": "QR y referido",

  "job.tapToSet": "Toca para cambiar",
  "job.photoLabel": "Foto de la bahía (opcional)",
  "job.photoLabelIndy": "Foto del avance (opcional)",
  "job.replacePhoto": "Reemplazar foto del trabajo",
  "job.addPhoto": "Agregar foto del auto o la pieza",
  "job.photoHint": "En lo que estás trabajando o la pieza — los clientes pueden tocar para ampliar.",
  "job.workPhoto": "Foto de la bahía",
  "job.progressPhoto": "Foto del avance",
  "job.workPhotoHint": "En lo que están trabajando o la pieza — toca para ampliar.",

  "photo.choose": "Elegir foto",
  "photo.take": "Tomar foto",
  "photo.profileLabel": "Foto de perfil (opcional)",
  "photo.shopLabel": "Logo o foto de perfil del taller (opcional)",
  "photo.profileHint": "Esta es la foto de tu cuenta. Las fotos del taller se quedan en el ticket.",
  "photo.shopHint": "Los clientes la ven en tu página pública. Las fotos del taller se quedan en el ticket.",
  "photo.indyHint": "Los clientes la ven en tu página de mecánico. Las fotos del taller se quedan en el ticket.",
  "photo.silhouetteAlt": "Silueta de perfil predeterminada para {name}",
  "photo.profileSet": "Foto de perfil en esta cuenta",
  "photo.profileEmpty": "Aún no hay foto de perfil — se muestra la silueta hasta que agregues una",
  "photo.cameraTitle": "Tomar foto",
  "photo.cameraSnap": "Capturar",
  "photo.cameraCancel": "Cancelar",
  "photo.noBay": "Aún no hay foto del avance",

  "toast.photoOnTicket": "Foto en el ticket",
  "toast.accountDeleted": "Cuenta eliminada",
  "toast.photoReadyShop": "Foto lista — toca Guardar perfil del taller",
  "toast.photoReady": "Foto lista — toca Guardar",
  "toast.profilePhotoSaved": "Foto de perfil guardada",
  "toast.bayPhotoSaved": "Foto del taller guardada en el ticket",
  "toast.alertsUnsupported": "Este navegador no puede enviar alertas. La app de la tienda sí.",
  "toast.alertsOff": "Alertas de la app desactivadas",
  "toast.alertsOn": "Alertas de la app activadas",

  "err.slotTaken": "Ese horario ya está ocupado. Elige otro.",
  "err.passwordWrong": "La contraseña es incorrecta.",
  "err.choosePhoto": "Elige una foto o un logo.",
  "err.readImage": "No se pudo leer esa imagen.",
  "err.photoFail": "No se pudo usar esa foto",

  "account.alerts": "Alertas",
  "account.alertsCustomer":
    "Los mensajes van al teléfono del ticket cuando el taller marca en camino, piezas o listo. Activa las alertas de la app en la versión de Play/App Store.",
  "account.alertsProvider":
    "Cuando mueves un trabajo a en camino, piezas o listo, el cliente recibe un mensaje (cuando Twilio esté en Railway) y una alerta de la app si la permitió.",
  "account.alertsOnBtn": "Las alertas de la app están activas",
  "account.alertsTurnOn": "Activar alertas de la app",
  "account.alertsNotifBody": "Las alertas están activas en este dispositivo.",
  "account.changeLogo": "Cambiar logo o foto",
  "account.changePhoto": "Cambiar foto o logo",
  "account.supportEmail": "Correo de soporte — lo ven los clientes",
  "account.supportPhone": "Teléfono de soporte",
  "account.notSet": "Sin definir",
  "account.hours": "Horario — lo ven los clientes",
  "account.deleteTitle": "Eliminar cuenta",
  "account.deleteBody":
    "Quita tu acceso. Si eres dueño de un taller, el código público se baja. Los tickets que ya están en un tablero se quedan como registro de trabajo.",
  "account.deletePw": "Confirma con tu contraseña",
  "account.deleteNeedPw": "Escribe tu contraseña para eliminar la cuenta",
  "account.deleteConfirm":
    "¿Eliminar esta cuenta? Se cerrará la sesión. Los trabajos abiertos se quedan en el tablero del taller.",
  "account.deleting": "Eliminando…",
  "account.deleteBtn": "Eliminar mi cuenta",

  "hours.d0": "Dom",
  "hours.d1": "Lun",
  "hours.d2": "Mar",
  "hours.d3": "Mié",
  "hours.d4": "Jue",
  "hours.d5": "Vie",
  "hours.d6": "Sáb",
  "hours.everyDay": "Todos los días",
  "hours.monFri": "Lun–Vie",
  "hours.monSat": "Lun–Sáb",
  "hours.closed": "Cerrado",
  "hours.opens": "Abre {time}",
  "hours.closes": "Cierra {time}",

  "qr.printSheet": "Imprimir hoja",
  "qr.newCodeQr": "Código y QR nuevos",
  "qr.rotateConfirm":
    "¿Generar un código nuevo?\n\nTira o cubre el QR viejo. Cualquier sticker, papel o QR guardado con el código anterior dejará de funcionar. Imprime una hoja nueva después.",
  "qr.printScan": "Escanea para reservar",
  "qr.printHint": "O escribe este código en Mechanics Helper.",
  "qr.printTitle": "impresión {code}",

  "legal.updated": "Mechanics Helper · actualizado el 16 de septiembre de 2026",
  "legal.privacy": "Política de privacidad",
  "legal.terms": "Términos de uso",
  "legal.notAdvice":
    "Esto es una explicación en lenguaje sencillo para quienes usan Mechanics Helper y para las tiendas de apps. No es asesoría legal.",
  "legal.linksAria": "Privacidad, términos y soporte",

  "privacy.who.title": "Para quién es esto",
  "privacy.who.body":
    "Mechanics Helper es una app de citas y estado de trabajos. Puedes crear una cuenta de taller, de mecánico independiente o de cliente. Esta página explica qué se guarda cuando usas la app.",
  "privacy.accounts.title": "Cuentas",
  "privacy.accounts.body":
    "Las cuentas de taller pertenecen a un taller y pueden tener personal en el mismo tablero. Las cuentas independientes son para un mecánico solo. Las cuentas de cliente son para quien reserva y sigue un auto. Cada cuenta guarda un nombre, un acceso (correo o teléfono) y una contraseña.",
  "privacy.store.title": "Datos del taller y del cliente",
  "privacy.store.body":
    "Un taller o independiente puede guardar el nombre del negocio, el código, la bio, especialidades, credenciales, zona de servicio, el horario, el correo o teléfono de soporte y una foto de perfil o logo. Los clientes reservan trabajos con ese taller. Los tickets guardan el año, marca y modelo del vehículo, síntomas opcionales, el horario, el estado del trabajo y las notas que escribe el taller.",
  "privacy.photos.title": "Fotos",
  "privacy.photos.body":
    "La foto de perfil o el logo del taller viven en la cuenta y en la página pública. Una foto de la bahía (el auto o una pieza en un trabajo) se queda en ese ticket. Una foto de la bahía no reemplaza tu foto de perfil.",
  "privacy.recovery.title": "Recuperar contraseña y usuario",
  "privacy.recovery.body":
    "Si olvidas la contraseña o el usuario, podemos enviar un código o un recordatorio al correo de la cuenta. Ese correo se envía con Resend. Usamos ese correo para recuperar la cuenta, no para anuncios.",
  "privacy.helper.title": "Helper AI",
  "privacy.helper.body":
    "Helper AI (con Groq) responde preguntas de autos y vehículos que escribes en Helper. Solo es para ayuda automotriz. Enviamos la pregunta que escribes a Groq para obtener una respuesta. Helper es un punto de partida, no una inspección certificada, ni una garantía, ni un sustituto de que un mecánico revise el auto.",
  "privacy.not.title": "Qué no hacemos",
  "privacy.not.body":
    "No vendemos tu lista a anunciantes. No usamos Helper para entrenar un modelo público con tu nombre. Hoy esta app no guarda números de tarjeta. Si aceptas, enviamos un mensaje al teléfono de la cita para en camino, piezas y listo. Las alertas de la app usan esos mismos momentos cuando las permites.",
  "privacy.see.title": "Quién ve qué",
  "privacy.see.body":
    "Un cliente ve sus propios trabajos y la página pública del taller o mecánico (nombre, foto, bio, especialidades, credenciales, zona de servicio, código, línea de soporte). Un taller o independiente ve los trabajos reservados con ellos. El personal de un taller comparte ese tablero.",
  "privacy.long.title": "Cuánto tiempo se queda",
  "privacy.long.body":
    "Los datos de la cuenta se quedan hasta que la elimines. Los tickets pueden quedarse en el tablero del taller como registro del trabajo ya hecho. Puedes pedir al taller que quite una nota o un dato del vehículo en un ticket cerrado.",
  "privacy.delete.title": "Eliminar tu cuenta",
  "privacy.delete.body":
    "Abre Cuenta y usa Eliminar cuenta. Eso quita tu acceso. Los trabajos abiertos se quedan con el taller como registro, salvo que el taller los borre. Si un dueño elimina su cuenta, también baja el código público.",
  "privacy.contact.title": "Contacto",
  "privacy.contact.body":
    "Preguntas sobre esta app: support@mechanicshelper.app. Para una cita o un auto en el tablero, usa el correo o teléfono de soporte del taller, o Cuenta → Soporte en la app (Soporte de bahía).",

  "terms.accept.title": "Usar la app",
  "terms.accept.body":
    "Al crear una cuenta o usar Mechanics Helper, aceptas estos términos. Sigue usando la app solo si los aceptas.",
  "terms.who.title": "Quién puede usarla",
  "terms.who.body":
    "Puedes registrarte como taller, mecánico independiente o cliente. Usa tu propia cuenta. No te hagas pasar por otro taller o cliente.",
  "terms.use.title": "Citas y el tablero",
  "terms.use.body":
    "Usa la app para reservar trabajo, llevar el tablero de un taller o independiente y seguir trabajos. No uses mal los códigos ni intentes abrir la cuenta de otra persona.",
  "terms.helper.title": "Helper AI",
  "terms.helper.body":
    "Helper AI (Groq) es solo para preguntas de autos y vehículos. No es una inspección certificada. Tú eres responsable de las decisiones de reparación. Un mecánico aún tiene que revisar el auto.",
  "terms.accounts.title": "Tu acceso",
  "terms.accounts.body":
    "Mantén tu contraseña en privado. Puedes recuperar la contraseña o el usuario por correo (Resend) si esa dirección está en la cuenta.",
  "terms.photos.title": "Fotos que subes",
  "terms.photos.body":
    "Solo sube fotos que tienes derecho a usar. Las fotos de perfil y los logos pueden verse en la página pública del taller o mecánico. Las fotos de la bahía se quedan en el ticket para ese taller y cliente.",
  "terms.data.title": "Tus datos",
  "terms.data.body":
    "Guardamos los datos de cuenta y de trabajo descritos en la Política de privacidad. Puedes eliminar tu cuenta desde Cuenta.",
  "terms.asIs.title": "Sin promesa de reparación",
  "terms.asIs.body":
    "La app es un tablero de citas y estado. No somos tu mecánico y no garantizamos un diagnóstico ni un resultado de reparación.",
  "terms.contact.title": "Preguntas",
  "terms.contact.body":
    "Escribe a support@mechanicshelper.app. Si ya hay un auto en el tablero, usa Soporte de bahía en la app (Cuenta → Soporte) o el contacto del taller en ese ticket.",

  "support.title": "Soporte",
  "support.intro": "¿Necesitas ayuda con Mechanics Helper? Escríbenos. Esta página es corta a propósito.",
  "support.noPhone": "Aún no hay teléfono de soporte.",
  "support.noEmail": "Aún no hay correo de soporte.",
  "support.scanFirst":
    "Escanea un código de taller o abre un trabajo primero. Los dueños agregan un teléfono y correo públicos en Cuenta.",
  "support.thisApp": "Soporte de la app",
  "support.body":
    "Escribe a support@mechanicshelper.app si hay un problema de acceso, del sitio o de la app. Helper AI es solo para preguntas de autos y no es una inspección certificada.",
  "support.bayTitle": "Soporte de bahía",
  "support.bayBody":
    "Si ya tienes un auto en el tablero, empieza en la app. Abre Cuenta y luego Soporte, o usa el teléfono y correo del taller en ese ticket.",
  "support.readPrivacy": "Leer privacidad",

  "diag.disclaimer": "Solo asistente — no es una inspección certificada. Un mecánico aún tiene que revisar el auto.",
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
  "That time is already booked. Pick another slot.": "err.slotTaken",
  "Password is wrong.": "err.passwordWrong",
  "Choose a photo or logo image.": "err.choosePhoto",
  "Could not read that image.": "err.readImage",
  "Could not use that photo": "err.photoFail",
  "Email or phone is required.": "err.emailOrPhoneRequired",
  "Email/phone and reset code are required.": "err.resetCodeRequired",
  "That reset code is wrong or expired.": "err.resetCodeWrong",
  "Only incoming or scheduled bookings can be declined.": "err.cannotDecline",
  "Job not found.": "err.jobNotFound",
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
  Declined: "declined",
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
  if (text === "Booking declined.") return translate(locale, "note.bookingDeclined");
  const declinedMatch = text.match(/^Booking declined: (.+)$/);
  if (declinedMatch) {
    return translate(locale, "note.bookingDeclinedReason", { reason: declinedMatch[1] });
  }
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

export function translateProfileTag(locale: Locale, kind: "spec" | "cred", id: string): string {
  const key = `${kind}.${id}` as MessageKey;
  if (key in messages.en) return translate(locale, key);
  return id;
}

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}

const PRIVACY_KEYS = [
  ["privacy.who.title", "privacy.who.body"],
  ["privacy.accounts.title", "privacy.accounts.body"],
  ["privacy.store.title", "privacy.store.body"],
  ["privacy.photos.title", "privacy.photos.body"],
  ["privacy.recovery.title", "privacy.recovery.body"],
  ["privacy.helper.title", "privacy.helper.body"],
  ["privacy.not.title", "privacy.not.body"],
  ["privacy.see.title", "privacy.see.body"],
  ["privacy.long.title", "privacy.long.body"],
  ["privacy.delete.title", "privacy.delete.body"],
  ["privacy.contact.title", "privacy.contact.body"],
] as const;

const TERMS_KEYS = [
  ["terms.accept.title", "terms.accept.body"],
  ["terms.who.title", "terms.who.body"],
  ["terms.use.title", "terms.use.body"],
  ["terms.helper.title", "terms.helper.body"],
  ["terms.accounts.title", "terms.accounts.body"],
  ["terms.photos.title", "terms.photos.body"],
  ["terms.data.title", "terms.data.body"],
  ["terms.asIs.title", "terms.asIs.body"],
  ["terms.contact.title", "terms.contact.body"],
] as const;

function legalSections(
  locale: Locale,
  keys: readonly (readonly [MessageKey, MessageKey])[],
): { title: string; body: string }[] {
  return keys.map(([title, body]) => ({
    title: translate(locale, title),
    body: translate(locale, body),
  }));
}

export function privacySections(locale: Locale): { title: string; body: string }[] {
  return legalSections(locale, PRIVACY_KEYS);
}

export function termsSections(locale: Locale): { title: string; body: string }[] {
  return legalSections(locale, TERMS_KEYS);
}

/** Display-only 12-hour clock. Storage/API values stay HH:mm / ISO. */
export const TIME_12H: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

export function formatClock(locale: Locale, time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hh || 0, mm || 0, 0, 0);
  return date.toLocaleTimeString(localeTag(locale), TIME_12H);
}

export function formatHoursLabel(
  locale: Locale,
  h?: { hoursDays?: string; hoursOpen?: string; hoursClose?: string },
): string {
  const days = h?.hoursDays || "123456";
  const open = h?.hoursOpen || "08:00";
  const close = h?.hoursClose || "16:00";
  const bits = ["0", "1", "2", "3", "4", "5", "6"] as const;
  const names = bits
    .filter((bit) => days.includes(bit))
    .map((bit) => translate(locale, `hours.d${bit}` as MessageKey));
  const dayPart =
    names.length === 7
      ? translate(locale, "hours.everyDay")
      : names.length === 5 && days === "12345"
        ? translate(locale, "hours.monFri")
        : names.length === 6 && days === "123456"
          ? translate(locale, "hours.monSat")
          : names.length
            ? names.join(" · ")
            : translate(locale, "hours.closed");
  return `${dayPart} · ${formatClock(locale, open)} – ${formatClock(locale, close)}`;
}
