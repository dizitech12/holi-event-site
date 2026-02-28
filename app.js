/**
 * ============================================================
 * app.js — Holi Booking UI (Gajendragad · Savji Community)
 * ============================================================
 *
 * README FOR DEVELOPERS:
 * ──────────────────────
 * 1. TICKET_PRICE  → Change the number below (default ₹150 per ticket).
 * 2. UPI_IDS       → Replace the placeholder UPI IDs and payee names.
 * 3. IMGBB_API_KEY → Get a free key from https://api.imgbb.com/
 *                    Paste it as the string value of IMGBB_API_KEY below.
 * 4. SHEETDB_ID    → Create a Google Sheet, connect it at https://sheetdb.io/
 *                    and paste the alphanumeric ID from your SheetDB URL.
 *
 * TESTING:
 * ──────────────────────
 * - For imgBB testing, get a free account at imgbb.com and use the test key.
 * - For SheetDB testing, the free tier allows limited requests/month.
 * - Open index.html directly in a browser (no server required) or use:
 *     npx serve .     →  http://localhost:3000
 *
 * SECURITY NOTES:
 * ──────────────────────
 * ⚠ These API keys are CLIENT-SIDE and visible in source code.
 *   Anyone who inspects the page can see them.
 * ✓ For imgBB: enable domain restriction in your imgBB account settings.
 * ✓ For SheetDB: the free plan has a 500-request/month limit; rotates keys
 *   in settings → "Allow only your domains" if available.
 * ✓ RECOMMENDED: Move imgBB upload & SheetDB save to a small backend
 *   (e.g., a Cloudflare Worker, Supabase Edge Function, or Node.js server)
 *   so your keys are never exposed to the browser.
 * ============================================================
 */

"use strict";

/* ──────────────────────────────────────────────
   CONFIGURATION — Fill in your real values here
   ────────────────────────────────────────────── */

const TICKET_PRICE = 300; // ₹ per ticket — change as needed

/* Replace with your real UPI IDs */
const UPI_IDS = [
    { id: "9448352260@ybl", name: "Holi Gajendragad" },
];

const PAYEE_NAME = "Holi Gajendragad"; // Shown in UPI app

/* imgBB API key — get one free at https://api.imgbb.com/ */
const IMGBB_API_KEY = "73604be6a9286f966b9c1d4a2a543a85";

/* SheetDB sheet ID — from https://sheetdb.io/ */
const SHEETDB_ID = "7p9uwypnu82ss";

/* ──────────────────────────────────────────────
   BOOKING FORM PAGE  (index.html logic)
   ────────────────────────────────────────────── */

/**
 * Initialise the booking form if we're on index.html.
 * Called on DOMContentLoaded.
 */
function initBookingForm() {
    // Guard: only run on the booking form page
    const form = document.getElementById("booking-form");
    if (!form) return;

    /* --- Stepper for ticket count --- */
    const countDisplay = document.getElementById("ticket-count-display");
    const btnMinus = document.getElementById("btn-minus");
    const btnPlus = document.getElementById("btn-plus");
    let ticketCount = 1;

    function updateCountDisplay() {
        countDisplay.textContent = ticketCount;
        buildAttendeeInputs(ticketCount);
    }

    btnMinus.addEventListener("click", () => {
        if (ticketCount > 1) { ticketCount--; updateCountDisplay(); }
    });

    btnPlus.addEventListener("click", () => {
        if (ticketCount < 20) { ticketCount++; updateCountDisplay(); }
    });

    /* --- Attendee inputs --- */
    const attendeesSection = document.getElementById("attendees-section");

    /**
     * Dynamically add / remove attendee input fields.
     * Shows the section only when ticketCount > 1.
     * @param {number} count
     */
    function buildAttendeeInputs(count) {
        const container = document.getElementById("attendees-container");
        container.innerHTML = ""; // clear

        if (count <= 1) {
            attendeesSection.classList.remove("visible");
            return;
        }

        attendeesSection.classList.add("visible");

        for (let i = 1; i <= count - 1; i++) {
            const wrap = document.createElement("div");
            wrap.className = "attendee-input-wrap";

            // Number badge
            const num = document.createElement("span");
            num.className = "attendee-num";
            num.textContent = i;

            // Text input
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = `Attendee ${i} name`;
            input.id = `attendee-${i}`;
            input.name = `attendee-${i}`;
            input.setAttribute("aria-label", `Attendee ${i} name`);
            input.required = true;

            wrap.appendChild(num);
            wrap.appendChild(input);
            container.appendChild(wrap);
        }
    }

    /* --- Form submission / validation --- */
    const bookBtn = document.getElementById("btn-book");

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validateBookingForm(ticketCount)) return;

        // Gather data
        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const city = document.getElementById("city").value.trim();

        // Collect attendee names
        const attendees = [name];
        for (let i = 1; i <= ticketCount - 1; i++) {
            const el = document.getElementById(`attendee-${i}`);
            if (el) attendees.push(el.value.trim());
        }

        const totalAmount = ticketCount * TICKET_PRICE;

        // Build the data object
        const bookingData = {
            name,
            phone,
            city,
            ticket_count: ticketCount,
            attendees,            // array; will be join(',') on pay page
            total_amount: totalAmount,
        };

        // Store in sessionStorage so pay.html can read safely
        sessionStorage.setItem("holi_booking", JSON.stringify(bookingData));

        // Open pay.html in the same tab (fresh navigation)
        window.location.href = "pay.html";
    });
}

/**
 * Validate all booking form fields.
 * Shows inline error messages. Returns true if valid.
 * @param {number} ticketCount
 * @returns {boolean}
 */
function validateBookingForm(ticketCount) {
    let valid = true;

    /* --- Name --- */
    const name = document.getElementById("name").value.trim();
    setError("name-error", !name, "Please enter your full name.");
    if (!name) valid = false;

    /* --- Phone: must be exactly 10 digits --- */
    const phone = document.getElementById("phone").value.trim();
    const phoneOk = /^\d{10}$/.test(phone);
    setError("phone-error", !phoneOk, "Enter a valid 10-digit mobile number.");
    if (!phoneOk) valid = false;

    /* --- City --- */
    const city = document.getElementById("city").value.trim();
    setError("city-error", !city, "Please enter your city.");
    if (!city) valid = false;

    /* --- Attendees (only if ticketCount > 1) --- */
    if (ticketCount > 1) {
        for (let i = 1; i <= ticketCount - 1; i++) {
            const el = document.getElementById(`attendee-${i}`);
            if (el && !el.value.trim()) {
                el.style.borderColor = "rgba(255,60,60,0.7)";
                valid = false;
            } else if (el) {
                el.style.borderColor = "";
            }
        }
        const attendeesErrorEl = document.getElementById("attendees-error");
        if (attendeesErrorEl) {
            // Check if any attendee field is empty
            let anyEmpty = false;
            for (let i = 1; i <= ticketCount - 1; i++) {
                const el = document.getElementById(`attendee-${i}`);
                if (el && !el.value.trim()) { anyEmpty = true; break; }
            }
            setError("attendees-error", anyEmpty, "Please fill in all attendee names.");
            if (anyEmpty) valid = false;
        }
    }

    return valid;
}

/**
 * Helper — show or hide an error span.
 * @param {string} id   — element id
 * @param {boolean} show
 * @param {string} msg
 */
function setError(id, show, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("visible", show);
}

/* ──────────────────────────────────────────────
   PAYMENT PAGE  (pay.html logic)
   ────────────────────────────────────────────── */

/**
 * Load booking details, render QR code and booking summary.
 * Called on DOMContentLoaded of pay.html.
 */
function initPaymentPage() {
    // Guard: only run on pay.html  (element id is "pay-card")
    const paySection = document.getElementById("pay-card");
    if (!paySection) return; // not on pay.html

    // Retrieve booking data
    const raw = sessionStorage.getItem("holi_booking");
    if (!raw) {
        // No data — redirect back
        showPayAlert("error", "No booking data found. Please go back and fill the form.");
        document.getElementById("btn-back").style.display = "block";
        return;
    }

    const data = JSON.parse(raw);

    // Display amount
    document.getElementById("total-amount").textContent =
        `₹${data.total_amount.toLocaleString("en-IN")}`;
    document.getElementById("per-ticket-info").textContent =
        `${data.ticket_count} ticket${data.ticket_count > 1 ? "s" : ""} × ₹${TICKET_PRICE}`;

    // Booking summary
    document.getElementById("summary-name").textContent = data.name;
    document.getElementById("summary-phone").textContent = data.phone;
    document.getElementById("summary-city").textContent = data.city;
    document.getElementById("summary-tickets").textContent = data.ticket_count;
    document.getElementById("summary-attendees").textContent =
        data.attendees.join(", ") || data.name;

    // Generate QR for first UPI by default
    generateQR(UPI_IDS[0], data.total_amount);

    // File upload handler
    initFileUpload(data);
}


/**
 * Build the UPI deep-link URI and render a QR code using QRCode.js.
 * @param {{ id: string, name: string }} upi
 * @param {number} amount
 */
function generateQR(upi, amount) {
    const tn = encodeURIComponent("Holi Booking Gajendragad");
    const uri = `upi://pay?pa=${upi.id}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amount}&cu=INR&tn=${tn}`;

    /* Render QR code */
    const qrContainer = document.getElementById("qr-container");
    qrContainer.innerHTML = ""; // clear old QR

    // QRCode.js is loaded via CDN in pay.html
    // eslint-disable-next-line no-undef
    new QRCode(qrContainer, {
        text: uri,
        width: 200,
        height: 200,
        colorDark: "#1A0533",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.H,
    });

}

/* Copy helpers */
function setupCopyButtons() {
    // Copy buttons have been removed
}

/* ──────────────────────────────────────────────
   FILE UPLOAD + SUBMIT
   ────────────────────────────────────────────── */

/**
 * Wire up the file upload area and submit flow.
 * @param {Object} bookingData
 */
function initFileUpload(bookingData) {
    const fileInput = document.getElementById("screenshot-input");
    const previewBox = document.getElementById("preview-box");
    const previewImg = document.getElementById("preview-img");
    const fileNameSpan = document.getElementById("preview-filename");
    const submitBtn = document.getElementById("btn-submit");
    const uploadArea = document.getElementById("upload-area");

    // Drag-and-drop visual hint
    uploadArea.addEventListener("dragover", (e) => { e.preventDefault(); uploadArea.classList.add("drag-over"); });
    uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("drag-over"));
    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("drag-over");
        if (e.dataTransfer.files.length) handleFileSelection(e.dataTransfer.files[0]);
    });

    let selectedFile = null;

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length) handleFileSelection(fileInput.files[0]);
    });

    /**
     * Validate and preview the chosen file.
     * @param {File} file
     */
    function handleFileSelection(file) {
        showPayAlert("error", "", false); // clear previous error

        // Validate type
        const allowed = ["image/png", "image/jpeg", "image/jpg"];
        if (!allowed.includes(file.type)) {
            showPayAlert("error", "Only PNG or JPG images are allowed.");
            return;
        }

        // Validate size (max 3 MB)
        if (file.size > 3 * 1024 * 1024) {
            showPayAlert("error", "Image must be 3 MB or smaller.");
            return;
        }

        selectedFile = file;

        // Show thumbnail preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            previewImg.src = ev.target.result;
            previewBox.classList.add("visible");
            fileNameSpan.textContent = file.name;
            submitBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // Submit booking button
    submitBtn.addEventListener("click", async () => {
        if (!selectedFile) {
            showPayAlert("error", "Please upload your UPI payment screenshot first.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span>&nbsp; Verifying screenshot…`;

        try {
            const ok = await verifyPaymentScreenshot(selectedFile);

            if (!ok) {
                alert("Please upload a valid payment screenshot");
                submitBtn.disabled = false;
                submitBtn.innerHTML = "Submit Booking";
                return;
            }

            submitBtn.innerHTML = `<span class="spinner"></span>&nbsp; Uploading screenshot…`;

            // 1. Upload image to imgBB
            const imgUrl = await uploadToImgBB(selectedFile);

            submitBtn.innerHTML = `<span class="spinner"></span>&nbsp; Saving booking…`;

            // Generate Booking ID
            const bookingId = "HOLI-" + Date.now().toString(36).toUpperCase();

            // 2. Save row to SheetDB
            await saveToSheetDB(bookingData, imgUrl, bookingId);

            // 3. Show success
            showSuccessScreen(bookingData, imgUrl, bookingId);
            launchConfetti();

            // Clear sessionStorage
            sessionStorage.removeItem("holi_booking");

        } catch (err) {
            console.error("Booking error:", err);
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Submit Booking";
            showPayAlert("error",
                `⚠ Something went wrong: ${err.message}. ` +
                `Please try again or contact the organiser.`
            );
        }
    });
}

/* ──────────────────────────────────────────────
   imgBB UPLOAD
   ────────────────────────────────────────────── */

/**
 * Upload an image file to imgBB and return the hosted URL.
 * Docs: https://api.imgbb.com/
 *
 * NOTE: Replace IMGBB_API_KEY at the top of this file.
 *       For backend usage, call this from a server to hide the key.
 *
 * @param {File} file
 * @returns {Promise<string>} image URL
 */
async function uploadToImgBB(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            // Extract pure base64 (strip the data:image/...;base64, prefix)
            const base64 = reader.result.split(",")[1];

            const formData = new FormData();
            formData.append("key", IMGBB_API_KEY);
            formData.append("image", base64);
            formData.append("name", `holi_payment_${Date.now()}`);

            try {
                const response = await fetch("https://api.imgbb.com/1/upload", {
                    method: "POST",
                    body: formData,
                });

                const result = await response.json();

                if (result.success && result.data && result.data.url) {
                    resolve(result.data.url);
                } else {
                    reject(new Error(result.error?.message || "imgBB upload failed. Check your API key."));
                }
            } catch (fetchErr) {
                reject(new Error("Network error during image upload. Please check your internet connection."));
            }
        };
        reader.onerror = () => reject(new Error("Could not read the image file."));
    });
}

/* ──────────────────────────────────────────────
   SheetDB SAVE
   ────────────────────────────────────────────── */

/**
 * Save the booking record to a Google Sheet via SheetDB.
 * Docs: https://sheetdb.io/docs
 *
 * POST body: { "data": { ...row fields... } }
 * Column names must exactly match your Sheet headers:
 *   booking_id | timeline | name | number | city | attendees | total_amount | img_url
 *
 * NOTE: Replace SHEETDB_ID at the top of this file.
 *       If SheetDB supports domain restriction, enable it in your account.
 *       For production, call this from a server to hide the key.
 *
 * @param {Object} booking
 * @param {string} imgUrl
 * @param {string} bookingId
 */
async function saveToSheetDB(booking, imgUrl, bookingId) {
    const url = `https://sheetdb.io/api/v1/${SHEETDB_ID}`;

    const row = {
        booking_id: bookingId,
        timeline: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),         // ISO 8601 timestamp
        name: booking.name,
        number: booking.phone,
        city: booking.city,
        attendees: booking.attendees.join(","),       // comma-separated string
        total_amount: booking.total_amount,
        img_url: imgUrl,
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: row }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`SheetDB save failed (${response.status}): ${errText}`);
    }

    const result = await response.json();
    return result;
}

/* ──────────────────────────────────────────────
   SUCCESS SCREEN
   ────────────────────────────────────────────── */

/**
 * Hide the payment UI and show the success message.
 * @param {Object} booking
 * @param {string} imgUrl
 * @param {string} bookingId
 */
function showSuccessScreen(booking, imgUrl, bookingId) {
    // Hide the payment card
    const payCard = document.getElementById("pay-card");
    if (payCard) payCard.style.display = "none";

    const screen = document.getElementById("success-screen");
    screen.classList.add("visible");

    // Populate details
    document.getElementById("s-name").textContent = booking.name;
    document.getElementById("s-amount").textContent = `₹${booking.total_amount.toLocaleString("en-IN")}`;
    document.getElementById("s-tickets").textContent = booking.ticket_count;
    document.getElementById("s-city").textContent = booking.city;
    document.getElementById("s-time").textContent = new Date().toLocaleString("en-IN");

    // Booking reference
    document.getElementById("s-ref").textContent = bookingId;
}

/* ──────────────────────────────────────────────
   CONFETTI
   ────────────────────────────────────────────── */

/**
 * Launch a lightweight confetti animation using Canvas.
 * No external library — pure vanilla JS.
 */
function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    const COLORS = ["#FF3C78", "#FFD600", "#00E5FF", "#D500F9", "#FF6D00", "#69FF97", "#FFFFFF"];
    const PIECES = 160;
    const pieces = [];

    for (let i = 0; i < PIECES; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 6,    // width
            h: Math.random() * 6 + 4,    // height
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            speed: Math.random() * 3 + 2,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.2,
            drift: (Math.random() - 0.5) * 1.5,
        });
    }

    let frameId;
    let elapsed = 0;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        elapsed++;

        pieces.forEach(p => {
            // Move
            p.y += p.speed;
            p.x += p.drift;
            p.angle += p.spin;

            // Wrap top/bottom
            if (p.y > canvas.height + 20) {
                if (elapsed < 180) {       // keep spawning for ~3 sec (60fps)
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }
            }

            // Draw rotated rectangle
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.88;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });

        frameId = requestAnimationFrame(draw);

        // Stop after ~5 seconds
        if (elapsed > 310) {
            cancelAnimationFrame(frameId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    draw();
}

/* ──────────────────────────────────────────────
   UI HELPERS
   ────────────────────────────────────────────── */

/**
 * Show/hide an alert banner on the payment page.
 * @param {'error'|'info'|'success'} type
 * @param {string} msg
 * @param {boolean} [visible=true]
 */
function showPayAlert(type, msg, visible = true) {
    const el = document.getElementById("pay-alert");
    if (!el) return;
    el.className = `alert alert-${type}` + (visible ? " visible" : "");
    el.textContent = msg;
}

/* ──────────────────────────────────────────────
   INIT — Route to correct page controller
   ────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    initBookingForm();   // runs only on index.html (guard inside)
    initPaymentPage();   // runs only on pay.html (guard inside)
    setupCopyButtons();  // safe to run on both
});

async function verifyPaymentScreenshot(file) {
    const { data: { text } } = await Tesseract.recognize(file, 'eng');
    const t = text.toLowerCase();

    let score = 0;

    if (/(upi|gpay|phonepe|paytm|bank|axis|sbi|hdfc|icici)/i.test(t)) score += 2;
    if (/(paid|success|successful|completed|credited|debited)/i.test(t)) score += 2;
    if (/(utr|txn|transaction|ref)/i.test(t)) score += 2;
    if (/(₹|rs)?\s?\d{2,5}(,\d{3})?/i.test(t)) score += 1;
    if (/\d{9,}/.test(t)) score += 1;

    return score >= 3;
}
