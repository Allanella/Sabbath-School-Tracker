# 🕊️ Sabbath School Tracker

<div align="center">

![Sabbath School Tracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)

**A modern Progressive Web App for tracking Sabbath School attendance, activities, and financial contributions for Seventh-day Adventist churches.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📖 About

The Sabbath School Tracker is designed specifically for Seventh-day Adventist churches to digitize and streamline the management of Sabbath School data. Each class can maintain digital records of attendance, participation, and offerings across a 13-week quarter, with automated report generation and comprehensive analytics.

### 🎯 Built For

- **Kanyanya Seventh-day Adventist Church**, Uganda
- Adaptable for any SDA church worldwide

---

## ✨ Features

### 👥 User Management

- **Role-based access control** (Admin, Secretary, Viewer)
- Secure authentication with JWT
- User activation/deactivation
- Password management

### 📅 Quarter & Class Management

- Create and manage quarterly periods (Q1-Q4)
- Set active quarters
- Manage multiple Sabbath School classes
- Assign teachers and secretaries to classes

### 📊 Weekly Data Entry

- Track weekly attendance (13 weeks per quarter)
- Record member visits and Bible studies
- Monitor participation in lesson study
- Track visitor counts
- Record financial contributions:
  - Global Mission offerings
  - Lesson payments (English/Luganda)
  - Morning Watch payments

### 📈 Comprehensive Reports

- **Weekly Reports**: Class-by-class breakdown for each Sabbath
- **Quarterly Reports**: Complete 13-week summaries with charts
- **Financial Reports**: Offering tracking and analysis
- Secretary notes and observations
- Printable PDF exports

### 🎨 Modern UI/UX

- Beautiful, responsive design with Tailwind CSS
- Mobile-first approach
- Progressive Web App (PWA) - installable on any device
- Offline capability
- Dark mode support

---

## 🖼️ Screenshots

<div align="center">

### Login Page

![Login](screenshots/login.png)

### Admin Dashboard

![Dashboard](screenshots/dashboard.png)

### Weekly Data Entry

![Data Entry](screenshots/data-entry.png)

### Reports

![Reports](screenshots/reports.png)

</div>

---

## 🚀 Tech Stack

### Frontend

- **React 18** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Vite** - Build tool
- **PWA** - Progressive Web App capabilities

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - PostgreSQL database & authentication
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing

### DevOps

- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Supabase** - Database hosting
- **Git** - Version control

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **Supabase account** (free) - [Sign up](https://supabase.com/)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/sabbath-school-tracker.git
cd sabbath-school-tracker
npm run setup
```

### 2️⃣ Setup Database (Supabase)

1. Create a new project on [Supabase](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `database/schema.sql`
3. Copy your project credentials from **Settings → API**:
   - Project URL
   - anon key
   - service_role key

### 3️⃣ Setup Backend

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

JWT_SECRET=your_random_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

CHURCH_NAME=Your Church Name
FRONTEND_URL=http://localhost:5173
```

### 4️⃣ Setup Frontend

```bash
cd ../frontend
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Sabbath School Tracker
VITE_CHURCH_NAME=Your Church Name
```

### 5️⃣ Create Admin User

Generate password hash at [bcrypt-generator.com](https://bcrypt-generator.com/) (rounds: 10)

Then run in Supabase SQL Editor:

```sql
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
    'admin@yourchurch.org',
    'your_bcrypt_hash_here',
    'System Administrator',
    'admin',
    true
);
```

### 6️⃣ Run the Application

**Option 1 - Using root scripts (Recommended):**

```bash
# Run both frontend and backend
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

**Option 2 - Manual:**
**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Default Login:**

- Email: `admin@yourchurch.org`
- Password: The password you used for hashing

### 7️⃣ Testing

**Frontend Tests:**

```bash
cd frontend
npm run test              # Run unit tests
npm run test:coverage     # Run with coverage
npm run test:e2e          # Run E2E tests with Cypress
```

**Backend Tests:**

```bash
cd backend
npm run test              # Run unit tests
npm run test:coverage     # Run with coverage
npm run test:watch        # Run in watch mode
```

---

## 🎮 Usage

### For Admins

1. **Setup Quarters**
   - Navigate to **Admin → Quarters**
   - Create quarters for the year (Q1, Q2, Q3, Q4)
   - Set the active quarter

2. **Create Classes**
   - Go to **Admin → Classes**
   - Add Sabbath School classes
   - Assign teachers and secretaries

3. **Manage Users**
   - Create secretary accounts
   - Assign roles and permissions

### For Secretaries

1. **Enter Weekly Data**
   - Navigate to **Secretary → Enter Data**
   - Select your class and week number
   - Fill in attendance and activities
   - Add secretary notes
   - Submit

2. **View Reports**
   - Access weekly and quarterly reports
   - Monitor class progress

### For Viewers

- View all reports
- No data entry permissions

---

## 📊 Database Schema

```
users
├── id (UUID)
├── email
├── password_hash
├── full_name
├── role (admin/secretary/viewer)
└── is_active

quarters
├── id (UUID)
├── name (Q1/Q2/Q3/Q4)
├── year
├── start_date
├── end_date
└── is_active

classes
├── id (UUID)
├── quarter_id (FK)
├── class_name
├── teacher_name
├── secretary_id (FK)
├── secretary_name
└── church_name

weekly_data
├── id (UUID)
├── class_id (FK)
├── week_number (1-13)
├── sabbath_date
├── total_attendance
├── member_visits
├── members_conducted_bible_studies
├── offering_global_mission
├── members_summary
└── ... (other fields)
```

---

## 🚀 Deployment

### Deploy to Production

1. **Frontend (Vercel)**

```bash
   cd frontend
   vercel --prod
```

2. **Backend (Render)**
   - Connect your GitHub repository
   - Add environment variables
   - Deploy

3. **Database (Supabase)**
   - Already hosted
   - Free tier: 500MB database

See [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Update documentation for new features
- Test thoroughly before submitting PR

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:

- Description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👏 Acknowledgments

- **Seventh-day Adventist Church** - For the inspiration and requirements
- **Kanyanya SDA Church** - First deployment and feedback
- **Open Source Community** - For the amazing tools and libraries

---

## 📞 Contact

**Project Maintainer:** Baliddawa Allan

- Email: your.email@example.com
- GitHub: [Allanella](https://github.com/Allanella)
- Church: Kanyanya Seventh-day Adventist Church

---

## 🗺️ Roadmap

- [ ] Multi-language support (English, Luganda, French, Spanish)
- [ ] Mobile app (React Native)
- [ ] SMS notifications for secretaries
- [ ] Integration with Adventist Church Management System (ACMS)
- [ ] Advanced analytics and insights
- [ ] Export to Conference report format
- [ ] Automated backup system
- [ ] Member directory integration

---

## ⭐ Show Your Support

If this project helped your church, please give it a ⭐ on GitHub!

---

<div align="center">

**Made with ❤️ for Seventh-day Adventist Churches Worldwide**

[Report Bug](https://github.com/Allanella/sabbath-school-tracker/issues) • [Request Feature](https://github.com/Allanella/sabbath-school-tracker/issues)

</div>
