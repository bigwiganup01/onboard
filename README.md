---

# 🚀 Onboarding & KYC Management System

A professional, tech-forward onboarding portal designed for **UNQ Spaces**. This system handles user registration, automated KYC data collection (Aadhaar/PAN), payment verification with receipt uploads, and real-time validation against an SQLite database.

## 🛠 Tech Stack

* **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript (ES6+).
* **Backend:** Node.js, Express.js.
* **Database:** SQLite3 (Self-contained, zero-config).
* **File Handling:** Multer (for Payment Screenshots).
* **Security:** Helmet.js, Express Rate Limit, Basic Auth (for Admin).
* **Communication:** Nodemailer (SMTP Integration).

---

## 📁 Project Structure

```text
onboard/
├── public/                 # Frontend Assets
│   ├── index.html          # Main Entry Point
│   ├── style.css           # Custom CSS with Variables
│   └── script.js           # Frontend Logic & Fetch Calls
├── uploads/                # Directory for Payment Screenshots
├── .env                    # Environment Variables (DO NOT COMMIT)
├── brandconfig.json        # Dynamic Branding & Theme Config
├── database.sqlite         # SQLite Database File
├── host.sh                 # One-Click Deployment Script
├── package.json            # Dependencies & Scripts
└── server.js               # Express API & Server Logic
```

---

## ⚙️ Configuration

### 1. Dynamic Branding (`brandconfig.json`)
You can update the look and feel of the site without touching the code:
```json
{
  "BrandName": "UNQ Spaces",
  "Currency": "INR",
  "FontFamily": "'Plus Jakarta Sans', sans-serif",
  "ColorTheme": {
    "primary": "#4F46E5",
    "secondary": "#7C3AED",
    "background": "#F8FAFC",
    "formBG": "rgba(255, 255, 255, 0.9)"
  }
}
```

### 2. Environment Variables (`.env`)
Create a `.env` file in the root folder to handle sensitive data:
```env
PORT=3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_USER=admin
ADMIN_PASS=securepassword
```

---

## 🚀 Deployment (Ubuntu VPS)

This project includes a `host.sh` script that automates the installation of Node.js, Nginx, PM2, and SSL certificates.

### Prerequisites
* An Ubuntu-based VPS.
* A Domain/Subdomain (e.g., `onboard.unqspaces.com`) pointing to your VPS IP.

### Steps to Host
1.  **Clone the Repository:**
    ```bash
    cd /var/www
    git clone https://github.com/your-username/onboard.git
    cd onboard
    ```

2.  **Create your `.env` file:**
    ```bash
    nano .env
    # Paste your configuration and save (Ctrl+O, Enter, Ctrl+X)
    ```

3.  **Run the Deployment Script:**
    ```bash
    chmod +x host.sh
    sudo ./host.sh
    ```

The script will automatically configure **Nginx** as a reverse proxy and secure your site with **HTTPS (Let's Encrypt)**.

---

## 🛡 Security & Maintenance

* **Database Backups:** Since SQLite is a file-based DB, you can back up your data simply by copying `database.sqlite`.
* **Process Management:** Use PM2 to monitor the server status:
    * `pm2 status` - View running processes.
    * `pm2 logs` - View real-time error logs.
    * `pm2 restart onboard-api` - Apply changes after editing `brandconfig.json`.
* **Permissions:** The `host.sh` script automatically sets `chmod 755` for the directory and `666` for the `.sqlite` file to ensure the Node.js process can write data.

---

## 🤝 Contribution
For changes to the branding or theme, refer to `brandconfig.json`. For logic changes, update `server.js` and restart the PM2 process.
