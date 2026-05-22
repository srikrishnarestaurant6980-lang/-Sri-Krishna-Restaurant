// reward-ui.js — Reward System UI Components
// ===========================================
// Handles:
//   - Daily login modal (mobile number verification)
//   - Eligibility status display
//   - Claim button & workflow
//   - Reward status notifications
// ===========================================

'use strict';

const REWARD_UI = {
    modalOpen: false,
    isProcessing: false,
    sessionMobile: nulla
};

// ===== CREATE & INJECT LOGIN MODAL =====
function createLoginModal() {
    if (document.getElementById('reward-login-modal')) {
        return; // Already exists
    }

    const modal = document.createElement('div');
    modal.id = 'reward-login-modal';
    modal.className = 'reward-modal-overlay';
    modal.innerHTML = `
        <div class="reward-modal-content">
            <div class="reward-modal-header">
                <h3>Verify to Continue</h3>
                <p>Enter your mobile number to check your reward status</p>
            </div>
            
            <div class="reward-modal-body">
                <form id="reward-login-form" novalidate>
                    <div class="reward-form-group">
                        <label for="reward-mobile">Mobile Number</label>
                        <input 
                            type="tel" 
                            id="reward-mobile" 
                            name="mobile"
                            class="reward-form-input"
                            placeholder="10-digit mobile number"
                            inputmode="tel"
                            maxlength="10"
                            autofocus
                            required
                        >
                        <small class="reward-help-text">Format: 10 digits starting with 6-9</small>
                    </div>
                    
                    <div class="reward-alert reward-alert-error" id="reward-login-error" style="display:none;">
                        <i class="fas fa-exclamation-circle"></i>
                        <span id="reward-error-text">Error message</span>
                    </div>
                    
                    <button type="submit" class="reward-btn reward-btn-primary reward-btn-full" id="reward-submit-btn">
                        <span id="reward-submit-text">Continue</span>
                        <i class="fas fa-arrow-right" id="reward-submit-icon" style="display:none;"></i>
                    </button>
                </form>
            </div>
            
            <div class="reward-modal-footer">
                <button type="button" class="reward-btn reward-btn-ghost" id="reward-modal-close">
                    Skip for now
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setupLoginModalListeners();
}

// ===== SETUP LOGIN MODAL LISTENERS =====
function setupLoginModalListeners() {
    const form = document.getElementById('reward-login-form');
    const mobileInput = document.getElementById('reward-mobile');
    const submitBtn = document.getElementById('reward-submit-btn');
    const errorDiv = document.getElementById('reward-login-error');
    const errorText = document.getElementById('reward-error-text');
    const closeBtn = document.getElementById('reward-modal-close');
    
    // Auto format mobile number
    mobileInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 10) val = val.slice(0, 10);
        e.target.value = val;
    });
    
    // Clear error on input
    mobileInput.addEventListener('input', () => {
        errorDiv.style.display = 'none';
    });
    
    // Form submit
    form.addEventListener('submit', handleLoginSubmit);
    
    // Close button
    closeBtn.addEventListener('click', () => {
        closeLoginModal();
        // Store skip preference for 24 hours
        const today = window._rewardSystem.getTodayDate();
        sessionStorage.setItem('rewardLoginSkipped', today);
    });
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    if (REWARD_UI.isProcessing) return;
    
    const mobileInput = document.getElementById('reward-mobile');
    const submitBtn = document.getElementById('reward-submit-btn');
    const errorDiv = document.getElementById('reward-login-error');
    const errorText = document.getElementById('reward-error-text');
    
    const mobile = mobileInput.value.trim();
    
    if (!mobile || mobile.length !== 10) {
        errorText.textContent = 'Please enter a valid 10-digit mobile number.';
        errorDiv.style.display = 'flex';
        mobileInput.focus();
        return;
    }
    
    REWARD_UI.isProcessing = true;
    submitBtn.disabled = true;
    
    try {
        const result = await window._rewardSystem.verifyMobile(mobile);
        
        if (result.success) {
            REWARD_UI.sessionMobile = mobile;
            sessionStorage.setItem('rewardSessionMobile', mobile);
            closeLoginModal();
            await showRewardStatus(mobile);
        } else {
            errorText.textContent = result.error || 'Verification failed. Please try again.';
            errorDiv.style.display = 'flex';
        }
    } catch (err) {
        console.error('[Reward UI] Login error:', err);
        errorText.textContent = 'An error occurred. Please try again.';
        errorDiv.style.display = 'flex';
    } finally {
        REWARD_UI.isProcessing = false;
        submitBtn.disabled = false;
    }
}

// ===== LOGIN MODAL VISIBILITY =====
function showLoginModal() {
    const modal = document.getElementById('reward-login-modal');
    if (!modal) {
        createLoginModal();
    }
    const modalElem = document.getElementById('reward-login-modal');
    if (modalElem) {
        modalElem.classList.add('open');
        REWARD_UI.modalOpen = true;
        document.getElementById('reward-mobile').focus();
    }
}

function closeLoginModal() {
    const modal = document.getElementById('reward-login-modal');
    if (modal) {
        modal.classList.remove('open');
        REWARD_UI.modalOpen = false;
    }
}

// ===== SHOW REWARD STATUS =====
async function showRewardStatus(mobile) {
    try {
        const eligibility = await window._rewardSystem.getEligibility(mobile);
        
        const statusDiv = getOrCreateRewardStatusDiv();
        
        if (eligibility.eligible) {
            statusDiv.innerHTML = `
                <div class="reward-status reward-status-eligible">
                    <div class="reward-status-icon">
                        <i class="fas fa-gift"></i>
                    </div>
                    <div class="reward-status-content">
                        <h4>🎉 You're Eligible!</h4>
                        <p>Total Spent: ₹${eligibility.totalAmount}</p>
                        <p>Reward: ₹${eligibility.couponValue} coupon</p>
                        <p class="reward-countdown">
                            <i class="fas fa-clock"></i>
                            ${eligibility.daysRemaining} days remaining
                        </p>
                    </div>
                    <button class="reward-btn reward-btn-primary" id="claim-reward-btn">
                        <i class="fas fa-gift"></i> Claim Now
                    </button>
                </div>
            `;
            
            document.getElementById('claim-reward-btn').addEventListener('click', () => {
                claimReward(mobile, eligibility.customerName);
            });
        } else {
            const daysToEligibility = Math.max(
                1, 
                Math.ceil((1000 - eligibility.totalAmount) / 500) // Estimate days to ₹1000
            );
            
            statusDiv.innerHTML = `
                <div class="reward-status reward-status-ineligible">
                    <div class="reward-status-icon">
                        <i class="fas fa-hourglass-half"></i>
                    </div>
                    <div class="reward-status-content">
                        <h4>Keep Shopping!</h4>
                        <p>Current Spent: ₹${eligibility.totalAmount}</p>
                        <p>Need: ₹${Math.max(0, 1000 - eligibility.totalAmount)} more for ₹50 coupon</p>
                        <p class="reward-reason">${eligibility.reason || 'Place more orders to unlock rewards'}</p>
                    </div>
                </div>
            `;
        }
        
        statusDiv.classList.add('show');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            statusDiv.classList.remove('show');
        }, 10000);
        
    } catch (err) {
        console.error('[Reward UI] Status error:', err);
    }
}

// ===== GET OR CREATE STATUS DIV =====
function getOrCreateRewardStatusDiv() {
    let statusDiv = document.getElementById('reward-status-display');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'reward-status-display';
        statusDiv.className = 'reward-status-display';
        document.body.appendChild(statusDiv);
    }
    return statusDiv;
}

// ===== CLAIM REWARD =====
async function claimReward(mobile, customerName) {
    const statusDiv = document.getElementById('reward-status-display');
    const claimBtn = document.getElementById('claim-reward-btn');
    
    if (claimBtn) {
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    try {
        const result = await window._rewardSystem.claimCoupon(mobile, customerName);
        
        if (result.success) {
            statusDiv.innerHTML = `
                <div class="reward-status reward-status-claimed">
                    <div class="reward-status-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="reward-status-content">
                        <h4>🎊 Reward Claimed!</h4>
                        <p>Your ₹${result.couponValue} coupon has been approved.</p>
                        <p>Admin will contact you shortly.</p>
                        <p class="reward-claim-id">Claim ID: ${result.claimId}</p>
                    </div>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="reward-status reward-status-error">
                    <div class="reward-status-icon">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="reward-status-content">
                        <h4>Unable to Claim</h4>
                        <p>${result.error || 'Please try again later'}</p>
                    </div>
                </div>
            `;
        }
        
    } catch (err) {
        console.error('[Reward UI] Claim error:', err);
        statusDiv.innerHTML = `
            <div class="reward-status reward-status-error">
                <div class="reward-status-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="reward-status-content">
                    <h4>Error</h4>
                    <p>Could not process claim. Please try again.</p>
                </div>
            </div>
        `;
    } finally {
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim Now';
        }
    }
}

// ===== CHECK IF LOGIN NEEDED =====
async function checkAndShowLoginModal() {
    // Check if already logged in this session
    const sessionMobile = sessionStorage.getItem('rewardSessionMobile');
    if (sessionMobile) {
        REWARD_UI.sessionMobile = sessionMobile;
        return;
    }
    
    // Check if skipped today
    const today = window._rewardSystem.getTodayDate();
    const skipped = sessionStorage.getItem('rewardLoginSkipped');
    if (skipped === today) {
        return;
    }
    
    // Show login modal
    showLoginModal();
}

// ===== FLOATING REWARD BUTTON (Optional) =====
function createFloatingRewardButton() {
    if (document.getElementById('floating-reward-btn')) {
        return;
    }
    
    const btn = document.createElement('button');
    btn.id = 'floating-reward-btn';
    btn.className = 'floating-reward-btn';
    btn.innerHTML = '<i class="fas fa-star"></i>';
    btn.title = 'Check your reward status';
    btn.addEventListener('click', () => {
        if (REWARD_UI.sessionMobile) {
            showRewardStatus(REWARD_UI.sessionMobile);
        } else {
            showLoginModal();
        }
    });
    
    document.body.appendChild(btn);
}

// ===== INJECT CSS =====
function injectRewardStyles() {
    if (document.getElementById('reward-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'reward-styles';
    style.textContent = `
    /* ===== REWARD SYSTEM STYLES ===== */
    
    .reward-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        padding: 16px;
    }
    
    .reward-modal-overlay.open {
        opacity: 1;
        pointer-events: all;
    }
    
    .reward-modal-content {
        background: #fff;
        border-radius: 16px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        animation: reward-slide-up 0.3s ease;
    }
    
    @keyframes reward-slide-up {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .reward-modal-header {
        padding: 24px;
        background: linear-gradient(135deg, #e65100, #bf360c);
        color: #fff;
        text-align: center;
    }
    
    .reward-modal-header h3 {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 6px;
    }
    
    .reward-modal-header p {
        font-size: 0.9rem;
        opacity: 0.9;
    }
    
    .reward-modal-body {
        padding: 24px;
    }
    
    .reward-form-group {
        margin-bottom: 20px;
    }
    
    .reward-form-group label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 8px;
    }
    
    .reward-form-input {
        width: 100%;
        padding: 12px 14px;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 1rem;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .reward-form-input:focus {
        border-color: #e65100;
        box-shadow: 0 0 0 4px rgba(230, 81, 0, 0.1);
    }
    
    .reward-help-text {
        display: block;
        font-size: 0.8rem;
        color: #6b7280;
        margin-top: 6px;
    }
    
    .reward-alert {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 10px;
        margin-bottom: 16px;
        font-size: 0.85rem;
        line-height: 1.4;
    }
    
    .reward-alert-error {
        background: #fef2f2;
        border: 1.5px solid #fca5a5;
        color: #dc2626;
    }
    
    .reward-btn {
        padding: 12px 16px;
        border-radius: 10px;
        border: none;
        font-size: 0.95rem;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        touch-action: manipulation;
    }
    
    .reward-btn-primary {
        background: linear-gradient(135deg, #e65100, #bf360c);
        color: #fff;
        box-shadow: 0 4px 14px rgba(230, 81, 0, 0.3);
    }
    
    .reward-btn-primary:hover:not(:disabled) {
        box-shadow: 0 6px 20px rgba(230, 81, 0, 0.4);
        transform: translateY(-1px);
    }
    
    .reward-btn-primary:active:not(:disabled) {
        transform: scale(0.97);
    }
    
    .reward-btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .reward-btn-ghost {
        background: transparent;
        color: #6b7280;
        border: 1px solid #e5e7eb;
    }
    
    .reward-btn-ghost:hover {
        background: #f9fafb;
        color: #1a1a1a;
    }
    
    .reward-btn-full {
        width: 100%;
    }
    
    .reward-modal-footer {
        padding: 12px 24px 20px;
        text-align: center;
    }
    
    .reward-status-display {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-120px);
        max-width: calc(100vw - 40px);
        z-index: 9998;
        transition: transform 0.3s ease;
    }
    
    .reward-status-display.show {
        transform: translateX(-50%) translateY(0);
    }
    
    .reward-status {
        background: #fff;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: flex;
        gap: 14px;
        align-items: flex-start;
    }
    
    .reward-status-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;
    }
    
    .reward-status-eligible .reward-status-icon {
        background: #dcfce7;
        color: #16a34a;
    }
    
    .reward-status-ineligible .reward-status-icon {
        background: #dbeafe;
        color: #2563eb;
    }
    
    .reward-status-claimed .reward-status-icon {
        background: #dcfce7;
        color: #16a34a;
    }
    
    .reward-status-error .reward-status-icon {
        background: #fef2f2;
        color: #dc2626;
    }
    
    .reward-status-content {
        flex: 1;
    }
    
    .reward-status-content h4 {
        font-size: 1rem;
        font-weight: 700;
        margin-bottom: 6px;
        color: #1a1a1a;
    }
    
    .reward-status-content p {
        font-size: 0.85rem;
        color: #6b7280;
        margin-bottom: 4px;
    }
    
    .reward-countdown, .reward-reason, .reward-claim-id {
        font-weight: 600;
        color: #1a1a1a !important;
        margin-top: 8px;
    }
    
    .floating-reward-btn {
        position: fixed;
        bottom: 90px;
        right: 16px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #e65100, #bf360c);
        color: #fff;
        border: 3px solid #fff;
        font-size: 1.2rem;
        cursor: pointer;
        z-index: 998;
        box-shadow: 0 4px 20px rgba(230, 81, 0, 0.4);
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .floating-reward-btn:hover {
        box-shadow: 0 6px 24px rgba(230, 81, 0, 0.5);
        transform: scale(1.05);
    }
    
    .floating-reward-btn:active {
        transform: scale(0.95);
    }
    
    @media (max-width: 480px) {
        .reward-modal-content {
            max-width: 100%;
        }
        
        .reward-status {
            flex-direction: column;
        }
        
        .reward-status-display {
            left: 12px;
            right: 12px;
            max-width: none;
        }
    }
    `;
    
    document.head.appendChild(style);
}

// ===== INIT UI =====
async function initRewardUI() {
    // Inject styles first
    injectRewardStyles();
    
    // Wait for reward system to be ready
    if (!window._rewardSystem) {
        console.warn('[Reward UI] System not ready, waiting...');
        return setTimeout(initRewardUI, 500);
    }
    
    // Create modal
    createLoginModal();
    
    // Create floating button
    createFloatingRewardButton();
    
    // Check and show login if needed
    await checkAndShowLoginModal();
}

// ===== AUTO INIT =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRewardUI);
} else {
    initRewardUI();
}

// Export for use
window._rewardUI = {
    showLoginModal: showLoginModal,
    closeLoginModal: closeLoginModal,
    showRewardStatus: showRewardStatus,
    claimReward: claimReward
};

console.log('[Reward UI] Ready.');
