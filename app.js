// ========== LOCK SCREEN VIEW FUNCTIONS ==========

// Load emergency data from Firestore (cached)
async function loadEmergencyData() {
    const lockScreenLoading = document.getElementById('lockScreenLoading');
    const noDataCard = document.getElementById('noDataCard');
    const emergencySections = [
        'emergencyPersonSection',
        'emergencyBloodSection',
        'emergencyCriticalSection',
        'emergencyIdSection',
        'emergencyContactsSection'
    ];
    
    try {
        // Try to get from cache first
        const cached = localStorage.getItem('emergencyData');
        if (cached) {
            const data = JSON.parse(cached);
            displayEmergencyData(data);
            emergencySections.forEach(id => {
                document.getElementById(id).style.display = 'flex';
            });
            noDataCard.style.display = 'none';
            lockScreenLoading.style.display = 'none';
        }
        
        // Try to get from Firestore if online
        if (navigator.onLine) {
            // Get the most recently updated user data (simplified - in production you'd have a public emergency collection)
            const snapshot = await db.collection('users')
                .orderBy('lastLogin', 'desc')
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                if (userData.emergencyInfo) {
                    displayEmergencyData(userData.emergencyInfo);
                    emergencySections.forEach(id => {
                        document.getElementById(id).style.display = 'flex';
                    });
                    noDataCard.style.display = 'none';
                    
                    // Cache the data
                    localStorage.setItem('emergencyData', JSON.stringify(userData.emergencyInfo));
                }
            }
        }
    } catch (error) {
        console.error('Error loading emergency data:', error);
        // If no data and no cache, show no data card
        if (!localStorage.getItem('emergencyData')) {
            lockScreenLoading.style.display = 'none';
            noDataCard.style.display = 'block';
            emergencySections.forEach(id => {
                document.getElementById(id).style.display = 'none';
            });
        }
    }
}

// Display emergency data on lock screen
function displayEmergencyData(data) {
    // Personal Info
    if (data.personal) {
        document.getElementById('lockScreenName').textContent = data.personal.fullName || 'Not Available';
        
        if (data.personal.dob) {
            const age = calculateAge(data.personal.dob);
            document.getElementById('lockScreenAgeGender').textContent = 
                `${age} years • ${data.personal.gender || 'Not specified'}`;
        }
        
        document.getElementById('lockScreenCNIC').textContent = data.personal.cnic || 'Not available';
        document.getElementById('lockScreenAddress').textContent = data.personal.address || 'Not available';
    }
    
    // Medical Info
    if (data.medical) {
        document.getElementById('lockScreenBloodValue').textContent = data.medical.bloodGroup || 'Unknown';
        document.getElementById('lockScreenAllergies').textContent = 
            data.medical.allergies?.length ? data.medical.allergies.join(', ') : 'None listed';
        document.getElementById('lockScreenConditions').textContent = 
            data.medical.conditions?.length ? data.medical.conditions.join(', ') : 'None listed';
        document.getElementById('lockScreenMeds').textContent = 
            data.medical.medications?.length ? data.medical.medications.join(', ') : 'None listed';
    }
    
    // Contacts
    if (data.contacts && data.contacts.length > 0) {
        const contactsContainer = document.getElementById('lockScreenContacts');
        contactsContainer.innerHTML = '';
        
        data.contacts.sort((a, b) => a.priority - b.priority).forEach(contact => {
            const contactDiv = document.createElement('div');
            contactDiv.className = 'emergency-contact-item';
            contactDiv.innerHTML = `
                <div class="contact-info">
                    <span class="name">${contact.name}</span>
                    <span class="relation">${contact.relation || 'Contact'}</span>
                    <span class="phone">${contact.phone}</span>
                </div>
                <button class="call-contact-btn" onclick="callContact('${contact.phone}')">
                    📞
                </button>
            `;
            contactsContainer.appendChild(contactDiv);
        });
    }
}

// Calculate Age
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

// Call all contacts
function callAllContacts() {
    const emergencyData = JSON.parse(localStorage.getItem('emergencyData') || '{}');
    const contacts = emergencyData.contacts || [];
    
    if (contacts.length === 0) {
        showNotification('No emergency contacts saved', 'warning');
        return;
    }
    
    if (confirm('🚨 EMERGENCY! Call all emergency contacts?')) {
        showNotification('🚨 SOS Activated - Calling contacts...', 'warning', 3000);
        
        contacts.sort((a, b) => a.priority - b.priority).forEach((contact, index) => {
            setTimeout(() => {
                callContact(contact.phone);
                showNotification(`Calling ${contact.name}...`, 'info', 2000);
            }, index * 3000);
        });
    }
}

// Call specific contact
function callContact(phoneNumber) {
    window.location.href = `tel:${phoneNumber}`;
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

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadEmergencyData();
    
    // Check for cached data
    setInterval(() => {
        if (navigator.onLine) {
            loadEmergencyData(); // Refresh data periodically
        }
    }, 30000); // Every 30 seconds
});