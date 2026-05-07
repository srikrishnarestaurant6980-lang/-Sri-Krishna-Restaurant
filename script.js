// Sri Krishna Hotel - Phone Optimized + Firebase Ready
// Ultra-fast mobile experience

const menuItems = [
    { id: 1,  name: "Chicken Rice",      price: 90,  category: "Rice",        image: "chickenrice.webp" },
    { id: 2,  name: "Egg Rice",          price: 80,  category: "Rice",        image: "eggrice.webp" },
    { id: 3,  name: "Veg Rice",          price: 70,  category: "Rice",        image: "vegrice.webp" },
    { id: 4,  name: "Idly",              price: 10,  category: "Tiffin",      image: "idly.webp" },
    { id: 5,  name: "Vada",              price: 10,  category: "Tiffin",      image: "vada.webp" },
    { id: 6,  name: "Dosa",              price: 20,  category: "Tiffin",      image: "dosa.webp" },
    { id: 7,  name: "Plain Dosa",        price: 50,  category: "Tiffin",      image: "plain dosa.webp" },
    { id: 8,  name: "Set Dosa",          price: 50,  category: "Tiffin",      image: "set dosa.webp" },
    { id: 9,  name: "Masala Dosa",       price: 70,  category: "Tiffin",      image: "masal dosa.webp" },
    { id: 10, name: "Poori",             price: 40,  category: "Tiffin",      image: "poori.jpg" },
    { id: 11, name: "Chicken Biryani",   price: 90,  category: "Biryani",     image: "chicken-biryani.webp" },
    { id: 12, name: "Egg Biryani",       price: 80,  category: "Biryani",     image: "eggbiryani.webp" },
    { id: 13, name: "Veg Biryani",       price: 70,  category: "Biryani",     image: "vegbiryani.webp" },
    { id: 14, name: "Veg Meals",         price: 80,  category: "Meals",       image: "veg meals.webp" },
    { id: 15, name: "Non Veg Meals",     price: 120, category: "Meals",       image: "non veg meals.webp" },
    { id: 16, name: "Fish Meals",        price: 140, category: "Meals",       image: "fish meals.webp" },
    { id: 17, name: "Bread",             price: 20,  category: "Bread Items", image: "bread.webp" },
    { id: 18, name: "Veg Sandwich",      price: 80,  category: "Bread Items", image: "Veg sandwich.webp" },
    { id: 19, name: "Chicken Sandwich",  price: 120, category: "Bread Items", image: "chicken sandwich.webp" },
    { id: 20, name: "Omelette",          price: 20,  category: "Egg Items",   image: "Omelette.webp" },
    { id: 21, name: "Half Boil",         price: 20,  category: "Egg Items",   image: "half boil.webp" },
    { id: 22, name: "Boiled Egg",        price: 20,  category: "Egg Items",   image: "Boiled egg.webp" },
    { id: 23, name: "Chicken 100g",      price: 40,  category: "Chicken",     image: "chicken 100g.webp" },
    { id: 24, name: "Chicken 1kg",       price: 400, category: "Chicken",     image: "chicken 40g.webp" },
    { id: 25, name: "Chicken Noodles",   price: 90,  category: "Noodles",     image: "chickennoodles.webp" },
    { id: 26, name: "Veg Noodles",       price: 60,  category: "Noodles",     image: "veg noodles.webp" },
    { id: 27, name: "Egg Noodles",       price: 80,  category: "Noodles",     image: "eggnoodles.webp" }
];

const HOTEL_NAME      = "Sri Krishna Hotel";
const PHONE_NUMBER    = "98433 36980";
const WHATSAPP_NUMBER = "919843336980";
const UPI_ID          = "9843336980@ibl";
const FALLBACK_IMAGE  = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=40&fm=webp";

const UPI_APPS = [
    { id: 'gpay',      name: 'GPay',      icon: 'https://img.icons8.com/color/96/google-pay.png',  color: '#4285F4', pkg: 'com.google.android.apps.nbu.paisa.user' },
    { id: 'phonepe',   name: 'PhonePe',   icon: 'https://img.icons8.com/color/96/phone-pe.png',    color: '#5f259f', pkg: 'com.phonepe.app' },
    { id: 'paytm',     name: 'Paytm',     icon: 'https://img.icons8.com/color/96/paytm.png',       color: '#00b9f1', pkg: 'net.one97.paytm' },
    { id: 'bhim',      name: 'BHIM',      icon: 'https://img.icons8.com/color/96/bhim.png',        color: '#00a651', pkg: 'in.org.npci.upiapp' },
    { id: 'amazonpay', name: 'Amazon',    icon: 'https://img.icons8.com/color/96/amazon.png',      color: '#FF9900', pkg: 'in.amazon.mShop.android.shopping' },
    { id: 'other',     name: 'Other UPI', icon: null,                                               color: '#607d8b', pkg: null }
];

// ===== State =====
let cart = [];
let currentCategory = 'all';
let searchQuery = '';
let paymentStatus = 'cash';
let currentSlide = 0;
let selectedUpiApp = null;
let lastGeneratedBill = null;
let heroSliderInterval = null;
let searchDebounceTimer = null;
let imgObserver = null;
let upiGridRendered = false;

// ===== Fast Init =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    loadCart();
    setupImgObserver();
    setupEventListeners();
    requestAnimationFrame(() => {
        renderMenu();
        updateCartDisplay();
    });
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 50));
    idle(() => startHeroSlider());
}

// ===== Image Observer =====
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

// ===== Storage =====
function loadCart() {
    try {
        const saved = localStorage.getItem('sriKrishnaCart');
        cart = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(cart)) cart = [];
    } catch { cart = []; }
}

function saveCart() {
    try { localStorage.setItem('sriKrishnaCart', JSON.stringify(cart)); } catch {}
}

// ===== Render Menu =====
function renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    let items = menuItems;
    const q = searchQuery.trim().toLowerCase();
    if (currentCategory !== 'all') items = items.filter(i => i.category === currentCategory);
    if (q) items = items.filter(i => i.name.toLowerCase().includes(q));

    if (!items.length) {
        menuContainer.innerHTML = `
            <div class="empty-cart" style="grid-column:1/-1;padding:50px 20px;text-align:center">
                <i class="fas fa-search" style="font-size:2.5rem;color:#ccc"></i>
                <p style="margin-top:14px;font-weight:600;font-size:1rem">No items found</p>
                <span style="color:#888;font-size:0.9rem">Try a different search or category</span>
            </div>`;
        return;
    }

    const qtyMap = new Map(cart.map(c => [c.id, c.quantity]));
    const parts = [];

    items.forEach((item, idx) => {
        const qty = qtyMap.get(item.id) || 0;
        const eager = idx < 2;
        const imgAttr = eager
            ? `src="${item.image}"`
            : `src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${item.image}"`;

        parts.push(`
        <div class="product-card" data-id="${item.id}">
            <div class="product-image">
                <img ${imgAttr} alt="${item.name}" loading="${eager ? 'eager' : 'lazy'}" width="400" height="225" decoding="async"
                    onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';this.classList.add('loaded')"
                    onload="this.classList.add('loaded')">
                <span class="product-badge">${item.category}</span>
            </div>
            <div class="product-info">
                <h3 class="product-name">${item.name}</h3>
                <p class="product-price">₹${item.price}</p>
                <div class="product-actions">
                    <div class="quantity-control">
                        <button class="qty-btn minus" data-id="${item.id}" ${qty <= 0 ? 'disabled' : ''}>-</button>
                        <span class="qty-value">${qty}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="btn-add-cart ${qty > 0 ? 'added' : ''}" data-id="${item.id}">
                        <i class="fas ${qty > 0 ? 'fa-check' : 'fa-cart-plus'}"></i>
                        <span>${qty > 0 ? 'Added' : 'Add'}</span>
                    </button>
                </div>
            </div>
        </div>`);
    });

    menuContainer.innerHTML = parts.join('');
    if (imgObserver) {
        menuContainer.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
    }
}

// ===== Cart =====
function getTotal() { return cart.reduce((s, i) => s + i.price * i.quantity, 0); }

function addToCart(id) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    const existing = cart.find(c => c.id === id);
    if (existing) { existing.quantity++; }
    else { cart.push({ id: item.id, name: item.name, price: item.price, category: item.category, image: item.image, quantity: 1 }); }
    saveCart();
    updateCartDisplay();
    updateCardUI(id);
    showToast(item.name + ' added!');
    // Haptic feedback on mobile
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

// ===== Update Cart Display =====
function updateCartDisplay() {
    let totalItems = 0, totalAmount = 0;
    cart.forEach(i => { totalItems += i.quantity; totalAmount += i.price * i.quantity; });

    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const stickyCart = document.getElementById('sticky-cart');

    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = '₹' + totalAmount;
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

    const parts = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image" width="48" height="48"
                loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price} each</div>
            </div>
            <div class="cart-item-qty">
                <button data-action="decrease" data-id="${item.id}"><i class="fas fa-minus"></i></button>
                <span>${item.quantity}</span>
                <button data-action="increase" data-id="${item.id}"><i class="fas fa-plus"></i></button>
            </div>
            <button class="cart-item-remove" data-action="remove" data-id="${item.id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>`).join('');

    if (cartItemsEl) cartItemsEl.innerHTML = parts;
    const subtotal = document.getElementById('cart-subtotal');
    const grandTotal = document.getElementById('cart-grand-total');
    if (subtotal) subtotal.textContent = '₹' + totalAmount;
    if (grandTotal) grandTotal.textContent = '₹' + totalAmount;
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

// ===== Toast =====
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

// ===== Hero Slider =====
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

// ===== UPI Grid =====
function renderUpiAppGrid() {
    if (upiGridRendered) return;
    const grid = document.getElementById('upi-app-grid');
    if (!grid) return;
    grid.innerHTML = UPI_APPS.map(app => `
        <button type="button" class="upi-app-btn" data-app="${app.id}">
            <div class="upi-app-icon">
                ${app.icon
                    ? `<img src="${app.icon}" alt="${app.name}" loading="lazy" decoding="async" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\'fallback-icon\' style=\'background:${app.color}\'>${app.name[0]}</span>'">`
                    : `<span class="fallback-icon" style="background:${app.color}">${app.name[0]}</span>`}
            </div>
            <span class="upi-app-name">${app.name}</span>
        </button>`).join('');
    upiGridRendered = true;
}

function handleUpiAppClick(appId) {
    const total = getTotal();
    if (total <= 0) { showToast('Please add items to cart first'); return; }

    const app = UPI_APPS.find(a => a.id === appId);
    if (!app) return;

    selectedUpiApp = appId;
    document.querySelectorAll('.upi-app-btn').forEach(btn => btn.classList.toggle('selected', btn.dataset.app === appId));

    const pa = encodeURIComponent(UPI_ID);
    const pn = encodeURIComponent(HOTEL_NAME);
    const am = encodeURIComponent(total.toFixed(2));
    const tn = encodeURIComponent('Food Order - Sri Krishna Hotel');

    let url;
    if (/Android/i.test(navigator.userAgent) && app.pkg) {
        const fallback = encodeURIComponent(`upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`);
        url = `intent://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}#Intent;scheme=upi;package=${app.pkg};S.browser_fallback_url=${fallback};end`;
    } else if (/iPhone|iPad/i.test(navigator.userAgent)) {
        const schemes = { gpay: 'tez', phonepe: 'phonepe', paytm: 'paytmmp' };
        const scheme = schemes[app.id] || 'upi';
        url = `${scheme}://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
    } else {
        url = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
    }

    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        window.location.href = url;
        showToast('Opening ' + app.name + '...');
    } else {
        showToast('Please open on mobile or scan QR');
    }

    document.getElementById('qr-payment-section').style.display = 'block';
    updatePaymentStatus('paid');
    paymentStatus = 'paid';
    document.getElementById('btn-submit-order').disabled = false;
}

function updatePaymentStatus(status) {
    const el = document.getElementById('payment-status');
    if (!el) return;
    const map = {
        paid:    '<span class="status-paid">Payment App Selected — Submit Order now</span>',
        pending: '<span class="status-pending">Select a UPI App to enable payment</span>',
        cash:    '<span class="status-cash">Cash on Delivery</span>'
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

// ===== Event Listeners =====
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
            document.querySelectorAll('.category-btn').forEach(b => {
                b.classList.remove('active');
                if (b.dataset.category === currentCategory) b.classList.add('active');
            });
            renderMenu(); closeMobileMenu();
            document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    const searchToggle = document.getElementById('search-toggle');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');

    if (searchToggle) searchToggle.addEventListener('click', () => document.getElementById('search-bar').classList.toggle('active'));
    if (searchClose) searchClose.addEventListener('click', function() {
        document.getElementById('search-bar').classList.remove('active');
        if (searchInput) searchInput.value = '';
        searchQuery = ''; renderMenu();
    });
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const val = this.value;
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => { searchQuery = val; renderMenu(); }, 120);
        });
    }

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
    if (btnPlaceOrder) btnPlaceOrder.addEventListener('click', function() {
        closeCart(); updateQrAmount(); openOrderModal();
    });

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
                updatePaymentStatus('pending');
                paymentStatus = 'pending';
                document.getElementById('btn-submit-order').disabled = true;
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
    if (upiAppGrid) {
        upiAppGrid.addEventListener('click', function(e) {
            const btn = e.target.closest('.upi-app-btn');
            if (btn) handleUpiAppClick(btn.dataset.app);
        });
    }

    const btnCopyUpi = document.getElementById('btn-copy-upi');
    if (btnCopyUpi) btnCopyUpi.addEventListener('click', copyUpiId);

    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', function(e) { e.preventDefault(); submitOrder(); });

    const btnNewOrder = document.getElementById('btn-new-order');
    if (btnNewOrder) btnNewOrder.addEventListener('click', function() {
        closeSuccessModal(); clearCart(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });

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
    if (customerMobile) {
        customerMobile.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    }

    // Pull-to-refresh prevention on mobile
    document.body.addEventListener('touchmove', function(e) {
        if (document.body.style.overflow === 'hidden') {
            e.preventDefault();
        }
    }, { passive: false });
}

// ===== Modals =====
function openCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    _rebuildCartItemsHTML(total);
}

function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function openMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-menu-overlay');
    if (menu) menu.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-menu-overlay');
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    const overlay = document.getElementById('order-modal-overlay');
    if (modal) modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function openSuccessModal() {
    const modal = document.getElementById('success-modal');
    const overlay = document.getElementById('success-modal-overlay');
    if (modal) modal.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    const overlay = document.getElementById('success-modal-overlay');
    if (modal) modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function openHistoryModal() {
    renderOrderHistory();
    const modal = document.getElementById('history-modal');
    const overlay = document.getElementById('history-modal-overlay');
    if (modal) modal.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeHistoryModal() {
    const modal = document.getElementById('history-modal');
    const overlay = document.getElementById('history-modal-overlay');
    if (modal) modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function openContactModal() {
    const modal = document.getElementById('contact-modal');
    const overlay = document.getElementById('contact-modal-overlay');
    if (modal) modal.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeContactModal() {
    const modal = document.getElementById('contact-modal');
    const overlay = document.getElementById('contact-modal-overlay');
    if (modal) modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function openOrderModal() {
    renderUpiAppGrid();
    const modal = document.getElementById('order-modal');
    const overlay = document.getElementById('order-modal-overlay');
    if (modal) modal.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    const form = document.getElementById('order-form');
    if (form) form.reset();

    const cashRadio = document.querySelector('input[name="payment-method"][value="cash"]');
    if (cashRadio) cashRadio.checked = true;

    const onlineSection = document.getElementById('online-payment-section');
    const cashSection = document.getElementById('cash-payment-section');
    const qrSection = document.getElementById('qr-payment-section');

    if (onlineSection) onlineSection.style.display = 'none';
    if (cashSection) cashSection.style.display = 'block';
    if (qrSection) qrSection.style.display = 'none';

    selectedUpiApp = null;
    document.querySelectorAll('.upi-app-btn').forEach(btn => btn.classList.remove('selected'));
    updatePaymentStatus('cash');
    paymentStatus = 'cash';
    document.getElementById('btn-submit-order').disabled = false;

    const dlBtn = document.getElementById('btn-download-bill');
    if (dlBtn) dlBtn.style.display = 'none';
    updateQrAmount();
}

// ===== Submit Order =====
function submitOrder() {
    const name = document.getElementById('customer-name').value.trim();
    const mobile = document.getElementById('customer-mobile').value.trim();
    const table = document.getElementById('table-number').value.trim();
    const notes = document.getElementById('order-notes').value.trim();
    const method = document.querySelector('input[name="payment-method"]:checked')?.value || 'cash';

    if (!name || !mobile || !table) { showToast('Please fill all required fields'); return; }
    if (mobile.length !== 10) { showToast('Enter valid 10-digit mobile number'); return; }
    if (method === 'online' && paymentStatus !== 'paid') { showToast('Please select a UPI app first'); return; }

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
        totalAmount: getTotal(),
        date: now.toLocaleDateString('en-IN'),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.getTime()
    };

    saveOrderToHistory(order);
    lastGeneratedBill = order;

    // Save to Firebase if available
    if (typeof window.saveOrderToFirestore === 'function') {
        window.saveOrderToFirestore(order).then(function(firestoreId) {
            if (firestoreId) console.log('Order saved to cloud! ID:', firestoreId);
        }).catch(err => console.warn('Firebase save failed:', err));
    }

    generateBillPDF(order, 'whatsapp').catch(err => {
        console.error('PDF error:', err);
        sendWhatsAppText(order);
    });

    closeOrderModal();
    openSuccessModal();
}

// ===== Bill PDF =====
function generateBillPDF(order, mode) {
    return new Promise(function(resolve, reject) {
        function proceed(jsPDFClass) {
            try {
                const pdfDataUri = createPDFDataUri(order, jsPDFClass);
                if (mode === 'whatsapp') {
                    sendWhatsAppWithPDF(order, pdfDataUri);
                } else {
                    const link = document.createElement('a');
                    link.href = pdfDataUri;
                    link.download = 'SriKrishna_Bill_' + order.id + '.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                resolve();
            } catch (e) { reject(e); }
        }

        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            proceed(window.jspdf.jsPDF);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() {
            if (window.jspdf && window.jspdf.jsPDF) proceed(window.jspdf.jsPDF);
            else reject(new Error('jsPDF not found'));
        };
        script.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(script);
    });
}

function createPDFDataUri(order, jsPDFClass) {
    const doc = new jsPDFClass({ unit: 'mm', format: 'a4' });
    const L = 18, R = 192;
    let y = 18;

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
    doc.text('Item', L, y);
    doc.text('Qty', 120, y, { align: 'center' });
    doc.text('Rate', 155, y, { align: 'right' });
    doc.text('Amount', R, y, { align: 'right' }); y += 6;
    doc.setLineWidth(0.3); doc.line(L, y, R, y); y += 8;

    doc.setFont('helvetica', 'normal');
    order.items.forEach(function(item) {
        const n = item.name.length > 26 ? item.name.slice(0, 23) + '...' : item.name;
        doc.text(n, L, y);
        doc.text(String(item.quantity), 120, y, { align: 'center' });
        doc.text('Rs.' + item.price, 155, y, { align: 'right' });
        doc.text('Rs.' + (item.price * item.quantity), R, y, { align: 'right' });
        y += 7;
    });

    y += 4; doc.setLineWidth(0.5); doc.line(L, y, R, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('TOTAL AMOUNT', L, y);
    doc.text('Rs.' + order.totalAmount, R, y, { align: 'right' }); y += 10;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('Payment Method : ' + order.paymentStatus, L, y); y += 10;

    doc.setLineWidth(0.5); doc.line(L, y, R, y); y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for choosing Sri Krishna Hotel!', 105, y, { align: 'center' }); y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('Order prepared with care and served fresh.', 105, y, { align: 'center' });

    return doc.output('datauristring');
}

// ===== WhatsApp =====
function sendWhatsAppWithPDF(order, pdfDataUri) {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
        const base64 = pdfDataUri.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const file = new File([blob], 'SriKrishna_Bill_' + order.id + '.pdf', { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ title: 'Sri Krishna Hotel - Bill ' + order.id, text: buildWhatsAppText(order), files: [file] })
                .then(() => showToast('Bill shared!'))
                .catch(() => downloadPDFAndOpenWhatsApp(order, pdfDataUri));
        } else {
            downloadPDFAndOpenWhatsApp(order, pdfDataUri);
        }
    } else {
        downloadPDFAndOpenWhatsApp(order, pdfDataUri);
    }
}

function downloadPDFAndOpenWhatsApp(order, pdfDataUri) {
    const link = document.createElement('a');
    link.href = pdfDataUri;
    link.download = 'SriKrishna_Bill_' + order.id + '.pdf';
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

function sendWhatsAppText(order) {
    const msg = buildWhatsAppMessageEncoded(order);
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg, '_blank');
}

// ===== Order History =====
function saveOrderToHistory(order) {
    try {
        let h = JSON.parse(localStorage.getItem('sriKrishnaOrders')) || [];
        if (!Array.isArray(h)) h = [];
        h.unshift(order);
        if (h.length > 50) h = h.slice(0, 50);
        localStorage.setItem('sriKrishnaOrders', JSON.stringify(h));
    } catch {}
}

function renderOrderHistory() {
    const container = document.getElementById('order-history-list');
    if (!container) return;
    try {
        const history = JSON.parse(localStorage.getItem('sriKrishnaOrders')) || [];
        if (!history.length) {
            container.innerHTML = '<div class="empty-history"><i class="fas fa-clipboard-list"></i><p>No orders yet</p></div>';
            return;
        }
        container.innerHTML = history.map(o => `
            <div class="history-item">
                <div class="history-item-header">
                    <h4>${o.customerName} - Table ${o.tableNumber}</h4>
                    <span class="history-item-date">${o.date} ${o.time}</span>
                </div>
                <div class="history-item-details">${o.items.map(i => i.name + ' x' + i.quantity).join(', ')}</div>
                <div class="history-item-total">Rs.${o.totalAmount} - ${o.paymentStatus}</div>
            </div>`).join('');
    } catch {
        container.innerHTML = '<div class="empty-history"><i class="fas fa-clipboard-list"></i><p>No orders yet</p></div>';
    }
}
