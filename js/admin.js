/**
 * PROTO MOTORS - ADMIN WORKSHOP DASHBOARD
 * Features:
 * - Password authorization & session handling
 * - Real-time statistics counter
 * - Multi-criteria live filtering (Vehicle type, Status stage, Text search)
 * - Stage dropdown inline updates (PATCH /api/admin/bookings/:id)
 * - Mechanic notes live sync
 * - One-click WhatsApp notification to customer with preformatted status & notes
 * - Manual Walk-In Job Card modal
 */

document.addEventListener('DOMContentLoaded', () => {
  const AUTH_STORAGE_KEY = 'proto_admin_token';
  let adminToken = sessionStorage.getItem(AUTH_STORAGE_KEY);
  let allBookings = [];
  let currentFilterStatus = 'all';
  let currentFilterType = 'all';
  let searchQuery = '';

  // Elements
  const loginScreen = document.getElementById('loginScreen');
  const adminApp = document.getElementById('adminApp');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('adminPassword');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const searchInput = document.getElementById('adminSearchInput');
  const bookingsContainer = document.getElementById('bookingsContainer');
  const newBookingModal = document.getElementById('newBookingModal');
  const openNewBookingBtn = document.getElementById('openNewBookingBtn');
  const closeNewBookingBtn = document.getElementById('closeNewBookingBtn');
  const newBookingForm = document.getElementById('newBookingForm');

  // Clock
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  function updateLiveClock() {
    const el = document.getElementById('liveClock');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  // Initialize Auth
  if (adminToken) {
    showDashboard();
  } else {
    showLogin();
  }

  // ----------------------------------------------------
  // Auth Handlers
  // ----------------------------------------------------
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput?.value?.trim();
    if (!password) return;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        adminToken = data.token;
        sessionStorage.setItem(AUTH_STORAGE_KEY, adminToken);
        showDashboard();
      } else {
        if (loginError) {
          loginError.textContent = data.message || 'Incorrect password.';
          loginError.style.display = 'block';
        }
      }
    } catch (err) {
      if (loginError) {
        loginError.textContent = 'Server connection failed.';
        loginError.style.display = 'block';
      }
    }
  });

  logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    adminToken = null;
    showLogin();
  });

  function showLogin() {
    loginScreen.style.display = 'flex';
    adminApp.classList.remove('active');
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    adminApp.classList.add('active');
    loadAdminData();
  }

  // ----------------------------------------------------
  // Load Bookings & Stats
  // ----------------------------------------------------
  async function loadAdminData() {
    if (!adminToken) return;

    try {
      // 1. Fetch Stats
      fetchStats();

      // 2. Fetch Bookings
      const res = await fetch('/api/admin/bookings', {
        headers: { 'x-admin-token': adminToken }
      });

      if (res.status === 401) {
        // Token expired/invalid
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        showLogin();
        return;
      }

      const data = await res.json();
      if (data.success) {
        allBookings = data.bookings || [];
        renderBookings();
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        const s = data.stats;
        document.getElementById('metricTotal').textContent = s.total;
        document.getElementById('metricActive').textContent = s.active;
        document.getElementById('metricReady').textContent = s.ready;
        document.getElementById('metricRevenue').textContent = `₹${(s.totalRevenue || 0).toLocaleString()}`;
      }
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }

  // ----------------------------------------------------
  // Filtering & Search
  // ----------------------------------------------------
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderBookings();
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterStatus = btn.getAttribute('data-status') || 'all';
      renderBookings();
    });
  });

  document.querySelectorAll('.type-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterType = btn.getAttribute('data-type') || 'all';
      renderBookings();
    });
  });

  refreshBtn?.addEventListener('click', () => {
    refreshBtn.classList.add('btn-pulse');
    loadAdminData();
    setTimeout(() => refreshBtn.classList.remove('btn-pulse'), 800);
  });

  // ----------------------------------------------------
  // Render Bookings
  // ----------------------------------------------------
  function renderBookings() {
    if (!bookingsContainer) return;

    let filtered = allBookings.filter(b => {
      // Type filter
      if (currentFilterType !== 'all' && b.vehicleType !== currentFilterType) {
        return false;
      }
      // Status filter
      if (currentFilterStatus !== 'all' && b.status !== currentFilterStatus) {
        return false;
      }
      // Search query
      if (searchQuery) {
        const text = `${b.id} ${b.customerName} ${b.phone} ${b.vehicleBrand} ${b.vehicleModel} ${b.regNumber}`.toLowerCase();
        if (!text.includes(searchQuery)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      bookingsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🏎️</div>
          <h3>No Vehicles Found</h3>
          <p>No job orders match your active filter or search criteria.</p>
        </div>
      `;
      return;
    }

    bookingsContainer.innerHTML = '';
    filtered.forEach(b => {
      const card = createJobCard(b);
      bookingsContainer.appendChild(card);
    });
  }

  function createJobCard(b) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.setAttribute('data-id', b.id);

    const statusOptions = [
      'Received',
      'Inspection',
      'In Progress',
      'Quality Check',
      'Ready for Delivery',
      'Delivered'
    ];

    const statusBadgeClass = `status-${b.status.toLowerCase().replace(/\s+/g, '-')}`;

    // WhatsApp Notify pre-filled URL
    const notifyText = encodeURIComponent(
      `*🏁 PROTO MOTORS UPDATE - Job #${b.id}*\n\n` +
      `Hello ${b.customerName},\n` +
      `Your vehicle *[${b.vehicleType}] ${b.vehicleBrand} ${b.vehicleModel}* is currently:\n` +
      `⚡ *Status:* ${b.status.toUpperCase()}\n` +
      `🔧 *Mechanic Notes:* ${b.mechanicNotes || 'Under active bay work'}\n` +
      `⏱ *Est. Delivery:* ${b.estimatedReadyTime || 'On schedule'}\n` +
      `👨‍🔧 *Technician:* ${b.technician || 'Bay Lead'}\n\n` +
      `Need urgent assistance? Reply here or call +91 98765 43210.\n` +
      `Proto Motors Performance Hub.`
    );
    const whatsappUrl = `https://wa.me/91${b.phone}?text=${notifyText}`;

    card.innerHTML = `
      <div class="job-card-top">
        <div class="job-id-chip">
          <span>${b.id}</span>
          <span class="badge ${b.vehicleType === '2W' ? 'badge-2w' : 'badge-4w'}">${b.vehicleType}</span>
        </div>
        <div class="status-badge-live ${statusBadgeClass}">${b.status}</div>
      </div>

      <div class="vehicle-banner">
        <div class="vehicle-main-info">
          <h4>${b.vehicleBrand} ${b.vehicleModel}</h4>
          <div class="vehicle-sub-info">
            Plate: <strong style="color: #fbbf24;">${b.regNumber || 'Awaiting Check-in'}</strong> • ${b.servicePackage}
          </div>
        </div>
        <div style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 800; color: #fff;">
          ₹${(b.estimatedPrice || 0).toLocaleString()}
        </div>
      </div>

      <div class="customer-row">
        <div class="customer-name-phone">
          <strong>${b.customerName}</strong>
          <a href="tel:+91${b.phone}" class="customer-phone-link">📞 +91 ${b.phone}</a>
        </div>
        <div style="font-size: 0.75rem; color: var(--admin-text-dim);">
          Slot: <strong>${b.serviceDate}</strong> (${b.timeSlot || 'Bay Queue'})
        </div>
      </div>

      <div class="admin-card-controls">
        <div class="control-field-row">
          <label style="font-size: 0.725rem; font-family: var(--font-heading); color: var(--admin-text-sub); display: flex; align-items: center; gap: 0.35rem; width: 100%;">
            <span>STATUS STAGE:</span>
            <select class="stage-select" data-id="${b.id}">
              ${statusOptions.map(opt => `<option value="${opt}" ${opt === b.status ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>
          </label>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <input type="text" class="login-input tech-input" style="padding: 0.45rem 0.75rem; font-size: 0.775rem;" placeholder="Technician Assigned" value="${b.technician || ''}" data-id="${b.id}">
          <input type="text" class="login-input ready-input" style="padding: 0.45rem 0.75rem; font-size: 0.775rem;" placeholder="Est. Ready (e.g. Today 5 PM)" value="${b.estimatedReadyTime || ''}" data-id="${b.id}">
        </div>

        <div>
          <label style="font-size: 0.725rem; font-family: var(--font-heading); color: var(--admin-text-sub); margin-bottom: 0.25rem; display: block;">MECHANIC & INSPECTION NOTES:</label>
          <textarea class="mechanic-notes-area" data-id="${b.id}" placeholder="Enter diagnostic observations, parts replaced, dyno numbers...">${b.mechanicNotes || ''}</textarea>
        </div>
      </div>

      <div class="card-footer-actions">
        <button type="button" class="btn-save-notes" data-id="${b.id}">
          💾 Save Changes
        </button>

        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <a href="${whatsappUrl}" target="_blank" class="btn-whatsapp-notify" title="Notify Customer on WhatsApp">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
            Notify Customer
          </a>

          <button type="button" class="btn btn-secondary btn-sm delete-btn" data-id="${b.id}" title="Remove Job" style="padding: 0.5rem; background: rgba(255,255,255,0.05);">
            🗑️
          </button>
        </div>
      </div>
    `;

    // Dropdown change listener (quick stage change)
    const stageSelect = card.querySelector('.stage-select');
    stageSelect?.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      await updateBooking(b.id, { status: newStatus });
    });

    // Save button click
    const saveBtn = card.querySelector('.btn-save-notes');
    saveBtn?.addEventListener('click', async () => {
      saveBtn.textContent = 'Saving...';
      const notes = card.querySelector('.mechanic-notes-area')?.value;
      const tech = card.querySelector('.tech-input')?.value;
      const readyTime = card.querySelector('.ready-input')?.value;
      const currentStatus = card.querySelector('.stage-select')?.value;

      await updateBooking(b.id, {
        status: currentStatus,
        mechanicNotes: notes,
        technician: tech,
        estimatedReadyTime: readyTime
      });
      saveBtn.textContent = '✓ Saved!';
      setTimeout(() => { saveBtn.textContent = '💾 Save Changes'; }, 1500);
    });

    // Delete button
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn?.addEventListener('click', async () => {
      if (confirm(`Are you sure you want to remove Job Order ${b.id}?`)) {
        await deleteBooking(b.id);
      }
    });

    return card;
  }

  // ----------------------------------------------------
  // API Update Booking (PATCH /api/admin/bookings/:id)
  // ----------------------------------------------------
  async function updateBooking(id, payload) {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.booking) {
        // Update local state
        const idx = allBookings.findIndex(item => item.id === id);
        if (idx !== -1) {
          allBookings[idx] = data.booking;
        }
        renderBookings();
        fetchStats();
      } else {
        alert(data.message || 'Failed to update booking.');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Error updating booking.');
    }
  }

  // Delete Booking
  async function deleteBooking(id) {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        allBookings = allBookings.filter(b => b.id !== id);
        renderBookings();
        fetchStats();
      } else {
        alert(data.message || 'Failed to delete.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  // ----------------------------------------------------
  // Walk-In New Booking Modal
  // ----------------------------------------------------
  openNewBookingBtn?.addEventListener('click', () => {
    newBookingModal.style.display = 'flex';
  });

  closeNewBookingBtn?.addEventListener('click', () => {
    newBookingModal.style.display = 'none';
  });

  newBookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerName = document.getElementById('newCustName').value.trim();
    const phone = document.getElementById('newPhone').value.trim();
    const vehicleType = document.getElementById('newVehicleType').value;
    const vehicleBrand = document.getElementById('newBrand').value.trim();
    const vehicleModel = document.getElementById('newModel').value.trim();
    const regNumber = document.getElementById('newPlate').value.trim();
    const servicePackage = document.getElementById('newPackage').value;
    const estimatedPrice = document.getElementById('newPrice').value;

    const payload = {
      customerName,
      phone,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      regNumber,
      servicePackage,
      estimatedPrice,
      serviceDate: new Date().toISOString().split('T')[0],
      timeSlot: 'Walk-In Intake'
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        newBookingForm.reset();
        newBookingModal.style.display = 'none';
        loadAdminData();
      } else {
        alert(data.message || 'Error creating walk-in booking.');
      }
    } catch (err) {
      console.error('Walk-in error:', err);
    }
  });
});
