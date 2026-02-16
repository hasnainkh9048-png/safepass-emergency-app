// ========== AUTHENTICATION FUNCTIONS ==========

// Handle Login
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    
    // Show loading
    loginBtn.disabled = true;
    loginBtn.querySelector('span').style.display = 'none';
    loginBtn.querySelector('.loading-spinner-small').style.display = 'inline';
    errorDiv.textContent = '';
    
    // Set persistence
    const persistence = rememberMe ? 
        firebase.auth.Auth.Persistence.LOCAL : 
        firebase.auth.Auth.Persistence.SESSION;
    
    auth.setPersistence(persistence)
        .then(() => {
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then((userCredential) => {
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        })
        .catch((error) => {
            let errorMessage = 'Login failed. ';
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage += 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email format.';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'This account has been disabled.';
                    break;
                default:
                    errorMessage += error.message;
            }
            errorDiv.textContent = errorMessage;
            showNotification(errorMessage, 'error');
        })
        .finally(() => {
            loginBtn.disabled = false;
            loginBtn.querySelector('span').style.display = 'inline';
            loginBtn.querySelector('.loading-spinner-small').style.display = 'none';
        });
}

// Handle Registration
function handleRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('phone').value;
    const terms = document.getElementById('terms').checked;
    const registerBtn = document.getElementById('registerBtn');
    const errorDiv = document.getElementById('registerError');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }
    
    // Validate terms
    if (!terms) {
        errorDiv.textContent = 'You must agree to the terms';
        return;
    }
    
    // Show loading
    registerBtn.disabled = true;
    registerBtn.querySelector('span').style.display = 'none';
    registerBtn.querySelector('.loading-spinner-small').style.display = 'inline';
    errorDiv.textContent = '';
    
    // Create user
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update profile
            return userCredential.user.updateProfile({
                displayName: fullName
            }).then(() => {
                // Create user document in Firestore
                return db.collection('users').doc(userCredential.user.uid).set({
                    fullName: fullName,
                    email: email,
                    phone: phone,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    emergencyInfo: {
                        personal: {},
                        medical: {},
                        contacts: []
                    }
                });
            });
        })
        .then(() => {
            showNotification('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        })
        .catch((error) => {
            let errorMessage = 'Registration failed. ';
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage += 'Email already registered.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email format.';
                    break;
                case 'auth/weak-password':
                    errorMessage += 'Password should be at least 6 characters.';
                    break;
                default:
                    errorMessage += error.message;
            }
            errorDiv.textContent = errorMessage;
            showNotification(errorMessage, 'error');
        })
        .finally(() => {
            registerBtn.disabled = false;
            registerBtn.querySelector('span').style.display = 'inline';
            registerBtn.querySelector('.loading-spinner-small').style.display = 'none';
        });
}

// Handle Logout
function logout() {
    auth.signOut()
        .then(() => {
            // Clear local emergency data
            localStorage.removeItem('emergencyData');
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        })
        .catch((error) => {
            showNotification('Error logging out', 'error');
        });
}

// Check Auth State on Dashboard
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            document.getElementById('userEmail').textContent = user.email;
            loadUserData(user.uid);
        } else {
            // No user, redirect to login
            window.location.href = 'login.html';
        }
    });
}

// Forgot Password
document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = prompt('Enter your email address:');
    if (email) {
        auth.sendPasswordResetEmail(email)
            .then(() => {
                alert('Password reset email sent! Check your inbox.');
            })
            .catch((error) => {
                alert('Error: ' + error.message);
            });
    }
});

// Initialize on dashboard
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', checkAuth);
}