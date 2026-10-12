/**
 * PROTO MOTORS - ADMIN WORKSHOP DASHBOARD
 * Complete Garage Desk Control & Job Order Management
 * Features:
 * - Dual-Mode Architecture: Works 100% offline via localStorage AND syncs with Node API
 * - Full Walk-in Customer Intake with automatic unique Job ID generation (PM-XXXX)
 * - Immediate intake confirmation with One-Click WhatsApp job card and printable job slip
 * - Live workshop metrics (Total, Active in Bay, Ready for Handover, Est. Workload Value)
 * - Instant stage transitions (Received -> Inspection -> In Progress -> QC -> Ready -> Delivered)
 * - Mechanic diagnostic notes live save
 * - Real-time filtering by Vehicle Class (2W/4W), Stage, and full-text search
 * - Export all workshop records to CSV
 * - Demo fleet seed & reset
 */

document.addEventListener('DOMContentLoaded', () => {
  const AUTH_STORAGE_KEY = 'proto_admin_token';
  const BOOKINGS_STORAGE_KEY = 'proto_workshop_bookings_v2';
  let adminToken = sessionStorage.getItem(AUTH_STORAGE_KEY);
  let allBookings = [];
  let currentFilterStatus = 'all';
  let currentFilterType = 'all';
  let searchQuery = '';
  let newlyCreatedJobId = null;

  // Default Seed Bookings for offline initialization
  const DEFAULT_SEED_BOOKINGS = [
    {
      id: "PM-9121",
      customerName: "Ramesh Kumar",
      phone: "9686643618",
      vehicleType: "4W",
      vehicleBrand: "Hyundai",
      vehicleModel: "Creta SX(O)",
      regNumber: "KA-01-MJ-8899",
      servicePackage: "Car Denting & Painting (Panel / Full Body)",
      estimatedPrice: 6500,
      serviceDate: new Date().toISOString().split('T')[0],
      timeSlot: "Bay Queue #1",
      status: "In Progress",
      statusStage: 3,
      mechanicNotes: "Right front fender panel beaten. Factory color matched primer applied. Entering paint spray booth at 2 PM.",
      technician: "Ramesh (Paint Specialist)",
      estimatedReadyTime: "Today at 5:30 PM",
      pickupDrop: false,
      customerNotes: "Right fender scratch and deep dent from parking pillar.",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "PM-2055",
      customerName: "Arjun Nair",
      phone: "9845112233",
      vehicleType: "2W",
      vehicleBrand: "Royal Enfield",
      vehicleModel: "Hunter 350 Dapper Ash",
      regNumber: "KA-01-HG-3500",
      servicePackage: "2W Full Periodic Service & Overhaul",
      estimatedPrice: 2999,
      serviceDate: new Date().toISOString().split('T')[0],
      timeSlot: "Bay Queue #2",
      status: "Inspection",
      statusStage: 2,
      mechanicNotes: "Engine oil drained. Tappet clearance being measured. Front brake disc pads at 40% life; customer approved pad replacement.",
      technician: "Aditya (Senior Bike Tech)",
      estimatedReadyTime: "Today at 3:30 PM",
      pickupDrop: false,
      customerNotes: "Mild front brake vibration on hard stops.",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "PM-1766",
      customerName: "Kunal Sharma",
      phone: "9845099887",
      vehicleType: "2W",
      vehicleBrand: "Yamaha",
      vehicleModel: "Aerox 155",
      regNumber: "KA-01-AX-1550",
      servicePackage: "Tubeless Puncture & Tyre Care Bay",
      estimatedPrice: 750,
      serviceDate: new Date().toISOString().split('T')[0],
      timeSlot: "Express Bay",
      status: "Ready for Delivery",
      statusStage: 5,
      mechanicNotes: "Rear radial tyre puncture extracted and vulcanized. Heavy-duty brass valve fitted. Nitrogen 32 PSI filled.",
      technician: "Imran (Tyre Specialist)",
      estimatedReadyTime: "Ready Now",
      pickupDrop: false,
      customerNotes: "Losing tyre air every 2 days.",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "PM-8821",
      customerName: "Vikramaditya Roy",
      phone: "9876543210",
      vehicleType: "4W",
      vehicleBrand: "BMW",
      vehicleModel: "M4 Competition Coupe",
      regNumber: "KA-05-MM-4040",
      servicePackage: "Engine Tune-Up & Diagnostics",
      estimatedPrice: 18500,
      serviceDate: new Date().toISOString().split('T')[0],
      timeSlot: "Performance Bay #1",
      status: "Quality Check",
      statusStage: 4,
      mechanicNotes: "Spark plugs replaced with Laser Iridium. Throttle bodies synchronized. Computer diagnostic cleared. Road tested smooth.",
      technician: "Senior Workshop Mechanic",
      estimatedReadyTime: "Today at 4:00 PM",
      pickupDrop: true,
      customerNotes: "Annual sports car health checkup & throttle response check.",
      createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "PM-1122",
      customerName: "Sameer Khan",
      phone: "9900112244",
      vehicleType: "2W",
      vehicleBrand: "KTM",
      vehicleModel: "390 Duke ABS",
      regNumber: "KA-03-DK-3939",
      servicePackage: "2W Chain Lube & Maintenance",
      estimatedPrice: 850,
      serviceDate: new Date().toISOString().split('T')[0],
      timeSlot: "Bay Queue #3",
      status: "Delivered",
      statusStage: 6,
      mechanicNotes: "Chain ultrasonically washed, lubed with Motul chain paste and tensioned to 25mm slack. Handover complete.",
      technician: "Aditya (Senior Bike Tech)",
      estimatedReadyTime: "Delivered",
      pickupDrop: false,
      customerNotes: "Chain dry and slack.",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "PM-1984",
      customerName: "Kavita Pillai",
      phone: "9740112233",
      vehicleType: "4W",
      vehicleBrand: "Hyundai",
      vehicleModel: "Creta Turbo N-Line",
      regNumber: "KA-03-NP-7788",
      servicePackage: "Brake Service & Wheel Alignment",
      estimatedPrice: 4200,
      serviceDate: new Date().toISOString().split('T')[0],
      timeSlot: "Chassis Bay",
      status: "Received",
      statusStage: 1,
      mechanicNotes: "Vehicle received at bay desk. Pre-inspection inspection walkaround completed. Wheel balancing queued.",
      technician: "Senior Workshop Mechanic",
      estimatedReadyTime: "Today at 6:00 PM",
      pickupDrop: false,
      customerNotes: "Brake shudder at 80 km/h.",
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // DOM Elements
  const loginScreen = document.getElementById('loginScreen');
  const adminApp = document.getElementById('adminApp');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('adminPassword');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const resetDemoBtn = document.getElementById('resetDemoBtn');
  const searchInput = document.getElementById('adminSearchInput');
  const bookingsContainer = document.getElementById('bookingsContainer');

  // Intake Modal Elements
  const newBookingModal = document.getElementById('newBookingModal');
  const openNewBookingBtn = document.getElementById('openNewBookingBtn');
  const closeNewBookingBtn = document.getElementById('closeNewBookingBtn');
  const newBookingForm = document.getElementById('newBookingForm');
  const newPackageSelect = document.getElementById('newPackageSelect');
  const customPackageWrap = document.getElementById('customPackageWrap');
  const newPackageCustom = document.getElementById('newPackageCustom');

  // Success Modal Elements
  const intakeSuccessModal = document.getElementById('intakeSuccessModal');
  const closeIntakeSuccessBtn = document.getElementById('closeIntakeSuccessBtn');
  const successCloseDoneBtn = document.getElementById('successCloseDoneBtn');
  const successPrintBtn = document.getElementById('successPrintBtn');
  const successWhatsAppBtn = document.getElementById('successWhatsAppBtn');

  // Printable Slip Modal Elements
  const printSlipModal = document.getElementById('printSlipModal');
  const printableSlipContent = document.getElementById('printableSlipContent');
  const closePrintModalBtn = document.getElementById('closePrintModalBtn');
  const cancelPrintBtn = document.getElementById('cancelPrintBtn');
  const triggerPrintBtn = document.getElementById('triggerPrintBtn');

  // Live Clock
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  function updateLiveClock() {
    const el = document.getElementById('liveClock');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  // ----------------------------------------------------
  // Authentication
  // ----------------------------------------------------
  const FALLBACK_HASH = 'ca0202498d95f6c58b804e4d6843c1c46e44cfb9396450f5ba76ea10977f3ac8'; // SHA-256 for SAMSASM1122
  const FALLBACK_TOKEN = 'proto-motors-auth-token-2026';

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  if (adminToken) {
    showDashboard();
  } else {
    showLogin();
  }

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
      // Offline fallback authentication
      try {
        const inputHash = await sha256(password);
        if (inputHash === FALLBACK_HASH) {
          adminToken = FALLBACK_TOKEN;
          sessionStorage.setItem(AUTH_STORAGE_KEY, adminToken);
          showDashboard();
        } else {
          if (loginError) {
            loginError.textContent = 'Invalid administrative password.';
            loginError.style.display = 'block';
          }
        }
      } catch (hashErr) {
        if (loginError) {
          loginError.textContent = 'Authentication error. Please try again.';
          loginError.style.display = 'block';
        }
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
  // Data Persistence (Dual-Mode: LocalStorage + Server)
  // ----------------------------------------------------
  function getLocalBookings() {
    try {
      const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading localStorage bookings:', e);
    }
    // Seed default if empty
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_BOOKINGS));
    return DEFAULT_SEED_BOOKINGS;
  }

  function saveLocalBookings(list) {
    try {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }

  function calculateAndRenderMetrics() {
    const total = allBookings.length;
    const active = allBookings.filter(b => b.status !== 'Delivered').length;
    const ready = allBookings.filter(b => b.status === 'Ready for Delivery').length;
    const revenue = allBookings.reduce((sum, b) => sum + (Number(b.estimatedPrice) || 0), 0);

    const elTotal = document.getElementById('metricTotal');
    const elActive = document.getElementById('metricActive');
    const elReady = document.getElementById('metricReady');
    const elRev = document.getElementById('metricRevenue');

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elReady) elReady.textContent = ready;
    if (elRev) elRev.textContent = `₹${revenue.toLocaleString()}`;
  }

  async function loadAdminData() {
    // 1. Immediately load local data so UI is fast and never blank
    allBookings = getLocalBookings();
    renderBookings();
    calculateAndRenderMetrics();

    // 2. If token exists, try fetching from server to sync latest
    if (!adminToken) return;

    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { 'x-admin-token': adminToken }
      });

      if (res.status === 401) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        showLogin();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.bookings) && data.bookings.length > 0) {
          allBookings = data.bookings;
          saveLocalBookings(allBookings);
          renderBookings();
          calculateAndRenderMetrics();
        }
      }
    } catch (err) {
      // Server not reachable; local data is already active and working
      console.log('Running in local offline mode with persisted garage store.');
    }
  }

  // ----------------------------------------------------
  // Filtering & Search
  // ----------------------------------------------------
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderBookings();
  });

  document.querySelectorAll('.filter-btn:not(#resetDemoBtn)').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn:not(#resetDemoBtn)').forEach(b => b.classList.remove('active'));
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
    showToast('Workshop data refreshed & synced.');
    setTimeout(() => refreshBtn.classList.remove('btn-pulse'), 800);
  });

  resetDemoBtn?.addEventListener('click', () => {
    if (confirm('Reset workshop job queue to default demo vehicles? This will reload sample jobs.')) {
      allBookings = JSON.parse(JSON.stringify(DEFAULT_SEED_BOOKINGS));
      saveLocalBookings(allBookings);
      renderBookings();
      calculateAndRenderMetrics();
      showToast('Demo job cards restored.');
    }
  });

  exportCsvBtn?.addEventListener('click', () => {
    exportToCsv();
  });

  function exportToCsv() {
    if (!allBookings || allBookings.length === 0) {
      alert('No job records available to export.');
      return;
    }

    const headers = [
      'Job ID', 'Date', 'Customer Name', 'Phone', 'Vehicle Class',
      'Make', 'Model', 'Plate Number', 'Service Package',
      'Status', 'Technician', 'Est Ready Time', 'Est Bill (INR)', 'Notes'
    ];

    const rows = allBookings.map(b => [
      `"${b.id}"`,
      `"${b.serviceDate || ''}"`,
      `"${(b.customerName || '').replace(/"/g, '""')}"`,
      `"${b.phone || ''}"`,
      `"${b.vehicleType || ''}"`,
      `"${(b.vehicleBrand || '').replace(/"/g, '""')}"`,
      `"${(b.vehicleModel || '').replace(/"/g, '""')}"`,
      `"${(b.regNumber || '').replace(/"/g, '""')}"`,
      `"${(b.servicePackage || '').replace(/"/g, '""')}"`,
      `"${b.status || ''}"`,
      `"${(b.technician || '').replace(/"/g, '""')}"`,
      `"${(b.estimatedReadyTime || '').replace(/"/g, '""')}"`,
      b.estimatedPrice || 0,
      `"${(b.mechanicNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `protomotors_job_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV export downloaded successfully!');
  }

  // ----------------------------------------------------
  // Render Job Cards Grid
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
        const text = `${b.id} ${b.customerName} ${b.phone} ${b.vehicleBrand} ${b.vehicleModel} ${b.regNumber} ${b.technician || ''}`.toLowerCase();
        if (!text.includes(searchQuery)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      bookingsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; background: var(--admin-card); border: 1px dashed var(--admin-border); border-radius: 10px;">
          <div class="empty-state-icon">🏎️</div>
          <h3 style="color: #fff; margin-bottom: 0.5rem;">No Matching Vehicles</h3>
          <p style="margin-bottom: 1.25rem;">No active job orders match your active filter or search criteria.</p>
          <button type="button" class="btn btn-primary btn-sm" id="emptyStateIntakeBtn">
            ⚡ Intake New Customer Vehicle
          </button>
        </div>
      `;
      document.getElementById('emptyStateIntakeBtn')?.addEventListener('click', () => {
        openIntakeModal();
      });
      return;
    }

    bookingsContainer.innerHTML = '';
    filtered.forEach(b => {
      const card = createJobCard(b);
      if (newlyCreatedJobId === b.id) {
        card.classList.add('highlight-card');
      }
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

    const statusBadgeClass = `status-${(b.status || 'Received').toLowerCase().replace(/\s+/g, '-')}`;

    // WhatsApp Notification Message
    const notifyText = encodeURIComponent(
      `*🏁 PROTO MOTORS GARAGE - JOB UPDATE #${b.id}*\n\n` +
      `Hello ${b.customerName},\n` +
      `Here is the live update for your *[${b.vehicleType}] ${b.vehicleBrand} ${b.vehicleModel}* (${b.regNumber || 'Vehicle'}):\n\n` +
      `⚡ *Current Status:* ${(b.status || 'Received').toUpperCase()}\n` +
      `🔧 *Mechanic Notes:* ${b.mechanicNotes || 'Under active workshop care'}\n` +
      `⏱ *Est. Delivery:* ${b.estimatedReadyTime || 'On schedule'}\n` +
      `👨‍🔧 *Technician:* ${b.technician || 'Senior Workshop Mechanic'}\n` +
      `💰 *Est. Bill:* ₹${(b.estimatedPrice || 0).toLocaleString()}\n\n` +
      `📍 *Location:* Near Vagdevi Vilas School, Kannamangala Dinnur, Bangalore East 560067\n` +
      `📞 *Hotline:* 9686643618\n\n` +
      `Feel free to reply to this message for any queries!`
    );
    const whatsappUrl = `https://wa.me/91${b.phone}?text=${notifyText}`;

    card.innerHTML = `
      <div class="job-card-top">
        <div class="job-id-chip">
          <span>${b.id}</span>
          <span class="badge ${b.vehicleType === '2W' ? 'badge-2w' : 'badge-4w'}">${b.vehicleType}</span>
        </div>
        <div class="status-badge-live ${statusBadgeClass}" id="badge-${b.id}">${b.status}</div>
      </div>

      <div class="vehicle-banner">
        <div class="vehicle-main-info">
          <h4>${b.vehicleBrand} ${b.vehicleModel}</h4>
          <div class="vehicle-sub-info">
            Plate: <strong style="color: #fbbf24; letter-spacing: 0.05em;">${b.regNumber || 'Awaiting Check-in'}</strong> • ${b.servicePackage}
          </div>
        </div>
        <div style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: #22c55e;">
          ₹${(b.estimatedPrice || 0).toLocaleString()}
        </div>
      </div>

      <div class="customer-row">
        <div class="customer-name-phone">
          <strong>${b.customerName}</strong>
          <a href="tel:+91${b.phone}" class="customer-phone-link">📞 +91 ${b.phone}</a>
        </div>
        <div style="font-size: 0.75rem; color: var(--admin-text-dim); text-align: right;">
          <div>Intake: <strong style="color: #fff;">${b.serviceDate || 'Today'}</strong></div>
          <div>Slot: ${b.timeSlot || 'Bay Queue'}</div>
        </div>
      </div>

      <div class="admin-card-controls">
        <div class="control-field-row">
          <label style="font-size: 0.725rem; font-family: var(--font-heading); color: var(--admin-text-sub); display: flex; align-items: center; gap: 0.45rem; width: 100%;">
            <span>STAGE:</span>
            <select class="stage-select" data-id="${b.id}">
              ${statusOptions.map(opt => `<option value="${opt}" ${opt === b.status ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>
          </label>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <div>
            <label style="font-size: 0.7rem; font-family: var(--font-heading); color: var(--admin-text-dim); display: block; margin-bottom: 2px;">TECHNICIAN:</label>
            <input type="text" class="login-input tech-input" style="padding: 0.45rem 0.65rem; font-size: 0.775rem;" placeholder="Assigned Tech" value="${b.technician || 'Senior Workshop Mechanic'}" data-id="${b.id}">
          </div>
          <div>
            <label style="font-size: 0.7rem; font-family: var(--font-heading); color: var(--admin-text-dim); display: block; margin-bottom: 2px;">EST. READY TIME:</label>
            <input type="text" class="login-input ready-input" style="padding: 0.45rem 0.65rem; font-size: 0.775rem;" placeholder="e.g. Today 5 PM" value="${b.estimatedReadyTime || 'Today 5:00 PM'}" data-id="${b.id}">
          </div>
        </div>

        <div>
          <label style="font-size: 0.725rem; font-family: var(--font-heading); color: var(--admin-text-sub); margin-bottom: 0.25rem; display: block;">MECHANIC &amp; INSPECTION NOTES:</label>
          <textarea class="mechanic-notes-area" data-id="${b.id}" placeholder="Enter diagnostic observations, parts replaced, scratches noted...">${b.mechanicNotes || ''}</textarea>
        </div>
      </div>

      <div class="card-footer-actions">
        <button type="button" class="btn-save-notes" data-id="${b.id}">
          💾 Save Changes
        </button>

        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <a href="${whatsappUrl}" target="_blank" class="btn-whatsapp-notify" title="Send WhatsApp Update to Customer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
            Notify
          </a>

          <button type="button" class="btn btn-secondary btn-sm print-slip-btn" data-id="${b.id}" title="Print Job Sheet / Slip" style="padding: 0.5rem; background: rgba(255,255,255,0.06);">
            🖨️
          </button>

          <button type="button" class="btn btn-secondary btn-sm delete-btn" data-id="${b.id}" title="Remove Vehicle" style="padding: 0.5rem; background: rgba(255,255,255,0.06); color: #f87171;">
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
      showToast(`Job ${b.id} updated.`);
    });

    // Print button
    const printBtn = card.querySelector('.print-slip-btn');
    printBtn?.addEventListener('click', () => {
      openPrintModal(b);
    });

    // Delete button
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn?.addEventListener('click', async () => {
      if (confirm(`Remove Job Order ${b.id} (${b.customerName} - ${b.vehicleBrand} ${b.vehicleModel}) from workshop queue?`)) {
        await deleteBooking(b.id);
      }
    });

    return card;
  }

  // ----------------------------------------------------
  // Update Booking (LocalStorage + API Dual Mode)
  // ----------------------------------------------------
  async function updateBooking(id, payload) {
    const stageMap = {
      'Received': 1,
      'Inspection': 2,
      'In Progress': 3,
      'Quality Check': 4,
      'Ready for Delivery': 5,
      'Delivered': 6
    };

    // 1. Immediately update in local state and localStorage
    const idx = allBookings.findIndex(item => item.id === id);
    if (idx !== -1) {
      if (payload.status) {
        allBookings[idx].status = payload.status;
        allBookings[idx].statusStage = stageMap[payload.status] || allBookings[idx].statusStage;
      }
      if (payload.mechanicNotes !== undefined) allBookings[idx].mechanicNotes = payload.mechanicNotes;
      if (payload.technician !== undefined) allBookings[idx].technician = payload.technician;
      if (payload.estimatedReadyTime !== undefined) allBookings[idx].estimatedReadyTime = payload.estimatedReadyTime;
      if (payload.estimatedPrice !== undefined) allBookings[idx].estimatedPrice = Number(payload.estimatedPrice);
      allBookings[idx].updatedAt = new Date().toISOString();

      saveLocalBookings(allBookings);
      calculateAndRenderMetrics();

      // Update badge on card if present
      const badge = document.getElementById(`badge-${id}`);
      if (badge && payload.status) {
        badge.textContent = payload.status;
        badge.className = `status-badge-live status-${payload.status.toLowerCase().replace(/\s+/g, '-')}`;
      }
    }

    // 2. Background attempt to update server if online
    if (adminToken) {
      try {
        await fetch(`/api/admin/bookings/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        // Offline; changes already secured in local storage
      }
    }
  }

  // ----------------------------------------------------
  // Delete Booking (LocalStorage + API Dual Mode)
  // ----------------------------------------------------
  async function deleteBooking(id) {
    // 1. Immediately delete locally
    allBookings = allBookings.filter(b => b.id !== id);
    saveLocalBookings(allBookings);
    renderBookings();
    calculateAndRenderMetrics();
    showToast(`Job Order ${id} removed.`);

    // 2. Background attempt to delete on server if online
    if (adminToken) {
      try {
        await fetch(`/api/admin/bookings/${id}`, {
          method: 'DELETE',
          headers: { 'x-admin-token': adminToken }
        });
      } catch (err) {
        // Offline; already removed locally
      }
    }
  }

  // ----------------------------------------------------
  // Customer Intake Modal Handling
  // ----------------------------------------------------
  function openIntakeModal() {
    if (newBookingModal) {
      newBookingModal.style.display = 'flex';
      newBookingModal.classList.add('active');
      document.getElementById('newCustName')?.focus();
    }
  }

  function closeIntakeModal() {
    if (newBookingModal) {
      newBookingModal.style.display = 'none';
      newBookingModal.classList.remove('active');
    }
  }

  openNewBookingBtn?.addEventListener('click', openIntakeModal);
  closeNewBookingBtn?.addEventListener('click', closeIntakeModal);

  // Close modal when clicking on outer backdrop
  newBookingModal?.addEventListener('click', (e) => {
    if (e.target === newBookingModal) {
      closeIntakeModal();
    }
  });

  // Package select dropdown change
  newPackageSelect?.addEventListener('change', () => {
    if (newPackageSelect.value === '__custom__') {
      if (customPackageWrap) customPackageWrap.style.display = 'block';
      if (newPackageCustom) newPackageCustom.required = true;
      newPackageCustom?.focus();
    } else {
      if (customPackageWrap) customPackageWrap.style.display = 'none';
      if (newPackageCustom) newPackageCustom.required = false;
    }
  });

  // Handle Form Submit: INTAKE CUSTOMER
  newBookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitIntakeBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing Intake...';
    }

    const customerName = document.getElementById('newCustName')?.value?.trim();
    const phone = document.getElementById('newPhone')?.value?.trim().replace(/[^0-9]/g, '');
    const vehicleType = document.getElementById('newVehicleType')?.value || '4W';
    const regNumber = document.getElementById('newPlate')?.value?.trim().toUpperCase() || 'Awaiting Check-in';
    const vehicleBrand = document.getElementById('newBrand')?.value?.trim();
    const vehicleModel = document.getElementById('newModel')?.value?.trim();

    let servicePackage = newPackageSelect?.value;
    if (servicePackage === '__custom__') {
      servicePackage = newPackageCustom?.value?.trim() || 'Custom Workshop Service';
    }

    const initialStatus = document.getElementById('newStatus')?.value || 'Received';
    const technician = document.getElementById('newTechnician')?.value?.trim() || 'Senior Workshop Mechanic';
    const estimatedReadyTime = document.getElementById('newReadyTime')?.value?.trim() || 'Today 5:00 PM';
    const estimatedPrice = Number(document.getElementById('newPrice')?.value) || 0;
    const notes = document.getElementById('newNotes')?.value?.trim() || '';

    // Generate unique Job ID: PM-XXXX
    const existingIds = new Set(allBookings.map(b => b.id));
    let randomNum;
    let newJobId;
    do {
      randomNum = Math.floor(1000 + Math.random() * 9000);
      newJobId = `PM-${randomNum}`;
    } while (existingIds.has(newJobId));

    const stageMap = {
      'Received': 1,
      'Inspection': 2,
      'In Progress': 3,
      'Quality Check': 4,
      'Ready for Delivery': 5,
      'Delivered': 6
    };

    const newJob = {
      id: newJobId,
      customerName: customerName,
      phone: phone,
      vehicleType: vehicleType,
      vehicleBrand: vehicleBrand,
      vehicleModel: vehicleModel,
      regNumber: regNumber,
      servicePackage: servicePackage,
      addons: [],
      estimatedPrice: estimatedPrice,
      serviceDate: new Date().toISOString().split('T')[0],
      timeSlot: 'Walk-In Intake',
      status: initialStatus,
      statusStage: stageMap[initialStatus] || 1,
      mechanicNotes: notes ? `Intake Inspection: ${notes}` : 'Vehicle intake confirmed. Initial inspection scheduled with bay mechanic.',
      technician: technician,
      estimatedReadyTime: estimatedReadyTime,
      pickupDrop: false,
      customerNotes: notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately insert at front of local state and save to localStorage
    allBookings.unshift(newJob);
    saveLocalBookings(allBookings);
    newlyCreatedJobId = newJobId;

    // 2. Re-render UI and update metrics immediately
    renderBookings();
    calculateAndRenderMetrics();

    // 3. Background attempt to POST to /api/bookings if server is reachable
    try {
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          vehicleType,
          vehicleBrand,
          vehicleModel,
          regNumber,
          servicePackage,
          estimatedPrice,
          serviceDate: newJob.serviceDate,
          timeSlot: 'Walk-In Intake',
          customerNotes: notes,
          status: initialStatus,
          statusStage: stageMap[initialStatus] || 1,
          technician: technician,
          estimatedReadyTime: estimatedReadyTime,
          mechanicNotes: newJob.mechanicNotes
        })
      }).catch(err => {
        // Offline; local record is safely preserved
      });
    } catch (err) {}

    // 4. Reset form & close Intake Modal
    newBookingForm.reset();
    if (customPackageWrap) customPackageWrap.style.display = 'none';
    closeIntakeModal();

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '⚡ CREATE JOB ORDER & ASSIGN ID';
    }

    // 5. Open Success Modal with WhatsApp and Print options
    showIntakeSuccessModal(newJob);

    showToast(`✓ Intake Complete! Job #${newJobId} created.`);
  });

  // ----------------------------------------------------
  // Intake Success Modal
  // ----------------------------------------------------
  let activeIntakeJob = null;

  function showIntakeSuccessModal(job) {
    activeIntakeJob = job;

    const elId = document.getElementById('successJobId');
    const elCust = document.getElementById('successCustomer');
    const elPhone = document.getElementById('successPhone');
    const elVeh = document.getElementById('successVehicle');
    const elPlate = document.getElementById('successPlate');
    const elPkg = document.getElementById('successPackage');
    const elPrice = document.getElementById('successPrice');

    if (elId) elId.textContent = job.id;
    if (elCust) elCust.textContent = job.customerName;
    if (elPhone) elPhone.textContent = `+91 ${job.phone}`;
    if (elVeh) elVeh.textContent = `[${job.vehicleType}] ${job.vehicleBrand} ${job.vehicleModel}`;
    if (elPlate) elPlate.textContent = job.regNumber || 'Pending Check-in';
    if (elPkg) elPkg.textContent = job.servicePackage;
    if (elPrice) elPrice.textContent = `₹${(job.estimatedPrice || 0).toLocaleString()}`;

    // Generate WhatsApp Confirmation link
    const waText = encodeURIComponent(
      `*🏁 PROTO MOTORS GARAGE - VEHICLE INTAKE SLIP*\n\n` +
      `Hello ${job.customerName},\n` +
      `Your vehicle has been successfully received at our workshop!\n\n` +
      `📋 *Job Order ID:* ${job.id}\n` +
      `🚗 *Vehicle:* [${job.vehicleType}] ${job.vehicleBrand} ${job.vehicleModel}\n` +
      `🔢 *Reg Plate:* ${job.regNumber || 'Recorded in Bay'}\n` +
      `🔧 *Service:* ${job.servicePackage}\n` +
      `⏱ *Est. Delivery:* ${job.estimatedReadyTime}\n` +
      `💰 *Estimated Bill:* ₹${(job.estimatedPrice || 0).toLocaleString()}\n` +
      `👨‍🔧 *Assigned Technician:* ${job.technician}\n\n` +
      `📍 *Workshop Address:* Near Vagdevi Vilas School, Kannamangala Dinnur, Bangalore East 560067\n` +
      `⏱ *Hours:* 9:00 AM – 9:00 PM\n` +
      `📞 *Hotline:* 9686643618\n\n` +
      `Thank you for trusting Protomotors Garage!`
    );

    if (successWhatsAppBtn) {
      successWhatsAppBtn.href = `https://wa.me/91${job.phone}?text=${waText}`;
    }

    if (intakeSuccessModal) {
      intakeSuccessModal.style.display = 'flex';
      intakeSuccessModal.classList.add('active');
    }
  }

  function closeIntakeSuccessModal() {
    if (intakeSuccessModal) {
      intakeSuccessModal.style.display = 'none';
      intakeSuccessModal.classList.remove('active');
    }
  }

  closeIntakeSuccessBtn?.addEventListener('click', closeIntakeSuccessModal);
  successCloseDoneBtn?.addEventListener('click', closeIntakeSuccessModal);
  intakeSuccessModal?.addEventListener('click', (e) => {
    if (e.target === intakeSuccessModal) closeIntakeSuccessModal();
  });

  successPrintBtn?.addEventListener('click', () => {
    closeIntakeSuccessModal();
    if (activeIntakeJob) {
      openPrintModal(activeIntakeJob);
    }
  });

  // ----------------------------------------------------
  // Printable Job Sheet Modal
  // ----------------------------------------------------
  function openPrintModal(job) {
    if (!printableSlipContent) return;

    printableSlipContent.innerHTML = `
      <div class="job-slip-container">
        <div class="job-slip-header">
          <div>
            <div class="job-slip-brand">PROTO <span>MOTORS</span> GARAGE</div>
            <div style="font-size: 0.75rem; color: #4b5563; margin-top: 2px;">
              Car &amp; Bike Performance &amp; Repair Hub • Denting &amp; Painting
            </div>
            <div style="font-size: 0.75rem; color: #6b7280;">
              Near Vagdevi Vilas School, Kannamangala Dinnur, Bangalore East 560067 | 📞 9686643618
            </div>
          </div>
          <div style="text-align: right;">
            <span style="background: #111827; color: #fff; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 4px;">WORKSHOP COPY</span>
            <div style="font-size: 0.75rem; color: #4b5563; margin-top: 4px;">Date: <strong>${job.serviceDate || new Date().toISOString().split('T')[0]}</strong></div>
          </div>
        </div>

        <div class="slip-barcode">
          * ${job.id} *
        </div>

        <div class="job-slip-meta-grid">
          <div class="slip-box">
            <div class="slip-label">CUSTOMER DETAILS</div>
            <div class="slip-val">${job.customerName}</div>
            <div style="font-size: 0.85rem; color: #374151; margin-top: 2px;">📞 +91 ${job.phone}</div>
          </div>

          <div class="slip-box">
            <div class="slip-label">VEHICLE DETAILS</div>
            <div class="slip-val">[${job.vehicleType}] ${job.vehicleBrand} ${job.vehicleModel}</div>
            <div style="font-size: 0.85rem; color: #b91c1c; font-weight: 700; margin-top: 2px;">PLATE: ${job.regNumber || 'CHECK-IN PENDING'}</div>
          </div>

          <div class="slip-box">
            <div class="slip-label">SERVICE PACKAGE</div>
            <div class="slip-val" style="font-size: 0.85rem;">${job.servicePackage}</div>
            <div style="font-size: 0.8rem; color: #059669; font-weight: 700; margin-top: 2px;">EST. BILL: ₹${(job.estimatedPrice || 0).toLocaleString()}</div>
          </div>

          <div class="slip-box">
            <div class="slip-label">BAY LOGISTICS</div>
            <div class="slip-val" style="font-size: 0.85rem;">Tech: ${job.technician || 'Senior Mechanic'}</div>
            <div style="font-size: 0.8rem; color: #374151; margin-top: 2px;">Est. Delivery: <strong>${job.estimatedReadyTime || 'On Schedule'}</strong></div>
          </div>
        </div>

        <div class="slip-box" style="margin-bottom: 1rem;">
          <div class="slip-label">CUSTOMER COMPLAINTS &amp; INSPECTION REMARKS</div>
          <div style="font-size: 0.85rem; color: #111827; min-height: 45px; line-height: 1.4;">
            ${job.mechanicNotes || 'General servicing and multi-point workshop checkup requested.'}
          </div>
        </div>

        <div class="slip-signatures">
          <div>
            <div class="sig-line"></div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: #4b5563; font-weight: 700;">Customer Signature</div>
          </div>
          <div>
            <div class="sig-line"></div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: #4b5563; font-weight: 700;">Workshop Desk In-Charge</div>
          </div>
        </div>
      </div>
    `;

    if (printSlipModal) {
      printSlipModal.style.display = 'flex';
      printSlipModal.classList.add('active');
    }
  }

  function closePrintModal() {
    if (printSlipModal) {
      printSlipModal.style.display = 'none';
      printSlipModal.classList.remove('active');
    }
  }

  closePrintModalBtn?.addEventListener('click', closePrintModal);
  cancelPrintBtn?.addEventListener('click', closePrintModal);
  printSlipModal?.addEventListener('click', (e) => {
    if (e.target === printSlipModal) closePrintModal();
  });

  triggerPrintBtn?.addEventListener('click', () => {
    window.print();
  });

  // ----------------------------------------------------
  // Toast Notification Helper
  // ----------------------------------------------------
  function showToast(message) {
    let container = document.querySelector('.admin-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'admin-toast-container';
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = 'background: #18181f; border: 1px solid var(--admin-red); color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.85rem; font-family: var(--font-heading); box-shadow: 0 4px 20px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 8px; transition: all 0.3s ease;';
    toast.innerHTML = `<span style="color: #22c55e;">⚡</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
});
