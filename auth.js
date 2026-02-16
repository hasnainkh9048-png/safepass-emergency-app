// auth.js - SafePass Authentication

// Handle Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '⏳ Logging in...';
    errorDiv.textContent = '';
    
    try {
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        showNotification('Login successful!');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        let message = 'Login failed. ';
        switch(error.code) {
            case 'auth/user-not-found':
                message += 'No account found.';
                break;
            case 'auth/wrong-password':
                message += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                message += 'Invalid email.';
                break;
            default:
                message += error.message;
        }
        errorDiv.textContent = message;
        showNotification(message, 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Login';
    }
});

// Handle Registration
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    const registerBtn = document.getElementById('registerBtn');
    const errorDiv = document.getElementById('registerError');
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }
    
    if (!terms) {
        errorDiv.textContent = 'You must agree to terms';
        return;
    }
    
    registerBtn.disabled = true;
    registerBtn.innerHTML = '⏳ Creating account...';
    errorDiv.textContent = '';
    
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: fullName });
        
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
            fullName,
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            emergencyInfo: {
                personal: { fullName },
                medical: {},
                contacts: []
            }
        });
        
        showNotification('Registration successful!');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        let message = 'Registration failed. ';
        switch(error.code) {
            case 'auth/email-already-in-use':
                message += 'Email already registered.';
                break;
            case 'auth/weak-password':
                message += 'Password too weak.';
                break;
            default:
                message += error.message;
        }
        errorDiv.textContent = message;
        showNotification(message, 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = 'Create Account';
    }
});

// Show notification function
function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.style.background = type === 'error' ? '#dc3545' : '#28a745';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
        alert(message);
    }
}
