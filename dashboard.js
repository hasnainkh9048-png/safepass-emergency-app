// dashboard.js - SafePass Dashboard

// Tab switching
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
};

// Save personal info
document.getElementById('personalForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) return;
    
    const personalData = {
        fullName: document.getElementById('fullName').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        cnic: document.getElementById('cnic').value,
        address: document.getElementById('address').value,
        nationality: document.getElementById('nationality').value,
        language: document.getElementById('language').value
    };
    
    try {
        await db.collection('users').doc(user.uid).set({
            emergencyInfo: {
                ...window.userData,
                personal: personalData
            }
        }, { merge: true });
        
        window.userData.personal = personalData;
        localStorage.setItem('safepass_data', JSON.stringify(window.userData));
        
        document.getElementById('previewName').textContent = personalData.fullName || 'Not set';
        showNotification('Personal info saved!', 'success');
    } catch (error) {
        showNotification('Error saving data', 'error');
    }
});

// Save medical info
window.saveMedicalInfo = async function() {
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
        specialNotes: document.getElementById('specialNotes').value
    };
    
    try {
        await db.collection('users').doc(user.uid).set({
            emergencyInfo: {
                ...window.userData,
                medical: medicalData
            }
        }, { merge: true });
        
        window.userData.medical = medicalData;
        localStorage.setItem('safepass_data', JSON.stringify(window.userData));
        
        document.getElementById('previewBlood').textContent = medicalData.bloodGroup || '-';
        document.getElementById('previewAllergies').textContent = medicalData.allergies?.join(', ') || 'None';
        showNotification('Medical info saved!', 'success');
    } catch (error) {
        showNotification('Error saving data', 'error');
    }
};

// Add contact form
window.addContact = function() {
    const container = document.getElementById('contactsContainer');
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
    container.innerHTML = '';
    
    contacts.forEach(contact => {
        const div = document.createElement('div');
        div.className = 'contact-form';
        div.innerHTML = `
            <button class="remove-contact" onclick="this.parentElement.remove()">✕</button>
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
        `;
        container.appendChild(div);
    });
}

// Save all contacts
window.saveAllContacts = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    const contacts = [];
    document.querySelectorAll('.contact-form').forEach(form => {
        const name = form.querySelector('.contact-name')?.value;
        const relation = form.querySelector('.contact-relation')?.value;
        const phone = form.querySelector('.contact-phone')?.value;
        if (name && phone) {
            contacts.push({ name, relation: relation || 'Contact', phone });
        }
    });
    
    try {
        await db.collection('users').doc(user.uid).set({
            emergencyInfo: {
                ...window.userData,
                contacts
            }
        }, { merge: true });
        
        window.userData.contacts = contacts;
        localStorage.setItem('safepass_data', JSON.stringify(window.userData));
        showNotification('Contacts saved!', 'success');
    } catch (error) {
        showNotification('Error saving contacts', 'error');
    }
};

// Export data
window.exportData = function() {
    const dataStr = JSON.stringify(window.userData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'safepass-backup.json';
    a.click();
    showNotification('Data exported!', 'success');
};

// Change theme
window.changeTheme = function(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
};

function showNotification(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#d32f2f';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}