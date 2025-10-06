# VistaVerse Explore - ISFO Student Management System

A comprehensive student management and attestation system for the Institut Spécialisé de Formation de l'Offshoring (ISFO) Casablanca, built with modern web technologies.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Development](#development)
- [Deployment](#deployment)
- [Database Schema](#database-schema)
- [Components](#components)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

VistaVerse Explore is a full-stack web application designed to streamline student management and attestation processes at ISFO Casablanca. The system provides separate interfaces for students and administrators with robust features for managing student data, generating attestations, and tracking requests.

## ✨ Features

### Student Portal
- Request attestations with automated form filling
- Track request status in real-time
- Secure authentication system

### Admin Dashboard
- **Student Management**
  - CRUD operations for student records
  - Bulk import/export (CSV, Excel, JSON, PDF)
  - Group-based filtering and pagination
  - Student data editing with password management
- **Attestation Requests**
  - View and process student requests
  - Generate official attestations with counters
  - Status tracking and management
- **Security Dashboard**
  - System monitoring and security controls
  - Activity logs and audit trails
- **Reporting**
  - Export data in multiple formats
  - Statistics and analytics dashboard

## 🛠 Technology Stack

### Frontend
- **React 18** - Component-based UI library
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Reusable component library
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Vite** - Fast build tool and development server

### Backend & Services
- **Supabase** - Backend-as-a-Service (Database, Authentication, Storage)
- **Supabase Realtime** - Live data updates
- **RESTful API** - Data communication

### Data Management
- **jsPDF** - PDF generation
- **XLSX** - Excel file handling
- **jspdf-autotable** - PDF table generation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript ESLint** - TypeScript linting

## 📁 Project Structure

```
vista-verse-explore/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images and static files
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Third-party service integrations
│   ├── lib/               # Utility functions and libraries
│   ├── pages/             # Page components
│   ├── utils/             # Helper functions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── supabase/              # Supabase configuration
├── .env                   # Environment variables
├── package.json           # Project dependencies
└── vite.config.ts         # Vite configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Git (for version control)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd isfo-pro
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 💻 Development

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:8080`.

### Building for Production

```bash
npm run build
# or
yarn build
```

### Linting

```bash
npm run lint
# or
yarn lint
```

## ☁️ Deployment

The application is configured for deployment on Vercel with the following settings:

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## 🗄 Database Schema

The system uses Supabase with the following key tables:

### Students Table
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  cin TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  formation_level TEXT NOT NULL,
  speciality TEXT NOT NULL,
  student_group TEXT NOT NULL,
  inscription_number TEXT NOT NULL,
  formation_type TEXT NOT NULL,
  formation_mode TEXT NOT NULL,
  formation_year TEXT NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Attestation Requests Table
```sql
CREATE TABLE attestation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  cin TEXT NOT NULL,
  phone TEXT NOT NULL,
  student_group TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  student_id UUID REFERENCES students(id),
  attestation_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧩 Components

### Main Components

1. **AdminDashboard.tsx** - Central admin interface with multiple views
2. **StudentManagement.tsx** - Comprehensive student data management
3. **AttestationGenerator.tsx** - Official document generation system
4. **RequestForm.tsx** - Student request submission form
5. **SecurityDashboard.tsx** - System monitoring and security controls

### UI Components
All UI components are built using shadcn/ui library:
- Cards, Buttons, Dialogs
- Tables, Forms, Inputs
- Selects, Badges, Toasts
- Navigation menus and layouts

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for ISFO Casablanca. All rights reserved.

---

## 📞 Support

For support, contact the development team or system administrator.

**Developed with ❤️ for ISFO Casablanca**