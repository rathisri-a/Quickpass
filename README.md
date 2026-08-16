# QuickPass — Hostel Outpass Management System

<p align="center">
  <h3 align="center">A Digital Hostel Outpass Management & Student Movement Tracking System</h3>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-Framework-black?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/EJS-Template%20Engine-B4CA65?style=for-the-badge" />
  <img src="https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
</p>

<p align="center">
  <b>Paperless • QR-Based • Role-Based • Secure • Trackable</b>
</p>

---

## 📌 Overview

**QuickPass** is a web-based **Hostel Outpass Management System** designed to digitize and simplify the process of applying, approving, verifying, and tracking student outpasses.

The system connects **Students, Wardens, Security Staff, and Administrators** through a centralized platform.

It uses **QR-based verification** and student movement tracking to provide a structured and transparent hostel entry/exit management system.

---

## ✨ Key Features

### 👨‍🎓 Student

* Student registration and login
* Student profile management
* Profile photo upload
* Room number management
* Parent phone number management
* Apply for hostel outpass
* Select preferred warden
* View outpass status
* View outpass history

### 👨‍🏫 Warden

* Secure warden login
* View student outpass requests
* Approve or reject requests
* Generate QR codes for approved outpasses
* Verify student exit
* Verify student return
* Scan QR codes
* View verification information

### 🛡️ Security Staff

* Security login
* QR code scanning
* Verify student exit
* Verify student entry
* Maintain scan history
* Track student movement

### 👨‍💼 Administrator

* Admin dashboard
* Manage students
* Edit student details
* Delete student accounts
* View student outpass history
* Manage wardens
* Manage security staff
* View students currently outside the hostel
* View complete entry/exit logs
* View QR scan history

---

## 🔄 Outpass Workflow

```text
┌─────────────────────┐
│ Student Registration│
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Student Profile   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│    Apply Outpass    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Warden Approval   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   QR Code Generated │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Warden Exit Verify  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│Security Exit Verify │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Student Leaves    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│Security Entry Verify│
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Warden Return Verify│
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Return Completed  │
└─────────────────────┘
```

---

## 📊 Outpass Status Flow

```text
Pending
   ↓
Approved
   ↓
Warden Exit Verified
   ↓
Exited
   ↓
Security Entry Verified
   ↓
Return Completed
```

Each stage must be completed before the system allows the next verification stage.

---

## 🧑‍💻 User Roles

| Role          | Responsibilities                       |
| ------------- | -------------------------------------- |
| 👨‍🎓 Student | Apply and track outpasses              |
| 👨‍🏫 Warden  | Approve and verify outpasses           |
| 🛡️ Security  | Verify student exit and entry          |
| 👨‍💼 Admin   | Manage and monitor the complete system |

---

## 🛠️ Technology Stack

| Layer                 | Technology              |
| --------------------- | ----------------------- |
| Frontend              | HTML5, CSS3, JavaScript |
| Template Engine       | EJS                     |
| Backend               | Node.js, Express.js     |
| Database              | MySQL                   |
| QR Generation         | QRCode                  |
| File Upload           | Multer                  |
| Session Management    | Express Session         |
| Database Connectivity | MySQL2                  |
| Development Tool      | Visual Studio Code      |

---

## 🗄️ Database

QuickPass uses **MySQL** as its relational database.

### Main Tables

```text
students
outpass_requests
wardens
security_staff
admins
scan_history
```

### Database Responsibilities

* Student information
* Warden information
* Security staff information
* Outpass requests
* Approval status
* QR verification records
* Entry and exit logs
* Student movement history

---

## 📱 Parent Notification

QuickPass includes a parent notification mechanism to notify parents when a student:

* Exits the hostel
* Completes the return process

During development, notifications can be simulated.

For production deployment, an SMS provider such as **Twilio** can be integrated.

> **Security Note:** Never commit API keys, authentication tokens, passwords, or other credentials to GitHub.

---

## 🔐 Security & Verification

QuickPass uses QR codes to verify authorized student movement.

The QR code contains the required outpass identification information and is scanned during the verification process.

The system validates the current outpass status before allowing the next stage.

This prevents invalid status transitions such as:

```text
Pending → Exit
```

without completing the required approval and verification stages.

---

## 📁 Project Structure

```text
QuickPass/
│
├── app.js
├── package.json
├── package-lock.json
│
├── config/
│   └── db.js
│
├── public/
│   ├── css/
│   │   └── style.css
│   │
│   └── uploads/
│
├── qrcodes/
│
└── views/
    ├── login.ejs
    ├── register.ejs
    ├── dashboard.ejs
    ├── profile.ejs
    ├── outpass.ejs
    ├── status.ejs
    │
    ├── warden-dashboard.ejs
    ├── warden-requests.ejs
    ├── warden-scan.ejs
    │
    ├── security-dashboard.ejs
    ├── security-scan.ejs
    │
    ├── admin-dashboard.ejs
    ├── admin-students.ejs
    ├── admin-student-history.ejs
    ├── admin-wardens.ejs
    ├── admin-security.ejs
    ├── admin-outside.ejs
    └── admin-scan-history.ejs
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/quickpass.git
cd quickpass
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure MySQL

Create a MySQL database for the project.

Then configure the database connection in:

```text
config/db.js
```

Create the required tables:

```text
students
outpass_requests
wardens
security_staff
admins
scan_history
```

### 4. Configure Environment Variables

Create a `.env` file if your project uses environment variables:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

Do **not** commit `.env` to GitHub.

Add it to `.gitignore`:

```gitignore
.env
node_modules/
```

### 5. Start the Application

```bash
node app.js
```

The application should be available at:

```text
http://localhost:3000
```

---

## 🚀 How It Works

### Student

```text
Register
   ↓
Complete Profile
   ↓
Apply for Outpass
   ↓
Select Warden
   ↓
Wait for Approval
   ↓
Receive QR Code
```

### Warden

```text
Login
   ↓
View Requests
   ↓
Approve / Reject
   ↓
Generate QR Code
   ↓
Verify Exit
   ↓
Verify Return
```

### Security

```text
Login
   ↓
Scan QR Code
   ↓
Verify Exit
   ↓
Record Student Exit
   ↓
Scan QR on Return
   ↓
Verify Entry
```

### Admin

```text
Login
   ↓
Dashboard
   ↓
Manage Students
Manage Wardens
Manage Security
View Outpass History
View Entry/Exit Logs
View Students Outside
```

---

## 📸 Screenshots

Add screenshots of the major pages here:

```text
docs/
├── login.png
├── student-dashboard.png
├── outpass-application.png
├── warden-dashboard.png
├── qr-verification.png
├── security-dashboard.png
└── admin-dashboard.png
```

Example:

```markdown
![Student Dashboard](docs/student-dashboard.png)
```

Screenshots make the project easier to understand and significantly improve the repository presentation.

---

## 🌟 Advantages

* Paperless outpass management
* Faster approval process
* QR-based verification
* Centralized student records
* Parent notification support
* Complete entry and exit tracking
* Role-based access control
* Student outpass history
* Administrative monitoring
* Structured verification workflow

---

## 🔮 Future Enhancements

* [ ] Mobile application
* [ ] Cloud deployment
* [ ] Real-time SMS integration
* [ ] Email notifications
* [ ] Face recognition
* [ ] Advanced analytics and reports
* [ ] Push notifications
* [ ] Digital ID integration
* [ ] Real-time dashboard updates
* [ ] Automated parent notifications
* [ ] Deployment with HTTPS
* [ ] Automated database backups

---

## 🎯 Project Objective

The main objective of **QuickPass** is to provide a **secure, centralized, and efficient digital solution for hostel outpass management**.

The system reduces manual paperwork, simplifies the approval process, enables QR-based verification, and improves visibility of student entry and exit activities.

---

## 👥 System Architecture

```text
                    ┌──────────────────┐
                    │      Student     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   QuickPass Web  │
                    │    Application   │
                    └────────┬─────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
        ┌─────────┐    ┌──────────┐    ┌──────────┐
        │ Warden  │    │ Security │    │  Admin   │
        └────┬────┘    └─────┬────┘    └────┬─────┘
             │               │              │
             └───────────────┼──────────────┘
                             ▼
                    ┌──────────────────┐
                    │      MySQL       │
                    │     Database     │
                    └──────────────────┘
```

---

## 📚 Academic Project

This project is developed for **academic and educational purposes** to demonstrate:

* Full-stack web development
* Role-based authentication
* CRUD operations
* Database management
* QR code generation and verification
* Session management
* File uploads
* Student movement tracking
* Multi-role application architecture

---

<p align="center">
  <b>QuickPass — Making Hostel Outpass Management Smarter, Faster & Safer.</b>
</p>
