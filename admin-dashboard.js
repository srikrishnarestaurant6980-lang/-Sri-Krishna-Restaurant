// admin-dashboard.js — Sri Krishna Hotel Admin Panel
// =====================================================
// SAFETY RULES (read before editing):
//   1. NEVER permanently delete any order from Firestore
//   2. Archive = copy to archive_orders + mark status:"archived" on original
//   3. Today filter is UI-ONLY — old data stays safe in database
//   4. orderDate field (YYYY-MM-DD) is used for all date filtering
//   5. QR flow and manual order flow are NEVER touched here
// =====================================================

'use strict';

// ===== TODAY DATE — single source of truth =====
function getTodayDate() {
    const d  = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}
const TODAY = getTodayDate();

// ===== DOM REFS =====
const navAvatar         = document.getElementById('nav-avatar');
const welcomeTitle      = document.getElementById('welcome-title');
const welcomeTime       = document.getElementById('welcome-time');
const sessionDateBadge  = document.getElementById('session-date-badge');

const statTodayOrders   = document.getElementById('stat-today-orders');
const statTodayRevenue  = document.getElementById('stat-today-revenue');
const statCashRevenue   = document.getElementById('stat-cash-revenue');
const statUpiRevenue    = document.getElementById('stat-upi-revenue');

const ordersList        = document.getElementById('orders-list');
const ordersCountBadge  = document.getElementById('orders-count-badge');

const rptOrders         = document.getElementById('rpt-orders');
const rptRevenue        = document.getElementById('rpt-revenue');
const rptCash           = document.getElementById('rpt-cash');
const rptUpi            = document.getElementById('rpt-upi');
const reportDateLabel   = document.getElementById('report-date-label');

const btnGenReport      = document.getElementById('btn-gen-report');
const btnWhatsappReport = document.getElementById('btn-whatsapp-report');
const btnEndDay         = document.getElementById('btn-end-day');

const infoEmail         = document.getElementById('info-email');
const infoLoginTime     = document.getElementById('info-login-time');
const infoUID           = document.getElementById('info-uid');

const btnLogout         = document.getElementById('btn-logout');
const btnCustomerSite   = document.getElementById('btn-customer-site');

const logoutModal       = document.getElementById('logout-modal');
const btnCancel         = document.getElementById('btn-cancel');
const btnConfirmLogout  = document.getElementById('btn-confirm-logout');

const resetModal        = document.getElementById('reset-modal');
const btnResetCancel    = document.getElementById('btn-reset-cancel');
const btnResetConfirm   = document.getElementById('btn-reset-confirm');

const toast             = document.getElementById('toast');
const toastMsg          = document.getElementById('toast-message');

// ===== CACHED DATA =====
let _todayOrders = []; // holds only today's filtered orders

// ===== INIT =====
function initDashboard(user) {
    console.log('[Dashboard] Init | session date:', TODAY, '| user:', user.email);
    populateUserInfo(user);
    updateSessionBadge();
    startClock();
    loadTodayOrders();
    setupListeners();
}

window._dashboardInit = initDashboard;
if (window._adminUser) {
    initDashboard(window._adminUser);
} else {
    window.dispatchEvent(new Event('dashboard-ready'));
}

// ===== SESSION DATE BADGE =====
function updateSessionBadge() {
    if (sessionDateBadge) {
        sessionDateBadge.textContent = new Date(TODAY + 'T00:00:00')
            .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (reportDateLabel) reportDateLabel.textContent = TODAY;
}

// ===== USER INFO =====
function populateUserInfo(user) {
    const email   = user.email || 'Admin';
    const initial = (user.displayName || email)[0].toUpperCase();
    if (navAvatar)    navAvatar.textContent    = initial;
    if (welcomeTitle) welcomeTitle.textContent = `Welcome back, ${user.displayName || email.split('@')[0] || 'Admin'}!`;
    if (infoEmail)    infoEmail.textContent    = email;
    if (infoUID)      infoUID.textContent      = user.uid;

    try {
        const meta = JSON.parse(localStorage.getItem('sriKrishnaAdminMeta') || '{}');
        if (infoLoginTime) {
            infoLoginTime.textContent = meta.loginAt
                ? new Date(meta.loginAt).toLocaleString('en-IN')
                : 'This session';
        }
    } catch (_) {
        if (infoLoginTime) infoLoginTime.textContent = 'This session';
    }
}

// ===== CLOCK =====
function startClock() {
    function tick() {
        if (welcomeTime) {
            welcomeTime.textContent = new Date().toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long',
                day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
    }
    tick();
    setInterval(tick, 30000);
}

// ===================================================
// LOAD TODAY'S ORDERS — UI FILTER ONLY
// Fetches ALL active orders, then filters by orderDate === TODAY
// Old orders stay in database — only hidden from view
// ===================================================
async function loadTodayOrders() {
    showOrdersLoading();
    showStatsSkeleton();

    try {
        const db  = window._adminDB;
        const api = window._firestoreAPI;

        if (!db || !api) {
            console.warn('[Dashboard] Firestore not ready');
            renderOrdersEmpty('Firebase not ready. Please refresh.');
            return;
        }

        const { collection, getDocs, query, where } = api;

        // -------------------------------------------------------
        // Query: orders where orderDate == TODAY AND status != "archived"
        // This is a UI filter — no old data is deleted or modified
        // -------------------------------------------------------
        const q = query(
            collection(db, 'orders'),
            where('orderDate', '==', TODAY)
        );

        const snap = await getDocs(q);
        const allTodayDocs = [];

        snap.forEach(docSnap => {
            const data = docSnap.data();
            // Skip archived ones from active view
            if (data.status === 'archived') return;
            allTodayDocs.push({ _docId: docSnap.id, ...data });
        });

        // Sort newest first (client-side)
        allTodayDocs.sort((a, b) => {
            const ta = a.createdAt?.seconds || (a.timestamp ? a.timestamp / 1000 : 0);
            const tb = b.createdAt?.seconds || (b.timestamp ? b.timestamp / 1000 : 0);
            return tb - ta;
        });

        _todayOrders = allTodayDocs;

        computeAndDisplayStats();
        renderOrdersList(_todayOrders);
        updateReportSummary();

        console.log('[Dashboard] Today orders loaded:', _todayOrders.length);

    } catch (err) {
        console.error('[Dashboard] Load error:', err);

        // Graceful fallback — if orderDate index not yet built,
        // fetch all and filter client-side
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
            console.warn('[Dashboard] Falling back to client-side date filter (index missing)');
            await loadTodayOrdersFallback();
        } else {
            renderOrdersEmpty('Could not load orders. Check connection.');
            showPlaceholderStats();
            showToast('⚠️ Could not load orders', 'error');
        }
    }
}

// Fallback: fetch all orders, filter by orderDate client-side
async function loadTodayOrdersFallback() {
    try {
        const db  = window._adminDB;
        const api = window._firestoreAPI;
        const { collection, getDocs } = api;

        const snap = await getDocs(collection(db, 'orders'));
        const allTodayDocs = [];

        snap.forEach(docSnap => {
            const data = docSnap.data();
            // UI filter: only show today's orders, skip archived
            if (data.orderDate === TODAY && data.status !== 'archived') {
                allTodayDocs.push({ _docId: docSnap.id, ...data });
            }
        });

        allTodayDocs.sort((a, b) => {
            const ta = a.createdAt?.seconds || (a.timestamp ? a.timestamp / 1000 : 0);
            const tb = b.createdAt?.seconds || (b.timestamp ? b.timestamp / 1000 : 0);
            return tb - ta;
        });

        _todayOrders = allTodayDocs;
        computeAndDisplayStats();
        renderOrdersList(_todayOrders);
        updateReportSummary();

        console.log('[Dashboard] Fallback loaded:', _todayOrders.length, 'orders for', TODAY);

    } catch (err) {
        console.error('[Dashboard] Fallback load error:', err);
        renderOrdersEmpty('Could not load orders.');
        showPlaceholderStats();
    }
}

// ===== COMPUTE STATS =====
function computeAndDisplayStats() {
    let revenue = 0, cash = 0, upi = 0;

    _todayOrders.forEach(o => {
        const amt = typeof o.totalAmount === 'number' ? o.totalAmount : 0;
        revenue += amt;
        const pm = (o.paymentMethod || '').toLowerCase();
        if (pm === 'cash') cash += amt;
        else upi += amt;  // qr / online / upi all go to UPI bucket
    });

    if (statTodayOrders)  statTodayOrders.textContent  = _todayOrders.length;
    if (statTodayRevenue) statTodayRevenue.textContent = formatINR(revenue);
    if (statCashRevenue)  statCashRevenue.textContent  = formatINR(cash);
    if (statUpiRevenue)   statUpiRevenue.textContent   = formatINR(upi);
    if (ordersCountBadge) ordersCountBadge.textContent = _todayOrders.length;

    return { orders: _todayOrders.length, revenue, cash, upi };
}

function showStatsSkeleton() {
    [statTodayOrders, statTodayRevenue, statCashRevenue, statUpiRevenue].forEach(el => {
        if (el) el.innerHTML = '<span class="stat-loading"></span>';
    });
}

function showPlaceholderStats() {
    [statTodayOrders, statTodayRevenue, statCashRevenue, statUpiRevenue].forEach(el => {
        if (el) el.textContent = '—';
    });
}

// ===== RENDER ORDERS LIST =====
function showOrdersLoading() {
    if (ordersList) ordersList.innerHTML = `
        <div class="orders-loading">
            <i class="fas fa-circle-notch fa-spin" style="color:var(--primary)"></i>
            Loading today's orders…
        </div>`;
}

function renderOrdersList(orders) {
    if (!ordersList) return;

    if (!orders || orders.length === 0) {
        renderOrdersEmpty();
        return;
    }

    const frag = document.createDocumentFragment();

    orders.forEach((order, idx) => {
        const item = document.createElement('div');
        item.className = 'order-item';

        // Time: prefer createdAt Firestore timestamp, fallback to timestamp ms
        let timeStr = '—';
        if (order.createdAt?.seconds) {
            timeStr = new Date(order.createdAt.seconds * 1000)
                .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else if (order.timestamp) {
            timeStr = new Date(order.timestamp)
                .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else if (order.time) {
            timeStr = order.time;
        }

        // Payment badge
        const pm      = (order.paymentMethod || 'cash').toLowerCase();
        const isUpi   = pm === 'upi' || pm === 'qr' || pm === 'online' || pm === 'qr_pending';
        const pmClass = isUpi ? 'payment-upi' : 'payment-cash';
        const pmLabel = isUpi ? 'UPI' : 'Cash';

        // Items string
        let itemsStr = '—';
        if (Array.isArray(order.items) && order.items.length > 0) {
            itemsStr = order.items
                .map(i => `${i.name || '?'} ×${i.quantity || i.qty || 1}`)
                .join(', ');
        }

        const orderId = order.id || order.orderId || `#${String(orders.length - idx).padStart(3, '0')}`;

        item.innerHTML = `
            <div class="order-num">${String(idx + 1).padStart(2, '0')}</div>
            <div class="order-details">
                <div class="order-id">${orderId}</div>
                <div class="order-items-list" title="${itemsStr}">${itemsStr}</div>
                <div class="order-meta">
                    <span class="order-source ${order.source === 'MANUAL' ? 'source-admin' : 'source-customer'}">${order.source === 'MANUAL' ? 'Admin' : 'Customer'}</span>
                    <span class="order-time"><i class="fas fa-clock" style="font-size:.65rem"></i> ${timeStr}</span>
                    <span class="order-payment ${pmClass}">${pmLabel}</span>
                    ${order.tableNumber ? `<span class="order-time">🪑 ${order.tableNumber}</span>` : ''}
                </div>
            </div>
            <div class="order-amount">${formatINR(order.totalAmount || 0)}</div>
        `;
        frag.appendChild(item);
    });

    ordersList.innerHTML = '';
    ordersList.appendChild(frag);
}

function renderOrdersEmpty(msg) {
    if (!ordersList) return;
    ordersList.innerHTML = `
        <div class="orders-empty">
            <i class="fas fa-clipboard-list"></i>
            <p>${msg || 'No orders yet today'}</p>
            <small>Orders placed today will appear here automatically</small>
        </div>`;
}

// ===== REPORT SUMMARY =====
function updateReportSummary() {
    const { orders, revenue, cash, upi } = computeAndDisplayStats();
    if (rptOrders)  rptOrders.textContent  = orders;
    if (rptRevenue) rptRevenue.textContent = formatINR(revenue);
    if (rptCash)    rptCash.textContent    = formatINR(cash);
    if (rptUpi)     rptUpi.textContent     = formatINR(upi);
}

// ===================================================
// GENERATE PDF REPORT
// Step 1: Use _todayOrders (already filtered)
// Step 2: Calculate totals
// Step 3: Build HTML → open print dialog (save as PDF)
// No data is modified
// ===================================================
async function generatePDFReport() {
    if (_todayOrders.length === 0) {
        showToast('📋 No orders today to report', 'info');
        return;
    }

    btnGenReport.disabled = true;
    btnGenReport.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Building…</span>';

    try {
        const dateFormatted = new Date(TODAY + 'T00:00:00').toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        // ===== BUILD CATEGORY-WISE DATA =====
        // Structure: { category: { items: { name: { price, qty, total } }, catTotal, catOrders } }
        const categoryMap = {};
        let totalRev = 0, totalCash = 0, totalUpi = 0;

        _todayOrders.forEach(o => {
            const amt = o.totalAmount || 0;
            totalRev += amt;
            const pm = (o.paymentMethod || '').toLowerCase();
            if (pm === 'cash') totalCash += amt; else totalUpi += amt;

            if (Array.isArray(o.items)) {
                o.items.forEach(it => {
                    const name = it.name || '?';
                    const price = it.price || 0;
                    const qty = it.quantity || it.qty || 1;
                    const itemTotal = price * qty;

                    // Find category from POS_MENU_ITEMS or default to 'Others'
                    const menuItem = POS_MENU_ITEMS.find(m => m.name === name);
                    const category = menuItem ? menuItem.category : 'Others';

                    if (!categoryMap[category]) {
                        categoryMap[category] = { items: {}, catTotal: 0, catOrders: 0 };
                    }

                    if (!categoryMap[category].items[name]) {
                        categoryMap[category].items[name] = { price, qty: 0, total: 0 };
                    }

                    categoryMap[category].items[name].qty += qty;
                    categoryMap[category].items[name].total += itemTotal;
                    categoryMap[category].catTotal += itemTotal;
                    categoryMap[category].catOrders += qty;
                });
            }
        });

        // Category display order
        const catOrder = ['Rice','Tiffin','Biryani','Meals','Bread Items','Egg Items','Chicken','Noodles','Semiya','Others'];
        const sortedCats = Object.keys(categoryMap).sort((a,b) => {
            const ia = catOrder.indexOf(a);
            const ib = catOrder.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });

        // ===== BUILD CATEGORY-WISE HTML =====
        let categoryHTML = '';
        let grandTotalQty = 0;

        sortedCats.forEach((cat, catIdx) => {
            const catData = categoryMap[cat];
            const items = Object.entries(catData.items).sort((a,b) => b[1].qty - a[1].qty);

            let itemRows = items.map(([name, v]) => {
                grandTotalQty += v.qty;
                return `<tr>
                    <td style="padding:7px 10px;border-bottom:1px solid #f3f3f3;font-size:12px">${name}</td>
                    <td style="padding:7px 10px;border-bottom:1px solid #f3f3f3;text-align:center;font-size:12px">₹${v.price.toLocaleString('en-IN')}</td>
                    <td style="padding:7px 10px;border-bottom:1px solid #f3f3f3;text-align:center;font-size:12px;font-weight:700">${v.qty}</td>
                    <td style="padding:7px 10px;border-bottom:1px solid #f3f3f3;text-align:right;font-size:12px;font-weight:700">₹${v.total.toLocaleString('en-IN')}</td>
                </tr>`;
            }).join('');

            categoryHTML += `
            <div style="margin-bottom:20px;border:1.5px solid #eee;border-radius:10px;overflow:hidden">
                <div style="background:linear-gradient(135deg,#e65100,#bf360c);color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
                    <span style="font-weight:700;font-size:13px">📂 ${cat}</span>
                    <span style="font-size:12px;opacity:0.9">${items.length} items · ${catData.catOrders} orders</span>
                </div>
                <table style="width:100%;border-collapse:collapse">
                    <thead>
                        <tr style="background:#fff3e0">
                            <th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#92400e;width:40%">Item Name</th>
                            <th style="padding:8px 10px;text-align:center;font-size:11px;font-weight:700;color:#92400e;width:18%">Price</th>
                            <th style="padding:8px 10px;text-align:center;font-size:11px;font-weight:700;color:#92400e;width:18%">Qty</th>
                            <th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:#92400e;width:24%">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                    <tfoot>
                        <tr style="background:#fff7ed">
                            <td colspan="2" style="padding:9px 10px;font-size:12px;font-weight:700;color:#92400e">${cat} Subtotal</td>
                            <td style="padding:9px 10px;text-align:center;font-size:12px;font-weight:800;color:#e65100">${catData.catOrders}</td>
                            <td style="padding:9px 10px;text-align:right;font-size:13px;font-weight:800;color:#e65100">₹${catData.catTotal.toLocaleString('en-IN')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>`;
        });

        // ===== ORDER DETAILS TABLE (compact) =====
        let orderRows = _todayOrders.map((o, i) => {
            let timeStr = o.time || '—';
            if (o.createdAt?.seconds) {
                timeStr = new Date(o.createdAt.seconds * 1000)
                    .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            }
            const itemsStr = Array.isArray(o.items)
                ? o.items.map(it => `${it.name} ×${it.quantity || it.qty || 1}`).join(', ')
                : '—';
            const pm = o.paymentMethod || 'Cash';
            const orderId = o.id || o.orderId || `ORD-${i+1}`;
            return `<tr>
                <td style="padding:6px 8px;border-bottom:1px solid #f3f3f3;font-size:11px">${i+1}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f3f3f3;font-size:11px">${orderId}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f3f3f3;font-size:11px">${o.customerName || '—'}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f3f3f3;font-size:11px">${timeStr}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f3f3f3;font-size:10px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${itemsStr}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f3f3f3;font-size:11px">${pm}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f3f3f3;text-align:right;font-size:11px;font-weight:700">₹${(o.totalAmount||0).toLocaleString('en-IN')}</td>
            </tr>`;
        }).join('');

        // ===== FINAL HTML =====
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Daily Report — Sri Krishna Hotel — ${TODAY}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;padding:24px;color:#1a1a1a;font-size:13px;max-width:900px;margin:0 auto}
  h1{font-size:22px;color:#e65100;margin-bottom:4px}
  .sub{font-size:12px;color:#555;margin-bottom:16px}
  .summary{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
  .sbox{flex:1;min-width:100px;background:#f9f9f9;border:1px solid #eee;border-radius:8px;padding:10px 12px;text-align:center}
  .sbox .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
  .sbox .val{font-size:18px;font-weight:700}
  h2{font-size:14px;font-weight:700;margin:20px 0 10px;color:#e65100;text-transform:uppercase;letter-spacing:.5px;display:flex;align-items:center;gap:8px}
  table{width:100%;border-collapse:collapse}
  th,td{padding:7px 10px}
  th{background:#e65100;color:#fff;font-size:11px}
  td{border-bottom:1px solid #f3f3f3}
  tr:nth-child(even) td{background:#fafafa}
  .footer{text-align:center;font-size:11px;color:#aaa;margin-top:24px;border-top:1px solid #eee;padding-top:12px}
  .grand-total{background:linear-gradient(135deg,#fff3e0,#ffe0b2);border:2px solid #ff9800;border-radius:12px;padding:16px 20px;margin-top:20px;display:flex;justify-content:space-between;align-items:center}
  .grand-total .gt-label{font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase}
  .grand-total .gt-value{font-size:24px;font-weight:800;color:#e65100}
  .grand-total .gt-items{font-size:12px;color:#92400e;margin-top:2px}
  @media print{body{padding:12px}}
  .cat-section{margin-bottom:16px}
</style>
</head><body>
<h1>🍽️ Sri Krishna Hotel</h1>
<div class="sub">Daily Sales Report — ${dateFormatted}</div>
<div class="summary">
  <div class="sbox"><div class="lbl">Total Orders</div><div class="val">${_todayOrders.length}</div></div>
  <div class="sbox"><div class="lbl">Total Revenue</div><div class="val">₹${totalRev.toLocaleString('en-IN')}</div></div>
  <div class="sbox"><div class="lbl">Cash</div><div class="val">₹${totalCash.toLocaleString('en-IN')}</div></div>
  <div class="sbox"><div class="lbl">UPI / Online</div><div class="val">₹${totalUpi.toLocaleString('en-IN')}</div></div>
</div>

<h2>📊 Category-wise Sales Breakdown</h2>
${categoryHTML}

<div class="grand-total">
  <div>
    <div class="gt-label">Grand Total Sales</div>
    <div class="gt-items">${grandTotalQty} items sold across ${sortedCats.length} categories</div>
  </div>
  <div class="gt-value">₹${totalRev.toLocaleString('en-IN')}</div>
</div>

<h2 style="margin-top:24px">📝 Order Details</h2>
<table><thead><tr><th>#</th><th>Order ID</th><th>Customer</th><th>Time</th><th>Items</th><th>Payment</th><th style="text-align:right">Amount</th></tr></thead>
<tbody>${orderRows}</tbody></table>

<div class="footer">Generated ${new Date().toLocaleString('en-IN')} · Sri Krishna Hotel Admin Panel</div>
</body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url  = URL.createObjectURL(blob);
        const win  = window.open(url, '_blank');

        if (win) {
            win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
        } else {
            const a = document.createElement('a');
            a.href = url; a.download = `SriKrishna_Report_${TODAY}.html`; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 3000);
        }

        showToast('✅ Report ready — Save as PDF from print dialog', 'success');

    } catch (err) {
        console.error('[Report] Error:', err);
        showToast('❌ Report generation failed', 'error');
    } finally {
        btnGenReport.disabled = false;
        btnGenReport.innerHTML = '<i class="fas fa-file-pdf"></i> <span>Generate PDF<br><small>Download report</small></span>';
    }
}


// ===================================================
// WHATSAPP REPORT
// Sends a formatted text summary — no data modification
// ===================================================
function sendWhatsAppReport() {
    if (_todayOrders.length === 0) {
        showToast('📋 No orders today to share', 'info');
        return;
    }

    let totalRev = 0, totalCash = 0, totalUpi = 0;
    _todayOrders.forEach(o => {
        const amt = o.totalAmount || 0;
        totalRev += amt;
        const pm = (o.paymentMethod || '').toLowerCase();
        if (pm === 'cash') totalCash += amt; else totalUpi += amt;
    });

    const dateFormatted = new Date(TODAY + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });

    const msg = [
        `🍽️ *Sri Krishna Hotel*`,
        `📅 Daily Report — ${dateFormatted}`,
        ``,
        `📦 Total Orders  : *${_todayOrders.length}*`,
        `💰 Total Revenue : *₹${totalRev.toLocaleString('en-IN')}*`,
        `💵 Cash          : *₹${totalCash.toLocaleString('en-IN')}*`,
        `📱 UPI / Online  : *₹${totalUpi.toLocaleString('en-IN')}*`,
        ``,
        `_Generated via Admin Panel_`
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    showToast('📲 Opening WhatsApp…', 'info');
}

// ===================================================
// ARCHIVE & RESET (SAFE — NO PERMANENT DELETE)
// Step 1: Copy order to archive_orders collection
// Step 2: Update original order status → "archived"
//         (does NOT delete the original document)
// Step 3: Refresh UI — archived orders are hidden from view
// ===================================================
async function archiveAndReset() {
    closeResetModal();

    if (_todayOrders.length === 0) {
        showToast('📋 No active orders today to archive', 'info');
        return;
    }

    btnEndDay.disabled = true;
    btnEndDay.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Archiving…</span>';

    try {
        const db  = window._adminDB;
        const api = window._firestoreAPI;
        const { collection, addDoc, doc, updateDoc, serverTimestamp } = api;

        let archived = 0, failed = 0;

        for (const order of _todayOrders) {
            try {
                const docId = order._docId;

                // Step 1 — copy full order data to archive_orders
                await addDoc(collection(db, 'archive_orders'), {
                    ...order,
                    _docId:      undefined,       // don't copy internal ref field
                    archivedAt:  serverTimestamp(),
                    archiveDate: TODAY,
                    status:      'archived'
                });

                // Step 2 — mark original as archived (NOT deleted)
                if (docId) {
                    await updateDoc(doc(db, 'orders', docId), {
                        status:     'archived',
                        archivedAt: serverTimestamp()
                    });
                }

                archived++;
            } catch (e) {
                console.error('[Archive] Failed for order:', order.id, e);
                failed++;
            }
        }

        if (failed > 0) {
            showToast(`⚠️ ${archived} archived, ${failed} failed. Check Firestore.`, 'error');
        } else {
            showToast(`✅ ${archived} orders archived safely. Day reset!`, 'success');
        }

        // Reload — archived orders filtered out from view automatically
        await loadTodayOrders();

    } catch (err) {
        console.error('[Archive] Critical error:', err);
        showToast('❌ Archive failed. Data is safe. Try again.', 'error');
    } finally {
        btnEndDay.disabled = false;
        btnEndDay.innerHTML = '<i class="fas fa-archive"></i> <span>End Day<br><small>Archive & reset</small></span>';
    }
}

// ===== MODALS =====
function openResetModal()  { resetModal.classList.add('open');   document.body.style.overflow = 'hidden'; }
function closeResetModal() { resetModal.classList.remove('open'); document.body.style.overflow = ''; }
function openLogoutModal()  { logoutModal.classList.add('open');   document.body.style.overflow = 'hidden'; }
function closeLogoutModal() { logoutModal.classList.remove('open'); document.body.style.overflow = ''; }

async function handleLogout() {
    closeLogoutModal();
    btnLogout.disabled = true;
    btnLogout.innerHTML = '<i class="fas fa-circle-notch" style="animation:spin 0.8s linear infinite"></i> <span>Signing out…</span>';
    try { localStorage.removeItem('sriKrishnaAdminMeta'); } catch (_) {}
    window.addEventListener('admin-signout-error', e => {
        showToast('❌ Sign out failed: ' + e.detail, 'error');
        btnLogout.disabled = false;
        btnLogout.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span>Sign Out</span>';
    }, { once: true });
    window.dispatchEvent(new Event('admin-signout-requested'));
}

// ===== EVENT LISTENERS =====
function setupListeners() {
    if (btnLogout)        btnLogout.addEventListener('click', openLogoutModal);
    if (btnCancel)        btnCancel.addEventListener('click', closeLogoutModal);
    if (btnConfirmLogout) btnConfirmLogout.addEventListener('click', handleLogout);
    if (logoutModal)      logoutModal.addEventListener('click', e => { if (e.target === logoutModal) closeLogoutModal(); });

    if (btnCustomerSite) btnCustomerSite.addEventListener('click', () => window.open('index.html', '_blank', 'noopener,noreferrer'));

    if (btnGenReport)      btnGenReport.addEventListener('click', generatePDFReport);
    if (btnWhatsappReport) btnWhatsappReport.addEventListener('click', sendWhatsAppReport);
    if (btnEndDay)         btnEndDay.addEventListener('click', openResetModal);

    if (btnResetCancel)  btnResetCancel.addEventListener('click', closeResetModal);
    if (btnResetConfirm) btnResetConfirm.addEventListener('click', archiveAndReset);
    if (resetModal)      resetModal.addEventListener('click', e => { if (e.target === resetModal) closeResetModal(); });

    document.querySelectorAll('.coming-soon-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const title = btn.querySelector('.action-title')?.textContent || 'This feature';
            showToast(`🚧 ${title} coming soon!`);
        });
    });

    console.log('[Dashboard] Listeners attached.');
}

// ===== TOAST =====
let _toastTimer = null;
function showToast(message, type = 'default') {
    clearTimeout(_toastTimer);
    toastMsg.textContent = message;
    toast.className = 'toast show ' + type;
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== FORMAT INR =====
function formatINR(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (posModal?.classList.contains('open')) { closePosModal(); return; }
        if (logoutModal?.classList.contains('open')) closeLogoutModal();
        if (resetModal?.classList.contains('open'))  closeResetModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') openLogoutModal();
    // Ctrl+R to reload stats
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        loadTodayOrders().then(() => showToast('🔄 Orders refreshed'));
    }
});

// ===== SPIN KEYFRAME =====
if (!document.getElementById('spin-keyframe')) {
    const s = document.createElement('style');
    s.id = 'spin-keyframe';
    s.textContent = '@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
    document.head.appendChild(s);
}

// ===== PUBLIC API =====
window.adminDashboard = {
    loadTodayOrders,
    generatePDFReport,
    sendWhatsAppReport,
    archiveAndReset,
    showToast,
    formatINR,
    getTodayDate,
    get todayOrders() { return _todayOrders; }
};

console.log('[Dashboard] Ready | Date:', TODAY);


// ===================================================
// MANUAL BILL ENTRY (POS SYSTEM)
// ===================================================
// Uses hardcoded MENU_ITEMS from customer site.
// Supports two modes per line:
//   - SELECT: choose from dropdown (default)
//   - NEW: type custom name + price (for Tea, Milk, etc.)
// ===================================================

// ===== HARDCODED MENU ITEMS (from script.js) =====
const POS_MENU_ITEMS = [
    { name: "Chicken Rice",      price: 90,  category: "Rice" },
    { name: "Egg Rice",          price: 80,  category: "Rice" },
    { name: "Veg Rice",          price: 70,  category: "Rice" },
    { name: "Idly",              price: 10,  category: "Tiffin" },
    { name: "Vada",              price: 10,  category: "Tiffin" },
    { name: "Dosa",              price: 20,  category: "Tiffin" },
    { name: "Plain Dosa",        price: 50,  category: "Tiffin" },
    { name: "Set Dosa",          price: 50,  category: "Tiffin" },
    { name: "Masala Dosa",       price: 70,  category: "Tiffin" },
    { name: "Poori",             price: 40,  category: "Tiffin" },
    { name: "Chicken Biryani",   price: 100, category: "Biryani" },
    { name: "Egg Biryani",       price: 80,  category: "Biryani" },
    { name: "Veg Biryani",       price: 70,  category: "Biryani" },
    { name: "Veg Meals",         price: 80,  category: "Meals" },
    { name: "Non Veg Meals",     price: 120, category: "Meals" },
    { name: "Fish Meals",        price: 140, category: "Meals" },
    { name: "Bread",             price: 20,  category: "Bread Items" },
    { name: "Veg Sandwich",      price: 80,  category: "Bread Items" },
    { name: "Chicken Sandwich",  price: 120, category: "Bread Items" },
    { name: "Omelette",          price: 20,  category: "Egg Items" },
    { name: "Half Boil",         price: 20,  category: "Egg Items" },
    { name: "Boiled Egg",        price: 20,  category: "Egg Items" },
    { name: "Chicken 100g",      price: 40,  category: "Chicken" },
    { name: "Chicken 1kg",       price: 400, category: "Chicken" },
    { name: "Chicken Noodles",   price: 90,  category: "Noodles" },
    { name: "Veg Noodles",       price: 60,  category: "Noodles" },
    { name: "Egg Noodles",       price: 80,  category: "Noodles" },
    { name: "Chicken Semiya",    price: 90,  category: "Semiya" },
    { name: "Egg Semiya",        price: 60,  category: "Semiya" },
    { name: "Veg Semiya",        price: 60,  category: "Semiya" }
];

// ===== DOM REFS =====
let _posLineCount = 1;
let posModal = null;
let posModalClose = null;
let posLinesContainer = null;
let btnAddLine = null;
let btnPosSubmit = null;
let posGrandTotal = null;

function initPosDOMRefs() {
    posModal        = document.getElementById('pos-modal');
    posModalClose   = document.getElementById('pos-modal-close');
    posLinesContainer = document.getElementById('pos-lines');
    btnAddLine      = document.getElementById('btn-add-line');
    btnPosSubmit    = document.getElementById('btn-pos-submit');
    posGrandTotal   = document.getElementById('pos-grand-total');
}

// ===== OPEN / CLOSE =====
function openPosModal() {
    if (!posModal) initPosDOMRefs();
    if (posModal) {
        posModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        resetPosForm();
    }
}
function closePosModal() {
    if (!posModal) initPosDOMRefs();
    if (posModal) {
        posModal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function resetPosForm() {
    if (!posLinesContainer) initPosDOMRefs();
    _posLineCount = 1;
    if (posLinesContainer) {
        posLinesContainer.innerHTML = createPosLineHTML(0);
    }
    const nameEl  = document.getElementById('pos-customer-name');
    const mobEl   = document.getElementById('pos-customer-mobile');
    const tblEl   = document.getElementById('pos-table-number');
    if (nameEl) nameEl.value = '';
    if (mobEl)  mobEl.value  = '';
    if (tblEl)  tblEl.value  = '';
    const cashRadio = document.querySelector('input[name="pos-payment"][value="cash"]');
    if (cashRadio) cashRadio.checked = true;
    updatePosGrandTotal();
    attachPosLineListeners();
    populatePosSelects();
}

// ===== POPULATE DROPDOWNS =====
function populatePosSelects() {
    const selects = document.querySelectorAll('.pos-select[data-role="item"]');
    const optionsHTML = POS_MENU_ITEMS.map(item =>
        `<option value="${escapeHtml(item.name)}" data-price="${item.price}">${escapeHtml(item.name)} — ₹${item.price}</option>`
    ).join('');

    selects.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '<option value="" data-price="0">-- Select Item --</option>' + optionsHTML;
        if (currentVal) select.value = currentVal;
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== POS LINE HTML =====
function createPosLineHTML(index) {
    return `
        <div class="pos-line" data-line="${index}">
            <div class="pos-mode-toggle">
                <button type="button" class="pos-mode-btn active" data-mode="select" data-line="${index}">
                    <i class="fas fa-list"></i> Select
                </button>
                <button type="button" class="pos-mode-btn" data-mode="new" data-line="${index}">
                    <i class="fas fa-plus"></i> New
                </button>
            </div>
            <div class="pos-select-mode" data-line="${index}">
                <div class="pos-field pos-item-field">
                    <label>Food Item</label>
                    <select class="pos-select" data-role="item" data-line="${index}">
                        <option value="" data-price="0">-- Select Item --</option>
                    </select>
                </div>
            </div>
            <div class="pos-new-mode" data-line="${index}" style="display:none;">
                <div class="pos-field pos-item-field">
                    <label>Item Name</label>
                    <input type="text" class="pos-input pos-new-name" data-role="new-name" data-line="${index}" placeholder="e.g. Tea, Milk">
                </div>
                <div class="pos-field pos-new-price-field">
                    <label>Price (₹)</label>
                    <input type="number" class="pos-input pos-new-price" data-role="new-price" data-line="${index}" placeholder="0" min="1">
                </div>
            </div>
            <div class="pos-field pos-qty-field">
                <label>Qty</label>
                <input type="number" class="pos-qty" data-role="qty" data-line="${index}" value="1" min="1" max="99">
            </div>
            <div class="pos-field pos-price-field">
                <label>Price</label>
                <div class="pos-price-display" data-role="price" data-line="${index}">₹0</div>
            </div>
            <div class="pos-field pos-total-field">
                <label>Total</label>
                <div class="pos-line-total" data-role="linetotal" data-line="${index}">₹0</div>
            </div>
            <button type="button" class="pos-remove-line" data-action="remove-line" data-line="${index}" title="Remove" style="${_posLineCount > 1 ? '' : 'display:none;'}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
}

// ===== EVENT LISTENERS FOR POS LINES =====
function attachPosLineListeners() {
    if (!posLinesContainer) initPosDOMRefs();
    if (!posLinesContainer) return;

    // Mode toggle buttons
    posLinesContainer.querySelectorAll('.pos-mode-btn').forEach(btn => {
        btn.onclick = function() {
            const lineIdx = this.dataset.line;
            const mode = this.dataset.mode;
            const line = posLinesContainer.querySelector(`.pos-line[data-line="${lineIdx}"]`);
            if (!line) return;

            line.querySelectorAll('.pos-mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const selectMode = line.querySelector('.pos-select-mode');
            const newMode = line.querySelector('.pos-new-mode');
            if (mode === 'select') {
                selectMode.style.display = 'block';
                newMode.style.display = 'none';
            } else {
                selectMode.style.display = 'none';
                newMode.style.display = 'block';
            }
            updatePosLine(line);
        };
    });

    // Select dropdowns
    posLinesContainer.querySelectorAll('.pos-select[data-role="item"]').forEach(sel => {
        sel.onchange = function() {
            const line = this.closest('.pos-line');
            updatePosLine(line);
        };
    });

    // New item inputs
    posLinesContainer.querySelectorAll('.pos-new-name, .pos-new-price').forEach(inp => {
        inp.oninput = function() {
            const line = this.closest('.pos-line');
            updatePosLine(line);
        };
    });

    // Quantity inputs
    posLinesContainer.querySelectorAll('.pos-qty[data-role="qty"]').forEach(inp => {
        inp.oninput = function() {
            let val = parseInt(this.value) || 1;
            if (val < 1) val = 1;
            if (val > 99) val = 99;
            this.value = val;
            const line = this.closest('.pos-line');
            updatePosLine(line);
        };
    });

    // Remove buttons
    posLinesContainer.querySelectorAll('.pos-remove-line').forEach(btn => {
        btn.onclick = function() {
            const line = this.closest('.pos-line');
            line.remove();
            _posLineCount--;
            updatePosGrandTotal();
            const remaining = posLinesContainer.querySelectorAll('.pos-line');
            if (remaining.length === 1) {
                remaining[0].querySelector('.pos-remove-line').style.display = 'none';
            }
        };
    });
}

// ===== UPDATE LINE CALCULATION =====
function updatePosLine(lineEl) {
    const qtyInp = lineEl.querySelector('.pos-qty[data-role="qty"]');
    const priceEl = lineEl.querySelector('.pos-price-display[data-role="price"]');
    const totalEl = lineEl.querySelector('.pos-line-total[data-role="linetotal"]');

    const selectMode = lineEl.querySelector('.pos-select-mode');
    const isSelectMode = selectMode && selectMode.style.display !== 'none';

    let price = 0;
    if (isSelectMode) {
        const select = lineEl.querySelector('.pos-select[data-role="item"]');
        const selectedOpt = select?.options[select.selectedIndex];
        price = parseFloat(selectedOpt?.dataset.price || 0);
    } else {
        const priceInp = lineEl.querySelector('.pos-new-price[data-role="new-price"]');
        price = parseFloat(priceInp?.value || 0);
    }

    const qty = parseInt(qtyInp?.value || 1);
    const lineTotal = price * qty;

    if (priceEl) priceEl.textContent = '₹' + price.toLocaleString('en-IN');
    if (totalEl) totalEl.textContent = '₹' + lineTotal.toLocaleString('en-IN');

    updatePosGrandTotal();
}

// ===== UPDATE GRAND TOTAL =====
function updatePosGrandTotal() {
    if (!posGrandTotal) initPosDOMRefs();
    if (!posGrandTotal) return;
    let grand = 0;
    const lines = posLinesContainer ? posLinesContainer.querySelectorAll('.pos-line') : [];
    lines.forEach(line => {
        const selectMode = line.querySelector('.pos-select-mode');
        const isSelectMode = selectMode && selectMode.style.display !== 'none';

        let price = 0;
        if (isSelectMode) {
            const select = line.querySelector('.pos-select[data-role="item"]');
            const selectedOpt = select?.options[select.selectedIndex];
            price = parseFloat(selectedOpt?.dataset.price || 0);
        } else {
            const priceInp = line.querySelector('.pos-new-price[data-role="new-price"]');
            price = parseFloat(priceInp?.value || 0);
        }

        const qtyInp = line.querySelector('.pos-qty[data-role="qty"]');
        const qty = parseInt(qtyInp?.value || 0);
        grand += price * qty;
    });
    posGrandTotal.textContent = '₹' + grand.toLocaleString('en-IN');
}

// ===== ADD NEW LINE =====
function addPosLine() {
    if (!posLinesContainer) initPosDOMRefs();
    if (!posLinesContainer) return;
    const newIndex = _posLineCount;
    _posLineCount++;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = createPosLineHTML(newIndex);
    const newLine = wrapper.firstElementChild;
    posLinesContainer.appendChild(newLine);

    posLinesContainer.querySelectorAll('.pos-remove-line').forEach(btn => {
        btn.style.display = 'flex';
    });

    const select = newLine.querySelector('.pos-select[data-role="item"]');
    if (select && POS_MENU_ITEMS.length > 0) {
        const optionsHTML = POS_MENU_ITEMS.map(item =>
            `<option value="${escapeHtml(item.name)}" data-price="${item.price}">${escapeHtml(item.name)} — ₹${item.price}</option>`
        ).join('');
        select.innerHTML = '<option value="" data-price="0">-- Select Item --</option>' + optionsHTML;
    }

    attachPosLineListeners();
    newLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== SUBMIT BILL =====
async function submitPosBill() {
    if (!posLinesContainer) initPosDOMRefs();
    const lines = posLinesContainer ? posLinesContainer.querySelectorAll('.pos-line') : [];
    const items = [];
    let totalAmount = 0;

    lines.forEach(line => {
        const qtyInp = line.querySelector('.pos-qty[data-role="qty"]');
        const qty = parseInt(qtyInp?.value || 0);
        if (qty <= 0) return;

        const selectMode = line.querySelector('.pos-select-mode');
        const isSelectMode = selectMode && selectMode.style.display !== 'none';

        let name = '';
        let price = 0;

        if (isSelectMode) {
            const select = line.querySelector('.pos-select[data-role="item"]');
            const selectedOpt = select?.options[select.selectedIndex];
            name = selectedOpt?.value || '';
            price = parseFloat(selectedOpt?.dataset.price || 0);
        } else {
            const nameInp = line.querySelector('.pos-new-name[data-role="new-name"]');
            const priceInp = line.querySelector('.pos-new-price[data-role="new-price"]');
            name = nameInp?.value.trim() || '';
            price = parseFloat(priceInp?.value || 0);
        }

        if (name && price > 0 && qty > 0) {
            items.push({ name, price, quantity: qty });
            totalAmount += price * qty;
        }
    });

    if (items.length === 0) {
        showToast('⚠️ Please add at least one item', 'error');
        return;
    }

    const paymentMethod = document.querySelector('input[name="pos-payment"]:checked')?.value || 'cash';
    const customerName  = document.getElementById('pos-customer-name')?.value.trim() || 'Walk-in Customer';
    const customerMobile = document.getElementById('pos-customer-mobile')?.value.trim() || '';
    const tableNumber   = document.getElementById('pos-table-number')?.value.trim() || 'Counter';

    if (btnPosSubmit) {
        btnPosSubmit.disabled = true;
        btnPosSubmit.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Saving…</span>';
    }

    try {
        const db  = window._adminDB;
        const api = window._firestoreAPI;
        if (!db || !api) {
            throw new Error('Firebase not ready');
        }

        const { collection, addDoc, serverTimestamp } = api;

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const orderDate = `${yyyy}-${mm}-${dd}`;

        const orderData = {
            id: 'MANUAL-' + Date.now(),
            customerName,
            customerMobile,
            tableNumber,
            paymentMethod,
            paymentStatus: paymentMethod === 'cash' ? 'Cash' : 'Paid (Online)',
            items,
            totalAmount,
            orderDate,
            date: now.toLocaleDateString('en-IN'),
            time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            timestamp: now.getTime(),
            processedAt: now.toISOString(),
            source: 'MANUAL',
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'orders'), orderData);

        showToast(`✅ Bill saved! ₹${totalAmount.toLocaleString('en-IN')} — ${items.length} item(s)`, 'success');
        closePosModal();

        // Refresh dashboard data
        await loadTodayOrders();

    } catch (err) {
        console.error('[POS] Submit error:', err);
        showToast('❌ Failed to save bill: ' + err.message, 'error');
    } finally {
        if (btnPosSubmit) {
            btnPosSubmit.disabled = false;
            btnPosSubmit.innerHTML = '<i class="fas fa-receipt"></i> <span>Submit Bill</span>';
        }
    }
}

// ===== POS EVENT LISTENERS =====
function setupPosListeners() {
    if (!posModalClose) initPosDOMRefs();
    if (posModalClose)   posModalClose.addEventListener('click', closePosModal);
    if (posModal)        posModal.addEventListener('click', e => { if (e.target === posModal) closePosModal(); });
    if (btnAddLine)      btnAddLine.addEventListener('click', addPosLine);
    if (btnPosSubmit)    btnPosSubmit.addEventListener('click', submitPosBill);

    const mobInp = document.getElementById('pos-customer-mobile');
    if (mobInp) {
        mobInp.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    }
}

// ===== ADD POS BUTTON TO QUICK ACTIONS =====
function injectPosButton() {
    const quickActions = document.querySelector('.quick-actions');
    if (!quickActions) return;
    if (document.getElementById('btn-pos-entry')) return;

    const btn = document.createElement('button');
    btn.id = 'btn-pos-entry';
    btn.className = 'action-btn';
    btn.setAttribute('aria-label', 'Manual bill entry');
    btn.innerHTML = `
        <div class="action-icon orange"><i class="fas fa-calculator"></i></div>
        <div class="action-title">Manual Bill</div>
        <div class="action-desc">POS counter billing</div>
    `;
    btn.addEventListener('click', openPosModal);
    quickActions.insertBefore(btn, quickActions.firstElementChild);
}

// ===== INIT POS SYSTEM =====
function initPosSystem() {
    initPosDOMRefs();
    injectPosButton();
    setupPosListeners();
    console.log('[POS] Manual Bill Entry system ready');
}

// Run init after dashboard is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPosSystem);
} else {
    initPosSystem();
}

// Also expose for late init
window._initPosSystem = initPosSystem;