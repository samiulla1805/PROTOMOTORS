const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'bookings.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SAMSASM1122';
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
            serviceDate = new Date().toISOString().split('T')[0],
            timeSlot,
            customerNotes = '',
            pickupDrop = false,
            status = 'Received',
            statusStage = 1,
            mechanicNotes,
            technician,
            estimatedReadyTime
        } = req.body;

        if (!customerName || !phone || !vehicleType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: Customer Name, Phone, and Vehicle Type are mandatory.'
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
            servicePackage: servicePackage || 'General Service',
            addons: Array.isArray(addons) ? addons : [],
            estimatedPrice: Number(estimatedPrice) || 0,
            serviceDate: serviceDate || new Date().toISOString().split('T')[0],
            timeSlot: timeSlot || 'Regular Hours (9:00 AM - 9:00 PM)',
            status: status || 'Received',
            statusStage: Number(statusStage) || 1,
            mechanicNotes: mechanicNotes || (customerNotes ? `Customer Notes: ${customerNotes}` : 'Booking confirmed. Initial workshop inspection scheduled.'),
            technician: technician || 'Senior Workshop Mechanic',
            estimatedReadyTime: estimatedReadyTime || 'Est. same-day delivery',
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
        const workshopPhone = '919686643618';
        const waText = encodeURIComponent(
            `*PROTOMOTORS GARAGE - SERVICE BOOKING*\n\n` +
            `*Job ID:* ${jobId}\n` +
            `*Customer:* ${newBooking.customerName}\n` +
            `*Phone:* ${newBooking.phone}\n` +
            `*Vehicle:* [${newBooking.vehicleType}] ${newBooking.vehicleBrand} ${newBooking.vehicleModel}\n` +
            `*Reg No:* ${newBooking.regNumber}\n` +
            `*Service:* ${newBooking.servicePackage}\n` +
            `*Date:* ${newBooking.serviceDate}\n` +
            `*Pickup & Drop:* ${newBooking.pickupDrop ? 'Yes' : 'No'}\n` +
            (newBooking.customerNotes ? `*Notes:* ${newBooking.customerNotes}\n` : '') +
            `\n📍 *Address:* Near Vagdevi Vilas School, Bangalore East, Kannamangala Dinnur, Karnataka 560067\n` +
            `⏱️ *Hours:* 9:00 AM – 9:00 PM (Everyday)\n` +
            `📞 *Hotline:* 9686643618\n\n` +
            `Hi Protomotors Garage, please confirm my booking appointment!`
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
    console.log(`🔑 Admin Pass:   [HIDDEN]`);
    console.log(`=========================================`);
});
