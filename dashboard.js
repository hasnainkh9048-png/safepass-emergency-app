// dashboard.js - SafePass Dashboard (COMPLETE WORKING VERSION)

// Global variables
let currentUser = null;
let userData = {
    personal: {},
    medical: {},
    contacts: []
};

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            document.getElementById('userEmail').textContent = user.email;
            loadUserData(user.uid);
        } else {
            window.location.href = 'login.html';
        }
    });
});

// Load user data from Firestore
async function loadUserData(userId) {
    try {
        const doc = await firebase.firestore().collection('users').doc(userId).get();
        
        if (doc.exists) {
            userData = doc.data().emergencyInfo || { personal: {}, medical: {}, contacts: [] };
            
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
                document.getElementById('bloodGroup').value = userData.medical.bloodGroup || 'O+';
                document.getElementById('allergies').value = (userData.medical.allergies || []).join(', ');
                document.getElementById('conditions').value = (userData.medical.conditions || []).join(', ');
                document.getElementById('medications').value = (userData.medical.medications || []).join(', ');
                document.getElementById('organDonor').checked = userData.medical.organDonor || false;
            }
            
            // Update preview
            updatePreview(userData);
            
            // Setup contacts
            setupContactForms(userData.contacts || []);
            
            // Cache for lock screen
            localStorage.setItem('safepass_data', JSON.stringify(userData));
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data', 'error');
    }
}

// Update preview card
function updatePreview(data) {
    document.getElementById('previewName').textContent = data.personal?.fullName || 'Not set';
    document.getElementById('previewBlood').textContent = data.medical?.bloodGroup || '-';
    document.getElementById('previewAllergies').textContent = 
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
    
    if (!currentUser) {
        showNotification('Please login again', 'error');
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
        showNotification('Error saving data', 'error');
    }
};

// Save Medical Info
window.saveMedicalInfo = async function() {
    if (!currentUser) {
        showNotification('Please login again', 'error');
        return;
    }
    
    const medicalData = {
        bloodGroup: document.getElementById('bloodGroup').value,
        allergies: document.getElementById('allergies').value.split(',').map(s => s.trim()).filter(s => s),
        conditions: document.getElementById('conditions').value.split(',').map(s => s.trim()).filter(s => s),
        medications: document.getElementById('medications').value.split(',').map(s => s.trim()).filter(s => s),
        surgeries: document.getElementById('surgeries')?.value ? 
            document.getElementById('surgeries').value.split(',').map(s => s.trim()).filter(s => s) : [],
        organDonor: document.getElementById('organDonor').checked,
        insuranceProvider: document.getElementById('insuranceProvider')?.value || '',
        insuranceNumber: document.getElementById('insuranceNumber')?.value || '',
        physician: document.getElementById('physician')?.value || '',
        hospital: document.getElementById('hospital')?.value || '',
        specialNotes: document.getElementById('specialNotes')?.value || '',
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
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
        showNotification('Error saving data', 'error');
    }
};

// Add Contact Form
window.addContact = function() {
    const container = document.getElementById('contactsContainer');
    const contactId = Date.now();
    
    const div = document.createElement('div');
    div.className = 'contact-form';
    div.dataset.id = contactId;
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
        <div class="form-group">
            <label>Priority</label>
            <input type="number" class="contact-priority" value="1" min="1">
        </div>
    `;
    container.appendChild(div);
};

// Setup contact forms
function setupContactForms(contacts) {
    const container = document.getElementById('contactsContainer');
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
                <div class="form-group">
                    <label>Priority</label>
                    <input type="number" class="contact-priority" value="${contact.priority || 1}" min="1">
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
        return;
    }
    
    const contacts = [];
    document.querySelectorAll('.contact-form').forEach(form => {
        const name = form.querySelector('.contact-name')?.value;
        const relation = form.querySelector('.contact-relation')?.value;
        const phone = form.querySelector('.contact-phone')?.value;
        const priority = form.querySelector('.contact-priority')?.value;
        
        if (name && phone) {
            contacts.push({
                name: name,
                relation: relation || 'Contact',
                phone: phone,
                priority: parseInt(priority) || 1
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
            showNotification('Logged out', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        })
        .catch((error) => {
            showNotification('Error logging out', 'error');
        });
};

// Show notification
function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#dc3545' : 
                            type === 'success' ? '#28a745' : '#d32f2f';
    toast.style.color = type === 'warning' ? '#333' : 'white';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Make functions globally available
window.saveMedicalInfo = saveMedicalInfo;
window.addContact = addContact;
window.saveAllContacts = saveAllContacts;
window.exportData = exportData;
window.logout = logout;
