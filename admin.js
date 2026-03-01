"use strict";

const ADMIN_PASSWORD = "holi2026";
const SHEETDB_APIS = [
    "https://sheetdb.io/api/v1/7p9uwypnu82ss",
    "https://sheetdb.io/api/v1/ibiql2125wiml"
];

async function sheetdbFetch(endpoint = "", options = {}) {
    for (let api of SHEETDB_APIS) {
        try {
            const res = await fetch(api + endpoint, options);
            if (res.ok) {
                console.log("SheetDB using:", api);
                return res;
            }
        } catch (err) {
            console.warn("SheetDB failed:", api);
        }
    }
    throw new Error("All SheetDB APIs failed");
}
const TICKET_PRICE = 300;

document.addEventListener("DOMContentLoaded", () => {
    const loginSection = document.getElementById("login-section");
    const adminDashboard = document.getElementById("admin-dashboard");
    const passInput = document.getElementById("admin-pass");
    const btnLogin = document.getElementById("btn-login");
    const errorEl = document.getElementById("login-error");

    btnLogin.addEventListener("click", () => {
        if (passInput.value === ADMIN_PASSWORD) {
            loginSection.style.display = "none";
            adminDashboard.style.display = "block";
            fetchData();
            setInterval(fetchData, 30000); // Auto-refresh every 30 seconds
        } else {
            errorEl.textContent = "Incorrect password. Redirecting...";
            errorEl.style.display = "block";
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        }
    });

    passInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") btnLogin.click();
    });

    const btnUpdateSpots = document.getElementById("btn-update-spots");
    const adminSpotsInput = document.getElementById("admin-spots");
    const updateMsg = document.getElementById("update-spots-msg");

    btnUpdateSpots.addEventListener("click", async () => {
        const newSpots = adminSpotsInput.value;
        if (!newSpots) return;

        updateMsg.textContent = "Updating...";
        updateMsg.style.color = "var(--cyan)";

        try {
            const patchUrl = `https://sheetdb.io/api/v1/${SHEETDB_ID}/key/spots_left?sheet=settings`;

            const res = await fetch(patchUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: { value: newSpots } })
            });

            if (!res.ok) throw new Error("Update failed");

            window.currentSpots = newSpots;
            updateMsg.textContent = "Updated successfully!";
            updateMsg.style.color = "#00C853";
            setTimeout(() => updateMsg.textContent = "", 3000);
        } catch (err) {
            console.error("Error updating spots:", err);
            updateMsg.textContent = "Failed to update.";
            updateMsg.style.color = "#FF6B6B";
        }
    });

});

async function fetchData() {
    try {
        const response = await sheetdbFetch("");
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();

        try {
            const settingsRes = await sheetdbFetch("?sheet=settings");
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                const row = settingsData.find(r => r.key === 'spots_left');
                if (row && row.value !== undefined) {
                    window.currentSpots = row.value;
                    if (!document.getElementById("admin-spots").value) {
                        document.getElementById("admin-spots").value = row.value;
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch settings data", e);
        }

        let totalBookings = data.length;
        let totalRevenue = 0;
        let totalTickets = 0;

        data.forEach(row => {
            const amount = parseFloat(row.total_amount) || 0;
            totalRevenue += amount;
            const tickets = amount / TICKET_PRICE;
            totalTickets += tickets;
        });

        document.getElementById("stat-bookings").textContent = totalBookings;
        document.getElementById("stat-tickets").textContent = totalTickets;
        document.getElementById("stat-revenue").textContent = `₹${totalRevenue.toLocaleString("en-IN")}`;

        const latestInfo = [...data].reverse().slice(0, 10);

        const tbody = document.getElementById("bookings-table-body");
        tbody.innerHTML = "";

        if (latestInfo.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No bookings yet.</td></tr>`;
            return;
        }

        latestInfo.forEach(row => {
            const tr = document.createElement("tr");

            const ticketsCount = (parseFloat(row.total_amount) || 0) / TICKET_PRICE;

            tr.innerHTML = `
                <td>${escapeHTML(row.name || "-")}</td>
                <td>${escapeHTML(row.number || "-")}</td>
                <td>${ticketsCount}</td>
                <td>₹${(parseFloat(row.total_amount) || 0).toLocaleString("en-IN")}</td>
                <td style="font-family: monospace; color: var(--cyan);">${escapeHTML(row.booking_id || "-")}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error fetching admin data:", err);
    }
}

function escapeHTML(str) {
    if (!str) return "";
    return str.toString().replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
