// app.js - SafePass Lock Screen

let emergencyData = null;

document.addEventListener('DOMContentLoaded', function() {
    loadEmergencyData();
});

function loadEmergencyData() {
    const lockScreenLoading = document.getElementById('lockScreenLoading');
    const noDataCard = document.getElementById('noDataCard');
    const sections = ['emergencyPersonSection', 'emergencyBloodSection', 'emergencyCriticalSection', 'emergencyIdSection', 'emergencyContactsSection'];
    
    // Try to get from cache first
    const cached = localStorage.getItem('safepass_data');
    if (cached) {
        try {
            const data = JSON.parse(cached);
            displayEmergencyData(data);
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'flex';
            });
            if (noDataCard) noDataCard.style.display = 'none';
            if (lockScreenLoading) lockScreenLoading.style.display = 'none';
            emergencyData = data;
        } catch (e) {
            console.log('Error parsing cached data');
        }
    } else {
        if (lockScreenLoading) lockScreenLoading.style.display = 'none';
        if (noDataCard) noDataCard.style.display = 'block';
    }
}

function displayEmergencyData(data) {
    if (!data) return;
    
    document.getElementById('lockScreenName').textContent = data.personal?.fullName || 'Not Available';
    document.getElementById('lockScreenBloodValue').textContent = data.medical?.bloodGroup || 'Unknown';
    document.getElementById('lockScreenAllergies').textContent = data.medical?.allergies?.join(', ') || 'None';
    document.getElementById('lockScreenConditions').textContent = data.medical?.conditions?.join(', ') || 'None';
    document.getElementById('lockScreenMeds').textContent = data.medical?.medications?.join(', ') || 'None';
    document.getElementById('lockScreenCNIC').textContent = data.personal?.cnic || 'Not available';
    document.getElementById('lockScreenAddress').textContent = data.personal?.address || 'Not available';
    
    if (data.personal?.dob) {
        const age = calculateAge(data.personal.dob);
        document.getElementById('lockScreenAgeGender').textContent = `${age} years • ${data.personal.gender || ''}`;
    }
    
    // Display contacts
    const contactsContainer = document.getElementById('lockScreenContacts');
    if (contactsContainer && data.contacts && data.contacts.length > 0) {
        contactsContainer.innerHTML = '';
        data.contacts.forEach(contact => {
            const div = document.createElement('div');
            div.className = 'emergency-contact-item';
            div.innerHTML = `
                <div class="contact-info">
                    <span class="name">${contact.name}</span>
                    <span class="phone">${contact.phone}</span>
                </div>
                <button class="call-contact-btn" onclick="callContact('${contact.phone}')">📞</button>
            `;
            contactsContainer.appendChild(div);
        });
    }
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function callAllContacts() {
    if (!emergencyData?.contacts?.length) {
        showNotification('No emergency contacts saved', 'warning');
        return;
    }
    
    if (confirm('🚨 EMERGENCY! Call all emergency contacts?')) {
        emergencyData.contacts.forEach((contact, index) => {
            setTimeout(() => {
                window.location.href = `tel:${contact.phone}`;
            }, index * 2000);
        });
    }
}

function callContact(phone) {
    window.location.href = `tel:${phone}`;
}

function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#d32f2f';
    toast.style.color = type === 'warning' ? '#333' : 'white';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Make functions global
window.callAllContacts = callAllContacts;
window.callContact = callContact;