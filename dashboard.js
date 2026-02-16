// dashboard.js - SafePass Dashboard (FIXED VERSION)

// Global variables
let currentUser = null;
let userData = {
    personal: {},
    medical: {},
    contacts: []
};

// Check authentication immediately when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard.js loaded, checking auth...');
    checkAuth();
});

// Check authentication state
function checkAuth() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log('✅ User authenticated:', user.email);
            currentUser = user;
            document.getElementById('userEmail').textContent = user.email;
            loadUserData(user.uid);
        } else {
            console.log('❌ No user authenticated, redirecting to login');
            window.location.href = 'login.html';
        }
    });
}

// Load user data from Firestore
async function loadUserData(userId) {
    try {
        console.log('Loading user data for:', userId);
        const doc = await firebase.firestore().collection('users').doc(userId).get();
        
        if (doc.exists) {
            userData = doc.data().emergencyInfo || { 
                personal: {}, 
                medical: {}, 
                contacts: [] 
            };
            console.log('✅ User data loaded:', userData);
            
            // Fill personal info
            if (userData.personal) {
                document.getElementById('fullName').value = userData.personal.fullName || '';
                document.getElementById('dob').value = userData.personal.dob || '';
                document.getElementById('gender').value = userData.personal.gender || 'Male';
                document.getElementById('cnic').value = userData.personal.cnic || '';
                document.getElementById('address').value = userData.personal.address || '';
                document.getElementById('nationality').value = userData.personal.nationality || 'Pakistani';
                document.getElementById('language').value = userData.personal.language || 'Urdu';
            }
            
            // Fill medical info
            if (userData.medical) {
                document.getElementById('bloodGroup').value = userData.medical.bloodGroup || 'A+';
                document.getElementById('allergies').value = (userData.medical.allergies || []).join(', ');
                document.getElementById('conditions').value = (userData.medical.conditions || []).join(', ');
                document.getElementById('medications').value = (userData.medical.medications || []).join(', ');
                
                const organDonor = document.getElementById('organDonor');
                if (organDonor) organDonor.checked = userData.medical.organDonor || false;
            }
            
            // Update preview
            updatePreview(userData);
            
            // Setup contacts
            if (userData.contacts) {
                setupContactForms(userData.contacts);
            }
            
            // Cache for lock screen
            localStorage.setItem('safepass_data', JSON.stringify(userData));
            
        } else {
            console.log('No user document found, creating...');
            // Create default document
            await firebase.firestore().collection('users').doc(userId).set({
                email: currentUser.email,
                emergencyInfo: {
                    personal: {},
                    medical: {},
                    contacts: []
                }
            });
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data', 'error');
    }
}

// Update preview card
function updatePreview(data) {
    const previewName = document.getElementById('previewName');
    const previewBlood = document.getElementById('previewBlood');
    const previewAllergies = document.getElementById('previewAllergies');
    
    if (previewName) previewName.textContent = data.personal?.fullName || 'Not set';
    if (previewBlood) previewBlood.textContent = data.medical?.bloodGroup || '-';
    if (previewAllergies) previewAllergies.textContent = 
        (data.medical?.allergies || []).join(', ') || 'None';
}

// Switch tabs
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
};

// Save Personal Info
window.savePersonalInfo = async function(event) {
    event.preventDefault();
    
    // Check if user is authenticated
    if (!currentUser) {
        console.log('No current user found');
        showNotification('Please login again', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    const personalData = {
        fullName: document.getElementById('fullName').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        cnic: document.getElementById('cnic').value,
        address: document.getElementById('address').value,
        nationality: document.getElementById('nationality').value,
        language: document.getElementById('language').value,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        console.log('Saving personal data for:', currentUser.uid);
        await firebase.firestore().collection('users').doc(currentUser.uid).set({
            emergencyInfo: {
                ...userData,
                personal: personalData
            }
        }, { merge: true });
        
        userData.personal = personalData;
        updatePreview(userData);
        localStorage.setItem('safepass_data', JSON.stringify(userData));
        
        showNotification('✅ Personal info saved!', 'success');
    } catch (error) {
        console.error('Error saving:', error);
        showNotification('Error saving data: ' + error.message, 'error');
    }
};

// Save Medical Info
window.saveMedicalInfo = async function() {
    // Check if user is authenticated
    if (!currentUser) {
        console.log('No current user found');
        showNotification('Please login again', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    const medicalData = {
        bloodGroup: document.getElementById('bloodGroup').value,
        allergies: document.getElementById('allergies').value.split(',').map(s => s.trim()).filter(s => s),
        conditions: document.getElementById('conditions').value.split(',').map(s => s.trim()).filter(s => s),
        medications: document.getElementById('medications').value.split(',').map(s => s.trim()).filter(s => s),
        organDonor: document.getElementById('organDonor')?.checked || false,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        console.log('Saving medical data for:', currentUser.uid);
        await firebase.firestore().collection('users').doc(currentUser.uid).set({
            emergencyInfo: {
                ...userData,
                medical: medicalData
            }
        }, { merge: true });
        
        userData.medical = medicalData;
        updatePreview(userData);
        localStorage.setItem('safepass_data', JSON.stringify(userData));
        
        showNotification('✅ Medical info saved!', 'success');
    } catch (error) {
        console.error('Error saving:', error);
        showNotification('Error saving data: ' + error.message, 'error');
    }
};

// Add Contact Form
window.addContact = function() {
    const container = document.getElementById('contactsContainer');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'contact-form';
    div.innerHTML = `
        <button class="remove-contact" onclick="this.parentElement.remove()">✕</button>
        <div class="form-group">
            <label>Full Name</label>
            <input type="text" class="contact-name" placeholder="Contact name" required>
        </div>
        <div class="form-group">
            <label>Relationship</label>
            <input type="text" class="contact-relation" placeholder="e.g., Wife, Brother">
        </div>
        <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" class="contact-phone" placeholder="+92 XXX XXXXXXX" required>
        </div>
    `;
    container.appendChild(div);
};

// Setup contact forms
function setupContactForms(contacts) {
    const container = document.getElementById('contactsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (contacts && contacts.length > 0) {
        contacts.forEach(contact => {
            const div = document.createElement('div');
            div.className = 'contact-form';
            div.innerHTML = `
                <button class="remove-contact" onclick="this.parentElement.remove()">✕</button>
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" class="contact-name" value="${contact.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Relationship</label>
                    <input type="text" class="contact-relation" value="${contact.relation || ''}">
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" class="contact-phone" value="${contact.phone || ''}" required>
                </div>
            `;
            container.appendChild(div);
        });
    }
}

// Save All Contacts
window.saveAllContacts = async function() {
    if (!currentUser) {
        showNotification('Please login again', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    const contacts = [];
    document.querySelectorAll('.contact-form').forEach(form => {
        const name = form.querySelector('.contact-name')?.value;
        const relation = form.querySelector('.contact-relation')?.value;
        const phone = form.querySelector('.contact-phone')?.value;
        
        if (name && phone) {
            contacts.push({
                name: name,
                relation: relation || 'Contact',
                phone: phone
            });
        }
    });
    
    try {
        await firebase.firestore().collection('users').doc(currentUser.uid).set({
            emergencyInfo: {
                ...userData,
                contacts: contacts
            }
        }, { merge: true });
        
        userData.contacts = contacts;
        localStorage.setItem('safepass_data', JSON.stringify(userData));
        
        showNotification('✅ Contacts saved!', 'success');
    } catch (error) {
        console.error('Error saving contacts:', error);
        showNotification('Error saving contacts', 'error');
    }
};

// Export Data
window.exportData = function() {
    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'safepass-backup.json';
    a.click();
    
    showNotification('✅ Data exported!', 'success');
};

// Logout
window.logout = function() {
    firebase.auth().signOut()
        .then(() => {
            localStorage.removeItem('safepass_data');
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        })
        .catch((error) => {
            console.error('Logout error:', error);
            showNotification('Error logging out', 'error');
        });
};

// Show notification
function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.log(message);
        return;
    }
    
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#dc3545' : 
                            type === 'success' ? '#28a745' : '#d32f2f';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
