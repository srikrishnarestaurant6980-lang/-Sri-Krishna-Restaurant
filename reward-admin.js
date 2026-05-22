// reward-admin.js — Reward System Admin Dashboard
// ================================================
// Handles:
//   - View pending reward claims
//   - View claimed rewards
//   - Approve/reject claims
//   - Customer purchase history
//   - Real-time notifications
// ================================================

'use strict';

const REWARD_ADMIN = {
    db: null,
    currentView: 'pending', // pending, claimed, all
    notificationCount: 0
};

// ===== INIT =====
async function initRewardAdmin() {
    try {
        REWARD_ADMIN.db = window.db || (window._adminDB);
        
        if (!REWARD_ADMIN.db) {
            console.warn('[Reward Admin] Firebase DB not available');
            return false;
        }
        
        console.log('[Reward Admin] Initialized');
        return true;
    } catch (err) {
        console.error('[Reward Admin] Init error:', err);
        return false;
    }
}

// ===== FETCH PENDING CLAIMS =====
async function getPendingClaims() {
    if (!REWARD_ADMIN.db) return [];
    
    try {
        const { collection, getDocs, query, where, orderBy } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const claimsRef = collection(REWARD_ADMIN.db, 'rewards_claims');
        const q = query(
            claimsRef,
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const claims = [];
        
        snapshot.forEach(doc => {
            claims.push({ id: doc.id, ...doc.data() });
        });
        
        REWARD_ADMIN.notificationCount = claims.length;
        return claims;
        
    } catch (err) {
        console.error('[Reward Admin] Fetch error:', err);
        return [];
    }
}

// ===== FETCH CLAIMED CLAIMS =====
async function getClaimedClaims(limit = 50) {
    if (!REWARD_ADMIN.db) return [];
    
    try {
        const { collection, getDocs, query, where, orderBy, limit: queryLimit } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const claimsRef = collection(REWARD_ADMIN.db, 'rewards_claims');
        const q = query(
            claimsRef,
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc'),
            queryLimit(limit)
        );
        
        const snapshot = await getDocs(q);
        const claims = [];
        
        snapshot.forEach(doc => {
            claims.push({ id: doc.id, ...doc.data() });
        });
        
        return claims;
        
    } catch (err) {
        console.error('[Reward Admin] Fetch error:', err);
        return [];
    }
}

// ===== GET CUSTOMER PURCHASE HISTORY =====
async function getCustomerPurchases(mobileNumber) {
    if (!REWARD_ADMIN.db) return { purchases: [], cycle: null };
    
    try {
        const { doc, getDoc, collection, getDocs } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        // Get cycle info
        const cycleDocRef = doc(REWARD_ADMIN.db, 'rewards_cycles', mobileNumber);
        const cycleSnap = await getDoc(cycleDocRef);
        
        // Get purchases
        const purchasesRef = collection(REWARD_ADMIN.db, 'rewards_purchases', mobileNumber, 'orders');
        const purchasesSnap = await getDocs(purchasesRef);
        
        const purchases = [];
        purchasesSnap.forEach(docSnap => {
            purchases.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        return {
            purchases: purchases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            cycle: cycleSnap.exists() ? cycleSnap.data() : null
        };
        
    } catch (err) {
        console.error('[Reward Admin] Purchase history error:', err);
        return { purchases: [], cycle: null };
    }
}

// ===== UPDATE CLAIM STATUS =====
async function updateClaimStatus(claimId, status, adminNotes = '') {
    if (!REWARD_ADMIN.db) return false;
    
    try {
        const { doc, updateDoc, serverTimestamp } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const claimDocRef = doc(REWARD_ADMIN.db, 'rewards_claims', claimId);
        
        await updateDoc(claimDocRef, {
            status: status,
            adminNotes: adminNotes,
            updatedAt: serverTimestamp()
        });
        
        console.log('[Reward Admin] Claim updated:', claimId, status);
        return true;
        
    } catch (err) {
        console.error('[Reward Admin] Update error:', err);
        return false;
    }
}

// ===== SEARCH CLAIMS BY MOBILE =====
async function searchClaimsByMobile(mobileNumber) {
    if (!REWARD_ADMIN.db) return [];
    
    try {
        const { collection, getDocs, query, where } = 
            await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const claimsRef = collection(REWARD_ADMIN.db, 'rewards_claims');
        const q = query(claimsRef, where('mobile', '==', mobileNumber));
        
        const snapshot = await getDocs(q);
        const claims = [];
        
        snapshot.forEach(doc => {
            claims.push({ id: doc.id, ...doc.data() });
        });
        
        return claims.sort((a, b) => new Date(b.claimTime) - new Date(a.claimTime));
        
    } catch (err) {
        console.error('[Reward Admin] Search error:', err);
        return [];
    }
}

// ===== CREATE ADMIN DASHBOARD SECTION =====
function createRewardAdminSection() {
    if (document.getElementById('reward-admin-section')) {
        return;
    }
    
    const section = document.createElement('section');
    section.id = 'reward-admin-section';
    section.className = 'reward-admin-section';
    section.innerHTML = `
        <div class="reward-admin-container">
            <div class="reward-admin-header">
                <div class="reward-admin-title">
                    <h3>
                        <i class="fas fa-gifts"></i>
                        Reward Management
                    </h3>
                </div>
                <div class="reward-admin-tabs">
                    <button class="reward-admin-tab active" data-view="pending">
                        Pending
                        <span class="reward-tab-badge" id="pending-badge">0</span>
                    </button>
                    <button class="reward-admin-tab" data-view="claimed">
                        Approved
                        <span class="reward-tab-badge">0</span>
                    </button>
                </div>
            </div>
            
            <div class="reward-admin-search">
                <input 
                    type="text" 
                    id="reward-search-mobile"
                    class="reward-search-input"
                    placeholder="Search by mobile number..."
                    inputmode="tel"
                    maxlength="10"
                >
                <button class="reward-search-btn">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            
            <div id="reward-claims-view" class="reward-claims-list">
                <div class="reward-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading claims...
                </div>
            </div>
        </div>
    `;
    
    // Find insertion point in admin dashboard
    const dashboard = document.querySelector('[role="main"]') || document.body;
    const ordersSection = document.getElementById('orders-section');
    
    if (ordersSection) {
        ordersSection.parentElement.insertBefore(section, ordersSection.nextElementSibling);
    } else {
        dashboard.appendChild(section);
    }
    
    setupRewardAdminListeners();
}

// ===== SETUP ADMIN LISTENERS =====
function setupRewardAdminListeners() {
    const tabs = document.querySelectorAll('.reward-admin-tab');
    const searchInput = document.getElementById('reward-search-mobile');
    const searchBtn = document.querySelector('.reward-search-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadRewardClaimsView(view);
        });
    });
    
    searchBtn?.addEventListener('click', handleRewardSearch);
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRewardSearch();
    });
    
    // Auto format mobile
    searchInput?.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 10) val = val.slice(0, 10);
        e.target.value = val;
    });
}

// ===== LOAD CLAIMS VIEW =====
async function loadRewardClaimsView(view = 'pending') {
    REWARD_ADMIN.currentView = view;
    const claimsView = document.getElementById('reward-claims-view');
    
    claimsView.innerHTML = '<div class="reward-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    try {
        let claims = [];
        
        if (view === 'pending') {
            claims = await getPendingClaims();
        } else if (view === 'claimed') {
            claims = await getClaimedClaims();
        }
        
        if (claims.length === 0) {
            claimsView.innerHTML = `
                <div class="reward-empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No ${view} claims</p>
                </div>
            `;
            return;
        }
        
        claimsView.innerHTML = '';
        claims.forEach(claim => {
            const claimElement = createClaimCard(claim);
            claimsView.appendChild(claimElement);
        });
        
    } catch (err) {
        console.error('[Reward Admin] Load error:', err);
        claimsView.innerHTML = '<div class="reward-error">Error loading claims</div>';
    }
}

// ===== CREATE CLAIM CARD =====
function createClaimCard(claim) {
    const div = document.createElement('div');
    div.className = 'reward-claim-card';
    
    const claimTime = new Date(claim.claimTime).toLocaleString('en-IN');
    const statusClass = `status-${claim.status}`;
    
    div.innerHTML = `
        <div class="reward-claim-header">
            <div class="reward-claim-customer">
                <h4>${claim.customerName}</h4>
                <p class="reward-mobile">${claim.mobile}</p>
            </div>
            <span class="reward-claim-status ${statusClass}">
                ${claim.status.toUpperCase()}
            </span>
        </div>
        
        <div class="reward-claim-details">
            <div class="reward-detail-row">
                <span class="reward-label">Coupon Value:</span>
                <span class="reward-value">₹${claim.couponValue}</span>
            </div>
            <div class="reward-detail-row">
                <span class="reward-label">Total Spent:</span>
                <span class="reward-value">₹${claim.totalAmount}</span>
            </div>
            <div class="reward-detail-row">
                <span class="reward-label">Claimed:</span>
                <span class="reward-value">${claimTime}</span>
            </div>
            <div class="reward-detail-row">
                <span class="reward-label">Claim ID:</span>
                <span class="reward-claim-id">${claim.claimId}</span>
            </div>
        </div>
        
        ${claim.status === 'pending' ? `
            <div class="reward-claim-actions">
                <button class="reward-action-btn approve" data-claim-id="${claim.claimId}">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="reward-action-btn reject" data-claim-id="${claim.claimId}">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="reward-action-btn view-history" data-mobile="${claim.mobile}">
                    <i class="fas fa-history"></i> History
                </button>
            </div>
        ` : `
            <div class="reward-claim-actions">
                <button class="reward-action-btn view-history" data-mobile="${claim.mobile}">
                    <i class="fas fa-history"></i> View History
                </button>
            </div>
        `}
    `;
    
    // Setup action listeners
    div.querySelector('.approve')?.addEventListener('click', () => {
        approveClaimDialog(claim.claimId, claim.mobile);
    });
    
    div.querySelector('.reject')?.addEventListener('click', () => {
        rejectClaimDialog(claim.claimId, claim.mobile);
    });
    
    div.querySelector('.view-history')?.addEventListener('click', () => {
        showCustomerHistory(claim.mobile);
    });
    
    return div;
}

// ===== APPROVE CLAIM DIALOG =====
function approveClaimDialog(claimId, mobile) {
    const modal = createActionModal(
        'Approve Reward Claim?',
        `This will approve the reward claim and notify the customer.`,
        [
            { text: 'Approve', action: () => approveClaimAction(claimId, mobile), primary: true },
            { text: 'Cancel', action: () => closeActionModal() }
        ]
    );
    modal.classList.add('open');
}

// ===== REJECT CLAIM DIALOG =====
function rejectClaimDialog(claimId, mobile) {
    const modal = createActionModal(
        'Reject Claim?',
        `Are you sure you want to reject this claim?`,
        [
            { text: 'Reject', action: () => rejectClaimAction(claimId, mobile), primary: false },
            { text: 'Cancel', action: () => closeActionModal() }
        ]
    );
    modal.classList.add('open');
}

// ===== APPROVE CLAIM ACTION =====
async function approveClaimAction(claimId, mobile) {
    const result = await updateClaimStatus(claimId, 'approved', 'Approved by admin');
    closeActionModal();
    
    if (result) {
        showRewardToast('✅ Claim approved');
        loadRewardClaimsView(REWARD_ADMIN.currentView);
    } else {
        showRewardToast('❌ Error updating claim');
    }
}

// ===== REJECT CLAIM ACTION =====
async function rejectClaimAction(claimId, mobile) {
    const result = await updateClaimStatus(claimId, 'rejected', 'Rejected by admin');
    closeActionModal();
    
    if (result) {
        showRewardToast('❌ Claim rejected');
        loadRewardClaimsView(REWARD_ADMIN.currentView);
    } else {
        showRewardToast('Error updating claim');
    }
}

// ===== CREATE ACTION MODAL =====
let actionModalElement = null;

function createActionModal(title, message, actions) {
    if (!actionModalElement) {
        actionModalElement = document.createElement('div');
        actionModalElement.className = 'reward-action-modal';
        document.body.appendChild(actionModalElement);
    }
    
    let buttonsHTML = actions.map(action => `
        <button class="reward-modal-btn ${action.primary ? 'primary' : ''}">
            ${action.text}
        </button>
    `).join('');
    
    actionModalElement.innerHTML = `
        <div class="reward-action-modal-overlay">
            <div class="reward-action-modal-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="reward-modal-buttons">
                    ${buttonsHTML}
                </div>
            </div>
        </div>
    `;
    
    const buttons = actionModalElement.querySelectorAll('.reward-modal-btn');
    buttons.forEach((btn, idx) => {
        btn.addEventListener('click', () => actions[idx].action());
    });
    
    return actionModalElement;
}

function closeActionModal() {
    if (actionModalElement) {
        actionModalElement.classList.remove('open');
    }
}

// ===== SHOW CUSTOMER HISTORY =====
async function showCustomerHistory(mobile) {
    const { purchases, cycle } = await getCustomerPurchases(mobile);
    
    let historyHTML = `
        <div class="reward-history-modal">
            <div class="reward-history-header">
                <h3>Purchase History - ${mobile}</h3>
                <button class="reward-close-history" onclick="this.closest('.reward-history-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="reward-history-content">
    `;
    
    if (cycle) {
        historyHTML += `
            <div class="reward-history-cycle">
                <h4>Current Cycle</h4>
                <p>Start: ${cycle.cycleStart}</p>
                <p>End: ${cycle.cycleEnd}</p>
                <p><strong>Total: ₹${cycle.totalAmount}</strong></p>
                <p>Days Remaining: ${cycle.daysRemaining}</p>
            </div>
        `;
    }
    
    if (purchases.length > 0) {
        historyHTML += '<h4>Orders</h4><div class="reward-orders-list">';
        purchases.forEach(p => {
            const date = new Date(p.timestamp).toLocaleString('en-IN');
            historyHTML += `
                <div class="reward-order-item">
                    <span>${date}</span>
                    <span class="reward-order-amount">₹${p.amount}</span>
                </div>
            `;
        });
        historyHTML += '</div>';
    } else {
        historyHTML += '<p class="reward-no-data">No purchases</p>';
    }
    
    historyHTML += '</div></div>';
    
    const modal = document.createElement('div');
    modal.innerHTML = historyHTML;
    document.body.appendChild(modal.firstElementChild);
}

// ===== HANDLE SEARCH =====
async function handleRewardSearch() {
    const searchInput = document.getElementById('reward-search-mobile');
    const mobile = searchInput.value.trim();
    
    if (!mobile || mobile.length !== 10) {
        alert('Enter valid 10-digit mobile');
        return;
    }
    
    const claimsView = document.getElementById('reward-claims-view');
    claimsView.innerHTML = '<div class="reward-loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    
    try {
        const claims = await searchClaimsByMobile(mobile);
        
        if (claims.length === 0) {
            claimsView.innerHTML = '<div class="reward-empty-state"><i class="fas fa-inbox"></i><p>No claims found</p></div>';
            return;
        }
        
        claimsView.innerHTML = '';
        claims.forEach(claim => {
            claimsView.appendChild(createClaimCard(claim));
        });
        
    } catch (err) {
        claimsView.innerHTML = '<div class="reward-error">Search error</div>';
    }
}

// ===== SHOW TOAST =====
function showRewardToast(message) {
    const toast = document.createElement('div');
    toast.className = 'reward-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== INJECT ADMIN STYLES =====
function injectRewardAdminStyles() {
    if (document.getElementById('reward-admin-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'reward-admin-styles';
    style.textContent = `
    /* ===== REWARD ADMIN STYLES ===== */
    
    .reward-admin-section {
        background: #fff;
        border-radius: 14px;
        padding: 20px;
        margin: 20px 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .reward-admin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 16px;
    }
    
    .reward-admin-title h3 {
        font-size: 1.2rem;
        font-weight: 700;
        color: #1a1a1a;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .reward-admin-tabs {
        display: flex;
        gap: 8px;
    }
    
    .reward-admin-tab {
        padding: 8px 16px;
        border-radius: 8px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9rem;
    }
    
    .reward-admin-tab:hover {
        background: #f3f4f6;
    }
    
    .reward-admin-tab.active {
        background: linear-gradient(135deg, #e65100, #bf360c);
        color: #fff;
        border-color: transparent;
    }
    
    .reward-tab-badge {
        background: #dc2626;
        color: #fff;
        padding: 2px 6px;
        border-radius: 50%;
        font-size: 0.75rem;
        min-width: 20px;
        text-align: center;
    }
    
    .reward-admin-search {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
    }
    
    .reward-search-input {
        flex: 1;
        padding: 10px 14px;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.2s;
    }
    
    .reward-search-input:focus {
        border-color: #e65100;
    }
    
    .reward-search-btn {
        padding: 10px 16px;
        background: linear-gradient(135deg, #e65100, #bf360c);
        color: #fff;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
    }
    
    .reward-search-btn:hover {
        box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
    }
    
    .reward-claims-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .reward-loading, .reward-empty-state, .reward-error {
        padding: 40px 20px;
        text-align: center;
        color: #6b7280;
    }
    
    .reward-loading i {
        font-size: 1.5rem;
        margin-right: 10px;
    }
    
    .reward-claim-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        transition: all 0.2s;
    }
    
    .reward-claim-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .reward-claim-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .reward-claim-customer h4 {
        font-size: 1rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 4px;
    }
    
    .reward-mobile {
        font-size: 0.85rem;
        color: #6b7280;
        font-weight: 600;
    }
    
    .reward-claim-status {
        padding: 4px 12px;
        border-radius: 50px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    
    .reward-claim-status.status-pending {
        background: #fef3c7;
        color: #92400e;
    }
    
    .reward-claim-status.status-approved {
        background: #dcfce7;
        color: #166534;
    }
    
    .reward-claim-status.status-rejected {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .reward-claim-details {
        margin-bottom: 16px;
    }
    
    .reward-detail-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 0.9rem;
    }
    
    .reward-label {
        color: #6b7280;
        font-weight: 500;
    }
    
    .reward-value {
        color: #1a1a1a;
        font-weight: 700;
    }
    
    .reward-claim-id {
        font-family: 'Courier New', monospace;
        font-size: 0.75rem;
        background: #fff;
        padding: 2px 6px;
        border-radius: 4px;
    }
    
    .reward-claim-actions {
        display: flex;
        gap: 8px;
    }
    
    .reward-action-btn {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #fff;
        color: #1a1a1a;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    
    .reward-action-btn:hover {
        background: #f3f4f6;
    }
    
    .reward-action-btn.approve {
        background: #dcfce7;
        border-color: #86efac;
        color: #166534;
    }
    
    .reward-action-btn.approve:hover {
        background: #bbf7d0;
    }
    
    .reward-action-btn.reject {
        background: #fee2e2;
        border-color: #fca5a5;
        color: #991b1b;
    }
    
    .reward-action-btn.reject:hover {
        background: #fecaca;
    }
    
    .reward-action-modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 16px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
    }
    
    .reward-action-modal.open {
        opacity: 1;
        pointer-events: all;
    }
    
    .reward-action-modal-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
    }
    
    .reward-action-modal-content {
        position: relative;
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .reward-action-modal-content h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 10px;
        color: #1a1a1a;
    }
    
    .reward-action-modal-content p {
        font-size: 0.9rem;
        color: #6b7280;
        margin-bottom: 20px;
    }
    
    .reward-modal-buttons {
        display: flex;
        gap: 10px;
    }
    
    .reward-modal-btn {
        flex: 1;
        padding: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #fff;
        color: #1a1a1a;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .reward-modal-btn:hover {
        background: #f9fafb;
    }
    
    .reward-modal-btn.primary {
        background: linear-gradient(135deg, #e65100, #bf360c);
        color: #fff;
        border-color: transparent;
    }
    
    .reward-modal-btn.primary:hover {
        box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
    }
    
    .reward-history-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        border-radius: 12px;
        max-width: 500px;
        width: calc(100% - 32px);
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 10000;
    }
    
    .reward-history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .reward-history-header h3 {
        font-size: 1.1rem;
        font-weight: 700;
    }
    
    .reward-close-history {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #6b7280;
    }
    
    .reward-history-content {
        padding: 20px;
    }
    
    .reward-history-cycle {
        background: #f0f9ff;
        border: 1px solid #bfdbfe;
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 20px;
    }
    
    .reward-history-cycle h4 {
        font-weight: 700;
        margin-bottom: 8px;
        font-size: 0.95rem;
    }
    
    .reward-history-cycle p {
        font-size: 0.85rem;
        margin: 4px 0;
    }
    
    .reward-orders-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .reward-order-item {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        background: #f9fafb;
        border-radius: 8px;
        font-size: 0.9rem;
    }
    
    .reward-order-amount {
        font-weight: 700;
        color: #e65100;
    }
    
    .reward-no-data {
        text-align: center;
        color: #9ca3af;
        padding: 20px;
    }
    
    .reward-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(120px);
        background: #1a1a1a;
        color: #fff;
        padding: 12px 20px;
        border-radius: 50px;
        font-weight: 600;
        font-size: 0.9rem;
        z-index: 9999;
        transition: transform 0.3s;
    }
    
    .reward-toast.show {
        transform: translateX(-50%) translateY(0);
    }
    
    @media (max-width: 768px) {
        .reward-admin-header {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .reward-admin-tabs {
            width: 100%;
        }
        
        .reward-claim-header {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .reward-claim-actions {
            flex-wrap: wrap;
        }
    }
    `;
    
    document.head.appendChild(style);
}

// ===== INIT ADMIN UI =====
async function initRewardAdminUI() {
    injectRewardAdminStyles();
    
    const ready = await initRewardAdmin();
    if (!ready) {
        console.warn('[Reward Admin] Cannot initialize - DB not available');
        return;
    }
    
    createRewardAdminSection();
    loadRewardClaimsView('pending');
}

// Export
window._rewardAdmin = {
    init: initRewardAdminUI,
    loadView: loadRewardClaimsView,
    getPendingClaims: getPendingClaims
};

console.log('[Reward Admin] Ready.');
