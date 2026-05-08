// Sri Krishna Hotel - Updated with Gift Box Login Tracking & Floating Button
'use strict';

const MENU_ITEMS = Object.freeze([
    { id: 1,  name: "Chicken Rice",      price: 90,  category: "Rice",        image: "chickenrice.webp"},
    { id: 2,  name: "Egg Rice",          price: 80,  category: "Rice",        image: "eggrice.webp" },
    { id: 3,  name: "Veg Rice",          price: 70,  category: "Rice",        image: "vegrice.webp" },
    { id: 4,  name: "Idly",              price: 10,  category: "Tiffin",      image: "idly .webp" },
    { id: 5,  name: "Vada",              price: 10,  category: "Tiffin",      image: "vada.webp" },
    { id: 6,  name: "Dosa",              price: 20,  category: "Tiffin",      image: "dosa.webp" },
    { id: 7,  name: "Plain Dosa",        price: 50,  category: "Tiffin",      image: "plain dosa .webp" },
    { id: 8,  name: "Set Dosa",          price: 50,  category: "Tiffin",      image: "set dosa.webp"},
    { id: 9,  name: "Masala Dosa",       price: 70,  category: "Tiffin",      image: "masal dosa.webp",  },
    { id: 10, name: "Poori",             price: 40,  category: "Tiffin",      image: "poori.webp" },
    { id: 11, name: "Chicken Biryani",   price: 90,  category: "Biryani",     image: "chicken-biryani.webp"},
    { id: 12, name: "Egg Biryani",       price: 80,  category: "Biryani",     image: "eggbiryani.webp" },
    { id: 13, name: "Veg Biryani",       price: 70,  category: "Biryani",     image: "vegbiryani.webp" },
    { id: 14, name: "Veg Meals",         price: 80,  category: "Meals",       image: "veg meals.webp" },
    { id: 15, name: "Non Veg Meals",     price: 120, category: "Meals",       image: "non veg meals.webp" },
    { id: 16, name: "Fish Meals",        price: 140, category: "Meals",       image: "fish meals.webp" },
    { id: 17, name: "Bread",             price: 20,  category: "Bread Items", image: "bread.webp" },
    { id: 18, name: "Veg Sandwich",      price: 80,  category: "Bread Items", image: "Veg sandwich .webp" },
    { id: 19, name: "Chicken Sandwich",  price: 120, category: "Bread Items", image: "chicken sandwich .webp" },
    { id: 20, name: "Omelette",          price: 20,  category: "Egg Items",   image: "Omelette .webp"},
    { id: 21, name: "Half Boil",         price: 20,  category: "Egg Items",   image: "half boil.webp" },
    { id: 22, name: "Boiled Egg",        price: 20,  category: "Egg Items",   image: "Boiled egg.webp" },
    { id: 23, name: "Chicken 100g",      price: 40,  category: "Chicken",     image: "chicken 100g.webp"},
    { id: 24, name: "Chicken 1kg",       price: 400, category: "Chicken",     image: "chicken 40g.webp" },
    { id: 25, name: "Chicken Noodles",   price: 90,  category: "Noodles",     image: "chickennoodles.webp" },
    { id: 26, name: "Veg Noodles",       price: 60,  category: "Noodles",     image: "veg noodles.webp" },
    { id: 27, name: "Egg Noodles",       price: 80,  category: "Noodles",     image: "eggnoodles.webp" }
]);

const HOTEL_NAME = "Sri Krishna Hotel";
const PHONE_NUMBER = "98433 36980";
const WHATSAPP_NUMBER = "919843336980";
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
    CYCLE_DAYS: 10,
    MIN_SPEND: 1000,
    COUPON_VALUE: 100,
    STORAGE_KEY: 'sriKrishnaGiftBox',
    COUPON_STORAGE: 'sriKrishnaCoupons',
    USER_KEY: 'sriKrishnaUser'
});

let cart = [], currentCategory = 'all', searchQuery = '', paymentStatus = 'cash';
let currentSlide = 0, selectedUpiApp = null, lastGeneratedBill = null;
let heroSliderInterval = null, searchDebounceTimer = null, imgObserver = null, upiGridRendered = false;
let giftBoxState = null;
let giftBoxVisible = false;

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
    // Initialize gift box with login tracking
    setTimeout(initGiftBoxWithLogin, 300);
}

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

function saveCart() {
    safeJSONSet('sriKrishnaCart', cart);
}

// ===================== GIFT BOX LOGIN TRACKING =====================

function initGiftBoxWithLogin() {
    // Check if user has number login already
    const userPhone = safeJSONParse('giftUserPhone', null);
    
    if (userPhone) {
        // User already logged in - silently load gift data (no popup on page load)
        loadUserGiftData(userPhone);
    }
    // If no phone, do nothing on init - wait for gift button click
    updateGiftBadge();
}

function showGiftPhoneLoginModal() {
    // Remove existing modal if any
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
            <button id="gift-phone-cancel" style="width:100%;padding:12px;background:#f5f5f5;color:#666;border-radius:50px;font-weight:600;font-size:0.95rem;border:none;cursor:pointer;margin-top:-8px;">✕ Cancel</button>
            <p class="gift-info-text">You need ₹1000+ spent to unlock gifts</p>
        </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#gift-phone-input');
    const btn = modal.querySelector('#gift-phone-submit');
    const cancelBtn = modal.querySelector('#gift-phone-cancel');

    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    btn.addEventListener('click', () => {
        const phone = input.value.trim();
        
        // Validate phone - must be 10 digits starting with 6-9
        if (!/^[6-9]\d{9}$/.test(phone)) {
            showToast('Please enter valid 10-digit mobile number (start with 6-9)');
            return;
        }

        // Show loading state
        btn.disabled = true;
        btn.textContent = '🔍 Firebase Check...';

        // Database lookup (Firebase + Local fallback)
        verifyUserPhoneAndSetupGifts(phone, modal);
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btn.click();
    });

    // Auto focus input
    setTimeout(() => input.focus(), 100);
}

async function verifyUserPhoneAndSetupGifts(phone, modal) {
    const btn = modal.querySelector('#gift-phone-submit');
    
    // ✅ FIX: Firebase-ல check பண்றோம் - hardcode இல்ல
    try {
        let userData = null;

        // Firebase available-ஆ check பண்று
        const db = await (typeof window.initFirebase === 'function' ? window.initFirebase() : null);
        
        if (db) {
            // Firebase-ல orders collection-ல phone number search பண்று
            try {
                const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                const q = query(collection(db, "orders"), where("customerMobile", "==", phone));
                const snapshot = await getDocs(q);
                
                let totalSpent = 0;
                let customerName = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    totalSpent += (data.totalAmount || 0);
                    if (!customerName) customerName = data.customerName || '';
                });
                
                if (snapshot.size > 0) {
                    userData = {
                        name: customerName || 'Customer',
                        totalSpent: totalSpent,
                        eligible: totalSpent >= GIFT_CONFIG.MIN_SPEND
                    };
                }
            } catch(e) {
                console.error('[Gift] Firebase query error:', e);
                // Firebase query fail ஆனா localStorage orders check பண்று
                userData = checkLocalOrders(phone);
            }
        } else {
            // Firebase இல்லைன்னா local orders check
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
        // Error-ல local check
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

// ✅ Local orders-ல phone number check பண்ற helper
function checkLocalOrders(phone) {
    try {
        const orders = safeJSONParse('sriKrishnaOrders', []);
        const userOrders = orders.filter(o => o.customerMobile === phone);
        if (!userOrders.length) return null;
        const totalSpent = userOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const name = userOrders[0].customerName || 'Customer';
        return { name, totalSpent, eligible: totalSpent >= GIFT_CONFIG.MIN_SPEND };
    } catch { return null; }
}

function showRewardStatusCard(user, phone) {
    // Remove any existing card
    const existing = document.getElementById('reward-status-card');
    if (existing) existing.remove();

    const isEligible = user.totalSpent >= 1000;
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
                    <span class="reward-stat-value">${isEligible ? '✅' : `₹${Math.max(0, 1000 - user.totalSpent)}`}</span>
                    <span class="reward-stat-label">${isEligible ? 'Eligible!' : 'More Needed'}</span>
                </div>
            </div>
            <p class="reward-card-msg">${isEligible ? '🎁 You can claim your daily gift boxes now!' : `Spend ₹${Math.max(0, 1000 - user.totalSpent)} more to unlock gift rewards`}</p>
            <button class="reward-card-open-btn" id="reward-open-gifts">
                <i class="fas fa-gift"></i> ${isEligible ? 'Open Gift Box' : 'View Gifts'}
            </button>
            <button class="reward-card-close-btn" id="reward-card-close">Close</button>
        </div>
    `;
    document.body.appendChild(card);
    document.body.style.overflow = 'hidden';

    const closeCard = () => {
        card.remove();
        document.body.style.overflow = '';
    };

    document.getElementById('reward-card-cancel').addEventListener('click', closeCard);
    document.getElementById('reward-card-close').addEventListener('click', closeCard);
    card.addEventListener('click', (e) => { if (e.target === card) closeCard(); });

    document.getElementById('reward-open-gifts').addEventListener('click', () => {
        closeCard();
        // Open gift box
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
    // Reset submit button
    const btn = modal.querySelector('#gift-phone-submit');
    if (btn) { btn.disabled = false; btn.textContent = 'Check My Rewards'; }

    // Show inline message in modal
    const existing = modal.querySelector('.not-eligible-msg');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = 'not-eligible-msg';
    msg.style.cssText = 'background:#fff3e0;border:1.5px solid #ff9800;border-radius:10px;padding:12px;margin-top:10px;font-size:0.88rem;color:#bf360c;font-weight:600;text-align:center;';
    msg.innerHTML = user
        ? `⚠️ Need ₹${Math.max(0, 1000 - user.totalSpent)} more to unlock gifts<br><small style="font-weight:400;color:#666">Current: ₹${user.totalSpent} of ₹1000</small>`
        : `❌ Phone number not found in our records<br><small style="font-weight:400;color:#666">Try ordering with this number first</small>`;
    modal.querySelector('.gift-phone-login-container').appendChild(msg);
}

function loadUserGiftData(phone) {
    const userName = safeJSONParse('giftUserName', 'User');
    const totalSpent = safeJSONParse('giftUserSpent', 0);
    
    // Initialize gift box state
    const userData = {
        phone: phone,
        name: userName,
        totalSpent: totalSpent,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString()
    };
    safeJSONSet(GIFT_CONFIG.USER_KEY, userData);

    // Load or create gift box state
    loadGiftBoxState();
    updateGiftBadge();
    renderGiftBox();
    
    console.log(`[GiftBox] Logged in: ${userName} | Phone: ${phone} | Spent: ₹${totalSpent}`);
}

function updateGiftBadge() {
    const badge = document.getElementById('gift-badge');
    if (!badge || !giftBoxState) return;

    const currentDay = getCurrentDay();
    const canOpen = canOpenToday();

    if (canOpen) {
        badge.textContent = '!';
        badge.style.background = '#dc3545';
    } else if (checkCouponEligibility()) {
        badge.textContent = '✓';
        badge.style.background = '#28a745';
    } else {
        badge.textContent = currentDay;
        badge.style.background = '#6c757d';
    }
}

function toggleGiftBox() {
    const userPhone = safeJSONParse('giftUserPhone', null);

    if (!userPhone) {
        // Not logged in yet - show phone login modal on button click
        showGiftPhoneLoginModal();
        return;
    }

    const wrapper = document.getElementById('gift-box-wrapper');
    if (!wrapper) return;

    giftBoxVisible = !giftBoxVisible;

    if (giftBoxVisible) {
        wrapper.classList.add('show');
        // Scroll to gift box
        setTimeout(() => {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else {
        wrapper.classList.remove('show');
    }

    // Re-render to update state
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
        const imgAttr = eager ? `src="${item.image}"` : `src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${item.image}"`;
        // ✅ FIX: Image fail ஆனா emoji fallback காட்டும் - blank space இல்ல
        const onErr = `this.onerror=null;this.style.display='none';this.parentElement.querySelector('.img-emoji-fallback').style.display='flex'`;
        parts.push(`<div class="product-card" data-id="${item.id}"><div class="product-image"><img ${imgAttr} alt="${item.name}" loading="${eager ? 'eager' : 'lazy'}" width="400" height="225" decoding="async" onerror="${onErr}" onload="this.classList.add('loaded')"><div class="img-emoji-fallback" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;font-size:3.5rem;background:linear-gradient(135deg,#fff3e0,#ffe0b2)">${item.emoji}</div><span class="product-badge">${item.category}</span></div><div class="product-info"><h3 class="product-name">${item.name}</h3><p class="product-price">Rs.${item.price}</p><div class="product-actions"><div class="quantity-control"><button class="qty-btn minus" data-id="${item.id}" ${qty <= 0 ? 'disabled' : ''}>-</button><span class="qty-value">${qty}</span><button class="qty-btn plus" data-id="${item.id}">+</button></div><button class="btn-add-cart ${qty > 0 ? 'added' : ''}" data-id="${item.id}"><i class="fas ${qty > 0 ? 'fa-check' : 'fa-cart-plus'}"></i><span>${qty > 0 ? 'Added' : 'Add'}</span></button></div></div></div>`);
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
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const stickyCart = document.getElementById('sticky-cart');
    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = 'Rs.' + totalAmount;
    if (stickyCart) stickyCart.style.display = totalItems > 0 ? 'block' : 'none';
    updateQrAmount();
    const drawer = document.getElementById('cart-drawer');
    if (!drawer || !drawer.classList.contains('open')) return;
    _rebuildCartItemsHTML(totalAmount);
}

function _rebuildCartItemsHTML(totalAmount) {
    const emptyCart = document.getElementById('empty-cart');
    const cartItemsEl = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-drawer-footer');
    if (!cart.length) {
        if (emptyCart) emptyCart.style.display = 'flex';
        if (cartItemsEl) cartItemsEl.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartItemsEl) cartItemsEl.style.display = 'block';
    if (cartFooter) cartFooter.style.display = 'block';
    const parts = cart.map(item => {
        const menuItem = MENU_ITEMS.find(m => m.id === item.id);
        const emoji = menuItem ? menuItem.emoji : '🍽️';
        return `<div class="cart-item"><div style="width:48px;height:48px;border-radius:8px;background:linear-gradient(135deg,#ff9800,#e65100);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">${emoji}</div><div class="cart-item-details"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">Rs.${item.price} each</div></div><div class="cart-item-qty"><button data-action="decrease" data-id="${item.id}"><i class="fas fa-minus"></i></button><span>${item.quantity}</span><button data-action="increase" data-id="${item.id}"><i class="fas fa-plus"></i></button></div><button class="cart-item-remove" data-action="remove" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></div>`;
    }).join('');
    if (cartItemsEl) cartItemsEl.innerHTML = parts;
    const subtotal = document.getElementById('cart-subtotal');
    const grandTotal = document.getElementById('cart-grand-total');
    if (subtotal) subtotal.textContent = 'Rs.' + totalAmount;
    if (grandTotal) grandTotal.textContent = 'Rs.' + totalAmount;
}

function updateCardUI(id) {
    const menuContainer = document.getElementById('menu-container');
    const card = menuContainer.querySelector(`.product-card[data-id="${id}"]`);
    if (!card) return;
    const qty = cart.find(c => c.id === id)?.quantity || 0;
    const minus = card.querySelector('.qty-btn.minus');
    const qtyVal = card.querySelector('.qty-value');
    const addBtn = card.querySelector('.btn-add-cart');
    if (minus) minus.disabled = qty <= 0;
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

let toastTimer = null;
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function startHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
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
    document.querySelectorAll('.upi-app-btn').forEach(btn => btn.classList.toggle('selected', btn.dataset.app === appId));
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
    }
    else { showToast('Please open on mobile or scan QR'); }
    document.getElementById('qr-payment-section').style.display = 'block';
    // ✅ FIX: UPI app திறந்த பிறகும் confirm வரும் - paymentStatus = 'upi_initiated' மட்டும்
    updatePaymentStatus('upi_initiated');
    paymentStatus = 'upi_initiated';
    document.getElementById('btn-submit-order').disabled = false;
}

function updatePaymentStatus(status) {
    const el = document.getElementById('payment-status');
    if (!el) return;
    const map = { 
        paid: '<span class="status-paid">✅ Payment Confirmed! Submit Order now</span>', 
        upi_initiated: '<span class="status-upi-initiated">⏳ UPI App திறந்தது - Pay பண்ணி திரும்பி வந்து Submit பண்ணுங்க</span>',
        pending: '<span class="status-pending">Select a UPI App to enable payment</span>', 
        cash: '<span class="status-cash">Cash on Delivery</span>' 
    };
    el.innerHTML = map[status] || '';
}

function updateQrAmount() {
    const el = document.getElementById('qr-display-amount');
    if (el) el.textContent = getTotal();
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
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');
    if (searchToggle) searchToggle.addEventListener('click', () => document.getElementById('search-bar').classList.toggle('active'));
    if (searchClose) searchClose.addEventListener('click', function() { document.getElementById('search-bar').classList.remove('active'); if (searchInput) searchInput.value = ''; searchQuery = ''; renderMenu(); });
    if (searchInput) searchInput.addEventListener('input', function() { const val = this.value; clearTimeout(searchDebounceTimer); searchDebounceTimer = setTimeout(() => { searchQuery = val; renderMenu(); }, 120); });
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
    if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    const cartBtn = document.getElementById('cart-btn');
    const cartClose = document.getElementById('cart-close');
    const cartOverlay = document.getElementById('cart-overlay');
    const btnContinue = document.getElementById('btn-continue');
    const btnPlaceOrder = document.getElementById('btn-place-order');
    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    if (btnContinue) btnContinue.addEventListener('click', closeCart);
    if (btnPlaceOrder) btnPlaceOrder.addEventListener('click', function() { closeCart(); updateQrAmount(); openOrderModal(); });
    const orderModalClose = document.getElementById('order-modal-close');
    const orderModalOverlay = document.getElementById('order-modal-overlay');
    if (orderModalClose) orderModalClose.addEventListener('click', closeOrderModal);
    if (orderModalOverlay) orderModalOverlay.addEventListener('click', closeOrderModal);
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            selectedUpiApp = null;
            document.querySelectorAll('.upi-app-btn').forEach(btn => btn.classList.remove('selected'));
            if (this.value === 'online') {
                document.getElementById('online-payment-section').style.display = 'block';
                document.getElementById('cash-payment-section').style.display = 'none';
                document.getElementById('qr-payment-section').style.display = 'none';
                // ✅ FIX: Online select ஆனா உடனே paid ஆகாது - UPI app select பண்ணணும்
                paymentStatus = 'pending';
                updatePaymentStatus('pending');
                document.getElementById('btn-submit-order').disabled = false;
            } else {
                document.getElementById('online-payment-section').style.display = 'none';
                document.getElementById('cash-payment-section').style.display = 'block';
                document.getElementById('qr-payment-section').style.display = 'none';
                paymentStatus = 'cash';
                document.getElementById('btn-submit-order').disabled = false;
                updatePaymentStatus('cash');
            }
        });
    });
    const upiAppGrid = document.getElementById('upi-app-grid');
    if (upiAppGrid) upiAppGrid.addEventListener('click', function(e) { const btn = e.target.closest('.upi-app-btn'); if (btn) handleUpiAppClick(btn.dataset.app); });
    const btnCopyUpi = document.getElementById('btn-copy-upi');
    if (btnCopyUpi) btnCopyUpi.addEventListener('click', copyUpiId);
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', function(e) { e.preventDefault(); submitOrder(); });
    const btnNewOrder = document.getElementById('btn-new-order');
    if (btnNewOrder) btnNewOrder.addEventListener('click', function() { closeSuccessModal(); clearCart(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    const dlBtn = document.getElementById('btn-download-bill');
    if (dlBtn) dlBtn.addEventListener('click', () => { if (lastGeneratedBill) generateBillPDF(lastGeneratedBill, 'download'); });
    const mobileViewOrders = document.getElementById('mobile-view-orders');
    const footerHistory = document.getElementById('footer-history');
    const historyModalClose = document.getElementById('history-modal-close');
    const historyModalOverlay = document.getElementById('history-modal-overlay');
    if (mobileViewOrders) mobileViewOrders.addEventListener('click', function(e) { e.preventDefault(); closeMobileMenu(); openHistoryModal(); });
    if (footerHistory) footerHistory.addEventListener('click', function(e) { e.preventDefault(); openHistoryModal(); });
    if (historyModalClose) historyModalClose.addEventListener('click', closeHistoryModal);
    if (historyModalOverlay) historyModalOverlay.addEventListener('click', closeHistoryModal);
    const mobileContact = document.getElementById('mobile-contact');
    const footerContact = document.getElementById('footer-contact');
    const contactModalClose = document.getElementById('contact-modal-close');
    const contactModalOverlay = document.getElementById('contact-modal-overlay');
    if (mobileContact) mobileContact.addEventListener('click', function(e) { e.preventDefault(); closeMobileMenu(); openContactModal(); });
    if (footerContact) footerContact.addEventListener('click', function(e) { e.preventDefault(); openContactModal(); });
    if (contactModalClose) contactModalClose.addEventListener('click', closeContactModal);
    if (contactModalOverlay) contactModalOverlay.addEventListener('click', closeContactModal);
    const customerMobile = document.getElementById('customer-mobile');
    if (customerMobile) customerMobile.addEventListener('input', function() { this.value = this.value.replace(/\D/g, '').slice(0, 10); });

    // Floating gift box button
    const giftFloatBtn = document.getElementById('gift-float-btn');
    if (giftFloatBtn) {
        giftFloatBtn.addEventListener('click', toggleGiftBox);
    }

    // ESCAPE KEY SUPPORT - Close modals with Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            // Close order modal
            const orderModal = document.getElementById('order-modal');
            if (orderModal && orderModal.classList.contains('open')) {
                closeOrderModal();
                return;
            }
            
            // Close cart
            const cartDrawer = document.getElementById('cart-drawer');
            if (cartDrawer && cartDrawer.classList.contains('open')) {
                closeCart();
                return;
            }
            
            // Close mobile menu
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && mobileMenu.classList.contains('open')) {
                closeMobileMenu();
                return;
            }
            
            // Close search bar
            const searchBar = document.getElementById('search-bar');
            if (searchBar && searchBar.classList.contains('active')) {
                searchBar.classList.remove('active');
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                searchQuery = '';
                renderMenu();
                return;
            }
        }
    });
}

// ===================== MODAL CONTROLS =====================

function openCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    _rebuildCartItemsHTML(getTotal());
}
function closeCart() { document.getElementById('cart-drawer')?.classList.remove('open'); document.getElementById('cart-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }
function openMobileMenu() { document.getElementById('mobile-menu')?.classList.add('open'); document.getElementById('mobile-menu-overlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeMobileMenu() { document.getElementById('mobile-menu')?.classList.remove('open'); document.getElementById('mobile-menu-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }
function closeOrderModal() { 
    const modal = document.getElementById('order-modal');
    const overlay = document.getElementById('order-modal-overlay');
    const form = document.getElementById('order-form');
    
    if (modal) modal.classList.remove('open'); 
    if (overlay) overlay.classList.remove('open');
    
    // Clear form fields
    if (form) {
        form.reset();
        form.querySelectorAll('input, textarea').forEach(el => {
            el.value = '';
            el.blur();
        });
    }
    
    // Reset payment status
    paymentStatus = 'cash';
    document.querySelectorAll('.upi-app-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('qr-payment-section').style.display = 'none';
    
    document.body.style.overflow = '';
}
function openSuccessModal() { document.getElementById('success-modal')?.classList.add('open'); document.getElementById('success-modal-overlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeSuccessModal() { document.getElementById('success-modal')?.classList.remove('open'); document.getElementById('success-modal-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }
function openHistoryModal() { renderOrderHistory(); document.getElementById('history-modal')?.classList.add('open'); document.getElementById('history-modal-overlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeHistoryModal() { document.getElementById('history-modal')?.classList.remove('open'); document.getElementById('history-modal-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }
function openContactModal() { document.getElementById('contact-modal')?.classList.add('open'); document.getElementById('contact-modal-overlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeContactModal() { document.getElementById('contact-modal')?.classList.remove('open'); document.getElementById('contact-modal-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }

function openOrderModal() {
    renderUpiAppGrid();
    document.getElementById('order-modal')?.classList.add('open');
    document.getElementById('order-modal-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    const form = document.getElementById('order-form');
    if (form) form.reset();
    const cashRadio = document.querySelector('input[name="payment-method"][value="cash"]');
    if (cashRadio) cashRadio.checked = true;
    document.getElementById('online-payment-section').style.display = 'none';
    document.getElementById('cash-payment-section').style.display = 'block';
    document.getElementById('qr-payment-section').style.display = 'none';
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
    const name = document.getElementById('customer-name').value.trim();
    const mobile = document.getElementById('customer-mobile').value.trim();
    const table = document.getElementById('table-number').value.trim();
    const notes = document.getElementById('order-notes').value.trim();
    const method = document.querySelector('input[name="payment-method"]:checked')?.value || 'cash';
    
    // SECURITY: Validate all inputs
    if (!name || !mobile || !table) { 
        showToast('Please fill all required fields'); 
        return; 
    }
    
    // SECURITY: Validate phone number format (10 digits, starts with 6-9)
    if (!/^[6-9]\d{9}$/.test(mobile)) { 
        showToast('Enter valid 10-digit mobile number (start with 6-9)'); 
        return; 
    }
    
    // SECURITY: Validate customer name (min 3 chars, no special chars)
    if (name.length < 3 || !/^[a-zA-Z\s]+$/.test(name)) {
        showToast('Enter valid customer name (letters only, min 3 chars)');
        return;
    }
    
    // SECURITY: Validate table number
    if (!/^\d+$/.test(table) || table < 1 || table > 100) {
        showToast('Enter valid table number (1-100)');
        return;
    }
    
    // SECURITY: Validate payment method - require UPI app selection for online
    if (method === 'online') {
        if (!selectedUpiApp) {
            showToast('Please select a UPI app first!');
            return;
        }
        if (paymentStatus !== 'upi_initiated') {
            showToast('UPI app-ஐ click பண்ணி payment பண்ணுங்க!');
            return;
        }
        // ✅ FIX: Payment confirm பண்ணணும்
        const confirmed = confirm('UPI payment complete ஆச்சா?\n\nOK = Payment பண்ணாச்சு, Submit பண்ற\nCancel = இல்ல, திரும்பி payment பண்றேன்');
        if (!confirmed) return;
        paymentStatus = 'paid';
    }

    // SECURITY: Check cart not empty
    if (cart.length === 0) {
        showToast('Cart is empty');
        return;
    }

    // SECURITY: Verify amount
    const totalAmount = getTotal();
    if (totalAmount <= 0 || !isFinite(totalAmount)) {
        showToast('Invalid order amount');
        return;
    }

    const now = new Date();
    const order = {
        id: 'ORD' + Date.now(),
        customerName: name,
        customerMobile: mobile,
        tableNumber: table,
        notes: notes,
        paymentMethod: method,
        paymentStatus: method === 'cash' ? 'Cash' : 'Paid (Online)',
        items: [...cart],
        totalAmount: totalAmount,
        date: now.toLocaleDateString('en-IN'),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.getTime(),
        // SECURITY: Add verification timestamp
        processedAt: now.toISOString(),
        // SECURITY: Add order hash for verification
        orderHash: generateOrderHash(name, mobile, totalAmount)
    };

    // Save to history
    saveOrderToHistory(order);
    lastGeneratedBill = order;

    // Firebase save
    console.log('Attempting Firebase save...');
    if (typeof window.saveOrderToFirestore === 'function') {
        window.saveOrderToFirestore(order).then(function(firestoreId) {
            if (firestoreId) {
                console.log('SUCCESS! Order saved to Firebase. ID:', firestoreId);
                showToast('Order saved to cloud!');
            } else {
                console.warn('Firebase returned null - check rules');
                showToast('Order saved locally');
            }
        }).catch(function(err) {
            console.error('Firebase save failed:', err);
            showToast('Saved locally (cloud failed)');
        });
    } else {
        console.warn('saveOrderToFirestore not available');
        showToast('Saved locally only');
    }

    // Tracking (background)
    if (typeof window.saveOrder === 'function') {
        window.saveOrder({
            orderId: order.id,
            phone: mobile,
            amount: order.totalAmount,
            customerName: name,
            tableNumber: table,
            paymentMethod: method,
            notes: notes,
            items: order.items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        }).catch(err => console.error('Tracking error:', err));
    }

    // Update gift box spend tracking
    updateSpendTracking(order.totalAmount);

    // Generate bill & WhatsApp
    generateBillPDF(order, 'whatsapp').catch(err => {
        console.error('PDF error:', err);
        sendWhatsAppText(order);
    });

    closeOrderModal();
    openSuccessModal();
}

// SECURITY: Generate order hash for verification
function generateOrderHash(name, mobile, amount) {
    // Simple hash using name + mobile + amount + secret
    const secret = 'SriKrishnaHotel2024';
    const str = name + mobile + amount + secret;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

// ===================== PDF & WHATSAPP =====================

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
    doc.text('Table No : ' + order.tableNumber, L, y); y += 6;
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
                navigator.share({ title: 'Sri Krishna Hotel - Bill ' + order.id, text: buildWhatsAppText(order), files: [file] }).then(() => showToast('Bill shared!')).catch(() => downloadPDFAndOpenWhatsApp(order, pdfDataUri));
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
    return `*${HOTEL_NAME.toUpperCase()}*\n\nOrder: ${order.id}\nDate: ${order.date} ${order.time}\n\nCustomer: ${order.customerName}\nTable: ${order.tableNumber}\n\nItems:\n${items}\n\nTotal: Rs.${order.totalAmount}\nPayment: ${order.paymentStatus}${order.notes ? '\nNotes: ' + order.notes : ''}\n\nThank you! Visit again.`;
}

function buildWhatsAppMessageEncoded(order) { return encodeURIComponent(buildWhatsAppText(order)); }
function sendWhatsAppText(order) { window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + buildWhatsAppMessageEncoded(order), '_blank'); }

// ===================== ORDER HISTORY =====================

function saveOrderToHistory(order) {
    try {
        let h = safeJSONParse('sriKrishnaOrders', []);
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
        container.innerHTML = history.map(o => `<div class="history-item"><div class="history-item-header"><h4>${o.customerName} - Table ${o.tableNumber}</h4><span class="history-item-date">${o.date} ${o.time}</span></div><div class="history-item-details">${o.items.map(i => i.name + ' x' + i.quantity).join(', ')}</div><div class="history-item-total">Rs.${o.totalAmount} - ${o.paymentStatus}</div></div>`).join('');
    } catch { container.innerHTML = '<div class="empty-history"><i class="fas fa-clipboard-list"></i><p>No orders yet</p></div>'; }
}

// ===================== GIFT BOX SYSTEM =====================

function loadGiftBoxState() {
    giftBoxState = safeJSONParse(GIFT_CONFIG.STORAGE_KEY, null);
    if (giftBoxState) {
        const now = new Date();
        const lastDate = new Date(giftBoxState.cycleStartDate);
        const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= GIFT_CONFIG.CYCLE_DAYS) {
            giftBoxState = createNewCycle();
        }
    } else {
        giftBoxState = createNewCycle();
    }
    saveGiftBoxState();
    return giftBoxState;
}

function createNewCycle() {
    return {
        cycleStartDate: new Date().toISOString(),
        openedDays: [],
        totalSpent: 0,
        couponClaimed: false,
        lastOpenedDate: null
    };
}

function saveGiftBoxState() {
    safeJSONSet(GIFT_CONFIG.STORAGE_KEY, giftBoxState);
}

function getCurrentDay() {
    const now = new Date();
    const start = new Date(giftBoxState.cycleStartDate);
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.min(diff + 1, GIFT_CONFIG.CYCLE_DAYS);
}

function canOpenToday() {
    const today = getCurrentDay();
    if (today > GIFT_CONFIG.CYCLE_DAYS) return false;
    if (giftBoxState.openedDays.includes(today)) return false;
    const lastOpened = giftBoxState.openedDays.length > 0 ? Math.max(...giftBoxState.openedDays) : 0;
    return today > lastOpened;
}

function updateSpendTracking(amount) {
    if (!giftBoxState) loadGiftBoxState();
    giftBoxState.totalSpent += amount;
    saveGiftBoxState();
    renderGiftBox();
    updateGiftBadge();
}

function checkCouponEligibility() {
    return giftBoxState.totalSpent >= GIFT_CONFIG.MIN_SPEND
        && giftBoxState.openedDays.length >= GIFT_CONFIG.CYCLE_DAYS
        && !giftBoxState.couponClaimed;
}

function renderGiftBox() {
    const container = document.getElementById('gift-box-container');
    if (!container) return;
    if (!giftBoxState) loadGiftBoxState();
    const currentDay = getCurrentDay();
    const canOpen = canOpenToday();
    const isEligible = checkCouponEligibility();

    let html = `<div class="gift-box-section"><div class="gift-box-header"><i class="fas fa-gift"></i><h3>Daily Gift Box</h3><span class="gift-progress">Day ${currentDay}/10</span></div><div class="gift-box-grid">`;

    for (let i = 1; i <= GIFT_CONFIG.CYCLE_DAYS; i++) {
        const isOpened = giftBoxState.openedDays.includes(i);
        const isToday = i === currentDay;
        const isPast = i < currentDay && !isOpened;
        let statusClass = '', icon = '';
        if (isOpened) { statusClass = 'opened'; icon = '<i class="fas fa-check"></i>'; }
        else if (isToday && canOpen) { statusClass = 'active pulse'; icon = '<i class="fas fa-gift"></i>'; }
        else if (isPast) { statusClass = 'missed'; icon = '<i class="fas fa-times"></i>'; }
        else { statusClass = 'locked'; icon = '<i class="fas fa-lock"></i>'; }
        html += `<div class="gift-box-day ${statusClass}" data-day="${i}"><div class="gift-box-icon">${icon}</div><span class="gift-day-num">Day ${i}</span></div>`;
    }

    html += `</div>`;
    const progress = (giftBoxState.openedDays.length / GIFT_CONFIG.CYCLE_DAYS) * 100;
    html += `<div class="gift-progress-bar"><div class="gift-progress-fill" style="width: ${progress}%"></div></div><div class="gift-status-text">${getGiftStatusText()}</div>`;

    if (isEligible) {
        html += `<div class="coupon-section"><div class="coupon-banner"><i class="fas fa-ticket-alt"></i><span>🎉 Congratulations! You unlocked a Rs.${GIFT_CONFIG.COUPON_VALUE} coupon!</span></div><button class="btn-claim-coupon" onclick="openCouponModal()"><i class="fas fa-gift"></i> Claim Your Free Food</button></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.gift-box-day.active').forEach(day => {
        day.addEventListener('click', () => handleGiftBoxClick(parseInt(day.dataset.day)));
    });
}

function getGiftStatusText() {
    const daysLeft = GIFT_CONFIG.CYCLE_DAYS - giftBoxState.openedDays.length;
    const spentNeeded = Math.max(0, GIFT_CONFIG.MIN_SPEND - giftBoxState.totalSpent);
    if (checkCouponEligibility()) return '✅ You\'ve earned a reward! Claim your coupon below.';
    if (daysLeft > 0 && spentNeeded > 0) return `📅 ${daysLeft} days left • Spend Rs.${spentNeeded} more to unlock reward`;
    if (daysLeft > 0) return `📅 ${daysLeft} days left • Keep opening daily!`;
    if (spentNeeded > 0) return `💰 Spend Rs.${spentNeeded} more to unlock your reward`;
    return 'Open today\'s gift box!';
}

function handleGiftBoxClick(day) {
    if (!canOpenToday() || day !== getCurrentDay()) {
        showToast(day < getCurrentDay() ? 'This day has passed!' : 'Come back tomorrow!');
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
        '5% off next order', 'Free delivery', 'Rs.10 cashback', 'Free drink',
        '10% off', 'Buy 1 Get 1', 'Free dessert', 'Rs.20 off', 'Special discount', '🎁 Mystery Box'
    ];
    const reward = rewards[day - 1] || 'Special surprise!';
    const modal = document.createElement('div');
    modal.className = 'gift-reward-modal';
    modal.innerHTML = `<div class="gift-reward-content"><div class="gift-reward-icon">🎁</div><h3>Day ${day} Reward!</h3><p class="gift-reward-text">${reward}</p><button class="btn-gift-ok"><i class="fas fa-check"></i> Awesome!</button></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.btn-gift-ok').addEventListener('click', () => modal.remove());
    setTimeout(() => { if (modal.parentNode) modal.remove(); }, 3000);
}

// ===================== COUPON SYSTEM =====================

function openCouponModal() {
    if (!checkCouponEligibility()) { showToast('Not eligible yet!'); return; }
    const eligibleItems = MENU_ITEMS.filter(item => item.price <= GIFT_CONFIG.COUPON_VALUE);
    const modal = document.createElement('div');
    modal.className = 'coupon-modal-overlay';
    modal.id = 'coupon-modal';
    modal.innerHTML = `<div class="coupon-modal"><div class="coupon-modal-header"><h3><i class="fas fa-ticket-alt"></i> Claim Your Free Food</h3><button class="coupon-close" id="coupon-close-btn"><i class="fas fa-times"></i></button></div><div class="coupon-modal-body"><div class="coupon-info"><i class="fas fa-info-circle"></i><p>You've spent <strong>Rs.${giftBoxState.totalSpent}</strong> over 10 days! Choose any item below <strong>Rs.${GIFT_CONFIG.COUPON_VALUE}</strong> for FREE!</p></div><div class="coupon-items-grid">${eligibleItems.map(item => `<div class="coupon-item-card" data-item-id="${item.id}"><div class="coupon-item-emoji">${item.emoji}</div><div class="coupon-item-name">${item.name}</div><div class="coupon-item-price">Rs.${item.price}</div></div>`).join('')}</div></div></div>`;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    document.getElementById('coupon-close-btn').addEventListener('click', closeCouponModal);
    modal.querySelectorAll('.coupon-item-card').forEach(card => {
        card.addEventListener('click', () => selectCouponItem(parseInt(card.dataset.itemId)));
    });
}

function closeCouponModal() {
    const modal = document.getElementById('coupon-modal');
    if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

async function selectCouponItem(itemId) {
    const item = MENU_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    const phone = document.getElementById('customer-mobile')?.value?.trim() || '';
    if (!phone || phone.length !== 10) {
        showToast('Please enter your 10-digit mobile number first!');
        closeCouponModal();
        openOrderModal();
        return;
    }
    const couponCode = 'SK' + Date.now().toString(36).toUpperCase();
    const coupon = {
        code: couponCode,
        itemId: item.id,
        itemName: item.name,
        itemPrice: item.price,
        phone: phone,
        claimedAt: new Date().toISOString(),
        status: 'claimed'
    };
    saveCoupon(coupon);
    giftBoxState.couponClaimed = true;
    saveGiftBoxState();
    closeCouponModal();
    sendCouponToAdmin(coupon);
    showCouponSuccess(coupon);
    renderGiftBox();
    updateGiftBadge();
}

function saveCoupon(coupon) {
    try {
        let coupons = safeJSONParse(GIFT_CONFIG.COUPON_STORAGE, []);
        coupons.unshift(coupon);
        safeJSONSet(GIFT_CONFIG.COUPON_STORAGE, coupons);
    } catch {}
}

function sendCouponToAdmin(coupon) {
    const message = encodeURIComponent(
        `🎁 *COUPON CLAIMED - Sri Krishna Hotel*\n\n` +
        `Code: *${coupon.code}*\n` +
        `Item: *${coupon.itemName}*\n` +
        `Price: Rs.${coupon.itemPrice}\n` +
        `Customer: ${coupon.phone}\n` +
        `Time: ${new Date().toLocaleString('en-IN')}\n\n` +
        `✅ This is a FREE food coupon. Please prepare the order!`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    showToast('Coupon sent to admin via WhatsApp!');
}

function showCouponSuccess(coupon) {
    const modal = document.createElement('div');
    modal.className = 'coupon-success-overlay';
    modal.innerHTML = `<div class="coupon-success-modal"><div class="coupon-success-icon"><i class="fas fa-check-circle"></i></div><h3>Coupon Claimed!</h3><div class="coupon-code-box"><span class="coupon-code">${coupon.code}</span><button class="btn-copy-code" id="copy-coupon-btn"><i class="fas fa-copy"></i></button></div><p class="coupon-item-name">${coupon.itemName}</p><p class="coupon-hint">Show this code at the counter to get your FREE food!</p><button class="btn-coupon-done" id="coupon-done-btn"><i class="fas fa-check"></i> Done</button></div>`;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    document.getElementById('coupon-done-btn').addEventListener('click', () => {
        modal.remove(); document.body.style.overflow = '';
    });
    document.getElementById('copy-coupon-btn').addEventListener('click', () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(coupon.code).then(() => showToast('Code copied!'));
        } else {
            const ta = document.createElement('textarea');
            ta.value = coupon.code; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
            showToast('Code copied!');
        }
    });
}

// ===================== EXPORTS =====================

window.openCouponModal = openCouponModal;
window.closeCouponModal = closeCouponModal;
window.selectCouponItem = selectCouponItem;
window.handleGiftBoxClick = handleGiftBoxClick;
window.toggleGiftBox = toggleGiftBox;
