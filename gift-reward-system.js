// gift-reward-system.js — GitBox Gift Box + Reward System (INTEGRATED)
// =================================================================
// This file merges the existing Gift Box UI with the new Reward System backend
// 
// WHAT IT DOES:
//   - Keeps existing Gift Box UI (customers already familiar)
//   - Stores ALL data in Firebase Firestore (not just localStorage)
//   - 10-day cycle tracking with auto-reset
//   - Admin dashboard integrationa
//   - Claim workflow with notifications
// =================================================================

'use strict';

// ===== CONFIGURATION (from existing Gift Box) =====
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

// ===== FIREBASE REFERENCES =====
let REWARD_DB = null;

async function initRewardDB() {
    if (REWARD_DB) return REWARD_DB;
    if (window.db) {
        REWARD_DB = window.db;
        return REWARD_DB;
    }
    if (typeof window.initFirebase === 'function') {
        REWARD_DB = await window.initFirebase();
        return REWARD_DB;
    }
    console.warn('[GiftReward] Firebase not available');
    return null;
}

// ===== INDIA TIME HELPERS =====
function getIndiaTime() {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

function getTodayDateIST() {
    const d = getIndiaTime();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateIST(dateObj) {
    const d = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function calculateDaysRemaining(cycleEndDate) {
    try {
        const today = getIndiaTime();
        const endDate = new Date(cycleEndDate + 'T23:59:59');
        const diff = endDate - today;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch (_) {
        return 0;
    }
}

// ===== MOBILE VALIDATION =====
function isValidIndianMobile(mobile) {
    const cleaned = String(mobile).replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
}

// ===== LOCAL STORAGE HELPERS =====
function safeJSONParse(key, defaultVal) {
    try { 
        const v = localStorage.getItem(key); 
        return v ? JSON.parse(v) : defaultVal; 
    } catch { 
        return defaultVal; 
    }
}

function safeJSONSet(key, val) {
    try { 
        localStorage.setItem(key, JSON.stringify(val)); 
    } catch { 
        /* ignore */ 
    }
}

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS (Database Storage)
// ═══════════════════════════════════════════════════════════════

// ===== RECORD PURCHASE TO FIRESTORE =====
async function recordGiftPurchase(mobileNumber, customerName, totalAmount, orderId) {
    const db = await initRewardDB();
    if (!db) {
        console.warn('[GiftReward] DB not available, storing locally');
        return { success: false, local: true };
    }

    if (!isValidIndianMobile(mobileNumber)) {
        return { success: false, error: 'Invalid mobile' };
    }

    try {
        const { doc, setDoc, serverTimestamp } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        const today = getTodayDateIST();
        const timestamp = getIndiaTime().toISOString();
        const cleanMobile = String(mobileNumber).replace(/\D/g, '');

        // 1. Record purchase in rewards_purchases
        const purchaseId = orderId || `order_${Date.now()}`;
        const purchaseRef = doc(db, 'rewards_purchases', cleanMobile, 'orders', purchaseId);
        await setDoc(purchaseRef, {
            mobile: cleanMobile,
            customerName: customerName || 'Customer',
            amount: Number(totalAmount),
            date: today,
            timestamp: timestamp,
            orderId: purchaseId,
            createdAt: serverTimestamp()
        });

        // 2. Update cycle record
        await updateGiftCycle(cleanMobile, Number(totalAmount), customerName);

        console.log('[GiftReward] ✅ Purchase recorded:', { mobile: cleanMobile, amount: totalAmount });
        return { success: true, mobile: cleanMobile };

    } catch (err) {
        console.error('[GiftReward] ❌ Purchase recording error:', err);
        return { success: false, error: err.message };
    }
}

// ===== UPDATE CYCLE RECORD =====
async function updateGiftCycle(mobile, purchaseAmount, customerName) {
    const db = await initRewardDB();
    if (!db) return;

    try {
        const { doc, getDoc, setDoc, serverTimestamp } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        const cycleRef = doc(db, 'rewards_cycles', mobile);
        const cycleSnap = await getDoc(cycleRef);

        const today = getIndiaTime();
        let cycleStart, cycleEnd, totalAmount;

        if (!cycleSnap.exists()) {
            // New cycle
            cycleStart = getTodayDateIST();
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + (GIFT_CONFIG.CYCLE_DAYS - 1));
            cycleEnd = formatDateIST(endDate);
            totalAmount = purchaseAmount;
        } else {
            const existing = cycleSnap.data();
            const cycleEndDate = new Date(existing.cycleEnd + 'T23:59:59');

            if (today <= cycleEndDate) {
                // Active cycle
                cycleStart = existing.cycleStart;
                cycleEnd = existing.cycleEnd;
                totalAmount = (existing.totalAmount || 0) + purchaseAmount;
            } else {
                // Expired, start new
                cycleStart = getTodayDateIST();
                const newEnd = new Date(today);
                newEnd.setDate(newEnd.getDate() + (GIFT_CONFIG.CYCLE_DAYS - 1));
                cycleEnd = formatDateIST(newEnd);
                totalAmount = purchaseAmount;
            }
        }

        await setDoc(cycleRef, {
            mobile: mobile,
            customerName: customerName || 'Customer',
            cycleStart: cycleStart,
            cycleEnd: cycleEnd,
            totalAmount: totalAmount,
            daysRemaining: calculateDaysRemaining(cycleEnd),
            lastUpdated: serverTimestamp()
        }, { merge: true });

    } catch (err) {
        console.error('[GiftReward] Cycle update error:', err);
    }
}

// ===== GET USER ELIGIBILITY =====
async function getGiftEligibility(mobileNumber) {
    const db = await initRewardDB();
    if (!db) {
        // Fallback to local
        return getLocalGiftEligibility(mobileNumber);
    }

    try {
        const { doc, getDoc } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        const cleanMobile = String(mobileNumber).replace(/\D/g, '');
        const cycleRef = doc(db, 'rewards_cycles', cleanMobile);
        const cycleSnap = await getDoc(cycleRef);

        if (!cycleSnap.exists()) {
            return { 
                eligible: false, 
                reason: 'No purchases yet',
                totalAmount: 0,
                daysRemaining: GIFT_CONFIG.CYCLE_DAYS,
                tier: null,
                couponValue: 0
            };
        }

        const data = cycleSnap.data();
        const totalAmount = data.totalAmount || 0;
        const daysRemaining = calculateDaysRemaining(data.cycleEnd);

        if (daysRemaining <= 0) {
            return { 
                eligible: false, 
                reason: 'Reward period expired. Start a new cycle!',
                totalAmount: totalAmount,
                daysRemaining: 0,
                tier: null,
                couponValue: 0,
                cycleStart: data.cycleStart,
                cycleEnd: data.cycleEnd
            };
        }

        let tier = null;
        let couponValue = 0;

        if (totalAmount >= GIFT_CONFIG.TIER2_SPEND) {
            tier = 'premium';
            couponValue = GIFT_CONFIG.TIER2_VALUE;
        } else if (totalAmount >= GIFT_CONFIG.TIER1_SPEND) {
            tier = 'standard';
            couponValue = GIFT_CONFIG.TIER1_VALUE;
        }

        return {
            eligible: tier !== null,
            tier: tier,
            couponValue: couponValue,
            totalAmount: totalAmount,
            daysRemaining: daysRemaining,
            cycleStart: data.cycleStart,
            cycleEnd: data.cycleEnd,
            customerName: data.customerName,
            reason: tier ? `₹${couponValue} coupon available!` : `Spend ₹${GIFT_CONFIG.TIER1_SPEND - totalAmount} more to unlock`
        };

    } catch (err) {
        console.error('[GiftReward] Eligibility error:', err);
        return getLocalGiftEligibility(mobileNumber);
    }
}

// ===== LOCAL FALLBACK =====
function getLocalGiftEligibility(mobile) {
    const orders = safeJSONParse('sriKrishnaOrders', []);
    const userOrders = orders.filter(o => o.customerMobile === mobile);
    const totalSpent = userOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    let tier = null;
    let couponValue = 0;

    if (totalSpent >= GIFT_CONFIG.TIER2_SPEND) {
        tier = 'premium';
        couponValue = GIFT_CONFIG.TIER2_VALUE;
    } else if (totalSpent >= GIFT_CONFIG.TIER1_SPEND) {
        tier = 'standard';
        couponValue = GIFT_CONFIG.TIER1_VALUE;
    }

    return {
        eligible: tier !== null,
        tier: tier,
        couponValue: couponValue,
        totalAmount: totalSpent,
        daysRemaining: GIFT_CONFIG.CYCLE_DAYS,
        reason: tier ? `₹${couponValue} coupon available!` : `Spend ₹${GIFT_CONFIG.TIER1_SPEND - totalSpent} more to unlock`
    };
}

// ===== CLAIM COUPON =====
async function claimGiftCoupon(mobileNumber, customerName) {
    const db = await initRewardDB();
    if (!db) {
        return { success: false, error: 'System not ready' };
    }

    try {
        const eligibility = await getGiftEligibility(mobileNumber);

        if (!eligibility.eligible) {
            return { success: false, error: eligibility.reason || 'Not eligible' };
        }

        const { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        const cleanMobile = String(mobileNumber).replace(/\D/g, '');
        const today = getTodayDateIST();

        // Check for duplicate claim today
        const claimsRef = collection(db, 'rewards_claims');
        const q = query(claimsRef, where('mobile', '==', cleanMobile), where('claimDate', '==', today));
        const existingClaims = await getDocs(q);

        if (!existingClaims.empty) {
            return { success: false, error: 'You already claimed today. Try tomorrow!' };
        }

        // Create claim
        const claimId = `claim_${cleanMobile}_${Date.now()}`;
        const claimRef = doc(db, 'rewards_claims', claimId);

        await setDoc(claimRef, {
            claimId: claimId,
            mobile: cleanMobile,
            customerName: customerName || 'Customer',
            couponType: eligibility.tier,
            couponValue: eligibility.couponValue,
            totalAmount: eligibility.totalAmount,
            claimDate: today,
            claimTime: getIndiaTime().toISOString(),
            status: 'pending',
            adminNotified: false,
            createdAt: serverTimestamp()
        });

        // Notify admin
        await notifyAdminOfGiftClaim(claimId, cleanMobile, customerName, eligibility);

        return {
            success: true,
            claimId: claimId,
            couponValue: eligibility.couponValue,
            message: `₹${eligibility.couponValue} coupon claimed! Admin will verify.`
        };

    } catch (err) {
        console.error('[GiftReward] Claim error:', err);
        return { success: false, error: 'Could not process claim' };
    }
}

// ===== ADMIN NOTIFICATION =====
async function notifyAdminOfGiftClaim(claimId, mobile, customerName, eligibility) {
    const db = await initRewardDB();
    if (!db) return;

    try {
        const { doc, setDoc, serverTimestamp } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        const notifRef = doc(db, 'rewards_admin_notifications', claimId);
        await setDoc(notifRef, {
            claimId: claimId,
            mobile: mobile,
            customerName: customerName || 'Customer',
            couponType: eligibility.tier,
            couponValue: eligibility.couponValue,
            totalAmount: eligibility.totalAmount,
            notificationTime: getIndiaTime().toISOString(),
            read: false,
            createdAt: serverTimestamp()
        });

        console.log('[GiftReward] Admin notified:', claimId);
    } catch (err) {
        console.error('[GiftReward] Notification error:', err);
    }
}

// ═══════════════════════════════════════════════════════════════
// UI FUNCTIONS (Keep existing Gift Box UI)
// ═══════════════════════════════════════════════════════════════

// ===== VERIFY PHONE (Updated to use DB) =====
async function verifyUserPhoneAndSetupGifts(phone, modal) {
    const btn = modal.querySelector('#gift-phone-submit');
    try {
        let userData = null;

        // First try database
        const eligibility = await getGiftEligibility(phone);

        if (eligibility.totalAmount > 0) {
            userData = {
                name: eligibility.customerName || 'Customer',
                totalSpent: eligibility.totalAmount,
                eligible: eligibility.eligible,
                tier: eligibility.tier,
                couponValue: eligibility.couponValue,
                daysRemaining: eligibility.daysRemaining
            };
        } else {
            // Fallback to local
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
        console.error('[GiftReward] Verify error:', e);
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

// ===== SHOW REWARD STATUS (Updated with DB data) =====
function showRewardStatusCard(user, phone) {
    const existing = document.getElementById('reward-status-card');
    if (existing) existing.remove();

    const isEligible = user.eligible || user.totalSpent >= GIFT_CONFIG.TIER1_SPEND;
    const tier = user.tier || (user.totalSpent >= GIFT_CONFIG.TIER2_SPEND ? 'premium' : (user.totalSpent >= GIFT_CONFIG.TIER1_SPEND ? 'standard' : null));
    const couponValue = user.couponValue || (tier === 'premium' ? GIFT_CONFIG.TIER2_VALUE : (tier === 'standard' ? GIFT_CONFIG.TIER1_VALUE : 0));
    const daysRemaining = user.daysRemaining || GIFT_CONFIG.CYCLE_DAYS;

    const card = document.createElement('div');
    card.id = 'reward-status-card';
    card.className = 'reward-status-card-overlay';
    card.innerHTML = `
        <div class="reward-status-card">
            <button class="reward-card-cancel" id="reward-card-cancel"><i class="fas fa-times"></i></button>
            <div class="reward-card-icon">${isEligible ? '🎉' : '⏳'}</div>
            <h3>${isEligible ? 'Congratulations!' : 'Keep Shopping!'}</h3>
            <p class="reward-card-phone">${phone}</p>
            <div class="reward-card-stats">
                <div class="reward-stat">
                    <span class="reward-stat-value">₹${user.totalSpent}</span>
                    <span class="reward-stat-label">Total Spent</span>
                </div>
                <div class="reward-stat">
                    <span class="reward-stat-value">${daysRemaining}</span>
                    <span class="reward-stat-label">Days Left</span>
                </div>
            </div>
            ${isEligible ? `
                <div class="reward-card-eligible">
                    <p>🎁 You unlocked <strong>₹${couponValue} Coupon</strong>!</p>
                    <p class="reward-tier">${tier === 'premium' ? '⭐ Premium Tier' : '🎁 Standard Tier'}</p>
                    <button class="reward-claim-btn" id="reward-claim-btn" data-phone="${phone}" data-name="${user.name}">
                        <i class="fas fa-gift"></i> Claim Now
                    </button>
                </div>
            ` : `
                <div class="reward-card-progress">
                    <p>Spend ₹${GIFT_CONFIG.TIER1_SPEND - user.totalSpent} more to unlock ₹${GIFT_CONFIG.TIER1_VALUE} coupon</p>
                    <div class="reward-progress-bar">
                        <div class="reward-progress-fill" style="width: ${Math.min(100, (user.totalSpent / GIFT_CONFIG.TIER1_SPEND) * 100)}%"></div>
                    </div>
                    <p class="reward-next-tier">₹${GIFT_CONFIG.TIER2_SPEND}+ for ₹${GIFT_CONFIG.TIER2_VALUE} coupon</p>
                </div>
            `}
            <p class="reward-card-note">${isEligible ? 'Valid for ' + daysRemaining + ' more days' : 'Track your spending to earn rewards'}</p>
        </div>
    `;

    document.body.appendChild(card);

    // Close button
    card.querySelector('#reward-card-cancel').addEventListener('click', () => card.remove());

    // Claim button
    const claimBtn = card.querySelector('#reward-claim-btn');
    if (claimBtn) {
        claimBtn.addEventListener('click', async function() {
            const phone = this.dataset.phone;
            const name = this.dataset.name;

            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            const result = await claimGiftCoupon(phone, name);

            if (result.success) {
                this.innerHTML = '<i class="fas fa-check"></i> Claimed!';
                this.classList.add('claimed');
                showToast('✅ ' + result.message);

                // Update card
                const msg = card.querySelector('.reward-card-eligible p');
                if (msg) msg.innerHTML = '✅ Claimed! Admin will verify.';
            } else {
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-gift"></i> Claim Now';
                showToast('❌ ' + result.error);
            }
        });
    }
}

// ===== SHOW NOT ELIGIBLE CARD =====
function showNotEligibleCard(modal, phone, userData) {
    if (modal) modal.remove();

    const card = document.createElement('div');
    card.id = 'reward-status-card';
    card.className = 'reward-status-card-overlay';
    card.innerHTML = `
        <div class="reward-status-card">
            <button class="reward-card-cancel" id="reward-card-cancel"><i class="fas fa-times"></i></button>
            <div class="reward-card-icon">🎁</div>
            <h3>Welcome!</h3>
            <p class="reward-card-phone">${phone}</p>
            <p class="reward-welcome-text">Start ordering to unlock gift rewards!</p>
            <div class="reward-card-stats">
                <div class="reward-stat">
                    <span class="reward-stat-value">₹0</span>
                    <span class="reward-stat-label">Total Spent</span>
                </div>
                <div class="reward-stat">
                    <span class="reward-stat-value">${GIFT_CONFIG.CYCLE_DAYS}</span>
                    <span class="reward-stat-label">Days Left</span>
                </div>
            </div>
            <div class="reward-card-progress">
                <p>Spend ₹${GIFT_CONFIG.TIER1_SPEND} to unlock ₹${GIFT_CONFIG.TIER1_VALUE} coupon</p>
                <div class="reward-progress-bar">
                    <div class="reward-progress-fill" style="width: 0%"></div>
                </div>
            </div>
            <button class="reward-start-btn" onclick="this.closest('.reward-status-card-overlay').remove()">
                Start Shopping
            </button>
        </div>
    `;

    document.body.appendChild(card);
    card.querySelector('#reward-card-cancel').addEventListener('click', () => card.remove());
}

// ===== CHECK LOCAL ORDERS (Fallback) =====
function checkLocalOrders(phone) {
    try {
        const orders = safeJSONParse('sriKrishnaOrders', []);
        const userOrders = orders.filter(o => o.customerMobile === phone);
        if (!userOrders.length) return null;
        const totalSpent = userOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const name = userOrders[0].customerName || 'Customer';
        return { 
            name, 
            totalSpent, 
            eligible: totalSpent >= GIFT_CONFIG.TIER1_SPEND,
            tier: totalSpent >= GIFT_CONFIG.TIER2_SPEND ? 'premium' : (totalSpent >= GIFT_CONFIG.TIER1_SPEND ? 'standard' : null),
            couponValue: totalSpent >= GIFT_CONFIG.TIER2_SPEND ? GIFT_CONFIG.TIER2_VALUE : (totalSpent >= GIFT_CONFIG.TIER1_SPEND ? GIFT_CONFIG.TIER1_VALUE : 0)
        };
    } catch { 
        return null; 
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-CLEANUP (10-Day Cycle Reset)
// ═══════════════════════════════════════════════════════════════

async function cleanupExpiredGiftData() {
    const db = await initRewardDB();
    if (!db) return;

    try {
        const { collection, getDocs, deleteDoc, doc } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        const today = getIndiaTime();
        const cyclesRef = collection(db, 'rewards_cycles');
        const cyclesSnap = await getDocs(cyclesRef);

        let resetCount = 0;

        for (const cycleDoc of cyclesSnap.docs) {
            const data = cycleDoc.data();
            const cycleEnd = new Date(data.cycleEnd + 'T23:59:59');

            if (today > cycleEnd) {
                const mobile = cycleDoc.id;

                // Delete old purchases
                const purchasesRef = collection(db, 'rewards_purchases', mobile, 'orders');
                const purchasesSnap = await getDocs(purchasesRef);
                for (const p of purchasesSnap.docs) {
                    await deleteDoc(p.ref);
                }

                // Delete cycle
                await deleteDoc(cycleDoc.ref);
                resetCount++;
            }
        }

        if (resetCount > 0) {
            console.log('[GiftReward] Cleaned up', resetCount, 'expired cycles');
        }
    } catch (err) {
        console.error('[GiftReward] Cleanup error:', err);
    }
}

// Schedule cleanup at 12:05 AM IST
function scheduleGiftCleanup() {
    function checkAndClean() {
        const now = getIndiaTime();
        if (now.getHours() === 0 && now.getMinutes() >= 5 && now.getMinutes() <= 6) {
            cleanupExpiredGiftData();
        }
    }
    setInterval(checkAndClean, 60000); // Check every minute
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

window._giftRewardSystem = {
    init: initRewardDB,
    recordPurchase: recordGiftPurchase,
    getEligibility: getGiftEligibility,
    claimCoupon: claimGiftCoupon,
    getTodayDate: getTodayDateIST,
    config: GIFT_CONFIG
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initRewardDB().then(() => scheduleGiftCleanup());
    });
} else {
    initRewardDB().then(() => scheduleGiftCleanup());
}

console.log('[GiftReward] ✅ Integrated Gift+Reward System Ready');
