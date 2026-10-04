/**
 * PROTO MOTORS - FRONTEND APPLICATION JAVASCRIPT
 * Handles:
 * 1. 2W/4W Toggle and Service Catalog Filtering
 * 2. Interactive Price Calculator & Dynamic Estimator
 * 3. Live Vehicle Tracker (Job ID / Phone search + visual stepper)
 * 4. Booking Form (POST /api/bookings + WhatsApp prefilled confirmation)
 * 5. Mobile Drawer and UI Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let serviceCatalog = null;
  let activeCategory = 'twoWheeler'; // 'twoWheeler' or 'fourWheeler'
  let selectedBasePackagePrice = 0;
  let selectedAddonsTotal = 0;

  // Initialize
  initApp();

  async function initApp() {
    setupNavigation();
    setupMobileDrawer();
    setupCategoryToggles();
    await fetchServiceCatalog();
    setupEstimator();
    setupTracker();
    setupBookingForm();
  }

  // ----------------------------------------------------
  // 1. Navigation & Scroll Effects
  // ----------------------------------------------------
  function setupNavigation() {
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    });

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || !targetId) return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          closeDrawer();
        }
      });
    });
  }

  // ----------------------------------------------------
  // 2. Mobile Drawer
  // ----------------------------------------------------
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');

  function openDrawer() {
    mobileDrawer?.classList.add('open');
    drawerBackdrop?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileDrawer?.classList.remove('open');
    drawerBackdrop?.classList.remove('active');
    document.body.style.overflow = '';
  }

  function setupMobileDrawer() {
    mobileMenuBtn?.addEventListener('click', openDrawer);
    drawerCloseBtn?.addEventListener('click', closeDrawer);
    drawerBackdrop?.addEventListener('click', closeDrawer);
  }

  // ----------------------------------------------------
  // 3. Category Toggles (Hero + Services)
  // ----------------------------------------------------
  function setupCategoryToggles() {
    const heroToggles = document.querySelectorAll('.hero-toggles .toggle-pill');
    heroToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        heroToggles.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-category');
        if (cat === 'all') {
          // Keep current category or scroll to services
          document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          switchCategory(cat);
          document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Services section tabs
    const serviceTabs = document.querySelectorAll('.catalog-tabs .tab-btn');
    serviceTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        serviceTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.getAttribute('data-category');
        switchCategory(cat);
      });
    });
  }

  function switchCategory(cat) {
    activeCategory = cat; // 'twoWheeler' or 'fourWheeler'

    // Update active tab buttons
    document.querySelectorAll('.catalog-tabs .tab-btn').forEach(t => {
      if (t.getAttribute('data-category') === cat) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    // Update hero pills
    document.querySelectorAll('.hero-toggles .toggle-pill').forEach(p => {
      if (p.getAttribute('data-category') === cat) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    renderPackages();
    updateEstimatorCategory();
    syncBookingFormCategory(cat === 'twoWheeler' ? '2W' : '4W');
  }

  // ----------------------------------------------------
  // 4. Fetch Services Catalog
  // ----------------------------------------------------
  // Fallback service catalog
  const DEFAULT_CATALOG = {
    twoWheeler: {
      packages: [
        {
          id: '2w-full-service',
          name: 'Full Periodic Service (Complete Overhaul)',
          price: 1899,
          duration: '2.5 - 3 Hours',
          popular: true,
          tag: 'Most Popular for All Bikes',
          features: [
            'Engine oil replacement & OEM oil filter cleaning/swap',
            'Spark plug cleaning, gap calibration & ignition check',
            'Carburetor / throttle body ultrasonic cleaning & tuning',
            'Drive chain deep degreasing, tensioning & high-temp wax lube',
            'Front & rear brake shoes/pads cleaning & caliper greasing',
            'Clutch cable, accelerator & lever lubrication & free-play set',
            'Battery voltage check & electrical terminal de-oxidation',
            '32-Point chassis, wheel bearings & suspension safety audit',
            'High-pressure snow foam wash, polish & tyre dressing'
          ]
        },
        {
          id: '2w-puncture-tyre',
          name: 'Tubeless Puncture & Tyre Care Bay',
          price: 249,
          duration: '20 - 30 Mins',
          tag: 'Express Pit-Stop Service',
          features: [
            'Heavy-duty vulcanized strip puncture sealing (up to 2 punctures)',
            'High-precision tyre leak detection water bath',
            'Tyre bead & rim sealing surface cleanup',
            'Wheel rim bend & spoke tightness check',
            'Aviation-grade Nitrogen (N2) pressure fill in both tyres',
            'Valve stem leak check & dust cap replacement'
          ]
        },
        {
          id: '2w-express-oil',
          name: 'Express Oil & Pit Stop Service',
          price: 999,
          duration: '45 Mins',
          tag: 'Quick Daily Maintenance',
          features: [
            'Semi-synthetic engine oil change (Motul / Castrol)',
            'Air filter blow-clean & spark plug test',
            'Chain slack adjustment & quick lubing',
            'Brake pad wear visual inspection & cable lube',
            'Tyre pressure check & 18-point general inspection'
          ]
        },
        {
          id: '2w-brake-overhaul',
          name: 'Brake System Overhaul & Fluid Bleed',
          price: 699,
          duration: '60 Mins',
          tag: 'Safety Critical',
          features: [
            'Front & rear disc brake pads inspection, deglaze & cleaning',
            'Caliper floating pins cleaning & high-temp silicone greasing',
            'DOT 4 / 5.1 high-temperature brake fluid flush & air purge',
            'Disc rotor thickness & runout gauge inspection',
            'Drum brake shoe inspection & spring tension adjustment'
          ]
        },
        {
          id: '2w-chain-sprocket',
          name: 'Chain & Sprocket Deep Care & Lube',
          price: 499,
          duration: '45 Mins',
          tag: 'Smooth Drivetrain',
          features: [
            'Ultrasonic solvent chain degreasing (removes road grime & grit)',
            'Front & rear sprocket tooth wear & hook profiling',
            'Precision chain tensioning to manufacturer mm specification',
            'Motul Factory Line high-speed anti-fling chain wax coating',
            'Swingarm cushion rubber & guide slider check'
          ]
        },
        {
          id: '2w-performance',
          name: 'Track Day & Superbike Performance Pack',
          price: 4999,
          duration: '4 - 5 Hours',
          tag: 'Superbikes 300cc - 1200cc',
          features: [
            'Motul 300V Ester Core 100% Synthetic Factory Line Oil',
            'Brembo racing brake bleed with high-boiling DOT 5.1 fluid',
            'Multi-cylinder throttle body vacuum synchronization',
            'High-flow performance air filter (K&N / BMC) cleaning & recharge',
            'Suspension sag, rebound & preload setup tuned to rider weight',
            'Dyno ECU readiness scan & DTC diagnostic error-code purge'
          ]
        },
        {
          id: '2w-ev-check',
          name: 'EV Scooter Master Diagnostics & Health',
          price: 1499,
          duration: '2 Hours',
          tag: 'Ather / Ola / TVS / Chetak / Vida',
          features: [
            'Lithium battery pack State-of-Health (SOH) & cell balance scan',
            'BLDC hub motor / mid-drive belt tension & bearing check',
            'BMS firmware diagnostic log review & fault code clearing',
            'High-voltage wiring harness insulation & water ingress check',
            'Regen braking sensor calibration & electronic throttle check'
          ]
        },
        {
          id: '2w-decarb-tune',
          name: 'Engine Carbon Decarb & Fuel Injection Cleanse',
          price: 1199,
          duration: '90 Mins',
          tag: 'Power & Mileage Restoration',
          features: [
            'Ultrasonic fuel injector bath & atomization spray test',
            'Combustion chamber hydrogen carbon purge (no engine tear-down)',
            'Intake valve & exhaust port deposit cleanup',
            'Oxygen (O2) sensor cleaning & throttle response check',
            'Restores lost horsepower & crisp low-end acceleration'
          ]
        },
        {
          id: '2w-deep-restoration',
          name: 'Comprehensive Engine Overhaul & Restoration',
          price: 6499,
          duration: '1 Full Day',
          tag: 'Complete Mechanical Restoration',
          features: [
            'Engine cylinder head teardown & precision valve clearance setting',
            'Front fork oil drain, seal replacement & damping adjustment',
            'Steering head cone set, wheel bearings & swingarm bush greasing',
            'Coolant flush & aluminum radiator fin chemical decontamination',
            'Full electrical wiring harness voltage drop diagnosis',
            'Multi-stage foam wash, degreasing & ceramic wax protection'
          ]
        }
      ],
      addons: [
        { id: '2w-puncture-addon', name: 'Tubeless Puncture Fix (Per Puncture)', price: 99 },
        { id: '2w-mushroom-patch', name: 'Mushroom Radial Tyre Internal Patch', price: 299 },
        { id: '2w-brass-valve', name: 'Heavy-Duty Brass Tyre Valve Replacement', price: 199 },
        { id: '2w-nitrogen', name: 'Aviation Nitrogen (N2) Pressure Fill (Both Tyres)', price: 150 },
        { id: '2w-chain-care', name: 'DID Gold Chain Deep Degrease & Wax', price: 499 },
        { id: '2w-iridium', name: 'NGK Laser Iridium Spark Plug', price: 950 },
        { id: '2w-synth-oil', name: 'Motul 300V Ester Core Synthetic Upgrade', price: 1650 },
        { id: '2w-ceramic', name: 'Single-Layer Ceramic Tank & Visor Shield', price: 1499 }
      ]
    },
    fourWheeler: {
      packages: [
        {
          id: '4w-periodic',
          name: 'Periodic Major Service',
          price: 6999,
          duration: '4 Hours',
          popular: true,
          tag: 'Factory Recommended',
          features: [
            'Full synthetic engine oil replacement',
            'OEM oil filter, air filter & cabin pollen filter',
            '4-Wheel brake caliper servicing & disc thickness check',
            'All fluid top-ups (coolant, power steering, washer)',
            'OBD-II comprehensive live sensor scan',
            'Suspension bush & undercarriage inspection'
          ]
        },
        {
          id: '4w-performance-tuning',
          name: 'Stage 1/2 Performance ECU Remap',
          price: 18999,
          duration: '6-8 Hours',
          tag: 'Track & Horsepower',
          features: [
            'Custom dynamometer baseline & power pull run',
            'Ignition timing, boost pressure & AFR optimization',
            'Pop & Bang / Rev limiter calibration (optional)',
            'Transmission TCU shift speed quickening',
            '0-100 km/h acceleration telemetry report',
            '6-Month performance mapping warranty'
          ]
        },
        {
          id: '4w-brakes-chassis',
          name: 'High-Performance Brake & Suspension',
          price: 8499,
          duration: '3-4 Hours',
          tag: 'Precision Handling',
          features: [
            'On-car precision disc rotor skim & resurfacing',
            'DOT 5.1 high-boiling point brake fluid pressure bleed',
            'Brembo / Ferodo performance pad installation',
            'Computerized 3D laser wheel alignment & camber tune',
            'High-speed digital wheel balancing on all 4 wheels',
            'Anti-roll bar & ball joint stress analysis'
          ]
        },
        {
          id: '4w-transmission',
          name: 'DSG / AT Transmission & Drivetrain Service',
          price: 12500,
          duration: '1 Full Day',
          tag: 'Drivetrain Specialist',
          features: [
            'Dual-clutch / torque converter synthetic fluid flush',
            'Internal transmission pan magnet & filter replacement',
            'Mechatronics solenoid pressure calibration',
            'Differential & transfer case hypoid gear oil change',
            'Driveshaft boot & CV joint greasing'
          ]
        }
      ],
      addons: [
        { id: '4w-ceramic', name: '9H Graphene / Ceramic Paint Shield', price: 7999 },
        { id: '4w-decarb', name: 'Hydrogen Engine Carbon Decarb Cleanse', price: 2499 },
        { id: '4w-ac-ozone', name: 'AC Evaporator Foam & Ozone Disinfection', price: 1499 },
        { id: '4w-synth-racing', name: 'Liqui Moly / Mobil 1 Super Racing Oil Upgrade', price: 3200 },
        { id: '4w-underbody', name: 'Rubberized Anti-Corrosion Underbody Coating', price: 2800 }
      ]
    }
  };

  async function fetchServiceCatalog() {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) {
        serviceCatalog = data.data;
      } else {
        serviceCatalog = DEFAULT_CATALOG;
      }
    } catch (err) {
      console.warn('Using local fallback catalog data:', err);
      serviceCatalog = DEFAULT_CATALOG;
    }
    renderPackages();
    populateEstimatorDropdowns();
  }

  function renderPackages() {
    if (!serviceCatalog) return;
    const container = document.getElementById('packagesGrid');
    if (!container) return;

    const currentData = serviceCatalog[activeCategory];
    if (!currentData || !currentData.packages) return;

    container.innerHTML = '';
    currentData.packages.forEach(pkg => {
      const card = document.createElement('div');
      card.className = `package-card ${pkg.popular ? 'popular' : ''}`;
      card.innerHTML = `
        ${pkg.popular ? `<div class="package-ribbon">POPULAR</div>` : ''}
        <div class="package-header">
          <span class="package-tag">${pkg.tag || 'Performance Package'}</span>
          <h3 class="package-name">${pkg.name}</h3>
          <div class="package-price-wrap">
            <span class="currency">₹</span>
            <span class="package-price">${pkg.price.toLocaleString()}</span>
            <span class="package-duration">• ${pkg.duration}</span>
          </div>
        </div>
        <ul class="package-features">
          ${pkg.features.map(f => `
            <li class="package-feature">
              <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              <span>${f}</span>
            </li>
          `).join('')}
        </ul>
        <div class="package-action" style="margin-top: auto;">
          <button type="button" class="btn btn-outline-red btn-sm select-pkg-btn" style="width: 100%;" 
            data-pkg-name="${pkg.name}" 
            data-pkg-price="${pkg.price}">
            Book This Package
          </button>
        </div>
      `;

      card.querySelector('.select-pkg-btn').addEventListener('click', () => {
        applyPackageToBooking(pkg.name, pkg.price);
      });

      container.appendChild(card);
    });
  }

  function applyPackageToBooking(pkgName, pkgPrice) {
    const pkgSelect = document.getElementById('bookingPackage');
    if (pkgSelect) {
      // Find matching option or add it
      let found = false;
      for (let i = 0; i < pkgSelect.options.length; i++) {
        if (pkgSelect.options[i].text.includes(pkgName)) {
          pkgSelect.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        const opt = new Option(`${pkgName} (₹${pkgPrice})`, pkgName, true, true);
        pkgSelect.add(opt);
      }
    }
    // Scroll to booking form
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    showToast(`Selected "${pkgName}". Complete your details to book!`);
  }

  // ----------------------------------------------------
  // 5. Interactive Price Estimator
  // ----------------------------------------------------
  const estCategorySelect = document.getElementById('estCategory');
  const estVehicleModel = document.getElementById('estVehicleModel');
  const estPackageSelect = document.getElementById('estPackage');
  const estAddonsContainer = document.getElementById('estAddonsContainer');
  const estBasePriceDisplay = document.getElementById('estBasePriceDisplay');
  const estAddonsPriceDisplay = document.getElementById('estAddonsPriceDisplay');
  const estTaxPriceDisplay = document.getElementById('estTaxPriceDisplay');
  const estTotalPriceDisplay = document.getElementById('estTotalPriceDisplay');
  const estApplyBookingBtn = document.getElementById('estApplyBookingBtn');

  function setupEstimator() {
    estCategorySelect?.addEventListener('change', () => {
      activeCategory = estCategorySelect.value;
      updateEstimatorCategory();
      // Also sync catalog tabs
      document.querySelectorAll('.catalog-tabs .tab-btn').forEach(t => {
        if (t.getAttribute('data-category') === activeCategory) t.classList.add('active');
        else t.classList.remove('active');
      });
      renderPackages();
    });

    estPackageSelect?.addEventListener('change', calculateEstimate);

    estApplyBookingBtn?.addEventListener('click', () => {
      const selectedPkgName = estPackageSelect.options[estPackageSelect.selectedIndex]?.getAttribute('data-name') || estPackageSelect.value;
      const modelVal = estVehicleModel.value;
      const totalVal = calculateEstimate();

      // Sync category to booking
      syncBookingFormCategory(activeCategory === 'twoWheeler' ? '2W' : '4W');
      
      // Sync model if provided
      const modelInput = document.getElementById('bookingModel');
      if (modelInput && modelVal) {
        modelInput.value = modelVal;
      }

      // Sync package
      applyPackageToBooking(selectedPkgName, totalVal);
    });
  }

  function updateEstimatorCategory() {
    if (estCategorySelect) {
      estCategorySelect.value = activeCategory;
    }
    populateEstimatorDropdowns();
    calculateEstimate();
  }

  function populateEstimatorDropdowns() {
    if (!serviceCatalog) return;
    const cur = serviceCatalog[activeCategory];
    if (!cur) return;

    // Base packages dropdown
    if (estPackageSelect) {
      estPackageSelect.innerHTML = '';
      cur.packages.forEach((pkg, idx) => {
        const opt = document.createElement('option');
        opt.value = pkg.price;
        opt.setAttribute('data-name', pkg.name);
        opt.setAttribute('data-duration', pkg.duration);
        opt.textContent = `${pkg.name} — ₹${pkg.price.toLocaleString()} (${pkg.duration})`;
        if (idx === 0) opt.selected = true;
        estPackageSelect.appendChild(opt);
      });
    }

    // Addons checklist
    if (estAddonsContainer) {
      estAddonsContainer.innerHTML = '';
      cur.addons.forEach(ad => {
        const item = document.createElement('label');
        item.className = 'addon-item';
        item.innerHTML = `
          <div class="addon-left">
            <input type="checkbox" class="est-addon-checkbox" value="${ad.price}" data-id="${ad.id}" data-name="${ad.name}">
            <span class="addon-title">${ad.name}</span>
          </div>
          <span class="addon-price">+₹${ad.price}</span>
        `;
        item.querySelector('input').addEventListener('change', (e) => {
          if (e.target.checked) {
            item.classList.add('selected');
          } else {
            item.classList.remove('selected');
          }
          calculateEstimate();
        });
        estAddonsContainer.appendChild(item);
      });
    }

    calculateEstimate();
  }

  function calculateEstimate() {
    const pkgPrice = Number(estPackageSelect?.value) || 0;
    selectedBasePackagePrice = pkgPrice;

    let addonsSum = 0;
    document.querySelectorAll('.est-addon-checkbox:checked').forEach(cb => {
      addonsSum += Number(cb.value) || 0;
    });
    selectedAddonsTotal = addonsSum;

    const subtotal = pkgPrice + addonsSum;
    const gst = Math.round(subtotal * 0.18); // 18% GST estimate
    const grandTotal = subtotal + gst;

    if (estBasePriceDisplay) estBasePriceDisplay.textContent = `₹${pkgPrice.toLocaleString()}`;
    if (estAddonsPriceDisplay) estAddonsPriceDisplay.textContent = `₹${addonsSum.toLocaleString()}`;
    if (estTaxPriceDisplay) estTaxPriceDisplay.textContent = `₹${gst.toLocaleString()}`;
    if (estTotalPriceDisplay) estTotalPriceDisplay.textContent = `₹${grandTotal.toLocaleString()}`;

    return grandTotal;
  }

  // ----------------------------------------------------
  // 6. Live Vehicle Tracker
  // ----------------------------------------------------
  const trackInput = document.getElementById('trackInput');
  const trackBtn = document.getElementById('trackBtn');
  const trackerResult = document.getElementById('trackerResult');
  const trackerError = document.getElementById('trackerError');

  function setupTracker() {
    trackBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      executeTrack();
    });

    trackInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeTrack();
      }
    });

    // Demo chip click handlers
    document.querySelectorAll('.demo-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.getAttribute('data-id');
        if (trackInput && id) {
          trackInput.value = id;
          executeTrack();
        }
      });
    });

    // Check URL parameters for direct tracking (e.g. ?id=PM-8821)
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get('id') || urlParams.get('track');
    if (trackParam && trackInput) {
      trackInput.value = trackParam;
      setTimeout(() => {
        executeTrack();
        document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }

  async function executeTrack() {
    const query = trackInput?.value?.trim();
    if (!query) {
      showToast('Please enter a Job ID (e.g., PM-8821) or phone number.');
      return;
    }

    trackBtn.disabled = true;
    trackBtn.textContent = 'Scanning...';
    if (trackerError) trackerError.style.display = 'none';

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!data.success) {
        if (trackerResult) trackerResult.classList.remove('active');
        if (trackerError) {
          trackerError.textContent = data.message || 'Vehicle not found.';
          trackerError.style.display = 'block';
        }
        showToast(data.message || 'Vehicle record not found', 'error');
      } else {
        renderTrackingResult(data.booking);
        if (trackerError) trackerError.style.display = 'none';
        trackerResult?.classList.add('active');
        trackerResult?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      if (trackerError) {
        trackerError.textContent = 'Network error querying tracker. Please try again.';
        trackerError.style.display = 'block';
      }
    } finally {
      trackBtn.disabled = false;
      trackBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        Track Status
      `;
    }
  }

  function renderTrackingResult(b) {
    if (!b) return;

    // Header info
    document.getElementById('trkJobId').textContent = b.id;
    document.getElementById('trkVehicleTitle').textContent = `[${b.vehicleType}] ${b.vehicleBrand} ${b.vehicleModel}`;
    document.getElementById('trkRegPlate').textContent = b.regNumber || 'IN-PROGRESS';
    document.getElementById('trkCustomerName').textContent = b.customerName;
    document.getElementById('trkServicePkg').textContent = b.servicePackage;
    document.getElementById('trkDateSlot').textContent = `${b.serviceDate} (${b.timeSlot || 'Bay Queue'})`;
    document.getElementById('trkEstTime').textContent = b.estimatedReadyTime || 'Calculating';
    document.getElementById('trkTechnician').textContent = b.technician || 'Bay Master Lead';
    document.getElementById('trkMechanicNotes').textContent = b.mechanicNotes || 'Under standard inspection routine.';

    // Status Badge
    const statusBadge = document.getElementById('trkStatusBadge');
    if (statusBadge) {
      statusBadge.textContent = b.status.toUpperCase();
      statusBadge.className = `badge ${getStatusClass(b.status)}`;
    }

    // Stepper updates
    const stages = ['Received', 'Inspection', 'In Progress', 'Quality Check', 'Ready for Delivery'];
    const currentStageIndex = b.statusStage || (stages.indexOf(b.status) + 1) || 1;

    // Stepper line fill percentage
    const lineFill = document.getElementById('trkLineFill');
    if (lineFill) {
      const percentage = Math.min(100, Math.max(0, ((currentStageIndex - 1) / (stages.length - 1)) * 100));
      lineFill.style.width = `${percentage}%`;
    }

    // Step nodes
    for (let i = 1; i <= 5; i++) {
      const node = document.getElementById(`trkStep${i}`);
      if (!node) continue;
      node.classList.remove('completed', 'active');
      if (i < currentStageIndex) {
        node.classList.add('completed');
      } else if (i === currentStageIndex) {
        node.classList.add('active');
      }
    }

    // WhatsApp Mechanic Chat Button
    const waChatBtn = document.getElementById('trkWaChatBtn');
    if (waChatBtn) {
      const waText = encodeURIComponent(
        `Hi Proto Motors, I am inquiring about my vehicle with Job ID *${b.id}* (${b.vehicleBrand} ${b.vehicleModel}). Status shows *${b.status}*. Could you please provide an update?`
      );
      waChatBtn.href = `https://wa.me/919876543210?text=${waText}`;
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'Received': return 'badge-silver';
      case 'Inspection': return 'badge-2w';
      case 'In Progress': return 'badge-red';
      case 'Quality Check': return 'badge-4w';
      case 'Ready for Delivery': return 'badge-red';
      default: return 'badge-silver';
    }
  }

  // ----------------------------------------------------
  // 7. Booking Form Submission & WhatsApp Link
  // ----------------------------------------------------
  const bookingForm = document.getElementById('bookingForm');
  const typeCards = document.querySelectorAll('.type-selector-card');
  const bookingTypeInput = document.getElementById('bookingVehicleType');
  const bookingPackageSelect = document.getElementById('bookingPackage');
  const successModal = document.getElementById('successModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  function setupBookingForm() {
    // Set min date to today
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }

    // 2W / 4W Selector Cards
    typeCards.forEach(card => {
      card.addEventListener('click', () => {
        typeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const vType = card.getAttribute('data-type'); // '2W' or '4W'
        syncBookingFormCategory(vType);
      });
    });

    // Modal Close
    modalCloseBtn?.addEventListener('click', () => {
      successModal?.classList.remove('active');
    });

    // Form submit
    bookingForm?.addEventListener('submit', handleBookingSubmit);
  }

  function syncBookingFormCategory(vType) {
    if (bookingTypeInput) {
      bookingTypeInput.value = vType;
    }

    // Select the matching visual card
    typeCards.forEach(c => {
      if (c.getAttribute('data-type') === vType) c.classList.add('selected');
      else c.classList.remove('selected');
    });

    // Populate packages for booking dropdown
    if (serviceCatalog && bookingPackageSelect) {
      const catKey = vType === '2W' ? 'twoWheeler' : 'fourWheeler';
      const packages = serviceCatalog[catKey]?.packages || [];
      bookingPackageSelect.innerHTML = '';
      packages.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = `${p.name} (₹${p.price.toLocaleString()})`;
        if (idx === 0) opt.selected = true;
        bookingPackageSelect.appendChild(opt);
      });
      // Add custom option
      const customOpt = document.createElement('option');
      customOpt.value = 'Custom Diagnostics & Repair';
      customOpt.textContent = 'Custom Diagnostics & Inspection (Quote on Bay Check)';
      bookingPackageSelect.appendChild(customOpt);
    }
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('bookingSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Securing Bay Slot...';

    const customerName = document.getElementById('bookingName')?.value?.trim();
    const phone = document.getElementById('bookingPhone')?.value?.trim();
    const vehicleType = bookingTypeInput?.value || '2W';
    const vehicleBrand = document.getElementById('bookingBrand')?.value?.trim();
    const vehicleModel = document.getElementById('bookingModel')?.value?.trim();
    const regNumber = document.getElementById('bookingPlate')?.value?.trim();
    const servicePackage = bookingPackageSelect?.value;
    const serviceDate = document.getElementById('bookingDate')?.value;
    const timeSlot = document.getElementById('bookingSlot')?.value;
    const pickupDrop = document.getElementById('bookingPickup')?.checked;
    const customerNotes = document.getElementById('bookingNotes')?.value?.trim();

    const payload = {
      customerName,
      phone,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      regNumber,
      servicePackage,
      serviceDate,
      timeSlot,
      pickupDrop,
      customerNotes
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.booking) {
        showSuccessModal(data.booking, data.whatsappUrl);
        bookingForm.reset();
        syncBookingFormCategory(vehicleType);
        showToast(`Service Booked! Job ID: ${data.booking.id}`, 'success');
      } else {
        alert(data.message || 'Failed to submit booking.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      alert('Could not connect to server. Please try again or call our hotline.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
        CONFIRM SERVICE BOOKING
      `;
    }
  }

  function showSuccessModal(booking, whatsappUrl) {
    document.getElementById('modalJobId').textContent = booking.id;
    document.getElementById('modalCustomer').textContent = booking.customerName;
    document.getElementById('modalVehicle').textContent = `[${booking.vehicleType}] ${booking.vehicleBrand} ${booking.vehicleModel}`;
    document.getElementById('modalReg').textContent = booking.regNumber || 'Pending Intake';
    document.getElementById('modalPackage').textContent = booking.servicePackage;
    document.getElementById('modalSlot').textContent = `${booking.serviceDate} (${booking.timeSlot})`;
    
    // Set WhatsApp link
    const waBtn = document.getElementById('modalWhatsAppBtn');
    if (waBtn) {
      waBtn.href = whatsappUrl || `https://wa.me/919876543210`;
    }

    // Set Track button
    const trackDirectBtn = document.getElementById('modalTrackDirectBtn');
    if (trackDirectBtn) {
      trackDirectBtn.onclick = () => {
        successModal?.classList.remove('active');
        if (trackInput) {
          trackInput.value = booking.id;
          executeTrack();
        }
        document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' });
      };
    }

    successModal?.classList.add('active');

    // Automatically open WhatsApp in new tab after slight delay for high convenience
    if (whatsappUrl) {
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 700);
    }
  }

  // ----------------------------------------------------
  // Toast Notification Helper
  // ----------------------------------------------------
  function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'success' : ''}`;
    toast.innerHTML = `
      <span style="color: ${type === 'success' ? '#22c55e' : '#FF1E27'}; font-size: 1.1rem;">⚡</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
