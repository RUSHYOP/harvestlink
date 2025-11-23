# 🌾 Harvest Link - Production-Grade Agricultural Marketplace

<div align="center">

![Harvest Link](https://img.shields.io/badge/Harvest-Link-10b981?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=for-the-badge&logo=flask)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Connecting Farmers Directly with Buyers**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-documentation) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

---

## 📖 About

Harvest Link is a revolutionary **production-grade** digital platform that bridges the gap between local farmers and buyers, creating a transparent and efficient marketplace for agricultural produce. Built with modern web technologies, it ensures fair pricing, reduces post-harvest losses, and supports sustainable agriculture.

### 🎯 Mission

- **Empower Farmers** with direct market access
- **Ensure Fair Pricing** through transparency
- **Reduce Waste** by connecting supply with demand
- **Support Local Agriculture** and food security
- **Build Sustainable** supply chains

---

## ✨ Features

### For Farmers 👨‍🌾
- ✅ **Inventory Management** - Add, edit, and delete crop listings
- 📊 **Real-time Dashboard** - Track inventory and orders
- 💰 **Price Control** - Set your own prices
- 📱 **Order Notifications** - Get instant buyer information
- 🔍 **Quality Rating** - Showcase crop quality (Excellent/Average/Poor)

### For Buyers 🏪
- 🛒 **Browse Fresh Produce** - Access quality local crops
- 🔎 **Advanced Filtering** - Search by crop, location, and quality
- 📞 **Direct Contact** - Connect with farmers directly
- 📦 **Order Management** - Track all your purchases
- 💳 **Transparent Pricing** - See prices per kg upfront

### Platform Features 🚀
- 🎨 **Modern UI/UX** - Clean, responsive, and accessible design
- 🔐 **Secure Authentication** - Role-based access (Farmer/Buyer)
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- ⚡ **Fast Performance** - Optimized loading and interactions
- 🌐 **Production Ready** - Comprehensive error handling and logging
- 🎯 **Toast Notifications** - Real-time feedback system
- 📊 **Data Validation** - Client and server-side validation
- 🔄 **Real-time Updates** - Instant inventory and order sync

---

## 🖼️ Demo

### Landing Page
Beautiful landing page with glassmorphism effects and smooth animations

### Farmer Dashboard
![Farmer Dashboard](./docs/screenshots/farmer-dashboard.png)
- Manage inventory
- View active orders
- Track sales

### Buyer Dashboard
![Buyer Dashboard](./docs/screenshots/buyer-dashboard.png)
- Browse available crops
- Filter by location and quality
- View farmer profiles

---

## 🛠️ Tech Stack

### Backend
- **Flask 3.0** - Modern Python web framework
- **Flask-CORS** - Cross-Origin Resource Sharing
- **Gunicorn** - Production WSGI server
- **Python 3.11** - Latest stable Python

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Variables
- **Vanilla JavaScript** - No framework dependencies
- **Custom Components** - Toast notifications, modals, forms

### Data Storage
- **MongoDB Atlas** - Cloud-based NoSQL database (Free 512MB tier)
- **PyMongo** - MongoDB driver for Python
- **JSON Backup** - Legacy support for local development

---

## 🚀 Installation

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/RUSHYOP/harvestlink.git
cd harvestlink
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Set Up MongoDB
```bash
# Follow the detailed MongoDB setup guide
# See MONGODB_SETUP.md for complete instructions
```

**Quick MongoDB Setup:**
1. Create free MongoDB Atlas account (512MB free tier)
2. Create cluster and database user
3. Get connection string
4. Add to `.env` file

### Step 5: Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update values (NEVER commit this file!)
nano .env
```

**Important Security Notes:**
- ⚠️ **NEVER** commit your `.env` file to git
- ✅ Use `.env.example` as a template
- 🔐 Generate a strong SECRET_KEY: `python -c "import secrets; print(secrets.token_hex(32))"`
- 📝 See `SECURITY.md` for complete security guidelines

**Environment Variables:**
- `MONGODB_URI` - Your MongoDB connection string from Atlas
- `DATABASE_NAME` - Database name (default: harvestlink)
- `SECRET_KEY` - Random secret key for sessions
- `FLASK_ENV` - Set to "development" locally, "production" on Vercel

### Step 6: Migrate Existing Data (Optional)
```bash
# If you have existing JSON data, migrate it to MongoDB
python migrate_to_mongodb.py
```

### Step 7: Run the Application
```bash
# Development mode
python server.py

# Production mode with Gunicorn
gunicorn server:app --bind 0.0.0.0:3000 --workers 4
```

The application will be available at `http://localhost:3000`

---

## 📚 Usage

### Registering as a Farmer
1. Navigate to the home page
2. Click **"Register as Farmer"**
3. Fill in your details:
   - Personal information (Name, Email, Phone)
   - Location (State)
   - Years of farming experience
4. Create a secure password
5. Login with your credentials

### Registering as a Buyer
1. Navigate to the home page
2. Click **"Register as Buyer"**
3. Fill in your details:
   - Personal information
   - Business name (optional)
   - Location
4. Create a secure password
5. Login with your credentials

### Managing Inventory (Farmers)
1. Login to your farmer dashboard
2. Click **"+ Add Crop"**
3. Enter crop details:
   - Crop name (from predefined list)
   - Total quantity (kg)
   - Price per kg (₹)
   - Quality rating
4. View and manage your inventory
5. Track incoming orders

### Placing Orders (Buyers)
1. Login to your buyer dashboard
2. Browse available crops
3. Use filters to find specific items:
   - Search by crop name
   - Filter by state
   - Filter by quality
4. Click **"Buy Now"** on desired item
5. Enter quantity and confirm order
6. View farmer contact information

---

## 🔌 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Users

**Get All Users**
```http
GET /api/users
```

**Register User**
```http
POST /api/users
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "securepass123",
  "userType": "farmer",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "state": "Karnataka"
}
```

#### Inventory

**Get All Inventory**
```http
GET /api/inventory
```

**Add Inventory Item**
```http
POST /api/inventory
Content-Type: application/json

{
  "cropName": "Rice",
  "totalQuantity": 1000,
  "pricePerKg": 45.50,
  "quality": "excellent",
  "farmerId": "id_12345"
}
```

**Update Inventory**
```http
PUT /api/inventory/{item_id}
Content-Type: application/json
```

**Delete Inventory**
```http
DELETE /api/inventory/{item_id}
```

#### Orders

**Get All Orders**
```http
GET /api/orders
```

**Create Order**
```http
POST /api/orders
Content-Type: application/json

{
  "buyerId": "id_67890",
  "farmerId": "id_12345",
  "inventoryId": "id_11111",
  "cropName": "Rice",
  "quantity": 100,
  "pricePerKg": 45.50
}
```

**Update Order**
```http
PUT /api/orders/{order_id}
Content-Type: application/json
```

#### Crops

**Get Available Crops**
```http
GET /api/crops
```

### Health Check

**Check Server Status**
```http
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00",
  "version": "1.0.0"
}
```

---

## 🌐 Deployment

### Heroku Deployment

1. **Install Heroku CLI**
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create New App**
```bash
heroku create your-app-name
```

4. **Set Environment Variables**
```bash
heroku config:set SECRET_KEY=your-production-secret-key
heroku config:set FLASK_ENV=production
```

5. **Deploy**
```bash
git push heroku master
```

6. **Open Your App**
```bash
heroku open
```

### Vercel Deployment

The project includes a `vercel.json` configuration file.

1. **Run Security Check First**
```bash
python security_check.py
```

2. **Install Vercel CLI**
```bash
npm install -g vercel
```

3. **Set Environment Variables in Vercel Dashboard**
   - Go to: **Project Settings → Environment Variables**
   - Add: `MONGODB_URI`, `DATABASE_NAME`, `SECRET_KEY`, `FLASK_ENV=production`
   - **NEVER** put real credentials in code

4. **Deploy**
```bash
vercel --prod
```

5. **Verify Deployment**
```bash
curl https://your-app.vercel.app/health
```

**Security Notes:**
- ✅ `.env` is in `.gitignore` and `.vercelignore`
- ✅ Secrets are only in Vercel environment variables
- ✅ MongoDB Atlas allows Vercel IPs (0.0.0.0/0 with authentication)
- 📖 See `SECURITY.md` for complete deployment security guide

### Docker Deployment

```bash
# Build image
docker build -t harvestlink .

# Run container
docker run -p 3000:3000 harvestlink
```

---

## 🔒 Security

### 🛡️ Before Pushing to Git

**Run the security checker:**
```bash
python security_check.py
```

This will verify:
- ✅ No secrets in code
- ✅ `.env` is properly ignored
- ✅ `.gitignore` is configured correctly
- ✅ No credentials in documentation

### 🔐 Security Features

- ✅ Input validation (client & server)
- ✅ MongoDB injection prevention
- ✅ XSS protection headers
- ✅ CORS configuration
- ✅ Server-side authentication
- ✅ Error logging and monitoring
- ✅ Request size limits
- ✅ Environment variable protection

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### 📖 Complete Security Guide
See **`SECURITY.md`** for:
- Pre-deployment checklist
- Environment variable setup
- MongoDB security configuration
- What to do if secrets are exposed
- Security best practices

---

## 📊 Project Structure

```
harvestlink/
├── data/                      # JSON data storage
│   ├── users.json
│   ├── inventory.json
│   ├── orders.json
│   └── crops.json
├── static/
│   ├── css/
│   │   └── styles.css        # Modern responsive styles
│   ├── images/               # Images and assets
│   ├── js/
│   │   ├── utils.js          # Toast, validation, utilities
│   │   ├── script.js         # Core functionality
│   │   ├── farmer.js         # Farmer dashboard logic
│   │   └── buyer.js          # Buyer dashboard logic
│   └── videos/               # Background videos
├── templates/
│   ├── index.html            # Landing page
│   ├── farmer.html           # Farmer dashboard
│   └── buyer.html            # Buyer dashboard
├── server.py                  # Flask application
├── requirements.txt           # Python dependencies
├── Procfile                   # Heroku deployment
├── runtime.txt               # Python version
├── vercel.json               # Vercel configuration
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
└── README.md                 # Documentation
```

---

## 🧪 Testing

### Manual Testing Checklist

**User Registration & Authentication**
- [ ] Farmer registration with validation
- [ ] Buyer registration with validation
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] Logout functionality

**Farmer Features**
- [ ] Add crop to inventory
- [ ] Edit existing crop
- [ ] Delete crop (with/without orders)
- [ ] View active orders
- [ ] Cancel orders

**Buyer Features**
- [ ] Browse available crops
- [ ] Filter by crop name
- [ ] Filter by state
- [ ] Filter by quality
- [ ] Place an order
- [ ] View order history

**UI/UX**
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Toast notifications
- [ ] Loading indicators
- [ ] Form validation messages
- [ ] Error handling

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit Your Changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Code Style
- Follow PEP 8 for Python code
- Use meaningful variable names
- Comment complex logic
- Write descriptive commit messages

---

## 🐛 Known Issues & Future Enhancements

### Current Limitations
- JSON-based storage (limited scalability)
- No password hashing (should be added in production)
- No email verification
- No payment gateway integration

### Planned Features
- 🔄 Database migration (PostgreSQL)
- 🔐 Advanced authentication (JWT, OAuth)
- 📧 Email notifications
- 💳 Payment gateway integration
- 📊 Analytics dashboard
- 🌍 Multi-language support
- 📱 Mobile app (React Native)
- 🤖 AI-based price recommendations

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **RUSHYOP** - *Initial work* - [GitHub Profile](https://github.com/RUSHYOP)

---

## 🙏 Acknowledgments

- Inspired by the need to support local farmers
- Built with modern web development best practices
- Designed for scalability and production deployment
- Community-driven development

---

## 📞 Support

For support, email support@harvestlink.com or open an issue in this repository.

---

## 🌟 Star the Project

If you find this project helpful, please give it a ⭐️ on GitHub!

---

<div align="center">

**Made with ❤️ for Farmers and Buyers**

[⬆ Back to Top](#-harvest-link---production-grade-agricultural-marketplace)

</div>
