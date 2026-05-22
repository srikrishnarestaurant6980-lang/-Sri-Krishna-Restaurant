// admin-dashboard.js — Sri Krishna Hotel Admin Panel
// =====================================================
// SAFETY RULES (read before editing):
//   1. Daily 12 AM: PERMANENTLY DELETE previous day orders from Firestore
//   2. End Day button: PERMANENTLY DELETE all today's orders
//   3. Live Orders: UI-ONLY filter (1 hour TTL) — no database deletion
//   4. orderDate field (YYYY-MM-DD) is used for all date filtering
//   5. QR flow and manual order flow are NEVER touched here
// =====================================================

'use strict';

// ===== FORWARD DECLARATIONS =====
// These are defined later in the file but referenced earlier
let POS_MENU_ITEMS = [];  // Populated by loadPosMenuFromFirestore()


// ===== TODAY DATE — single source of truth =====
function getTodayDate() {
    const d  = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}
const TODAY = getTodayDate();
const DEFAULT_MENU_EMOJI = '\u{1F37D}\uFE0F';

let _posMenuListenerStarted = false;

function isAdminFirestoreReady() {
    return Boolean(window._adminDB && window._firestoreAPI);
}

function normalizeMenuItem(item = {}, fallbackId = 0) {
    return {
        _docId: item._docId || null,
        id: item.id != null ? item.id : fallbackId,
        name: item.name || '',
        price: Number(item.price) || 0,
        category: item.category || 'Others',
        emoji: item.emoji || DEFAULT_MENU_EMOJI,
        image: item.image || '',
        active: item.active !== false
    };
}

function mapMenuFallbackItems(items = []) {
    return items.map((item, index) => normalizeMenuItem(item, index + 1));
}

function getMenuNameKey(name) {
    return String(name || '').trim().toLowerCase();
}

function shouldPreferMenuItem(candidate, current) {
    if (candidate.active !== false && current.active === false) return true;
    if (current.active !== false && candidate.active === false) return false;
    const cId = Number(candidate.id) || 9999;
    const kId = Number(current.id) || 9999;
    if (cId !== kId) return cId < kId;
    if (candidate.image && !current.image) return true;
    if (current.image && !candidate.image) return false;
    return false;
}

function dedupeMenuItems(items = []) {
    const uniqueMap = new Map();
    const duplicates = [];

    items.forEach(item => {
        const key = getMenuNameKey(item.name);
        if (!key) return;

        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
            return;
        }

        const kept = uniqueMap.get(key);
        if (shouldPreferMenuItem(item, kept)) {
            duplicates.push(kept);
            uniqueMap.set(key, item);
        } else {
            duplicates.push(item);
        }
    });

    return {
        unique: Array.from(uniqueMap.values()),
        duplicateDocIds: duplicates.map(d => d._docId).filter(Boolean)
    };
}

async function removeDuplicateMenuDocs(docIds = []) {
    if (!docIds.length || !isAdminFirestoreReady()) return 0;

    const db = window._adminDB;
    const api = window._firestoreAPI;
    const { doc, deleteDoc } = api;
    let removed = 0;

    for (const docId of docIds) {
        try {
            await deleteDoc(doc(db, 'menu_items', docId));
            removed++;
        } catch (err) {
            console.error('[MenuMgmt] Duplicate remove failed:', docId, err);
        }
    }

    return removed;
}

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
    try {
        console.log('[Dashboard] Init | session date:', TODAY, '| user:', user?.email);
        populateUserInfo(user);
        updateSessionBadge();
        startClock();
        loadTodayOrders();
        setupListeners();
        startCleanupScheduler();
    } catch (err) {
        console.error('[Dashboard] Init error:', err);
        showToast('⚠️ Dashboard initialization failed', 'error');
    }
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
    if (!user) return;
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
            showPlaceholderStats();
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
        renderLiveOrders(filterLiveOrders(_todayOrders));
        updateReportSummary();

        console.log('[Dashboard] Today orders loaded:', _todayOrders.length, '| Live:', filterLiveOrders(_todayOrders).length);

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
        renderLiveOrders(filterLiveOrders(_todayOrders));
        updateReportSummary();

        console.log('[Dashboard] Fallback loaded:', _todayOrders.length, 'orders for', TODAY, '| Live:', filterLiveOrders(_todayOrders).length);

    } catch (err) {
        console.error('[Dashboard] Fallback load error:', err);
        renderOrdersEmpty('Could not load orders.');
        showPlaceholderStats();
    }
}

// ===== COMPUTE STATS =====
function computeAndDisplayStats() {
    let revenue = 0, cash = 0, upi = 0;

    if (!_todayOrders || !Array.isArray(_todayOrders)) {
        _todayOrders = [];
    }

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

    // Update order counts by payment method
    let cashCount = 0, upiCount = 0;
    _todayOrders.forEach(o => {
        const pm = (o.paymentMethod || '').toLowerCase();
        if (pm === 'cash') cashCount++;
        else upiCount++;
    });
    const rptCashCount = document.getElementById('rpt-cash-count');
    const rptUpiCount = document.getElementById('rpt-upi-count');
    if (rptCashCount) rptCashCount.textContent = cashCount + ' order' + (cashCount !== 1 ? 's' : '');
    if (rptUpiCount) rptUpiCount.textContent = upiCount + ' order' + (upiCount !== 1 ? 's' : '');

    // Render category breakdown and top items
    renderCategoryReport();
    renderTopItemsReport();
}



// ===== CATEGORY REPORT =====
function renderCategoryReport() {
    const container = document.getElementById('rpt-cat-grid');
    if (!container) return;

    if (_todayOrders.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;font-size:0.9rem">No orders today</div>';
        return;
    }

    // Build category data
    const catData = {};
    const catEmojis = {
        'Rice': '🍚', 'Tiffin': '🥞', 'Biryani': '🍗', 'Meals': '🍱',
        'Bread Items': '🍞', 'Egg Items': '🥚', 'Chicken': '🍗', 
        'Noodles': '🍜', 'Semiya': '🍝', 'Others': '🍽️'
    };

    _todayOrders.forEach(order => {
        if (!Array.isArray(order.items)) return;
        order.items.forEach(item => {
            const menuItem = POS_MENU_ITEMS.find(m => m.name === item.name);
            const category = menuItem ? menuItem.category : 'Others';
            if (!catData[category]) {
                catData[category] = { qty: 0, revenue: 0, orders: 0 };
            }
            const qty = item.quantity || item.qty || 1;
            catData[category].qty += qty;
            catData[category].revenue += (item.price || 0) * qty;
            catData[category].orders++;
        });
    });

    const catOrder = ['Rice','Tiffin','Biryani','Meals','Bread Items','Egg Items','Chicken','Noodles','Semiya','Others'];
    const sortedCats = Object.keys(catData).sort((a, b) => {
        const ia = catOrder.indexOf(a);
        const ib = catOrder.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    const frag = document.createDocumentFragment();
    sortedCats.forEach(cat => {
        const data = catData[cat];
        const card = document.createElement('div');
        card.className = 'rpt-cat-card';
        card.innerHTML = `
            <div class="rpt-cat-header" onclick="this.parentElement.classList.toggle('open')">
                <div class="rpt-cat-name">
                    <span class="cat-emoji">${catEmojis[cat] || '🍽️'}</span>
                    ${cat}
                </div>
                <div class="rpt-cat-summary">
                    <span>${data.qty} items</span>
                    <span>₹${data.revenue.toLocaleString('en-IN')}</span>
                </div>
                <i class="fas fa-chevron-down rpt-cat-toggle"></i>
            </div>
            <div class="rpt-cat-body">
                <table class="rpt-cat-table">
                    <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                    <tbody>
                        <tr><td>Items Sold</td><td>${data.qty}</td></tr>
                        <tr><td>Revenue</td><td>₹${data.revenue.toLocaleString('en-IN')}</td></tr>
                        <tr><td>Orders</td><td>${data.orders}</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        frag.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(frag);
}

// ===== TOP ITEMS REPORT =====
function renderTopItemsReport() {
    const container = document.getElementById('rpt-top-list');
    if (!container) return;

    if (_todayOrders.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;font-size:0.9rem">No orders today</div>';
        return;
    }

    // Build item data
    const itemData = {};
    _todayOrders.forEach(order => {
        if (!Array.isArray(order.items)) return;
        order.items.forEach(item => {
            const name = item.name || 'Unknown';
            const qty = item.quantity || item.qty || 1;
            const price = item.price || 0;
            if (!itemData[name]) {
                itemData[name] = { name, qty: 0, revenue: 0 };
            }
            itemData[name].qty += qty;
            itemData[name].revenue += price * qty;
        });
    });

    const sortedItems = Object.values(itemData).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const frag = document.createDocumentFragment();
    sortedItems.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'rpt-top-item';
        row.innerHTML = `
            <div class="rpt-top-rank">${idx + 1}</div>
            <div class="rpt-top-name">${item.name}</div>
            <div class="rpt-top-qty"><strong>${item.qty}</strong> sold</div>
            <div class="rpt-top-rev">₹${item.revenue.toLocaleString('en-IN')}</div>
        `;
        frag.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(frag);
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
                    const menuItem = POS_MENU_ITEMS && POS_MENU_ITEMS.find ? POS_MENU_ITEMS.find(m => m.name === name) : null;
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

        const catOrder = ['Rice','Tiffin','Biryani','Meals','Bread Items','Egg Items','Chicken','Noodles','Semiya','Others'];
        const sortedCats = Object.keys(categoryMap).sort((a,b) => {
            const ia = catOrder.indexOf(a);
            const ib = catOrder.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });

        let categoryHTML = '';
        let grandTotalQty = 0;

        sortedCats.forEach((cat) => {
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
        const a = document.createElement('a');
        a.href = url; 
        a.download = `SriKrishna_Report_${TODAY}.html`; 
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 3000);

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

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_self', 'noopener,noreferrer');
    showToast('📲 Opening WhatsApp…', 'info');
}

// ===================================================
// END DAY & RESET (PERMANENT DELETE)
// Step 1: PERMANENTLY DELETE all today's orders from database
// Step 2: Refresh UI
// WARNING: This CANNOT be undone. Use only after day is complete.
// ===================================================
async function archiveAndReset() {
    closeResetModal();

    if (!_todayOrders || _todayOrders.length === 0) {
        showToast('📋 No active orders today to clear', 'info');
        return;
    }

    btnEndDay.disabled = true;
    btnEndDay.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Deleting…</span>';

    try {
        const db  = window._adminDB;
        const api = window._firestoreAPI;
        const { deleteDoc, doc } = api;

        let deleted = 0, failed = 0;

        for (const order of _todayOrders) {
            try {
                const docId = order._docId;

                // PERMANENTLY DELETE from database
                if (docId) {
                    await deleteDoc(doc(db, 'orders', docId));
                }

                deleted++;
            } catch (e) {
                console.error('[Delete] Failed for order:', order.id, e);
                failed++;
            }
        }

        if (failed > 0) {
            showToast(`⚠️ ${deleted} deleted, ${failed} failed. Check Firestore.`, 'error');
        } else {
            showToast(`🗑️ ${deleted} orders PERMANENTLY DELETED. Day reset!`, 'success');
        }

        // Reload — deleted orders gone from view
        await loadTodayOrders();

    } catch (err) {
        console.error('[Delete] Critical error:', err);
        showToast('❌ Delete failed. Try again.', 'error');
    } finally {
        btnEndDay.disabled = false;
        btnEndDay.innerHTML = '<i class="fas fa-trash-alt"></i> <span>End Day<br><small>Delete & reset</small></span>';
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
    // Navigation & Auth
    if (btnLogout)        btnLogout.addEventListener('click', openLogoutModal);
    if (btnCancel)        btnCancel.addEventListener('click', closeLogoutModal);
    if (btnConfirmLogout) btnConfirmLogout.addEventListener('click', handleLogout);
    if (logoutModal)      logoutModal.addEventListener('click', e => { if (e.target === logoutModal) closeLogoutModal(); });

    // Customer site link
    if (btnCustomerSite) btnCustomerSite.addEventListener('click', () => window.open('index.html', '_self', 'noopener,noreferrer'));

    // Report buttons
    if (btnGenReport)      btnGenReport.addEventListener('click', generatePDFReport);
    if (btnWhatsappReport) btnWhatsappReport.addEventListener('click', sendWhatsAppReport);
    if (btnEndDay)         btnEndDay.addEventListener('click', openResetModal);

    // Reset modal
    if (btnResetCancel)  btnResetCancel.addEventListener('click', closeResetModal);
    if (btnResetConfirm) btnResetConfirm.addEventListener('click', archiveAndReset);
    if (resetModal)      resetModal.addEventListener('click', e => { if (e.target === resetModal) closeResetModal(); });

    // Coming soon buttons (if any)
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
// AUTO-CLEANUP SYSTEM
// Rules:
//   1. MIDNIGHT RESET: Every day at 12:00 AM - clear all previous day data
//   2. LIVE ORDERS: IMMEDIATE delete if > 1 hour old (checked every minute)
//   3. ARCHIVE DATA: Delete after 3 days
// ===================================================

const LIVE_ORDER_TTL_MS = 60 * 60 * 1000;        // 1 hour
const ARCHIVE_MAX_AGE_DAYS = 3;                   // 3 days
let _lastMidnightCheck = null;

function getCutoffTimestamp(hoursAgo) {
    return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
}

function getMidnightDate() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

// ===== 1. DAILY MIDNIGHT RESET (12:00 AM) =====
// Every day at midnight, PERMANENTLY DELETE previous day orders from database
// and reset for fresh daily reporting
async function checkMidnightReset() {
    const now = new Date();

    // Check if it's past midnight (00:00 - 00:05 window)
    const hours = now.getHours();
    const mins = now.getMinutes();

    if (hours === 0 && mins < 5) {
        // Check if we already did reset today
        const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        if (_lastMidnightCheck === todayKey) return;

        console.log('[MidnightReset] 🌙 12:00 AM - Daily reset starting...');
        _lastMidnightCheck = todayKey;

        // PERMANENTLY DELETE all previous day orders from database
        await deletePreviousDayOrders();

        // Refresh dashboard
        await loadTodayOrders();
        showToast('🌙 New day started! Previous data cleared.', 'success');
    }
}

async function deletePreviousDayOrders() {
    try {
        const db = window._adminDB;
        const api = window._firestoreAPI;
        if (!db || !api) return;
        const { collection, getDocs, deleteDoc, doc } = api;

        // Fetch ALL orders and PERMANENTLY DELETE those before today
        const snap = await getDocs(collection(db, 'orders'));
        let deleted = 0;

        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            // Skip today's orders (from 12 AM onwards) - keep only today
            if (data.orderDate === TODAY) continue;

            // PERMANENTLY DELETE from database
            await deleteDoc(doc(db, 'orders', docSnap.id));
            deleted++;
        }

        if (deleted > 0) {
            console.log(`[MidnightReset] 🗑️ PERMANENTLY DELETED ${deleted} previous day orders`);
        }
    } catch (err) {
        console.error('[MidnightReset] Error:', err);
    }
}

// ===== 3. ARCHIVE CLEANUP (3 days) =====
async function cleanupOldArchives() {
    try {
        const db = window._adminDB;
        const api = window._firestoreAPI;
        if (!db || !api) return;
        const { collection, query, where, getDocs, deleteDoc, doc, Timestamp } = api;
        const cutoff = getCutoffTimestamp(24 * ARCHIVE_MAX_AGE_DAYS);
        const cutoffTimestamp = Timestamp.fromDate(cutoff);
        const q = query(
            collection(db, 'archive_orders'),
            where('archivedAt', '<', cutoffTimestamp)
        );
        const snap = await getDocs(q);
        let deleted = 0;
        snap.forEach(docSnap => {
            deleteDoc(doc(db, 'archive_orders', docSnap.id));
            deleted++;
        });
        if (deleted > 0) console.log(`[ArchiveCleanup] Deleted ${deleted} archives >${ARCHIVE_MAX_AGE_DAYS}days`);
    } catch (err) {
        console.error('[ArchiveCleanup] Error:', err);
    }
}

// ===== FILTER LIVE ORDERS FOR DISPLAY (1hr TTL) =====
// Both Customer (WEB) and Admin (MANUAL) orders show for 1 hour only in Live Orders panel
// After 1 hour, they are hidden from Live Orders but remain in database
function filterLiveOrders(orders) {
    if (!orders || !Array.isArray(orders)) return [];
    const oneHourAgo = Date.now() - LIVE_ORDER_TTL_MS;
    return orders.filter(o => {
        if (!o) return false;
        const ts = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : (o.timestamp || 0);
        return ts >= oneHourAgo;
    });
}

// ===== RENDER LIVE ORDERS =====
function renderLiveOrders(orders) {
    const liveList = document.getElementById('live-orders-list');
    const liveCount = document.getElementById('live-orders-count');
    if (!liveList) return;
    const safeOrders = orders || [];
    if (liveCount) liveCount.textContent = safeOrders.length;
    if (safeOrders.length === 0) {
        liveList.innerHTML = `
            <div class="orders-empty">
                <i class="fas fa-bolt" style="color:#f59e0b"></i>
                <p>No live orders</p>
                <small>All orders appear here for 1 hour only (both Customer & Admin)</small>
            </div>`;
        return;
    }
    const frag = document.createDocumentFragment();
    orders.forEach((order, idx) => {
        const item = document.createElement('div');
        item.className = 'order-item';
        let timeStr = '—';
        if (order.createdAt?.seconds) {
            timeStr = new Date(order.createdAt.seconds * 1000)
                .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else if (order.timestamp) {
            timeStr = new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }
        const pm = (order.paymentMethod || 'cash').toLowerCase();
        const isUpi = pm === 'upi' || pm === 'qr' || pm === 'online' || pm === 'qr_pending';
        const pmClass = isUpi ? 'payment-upi' : 'payment-cash';
        const pmLabel = isUpi ? 'UPI' : 'Cash';
        let itemsStr = '—';
        if (Array.isArray(order.items) && order.items.length > 0) {
            itemsStr = order.items.map(i => `${i.name || '?'} ×${i.quantity || i.qty || 1}`).join(', ');
        }
        const orderId = order.id || order.orderId || `#${String(idx + 1).padStart(3, '0')}`;
        const minsAgo = order.createdAt?.seconds ? 
            Math.floor((Date.now()/1000 - order.createdAt.seconds) / 60) : '?';
        item.innerHTML = `
            <div class="order-num" style="background:#fef3c7;color:#92400e">${String(idx + 1).padStart(2, '0')}</div>
            <div class="order-details">
                <div class="order-id">${orderId}</div>
                <div class="order-items-list" title="${itemsStr}">${itemsStr}</div>
                <div class="order-meta">
                    <span class="order-source ${order.source === 'MANUAL' ? 'source-admin' : 'source-customer'}">${order.source === 'MANUAL' ? 'Admin' : 'Customer'}</span>
                    <span class="order-time"><i class="fas fa-clock" style="font-size:.65rem"></i> ${timeStr}</span>
                    <span class="order-payment ${pmClass}">${pmLabel}</span>
                    <span class="order-time" style="color:#dc2626;font-weight:600">⏱️ ${minsAgo}m ago</span>
                </div>
            </div>
            <div class="order-amount">${formatINR(order.totalAmount || 0)}</div>
        `;
        frag.appendChild(item);
    });
    liveList.innerHTML = '';
    liveList.appendChild(frag);
}

// ===== SCHEDULER =====
// Every minute: Check daily midnight reset (00:00-00:05 window)
// Every hour: Check archive cleanup (3+ days old archives)
// NOTE: Daily reset PERMANENTLY DELETES previous day orders from database
function startCleanupScheduler() {
    console.log('[Scheduler] Starting...');

    // Immediate first run
    cleanupOldArchives();
    checkMidnightReset();

    // Every minute: Check daily midnight reset (00:00-00:05 window)
    // At midnight: PERMANENTLY DELETES all previous day orders
    setInterval(() => {
        checkMidnightReset();
    }, 60 * 1000); // 1 minute

    // Every hour: Archive cleanup (3+ days old archives)
    setInterval(() => {
        cleanupOldArchives();
    }, 60 * 60 * 1000); // 1 hour

    console.log('[Scheduler] Running: Daily reset at 12 AM (PERMANENT DELETE), Archive cleanup every 1hr');
}

// ===================================================
// MANUAL BILL ENTRY (POS SYSTEM)
// ===================================================
// Uses hardcoded MENU_ITEMS from customer site.
// Supports two modes per line:
//   - SELECT: choose from dropdown (default)
//   - NEW: type custom name + price (for Tea, Milk, etc.)
// ===================================================

// ===== POS MENU ITEMS — LOADED FROM FIRESTORE =====
// Same data source as customer site — admin edits update everywhere

const FALLBACK_POS_MENU = [
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

// ===== LOAD POS MENU FROM FIRESTORE =====
async function loadPosMenuFromFirestore() {
    try {
        const db = window._adminDB;
        const api = window._firestoreAPI;
        if (!db || !api) {
            POS_MENU_ITEMS = [...FALLBACK_POS_MENU];
            return;
        }

        const { collection, getDocs } = api;
        const snap = await getDocs(collection(db, 'menu_items'));

        const items = [];
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.active === false) return;
            items.push(normalizeMenuItem({
                ...data,
                _docId: docSnap.id
            }));
        });

        const { unique } = dedupeMenuItems(items);
        if (unique.length > 0) {
            POS_MENU_ITEMS = unique;
            console.log('[POS] Loaded', unique.length, 'items from Firestore');
        } else {
            POS_MENU_ITEMS = [...FALLBACK_POS_MENU];
        }

        // Refresh POS dropdowns if modal is open
        populatePosSelects();

    } catch (err) {
        console.error('[POS] Load error:', err);
        POS_MENU_ITEMS = [...FALLBACK_POS_MENU];
    }
}

// Setup real-time listener for POS menu
function setupPosMenuListener() {
    try {
        if (_posMenuListenerStarted) return;

        const db = window._adminDB;
        const api = window._firestoreAPI;
        if (!db || !api) return;

        const { collection, onSnapshot } = api;
        const q = collection(db, 'menu_items');

        onSnapshot(q, (snapshot) => {
            const items = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.active === false) return;
                items.push(normalizeMenuItem({
                    ...data,
                    _docId: docSnap.id
                }));
            });

            const { unique } = dedupeMenuItems(items);
            if (unique.length > 0) {
                POS_MENU_ITEMS = unique;
                populatePosSelects();
                console.log('[POS] Real-time update:', unique.length, 'items');
            }
        });
        _posMenuListenerStarted = true;
    } catch(e) {
        console.error('[POS] Listener error:', e);
    }
}

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
            <div class="pos-line-main">
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
                <div class="pos-qty-row">
                    <div class="pos-field pos-qty-field">
                        <label>Qty</label>
                        <div class="pos-qty-control">
                            <button type="button" class="pos-qty-btn pos-qty-minus" data-line="${index}"><i class="fas fa-minus"></i></button>
                            <input type="number" class="pos-qty" data-role="qty" data-line="${index}" value="1" min="1" max="99" readonly>
                            <button type="button" class="pos-qty-btn pos-qty-plus" data-line="${index}"><i class="fas fa-plus"></i></button>
                        </div>
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
            </div>
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

    // Quantity inputs (direct input + +/- buttons)
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

    // +/- quantity buttons
    posLinesContainer.querySelectorAll('.pos-qty-minus').forEach(btn => {
        btn.onclick = function() {
            const line = this.closest('.pos-line');
            const qtyInp = line.querySelector('.pos-qty[data-role="qty"]') || line.querySelector('.pos-qty[data-role="qty"]');
            let val = parseInt(qtyInp.value) || 1;
            if (val > 1) {
                qtyInp.value = val - 1;
                updatePosLine(line);
            }
        };
    });

    posLinesContainer.querySelectorAll('.pos-qty-plus').forEach(btn => {
        btn.onclick = function() {
            const line = this.closest('.pos-line');
            const qtyInp = line.querySelector('.pos-qty[data-role="qty"]') || line.querySelector('.pos-qty[data-role="qty"]');
            let val = parseInt(qtyInp.value) || 1;
            if (val < 99) {
                qtyInp.value = val + 1;
                updatePosLine(line);
            }
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
    const qtyInp = lineEl.querySelector('.pos-qty[data-role="qty"]') || lineEl.querySelector('.pos-qty[data-role="qty"]');
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

        const qtyInp = line.querySelector('.pos-qty[data-role="qty"]') || line.querySelector('.pos-qty[data-role="qty"]');
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
        const qtyInp = line.querySelector('.pos-qty[data-role="qty"]') || line.querySelector('.pos-qty[data-role="qty"]');
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
    loadPosMenuFromFirestore().then(() => {
        setupPosMenuListener();
    });
    console.log('[POS] Manual Bill Entry system ready');
}

// Run init after dashboard is ready
function tryInitPos() {
    if (document.getElementById('pos-modal')) {
        initPosSystem();
    } else {
        setTimeout(tryInitPos, 500);
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitPos);
} else {
    tryInitPos();
}

// Also expose for late init
window._initPosSystem = initPosSystem;

// ===================================================
// MENU MANAGEMENT SYSTEM
// Admin can edit food items - changes sync to Firestore
// Customer site reads from same Firestore collection
// ===================================================

// ===== MENU MANAGEMENT DOM REFS =====
let menuModal = null;
let menuModalClose = null;
let menuItemsContainer = null;
let btnMenuAdd = null;
let btnMenuSave = null;
let menuSearchInput = null;

// ===== MENU ITEMS CACHE =====
let _menuItems = [];
let _menuEditMode = false;
let _menuEditId = null;
let _menuEditName = '';

function hasMenuItemsWithDocIds() {
    return _menuItems.some(item => Boolean(item._docId));
}

function findMenuItemByRef(ref, fallbackName = '') {
    const refString = String(ref);
    const normalizedName = String(fallbackName || '').trim().toLowerCase();
    return _menuItems.find(item =>
        item._docId === ref ||
        String(item._docId || '') === refString ||
        String(item.id) === refString ||
        (normalizedName && String(item.name || '').trim().toLowerCase() === normalizedName)
    );
}

function mergeMenuItemIntoCache(item) {
    if (!item) return null;

    const index = _menuItems.findIndex(existing =>
        existing._docId === item._docId ||
        String(existing.id) === String(item.id) ||
        String(existing.name || '').trim().toLowerCase() === String(item.name || '').trim().toLowerCase()
    );

    if (index >= 0) {
        _menuItems[index] = { ..._menuItems[index], ...item };
        return _menuItems[index];
    }

    _menuItems.push(item);
    return item;
}

async function resolveMenuItemForWrite(ref, fallbackName = '') {
    let item = findMenuItemByRef(ref, fallbackName);
    if (item && item._docId) return item;

    if (isAdminFirestoreReady()) {
        await ensureMenuItemsSyncedFromFirestore();
        item = findMenuItemByRef(ref, fallbackName);
        if (item && item._docId) return item;

        const db = window._adminDB;
        const api = window._firestoreAPI;
        const { collection, getDocs, query, where } = api;
        const menuCollection = collection(db, 'menu_items');
        const refString = String(ref).trim();
        const normalizedName = String(fallbackName || '').trim();

        const snapshots = [];

        if (normalizedName && query && where) {
            snapshots.push(await getDocs(query(menuCollection, where('name', '==', normalizedName))));
        }

        if (refString && query && where && /^\d+$/.test(refString)) {
            snapshots.push(await getDocs(query(menuCollection, where('id', '==', Number(refString)))));
        }

        for (const snapshot of snapshots) {
            let resolved = null;
            snapshot.forEach(docSnap => {
                if (resolved) return;
                const data = docSnap.data();
                resolved = mergeMenuItemIntoCache(normalizeMenuItem({
                    ...data,
                    _docId: docSnap.id
                }, data.id || 0));
            });
            if (resolved && resolved._docId) return resolved;
        }
    }

    return findMenuItemByRef(ref, fallbackName) || null;
}

async function ensureMenuItemsSyncedFromFirestore() {
    if (!isAdminFirestoreReady()) return false;

    if (_menuItems.length === 0 || !hasMenuItemsWithDocIds()) {
        await loadMenuItems();
    }

    return hasMenuItemsWithDocIds();
}

function refreshMenuItemsListIfOpen() {
    if (menuModal && menuModal.classList.contains('open')) {
        renderMenuItemsList(menuSearchInput?.value || '');
    }
}

// ===== INIT MENU MANAGEMENT =====
function initMenuManagement() {
    injectMenuButton();
    initMenuDOMRefs();
    setupMenuListeners();
    loadMenuItems().then(() => {
        if (menuModal && menuModal.classList.contains('open')) {
            renderMenuItemsList(menuSearchInput?.value || '');
        }
    });
    console.log('[MenuMgmt] Menu Management system ready');
}

function injectMenuButton() {
    const quickActions = document.querySelector('.quick-actions');
    if (!quickActions) return;

    // Check if already injected
    const existingBtn = document.getElementById('btn-menu-management');
    if (existingBtn) return;

    // ADD NEW button — do NOT modify existing "Coming Soon" buttons
    const btn = document.createElement('button');
    btn.id = 'btn-menu-management';
    btn.className = 'action-btn';
    btn.setAttribute('aria-label', 'Menu management');
    btn.innerHTML = `
        <div class="action-icon orange"><i class="fas fa-utensils"></i></div>
        <div class="action-title">Menu Management</div>
        <div class="action-desc">Edit prices & items</div>
    `;
    btn.addEventListener('click', openMenuModal);

    // If a placeholder "Coming Soon" button exists for Menu Management, replace it
    const coming = Array.from(quickActions.querySelectorAll('.coming-soon-btn')).find(n => {
        return /menu management/i.test(n.textContent || n.innerText || '');
    });
    if (coming) {
        quickActions.replaceChild(btn, coming);
    } else {
        // Otherwise insert as FIRST button in quick actions
        quickActions.insertBefore(btn, quickActions.firstElementChild);
    }
}

function initMenuDOMRefs() {
    menuModal = document.getElementById('menu-modal');
    menuModalClose = document.getElementById('menu-modal-close');
    menuItemsContainer = document.getElementById('menu-items-container');
    btnMenuAdd = document.getElementById('btn-menu-add');
    btnMenuSave = document.getElementById('btn-menu-save');
    menuSearchInput = document.getElementById('menu-search-input');
}

// ===== LOAD MENU ITEMS FROM FIRESTORE =====
async function loadMenuItems() {
    try {
        const db = window._adminDB;
        const api = window._firestoreAPI;
        if (!db || !api) {
            console.warn('[MenuMgmt] Firestore not ready');
            const fallbackItems = POS_MENU_ITEMS.length > 0 ? POS_MENU_ITEMS : FALLBACK_POS_MENU;
            _menuItems = mapMenuFallbackItems(fallbackItems);
            return;
        }

        const { collection, getDocs } = api;
        const snap = await getDocs(collection(db, 'menu_items'));

        const rawItems = [];
        snap.forEach(docSnap => {
            const data = docSnap.data();
            rawItems.push(normalizeMenuItem({
                ...data,
                _docId: docSnap.id,
                id: data.id || docSnap.id
            }));
        });

        const { unique, duplicateDocIds } = dedupeMenuItems(rawItems);
        _menuItems = unique;

        if (duplicateDocIds.length > 0) {
            const removed = await removeDuplicateMenuDocs(duplicateDocIds);
            if (removed > 0) {
                console.log('[MenuMgmt] Removed', removed, 'duplicate items from Firestore');
                showToast(`Removed ${removed} duplicate menu item(s)`, 'success');
            }
        }

        // Sort by category then name
        _menuItems.sort((a, b) => {
            const catOrder = ['Rice','Tiffin','Biryani','Meals','Bread Items','Egg Items','Chicken','Noodles','Semiya','Others'];
            const ia = catOrder.indexOf(a.category);
            const ib = catOrder.indexOf(b.category);
            if (ia !== ib) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
            return a.name.localeCompare(b.name);
        });

        console.log('[MenuMgmt] Loaded', _menuItems.length, 'items from Firestore');

        // Seed only when collection is completely empty
        if (_menuItems.length === 0 && rawItems.length === 0) {
            await seedDefaultMenuItems();
        }

    } catch (err) {
        console.error('[MenuMgmt] Load error:', err);
        const fallbackItems = POS_MENU_ITEMS.length > 0 ? POS_MENU_ITEMS : FALLBACK_POS_MENU;
        _menuItems = mapMenuFallbackItems(fallbackItems);
    }
}

// ===== SEED DEFAULT ITEMS TO FIRESTORE =====
async function seedDefaultMenuItems() {
    try {
        const db = window._adminDB;
        const api = window._firestoreAPI;
        if (!db || !api) return;

        const { collection, addDoc } = api;

        const defaultItems = [
            { id: 1,  name: "Chicken Rice",      price: 90,  category: "Rice",        image: "chickenrice.webp", emoji: "🍛", active: true },
            { id: 2,  name: "Egg Rice",          price: 80,  category: "Rice",        image: "eggrice.webp", emoji: "🍳", active: true },
            { id: 3,  name: "Veg Rice",          price: 70,  category: "Rice",        image: "vegrice.webp", emoji: "🍚", active: true },
            { id: 4,  name: "Idly",              price: 10,  category: "Tiffin",      image: "idly1", emoji: "🥮", active: true },
            { id: 5,  name: "Vada",              price: 10,  category: "Tiffin",      image: "vada1.webp", emoji: "🍩", active: true },
            { id: 6,  name: "Dosa",              price: 20,  category: "Tiffin",      image: "dosa.webp", emoji: "🥞", active: true },
            { id: 7,  name: "Plain Dosa",        price: 50,  category: "Tiffin",      image: "plain dosa .webp", emoji: "🥞", active: true },
            { id: 8,  name: "Set Dosa",          price: 50,  category: "Tiffin",      image: "set dosa.webp", emoji: "🥞", active: true },
            { id: 9,  name: "Masala Dosa",       price: 70,  category: "Tiffin",      image: "masal dosa.webp", emoji: "🥞", active: true },
            { id: 10, name: "Poori",             price: 40,  category: "Tiffin",      image: "poori.webp", emoji: "🫓", active: true },
            { id: 11, name: "Chicken Biryani",   price: 100, category: "Biryani",     image: "chicken-biryani.webp", emoji: "🍗", active: true },
            { id: 12, name: "Egg Biryani",       price: 80,  category: "Biryani",     image: "eggbiryani.webp", emoji: "🍳", active: true },
            { id: 13, name: "Veg Biryani",       price: 70,  category: "Biryani",     image: "vegbiryani.webp", emoji: "🥗", active: true },
            { id: 14, name: "Veg Meals",         price: 80,  category: "Meals",       image: "veg meals.webp", emoji: "🍱", active: true },
            { id: 15, name: "Non Veg Meals",     price: 120, category: "Meals",       image: "non veg meals.webp", emoji: "🍱", active: true },
            { id: 16, name: "Fish Meals",        price: 140, category: "Meals",       image: "fish meals.webp", emoji: "🐟", active: true },
            { id: 17, name: "Bread",             price: 20,  category: "Bread Items", image: "bread.webp", emoji: "🍞", active: true },
            { id: 18, name: "Veg Sandwich",      price: 80,  category: "Bread Items", image: "Veg sandwich .webp", emoji: "🥪", active: true },
            { id: 19, name: "Chicken Sandwich",  price: 120, category: "Bread Items", image: "chicken sandwich .webp", emoji: "🥪", active: true },
            { id: 20, name: "Omelette",          price: 20,  category: "Egg Items",   image: "Omelette .webp", emoji: "🍳", active: true },
            { id: 21, name: "Half Boil",         price: 20,  category: "Egg Items",   image: "half boil.webp", emoji: "🥚", active: true },
            { id: 22, name: "Boiled Egg",        price: 20,  category: "Egg Items",   image: "Boiled egg.webp", emoji: "🥚", active: true },
            { id: 23, name: "Chicken 100g",      price: 40,  category: "Chicken",     image: "chicken 100g.webp", emoji: "🍗", active: true },
            { id: 24, name: "Chicken 1kg",       price: 400, category: "Chicken",     image: "chicken 40g.webp", emoji: "🍗", active: true },
            { id: 25, name: "Chicken Noodles",   price: 90,  category: "Noodles",     image: "chickennoodles.webp", emoji: "🍜", active: true },
            { id: 26, name: "Veg Noodles",       price: 60,  category: "Noodles",     image: "veg noodles.webp", emoji: "🍜", active: true },
            { id: 27, name: "Egg Noodles",       price: 80,  category: "Noodles",     image: "eggnoodles.webp", emoji: "🍜", active: true },
            { id: 28, name: "Chicken Semiya",    price: 90,  category: "Semiya",      image: "chicken-semiya.webp", emoji: "🍝", active: true },
            { id: 29, name: "Egg Semiya",        price: 60,  category: "Semiya",      image: "egg-semiya.webp", emoji: "🍝", active: true },
            { id: 30, name: "Veg Semiya",        price: 60,  category: "Semiya",      image: "veg-semiya.webp", emoji: "🍝", active: true }
        ];

        for (const item of defaultItems) {
            await addDoc(collection(db, 'menu_items'), item);
        }

        // Reload after seeding
        await loadMenuItems();
        showToast('✅ Menu items seeded to Firestore', 'success');

    } catch (err) {
        console.error('[MenuMgmt] Seed error:', err);
    }
}

// ===== OPEN/CLOSE MODAL =====
async function openMenuModal() {
    if (!menuModal) initMenuDOMRefs();
    if (!menuModal) return;

    menuModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    resetMenuForm();
    renderMenuItemsList(menuSearchInput?.value || '');

    loadMenuItems()
        .then(() => renderMenuItemsList(menuSearchInput?.value || ''))
        .catch(err => console.warn('[MenuMgmt] Modal refresh warning:', err));
}

function closeMenuModal() {
    if (!menuModal) initMenuDOMRefs();
    if (menuModal) {
        menuModal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// ===== RENDER MENU ITEMS LIST =====
function renderMenuItemsList(searchTerm = '') {
    if (!menuItemsContainer) return;

    let items = _menuItems;
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    if (items.length === 0) {
        menuItemsContainer.innerHTML = `
            <div class="menu-empty">
                <i class="fas fa-utensils" style="font-size:2rem;color:#ccc"></i>
                <p>No items found</p>
            </div>`;
        return;
    }

    const frag = document.createDocumentFragment();

    // Group by category
    const catOrder = ['Rice','Tiffin','Biryani','Meals','Bread Items','Egg Items','Chicken','Noodles','Semiya','Others'];
    const grouped = {};
    items.forEach(item => {
        const cat = item.category || 'Others';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    const sortedCats = Object.keys(grouped).sort((a, b) => {
        const ia = catOrder.indexOf(a);
        const ib = catOrder.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    sortedCats.forEach(cat => {
        const catHeader = document.createElement('div');
        catHeader.className = 'menu-cat-header';
        catHeader.innerHTML = `<span class="menu-cat-name">${cat}</span><span class="menu-cat-count">${grouped[cat].length} items</span>`;
        frag.appendChild(catHeader);

        grouped[cat].forEach(item => {
            const row = document.createElement('div');
            row.className = 'menu-item-row' + (item.active === false ? ' inactive' : '');
            row.dataset.id = item._docId || item.id;
            row.innerHTML = `
                <div class="menu-item-info">
                    <span class="menu-item-emoji">${item.emoji || '🍽️'}</span>
                    <div class="menu-item-details">
                        <span class="menu-item-name">${escapeHtml(item.name)}</span>
                        <span class="menu-item-cat">${item.category}</span>
                    </div>
                </div>
                <div class="menu-item-price">
                    <span class="price-tag">₹${item.price}</span>
                </div>
                <div class="menu-item-actions">
                    <button class="menu-btn-edit" data-id="${item._docId || item.id}" title="Edit">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="menu-btn-toggle ${item.active === false ? 'inactive' : 'active'}" data-id="${item._docId || item.id}" data-active="${item.active !== false}" title="${item.active !== false ? 'Disable' : 'Enable'}">
                        <i class="fas ${item.active !== false ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                </div>
            `;
            frag.appendChild(row);
        });
    });

    menuItemsContainer.innerHTML = '';
    menuItemsContainer.appendChild(frag);

    // Attach listeners
    menuItemsContainer.querySelectorAll('.menu-btn-edit').forEach(btn => {
        btn.addEventListener('click', () => startEditItem(btn.dataset.id));
    });
    menuItemsContainer.querySelectorAll('.menu-btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => toggleItemActive(btn.dataset.id, btn.dataset.active === 'true'));
    });
}

// ===== ADD/EDIT FORM =====
function resetMenuForm() {
    _menuEditMode = false;
    _menuEditId = null;
    _menuEditName = '';

    const nameInp = document.getElementById('menu-item-name');
    const priceInp = document.getElementById('menu-item-price');
    const catSel = document.getElementById('menu-item-category');
    const emojiInp = document.getElementById('menu-item-emoji');
    const formTitle = document.getElementById('menu-form-title');

    if (nameInp) nameInp.value = '';
    if (priceInp) priceInp.value = '';
    if (catSel) catSel.value = 'Rice';
    if (emojiInp) emojiInp.value = '🍽️';
    if (formTitle) formTitle.textContent = 'Add New Item';
    if (btnMenuSave) btnMenuSave.innerHTML = '<i class="fas fa-plus"></i> Add Item';
}

function startEditItem(docId) {
    const item = findMenuItemByRef(docId);
    if (!item) return;

    _menuEditMode = true;
    _menuEditId = docId;
    _menuEditName = item.name || '';

    const nameInp = document.getElementById('menu-item-name');
    const priceInp = document.getElementById('menu-item-price');
    const catSel = document.getElementById('menu-item-category');
    const emojiInp = document.getElementById('menu-item-emoji');
    const formTitle = document.getElementById('menu-form-title');

    if (nameInp) nameInp.value = item.name;
    if (priceInp) priceInp.value = item.price;
    if (catSel) catSel.value = item.category;
    if (emojiInp) emojiInp.value = item.emoji || '🍽️';
    if (formTitle) formTitle.textContent = 'Edit Item';
    if (btnMenuSave) btnMenuSave.innerHTML = '<i class="fas fa-save"></i> Save Changes';

    // Scroll to form
    document.getElementById('menu-form-section')?.scrollIntoView({ behavior: 'smooth' });
}

// ===== SAVE ITEM =====
async function saveMenuItem() {
    const nameInp = document.getElementById('menu-item-name');
    const priceInp = document.getElementById('menu-item-price');
    const catSel = document.getElementById('menu-item-category');
    const emojiInp = document.getElementById('menu-item-emoji');

    const name = nameInp?.value.trim();
    const price = parseFloat(priceInp?.value);
    const category = catSel?.value;
    const emoji = emojiInp?.value.trim() || '🍽️';

    if (!name || name.length < 2) {
        showToast('⚠️ Enter valid item name', 'error');
        return;
    }

    if (!_menuEditMode) {
        const nameKey = getMenuNameKey(name);
        if (_menuItems.some(item => getMenuNameKey(item.name) === nameKey)) {
            showToast('⚠️ This item already exists in menu', 'error');
            return;
        }
    }
    if (!price || price <= 0 || isNaN(price)) {
        showToast('⚠️ Enter valid price', 'error');
        return;
    }
    if (!category) {
        showToast('⚠️ Select category', 'error');
        return;
    }

    btnMenuSave.disabled = true;
    btnMenuSave.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';

    try {
        const db = window._adminDB;
        const api = window._firestoreAPI;
        if (!db || !api) throw new Error('Firebase not ready');

        const { collection, addDoc, doc, updateDoc, serverTimestamp } = api;

        const itemData = {
            name,
            price,
            category,
            emoji,
            updatedAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
        };

        if (_menuEditMode && _menuEditId) {
            const item = await resolveMenuItemForWrite(_menuEditId, _menuEditName);
            const docId = item?._docId || (String(_menuEditId).length > 10 ? String(_menuEditId) : null);
            if (!docId) {
                throw new Error('Could not find this item in Firestore. Refresh the list and try again.');
            }
            await updateDoc(doc(db, 'menu_items', docId), itemData);
            showToast('✅ Menu updated — customer site syncs automatically', 'success');
        } else {
            // Add new
            const maxId = _menuItems.reduce((max, i) => Math.max(max, i.id || 0), 0);
            itemData.id = maxId + 1;
            itemData.active = true;
            itemData.image = '';
            itemData.createdAt = serverTimestamp ? serverTimestamp() : new Date().toISOString();

            await addDoc(collection(db, 'menu_items'), itemData);
            showToast('✅ Item added!', 'success');
        }

        // Reload and refresh
        await loadMenuItems();
        renderMenuItemsList(menuSearchInput?.value || '');
        resetMenuForm();

    } catch (err) {
        console.error('[MenuMgmt] Save error:', err);
        showToast('❌ Save failed: ' + err.message, 'error');
    } finally {
        btnMenuSave.disabled = false;
        btnMenuSave.innerHTML = _menuEditMode ? '<i class="fas fa-save"></i> Save Changes' : '<i class="fas fa-plus"></i> Add Item';
    }
}

// ===== TOGGLE ACTIVE =====
async function toggleItemActive(docId, currentActive) {
    try {
        const db = window._adminDB;
        const api = window._firestoreAPI;
        if (!db || !api) return;

        const { doc, updateDoc } = api;
        let item = findMenuItemByRef(docId);
        const fallbackName = item?.name || '';
        item = await resolveMenuItemForWrite(docId, fallbackName);
        if (!item || !item._docId) {
            throw new Error('Menu item not synced with Firestore yet.');
        }

        await updateDoc(doc(db, 'menu_items', item._docId), {
            active: !currentActive
        });

        showToast(currentActive ? 'Item hidden from menu' : 'Item visible in menu', 'success');
        await loadMenuItems();
        renderMenuItemsList(menuSearchInput?.value || '');

    } catch (err) {
        console.error('[MenuMgmt] Toggle error:', err);
        showToast('❌ Failed to toggle', 'error');
    }
}

// ===== EVENT LISTENERS =====
function setupMenuListeners() {
    if (!menuModalClose) initMenuDOMRefs();
    if (menuModalClose) menuModalClose.addEventListener('click', closeMenuModal);
    if (menuModal) menuModal.addEventListener('click', e => { if (e.target === menuModal) closeMenuModal(); });
    if (btnMenuAdd) btnMenuAdd.addEventListener('click', resetMenuForm);
    if (btnMenuSave) btnMenuSave.addEventListener('click', saveMenuItem);
    if (menuSearchInput) {
        menuSearchInput.addEventListener('input', function() {
            renderMenuItemsList(this.value);
        });
    }
}

function handleAdminFirestoreReady() {
    loadPosMenuFromFirestore()
        .then(() => {
            setupPosMenuListener();
        })
        .catch(err => {
            console.error('[POS] Firestore refresh error:', err);
        });

    if (_menuItems.length === 0 || !hasMenuItemsWithDocIds()) {
        loadMenuItems()
            .then(() => {
                refreshMenuItemsListIfOpen();
            })
            .catch(err => {
                console.error('[MenuMgmt] Firestore refresh error:', err);
            });
    }
}

window.addEventListener('admin-firestore-ready', handleAdminFirestoreReady);

if (isAdminFirestoreReady()) {
    handleAdminFirestoreReady();
}

// ===== INIT =====
function tryInitMenu() {
    if (document.getElementById('menu-modal')) {
        initMenuManagement();
    } else {
        setTimeout(tryInitMenu, 500);
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitMenu);
} else {
    tryInitMenu();
}

// Also expose for late init
window._initMenuManagement = initMenuManagement;

// ===================================================
// GIFT BOX TRACKER (Admin — mobile lookup)
// ===================================================

let giftTrackerModal = null;

function initGiftTracker() {
    injectGiftTrackerButton();
    initGiftTrackerDOMRefs();
    setupGiftTrackerListeners();
    console.log('[GiftTracker] Ready');
}

function injectGiftTrackerButton() {
    const quickActions = document.querySelector('.quick-actions');
    if (!quickActions || document.getElementById('btn-gift-tracker')) return;

    const btn = document.createElement('button');
    btn.id = 'btn-gift-tracker';
    btn.className = 'action-btn';
    btn.setAttribute('aria-label', 'Gift box tracker');
    btn.innerHTML = `
        <div class="action-icon orange"><i class="fas fa-gift"></i></div>
        <div class="action-title">Gift Box</div>
        <div class="action-desc">Track by mobile</div>
    `;
    btn.addEventListener('click', openGiftTrackerModal);
    const menuBtn = document.getElementById('btn-menu-management');
    if (menuBtn) menuBtn.insertAdjacentElement('afterend', btn);
    else quickActions.insertBefore(btn, quickActions.firstElementChild);
}

function initGiftTrackerDOMRefs() {
    giftTrackerModal = document.getElementById('gift-tracker-modal');
}

function setupGiftTrackerListeners() {
    const closeBtn = document.getElementById('gift-tracker-close');
    const searchBtn = document.getElementById('btn-gift-track-search');
    const mobileInp = document.getElementById('gift-track-mobile');

    if (closeBtn) closeBtn.addEventListener('click', closeGiftTrackerModal);
    if (giftTrackerModal) {
        giftTrackerModal.addEventListener('click', e => {
            if (e.target === giftTrackerModal) closeGiftTrackerModal();
        });
    }
    if (searchBtn) searchBtn.addEventListener('click', lookupGiftCustomer);
    if (mobileInp) {
        mobileInp.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
        mobileInp.addEventListener('keypress', e => {
            if (e.key === 'Enter') lookupGiftCustomer();
        });
    }
}

function openGiftTrackerModal() {
    if (!giftTrackerModal) initGiftTrackerDOMRefs();
    if (giftTrackerModal) {
        giftTrackerModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        const result = document.getElementById('gift-tracker-result');
        if (result) result.innerHTML = '';
        const inp = document.getElementById('gift-track-mobile');
        if (inp) { inp.value = ''; setTimeout(() => inp.focus(), 100); }
    }
}

function closeGiftTrackerModal() {
    if (giftTrackerModal) {
        giftTrackerModal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function calcGiftDayFromStart(cycleStart) {
    if (!cycleStart) return 1;
    const start = new Date(cycleStart + 'T00:00:00');
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    if (diff >= 10) return 11;
    return Math.min(Math.max(diff + 1, 1), 10);
}

async function lookupGiftCustomer() {
    const mobileInp = document.getElementById('gift-track-mobile');
    const resultEl = document.getElementById('gift-tracker-result');
    const searchBtn = document.getElementById('btn-gift-track-search');
    if (!mobileInp || !resultEl) return;

    const mobile = mobileInp.value.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
        showToast('⚠️ Enter valid 10-digit mobile', 'error');
        return;
    }

    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Loading…';
    }
    resultEl.innerHTML = '<div class="gift-track-loading"><i class="fas fa-circle-notch fa-spin"></i> Loading…</div>';

    try {
        const db = window._adminDB;
        const api = window._firestoreAPI;
        let cycle = null;
        let orderTotal = 0;

        if (db && api) {
            const { doc, getDoc, collection, query, where, getDocs } = api;
            const cycleSnap = await getDoc(doc(db, 'rewards_cycles', mobile));
            if (cycleSnap.exists()) cycle = cycleSnap.data();

            const ordersQ = query(collection(db, 'orders'), where('customerMobile', '==', mobile));
            const ordersSnap = await getDocs(ordersQ);
            ordersSnap.forEach(d => { orderTotal += Number(d.data().totalAmount) || 0; });
        }

        const openedDays = Array.isArray(cycle?.openedDays)
            ? [...new Set(cycle.openedDays.map(Number).filter(d => d >= 1 && d <= 10))].sort((a, b) => a - b)
            : [];
        const totalSpent = Number(cycle?.totalAmount) || orderTotal;
        const currentDay = cycle?.cycleStart ? calcGiftDayFromStart(cycle.cycleStart) : 1;
        const isNewCycle = currentDay >= 11;
        const displayDay = isNewCycle ? 1 : currentDay;
        const daysRemaining = isNewCycle ? 10 : Math.max(0, 10 - displayDay);

        let couponValue = 0;
        if (!isNewCycle && openedDays.length >= 10 && !cycle?.couponClaimed) {
            if (totalSpent >= 2000) couponValue = 100;
            else if (totalSpent >= 1000) couponValue = 50;
        }

        let daysHtml = '';
        for (let d = 1; d <= 10; d++) {
            const opened = openedDays.includes(d);
            const isToday = !isNewCycle && d === displayDay;
            const cls = opened ? 'opened' : (isToday ? 'today' : (d < displayDay ? 'missed' : 'locked'));
            daysHtml += `<div class="gift-track-day ${cls}"><span>${d}</span>${opened ? '✅' : (isToday ? '🎁' : '🔒')}</div>`;
        }

        const claimStatus = cycle?.couponClaimed
            ? (cycle?.claimStatus === 'approved' ? 'Approved' : 'Claim pending')
            : (couponValue ? `₹${couponValue} coupon ready` : 'Not ready');

        resultEl.innerHTML = `
            <div class="gift-track-summary">
                <div class="gift-track-row"><span>Mobile</span><strong>${mobile}</strong></div>
                <div class="gift-track-row"><span>Customer</span><strong>${escapeHtml(cycle?.customerName || '—')}</strong></div>
                <div class="gift-track-row"><span>Cycle</span><strong>${isNewCycle ? 'Day 11 — New cycle starts' : `Day ${displayDay} of 10`}</strong></div>
                <div class="gift-track-row"><span>Days opened</span><strong>${openedDays.length}/10</strong></div>
                <div class="gift-track-row"><span>Total spent</span><strong>₹${totalSpent.toLocaleString('en-IN')}</strong></div>
                <div class="gift-track-row"><span>Days left</span><strong>${daysRemaining}</strong></div>
                <div class="gift-track-row"><span>Coupon</span><strong>${claimStatus}</strong></div>
                ${cycle?.cycleStart ? `<div class="gift-track-row"><span>Cycle start</span><strong>${cycle.cycleStart}</strong></div>` : ''}
            </div>
            <div class="gift-track-days-label">10-Day Gift Progress</div>
            <div class="gift-track-days">${daysHtml}</div>
            ${isNewCycle ? '<p class="gift-track-note">✨ 10 days completed — fresh gift box opens from Day 1</p>' : ''}
            ${couponValue && !cycle?.couponClaimed ? `<p class="gift-track-note success">🎉 All 10 days done + spend OK — ₹${couponValue} coupon eligible</p>` : ''}
        `;
    } catch (err) {
        console.error('[GiftTracker] Lookup error:', err);
        resultEl.innerHTML = `<div class="gift-track-error">Could not load: ${escapeHtml(err.message)}</div>`;
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fas fa-search"></i> Track';
        }
    }
}

function tryInitGiftTracker() {
    if (document.getElementById('gift-tracker-modal')) {
        initGiftTracker();
        initGiftClaimsPanel();
    } else {
        setTimeout(tryInitGiftTracker, 500);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitGiftTracker);
} else {
    tryInitGiftTracker();
}

// ===================================================
// GIFT COUPON CLAIMS — live feed for admin
// ===================================================

let _giftClaimsUnsub = null;

function initGiftClaimsPanel() {
    if (document.getElementById('gift-claims-panel')) {
        startGiftClaimsListener();
        return;
    }

    const welcome = document.querySelector('.welcome-banner');
    if (!welcome) return;

    const panel = document.createElement('section');
    panel.id = 'gift-claims-panel';
    panel.className = 'gift-claims-panel';
    panel.innerHTML = `
        <div class="gift-claims-header">
            <h3><i class="fas fa-bell"></i> Coupon Claims <span class="gift-claims-count" id="gift-claims-count">0</span></h3>
            <small>Customer Day-10 claims appear here instantly</small>
        </div>
        <div id="gift-claims-list" class="gift-claims-list">
            <div class="gift-claims-empty">No pending coupon claims</div>
        </div>
    `;
    welcome.insertAdjacentElement('afterend', panel);

    if (!document.getElementById('gift-claims-styles')) {
        const style = document.createElement('style');
        style.id = 'gift-claims-styles';
        style.textContent = `
            .gift-claims-panel{background:#fff;border:2px solid #ff9800;border-radius:16px;padding:16px;margin-bottom:20px;box-shadow:0 4px 14px rgba(255,152,0,0.15)}
            .gift-claims-header h3{font-family:'Sora',sans-serif;font-size:1rem;color:#e65100;display:flex;align-items:center;gap:8px;margin-bottom:4px}
            .gift-claims-header small{color:#6b7280;font-size:0.8rem}
            .gift-claims-count{background:#dc2626;color:#fff;border-radius:50px;padding:2px 10px;font-size:0.8rem}
            .gift-claims-list{display:flex;flex-direction:column;gap:10px;margin-top:12px;max-height:320px;overflow-y:auto}
            .gift-claim-card{background:#fff7ed;border:1px solid #ffcc80;border-radius:12px;padding:12px}
            .gift-claim-card h4{font-size:0.95rem;margin-bottom:4px;color:#1a1a1a}
            .gift-claim-meta{font-size:0.82rem;color:#666;line-height:1.5}
            .gift-claim-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
            .gift-claim-btn{padding:8px 12px;border-radius:8px;font-size:0.82rem;font-weight:700;border:none;cursor:pointer}
            .gift-claim-btn.approve{background:#dcfce7;color:#166534}
            .gift-claim-btn.wa{background:#25D366;color:#fff}
            .gift-claims-empty{text-align:center;padding:20px;color:#9ca3af;font-size:0.9rem}
        `;
        document.head.appendChild(style);
    }

    startGiftClaimsListener();
}

function renderGiftClaimsList(claims) {
    const list = document.getElementById('gift-claims-list');
    const countEl = document.getElementById('gift-claims-count');
    if (!list) return;

    if (countEl) countEl.textContent = claims.length;

    if (!claims.length) {
        list.innerHTML = '<div class="gift-claims-empty">No pending coupon claims</div>';
        return;
    }

    list.innerHTML = '';
    claims.forEach(claim => {
        const card = document.createElement('div');
        card.className = 'gift-claim-card';
        const time = claim.claimTime ? new Date(claim.claimTime).toLocaleString('en-IN') : '—';
        const waMsg = encodeURIComponent(
            `🎁 Sri Krishna Hotel — Coupon Claim\nCustomer: ${claim.customerName}\nMobile: ${claim.mobile}\nReward: ₹${claim.couponValue}\nSpent: ₹${claim.totalAmount}\nClaim ID: ${claim.claimId}`
        );
        card.innerHTML = `
            <h4>${escapeHtml(claim.customerName || 'Customer')} — ₹${claim.couponValue} coupon</h4>
            <div class="gift-claim-meta">
                📱 ${claim.mobile}<br>
                💰 Total spent: ₹${(claim.totalAmount || 0).toLocaleString('en-IN')}<br>
                📅 ${time}<br>
                🆔 ${claim.claimId || claim.id}
            </div>
            <div class="gift-claim-actions">
                <button class="gift-claim-btn approve" data-claim-id="${claim.claimId || claim.id}" data-mobile="${claim.mobile}">
                    <i class="fas fa-check"></i> Approve
                </button>
                <a class="gift-claim-btn wa" href="https://wa.me/91${claim.mobile}?text=${waMsg}" target="_blank" rel="noopener">
                    <i class="fab fa-whatsapp"></i> WhatsApp Customer
                </a>
            </div>
        `;
        card.querySelector('.approve')?.addEventListener('click', () => approveGiftClaim(claim));
        list.appendChild(card);
    });
}

async function approveGiftClaim(claim) {
    const claimId = claim.claimId || claim.id;
    const mobile = claim.mobile;
    if (!claimId || !isAdminFirestoreReady()) return;

    try {
        const db = window._adminDB;
        const api = window._firestoreAPI;
        const { doc, updateDoc, serverTimestamp } = api;

        await updateDoc(doc(db, 'rewards_claims', claimId), {
            status: 'approved',
            approvedAt: serverTimestamp(),
            adminNotes: 'Approved from dashboard'
        });

        if (mobile) {
            await updateDoc(doc(db, 'rewards_cycles', mobile), {
                claimStatus: 'approved',
                couponClaimed: true
            });
        }

        showToast('✅ Coupon approved for ' + (claim.customerName || mobile), 'success');
    } catch (err) {
        console.error('[GiftClaims] Approve error:', err);
        showToast('❌ Approve failed', 'error');
    }
}

function startGiftClaimsListener() {
    if (!isAdminFirestoreReady()) return;

    const db = window._adminDB;
    const api = window._firestoreAPI;
    const { collection, query, where, onSnapshot } = api;

    if (_giftClaimsUnsub) {
        _giftClaimsUnsub();
        _giftClaimsUnsub = null;
    }

    const q = query(collection(db, 'rewards_claims'), where('status', '==', 'pending'));

    _giftClaimsUnsub = onSnapshot(q, (snapshot) => {
        const claims = [];
        snapshot.forEach(docSnap => {
            claims.push({ id: docSnap.id, ...docSnap.data() });
        });
        claims.sort((a, b) => {
            const ta = a.claimTime ? new Date(a.claimTime).getTime() : 0;
            const tb = b.claimTime ? new Date(b.claimTime).getTime() : 0;
            return tb - ta;
        });
        renderGiftClaimsList(claims);
    }, (err) => {
        console.error('[GiftClaims] Listener error:', err);
    });
}

window.addEventListener('admin-firestore-ready', () => {
    if (document.getElementById('gift-claims-panel')) {
        startGiftClaimsListener();
    }
});
