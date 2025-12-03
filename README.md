# Front Office Management System

एक पूर्ण Front Office Management System जो MERN stack और Supabase का उपयोग करता है।

## 🚀 Features

- **Dashboard**: KPIs, charts, और quick navigation
- **Room Management**: Room details, QR codes, status tracking
- **Booking Management**: Guest bookings, invoices, calendar view
- **Housekeeping**: Staff assignment, cleaning reports
- **Inventory**: Stock management, purchase tracking
- **Food Court**: Menu management, POS system
- **Accounts**: Financial transactions, reports
- **Reports**: Analytics, PDF/Excel export
- **Settings**: Password change, hotel info

## 🛠️ Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS + ShadCN UI
- Zustand (state management)
- Axios (API calls)
- Recharts (analytics)
- React Router DOM
- React Hook Form + Zod
- jsPDF / react-to-print
- react-qr-code
- Lucide Icons

### Backend
- Node.js + Express.js
- Supabase client
- bcryptjs (password encryption)
- cors + express-validator
- nodemon

### Database
- Supabase (PostgreSQL)

## 🔐 Authentication

**Default Login:**
- Username: `admin`
- Password: `admin123`

Password को localStorage में store किया जाता है, database में नहीं।

## 📦 Installation

1. **Clone repository:**
```bash
git clone <repository-url>
cd hotel-management-system
```

2. **Install dependencies:**
```bash
npm run install-all
```

3. **Setup environment variables:**
```bash
# Backend .env file में Supabase credentials add करें
cd backend
cp .env.example .env
# .env file edit करें
```

4. **Run development server:**
```bash
npm run dev
```

## 🗄️ Database Setup

1. **Supabase Project बनाएं:**
   - [Supabase](https://supabase.com) पर जाकर नया project create करें
   - Project URL और API key copy करें

2. **Environment Variables Setup:**
   ```bash
   cd backend
   cp env.example .env
   ```
   
   `.env` file में अपने Supabase credentials add करें:
   ```
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   PORT=5000
   NODE_ENV=development
   ```

3. **Database Schema:**
   Supabase SQL Editor में `supabase/schema.sql` file का content run करें।

4. **Sample Data:**
   Schema में sample data भी included है जो automatically insert हो जाएगा।

## 🎯 Usage

1. Browser में `http://localhost:3000` पर जाएं
2. Admin credentials से login करें
3. Dashboard से सभी modules access करें

## 📁 Project Structure

```
hotel-management/
├── backend/          # Express.js server
├── frontend/         # React.js application
├── supabase/         # Database schema
└── package.json      # Root package.json
```

## 🎨 UI Features

- Professional और responsive design
- Dark/Light theme toggle
- Toast notifications
- Data tables with pagination
- Charts और analytics
- PDF/Excel export functionality

## 📝 Notes

- यह एक college project है
- Internal hotel staff के लिए designed
- RLS disabled (internal use के लिए)
- Password management locally handled.
