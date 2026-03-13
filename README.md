# 🌉 SewaPro — On-Demand Local Worker Platform



---

## 📌 Problem Statement

In India, finding skilled workers like **plumbers, electricians, and carpenters** is still a manual and unreliable process. People ask neighbors or try random phone numbers found on walls — there is no **trusted, verified, real-time platform** where:

- Someone who needs a worker can find a **nearby verified professional instantly**
- Workers can **receive jobs, manage their schedule, and track earnings** from one place
- There is **transparency** in pricing, ratings, and work history

**KaushalSetu** solves this problem by providing an **Uber-style, location-based platform** that connects skilled workers with admins (employers/clients) in real time — with live maps, verified profiles, calendar booking, and complete job tracking.

---

## 🎯 Project Objective

> Build a full stack platform that connects **skilled local workers** (Plumber, Electrician, Carpenter, Painter, Mason) with **admins** who need their services — using real-time location, live maps, verified profiles, and complete job lifecycle management.

**Real-World Impact:**
- Targets **Tier 2-3 cities** in India where digital service platforms are absent
- Brings **trust and transparency** to informal skilled labor market
- Provides workers with a **digital identity** and income tracking
- Enables admins to find the **nearest available verified worker** in minutes

---

## 🛠️ Tech Stack

### 🖥️ Frontend
| Technology | Purpose |
|---|---|
| ⚛️ **React.js** | Component-based UI framework |
| 🎨 **Tailwind CSS** | Utility-first CSS for responsive design |
| 🔀 **React Router DOM v6** | Client-side routing and navigation |
| 🗺️ **React-Leaflet + OpenStreetMap** | Free interactive live map (no API key needed) |
| 📊 **Recharts** | Charts for earnings and analytics dashboards |
| 🗓️ **React-Big-Calendar** | Calendar UI for booking management |
| 🔔 **React-Hot-Toast** | Real-time toast notifications |
| 📦 **Redux Toolkit** | Global state management |
| 🌐 **Axios** | HTTP requests with interceptors |
| 📄 **jsPDF + jsPDF-AutoTable** | Generate and download PDF reports |
| 🎞️ **Framer Motion** | Smooth page transitions and animations |
| 🔣 **Lucide React** | Clean modern icon set |

### ⚙️ Backend
| Technology | Purpose |
|---|---|
| 🟩 **Node.js** | JavaScript runtime environment |
| ⚡ **Express.js** | Fast and minimal REST API framework |
| 🔐 **JSON Web Token (JWT)** | Stateless authentication |
| 🔒 **Bcryptjs** | Secure password hashing |
| 📁 **Multer + Cloudinary** | File and image upload to cloud |
| 📧 **Nodemailer** | Email notifications (booking confirmations) |
| ✅ **Express Validator** | Server-side input validation |

### 🗄️ Database
| Technology | Purpose |
|---|---|
| 🍃 **MongoDB Atlas** | Cloud-hosted NoSQL database |
| 🔗 **Mongoose** | Schema modeling and ODM |
| 📍 **GeoJSON + $near operator** | Location-based geospatial queries |
| 📐 **2dsphere Index** | Enables fast geospatial search on worker locations |

---

## 👥 User Roles

KaushalSetu has **2 user roles** with completely different dashboards and permissions:

### 👑 Admin (Employer / Client)
The Admin is the person who needs work done. They can:
- Post jobs with title, category, location, date, budget, and description
- Open the **live map** and see all nearby available workers as colored markers
- Click on a worker marker to view their full profile, rating, price, and distance
- **Assign a job** to any worker directly from the map
- Manage bookings using a **visual calendar**
- Approve or reject new worker registrations
- View analytics dashboard with charts
- Export booking reports as **PDF**
- Rate and review workers after job completion

### 👷 Worker (Plumber / Electrician / Carpenter / Painter / Mason / Welder)
The Worker is the skilled professional. They can:
- Register and build a complete profile with skills, experience, and per-hour rate
- Upload profile photo and ID proof (Aadhaar) for verification
- Toggle **Online / Offline** status — map marker turns green when online
- Share **live GPS location** that updates every 30 seconds
- Receive job assignment notifications
- Accept or reject incoming job requests
- Update job status (In-Progress → Completed)
- View earnings dashboard with **weekly and monthly charts**
- See full job history and rating received

---

## 🗺️ How the Uber-Style Map Works

This is the most powerful and impressive feature of KaushalSetu:

```
Step 1: Admin opens the Map View page
Step 2: Admin's current location is detected via Browser Geolocation API
Step 3: Backend runs MongoDB $near query to find workers within 10km radius
Step 4: Available workers appear as GREEN markers 🟢 on the map
Step 5: Busy or offline workers appear as RED markers 🔴
Step 6: Job location is shown as a BLUE pin 📍
Step 7: Admin clicks any worker marker → popup card appears showing:
        - Worker name, category, phone number
        - ⭐ Average rating and total reviews
        - 💰 Price per hour
        - 📏 Exact distance (e.g., "1.2 km away")
        - ✅ Verified badge (if admin approved)
        - [View Full Profile] and [Assign Job] buttons
Step 8: Admin clicks "Assign Job" → worker receives a notification
Step 9: Worker accepts → job status updates, map reflects the change
```

**Technology Used:**
- `react-leaflet` with free OpenStreetMap tiles (no Google Maps API key needed)
- MongoDB GeoJSON `2dsphere` index for fast location queries
- `$near` operator to find workers sorted by distance
- Browser `navigator.geolocation` API for real-time GPS

---

## ✨ Complete Feature List

### 🔐 Authentication & Security
- User registration with role selection (Admin / Worker)
- Secure login with JWT token stored in LocalStorage
- Password hashing using bcryptjs
- Protected routes — unauthorized users redirected to login
- Role-based access control — Admin and Worker see different pages
- Auto logout on token expiry

### 👷 Worker Profile Management
- Complete profile setup: name, phone, category, experience, city, address
- Upload profile photo and ID proof to Cloudinary
- Set per-hour rate (₹)
- Add multiple skills as tags
- Edit and update any profile detail
- Profile completion percentage indicator

### 👑 Admin Controls
- Post new job with all required details and location pin
- View, edit, and delete posted jobs
- View list of all registered workers with search and filters
- View pending worker registrations — approve or reject with one click
- View full worker profile including ID proof
- Assign jobs to workers from map or worker list
- View all bookings in a table with pagination

### 🗺️ Live Map Features
- Real-time map with worker location markers
- Color-coded markers (green = available, red = busy/offline)
- Filter workers on map by category (Plumber, Electrician, etc.)
- Worker popup card with full details and assign button
- Distance calculation using Haversine formula
- Auto-refresh of worker positions

### 📅 Calendar Booking System
- Monthly and weekly calendar view
- Click any date to create a booking for that day
- Color-coded booking events by status
- Prevent double-booking of the same worker on same day/time
- View upcoming bookings highlighted on calendar

### 📋 Job Lifecycle Management
- Complete job status tracking: Open → Assigned → In-Progress → Completed → Rated
- Visual step-by-step timeline for each job
- Admin can cancel or reassign jobs
- Worker updates status in real time
- Job history for both admin and worker

### ⭐ Rating & Review System
- Admin rates worker (1 to 5 stars) after job completion
- Written review/comment option
- Worker's average rating auto-calculated and displayed on profile
- "Top Rated" badge automatically awarded for rating above 4.5
- All reviews visible on worker's public profile page

### 💰 Price Estimator
- Enter estimated hours needed
- App automatically calculates: `Estimated Cost = Hours × Worker's Rate Per Hour`
- Shown on worker popup card and booking form

### 🔔 Notification System
- Bell icon in header with unread count badge
- Notifications for: job assigned, job accepted, status changed, new review
- Mark all as read option
- Notification history list

### 📊 Analytics & Charts
**Admin Dashboard:**
- Total workers, total jobs, total bookings — stat cards
- Bookings per month — bar chart
- Jobs by category — pie chart

**Worker Dashboard:**
- Total earnings this week and this month
- Jobs completed count
- Weekly earnings bar chart
- Monthly earnings line chart

### 📄 Export PDF Report
- Admin can download complete booking report as PDF
- Report includes: worker name, category, date, hours, amount, status
- Professional formatting with header and footer using jsPDF

### 🎨 UI/UX Features
- Dark Mode / Light Mode toggle — preference saved in localStorage
- Skeleton loading shimmer effect while data loads
- Empty state illustrations when no data is found
- Smooth page transition animations using Framer Motion
- Fully responsive layout for mobile, tablet, and desktop
- Toast notifications for success and error feedback
   Workers and availability

