// reward-system.js — Sri Krishna Hotel Reward & Coupon System
// =============================================================
// Handles:
//   - Daily login verification via mobile number
//   - Purchase tracking (10-day cycle)
//   - Eligibility calculation (₹1000, ₹2000)
//   - Coupon claim workflow
//   - Auto reset logic (11th day midnight)
// =============================================================

'use strict';

// ===== FIREBASE INIT =====
let REWARD_DB = null;
let REWARD_AUTH = null;

async function initRewardSystem() {
    try {
        // Use existing Firebase instance from main app
        if (!window.db || !window.auth) {
            if (typeof window.initFirebase === 'function') {
                await window.initFirebase();
            }
        }
        REWARD_DB = window.db;
        REWARD_AUTH = window.auth;
        console.log('[Reward] System initialized');
        return true;
    } catch (err) {
        console.error('[Reward] Init failed:', err);
        return false;
    }
}

// ===== INDIA TIME HELPERS =====
function getIndiaTime() {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return istTime;
}

function getTodayDateIST() {
    const d = getIndiaTime();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

function getDateIST(dateObj) {
    const d = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

// ===== MOBILE NUMBER VALIDATION =====
function isValidIndianMobileNumber(mobile) {
    const cleaned = mobile.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
}

// ===== DATABASE COLLECTIONS =====
// Collections structure:
// rewards_purchases/{mobile}/{orderId} → { amount, date, timestamp }
// rewards_cycles/{mobile} → { cycleStart, cycleEnd, totalAmount, lastClaimed }
// rewards_claims/{claimId} → { mobile, name, amount, couponType, claimTime, status }

// ===== MOBILE VERIFICATION (Daily Login) =====
async function verifyMobileLogin(mobileNumber) {
    if (!REWARD_DB) {
        console.warn('[Reward] DB not initialized');
        return { success: false, error: 'System not ready' };
    }

    if (!isValidIndianMobileNumber(mobileNumber)) {
        return { success: false, error: 'Invalid mobile number. Must be 10 digits starting with 6-9.' };
    }

    try {
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        // Get or create user login record
        const loginDocRef = doc(REWARD_DB, 'rewards_logins', mobileNumber);
        const loginSnap = await getDoc(loginDocRef);
        
        const today = getTodayDateIST();
        const lastLogin = loginSnap.exists() ? loginSnap.data().lastLogin : null;
        
        // Check if already logged in today
        if (lastLogin === today) {
            return { success: true, alreadyLoggedIn: true, mobile: mobileNumber };
        }
        
        // Update login record
        const { serverTimestamp, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await setDoc(loginDocRef, {
            mobile: mobileNumber,
            lastLogin: today,
            lastLoginTime: serverTimestamp(),
            verified: true
        }, { merge: true });
        
        return { success: true, mobile: mobileNumber, firstLoginToday: true };
        
    } catch (err) {
        console.error('[Reward] Mobile verification error:', err);
        return { success: false, error: 'Verification failed. Please try again.' };
    }
}

// ===== RECORD PURCHASE =====
async function recordPurchase(mobileNumber, customerName, totalAmount, orderId) {
    if (!REWARD_DB) {
        console.warn('[Reward] DB not initialized');
        return { success: false, error: 'System not ready' };
    }

    if (!isValidIndianMobileNumber(mobileNumber)) {
        return { success: false, error: 'Invalid mobile number' };
    }

    if (!totalAmount || totalAmount <= 0) {
        return { success: false, error: 'Invalid amount' };
    }

    try {
        const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const today = getTodayDateIST();
        const timestamp = getIndiaTime().toISOString();
        
        // Record purchase
        const purchaseDocRef = doc(REWARD_DB, 'rewards_purchases', mobileNumber, 'orders', orderId || `order_${Date.now()}`);
        await setDoc(purchaseDocRef, {
            mobile: mobileNumber,
            customerName: customerName,
            amount: totalAmount,
            date: today,
            timestamp: timestamp,
            orderId: orderId || `order_${Date.now()}`
        });
        
        // Update or create cycle record
        await updateCycleRecord(mobileNumber, totalAmount, customerName);
        
        console.log('[Reward] Purchase recorded:', { mobile: mobileNumber, amount: totalAmount });
        return { success: true, mobile: mobileNumber };
        
    } catch (err) {
        console.error('[Reward] Purchase recording error:', err);
        return { success: false, error: 'Could not record purchase' };
    }
}

// ===== UPDATE CYCLE RECORD =====
async function updateCycleRecord(mobileNumber, purchaseAmount, customerName) {
    try {
        const { doc, getDoc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const cycleDocRef = doc(REWARD_DB, 'rewards_cycles', mobileNumber);
        const cycleSnap = await getDoc(cycleDocRef);
        
        const today = getIndiaTime();
        let cycleStart, cycleEnd, totalAmount;
        
        if (!cycleSnap.exists()) {
            // New cycle
            cycleStart = getDateIST(today);
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 9);
            cycleEnd = getDateIST(endDate);
            totalAmount = purchaseAmount;
        } else {
            const existing = cycleSnap.data();
            const cyclEndDate = new Date(existing.cycleEnd + 'T23:59:59');
            
            // Check if current cycle is still valid
            if (today <= cyclEndDate) {
                cycleStart = existing.cycleStart;
                cycleEnd = existing.cycleEnd;
                totalAmount = (existing.totalAmount || 0) + purchaseAmount;
            } else {
                // Old cycle expired, start new one
                cycleStart = getDateIST(today);
                const newEnd = new Date(today);
                newEnd.setDate(newEnd.getDate() + 9);
                cycleEnd = getDateIST(newEnd);
                totalAmount = purchaseAmount;
            }
        }
        
        await setDoc(cycleDocRef, {
            mobile: mobileNumber,
            customerName: customerName,
            cycleStart: cycleStart,
            cycleEnd: cycleEnd,
            totalAmount: totalAmount,
            daysRemaining: calculateDaysRemaining(cycleEnd),
            lastUpdated: serverTimestamp()
        }, { merge: true });
        
    } catch (err) {
        console.error('[Reward] Cycle update error:', err);
    }
}

// ===== CALCULATE DAYS REMAINING =====
function calculateDaysRemaining(cycleEndDate) {
    try {
        const today = getIndiaTime();
        const endDate = new Date(cycleEndDate + 'T23:59:59');
        const diff = endDate - today;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    } catch (_) {
        return 0;
    }
}

// ===== GET USER ELIGIBILITY =====
async function getUserEligibility(mobileNumber) {
    if (!REWARD_DB) {
        return { eligible: false, error: 'System not ready' };
    }

    try {
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const cycleDocRef = doc(REWARD_DB, 'rewards_cycles', mobileNumber);
        const cycleSnap = await getDoc(cycleDocRef);
        
        if (!cycleSnap.exists()) {
            return { 
                eligible: false, 
                reason: 'No purchases yet',
                totalAmount: 0,
                daysRemaining: 0
            };
        }
        
        const data = cycleSnap.data();
        const totalAmount = data.totalAmount || 0;
        const daysRemaining = calculateDaysRemaining(data.cycleEnd);
        
        // Check if cycle is still valid
        if (daysRemaining <= 0) {
            return { 
                eligible: false, 
                reason: 'Reward period expired',
                totalAmount: totalAmount,
                daysRemaining: 0
            };
        }
        
        // Determine eligibility
        let couponType = null;
        let couponValue = 0;
        
        if (totalAmount >= 2000) {
            couponType = 'premium';
            couponValue = 100;
        } else if (totalAmount >= 1000) {
            couponType = 'standard';
            couponValue = 50;
        }
        
        return {
            eligible: couponType !== null,
            couponType: couponType,
            couponValue: couponValue,
            totalAmount: totalAmount,
            daysRemaining: daysRemaining,
            cycleStart: data.cycleStart,
            cycleEnd: data.cycleEnd,
            customerName: data.customerName
        };
        
    } catch (err) {
        console.error('[Reward] Eligibility check error:', err);
        return { eligible: false, error: 'Could not check eligibility' };
    }
}

// ===== CLAIM COUPON =====
async function claimCoupon(mobileNumber, customerName) {
    if (!REWARD_DB) {
        return { success: false, error: 'System not ready' };
    }

    try {
        const eligibility = await getUserEligibility(mobileNumber);
        
        if (!eligibility.eligible) {
            return { success: false, error: eligibility.reason || 'Not eligible for reward' };
        }
        
        const { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        // Check for duplicate claim today
        const today = getTodayDateIST();
        const claimsRef = collection(REWARD_DB, 'rewards_claims');
        const q = query(claimsRef, where('mobile', '==', mobileNumber), where('claimDate', '==', today));
        const existingClaims = await getDocs(q);
        
        if (!existingClaims.empty) {
            return { success: false, error: 'You have already claimed your reward today.' };
        }
        
        // Create claim record
        const claimId = `claim_${mobileNumber}_${Date.now()}`;
        const claimDocRef = doc(REWARD_DB, 'rewards_claims', claimId);
        const claimTime = getIndiaTime().toISOString();
        
        await setDoc(claimDocRef, {
            claimId: claimId,
            mobile: mobileNumber,
            customerName: customerName,
            couponType: eligibility.couponType,
            couponValue: eligibility.couponValue,
            totalAmount: eligibility.totalAmount,
            claimDate: today,
            claimTime: claimTime,
            status: 'pending',
            adminNotified: false,
            createdAt: serverTimestamp()
        });
        
        // Send admin notification
        await notifyAdminOfClaim(claimId, mobileNumber, customerName, eligibility);
        
        return {
            success: true,
            claimId: claimId,
            couponType: eligibility.couponType,
            couponValue: eligibility.couponValue
        };
        
    } catch (err) {
        console.error('[Reward] Claim error:', err);
        return { success: false, error: 'Could not process claim' };
    }
}

// ===== SEND ADMIN NOTIFICATION =====
async function notifyAdminOfClaim(claimId, mobileNumber, customerName, eligibility) {
    try {
        const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const notifDocRef = doc(
            REWARD_DB, 
            'rewards_admin_notifications', 
            claimId
        );
        
        await setDoc(notifDocRef, {
            claimId: claimId,
            mobile: mobileNumber,
            customerName: customerName,
            couponType: eligibility.couponType,
            couponValue: eligibility.couponValue,
            totalAmount: eligibility.totalAmount,
            notificationTime: getIndiaTime().toISOString(),
            read: false,
            createdAt: serverTimestamp()
        });
        
        console.log('[Reward] Admin notification sent for claim:', claimId);
        
    } catch (err) {
        console.error('[Reward] Notification error:', err);
    }
}

// ===== CLEANUP: EXPIRE OLD PURCHASES (Runs daily) =====
async function cleanupExpiredPurchases() {
    if (!REWARD_DB) return;
    
    try {
        const { collection, getDocs, deleteDoc, doc } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const today = getIndiaTime();
        const cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - 10);
        const cutoffIST = getDateIST(cutoffDate);
        
        // Get all mobile numbers from cycles
        const cyclesRef = collection(REWARD_DB, 'rewards_cycles');
        const cyclesDocs = await getDocs(cyclesRef);
        
        let deletedCount = 0;
        
        for (const cycleDoc of cyclesDocs.docs) {
            const mobile = cycleDoc.id;
            const purchasesRef = collection(REWARD_DB, 'rewards_purchases', mobile, 'orders');
            const purchasesDocs = await getDocs(purchasesRef);
            
            for (const purchaseDoc of purchasesDocs.docs) {
                const data = purchaseDoc.data();
                if (data.date < cutoffIST) {
                    await deleteDoc(purchaseDoc.ref);
                    deletedCount++;
                }
            }
        }
        
        if (deletedCount > 0) {
            console.log('[Reward] Cleanup: Deleted', deletedCount, 'expired purchases');
        }
        
    } catch (err) {
        console.error('[Reward] Cleanup error:', err);
    }
}

// ===== RESET EXPIRED CYCLES =====
async function resetExpiredCycles() {
    if (!REWARD_DB) return;
    
    try {
        const { collection, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const today = getIndiaTime();
        const cyclesRef = collection(REWARD_DB, 'rewards_cycles');
        const cyclesDocs = await getDocs(cyclesRef);
        
        let resetCount = 0;
        
        for (const cycleDoc of cyclesDocs.docs) {
            const data = cycleDoc.data();
            const cycleEnd = new Date(data.cycleEnd + 'T23:59:59');
            
            // If cycle end date has passed, reset the cycle
            if (today > cycleEnd) {
                const mobile = cycleDoc.id;
                
                // Delete old purchases
                const purchasesRef = collection(REWARD_DB, 'rewards_purchases', mobile, 'orders');
                const purchasesDocs = await getDocs(purchasesRef);
                
                for (const purchaseDoc of purchasesDocs.docs) {
                    await deleteDoc(purchaseDoc.ref);
                }
                
                // Delete cycle record
                await deleteDoc(cycleDoc.ref);
                
                resetCount++;
            }
        }
        
        if (resetCount > 0) {
            console.log('[Reward] Cycles reset:', resetCount, 'expired');
        }
        
    } catch (err) {
        console.error('[Reward] Reset error:', err);
    }
}

// ===== SCHEDULED CLEANUP (Runs at midnight IST daily) =====
let CLEANUP_SCHEDULED = false;

function scheduleCleanup() {
    if (CLEANUP_SCHEDULED) return;
    CLEANUP_SCHEDULED = true;
    
    function checkAndClean() {
        const now = getIndiaTime();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Run cleanup at 12:05 AM IST
        if (hour === 0 && minute >= 5 && minute <= 6) {
            cleanupExpiredPurchases();
            resetExpiredCycles();
        }
    }
    
    // Check every minute
    setInterval(checkAndClean, 60000);
}

// Export for use
window._rewardSystem = {
    init: initRewardSystem,
    verifyMobile: verifyMobileLogin,
    recordPurchase: recordPurchase,
    getEligibility: getUserEligibility,
    claimCoupon: claimCoupon,
    scheduleCleanup: scheduleCleanup,
    getTodayDate: getTodayDateIST,
    getIndiaTime: getIndiaTime
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initRewardSystem().then(() => scheduleCleanup());
    });
} else {
    initRewardSystem().then(() => scheduleCleanup());
}

console.log('[Reward] System ready.');
