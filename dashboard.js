// ========== DASHBOARD FUNCTIONS ==========

let currentUser = null;
let userData = {
    personal: {},
    medical: {},
    contacts: []
};

// Load user data
async function loadUserData(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        
        if (doc.exists) {
            userData = doc.data().emergencyInfo || {
                personal: {},
                medical: {},
                contacts: []
            };
            
            // Populate forms
            populateForms(userData);
            updatePreview(userData);
            setupContactForms(userData.contacts);
            
            // Cache locally
            localStorage.setItem('emergencyData', JSON.stringify(userData));
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error loading your data', 'error');
    }
}

// Populate forms with user data
function populateForms(data) {
    // Personal info
    if (data.personal) {
        document.getElementById('fullName').value = data.personal.fullName || '';
        document.getElementById('dob').value = data.personal.dob || '';
        document.getElementById('gender').value = data.personal.gender || 'Male';
        document.getElementById('cnic').value = data.personal.cnic || '';
        document.getElementById('address').value = data.personal.address || '';
        document.getElementById('nationality').value = data.personal.nationality || 'Pakistani';
        document.getElementById('language').value = data.personal.language || 'Urdu';
    }
    
    // Medical info
    if (data.medical) {
        document.getElementById('bloodGroup').value = data.medical.bloodGroup || 'O+';
        document.getElementById('allergies').value = data.medical.allergies?.join(', ') || '';
        document.getElementById('conditions').value = data.medical.conditions?.join(', ') || '';
        document.getElementById('medications').value = data.medical.medications?.join(', ') || '';
        document.getElementById('surgeries').value = data.medical.surgeries?.join(', ') || '';
        document.getElementById('organDonor').checked = data.medical.organDonor || false;
        document.getElementById('insuranceProvider').value = data.medical.insuranceProvider || '';
        document.getElementById('insuranceNumber').value = data.medical.insuranceNumber || '';
        document.getElementById('physician').value = data.medical.physician || '';
        document.getElementById('hospital').value = data.medical.hospital || '';
        document.getElementById('specialNotes').value = data.medical.specialNotes || '';
    }
}

// Update preview card
function updatePreview(data) {
    document.getElementById('previewName').textContent = data.personal?.fullName || 'Not set';
    document.getElementById('previewBlood').textContent = data.medical?.bloodGroup || '-';
    document.getElementById('previewAllergies').textContent = 
        data.medical?.allergies?.length ? data.medical.allergies.join(', ') : 'None';
}

// Save personal information
async function savePersonalInfo(event) {
    event.preventDefault();
    
    const user = auth.currentUser;
    if (!user) return;
    
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
        await db.collection('users').doc(user.uid).set({
            emergencyInfo: {
                ...userData,
                personal: personalData
            }
        }, { merge: true });
        
        userData.personal = personalData;
        updatePreview(userData);
        localStorage.setItem('emergencyData', JSON.stringify(userData));
        
        showNotification('Personal information saved!', 'success');
    } catch (error) {
        console.error('Error saving:', error);
        showNotification('Error saving information', 'error');
    }
}

// Save medical information
async function saveMedicalInfo() {
    const user = auth.currentUser;
    if (!user) return;
    
    const medicalData = {
        bloodGroup: document.getElementById('bloodGroup').value,
        allergies: document.getElementById('allergies').value.split(',').map(s => s.trim()).filter(s => s),
        conditions: document.getElementById('conditions').value.split(',').map(s => s.trim()).filter(s => s),
        medications: document.getElementById('medications').value.split(',').map(s => s.trim()).filter(s => s),
        surgeries: document.getElementById('surgeries').value.split(',').map(s => s.trim()).filter(s => s),
        organDonor: document.getElementById('organDonor').checked,
        insuranceProvider: document.getElementById('insuranceProvider').value,
        insuranceNumber: document.getElementById('insuranceNumber').value,
        physician: document.getElementById('physician').value,
        hospital: document.getElementById('hospital').value,
        specialNotes: document.getElementById('specialNotes').value,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('users').doc(user.uid).set({
            emergencyInfo: {
                ...userData,
                medical: medicalData
            }
        }, { merge: true });
        
        userData.medical = medicalData;
        updatePreview(userData);
        localStorage.setItem('emergencyData', JSON.stringify(userData));
        
        showNotification('Medical information saved!', 'success');
    } catch (error) {
        console.error('Error saving:', error);
        showNotification('Error saving information', 'error');
    }
}

// Add contact form
function addContact() {
    const container = document.getElementById('contactsContainer');
    const contactId = Date.now();
    
    const contactForm = document.createElement('div');
    contactForm.className = 'contact-form';
    contactForm.dataset.id = contactId;
    contactForm.innerHTML = `
        <button class="remove-contact" onclick="removeContact(this)">✕</button>
        <div class="form-group">
            <label>Full Name</label>
            <input type="text" class="contact-name" placeholder="Contact name" required>
        </div>
        <div class="form-group">
            <label>Relationship</label>
            <input type="text" class="contact-relation" placeholder="e.g., Wife, Brother, Father">
        </div>
        <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" class="contact-phone" placeholder="+92 XXX XXXXXXX" required>
        </div>
        <div class="form-group">
            <label>Priority (1 = Primary)</label>
            <input type="number" class="contact-priority" min="1" value="1">
        </div>
    `;
    
    container.appendChild(contactForm);
}

// Remove contact
function removeContact(btn) {
    if (confirm('Remove this contact?')) {
        btn.closest('.contact-form').remove();
    }
}

// Setup contact forms
function setupContactForms(contacts) {
    const container = document.getElementById('contactsContainer');
    container.innerHTML = '';
    
    if (contacts && contacts.length > 0) {
        contacts.sort((a, b) => a.priority - b.priority).forEach(contact => {
            const contactForm = document.createElement('div');
            contactForm.className = 'contact-form';
            contactForm.innerHTML = `
                <button class="remove-contact" onclick="removeContact(this)">✕</button>
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" class="contact-name" value="${contact.name}" required>
                </div>
                <div class="form-group">
                    <label>Relationship</label>
                    <input type="text" class="contact-relation" value="${contact.relation || ''}">
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" class="contact-phone" value="${contact.phone}" required>
                </div>
                <div class="form-group">
                    <label>Priority</label>
                    <input type="number" class="contact-priority" value="${contact.priority || 1}" min="1">
                </div>
            `;
            container.appendChild(contactForm);
        });
    }
}

// Save all contacts
async function saveAllContacts() {
    const user = auth.currentUser;
    if (!user) return;
    
    const contactForms = document.querySelectorAll('.contact-form');
    const contacts = [];
    
    contactForms.forEach((form, index) => {
        const name = form.querySelector('.contact-name')?.value;
        const relation = form.querySelector('.contact-relation')?.value;
        const phone = form.querySelector('.contact-phone')?.value;
        const priority = form.querySelector('.contact-priority')?.value;
        
        if (name && phone) {
            contacts.push({
                name: name,
                relation: relation || 'Contact',
                phone: phone,
                priority: parseInt(priority) || index + 1
            });
        }
    });
    
    try {
        await db.collection('users').doc(user.uid).set({
            emergencyInfo: {
                ...userData,
                contacts: contacts
            }
        }, { merge: true });
        
        userData.contacts = contacts;
        localStorage.setItem('emergencyData', JSON.stringify(userData));
        
        showNotification('Contacts saved!', 'success');
    } catch (error) {
        console.error('Error saving contacts:', error);
        showNotification('Error saving contacts', 'error');
    }
}

// Switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Change password
function changePassword() {
    const user = auth.currentUser;
    if (!user) return;
    
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (newPassword && newPassword.length >= 6) {
        user.updatePassword(newPassword)
            .then(() => {
                showNotification('Password updated successfully!', 'success');
            })
            .catch((error) => {
                showNotification('Error: ' + error.message, 'error');
            });
    }
}

// Change theme
function changeTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
    } else {
        // System default
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
}

// Export data
function exportData() {
    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emergency-id-backup.json';
    a.click();
    
    showNotification('Data exported successfully!', 'success');
}

// Delete account
async function deleteAccount() {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL your data! Are you sure?')) {
        return;
    }
    
    if (!confirm('Type "DELETE" to confirm:')) {
        return;
    }
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Delete user document
        await db.collection('users').doc(user.uid).delete();
        // Delete auth account
        await user.delete();
        
        localStorage.removeItem('emergencyData');
        showNotification('Account deleted', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Error deleting account', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    
    toast.style.background = type === 'error' ? '#dc3545' : 
                            type === 'warning' ? '#ffc107' : 
                            type === 'success' ? '#28a745' : '#d32f2f';
    toast.style.color = type === 'warning' ? '#333' : 'white';
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Make functions global
window.switchTab = switchTab;
window.addContact = addContact;
window.removeContact = removeContact;
window.savePersonalInfo = savePersonalInfo;
window.saveMedicalInfo = saveMedicalInfo;
window.saveAllContacts = saveAllContacts;
window.changePassword = changePassword;
window.changeTheme = changeTheme;
window.exportData = exportData;
window.deleteAccount = deleteAccount;