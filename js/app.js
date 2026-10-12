/**
 * PROTO MOTORS - FRONTEND APPLICATION JAVASCRIPT
 * Complete Car & Bike Workshop - Kannamangala Dinnur, Bangalore East
 * Handles:
 * 1. 4W / 2W / All Services Toggle and Catalog Filtering
 * 2. Interactive Price Calculator & Dynamic Estimator
 * 3. Booking Form (POST /api/bookings + WhatsApp direct confirmation)
 * 4. Mobile Drawer and User-Friendly UI Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let serviceCatalog = null;
  let activeCategory = 'fourWheeler'; // 'fourWheeler', 'twoWheeler', or 'all'
  let selectedBasePackagePrice = 0;
  let selectedAddonsTotal = 0;

  // Initialize Application
  initApp();

  async function initApp() {
    setupNavigation();
    setupMobileDrawer();
    setupCategoryToggles();
    await fetchServiceCatalog();
    setupEstimator();
    setupBookingForm();
    setupVehicleTracker();
  }

  // ----------------------------------------------------
  // 1. Navigation & Scroll Effects
  // ----------------------------------------------------
  function setupNavigation() {
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
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

        // Special handling for category links
        const targetCategory = this.getAttribute('data-category');
        if (targetCategory) {
          switchCategory(targetCategory);
        }

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
  // 3. Category Toggles (Hero + Services Tabs)
  // ----------------------------------------------------
  function setupCategoryToggles() {
    // Hero quick toggle buttons
    const heroToggles = document.querySelectorAll('.hero-toggles .toggle-pill');
    heroToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category') || 'fourWheeler';
        switchCategory(cat);
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Services section tabs (4W / 2W / All)
    const serviceTabs = document.querySelectorAll('.catalog-tabs .tab-btn');
    serviceTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.getAttribute('data-category') || 'fourWheeler';
        switchCategory(cat);
      });
    });

    // Direct nav triggers
    document.querySelectorAll('[data-service-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        const cat = el.getAttribute('data-service-nav');
        if (cat) {
          switchCategory(cat);
        }
      });
    });
  }

  function switchCategory(cat) {
    activeCategory = cat; // 'fourWheeler', 'twoWheeler', or 'all'

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

    // Sync estimator and booking form if 4W or 2W selected
    if (cat === 'fourWheeler' || cat === 'twoWheeler') {
      updateEstimatorCategory(cat);
      syncBookingFormCategory(cat === 'twoWheeler' ? '2W' : '4W');
    }
  }

  // ----------------------------------------------------
  // 4. Services Catalog Data & Rendering
  // ----------------------------------------------------
  const DEFAULT_CATALOG = {
    fourWheeler: {
      packages: [
        {
          id: '4w-denting-painting',
          name: 'Car Denting & Painting (Panel / Full Body)',
          price: 2499,
          duration: '1 - 2 Days',
          popular: true,
          tag: 'Body & Paint Specialists',
          features: [
            'Panel beating, scratch removal & precision dent repair',
            'Computerized factory paint shade matching & anti-rust primer',
            'High-gloss spray paint booth finish & clear coat protection',
            'Bumper repair, scratch rub-down & panel realignment',
            'Deep machine buffing, compound polish & swirl removal'
          ]
        },
        {
          id: '4w-periodic',
          name: 'Full Periodic Car Service',
          price: 4999,
          duration: '3 - 4 Hours',
          popular: true,
          tag: 'Complete Car Care',
          features: [
            'Full synthetic engine oil replacement',
            'Quality engine oil filter, air filter & cabin AC filter',
            '4-Wheel brake pads cleaning, disc inspection & caliper service',
            'Coolant, steering fluid & windshield washer top-ups',
            'Computer diagnostic scan & battery safety check',
            'Complete suspension check, underbody inspection & car wash'
          ]
        },
        {
          id: '4w-brakes-chassis',
          name: 'Brake Service & Wheel Alignment',
          price: 2499,
          duration: '2 Hours',
          tag: 'Smooth & Safe Driving',
          features: [
            'Front & rear disc brake pads inspection & servicing',
            'Brake fluid flush & air bleeding',
            'Computerized 3D laser wheel alignment & wheel balancing',
            'Steering tie rod, ball joint & suspension check',
            'Handbrake check & cable adjustment'
          ]
        },
        {
          id: '4w-ac-cooling',
          name: 'Car AC Service & Gas Recharge',
          price: 1899,
          duration: '2 Hours',
          tag: 'Chilling Cabin Comfort',
          features: [
            'AC condenser & cooling coil cleaning',
            'AC gas top-up & compressor oil lubrication',
            'Cabin air filter cleaning / replacement',
            'AC vent sanitization & leak inspection'
          ]
        },
        {
          id: '4w-engine-tune',
          name: 'Engine Tune-Up & Diagnostics',
          price: 1499,
          duration: '2 Hours',
          tag: 'Better Mileage & Smooth Ride',
          features: [
            'Computer diagnostic scan & fault code clearing',
            'Spark plugs inspection & electrode cleaning',
            'Throttle body cleaning & fuel line check',
            'Battery health & alternator charging test'
          ]
        },
        {
          id: '4w-clutch-gearbox',
          name: 'Clutch & Gearbox Servicing',
          price: 5999,
          duration: '1 Day',
          tag: 'Smooth Shifting',
          features: [
            'Clutch plate & release bearing inspection',
            'Transmission gear oil replacement',
            'Clutch pedal free-play adjustment & bleeding',
            'Driveshaft & CV joint greasing'
          ]
        }
      ],
      addons: [
        { id: '4w-denting-panel', name: 'Single Panel Dent & Scratch Repair', price: 2199 },
        { id: '4w-rubbing-polish', name: 'Machine Rubbing & Full Body Polish', price: 1499 },
        { id: '4w-interior-foam', name: 'Deep Interior Foam Wash & Vacuum', price: 1199 },
        { id: '4w-underbody', name: 'Anti-Rust Underbody Coating', price: 1899 },
        { id: '4w-engine-oil-upgrade', name: 'Premium Synthetic Oil Upgrade', price: 1200 }
      ]
    },
    twoWheeler: {
      packages: [
        {
          id: '2w-full-service',
          name: 'Full Periodic Bike Service',
          price: 899,
          duration: '2 - 3 Hours',
          popular: true,
          tag: 'Complete 2-Wheeler Care',
          features: [
            'Engine oil change & quality oil filter clean/swap',
            'Spark plug cleaning & electrode gap check',
            'Carburetor / throttle body cleaning & tuning',
            'Drive chain cleaning, tightening & high-temp lubrication',
            'Front & rear brake shoes/pads cleaning & adjustment',
            'Clutch & accelerator cable lubrication & free-play set',
            'Battery voltage check & electrical lights check',
            'Water foam wash & polish'
          ]
        },
        {
          id: '2w-denting-painting',
          name: 'Bike Denting & Paint Touch-Up',
          price: 1299,
          duration: '1 - 2 Days',
          popular: true,
          tag: 'Paint & Body Work',
          features: [
            'Fuel tank dent removal & surface leveling',
            'Scratch touchup & factory shade matching',
            'High-gloss clear coat & spray booth finish',
            'Panel beating, mudguard & visor buffing',
            'Machine buffing & protective wax polish'
          ]
        },
        {
          id: '2w-puncture-tyre',
          name: 'Tubeless Puncture & Tyre Care',
          price: 149,
          duration: '20 Mins',
          tag: 'Quick Puncture Fix',
          features: [
            'Heavy-duty vulcanized strip puncture sealing',
            'Water bath leak detection check',
            'Wheel rim bend & air pressure check',
            'Valve stem check & dust cap replacement'
          ]
        },
        {
          id: '2w-brake-overhaul',
          name: 'Brake Service & Fluid Bleed',
          price: 399,
          duration: '45 Mins',
          tag: 'Safe Braking',
          features: [
            'Front & rear brake pads/shoes cleaning & adjustment',
            'Brake fluid top-up & air bleeding',
            'Disc rotor cleaning & caliper pin greasing',
            'Drum brake spring tensioning'
          ]
        },
        {
          id: '2w-chain-sprocket',
          name: 'Chain & Sprocket Clean & Lube',
          price: 299,
          duration: '30 Mins',
          tag: 'Smooth Drive',
          features: [
            'Solvent chain degreasing & grime removal',
            'Sprocket teeth condition check',
            'Chain slack tension adjustment',
            'High-temperature chain lube application'
          ]
        },
        {
          id: '2w-ev-check',
          name: 'EV Scooter Service & Health Check',
          price: 799,
          duration: '1.5 Hours',
          tag: 'Electric Scooters',
          features: [
            'Battery health scan & connector terminal inspection',
            'BLDC motor & belt drive tension check',
            'Brake pads & electronic throttle check',
            'Wiring harness inspection & general safety check'
          ]
        }
      ],
      addons: [
        { id: '2w-puncture-addon', name: 'Puncture Fix (Per Puncture)', price: 99 },
        { id: '2w-tank-polish', name: 'Tank & Visor Scratch Buffing Polish', price: 399 },
        { id: '2w-chain-spray', name: 'Chain Lube Spray Treatment', price: 199 },
        { id: '2w-spark-plug', name: 'Spark Plug Replacement', price: 250 },
        { id: '2w-synth-oil', name: 'Synthetic Engine Oil Upgrade', price: 650 }
      ]
    }
  };

  async function fetchServiceCatalog() {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success && data.data) {
        serviceCatalog = data.data;
      } else {
        serviceCatalog = DEFAULT_CATALOG;
      }
    } catch (err) {
      serviceCatalog = DEFAULT_CATALOG;
    }
    renderPackages();
    populateEstimatorDropdowns();
  }

  function renderPackages() {
    if (!serviceCatalog) return;
    const container = document.getElementById('packagesGrid');
    if (!container) return;

    container.innerHTML = '';

    let packagesToRender = [];
    if (activeCategory === 'all') {
      const fourW = (serviceCatalog.fourWheeler?.packages || []).map(p => ({
        ...p,
        categoryLabel: '4-Wheeler (Car)',
        categoryClass: 'four-wheeler'
      }));
      const twoW = (serviceCatalog.twoWheeler?.packages || []).map(p => ({
        ...p,
        categoryLabel: '2-Wheeler (Bike)',
        categoryClass: 'two-wheeler'
      }));
      packagesToRender = [...fourW, ...twoW];
    } else {
      const cur = serviceCatalog[activeCategory];
      const is4W = activeCategory === 'fourWheeler';
      const catLabel = is4W ? '4-Wheeler (Car)' : '2-Wheeler (Bike)';
      const catClass = is4W ? 'four-wheeler' : 'two-wheeler';
      packagesToRender = (cur?.packages || []).map(p => ({
        ...p,
        categoryLabel: catLabel,
        categoryClass: catClass
      }));
    }

    packagesToRender.forEach(pkg => {
      const card = document.createElement('div');
      card.className = `package-card ${pkg.popular ? 'popular' : ''}`;
      card.innerHTML = `
        ${pkg.popular ? `<div class="package-ribbon">POPULAR</div>` : ''}
        <div class="package-header">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.4rem;">
            <span class="package-category-badge ${pkg.categoryClass}">${pkg.categoryLabel}</span>
            <span class="package-tag">${pkg.tag || 'Specialist'}</span>
          </div>
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
        <div class="package-action" style="margin-top: auto; padding-top: 1rem;">
          <button type="button" class="btn btn-outline-red btn-sm select-pkg-btn" style="width: 100%;" 
            data-pkg-name="${pkg.name}" 
            data-pkg-price="${pkg.price}"
            data-vehicle-type="${pkg.categoryClass === 'four-wheeler' ? '4W' : '2W'}">
            Book This Service
          </button>
        </div>
      `;

      card.querySelector('.select-pkg-btn').addEventListener('click', () => {
        const vType = pkg.categoryClass === 'four-wheeler' ? '4W' : '2W';
        applyPackageToBooking(pkg.name, pkg.price, vType);
      });

      container.appendChild(card);
    });
  }

  function applyPackageToBooking(pkgName, pkgPrice, vType = '4W') {
    syncBookingFormCategory(vType);

    const pkgSelect = document.getElementById('bookingPackage');
    if (pkgSelect) {
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

    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    showToast(`Selected "${pkgName}". Please fill your contact details below!`);
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
      const selectedCat = estCategorySelect.value;
      switchCategory(selectedCat);
    });

    estPackageSelect?.addEventListener('change', calculateEstimate);

    estApplyBookingBtn?.addEventListener('click', () => {
      const selectedPkgName = estPackageSelect?.options[estPackageSelect.selectedIndex]?.getAttribute('data-name') || estPackageSelect?.value || 'Selected Package';
      const modelVal = estVehicleModel?.value?.trim();
      const totalVal = calculateEstimate();

      const chosenCat = estCategorySelect?.value || 'fourWheeler';
      const vType = chosenCat === 'twoWheeler' ? '2W' : '4W';

      syncBookingFormCategory(vType);

      const modelInput = document.getElementById('bookingModel');
      if (modelInput && modelVal) {
        modelInput.value = modelVal;
      }

      applyPackageToBooking(selectedPkgName, totalVal, vType);
    });
  }

  function updateEstimatorCategory(cat) {
    const validCat = cat === 'twoWheeler' ? 'twoWheeler' : 'fourWheeler';
    if (estCategorySelect) {
      estCategorySelect.value = validCat;
    }
    populateEstimatorDropdowns(validCat);
    calculateEstimate();
  }

  function populateEstimatorDropdowns(catKey = null) {
    if (!serviceCatalog) return;
    const cat = catKey || (estCategorySelect ? estCategorySelect.value : 'fourWheeler');
    const cur = serviceCatalog[cat] || serviceCatalog['fourWheeler'];
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
      (cur.addons || []).forEach(ad => {
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
    const gst = Math.round(subtotal * 0.18); // 18% standard taxes
    const grandTotal = subtotal + gst;

    if (estBasePriceDisplay) estBasePriceDisplay.textContent = `₹${pkgPrice.toLocaleString()}`;
    if (estAddonsPriceDisplay) estAddonsPriceDisplay.textContent = `₹${addonsSum.toLocaleString()}`;
    if (estTaxPriceDisplay) estTaxPriceDisplay.textContent = `₹${gst.toLocaleString()}`;
    if (estTotalPriceDisplay) estTotalPriceDisplay.textContent = `₹${grandTotal.toLocaleString()}`;

    return grandTotal;
  }

  // ----------------------------------------------------
  // 6. Booking Form Submission & WhatsApp Direct
  // ----------------------------------------------------
  const bookingForm = document.getElementById('bookingForm');
  const typeCards = document.querySelectorAll('.type-selector-card');
  const bookingTypeInput = document.getElementById('bookingVehicleType');
  const bookingPackageSelect = document.getElementById('bookingPackage');
  const successModal = document.getElementById('successModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  function setupBookingForm() {
    if (!bookingForm) return;
    // Set min date to today
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }

    // 4W / 2W Selector Cards
    typeCards.forEach(card => {
      card.addEventListener('click', () => {
        typeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const vType = card.getAttribute('data-type') || '4W';
        syncBookingFormCategory(vType);
      });
    });

    // Close Modal Button
    modalCloseBtn?.addEventListener('click', () => {
      successModal?.classList.remove('active');
    });

    // Close Modal on clicking outside
    successModal?.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.classList.remove('active');
      }
    });

    // Form submit
    bookingForm?.addEventListener('submit', handleBookingSubmit);
  }

  function syncBookingFormCategory(vType) {
    if (bookingTypeInput) {
      bookingTypeInput.value = vType;
    }

    // Highlight matching visual card
    typeCards.forEach(c => {
      if (c.getAttribute('data-type') === vType) c.classList.add('selected');
      else c.classList.remove('selected');
    });

    // Populate packages in booking dropdown
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

      // Additional options
      const optDenting = document.createElement('option');
      optDenting.value = 'Custom Denting & Painting Consultation';
      optDenting.textContent = '🎨 Denting & Painting (Quote on Vehicle Inspection)';
      bookingPackageSelect.appendChild(optDenting);

      const optGeneral = document.createElement('option');
      optGeneral.value = 'General Vehicle Checkup & Troubleshooting';
      optGeneral.textContent = '🔍 General Checkup & Mechanical Advice';
      bookingPackageSelect.appendChild(optGeneral);
    }
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('bookingSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Booking...';

    const customerName = document.getElementById('bookingName')?.value?.trim();
    const phone = document.getElementById('bookingPhone')?.value?.trim();
    const vehicleType = bookingTypeInput?.value || '4W';
    const vehicleBrand = document.getElementById('bookingBrand')?.value?.trim();
    const vehicleModel = document.getElementById('bookingModel')?.value?.trim();
    const regNumber = document.getElementById('bookingPlate')?.value?.trim() || 'Awaiting Check-in';
    const servicePackage = bookingPackageSelect?.value;
    const serviceDate = document.getElementById('bookingDate')?.value;
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
        showToast(`Service Booked! Ref ID: ${data.booking.id}`, 'success');
      } else {
        // Fallback local confirmation if running static without server
        const fallbackBooking = {
          id: `PM-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName,
          phone,
          vehicleType,
          vehicleBrand,
          vehicleModel,
          regNumber,
          servicePackage,
          serviceDate
        };
        const waText = encodeURIComponent(
          `*PROTOMOTORS GARAGE - SERVICE BOOKING*\n\n` +
          `*Customer:* ${customerName}\n` +
          `*Phone:* ${phone}\n` +
          `*Vehicle:* [${vehicleType}] ${vehicleBrand} ${vehicleModel}\n` +
          `*Service:* ${servicePackage}\n` +
          `*Preferred Date:* ${serviceDate}\n` +
          (customerNotes ? `*Notes:* ${customerNotes}\n` : '') +
          `\n📍 *Address:* Near Vagdevi Vilas School, Kannamangala Dinnur, Bangalore East 560067\n` +
          `⏱️ *Hours:* 9:00 AM – 9:00 PM\n` +
          `📞 *Hotline:* 9686643618\n\n` +
          `Hi Protomotors Garage, please confirm my booking appointment!`
        );
        const fallbackWaUrl = `https://wa.me/919686643618?text=${waText}`;
        showSuccessModal(fallbackBooking, fallbackWaUrl);
        bookingForm.reset();
        syncBookingFormCategory(vehicleType);
      }
    } catch (err) {
      // Offline / direct static HTML handling
      const fallbackBooking = {
        id: `PM-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName,
        phone,
        vehicleType,
        vehicleBrand,
        vehicleModel,
        regNumber,
        servicePackage,
        serviceDate
      };
      const waText = encodeURIComponent(
        `*PROTOMOTORS GARAGE - SERVICE BOOKING*\n\n` +
        `*Customer:* ${customerName}\n` +
        `*Phone:* ${phone}\n` +
        `*Vehicle:* [${vehicleType}] ${vehicleBrand} ${vehicleModel}\n` +
        `*Service:* ${servicePackage}\n` +
        `*Preferred Date:* ${serviceDate}\n` +
        `\n📍 Near Vagdevi Vilas School, Kannamangala Dinnur, Bangalore East 560067\n` +
        `📞 9686643618\n\n` +
        `Hi Protomotors Garage, please confirm my booking!`
      );
      showSuccessModal(fallbackBooking, `https://wa.me/919686643618?text=${waText}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
        Confirm Service Booking
      `;
    }
  }

  function showSuccessModal(booking, whatsappUrl) {
    const elId = document.getElementById('modalJobId');
    if (elId) elId.textContent = booking.id;

    const elCust = document.getElementById('modalCustomer');
    if (elCust) elCust.textContent = booking.customerName;

    const elVeh = document.getElementById('modalVehicle');
    if (elVeh) elVeh.textContent = `[${booking.vehicleType}] ${booking.vehicleBrand} ${booking.vehicleModel}`;

    const elReg = document.getElementById('modalReg');
    if (elReg) elReg.textContent = booking.regNumber || 'Check-in on Arrival';

    const elPkg = document.getElementById('modalPackage');
    if (elPkg) elPkg.textContent = booking.servicePackage;

    const elSlot = document.getElementById('modalSlot');
    if (elSlot) elSlot.textContent = `${booking.serviceDate} (9:00 AM – 9:00 PM)`;

    // WhatsApp Button
    const waBtn = document.getElementById('modalWhatsAppBtn');
    if (waBtn) {
      waBtn.href = whatsappUrl || 'https://wa.me/919686643618';
    }

    successModal?.classList.add('active');

    // Automatically trigger WhatsApp in new tab for customer convenience
    if (whatsappUrl) {
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 700);
    }
  }

  // ----------------------------------------------------
  // 7. Live Vehicle Progress Tracker
  // ----------------------------------------------------
  const trackForm = document.getElementById('trackVehicleForm');
  const trackQueryInput = document.getElementById('trackQueryInput');
  const trackerOutput = document.getElementById('trackerOutput');
  const BOOKINGS_STORAGE_KEY = 'proto_workshop_bookings_v2';

  // Fallback seed vehicles if offline/no localstorage
  const FALLBACK_SEED_JOBS = [
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
      estimatedReadyTime: "Today at 5:30 PM"
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
      mechanicNotes: "Engine oil drained. Tappet clearance being measured. Front brake disc pads at 40% life; replacement queued.",
      technician: "Aditya (Senior Bike Tech)",
      estimatedReadyTime: "Today at 3:30 PM"
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
      estimatedReadyTime: "Ready Now"
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
      estimatedReadyTime: "Today at 4:00 PM"
    }
  ];

  function setupVehicleTracker() {
    if (!trackForm) return;

    // Track Form Submit
    trackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = trackQueryInput?.value?.trim();
      if (!query) return;

      const submitBtn = document.getElementById('trackSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Searching Bay...';
      }

      await executeTrackQuery(query);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '⚡ Track Vehicle';
      }
    });

    // Quick Pill Hints
    document.querySelectorAll('.tracker-pill-hint').forEach(pill => {
      pill.addEventListener('click', () => {
        const query = pill.getAttribute('data-query');
        if (query && trackQueryInput) {
          trackQueryInput.value = query;
          executeTrackQuery(query);
        }
      });
    });
  }

  async function executeTrackQuery(query) {
    if (!trackerOutput) return;

    trackerOutput.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem; animation: pulseNode 1.5s infinite;">🔍</div>
        <p>Scanning Proto Motors Workshop Desk for Job ID or Phone Number...</p>
      </div>
    `;

    const cleanQuery = query.trim().toLowerCase();
    const cleanDigits = query.replace(/[^0-9]/g, '');

    let foundBooking = null;

    // 1. First attempt: Server API /api/track/:query
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(cleanQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.booking) {
          foundBooking = data.booking;
        }
      }
    } catch (err) {
      // Server unreachable, fallback to localStorage
    }

    // 2. Second attempt: Check localStorage
    if (!foundBooking) {
      try {
        const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            // Match by Job ID (e.g. PM-9121 or 9121)
            foundBooking = list.find(b => 
              b.id.toLowerCase() === cleanQuery || 
              b.id.toLowerCase() === `pm-${cleanQuery}`
            );

            // Match by Phone number
            if (!foundBooking && cleanDigits.length >= 7) {
              foundBooking = list.find(b => b.phone && b.phone.includes(cleanDigits));
            }
          }
        }
      } catch (e) {}
    }

    // 3. Third attempt: Check fallback seed jobs
    if (!foundBooking) {
      foundBooking = FALLBACK_SEED_JOBS.find(b => 
        b.id.toLowerCase() === cleanQuery || 
        b.id.toLowerCase() === `pm-${cleanQuery}`
      );
      if (!foundBooking && cleanDigits.length >= 7) {
        foundBooking = FALLBACK_SEED_JOBS.find(b => b.phone && b.phone.includes(cleanDigits));
      }
    }

    // Render result
    if (foundBooking) {
      renderTrackingResult(foundBooking);
      trackerOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      renderTrackingNotFound(query);
    }
  }

  function renderTrackingResult(b) {
    const stageMap = {
      'Received': 1,
      'Inspection': 2,
      'In Progress': 3,
      'Quality Check': 4,
      'Ready for Delivery': 5,
      'Delivered': 6
    };

    const currentStageNum = b.statusStage || stageMap[b.status] || 1;

    const stagesConfig = [
      { num: 1, title: 'Received', icon: '📋', desc: 'Intake logged in workshop bay' },
      { num: 2, title: 'Inspection', icon: '🔍', desc: 'Diagnostic & health checkup' },
      { num: 3, title: 'In Progress', icon: '⚙️', desc: 'Active repair & part servicing' },
      { num: 4, title: 'Quality Check', icon: '✨', desc: 'Road test & final wash/polish' },
      { num: 5, title: 'Ready', icon: '🏁', desc: 'Vehicle ready for customer pickup' }
    ];

    const statusBadgeClass = `status-${(b.status || 'Received').toLowerCase().replace(/\s+/g, '-')}`;

    // WhatsApp Direct Inquiry Link
    const waText = encodeURIComponent(
      `*PROTOMOTORS GARAGE - SERVICE STATUS INQUIRY*\n\n` +
      `Hi, I am tracking my vehicle:\n` +
      `*Job ID:* ${b.id}\n` +
      `*Customer:* ${b.customerName}\n` +
      `*Vehicle:* [${b.vehicleType}] ${b.vehicleBrand} ${b.vehicleModel}\n` +
      `*Current Status:* ${b.status.toUpperCase()}\n\n` +
      `Could you please share the latest update on completion time? Thank you!`
    );
    const whatsappInquiryUrl = `https://wa.me/919686643618?text=${waText}`;

    trackerOutput.innerHTML = `
      <div class="track-card">
        <!-- Card Top Bar -->
        <div class="track-card-header">
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 900; color: #fff; letter-spacing: 0.05em;">
              JOB ORDER <span style="color: var(--red-racing);">${b.id}</span>
            </div>
            <span class="badge ${b.vehicleType === '2W' ? 'badge-2w' : 'badge-4w'}">${b.vehicleType}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="badge ${b.status === 'Ready for Delivery' ? 'badge-green' : 'badge-red'}" style="font-size: 0.825rem; padding: 0.4rem 0.9rem; text-transform: uppercase;">
              ● ${b.status}
            </span>
          </div>
        </div>

        <!-- Vehicle Headline Banner -->
        <div class="track-vehicle-headline">
          <div>
            <h3 style="margin: 0 0 0.35rem 0; font-size: 1.3rem; color: #fff;">
              ${b.vehicleBrand} ${b.vehicleModel}
            </h3>
            <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <span>REG PLATE: <strong style="color: #fbbf24; letter-spacing: 0.06em;">${b.regNumber || 'Awaiting Check-in'}</strong></span>
              <span>•</span>
              <span style="color: #fff;">${b.servicePackage}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; font-family: var(--font-heading);">ESTIMATED BILL</div>
            <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 900; color: #22c55e;">
              ₹${(b.estimatedPrice || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <!-- 5-Stage Step Progress Visualizer -->
        <div class="track-stepper-wrap">
          <div class="track-stepper-title">
            <span>LIVE REPAIR PROGRESSION (STAGE ${Math.min(currentStageNum, 5)} OF 5)</span>
            <span style="color: ${currentStageNum >= 5 ? '#22c55e' : 'var(--red-racing)'}; font-weight: 800;">
              ${currentStageNum >= 5 ? '✓ READY FOR HANDOVER' : '⚡ UNDER WORKSHOP CARE'}
            </span>
          </div>

          <div class="stepper-steps">
            ${stagesConfig.map(s => {
              let stateClass = 'pending';
              let stateIcon = s.icon;
              if (s.num < currentStageNum || currentStageNum >= 6) {
                stateClass = 'completed';
                stateIcon = '✓';
              } else if (s.num === currentStageNum) {
                stateClass = 'current';
              }

              return `
                <div class="step-node ${stateClass}">
                  <div class="step-icon-circle">${stateIcon}</div>
                  <div>
                    <div class="step-label">${s.title}</div>
                    <div class="step-desc">${s.desc}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Bay Logistics Grid -->
        <div class="track-info-grid">
          <div class="track-info-item">
            <div class="track-info-label">👨‍🔧 ASSIGNED TECHNICIAN</div>
            <div class="track-info-val">${b.technician || 'Senior Workshop Mechanic'}</div>
          </div>
          <div class="track-info-item">
            <div class="track-info-label">⏱ EST. READY TIME</div>
            <div class="track-info-val" style="color: #fbbf24;">${b.estimatedReadyTime || 'Today 5:00 PM'}</div>
          </div>
          <div class="track-info-item">
            <div class="track-info-label">📅 INTAKE DATE</div>
            <div class="track-info-val">${b.serviceDate || 'Today'}</div>
          </div>
          <div class="track-info-item">
            <div class="track-info-label">📍 WORKSHOP LOCATION</div>
            <div class="track-info-val">Kannamangala Dinnur Bay</div>
          </div>
        </div>

        <!-- Mechanic Diagnostic Notes -->
        <div class="track-notes-box">
          <div style="font-size: 0.75rem; font-family: var(--font-heading); color: var(--red-racing); font-weight: 800; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>🔧 MECHANIC OBSERVATIONS &amp; WORK LOG:</span>
          </div>
          <p style="margin: 0; font-size: 0.9rem; color: #fff; line-height: 1.5;">
            ${b.mechanicNotes || 'Vehicle under active mechanical and bay inspection. Quality assurance checks in progress.'}
          </p>
        </div>

        <!-- Action Links -->
        <div class="track-actions-row">
          <a href="${whatsappInquiryUrl}" target="_blank" class="btn btn-primary" style="background: #25D366; border-color: #25D366;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
            Ask Question on WhatsApp (9686643618)
          </a>
          <a href="tel:+919686643618" class="btn btn-secondary">
            📞 Call Bay Lead (9686643618)
          </a>
        </div>
      </div>
    `;
  }

  function renderTrackingNotFound(query) {
    trackerOutput.innerHTML = `
      <div class="track-card" style="text-align: center; padding: 3rem 1.5rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3 style="color: #fff; margin-bottom: 0.5rem; font-size: 1.35rem;">No Active Vehicle Found</h3>
        <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto 1.5rem; font-size: 0.9rem;">
          We couldn't locate an active job order matching <strong>"${query}"</strong>. Please verify your Job ID (e.g. <strong>PM-9121</strong>) or registered phone number.
        </p>
        <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
          <a href="https://wa.me/919686643618?text=Hi%20Protomotors,%20I%20am%20trying%20to%20track%20my%20vehicle%20with%20ID%20${encodeURIComponent(query)}" target="_blank" class="btn btn-primary" style="background: #25D366; border-color: #25D366;">
            💬 Ask Support on WhatsApp
          </a>
          <a href="tel:+919686643618" class="btn btn-secondary">
            📞 Call: 9686643618
          </a>
        </div>
      </div>
    `;
  }
});

