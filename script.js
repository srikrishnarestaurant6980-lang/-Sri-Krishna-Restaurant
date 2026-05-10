// Sri Krishna Hotel - Gift Box + Coupon System (Isolated Module)
// ================================================================
// NOTE: Only the GIFT & COUPON section is modified below.
// All other code (cart, menu, payment, order) remains UNCHANGED.

'use strict';

const MENU_ITEMS = Object.freeze([
    { id: 1,  name: "Chicken Rice",      price: 90,  category: "Rice",        image: "chickenrice.webp", emoji: "🍛" },
    { id: 2,  name: "Egg Rice",          price: 80,  category: "Rice",        image: "eggrice.webp", emoji: "🍳" },
    { id: 3,  name: "Veg Rice",          price: 70,  category: "Rice",        image: "vegrice.webp", emoji: "🍚" },
    { id: 4,  name: "Idly",              price: 10,  category: "Tiffin",      image: "idly .webp", emoji: "🥮" },
    { id: 5,  name: "Vada",              price: 10,  category: "Tiffin",      image: "vada.webp", emoji: "🍩" },
    { id: 6,  name: "Dosa",              price: 20,  category: "Tiffin",      image: "dosa.webp", emoji: "🥞" },
    { id: 7,  name: "Plain Dosa",        price: 50,  category: "Tiffin",      image: "plain dosa .webp", emoji: "🥞" },
    { id: 8,  name: "Set Dosa",          price: 50,  category: "Tiffin",      image: "set dosa.jpg", emoji: "🥞" },
    { id: 9,  name: "Masala Dosa",       price: 70,  category: "Tiffin",      image: "masal dosa.webp", emoji: "🥞" },
    { id: 10, name: "Poori",             price: 40,  category: "Tiffin",      image: "poori.webp", emoji: "🫓" },
    { id: 11, name: "Chicken Biryani",   price: 100, category: "Biryani",     image: "chicken-biryani.webp", emoji: "🍗" },
    { id: 12, name: "Egg Biryani",       price: 80,  category: "Biryani",     image: "eggbiryani.webp", emoji: "🍳" },
    { id: 13, name: "Veg Biryani",       price: 70,  category: "Biryani",     image: "vegbiryani.webp", emoji: "🥗" },
    { id: 14, name: "Veg Meals",         price: 80,  category: "Meals",       image: "veg meals.webp", emoji: "🍱" },
    { id: 15, name: "Non Veg Meals",     price: 120, category: "Meals",       image: "non veg meals.webp", emoji: "🍱" },
    { id: 16, name: "Fish Meals",        price: 140, category: "Meals",       image: "fish meals.webp", emoji: "🐟" },
    { id: 17, name: "Bread",             price: 20,  category: "Bread Items", image: "bread.webp", emoji: "🍞" },
    { id: 18, name: "Veg Sandwich",      price: 80,  category: "Bread Items", image: "Veg sandwich .webp", emoji: "🥪" },
    { id: 19, name: "Chicken Sandwich",  price: 120, category: "Bread Items", image: "chicken sandwich .webp", emoji: "🥪" },
    { id: 20, name: "Omelette",          price: 20,  category: "Egg Items",   image: "Omelette .webp", emoji: "🍳" },
    { id: 21, name: "Half Boil",         price: 20,  category: "Egg Items",   image: "half boil.webp", emoji: "🥚" },
    { id: 22, name: "Boiled Egg",        price: 20,  category: "Egg Items",   image: "Boiled egg.webp", emoji: "🥚" },
    { id: 23, name: "Chicken 100g",      price: 40,  category: "Chicken",     image: "chicken 100g.webp", emoji: "🍗" },
    { id: 24, name: "Chicken 1kg",       price: 400, category: "Chicken",     image: "chicken 40g.webp", emoji: "🍗" },
    { id: 25, name: "Chicken Noodles",   price: 90,  category: "Noodles",     image: "chickennoodles.webp", emoji: "🍜" },
    { id: 26, name: "Veg Noodles",       price: 60,  category: "Noodles",     image: "veg noodles.webp", emoji: "🍜" },
    { id: 27, name: "Egg Noodles",       price: 80,  category: "Noodles",     image: "eggnoodles.webp", emoji: "🍜" },
    { id: 28, name: "Chicken Semiya",    price: 90,  category: "Semiya",      image: "chickennoodles.webp", emoji: "🍝" },
    { id: 29, name: "Egg Semiya",        price: 60,  category: "Semiya",      image: "eggnoodles.webp", emoji: "🍝" },
    { id: 30, name: "Veg Semiya",        price: 60,  category: "Semiya",      image: "veg noodles.webp", emoji: "🍝" }
]);

const HOTEL_NAME = "Sri Krishna Hotel";
const PHONE_NUMBER = "98433 36980";
const WHATSAPP_NUMBER = "919843336980";
const ADMIN_WHATSAPP_NUMBER = "919843336980"; // Admin WhatsApp for bills
const UPI_ID = "9843336980@ibl";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=30&fm=webp";

const UPI_APPS = Object.freeze([
    { id: 'gpay',      name: 'GPay',      icon: 'https://img.icons8.com/color/96/google-pay.png',  color: '#4285F4', pkg: 'com.google.android.apps.nbu.paisa.user' },
    { id: 'phonepe',   name: 'PhonePe',   icon: 'https://img.icons8.com/color/96/phone-pe.png',    color: '#5f259f', pkg: 'com.phonepe.app' },
    { id: 'paytm',     name: 'Paytm',     icon: 'https://img.icons8.com/color/96/paytm.png',       color: '#00b9f1', pkg: 'net.one97.paytm' },
    { id: 'bhim',      name: 'BHIM',      icon: 'https://img.icons8.com/color/96/bhim.png',        color: '#00a651', pkg: 'in.org.npci.upiapp' },
    { id: 'amazonpay', name: 'Amazon',    icon: 'https://img.icons8.com/color/96/amazon.png',      color: '#FF9900', pkg: 'in.amazon.mShop.android.shopping' },
    { id: 'other',     name: 'Other UPI', icon: null,                                               color: '#607d8b', pkg: null }
]);

const GIFT_CONFIG = Object.freeze({
    CYCLE_DAYS:     10,
    MIN_SPEND:      1000,
    TIER1_SPEND:    1000,
    TIER1_VALUE:    50,
    TIER2_SPEND:    2000,
    TIER2_VALUE:    100,
    STORAGE_KEY:    'sriKrishnaGiftBox',
    COUPON_STORAGE: 'sriKrishnaCoupons',
    USER_KEY:       'sriKrishnaUser'
});

const DELIVERY_CONFIG = Object.freeze({
    MIN_ORDER:   400,
    MAX_KM:      2,
    HOTEL_LAT:   13.3295,
    HOTEL_LNG:   80.1954
});

let cart = [], currentCategory = 'all', searchQuery = '', paymentStatus = 'cash';
let currentSlide = 0, selectedUpiApp = null, lastGeneratedBill = null;
let heroSliderInterval = null, searchDebounceTimer = null, imgObserver = null, upiGridRendered = false;
let giftBoxState = null;
let giftBoxVisible = false;
let isSubmittingOrder = false;

// ===================== UTILITY FUNCTIONS =====================

function safeJSONParse(key, defaultVal) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : defaultVal; }
    catch { return defaultVal; }
}

function safeJSONSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
}

function getTotal() { return cart.reduce((s, i) => s + i.price * i.quantity, 0); }

function getMenuImageSrc(image) {
    // If already a full URL (http/https), use as-is
    if (/^https?:\/\//i.test(image)) return image;
    // For local files, use as-is (no img/ prefix)
    return image;
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===================== INITIALIZATION =====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    loadCart();
    setupImgObserver();
    setupEventListeners();
    requestAnimationFrame(() => { renderMenu(); updateCartDisplay(); });
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 50));
    idle(() => startHeroSlider());
    setTimeout(initGiftBoxWithLogin, 300);
    injectFreeDeliveryBanner();
    // Gift box hidden by default - user must click gift button
}

// ===================== FREE DELIVERY BANNER =====================

function injectFreeDeliveryBanner() {
    const offersStrip = document.getElementById('offers-strip');
    if (!offersStrip) return;
    if (document.getElementById('free-delivery-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'free-delivery-banner';
    banner.className = 'free-delivery-banner';
    banner.innerHTML = `
        <div class="fdb-left">
            <span class="fdb-icon">🛵</span>
            <div class="fdb-text">
                <strong>FREE Home Delivery!</strong>
                <span>Orders ₹400+ • Within 2 km from hotel</span>
            </div>
        </div>
        <button class="fdb-check-btn" id="fdb-check-btn" title="Check if you are within 2 km">
            📍 Check My Location
        </button>
    `;
    offersStrip.insertAdjacentElement('afterend', banner);
    document.getElementById('fdb-check-btn').addEventListener('click', checkDeliveryEligibility);
}

function checkDeliveryEligibility() {
    const btn = document.getElementById('fdb-check-btn');
    if (!navigator.geolocation) {
        showDeliveryResult(null, 'Geolocation not supported on this device.');
        return;
    }
    if (btn) { btn.textContent = '⏳ Locating...'; btn.disabled = true; }

    navigator.geolocation.getCurrentPosition(
        function(pos) {
            if (btn) { btn.textContent = '📍 Check My Location'; btn.disabled = false; }
            const dist = getDistanceKm(
                pos.coords.latitude, pos.coords.longitude,
                DELIVERY_CONFIG.HOTEL_LAT, DELIVERY_CONFIG.HOTEL_LNG
            );
            const eligible = dist <= DELIVERY_CONFIG.MAX_KM;
            showDeliveryResult(eligible, dist);
        },
        function() {
            if (btn) { btn.textContent = '📍 Check My Location'; btn.disabled = false; }
            showDeliveryResult(null, 'Location access denied. Please allow location to check.');
        },
        { timeout: 8000, maximumAge: 60000 }
    );
}

function showDeliveryResult(eligible, distOrMsg) {
    const old = document.getElementById('delivery-result-popup');
    if (old) old.remove();

    let icon, title, body, cls;
    if (eligible === true) {
        const dist = typeof distOrMsg === 'number' ? distOrMsg.toFixed(2) : distOrMsg;
        icon = '✅'; cls = 'drp-yes';
        title = 'Free Delivery Available!';
        body  = `You are ${dist} km away. Order ₹400+ and get FREE home delivery! 🎉`;
    } else if (eligible === false) {
        const dist = typeof distOrMsg === 'number' ? distOrMsg.toFixed(2) : distOrMsg;
        icon = '❌'; cls = 'drp-no';
        title = 'Outside Delivery Zone';
        body  = `You are ${dist} km away. Free delivery is within 2 km only. You can still dine-in or pick up!`;
    } else {
        icon = 'ℹ️'; cls = 'drp-info';
        title = 'Location Check';
        body  = String(distOrMsg);
    }

    const popup = document.createElement('div');
    popup.id = 'delivery-result-popup';
    popup.className = `delivery-result-popup ${cls}`;
    popup.innerHTML = `
        <button class="drp-close" id="drp-close"><i class="fas fa-times"></i></button>
        <div class="drp-icon">${icon}</div>
        <h4>${title}</h4>
        <p>${body}</p>
        ${eligible === true ? `<div class="drp-note">📞 Call <strong>${PHONE_NUMBER}</strong> or WhatsApp to place delivery order</div>` : ''}
    `;
    document.body.appendChild(popup);
    document.getElementById('drp-close').addEventListener('click', () => popup.remove());
    setTimeout(() => { if (popup.parentNode) popup.remove(); }, 7000);
}

// ===================== GIFT BOX LOGIN TRACKING =====================

function initGiftBoxWithLogin() {
    const userPhone = safeJSONParse('giftUserPhone', null);
    if (userPhone) {
        loadUserGiftData(userPhone);
    }
    updateGiftBadge();
}

function showGiftPhoneLoginModal() {
    const existing = document.getElementById('gift-phone-login-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'gift-phone-login-modal';
    modal.className = 'gift-phone-login-modal-overlay';
    modal.innerHTML = `
        <div class="gift-phone-login-container">
            <h2>🎁 Unlock Your Daily Gifts!</h2>
            <p>Enter your phone number to check your rewards</p>
            <input type="tel" id="gift-phone-input" maxlength="10" placeholder="10-digit number" inputmode="numeric">
            <button id="gift-phone-submit">Check My Rewards</button>
            <button id="gift-phone-cancel" style="width:100%;padding:12px;background:#f5f5f5;color:#666;border-radius:50px;font-weight:600;font-size:0.95rem;border:none;cursor:pointer;margin-top:-8px;"><i class="fas fa-times"></i> Cancel</button>
            <p class="gift-info-text">Spend ₹1000+ to unlock gifts • Spend ₹2000+ for bigger rewards!</p>
        </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#gift-phone-input');
    const btn   = modal.querySelector('#gift-phone-submit');
    const cancelBtn = modal.querySelector('#gift-phone-cancel');

    cancelBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    btn.addEventListener('click', () => {
        const phone = input.value.trim();
        if (!/^[6-9]\d{9}$/.test(phone)) {
            showToast('Please enter valid 10-digit mobile number (start with 6-9)');
            return;
        }
        btn.disabled = true;
        btn.textContent = '🔍 Checking...';
        verifyUserPhoneAndSetupGifts(phone, modal);
    });

    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') btn.click(); });
    setTimeout(() => input.focus(), 100);
}

async function verifyUserPhoneAndSetupGifts(phone, modal) {
    const btn = modal.querySelector('#gift-phone-submit');
    try {
        let userData = null;
        const db = await (typeof window.initFirebase === 'function' ? window.initFirebase() : null);

        if (db) {
            try {
                const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                const q = query(collection(db, "orders"), where("customerMobile", "==", phone));
                const snapshot = await getDocs(q);
                let totalSpent = 0, customerName = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    totalSpent += (data.totalAmount || 0);
                    if (!customerName) customerName = data.customerName || '';
                });
                if (snapshot.size > 0) {
                    userData = { name: customerName || 'Customer', totalSpent, eligible: totalSpent >= GIFT_CONFIG.TIER1_SPEND };
                }
            } catch(e) {
                console.error('[Gift] Firebase query error:', e);
                userData = checkLocalOrders(phone);
            }
        } else {
            userData = checkLocalOrders(phone);
        }

        if (btn) { btn.disabled = false; btn.textContent = 'Check My Rewards'; }

        if (userData && userData.totalSpent > 0) {
            safeJSONSet('giftUserPhone', phone);
            safeJSONSet('giftUserName', userData.name);
            safeJSONSet('giftUserSpent', userData.totalSpent);
            modal.remove();
            showRewardStatusCard(userData, phone);
            loadUserGiftData(phone);
        } else {
            showNotEligibleCard(modal, phone, userData);
        }
    } catch(e) {
        console.error('[Gift] Verify error:', e);
        if (btn) { btn.disabled = false; btn.textContent = 'Check My Rewards'; }
        const userData = checkLocalOrders(phone);
        if (userData && userData.totalSpent > 0) {
            safeJSONSet('giftUserPhone', phone);
            safeJSONSet('giftUserName', userData.name);
            safeJSONSet('giftUserSpent', userData.totalSpent);
            modal.remove();
            showRewardStatusCard(userData, phone);
            loadUserGiftData(phone);
        } else {
            showNotEligibleCard(modal, phone, null);
        }
    }
}

function checkLocalOrders(phone) {
    try {
        const orders = safeJSONParse('sriKrishnaOrders', []);
        const userOrders = orders.filter(o => o.customerMobile === phone);
        if (!userOrders.length) return null;
        const totalSpent = userOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const name = userOrders[0].customerName || 'Customer';
        return { name, totalSpent, eligible: totalSpent >= GIFT_CONFIG.TIER1_SPEND };
    } catch { return null; }
}

function showRewardStatusCard(user, phone) {
    const existing = document.getElementById('reward-status-card');
    if (existing) existing.remove();

    const isEligible = user.totalSpent >= GIFT_CONFIG.TIER1_SPEND;
    const card = document.createElement('div');
    card.id = 'reward-status-card';
    card.className = 'reward-status-card-overlay';
    card.innerHTML = `
        <div class="reward-status-card">
            <button class="reward-card-cancel" id="reward-card-cancel"><i class="fas fa-times"></i></button>
            <div class="reward-card-icon">${isEligible ? '🎉' : '⏳'}</div>
            <h3>${isEligible ? 'You Have Rewards!' : 'Almost There!'}</h3>
            <p class="reward-card-name">Hi ${user.name}!</p>
            <div class="reward-card-stats">
                <div class="reward-stat">
                    <span class="reward-stat-value">₹${user.totalSpent}</span>
                    <span class="reward-stat-label">Total Spent</span>
                </div>
                <div class="reward-stat ${isEligible ? 'eligible' : ''}">
                    <span class="reward-stat-value">${isEligible ? '✅' : `₹${Math.max(0, GIFT_CONFIG.TIER1_SPEND - user.totalSpent)}`}</span>
                    <span class="reward-stat-label">${isEligible ? 'Eligible!' : 'More Needed'}</span>
                </div>
            </div>
            <p class="reward-card-msg">${isEligible ? '🎁 You can claim your daily gift boxes now!' : `Spend ₹${Math.max(0, GIFT_CONFIG.TIER1_SPEND - user.totalSpent)} more to unlock gift rewards`}</p>
            <button class="reward-card-open-btn" id="reward-open-gifts">
                <i class="fas fa-gift"></i> ${isEligible ? 'Open Gift Box' : 'View Gifts'}
            </button>
            <button class="reward-card-close-btn" id="reward-card-close">Close</button>
        </div>
    `;
    document.body.appendChild(card);
    document.body.style.overflow = 'hidden';

    const closeCard = () => { card.remove(); document.body.style.overflow = ''; };
    document.getElementById('reward-card-cancel').addEventListener('click', closeCard);
    document.getElementById('reward-card-close').addEventListener('click', closeCard);
    card.addEventListener('click', (e) => { if (e.target === card) closeCard(); });

    document.getElementById('reward-open-gifts').addEventListener('click', () => {
        closeCard();
        const wrapper = document.getElementById('gift-box-wrapper');
        if (wrapper) {
            giftBoxVisible = true;
            wrapper.classList.add('show');
            setTimeout(() => wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            renderGiftBox();
            updateGiftBadge();
        }
    });
}

function showNotEligibleCard(modal, phone, user) {
    const btn = modal.querySelector('#gift-phone-submit');
    if (btn) { btn.disabled = false; btn.textContent = 'Check My Rewards'; }
    const existing = modal.querySelector('.not-eligible-msg');
    if (existing) existing.remove();
    const msg = document.createElement('div');
    msg.className = 'not-eligible-msg';
    msg.style.cssText = 'background:#fff3e0;border:1.5px solid #ff9800;border-radius:10px;padding:12px;margin-top:10px;font-size:0.88rem;color:#bf360c;font-weight:600;text-align:center;';
    msg.innerHTML = user
        ? `⚠️ Need ₹${Math.max(0, GIFT_CONFIG.TIER1_SPEND - user.totalSpent)} more to unlock gifts<br><small style="font-weight:400;color:#666">Current: ₹${user.totalSpent} of ₹${GIFT_CONFIG.TIER1_SPEND}</small>`
        : `❌ Phone number not found in our records<br><small style="font-weight:400;color:#666">Try ordering with this number first</small>`;
    modal.querySelector('.gift-phone-login-container').appendChild(msg);
}

function loadUserGiftData(phone) {
    const userName  = safeJSONParse('giftUserName', 'User');
    const totalSpent = safeJSONParse('giftUserSpent', 0);
    safeJSONSet(GIFT_CONFIG.USER_KEY, { phone, name: userName, totalSpent, firstVisit: new Date().toISOString(), lastVisit: new Date().toISOString() });
    loadGiftBoxState();
    updateGiftBadge();
    renderGiftBox();
    console.log(`[GiftBox] Logged in: ${userName} | Phone: ${phone} | Spent: ₹${totalSpent}`);
}

function updateGiftBadge() {
    const badge = document.getElementById('gift-badge');
    if (!badge || !giftBoxState) return;
    const canOpen = canOpenToday();
    if (canOpen) {
        badge.textContent = '!';
        badge.style.background = '#dc3545';
    } else if (checkCouponEligibility()) {
        badge.textContent = '✓';
        badge.style.background = '#28a745';
    } else {
        badge.textContent = getCurrentDay();
        badge.style.background = '#6c757d';
    }
}

function toggleGiftBox() {
    const userPhone = safeJSONParse('giftUserPhone', null);
    if (!userPhone) { showGiftPhoneLoginModal(); return; }
    const wrapper = document.getElementById('gift-box-wrapper');
    if (!wrapper) return;
    giftBoxVisible = !giftBoxVisible;
    if (giftBoxVisible) {
        wrapper.classList.add('show');
        wrapper.style.display = 'block';
        setTimeout(() => wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else {
        wrapper.classList.remove('show');
        wrapper.style.display = 'none';
    }
    renderGiftBox();
    updateGiftBadge();
}

// ===================== MENU RENDERING =====================

function renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;
    let items = [...MENU_ITEMS];
    const q = searchQuery.trim().toLowerCase();
    if (currentCategory !== 'all') items = items.filter(i => i.category === currentCategory);
    if (q) items = items.filter(i => i.name.toLowerCase().includes(q));

    if (!items.length) {
        menuContainer.innerHTML = `<div class="empty-cart" style="grid-column:1/-1;padding:50px 20px;text-align:center"><i class="fas fa-search" style="font-size:2.5rem;color:#ccc"></i><p style="margin-top:14px;font-weight:600;font-size:1rem">No items found</p><span style="color:#888;font-size:0.9rem">Try a different search or category</span></div>`;
        return;
    }

    const qtyMap = new Map(cart.map(c => [c.id, c.quantity]));
    const parts = [];
    items.forEach((item, idx) => {
        const qty = qtyMap.get(item.id) || 0;
        const eager = idx < 2;
        const imageSrc = getMenuImageSrc(item.image);
        const imgAttr = eager ? `src="${imageSrc}"` : `src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${imageSrc}"`;
        const onErr = `this.onerror=null;this.style.display='none';var p=this.parentElement;if(p){var e=p.querySelector('.img-emoji-fallback');if(e){e.style.display='flex';e.style.position='absolute';e.style.inset='0';e.style.alignItems='center';e.style.justifyContent='center';}}`;
        parts.push(`<div class="product-card" data-id="${item.id}"><div class="product-image"><img ${imgAttr} alt="${item.name}" loading="${eager ? 'eager' : 'lazy'}" width="400" height="225" decoding="async" onerror="${onErr}" onload="this.classList.add('loaded')"><div class="img-emoji-fallback" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;font-size:3.5rem;background:linear-gradient(135deg,#fff3e0,#ffe0b2)">${item.emoji||'🍽️'}</div><span class="product-badge">${item.category}</span></div><div class="product-info"><h3 class="product-name">${item.name}</h3><p class="product-price">Rs.${item.price}</p><div class="product-actions"><div class="quantity-control"><button class="qty-btn minus" data-id="${item.id}" ${qty <= 0 ? 'disabled' : ''}>-</button><span class="qty-value">${qty}</span><button class="qty-btn plus" data-id="${item.id}">+</button></div><button class="btn-add-cart ${qty > 0 ? 'added' : ''}" data-id="${item.id}"><i class="fas ${qty > 0 ? 'fa-check' : 'fa-cart-plus'}"></i><span>${qty > 0 ? 'Added' : 'Add'}</span></button></div></div></div>`);
    });
    menuContainer.innerHTML = parts.join('');
    if (imgObserver) menuContainer.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
}

// ===================== CART OPERATIONS =====================

function addToCart(id) {
    const item = MENU_ITEMS.find(i => i.id === id);
    if (!item) return;
    const existing = cart.find(c => c.id === id);
    if (existing) existing.quantity++;
    else cart.push({ id: item.id, name: item.name, price: item.price, category: item.category, image: item.image, quantity: 1 });
    saveCart(); updateCartDisplay(); updateCardUI(id); showToast(item.name + ' added!');
    if (navigator.vibrate) navigator.vibrate(15);
}

function decreaseQuantity(id) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.quantity--;
    if (item.quantity <= 0) cart = cart.filter(c => c.id !== id);
    saveCart(); updateCartDisplay(); updateCardUI(id);
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    saveCart(); updateCartDisplay(); updateCardUI(id);
    showToast('Item removed');
}

function updateCartQuantity(id, change) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) cart = cart.filter(c => c.id !== id);
    saveCart(); updateCartDisplay(); updateCardUI(id);
}

function updateCartDisplay() {
    let totalItems = 0, totalAmount = 0;
    cart.forEach(i => { totalItems += i.quantity; totalAmount += i.price * i.quantity; });
    const cartCount   = document.getElementById('cart-count');
    const cartTotal   = document.getElementById('cart-total');
    const stickyCart  = document.getElementById('sticky-cart');
    if (cartCount)  cartCount.textContent  = totalItems;
    if (cartTotal)  cartTotal.textContent  = 'Rs.' + totalAmount;
    if (stickyCart) stickyCart.style.display = totalItems > 0 ? 'block' : 'none';
    updateQrAmount();
    const drawer = document.getElementById('cart-drawer');
    if (!drawer || !drawer.classList.contains('open')) return;
    _rebuildCartItemsHTML(totalAmount);
}

function _rebuildCartItemsHTML(totalAmount) {
    const emptyCart  = document.getElementById('empty-cart');
    const cartItemsEl= document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-drawer-footer');
    if (!cart.length) {
        if (emptyCart)  emptyCart.style.display  = 'flex';
        if (cartItemsEl)cartItemsEl.style.display = 'none';
        if (cartFooter) cartFooter.style.display  = 'none';
        return;
    }
    if (emptyCart)  emptyCart.style.display  = 'none';
    if (cartItemsEl)cartItemsEl.style.display = 'block';
    if (cartFooter) cartFooter.style.display  = 'block';

    const parts = cart.map(item => {
        const menuItem = MENU_ITEMS.find(m => m.id === item.id);
        const emoji = menuItem ? (menuItem.emoji || '🍽️') : '🍽️';
        return `<div class="cart-item"><div style="width:48px;height:48px;border-radius:8px;background:linear-gradient(135deg,#ff9800,#e65100);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">${emoji}</div><div class="cart-item-details"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">Rs.${item.price} each</div></div><div class="cart-item-qty"><button data-action="decrease" data-id="${item.id}"><i class="fas fa-minus"></i></button><span>${item.quantity}</span><button data-action="increase" data-id="${item.id}"><i class="fas fa-plus"></i></button></div><button class="cart-item-remove" data-action="remove" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></div>`;
    }).join('');
    if (cartItemsEl) cartItemsEl.innerHTML = parts;

    const subtotal   = document.getElementById('cart-subtotal');
    const grandTotal = document.getElementById('cart-grand-total');
    if (subtotal)   subtotal.textContent   = 'Rs.' + totalAmount;
    if (grandTotal) grandTotal.textContent = 'Rs.' + totalAmount;
}

function updateCardUI(id) {
    const menuContainer = document.getElementById('menu-container');
    const card = menuContainer.querySelector(`.product-card[data-id="${id}"]`);
    if (!card) return;
    const qty    = cart.find(c => c.id === id)?.quantity || 0;
    const minus  = card.querySelector('.qty-btn.minus');
    const qtyVal = card.querySelector('.qty-value');
    const addBtn = card.querySelector('.btn-add-cart');
    if (minus)  minus.disabled = qty <= 0;
    if (qtyVal) qtyVal.textContent = qty;
    if (addBtn) {
        addBtn.className = 'btn-add-cart' + (qty > 0 ? ' added' : '');
        addBtn.innerHTML = `<i class="fas ${qty > 0 ? 'fa-check' : 'fa-cart-plus'}"></i><span>${qty > 0 ? 'Added' : 'Add'}</span>`;
    }
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartDisplay();
    document.querySelectorAll('.product-card').forEach(card => updateCardUI(parseInt(card.dataset.id)));
}

// ===================== UI HELPERS =====================

function setupImgObserver() {
    if (!('IntersectionObserver' in window)) return;
    imgObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const img = entry.target;
            const src = img.dataset.src;
            if (src) { img.src = src; img.removeAttribute('data-src'); }
            imgObserver.unobserve(img);
        });
    }, { rootMargin: '150px', threshold: 0.01 });
}

function loadCart() {
    cart = safeJSONParse('sriKrishnaCart', []);
    if (!Array.isArray(cart)) cart = [];
}

function saveCart() { safeJSONSet('sriKrishnaCart', cart); }

let toastTimer = null;
function showToast(msg) {
    const toast    = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function startHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots   = document.querySelectorAll('.hero-dot');
    if (!slides.length) return;
    function goto(idx) {
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        currentSlide = idx;
        slides[idx].classList.add('active');
        if (dots[idx]) dots[idx].classList.add('active');
    }
    if (heroSliderInterval) clearInterval(heroSliderInterval);
    heroSliderInterval = setInterval(() => goto((currentSlide + 1) % slides.length), 5000);
    dots.forEach((dot, idx) => dot.addEventListener('click', () => { if (idx !== currentSlide) goto(idx); }));
}

// ===================== PAYMENT & UPI =====================

function renderUpiAppGrid() {
    if (upiGridRendered) return;
    const grid = document.getElementById('upi-app-grid');
    if (!grid) return;
    grid.innerHTML = UPI_APPS.map(app => `<button type="button" class="upi-app-btn" data-app="${app.id}"><div class="upi-app-icon">${app.icon ? `<img src="${app.icon}" alt="${app.name}" loading="lazy" decoding="async" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\'fallback-icon\' style=\'background:${app.color}\'>${app.name[0]}</span>'">` : `<span class="fallback-icon" style="background:${app.color}">${app.name[0]}</span>`}</div><span class="upi-app-name">${app.name}</span></button>`).join('');
    upiGridRendered = true;
}

function handleUpiAppClick(appId) {
    const total = getTotal();
    if (total <= 0) { showToast('Please add items to cart first'); return; }
    const app = UPI_APPS.find(a => a.id === appId);
    if (!app) return;
    selectedUpiApp = appId;

    // Highlight selected app
    document.querySelectorAll('.upi-app-btn').forEach(btn => {
        if (btn.dataset.app === appId) {
            btn.style.borderColor = 'var(--primary)';
            btn.style.background = '#fff3e0';
            btn.style.boxShadow = '0 2px 8px rgba(230,81,0,0.15)';
        } else {
            btn.style.borderColor = 'var(--border)';
            btn.style.background = '#fff';
            btn.style.boxShadow = 'none';
        }
    });

    const pa = encodeURIComponent(UPI_ID), pn = encodeURIComponent(HOTEL_NAME), am = encodeURIComponent(total.toFixed(2)), tn = encodeURIComponent('Food Order - Sri Krishna Hotel');
    let url;
    if (/Android/i.test(navigator.userAgent) && app.pkg) {
        const fallback = encodeURIComponent(`upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`);
        url = `intent://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}#Intent;scheme=upi;package=${app.pkg};S.browser_fallback_url=${fallback};end`;
    } else if (/iPhone|iPad/i.test(navigator.userAgent)) {
        const schemes = { gpay: 'tez', phonepe: 'phonepe', paytm: 'paytmmp' };
        url = `${schemes[app.id] || 'upi'}://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
    } else {
        url = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
    }
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        window.location.href = url;
        showToast('Opening ' + app.name + '...');
    } else { showToast('Please open on mobile or scan QR'); }

    updatePaymentStatus('upi_initiated');
    paymentStatus = 'upi_initiated';
    document.getElementById('btn-submit-order').disabled = false;
}

function updatePaymentStatus(status) {
    const el = document.getElementById('payment-status');
    if (!el) return;
    const map = {
        paid:         '<span class="status-paid">✅ Payment Confirmed! Submit Order now</span>',
        upi_initiated:'<span class="status-upi-initiated">⏳ UPI App opened - Pay and come back to submit</span>',
        pending:      '<span class="status-pending">Scan QR code or select UPI app to pay</span>',
        qr_pending:   '<span class="status-pending">📱 Scan QR and pay ₹' + getTotal() + '</span>',
        cash:         '<span class="status-cash">💵 Cash on Delivery / Pickup</span>'
    };
    el.innerHTML = map[status] || '';
    el.style.display = 'block';
}

function updateQrAmount() {
    const el = document.getElementById('qr-display-amount');
    const el2 = document.getElementById('qr-amount-display');
    const total = getTotal();
    if (el) el.textContent = total;
    if (el2) el2.textContent = total;
}

function copyUpiId() {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(UPI_ID).then(() => showToast('UPI ID copied!'));
    } else {
        const ta = document.createElement('textarea');
        ta.value = UPI_ID; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta); showToast('UPI ID copied!');
    }
}

// ===================== EVENT LISTENERS =====================

function setupEventListeners() {
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) {
        menuContainer.addEventListener('click', function(e) {
            const plus = e.target.closest('.qty-btn.plus');
            if (plus) { addToCart(parseInt(plus.dataset.id)); return; }
            const minus = e.target.closest('.qty-btn.minus');
            if (minus) { decreaseQuantity(parseInt(minus.dataset.id)); return; }
            const add = e.target.closest('.btn-add-cart');
            if (add) { addToCart(parseInt(add.dataset.id)); }
        });
    }
    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        cartItems.addEventListener('click', function(e) {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const id = parseInt(btn.dataset.id), action = btn.dataset.action;
            if (action === 'increase') updateCartQuantity(id, 1);
            else if (action === 'decrease') updateCartQuantity(id, -1);
            else if (action === 'remove') removeFromCart(id);
        });
    }
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderMenu();
            document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' });
        });
    });
    document.querySelectorAll('.mobile-menu-item[data-category]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            currentCategory = this.dataset.category;
            document.querySelectorAll('.category-btn').forEach(b => { b.classList.remove('active'); if (b.dataset.category === currentCategory) b.classList.add('active'); });
            renderMenu(); closeMobileMenu();
            document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' });
        });
    });
    const searchToggle = document.getElementById('search-toggle');
    const searchClose  = document.getElementById('search-close');
    const searchInput  = document.getElementById('search-input');
    if (searchToggle) searchToggle.addEventListener('click', () => document.getElementById('search-bar').classList.toggle('active'));
    if (searchClose) searchClose.addEventListener('click', function() {
        document.getElementById('search-bar').classList.remove('active');
        if (searchInput) searchInput.value = '';
        searchQuery = ''; renderMenu();
    });
    if (searchInput) searchInput.addEventListener('input', function() {
        const val = this.value;
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => { searchQuery = val; renderMenu(); }, 120);
    });
    const menuToggle       = document.getElementById('menu-toggle');
    const mobileMenuClose  = document.getElementById('mobile-menu-close');
    const mobileMenuOverlay= document.getElementById('mobile-menu-overlay');
    if (menuToggle)        menuToggle.addEventListener('click', openMobileMenu);
    if (mobileMenuClose)   mobileMenuClose.addEventListener('click', closeMobileMenu);
    if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', closeMobileMenu);

    const cartBtn     = document.getElementById('cart-btn');
    const cartClose   = document.getElementById('cart-close');
    const cartOverlay = document.getElementById('cart-overlay');
    const btnContinue = document.getElementById('btn-continue');
    const btnPlaceOrder = document.getElementById('btn-place-order');
    if (cartBtn)      cartBtn.addEventListener('click', openCart);
    if (cartClose)    cartClose.addEventListener('click', closeCart);
    if (cartOverlay)  cartOverlay.addEventListener('click', closeCart);
    if (btnContinue)  btnContinue.addEventListener('click', closeCart);
    if (btnPlaceOrder) btnPlaceOrder.addEventListener('click', function() { closeCart(); updateQrAmount(); openOrderModal(); });

    const orderModalClose   = document.getElementById('order-modal-close');
    const orderModalOverlay = document.getElementById('order-modal-overlay');
    if (orderModalClose)   orderModalClose.addEventListener('click', closeOrderModal);
    if (orderModalOverlay) orderModalOverlay.addEventListener('click', closeOrderModal);

    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const qrSection = document.getElementById('qr-payment-section');
            const cashInfo = document.getElementById('cash-info-section');
            const cashLabel = document.getElementById('cash-option-label');
            const qrLabel = document.getElementById('qr-option-label');

            if (this.value === 'qr') {
                // Show QR section
                qrSection.style.display = 'block';
                cashInfo.style.display = 'none';
                // Highlight selected
                qrLabel.style.borderColor = 'var(--primary)';
                qrLabel.style.background = '#fff3e0';
                cashLabel.style.borderColor = 'var(--border)';
                cashLabel.style.background = '#fff';
                // Update amount
                updateQrAmount();
                paymentStatus = 'qr_pending';
                updatePaymentStatus('qr_pending');
                document.getElementById('btn-submit-order').disabled = false;
            } else {
                // Show Cash section
                qrSection.style.display = 'none';
                cashInfo.style.display = 'block';
                // Highlight selected
                cashLabel.style.borderColor = 'var(--primary)';
                cashLabel.style.background = '#fff3e0';
                qrLabel.style.borderColor = 'var(--border)';
                qrLabel.style.background = '#fff';
                paymentStatus = 'cash';
                updatePaymentStatus('cash');
                document.getElementById('btn-submit-order').disabled = false;
            }
        });
    });

    // Handle UPI app buttons in QR section
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.upi-app-btn');
        if (btn && btn.dataset.app) {
            handleUpiAppClick(btn.dataset.app);
        }
    });

    const btnCopyUpi = document.getElementById('btn-copy-upi');
    if (btnCopyUpi) btnCopyUpi.addEventListener('click', copyUpiId);

    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', function(e) { e.preventDefault(); submitOrder(); });

    const btnNewOrder = document.getElementById('btn-new-order');
    if (btnNewOrder) btnNewOrder.addEventListener('click', function() { closeSuccessModal(); clearCart(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

    const dlBtn = document.getElementById('btn-download-bill');
    if (dlBtn) dlBtn.addEventListener('click', () => { if (lastGeneratedBill) generateBillPDF(lastGeneratedBill, 'download'); });

    const mobileViewOrders  = document.getElementById('mobile-view-orders');
    const footerHistory     = document.getElementById('footer-history');
    const historyModalClose = document.getElementById('history-modal-close');
    const historyModalOverlay = document.getElementById('history-modal-overlay');
    if (mobileViewOrders)    mobileViewOrders.addEventListener('click', function(e) { e.preventDefault(); closeMobileMenu(); openHistoryModal(); });
    if (footerHistory)       footerHistory.addEventListener('click', function(e) { e.preventDefault(); openHistoryModal(); });
    if (historyModalClose)   historyModalClose.addEventListener('click', closeHistoryModal);
    if (historyModalOverlay) historyModalOverlay.addEventListener('click', closeHistoryModal);

    const mobileContact      = document.getElementById('mobile-contact');
    const footerContact      = document.getElementById('footer-contact');
    const contactModalClose  = document.getElementById('contact-modal-close');
    const contactModalOverlay= document.getElementById('contact-modal-overlay');
    if (mobileContact)       mobileContact.addEventListener('click', function(e) { e.preventDefault(); closeMobileMenu(); openContactModal(); });
    if (footerContact)       footerContact.addEventListener('click', function(e) { e.preventDefault(); openContactModal(); });
    if (contactModalClose)   contactModalClose.addEventListener('click', closeContactModal);
    if (contactModalOverlay) contactModalOverlay.addEventListener('click', closeContactModal);

    const customerMobile = document.getElementById('customer-mobile');
    if (customerMobile) customerMobile.addEventListener('input', function() { this.value = this.value.replace(/\D/g, '').slice(0, 10); });

    const giftFloatBtn = document.getElementById('gift-float-btn');
    if (giftFloatBtn) giftFloatBtn.addEventListener('click', toggleGiftBox);

    // Header gift button click
    const giftHeaderBtn = document.getElementById('gift-header-btn');
    if (giftHeaderBtn) giftHeaderBtn.addEventListener('click', toggleGiftBox);

    // Offer strip gift box click
    const offerGiftBox = document.getElementById('offer-gift-box');
    if (offerGiftBox) offerGiftBox.addEventListener('click', toggleGiftBox);

    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Escape' && e.key !== 'Esc') return;
        const orderModal = document.getElementById('order-modal');
        if (orderModal && orderModal.classList.contains('open')) { closeOrderModal(); return; }
        const cartDrawer = document.getElementById('cart-drawer');
        if (cartDrawer && cartDrawer.classList.contains('open')) { closeCart(); return; }
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && mobileMenu.classList.contains('open')) { closeMobileMenu(); return; }
        const searchBar = document.getElementById('search-bar');
        if (searchBar && searchBar.classList.contains('active')) {
            searchBar.classList.remove('active');
            const si = document.getElementById('search-input');
            if (si) si.value = '';
            searchQuery = ''; renderMenu();
        }
    });
}

// ===================== MODAL CONTROLS =====================

function openCart() {
    const drawer  = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer)  drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    _rebuildCartItemsHTML(getTotal());
}
function closeCart()       { document.getElementById('cart-drawer')?.classList.remove('open'); document.getElementById('cart-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }
function openMobileMenu()  { document.getElementById('mobile-menu')?.classList.add('open'); document.getElementById('mobile-menu-overlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeMobileMenu() { document.getElementById('mobile-menu')?.classList.remove('open'); document.getElementById('mobile-menu-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }

function closeOrderModal() {
    const modal   = document.getElementById('order-modal');
    const overlay = document.getElementById('order-modal-overlay');
    const form    = document.getElementById('order-form');
    const submitBtn = document.getElementById('btn-submit-order');
    if (modal)   modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (form) { form.reset(); form.querySelectorAll('input, textarea').forEach(el => { el.value = ''; el.blur(); }); }
    paymentStatus = 'cash';
    isSubmittingOrder = false;
    if (submitBtn) submitBtn.disabled = false;
    document.querySelectorAll('.upi-app-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('qr-payment-section').style.display = 'none';
    document.body.style.overflow = '';
}
function openSuccessModal()  { document.getElementById('success-modal')?.classList.add('open'); document.getElementById('success-modal-overlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeSuccessModal() { document.getElementById('success-modal')?.classList.remove('open'); document.getElementById('success-modal-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }
function openHistoryModal()  { renderOrderHistory(); document.getElementById('history-modal')?.classList.add('open'); document.getElementById('history-modal-overlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeHistoryModal() { document.getElementById('history-modal')?.classList.remove('open'); document.getElementById('history-modal-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }
function openContactModal()  { document.getElementById('contact-modal')?.classList.add('open'); document.getElementById('contact-modal-overlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeContactModal() { document.getElementById('contact-modal')?.classList.remove('open'); document.getElementById('contact-modal-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }

function openOrderModal() {
    document.getElementById('order-modal')?.classList.add('open');
    document.getElementById('order-modal-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    isSubmittingOrder = false;
    const modalBody = document.querySelector('#order-modal .modal-body');
    if (modalBody) modalBody.scrollTop = 0;
    const form = document.getElementById('order-form');
    if (form) form.reset();

    // Reset payment to Cash by default
    const cashRadio = document.querySelector('input[name="payment-method"][value="cash"]');
    if (cashRadio) cashRadio.checked = true;

    // Reset UI
    const qrSection = document.getElementById('qr-payment-section');
    const cashInfo = document.getElementById('cash-info-section');
    const cashLabel = document.getElementById('cash-option-label');
    const qrLabel = document.getElementById('qr-option-label');

    if (qrSection) qrSection.style.display = 'none';
    if (cashInfo) cashInfo.style.display = 'block';
    if (cashLabel) { cashLabel.style.borderColor = 'var(--primary)'; cashLabel.style.background = '#fff3e0'; }
    if (qrLabel) { qrLabel.style.borderColor = 'var(--border)'; qrLabel.style.background = '#fff'; }

    selectedUpiApp = null;
    document.querySelectorAll('.upi-app-btn').forEach(btn => btn.classList.remove('selected'));
    updatePaymentStatus('cash');
    paymentStatus = 'cash';
    document.getElementById('btn-submit-order').disabled = false;
    const dlBtn = document.getElementById('btn-download-bill');
    if (dlBtn) dlBtn.style.display = 'none';
    updateQrAmount();
}

// ===================== ORDER SUBMISSION =====================

function submitOrder() {
    const submitBtn = document.getElementById('btn-submit-order');
    if (isSubmittingOrder) { showToast('Order is already being submitted'); return; }

    const name   = document.getElementById('customer-name').value.trim();
    const mobile = document.getElementById('customer-mobile').value.trim();
    const table  = document.getElementById('table-number').value.trim();
    const notes  = document.getElementById('order-notes').value.trim();
    const method = document.querySelector('input[name="payment-method"]:checked')?.value || 'cash';

    if (!name || !mobile || !table) { showToast('Please fill all required fields'); return; }
    if (!/^[6-9]\d{9}$/.test(mobile)) { showToast('Enter valid 10-digit mobile number (start with 6-9)'); return; }
    if (name.length < 2 || !/^[\p{L}\s.'-]+$/u.test(name)) { showToast('Enter valid customer name'); return; }
    if (table.length < 2 || !/^[\p{L}\p{N}\s,./#()'-]+$/u.test(table)) { showToast('Enter valid place or table details'); return; }

    if (method === 'qr') {
        // For QR payment, just confirm they have paid
        const confirmed = confirm('Have you completed the QR code payment of ₹' + getTotal() + '?\n\nOK = Yes, payment done\nCancel = No, I will pay now');
        if (!confirmed) {
            // Scroll to QR section
            document.getElementById('qr-payment-section').scrollIntoView({ behavior: 'smooth' });
            return;
        }
        paymentStatus = 'paid';
    }

    if (cart.length === 0) { showToast('Cart is empty'); return; }
    const totalAmount = getTotal();
    if (totalAmount <= 0 || !isFinite(totalAmount)) { showToast('Invalid order amount'); return; }

    isSubmittingOrder = true;
    if (submitBtn) submitBtn.disabled = true;

    const now = new Date();
    const order = {
        id: 'ORD' + Date.now(),
        customerName:  name,
        customerMobile: mobile,
        tableNumber:   table,
        notes,
        paymentMethod: method,
        paymentStatus: method === 'cash' ? 'Cash' : 'Paid (Online)',
        items:         [...cart],
        totalAmount,
        date:          now.toLocaleDateString('en-IN'),
        time:          now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timestamp:     now.getTime(),
        processedAt:   now.toISOString(),
        orderHash:     generateOrderHash(name, mobile, totalAmount)
    };

    saveOrderToHistory(order);
    lastGeneratedBill = order;

    if (typeof window.saveOrderToFirestore === 'function') {
        window.saveOrderToFirestore(order).then(function(firestoreId) {
            if (firestoreId) { showToast('Order saved to cloud!'); }
            else { showToast('Order saved locally'); }
        }).catch(function(err) { console.error('Firebase save failed:', err); showToast('Saved locally (cloud failed)'); });
    }

    if (typeof window.saveOrder === 'function') {
        window.saveOrder({
            orderId: order.id, phone: mobile, amount: order.totalAmount,
            customerName: name, tableNumber: table, paymentMethod: method, notes,
            items: order.items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }))
        }).catch(err => console.error('Tracking error:', err));
    }

    updateSpendTracking(order.totalAmount);

    // Send bill to admin WhatsApp automatically
    sendBillToAdminWhatsApp(order);

    // Also generate PDF for customer download
    generateBillPDF(order, 'download').catch(err => {
        console.error('PDF error:', err);
    });

    closeOrderModal();
    openSuccessModal();
}

function generateOrderHash(name, mobile, amount) {
    const secret = 'SriKrishnaHotel2024';
    const str = name + mobile + amount + secret;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// ===================== PDF & WHATSAPP =====================

// ===================== SEND BILL TO ADMIN WHATSAPP =====================

function sendBillToAdminWhatsApp(order) {
    const adminMsg = buildAdminBillMessage(order);
    const encodedMsg = encodeURIComponent(adminMsg);
    const waUrl = 'https://wa.me/' + ADMIN_WHATSAPP_NUMBER + '?text=' + encodedMsg;

    // Open WhatsApp to admin in new tab
    window.open(waUrl, '_blank');

    showToast('📲 Bill opened for admin on WhatsApp!');
    return true;
}

/* function buildAdminBillMessage(order) {
    const items = order.items.map(i => 
        `• ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`
    ).join('
');

    return `*🧾 NEW ORDER - Sri Krishna Hotel*

` +
           `*Order ID:* ${order.id}
` +
           `*Date:* ${order.date} ${order.time}

` +
           `*Customer:* ${order.customerName}
` +
           `*Mobile:* ${order.customerMobile}
` +
           `*Table:* ${order.tableNumber}
` +
           `*Payment:* ${order.paymentStatus}

` +
           `*📋 ITEMS:*
${items}

` +
           `*💰 TOTAL: ₹${order.totalAmount}*

` +
           `${order.notes ? '*Notes:* ' + order.notes + '
' : ''}` +
           `━━━━━━━━━━━━━━━━━━
` +
           `_Auto-generated bill from online order_`;
}
*/

function buildAdminBillMessage(order) {
    const items = order.items
        .map(i => `- ${i.name} x${i.quantity} = Rs.${i.price * i.quantity}`)
        .join('\n');

    return [
        '*NEW ORDER - Sri Krishna Hotel*',
        '',
        `*Order ID:* ${order.id}`,
        `*Date:* ${order.date} ${order.time}`,
        '',
        `*Customer:* ${order.customerName}`,
        `*Mobile:* ${order.customerMobile}`,
        `*Place / Table:* ${order.tableNumber}`,
        `*Payment:* ${order.paymentStatus}`,
        '',
        '*ITEMS:*',
        items,
        '',
        `*TOTAL:* Rs.${order.totalAmount}*`,
        '',
        ...(order.notes ? [`*Notes:* ${order.notes}`, ''] : []),
        '------------------',
        '_Auto-generated bill from online order_'
    ].join('\n');
}

// ===================== END ADMIN WHATSAPP =====================

function generateBillPDF(order, mode) {
    return new Promise(function(resolve, reject) {
        function proceed(jsPDFClass) {
            try {
                const pdfDataUri = createPDFDataUri(order, jsPDFClass);
                if (mode === 'whatsapp') sendWhatsAppWithPDF(order, pdfDataUri);
                else {
                    const link = document.createElement('a');
                    link.href = pdfDataUri;
                    link.download = 'SriKrishna_Bill_' + order.id + '.pdf';
                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                }
                resolve();
            } catch (e) { reject(e); }
        }
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) { proceed(window.jspdf.jsPDF); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() { if (window.jspdf && window.jspdf.jsPDF) proceed(window.jspdf.jsPDF); else reject(new Error('jsPDF not found')); };
        script.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(script);
    });
}

function createPDFDataUri(order, jsPDFClass) {
    const doc = new jsPDFClass({ unit: 'mm', format: 'a4' });
    const L = 18, R = 192; let y = 18;
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text(HOTEL_NAME.toUpperCase(), 105, y, { align: 'center' }); y += 9;
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text('Authentic South Indian Cuisine', 105, y, { align: 'center' }); y += 6;
    doc.text('Phone: ' + PHONE_NUMBER, 105, y, { align: 'center' }); y += 6;
    doc.text('UPI: ' + UPI_ID, 105, y, { align: 'center' }); y += 8;
    doc.setLineWidth(0.5); doc.line(L, y, R, y); y += 8;
    doc.setFontSize(10);
    doc.text('Date: ' + order.date, L, y);
    doc.text('Time: ' + order.time, R, y, { align: 'right' }); y += 7;
    doc.text('Order ID: ' + order.id, L, y); y += 8;
    doc.line(L, y, R, y); y += 8;
    doc.text('Customer : ' + order.customerName, L, y); y += 6;
    doc.text('Mobile   : ' + order.customerMobile, L, y); y += 6;
    doc.text('Place / Table : ' + order.tableNumber, L, y); y += 6;
    if (order.notes) { doc.text('Notes    : ' + order.notes, L, y); y += 6; }
    y += 2; doc.line(L, y, R, y); y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Item', L, y); doc.text('Qty', 120, y, { align: 'center' }); doc.text('Rate', 155, y, { align: 'right' }); doc.text('Amount', R, y, { align: 'right' }); y += 6;
    doc.setLineWidth(0.3); doc.line(L, y, R, y); y += 8;
    doc.setFont('helvetica', 'normal');
    order.items.forEach(function(item) {
        const n = item.name.length > 26 ? item.name.slice(0, 23) + '...' : item.name;
        doc.text(n, L, y); doc.text(String(item.quantity), 120, y, { align: 'center' });
        doc.text('Rs.' + item.price, 155, y, { align: 'right' }); doc.text('Rs.' + (item.price * item.quantity), R, y, { align: 'right' }); y += 7;
    });
    y += 4; doc.setLineWidth(0.5); doc.line(L, y, R, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('TOTAL AMOUNT', L, y); doc.text('Rs.' + order.totalAmount, R, y, { align: 'right' }); y += 10;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('Payment Method : ' + order.paymentStatus, L, y); y += 10;
    doc.setLineWidth(0.5); doc.line(L, y, R, y); y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for choosing Sri Krishna Hotel!', 105, y, { align: 'center' }); y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('Order prepared with care and served fresh.', 105, y, { align: 'center' });
    return doc.output('datauristring');
}

function sendWhatsAppWithPDF(order, pdfDataUri) {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
        try {
            const base64 = pdfDataUri.split(',')[1];
            const binaryStr = window.atob(base64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const file = new File([blob], 'SriKrishna_Bill_' + order.id + '.pdf', { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ title: 'Sri Krishna Hotel - Bill ' + order.id, text: buildWhatsAppText(order), files: [file] })
                    .then(() => showToast('Bill shared!'))
                    .catch(() => downloadPDFAndOpenWhatsApp(order, pdfDataUri));
            } else { downloadPDFAndOpenWhatsApp(order, pdfDataUri); }
        } catch(e) { downloadPDFAndOpenWhatsApp(order, pdfDataUri); }
    } else { downloadPDFAndOpenWhatsApp(order, pdfDataUri); }
}

function downloadPDFAndOpenWhatsApp(order, pdfDataUri) {
    const link = document.createElement('a');
    link.href = pdfDataUri; link.download = 'SriKrishna_Bill_' + order.id + '.pdf';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    const dlBtn = document.getElementById('btn-download-bill');
    if (dlBtn) dlBtn.style.display = 'flex';
    setTimeout(function() {
        const msg = buildWhatsAppMessageEncoded(order);
        window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg, '_blank');
        showToast('Bill downloaded! WhatsApp opened.');
    }, 600);
}

function buildWhatsAppText(order) {
    const items = order.items.map(i => i.name + ' x' + i.quantity + ' - Rs.' + (i.price * i.quantity)).join('\n');
    return `*${HOTEL_NAME.toUpperCase()}*\n\nOrder: ${order.id}\nDate: ${order.date} ${order.time}\n\nCustomer: ${order.customerName}\nPlace / Table: ${order.tableNumber}\n\nItems:\n${items}\n\nTotal: Rs.${order.totalAmount}\nPayment: ${order.paymentStatus}${order.notes ? '\nNotes: ' + order.notes : ''}\n\nThank you! Visit again.`;
}
function buildWhatsAppMessageEncoded(order) { return encodeURIComponent(buildWhatsAppText(order)); }
function sendWhatsAppText(order) { window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + buildWhatsAppMessageEncoded(order), '_blank'); }

// ===================== ORDER HISTORY =====================

function saveOrderToHistory(order) {
    try {
        let h = safeJSONParse('sriKrishnaOrders', []);
        if (!Array.isArray(h)) h = [];
        h = h.filter(existing => existing?.id !== order.id);
        h.unshift(order);
        if (h.length > 50) h = h.slice(0, 50);
        safeJSONSet('sriKrishnaOrders', h);
    } catch {}
}

function renderOrderHistory() {
    const container = document.getElementById('order-history-list');
    if (!container) return;
    try {
        const history = safeJSONParse('sriKrishnaOrders', []);
        if (!history.length) { container.innerHTML = '<div class="empty-history"><i class="fas fa-clipboard-list"></i><p>No orders yet</p></div>'; return; }
        container.innerHTML = history.map(o => `<div class="history-item"><div class="history-item-header"><h4>${o.customerName} - ${o.tableNumber}</h4><span class="history-item-date">${o.date} ${o.time}</span></div><div class="history-item-details">${o.items.map(i => i.name + ' x' + i.quantity).join(', ')}</div><div class="history-item-total">Rs.${o.totalAmount} - ${o.paymentStatus}</div></div>`).join('');
    } catch { container.innerHTML = '<div class="empty-history"><i class="fas fa-clipboard-list"></i><p>No orders yet</p></div>'; }
}


// ===================== GIFT BOX SYSTEM (UPDATED) =====================
// Changes:
// - Only shows days 1 through current day (not all 10 days upfront)
// - Shows tracking text: "Day X of 10 • Y days remaining"
// - Gift box hidden by default - requires phone login to unlock view
// - Eligibility verified against order database before showing UI

function loadGiftBoxState() {
    giftBoxState = safeJSONParse(GIFT_CONFIG.STORAGE_KEY, null);
    if (giftBoxState) {
        const now      = new Date();
        const lastDate = new Date(giftBoxState.cycleStartDate);
        const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= GIFT_CONFIG.CYCLE_DAYS) giftBoxState = createNewCycle();
    } else {
        giftBoxState = createNewCycle();
    }
    saveGiftBoxState();
    return giftBoxState;
}

function createNewCycle() {
    return {
        cycleStartDate: new Date().toISOString(),
        openedDays:     [],
        totalSpent:     0,
        couponClaimed:  false,
        lastOpenedDate: null
    };
}

function saveGiftBoxState() { safeJSONSet(GIFT_CONFIG.STORAGE_KEY, giftBoxState); }

function getCurrentDay() {
    const now   = new Date();
    const start = new Date(giftBoxState.cycleStartDate);
    const diff  = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.min(diff + 1, GIFT_CONFIG.CYCLE_DAYS);
}

function canOpenToday() {
    const today      = getCurrentDay();
    if (today > GIFT_CONFIG.CYCLE_DAYS) return false;
    if (giftBoxState.openedDays.includes(today)) return false;
    const lastOpened = giftBoxState.openedDays.length > 0 ? Math.max(...giftBoxState.openedDays) : 0;
    return today > lastOpened;
}

function updateSpendTracking(amount) {
    if (!giftBoxState) loadGiftBoxState();
    giftBoxState.totalSpent += amount;
    saveGiftBoxState();
    // Don't auto-render - user must login again to see updated status
    updateGiftBadge();
}

function checkCouponEligibility() {
    const allDaysOpened = giftBoxState.openedDays.length >= GIFT_CONFIG.CYCLE_DAYS;
    if (!allDaysOpened || giftBoxState.couponClaimed) return 0;
    if (giftBoxState.totalSpent >= GIFT_CONFIG.TIER2_SPEND) return GIFT_CONFIG.TIER2_VALUE;
    if (giftBoxState.totalSpent >= GIFT_CONFIG.TIER1_SPEND) return GIFT_CONFIG.TIER1_VALUE;
    return 0;
}

// ===================== RENDER GIFT BOX (ONLY SHOWS DAYS 1 TO CURRENT DAY) =====================

function renderGiftBox() {
    const container = document.getElementById('gift-box-container');
    if (!container) return;
    if (!giftBoxState) loadGiftBoxState();

    const currentDay  = getCurrentDay();
    const canOpen     = canOpenToday();
    const couponValue = checkCouponEligibility();
    const daysRemaining = GIFT_CONFIG.CYCLE_DAYS - currentDay;
    const daysOpened = giftBoxState.openedDays.length;

    // Rewards for each day
    const rewards = [
        {day:1, icon:'🎯', desc:'5% OFF next order'},
        {day:2, icon:'🚚', desc:'FREE Delivery'},
        {day:3, icon:'💰', desc:'₹10 Cashback'},
        {day:4, icon:'🥤', desc:'FREE Drink'},
        {day:5, icon:'🎯', desc:'10% OFF'},
        {day:6, icon:'🎁', desc:'Buy 1 Get 1'},
        {day:7, icon:'🍰', desc:'FREE Dessert'},
        {day:8, icon:'💰', desc:'₹20 OFF'},
        {day:9, icon:'🎉', desc:'Special Discount'},
        {day:10, icon:'🎊', desc:'MYSTERY BOX'}
    ];

    let html = `<div class="gift-box-section">
        <div class="gift-box-header">
            <i class="fas fa-gift"></i>
            <h3>🎁 Daily Gift Box</h3>
            <span class="gift-progress">Day ${currentDay}/10</span>
        </div>`;

    // Tracking info box - shows progress and remaining days
    html += `<div class="gift-tracking-info" style="background:linear-gradient(135deg,#fff3e0,#ffe0b2);border:2px dashed #ff9800;border-radius:12px;padding:14px;margin-bottom:14px;text-align:center">
        <div style="font-size:1rem;color:#e65100;font-weight:700;margin-bottom:8px">
            📅 Day ${currentDay} of 10 • ${daysRemaining} days remaining
        </div>
        <div style="font-size:0.85rem;color:#666;line-height:1.6">
            ✅ ${daysOpened} days opened • ${canOpen ? '🎁 You can open today!' : '⏳ Come back tomorrow'}
        </div>
        <div style="font-size:0.8rem;color:#888;margin-top:6px">
            💰 Total Spent: ₹${giftBoxState.totalSpent} | Need ₹${Math.max(0, GIFT_CONFIG.TIER1_SPEND - giftBoxState.totalSpent)} more for ₹50 coupon
        </div>
    </div>`;

    // Show ALL 10 days grid (1-10 always visible for count tracking)
    html += `<div class="gift-box-grid">`;

    for (let i = 1; i <= GIFT_CONFIG.CYCLE_DAYS; i++) {
        const isOpened = giftBoxState.openedDays.includes(i);
        const isToday  = i === currentDay;
        const isPast   = i < currentDay && !isOpened;
        const isFuture = i > currentDay;
        const reward = rewards[i-1];

        let statusClass = '', icon = '';
        if (isOpened) { 
            statusClass = 'opened'; 
        } else if (isToday && canOpen) { 
            statusClass = 'active pulse'; 
        } else if (isPast) { 
            statusClass = 'missed'; 
        } else if (isFuture) {
            statusClass = 'future';
        } else { 
            statusClass = 'locked'; 
        }

        html += `<div class="gift-box-day ${statusClass}" data-day="${i}" title="${reward.desc}">
            <div class="gift-box-icon">${isOpened ? '✅' : reward.icon}</div>
            <span class="gift-day-num" style="font-size:0.6rem;font-weight:600">Day ${i}</span>
            <span style="font-size:0.55rem;color:#888;text-align:center;line-height:1.1;margin-top:2px">${reward.desc}</span>
        </div>`;
    }

    html += `</div>`;

    // Progress bar
    const progress = (daysOpened / GIFT_CONFIG.CYCLE_DAYS) * 100;
    html += `<div class="gift-progress-bar"><div class="gift-progress-fill" style="width:${progress}%"></div></div>`;

    // Status text
    html += `<div class="gift-status-text">${getGiftStatusText()}</div>`;

    // Day 1 special: Show "Claim Rewards" button
    if (currentDay === 1 && canOpen) {
        html += `<div class="coupon-section day1-special">
            <div class="coupon-banner day1-banner"><i class="fas fa-gift"></i><span>🎁 Day 1 Special Reward Available!</span></div>
            <button class="btn-claim-coupon" id="btn-claim-day1"><i class="fas fa-gift"></i> Claim Rewards</button>
        </div>`;
    }

    // Day 10: Mystery Box reward
    if (currentDay === 10 && canOpen) {
        html += `<div class="coupon-section day10-mystery">
            <div class="coupon-banner day10-banner"><i class="fas fa-star"></i><span>🎊 MYSTERY BOX UNLOCKED! Special Surprise Inside!</span></div>
            <button class="btn-claim-coupon btn-mystery" id="btn-claim-mystery"><i class="fas fa-box-open"></i> Open Mystery Box</button>
        </div>`;
    }

    // Regular coupon section (if eligible from spending)
    if (couponValue && currentDay !== 1 && currentDay !== 10) {
        html += `<div class="coupon-section">
            <div class="coupon-banner"><i class="fas fa-ticket-alt"></i><span>🎉 Congratulations! You unlocked free food worth ₹${couponValue}!</span></div>
            <button class="btn-claim-coupon" id="btn-claim-coupon"><i class="fas fa-gift"></i> Claim Your Free Food (up to ₹${couponValue})</button>
        </div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Add click handlers for openable days
    container.querySelectorAll('.gift-box-day.active').forEach(day => {
        day.addEventListener('click', () => handleGiftBoxClick(parseInt(day.dataset.day)));
    });

    // Day 1 Claim Rewards handler
    const day1Btn = container.querySelector('#btn-claim-day1');
    if (day1Btn) {
        day1Btn.addEventListener('click', () => {
            showToast('🎁 Day 1 Reward Claimed!');
            handleGiftBoxClick(1);
        });
    }

    // Day 10 Mystery Box handler
    const mysteryBtn = container.querySelector('#btn-claim-mystery');
    if (mysteryBtn) {
        mysteryBtn.addEventListener('click', () => {
            showToast('🎊 Mystery Box Opened!');
            handleGiftBoxClick(10);
            // Show special mystery reward
            setTimeout(() => {
                showGiftReward(10);
            }, 300);
        });
    }

    // Regular coupon claim handler
    const claimBtn = container.querySelector('#btn-claim-coupon');
    if (claimBtn) {
        claimBtn.addEventListener('click', () => openCouponModal());
    }
}

function getGiftStatusText() {
    const currentDay = getCurrentDay();
    const daysRemaining = GIFT_CONFIG.CYCLE_DAYS - currentDay;
    const daysOpened = giftBoxState.openedDays.length;
    const spent = giftBoxState.totalSpent;
    const couponValue = checkCouponEligibility();

    if (couponValue) {
        return `🎉 CONGRATULATIONS! You've earned a ₹${couponValue} FREE FOOD reward! Click "Claim" to select your free item.`;
    }

    let status = `📊 Progress: ${daysOpened}/10 days opened • ${daysRemaining} days left\n`;

    if (spent < GIFT_CONFIG.TIER1_SPEND) {
        status += `💳 Spend ₹${GIFT_CONFIG.TIER1_SPEND - spent} more to unlock ₹50 coupon\n`;
        status += `💳 Or spend ₹${GIFT_CONFIG.TIER2_SPEND - spent} more for ₹100 coupon`;
    } else if (spent < GIFT_CONFIG.TIER2_SPEND) {
        status += `✅ ₹50 coupon UNLOCKED! Open all days to claim\n`;
        status += `💳 Spend ₹${GIFT_CONFIG.TIER2_SPEND - spent} more to upgrade to ₹100`;
    } else {
        status += `✅ ₹100 coupon UNLOCKED!\n`;
        status += `🎁 Open all remaining days to claim your reward!`;
    }

    return status;
}

function handleGiftBoxClick(day) {
    if (!canOpenToday() || day !== getCurrentDay()) {
        showToast(day < getCurrentDay() ? 'This day has passed! Open today\'s box.' : 'Come back tomorrow!');
        return;
    }
    giftBoxState.openedDays.push(day);
    giftBoxState.lastOpenedDate = new Date().toISOString();
    saveGiftBoxState();
    showGiftReward(day);
    renderGiftBox();
    updateGiftBadge();
}

function showGiftReward(day) {
    const rewards = [
        '5% off next order','Free delivery','Rs.10 cashback','Free drink',
        '10% off','Buy 1 Get 1','Free dessert','Rs.20 off','Special discount','🎁 Mystery Box'
    ];
    const reward = rewards[day - 1] || 'Special surprise!';
    const modal  = document.createElement('div');
    modal.className = 'gift-reward-modal';
    modal.innerHTML = `<div class="gift-reward-content"><div class="gift-reward-icon">🎁</div><h3>Day ${day} Reward!</h3><p class="gift-reward-text">${reward}</p><button class="btn-gift-ok"><i class="fas fa-check"></i> Awesome!</button></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.btn-gift-ok').addEventListener('click', () => modal.remove());
    setTimeout(() => { if (modal.parentNode) modal.remove(); }, 3000);
}

// ===================== GIFT BOX LOGIN (REQUIRED BEFORE VIEWING) =====================

function initGiftBoxWithLogin() {
    // Gift box stays hidden until user logs in
    const wrapper = document.getElementById('gift-box-wrapper');
    if (wrapper) {
        wrapper.classList.remove('show');
        wrapper.style.display = 'none';
        giftBoxVisible = false;
    }
    updateGiftBadge();
}

function toggleGiftBox() {
    const userPhone = safeJSONParse('giftUserPhone', null);

    // If not logged in, show phone login modal FIRST
    if (!userPhone) { 
        showGiftPhoneLoginModal(); 
        return; 
    }

    // If logged in, toggle visibility
    const wrapper = document.getElementById('gift-box-wrapper');
    if (!wrapper) return;

    giftBoxVisible = !giftBoxVisible;
    if (giftBoxVisible) {
        wrapper.classList.add('show');
        wrapper.style.display = 'block';
        setTimeout(() => wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        renderGiftBox(); // Render with current day only
    } else {
        wrapper.classList.remove('show');
        wrapper.style.display = 'none';
    }
    updateGiftBadge();
}

function showGiftPhoneLoginModal() {
    const existing = document.getElementById('gift-phone-login-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'gift-phone-login-modal';
    modal.className = 'gift-phone-login-modal-overlay';
    modal.innerHTML = `
        <div class="gift-phone-login-container">
            <h2>🎁 Unlock Your Daily Gifts!</h2>
            <p>Enter your phone number to check your rewards</p>
            <input type="tel" id="gift-phone-input" maxlength="10" placeholder="10-digit number" inputmode="numeric">
            <button id="gift-phone-submit">Check My Rewards</button>
            <button id="gift-phone-cancel" style="width:100%;padding:12px;background:#f5f5f5;color:#666;border-radius:50px;font-weight:600;font-size:0.95rem;border:none;cursor:pointer;margin-top:-8px;"><i class="fas fa-times"></i> Cancel</button>
            <p class="gift-info-text">💰 Spend ₹1000+ to unlock gifts • Spend ₹2000+ for bigger rewards!</p>
        </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#gift-phone-input');
    const btn   = modal.querySelector('#gift-phone-submit');
    const cancelBtn = modal.querySelector('#gift-phone-cancel');

    cancelBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    btn.addEventListener('click', () => {
        const phone = input.value.trim();
        if (!/^[6-9]\d{9}$/.test(phone)) {
            showToast('Please enter valid 10-digit mobile number (start with 6-9)');
            return;
        }
        btn.disabled = true;
        btn.textContent = '🔍 Checking...';
        verifyUserPhoneAndSetupGifts(phone, modal);
    });

    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') btn.click(); });
    setTimeout(() => input.focus(), 100);
}

async function verifyUserPhoneAndSetupGifts(phone, modal) {
    const btn = modal.querySelector('#gift-phone-submit');
    try {
        let userData = null;

        // Check Firebase first (database tracking)
        const db = await (typeof window.initFirebase === 'function' ? window.initFirebase() : null);
        if (db) {
            try {
                const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                const q = query(collection(db, "orders"), where("customerMobile", "==", phone));
                const snapshot = await getDocs(q);
                let totalSpent = 0, customerName = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    totalSpent += (data.totalAmount || 0);
                    if (!customerName) customerName = data.customerName || '';
                });
                if (snapshot.size > 0) {
                    userData = { name: customerName || 'Customer', totalSpent, eligible: totalSpent >= GIFT_CONFIG.TIER1_SPEND };
                }
            } catch(e) {
                console.error('[Gift] Firebase query error:', e);
                userData = checkLocalOrders(phone);
            }
        } else {
            // Fallback to local storage
            userData = checkLocalOrders(phone);
        }

        if (btn) { btn.disabled = false; btn.textContent = 'Check My Rewards'; }

        if (userData && userData.totalSpent > 0) {
            // Save user data
            safeJSONSet('giftUserPhone', phone);
            safeJSONSet('giftUserName', userData.name);
            safeJSONSet('giftUserSpent', userData.totalSpent);

            // Update gift box state with user's total spent
            if (!giftBoxState) loadGiftBoxState();
            giftBoxState.totalSpent = userData.totalSpent;
            saveGiftBoxState();

            modal.remove();
            showRewardStatusCard(userData, phone);
        } else {
            showNotEligibleCard(modal, phone, userData);
        }
    } catch(e) {
        console.error('[Gift] Verify error:', e);
        if (btn) { btn.disabled = false; btn.textContent = 'Check My Rewards'; }

        // Fallback to local check
        const userData = checkLocalOrders(phone);
        if (userData && userData.totalSpent > 0) {
            safeJSONSet('giftUserPhone', phone);
            safeJSONSet('giftUserName', userData.name);
            safeJSONSet('giftUserSpent', userData.totalSpent);

            if (!giftBoxState) loadGiftBoxState();
            giftBoxState.totalSpent = userData.totalSpent;
            saveGiftBoxState();

            modal.remove();
            showRewardStatusCard(userData, phone);
        } else {
            showNotEligibleCard(modal, phone, null);
        }
    }
}

function checkLocalOrders(phone) {
    try {
        const orders = safeJSONParse('sriKrishnaOrders', []);
        const userOrders = orders.filter(o => o.customerMobile === phone);
        if (!userOrders.length) return null;
        const totalSpent = userOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const name = userOrders[0].customerName || 'Customer';
        return { name, totalSpent, eligible: totalSpent >= GIFT_CONFIG.TIER1_SPEND };
    } catch { return null; }
}

function showRewardStatusCard(user, phone) {
    const existing = document.getElementById('reward-status-card');
    if (existing) existing.remove();

    const isEligible = user.totalSpent >= GIFT_CONFIG.TIER1_SPEND;
    const card = document.createElement('div');
    card.id = 'reward-status-card';
    card.className = 'reward-status-card-overlay';
    card.innerHTML = `
        <div class="reward-status-card">
            <button class="reward-card-cancel" id="reward-card-cancel"><i class="fas fa-times"></i></button>
            <div class="reward-card-icon">${isEligible ? '🎉' : '⏳'}</div>
            <h3>${isEligible ? 'You Have Rewards!' : 'Almost There!'}</h3>
            <p class="reward-card-name">Hi ${user.name}!</p>
            <div class="reward-card-stats">
                <div class="reward-stat">
                    <span class="reward-stat-value">₹${user.totalSpent}</span>
                    <span class="reward-stat-label">Total Spent</span>
                </div>
                <div class="reward-stat ${isEligible ? 'eligible' : ''}">
                    <span class="reward-stat-value">${isEligible ? '✅' : `₹${Math.max(0, GIFT_CONFIG.TIER1_SPEND - user.totalSpent)}`}</span>
                    <span class="reward-stat-label">${isEligible ? 'Eligible!' : 'More Needed'}</span>
                </div>
            </div>
            <p class="reward-card-msg">${isEligible ? '🎁 You can claim your daily gift boxes now! Click below to view.' : `Spend ₹${Math.max(0, GIFT_CONFIG.TIER1_SPEND - user.totalSpent)} more to unlock gift rewards`}</p>
            <button class="reward-card-open-btn" id="reward-open-gifts">
                <i class="fas fa-gift"></i> ${isEligible ? 'Open Gift Box' : 'View Progress'}
            </button>
            <button class="reward-card-close-btn" id="reward-card-close">Close</button>
        </div>
    `;
    document.body.appendChild(card);
    document.body.style.overflow = 'hidden';

    const closeCard = () => { card.remove(); document.body.style.overflow = ''; };
    document.getElementById('reward-card-cancel').addEventListener('click', closeCard);
    document.getElementById('reward-card-close').addEventListener('click', closeCard);
    card.addEventListener('click', (e) => { if (e.target === card) closeCard(); });

    document.getElementById('reward-open-gifts').addEventListener('click', () => {
        closeCard();
        // Now show the actual gift box
        const wrapper = document.getElementById('gift-box-wrapper');
        if (wrapper) {
            giftBoxVisible = true;
            wrapper.classList.add('show');
            wrapper.style.display = 'block';
            setTimeout(() => wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            renderGiftBox(); // This will show only days 1-currentDay
            updateGiftBadge();
        }
    });
}

function showNotEligibleCard(modal, phone, user) {
    const btn = modal.querySelector('#gift-phone-submit');
    if (btn) { btn.disabled = false; btn.textContent = 'Check My Rewards'; }
    const existing = modal.querySelector('.not-eligible-msg');
    if (existing) existing.remove();
    const msg = document.createElement('div');
    msg.className = 'not-eligible-msg';
    msg.style.cssText = 'background:#fff3e0;border:1.5px solid #ff9800;border-radius:10px;padding:12px;margin-top:10px;font-size:0.88rem;color:#bf360c;font-weight:600;text-align:center;';
    msg.innerHTML = user
        ? `⚠️ Need ₹${Math.max(0, GIFT_CONFIG.TIER1_SPEND - user.totalSpent)} more to unlock gifts<br><small style="font-weight:400;color:#666">Current: ₹${user.totalSpent} of ₹${GIFT_CONFIG.TIER1_SPEND}</small>`
        : `❌ Phone number not found in our records<br><small style="font-weight:400;color:#666">Try ordering with this number first</small>`;
    modal.querySelector('.gift-phone-login-container').appendChild(msg);
}

function updateGiftBadge() {
    const badge = document.getElementById('gift-badge');
    const headerBadge = document.getElementById('gift-header-badge');

    const userPhone = safeJSONParse('giftUserPhone', null);

    if (!badge) return;

    // If not logged in, show "!" to prompt login
    if (!userPhone) {
        badge.textContent = '!';
        badge.style.background = '#dc3545';
        if (headerBadge) {
            headerBadge.textContent = '!';
            headerBadge.style.display = 'flex';
        }
        return;
    }

    // Logged in - check status
    if (!giftBoxState) loadGiftBoxState();
    const canOpen = canOpenToday();

    if (canOpen) {
        badge.textContent = '1';
        badge.style.background = '#dc3545';
    } else if (checkCouponEligibility()) {
        badge.textContent = '✓';
        badge.style.background = '#28a745';
    } else {
        badge.textContent = getCurrentDay();
        badge.style.background = '#6c757d';
    }

    if (headerBadge) {
        headerBadge.style.display = canOpen ? 'flex' : 'none';
    }
}

// ===================== COUPON SYSTEM (UNCHANGED) =====================

function openCouponModal() {
    const couponValue = checkCouponEligibility();
    if (!couponValue) { showToast('Not eligible yet!'); return; }

    const eligibleItems = MENU_ITEMS.filter(item => item.price <= couponValue);
    if (!eligibleItems.length) { showToast('No eligible items found'); return; }

    const existing = document.getElementById('coupon-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'coupon-modal-overlay';
    modal.id = 'coupon-modal';
    modal.innerHTML = `
        <div class="coupon-modal">
            <div class="coupon-modal-header">
                <h3><i class="fas fa-ticket-alt"></i> Claim Your Free Food (₹${couponValue})</h3>
                <button class="coupon-close" id="coupon-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="coupon-modal-body">
                <div class="coupon-info">
                    <i class="fas fa-info-circle"></i>
                    <p>Select any <strong>1 item</strong> below worth up to <strong>₹${couponValue}</strong>. It will be added to your cart for FREE!</p>
                </div>
                <div class="coupon-items-grid" id="coupon-items-grid"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const grid = modal.querySelector('#coupon-items-grid');
    grid.innerHTML = eligibleItems.map(item => `
        <div class="coupon-item-card" data-item-id="${item.id}">
            <div class="coupon-item-emoji">${item.emoji || '🍽️'}</div>
            <div class="coupon-item-name">${item.name}</div>
            <div class="coupon-item-price">₹${item.price}</div>
        </div>
    `).join('');

    grid.querySelectorAll('.coupon-item-card').forEach(card => {
        card.addEventListener('click', () => {
            const itemId = parseInt(card.dataset.itemId);
            claimCouponItem(itemId, couponValue);
            modal.remove();
            document.body.style.overflow = '';
        });
    });

    document.getElementById('coupon-close').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) { modal.remove(); document.body.style.overflow = ''; }
    });
}

function claimCouponItem(itemId, couponValue) {
    const item = MENU_ITEMS.find(i => i.id === itemId);
    if (!item) { showToast('Item not found'); return; }

    const existing = cart.find(c => c.id === itemId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: item.id,
            name: item.name + ' (FREE)',
            originalName: item.name,
            price: 0,
            originalPrice: item.price,
            category: item.category,
            image: item.image,
            quantity: 1,
            isFree: true,
            couponValue: couponValue
        });
    }
    saveCart();
    updateCartDisplay();

    giftBoxState.couponClaimed = true;
    saveGiftBoxState();

    showCouponSuccess(item, couponValue);

    setTimeout(() => {
        resetGiftBoxCycle();
    }, 500);
}

function showCouponSuccess(item, couponValue) {
    const existing = document.getElementById('coupon-success-modal');
    if (existing) existing.remove();

    const couponCode = 'SKG' + Date.now().toString(36).toUpperCase().slice(-6);

    const modal = document.createElement('div');
    modal.className = 'coupon-success-overlay';
    modal.id = 'coupon-success-modal';
    modal.innerHTML = `
        <div class="coupon-success-modal">
            <div class="coupon-success-icon"><i class="fas fa-check"></i></div>
            <h3>Coupon Claimed!</h3>
            <p style="margin-bottom:4px"><strong>${item.name}</strong> added FREE!</p>
            <p style="font-size:0.85rem;color:#666;margin-bottom:14px">Worth ₹${item.price} • ₹${couponValue} coupon used</p>
            <div class="coupon-code-box">
                <span class="coupon-code">${couponCode}</span>
                <button class="btn-copy-code" id="btn-copy-coupon-code"><i class="fas fa-copy"></i></button>
            </div>
            <p class="coupon-hint">Show this code at the counter when collecting your order</p>
            <button class="btn-coupon-done" id="btn-coupon-done">Done</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    document.getElementById('btn-coupon-done').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
    });
    document.getElementById('btn-copy-coupon-code').addEventListener('click', () => {
        navigator.clipboard?.writeText(couponCode).then(() => showToast('Code copied!'));
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) { modal.remove(); document.body.style.overflow = ''; }
    });

    showToast(`🎉 ${item.name} added FREE to your cart!`);
}

function resetGiftBoxCycle() {
    giftBoxState = {
        cycleStartDate: new Date().toISOString(),
        openedDays:     [],
        totalSpent:     0,
        couponClaimed:  false,
        lastOpenedDate: null
    };
    saveGiftBoxState();
    renderGiftBox();
    updateGiftBadge();
    showToast('🎁 New 10-Day Gift Box cycle started! Day 1 begins now!');
    console.log('[GiftBox] Cycle reset! New cycle started. Day 1/10');
}

// ===================== END UPDATED GIFT BOX SYSTEM =====================
