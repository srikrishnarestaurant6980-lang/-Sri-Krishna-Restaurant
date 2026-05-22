// admin-login.js — Sri Krishna Hotel Admin Panel
// Handles Firebase sign-in, validation, and UI state
// No credentials are hardcoded here.

'use strict';

// ===== DOM =====
const loginForm     = document.getElementById('login-form');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin      = document.getElementById('btn-login');
const btnIcon       = document.getElementById('btn-icon');
const btnText       = document.getElementById('btn-text');
const errorAlert    = document.getElementById('error-alert');
const errorText     = document.getElementById('error-text');
const toggleBtn     = document.getElementById('toggle-password');
const toggleIcon    = document.getElementById('toggle-icon');
const toast         = document.getElementById('toast');
const toastMsg      = document.getElementById('toast-message');
const toastIcon     = document.getElementById('toast-icon');

// ===== STATE =====
let isSubmitting    = false;
let passwordVisible = false;

// ===== FORM SUBMIT =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    // Client-side validation
    if (!email) {
        showError('Please enter your email address.');
        emailInput.focus();
        return;
    }
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        emailInput.focus();
        return;
    }
    if (!password) {
        showError('Please enter your password.');
        passwordInput.focus();
        return;
    }
    if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        passwordInput.focus();
        return;
    }

    setLoading(true);
    hideError();

    try {
        const auth   = window._adminAuth;
        const signIn = window._adminSignIn;

        if (!auth || !signIn) {
            throw new Error('Authentication not ready. Please refresh the page.');
        }

        const credential = await signIn(auth, email, password);
        const user = credential.user;

        // Save lightweight session metadata (NOT used as auth — Firebase handles that)
        saveSessionMeta(user);

        showToast('✅ Signed in! Redirecting…', 'success');

        setTimeout(() => {
            window.location.replace('dashboard.html');
        }, 800);

    } catch (err) {
        setLoading(false);
        handleFirebaseError(err);
    }
});

// Clear errors while typing
emailInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);

// ===== PASSWORD VISIBILITY TOGGLE =====
toggleBtn.addEventListener('click', () => {
    passwordVisible = !passwordVisible;
    passwordInput.type = passwordVisible ? 'text' : 'password';
    toggleIcon.className = passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye';
});

// ===== LOADING STATE =====
function setLoading(on) {
    isSubmitting       = on;
    btnLogin.disabled  = on;

    if (on) {
        btnIcon.className = 'fas fa-circle-notch spinning';
        btnText.textContent = 'Signing in…';
    } else {
        btnIcon.className = 'fas fa-sign-in-alt';
        btnText.textContent = 'Sign In';
    }
}

// ===== ERROR DISPLAY =====
function showError(message) {
    errorText.textContent = message;
    errorAlert.classList.add('show');
}

function hideError() {
    errorAlert.classList.remove('show');
}

// ===== FIREBASE ERROR MAPPING =====
function handleFirebaseError(err) {
    console.error('[Admin Login] Auth error:', err.code, err.message);

    const map = {
        'auth/user-not-found':         'No account found with this email. Contact the restaurant owner.',
        'auth/wrong-password':         'Incorrect password. Please try again.',
        'auth/invalid-credential':     'Invalid email or password. Please check and try again.',
        'auth/invalid-email':          'The email address is not valid.',
        'auth/user-disabled':          'This admin account has been disabled.',
        'auth/too-many-requests':      'Too many failed attempts. Please wait a few minutes and try again.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/operation-not-allowed':  'Email/password login is not enabled. Contact the restaurant owner.',
    };

    const msg = map[err.code] || err.message || 'Login failed. Please try again.';
    showError(msg);
}

// ===== TOAST =====
let toastTimer = null;

function showToast(message, type = 'default') {
    clearTimeout(toastTimer);
    toastMsg.textContent = message;
    toast.className = 'toast show ' + type;

    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== VALIDATION =====
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== SESSION METADATA =====
// Stores non-sensitive info for display purposes.
// Real auth is always validated via onAuthStateChanged in dashboard.
function saveSessionMeta(user) {
    try {
        localStorage.setItem('sriKrishnaAdminMeta', JSON.stringify({
            uid:         user.uid,
            email:       user.email,
            displayName: user.displayName || '',
            loginAt:     new Date().toISOString()
        }));
    } catch (_) {
        // Non-critical, ignore
    }
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Esc → clear error
    if ((e.key === 'Escape' || e.key === 'Esc') && errorAlert.classList.contains('show')) {
        hideError();
    }
});

console.log('[Admin Login] Ready.');
