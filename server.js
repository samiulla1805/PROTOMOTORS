const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'bookings.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'proto2026';
const ADMIN_AUTH_TOKEN = 'proto-motors-auth-token-2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database helper functions
function readBookings() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading bookings file:', err);
    return [];
  }
}

function writeBookings(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing bookings file:', err);
    return false;
  }
}

// Generate unique Job ID: PM-XXXX
function generateJobId(existingBookings) {
  const existingIds = new Set(existingBookings.map(b => b.id));
  let newId = '';
  do {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    newId = `PM-${randomDigits}`;
  } while (existingIds.has(newId));
  return newId;
}

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token === ADMIN_AUTH_TOKEN) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing admin credentials.' });
}

// ==================== SERVICE CATALOG DATA ====================
const SERVICE_CATALOG = {
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

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Proto Motors API', timestamp: new Date().toISOString() });
});

// Services Catalog
app.get('/api/services', (req, res) => {
  res.json({ success: true, data: SERVICE_CATALOG });
});

// 1. POST /api/bookings - Create new appointment with Job ID PM-XXXX
app.post('/api/bookings', (req, res) => {
  try {
    const {
      customerName,
      phone,
      vehicleType, // '2W' or '4W'
      vehicleBrand,
      vehicleModel,
      regNumber,
      servicePackage,
      addons = [],
      estimatedPrice = 0,
      serviceDate,
      timeSlot,
      customerNotes = '',
      pickupDrop = false
    } = req.body;

    if (!customerName || !phone || !vehicleType || !vehicleModel || !serviceDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: Customer Name, Phone, Vehicle Type, Model, and Date are mandatory.'
      });
    }

    const bookings = readBookings();
    const jobId = generateJobId(bookings);

    const newBooking = {
      id: jobId,
      customerName: customerName.trim(),
      phone: phone.replace(/[^0-9]/g, ''),
      vehicleType: vehicleType.toUpperCase(),
      vehicleBrand: (vehicleBrand || '').trim(),
      vehicleModel: (vehicleModel || '').trim(),
      regNumber: (regNumber || 'Awaiting Check-in').trim().toUpperCase(),
      servicePackage: servicePackage || 'General Performance Service',
      addons: Array.isArray(addons) ? addons : [],
      estimatedPrice: Number(estimatedPrice) || 0,
      serviceDate: serviceDate,
      timeSlot: timeSlot || '10:00 AM',
      status: 'Received',
      statusStage: 1, // 1: Received, 2: Inspection, 3: In Progress, 4: Quality Check, 5: Ready for Delivery, 6: Delivered
      mechanicNotes: 'Vehicle intake confirmed. Initial inspection scheduled with master technician upon arrival.',
      technician: 'Assigned on Arrival',
      estimatedReadyTime: 'Est. within 6-8 hrs from intake',
      pickupDrop: Boolean(pickupDrop),
      customerNotes: (customerNotes || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    const saved = writeBookings(bookings);

    if (!saved) {
      return res.status(500).json({ success: false, message: 'Failed to write booking data.' });
    }

    // Generate WhatsApp confirmation message link
    const workshopPhone = '919876543210';
    const waText = encodeURIComponent(
      `*🏁 PROTO MOTORS SERVICE BOOKING CONFIRMATION*\n\n` +
      `*Job ID:* ${jobId}\n` +
      `*Customer:* ${newBooking.customerName}\n` +
      `*Vehicle:* [${newBooking.vehicleType}] ${newBooking.vehicleBrand} ${newBooking.vehicleModel}\n` +
      `*Reg No:* ${newBooking.regNumber}\n` +
      `*Package:* ${newBooking.servicePackage}\n` +
      `*Date & Slot:* ${newBooking.serviceDate} (${newBooking.timeSlot})\n` +
      `*Est. Total:* ₹${newBooking.estimatedPrice.toLocaleString()}\n` +
      `*Pickup & Drop:* ${newBooking.pickupDrop ? 'Yes' : 'No'}\n\n` +
      `📍 Workshop Location: PROTO MOTORS Performance Hub, Ring Road\n` +
      `🔗 Track Status Online: https://protomotors.local/track?id=${jobId}\n\n` +
      `Thank you for trusting PROTO MOTORS. See you on track!`
    );
    const whatsappUrl = `https://wa.me/${workshopPhone}?text=${waText}`;

    return res.status(201).json({
      success: true,
      message: `Booking created successfully! Your Job ID is ${jobId}`,
      booking: newBooking,
      whatsappUrl: whatsappUrl
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ success: false, message: 'Server error while processing booking.' });
  }
});

// 2. GET /api/track/:query - Retrieve status by Job ID (PM-XXXX) or Phone Number
app.get('/api/track/:query', (req, res) => {
  try {
    const query = req.params.query.trim().toLowerCase();
    const cleanDigits = query.replace(/[^0-9]/g, '');
    const bookings = readBookings();

    // Check exact Job ID match
    let match = bookings.find(b => b.id.toLowerCase() === query || b.id.toLowerCase() === `pm-${query}`);

    // If not found by Job ID, search by phone number
    if (!match && cleanDigits.length >= 7) {
      const phoneMatches = bookings.filter(b => b.phone.includes(cleanDigits));
      if (phoneMatches.length > 0) {
        // Return latest match plus other bookings for that number
        match = phoneMatches[0];
        return res.json({
          success: true,
          booking: match,
          multiple: phoneMatches.length > 1,
          allMatches: phoneMatches
        });
      }
    }

    if (!match) {
      return res.status(404).json({
        success: false,
        message: `No active vehicle found matching "${req.params.query}". Please check your Job ID (e.g., PM-8821) or phone number.`
      });
    }

    return res.json({
      success: true,
      booking: match
    });
  } catch (err) {
    console.error('Error tracking vehicle:', err);
    return res.status(500).json({ success: false, message: 'Server error while querying vehicle tracker.' });
  }
});

// 3. POST /api/admin/login - Authenticate Admin Portal
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  if (password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      token: ADMIN_AUTH_TOKEN,
      message: 'Admin authorization successful.'
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid administrative password.'
    });
  }
});

// 4. GET /api/admin/bookings - Fetch all bookings (Admin protected)
app.get('/api/admin/bookings', requireAdmin, (req, res) => {
  try {
    const bookings = readBookings();
    res.json({
      success: true,
      count: bookings.length,
      bookings: bookings
    });
  } catch (err) {
    console.error('Error fetching admin bookings:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

// 5. PATCH /api/admin/bookings/:id - Update repair stage and mechanic notes
app.patch('/api/admin/bookings/:id', requireAdmin, (req, res) => {
  try {
    const jobId = req.params.id.toUpperCase();
    const { status, statusStage, mechanicNotes, technician, estimatedReadyTime, estimatedPrice } = req.body;

    const bookings = readBookings();
    const index = bookings.findIndex(b => b.id.toUpperCase() === jobId);

    if (index === -1) {
      return res.status(404).json({ success: false, message: `Job ${jobId} not found.` });
    }

    const stageMap = {
      'Received': 1,
      'Inspection': 2,
      'In Progress': 3,
      'Quality Check': 4,
      'Ready for Delivery': 5,
      'Delivered': 6
    };

    if (status !== undefined) {
      bookings[index].status = status;
      bookings[index].statusStage = statusStage || stageMap[status] || bookings[index].statusStage;
    }
    if (mechanicNotes !== undefined) {
      bookings[index].mechanicNotes = mechanicNotes;
    }
    if (technician !== undefined) {
      bookings[index].technician = technician;
    }
    if (estimatedReadyTime !== undefined) {
      bookings[index].estimatedReadyTime = estimatedReadyTime;
    }
    if (estimatedPrice !== undefined) {
      bookings[index].estimatedPrice = Number(estimatedPrice);
    }

    bookings[index].updatedAt = new Date().toISOString();

    const saved = writeBookings(bookings);
    if (!saved) {
      return res.status(500).json({ success: false, message: 'Failed to update job record.' });
    }

    // Compose notification text for WhatsApp
    const b = bookings[index];
    const notifyText = encodeURIComponent(
      `*🏁 PROTO MOTORS UPDATE - Job #${b.id}*\n\n` +
      `Hello ${b.customerName},\n` +
      `Your vehicle *[${b.vehicleType}] ${b.vehicleBrand} ${b.vehicleModel}* is currently:\n` +
      `⚡ *Status:* ${b.status.toUpperCase()}\n` +
      `🔧 *Mechanic Notes:* ${b.mechanicNotes}\n` +
      `⏱ *Est. Delivery:* ${b.estimatedReadyTime}\n` +
      `👨‍🔧 *Technician:* ${b.technician}\n\n` +
      `Need urgent assistance? Reply here or call +91 98765 43210.\n` +
      `Proto Motors Performance Hub.`
    );
    const whatsappNotifyUrl = `https://wa.me/91${b.phone}?text=${notifyText}`;

    return res.json({
      success: true,
      message: `Job ${jobId} updated successfully.`,
      booking: bookings[index],
      whatsappNotifyUrl: whatsappNotifyUrl
    });
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ success: false, message: 'Server error updating booking.' });
  }
});

// 6. DELETE /api/admin/bookings/:id - Remove test booking (Admin protected)
app.delete('/api/admin/bookings/:id', requireAdmin, (req, res) => {
  try {
    const jobId = req.params.id.toUpperCase();
    let bookings = readBookings();
    const initialLen = bookings.length;
    bookings = bookings.filter(b => b.id.toUpperCase() !== jobId);

    if (bookings.length === initialLen) {
      return res.status(404).json({ success: false, message: `Job ${jobId} not found.` });
    }

    writeBookings(bookings);
    res.json({ success: true, message: `Job ${jobId} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting job.' });
  }
});

// 7. GET /api/stats - High-level metrics for dashboard
app.get('/api/stats', (req, res) => {
  try {
    const bookings = readBookings();
    const activeJobs = bookings.filter(b => ['Received', 'Inspection', 'In Progress', 'Quality Check'].includes(b.status));
    const readyJobs = bookings.filter(b => b.status === 'Ready for Delivery');
    const deliveredJobs = bookings.filter(b => b.status === 'Delivered');
    const twoWheelers = bookings.filter(b => b.vehicleType === '2W');
    const fourWheelers = bookings.filter(b => b.vehicleType === '4W');
    const totalRevenueEst = bookings.reduce((sum, b) => sum + (Number(b.estimatedPrice) || 0), 0);

    res.json({
      success: true,
      stats: {
        total: bookings.length,
        active: activeJobs.length,
        ready: readyJobs.length,
        delivered: deliveredJobs.length,
        twoWheelers: twoWheelers.length,
        fourWheelers: fourWheelers.length,
        totalRevenue: totalRevenueEst
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compute stats.' });
  }
});

// Direct admin redirect route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback route for SPA client routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🏎️ PROTO MOTORS WEB APP RUNNING ON PORT ${PORT}`);
  console.log(`🌐 Customer App: http://localhost:${PORT}`);
  console.log(`🔒 Admin Portal: http://localhost:${PORT}/admin.html`);
  console.log(`🔑 Admin Pass:   proto2026`);
  console.log(`=========================================`);
});
