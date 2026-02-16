// auth.js - SafePass Authentication

// Handle Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    
    loginBtn.disabled = true;
    loginBtn.querySelector('span').style.display = 'none';
    loginBtn.querySelector('.loading-spinner-small').style.display = 'inline';
    errorDiv.textContent = '';
    
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
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
            default:
                message += error.message;
        }
        errorDiv.textContent = message;
        showNotification(message, 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.querySelector('span').style.display = 'inline';
        loginBtn.querySelector('.loading-spinner-small').style.display = 'none';
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
        errorDiv.textContent = 'You must agree to the terms';
        return;
    }
    
    registerBtn.disabled = true;
    registerBtn.querySelector('span').style.display = 'none';
    registerBtn.querySelector('.loading-spinner-small').style.display = 'inline';
    errorDiv.textContent = '';
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: fullName });
        
        await db.collection('users').doc(userCredential.user.uid).set({
            fullName,
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            emergencyInfo: {
                personal: { fullName },
                medical: {},
                contacts: []
            }
        });
        
        showNotification('Registration successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        let message = 'Registration failed. ';
        switch(error.code) {
            case 'auth/email-already-in-use':
                message += 'Email already registered.';
                break;
            case 'auth/invalid-email':
                message += 'Invalid email format.';
                break;
            case 'auth/weak-password':
                message += 'Password should be at least 6 characters.';
                break;
            default:
                message += error.message;
        }
        errorDiv.textContent = message;
        showNotification(message, 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.querySelector('span').style.display = 'inline';
        registerBtn.querySelector('.loading-spinner-small').style.display = 'none';
    }
});

// Logout function
window.logout = function() {
    auth.signOut()
        .then(() => {
            localStorage.removeItem('safepass_data');
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        })
        .catch(() => {
            showNotification('Error logging out', 'error');
        });
};

// Check auth state on dashboard
if (window.location.pathname.includes('dashboard.html')) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('userEmail').textContent = user.email;
            loadUserData(user.uid);
        } else {
            window.location.href = 'login.html';
        }
    });
}

// Load user data for dashboard
async function loadUserData(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            const userData = doc.data().emergencyInfo || { personal: {}, medical: {}, contacts: [] };
            window.userData = userData;
            
            // Populate forms
            if (userData.personal) {
                document.getElementById('fullName').value = userData.personal.fullName || '';
                document.getElementById('dob').value = userData.personal.dob || '';
                document.getElementById('gender').value = userData.personal.gender || 'Male';
                document.getElementById('cnic').value = userData.personal.cnic || '';
                document.getElementById('address').value = userData.personal.address || '';
                document.getElementById('nationality').value = userData.personal.nationality || 'Pakistani';
                document.getElementById('language').value = userData.personal.language || 'Urdu';
            }
            
            if (userData.medical) {
                document.getElementById('bloodGroup').value = userData.medical.bloodGroup || 'O+';
                document.getElementById('allergies').value = userData.medical.allergies?.join(', ') || '';
                document.getElementById('conditions').value = userData.medical.conditions?.join(', ') || '';
                document.getElementById('medications').value = userData.medical.medications?.join(', ') || '';
                document.getElementById('organDonor').checked = userData.medical.organDonor || false;
            }
            
            // Update preview
            document.getElementById('previewName').textContent = userData.personal?.fullName || 'Not set';
            document.getElementById('previewBlood').textContent = userData.medical?.bloodGroup || '-';
            document.getElementById('previewAllergies').textContent = userData.medical?.allergies?.join(', ') || 'None';
            
            // Setup contacts
            setupContactForms(userData.contacts || []);
            
            // Cache data for lock screen
            localStorage.setItem('safepass_data', JSON.stringify(userData));
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error loading data', 'error');
    }
}

function showNotification(message, type) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.style.background = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#d32f2f';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
        alert(message);
    }
}