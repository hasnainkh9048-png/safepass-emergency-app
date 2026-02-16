// auth.js - SafePass Authentication (FIXED VERSION)

// Wait for Firebase to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Auth.js loaded');
});

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('loginError');
        
        loginBtn.disabled = true;
        loginBtn.innerHTML = '⏳ Logging in...';
        if (errorDiv) errorDiv.textContent = '';
        
        try {
            // Set persistence to LOCAL to stay logged in
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            console.log('✅ Login successful:', userCredential.user.email);
            
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Login error:', error);
            let message = 'Login failed. ';
            switch(error.code) {
                case 'auth/user-not-found':
                    message += 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    message += 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    message += 'Invalid email format.';
                    break;
                case 'auth/too-many-requests':
                    message += 'Too many attempts. Try again later.';
                    break;
                default:
                    message += error.message;
            }
            if (errorDiv) errorDiv.textContent = message;
            showNotification(message, 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Login';
        }
    });
}

// Handle Registration
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;
        const registerBtn = document.getElementById('registerBtn');
        const errorDiv = document.getElementById('registerError');
        
        if (password !== confirmPassword) {
            if (errorDiv) errorDiv.textContent = 'Passwords do not match';
            return;
        }
        
        if (!terms) {
            if (errorDiv) errorDiv.textContent = 'You must agree to terms';
            return;
        }
        
        registerBtn.disabled = true;
        registerBtn.innerHTML = '⏳ Creating account...';
        if (errorDiv) errorDiv.textContent = '';
        
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: fullName });
            
            // Create user document in Firestore
            await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
                fullName,
                email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                emergencyInfo: {
                    personal: { 
                        fullName: fullName 
                    },
                    medical: {},
                    contacts: []
                }
            });
            
            console.log('✅ Registration successful:', userCredential.user.email);
            showNotification('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Registration error:', error);
            let message = 'Registration failed. ';
            switch(error.code) {
                case 'auth/email-already-in-use':
                    message += 'Email already registered.';
                    break;
                case 'auth/weak-password':
                    message += 'Password should be at least 6 characters.';
                    break;
                case 'auth/invalid-email':
                    message += 'Invalid email format.';
                    break;
                default:
                    message += error.message;
            }
            if (errorDiv) errorDiv.textContent = message;
            showNotification(message, 'error');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = 'Create Account';
        }
    });
}

// Show notification function
function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.style.background = type === 'error' ? '#dc3545' : 
                                type === 'success' ? '#28a745' : '#d32f2f';
        toast.style.color = type === 'warning' ? '#333' : 'white';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
        alert(message);
    }
}

// Make showNotification global
window.showNotification = showNotification;
