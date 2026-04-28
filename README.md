<h1 align="center">💻 Nexus CRM - Frontend Web App</h1>

<p align="center">
  <i>The interactive, responsive client-side interface for the Nexus CRM system. Built to securely consume REST APIs and optimized for seamless Vercel deployment.</i>
</p>

---

## 🎨 Tech Stack

* **Core Web Technologies:** HTML5, CSS3, JavaScript (ES6+)
* **Library/Framework:** React.js
* **Routing:** React Router DOM
* **API Integration:** Axios / Fetch API (RESTful API consumption)
* **Authentication Handling:** JWT (JSON Web Tokens) Client-Side Management
* **Deployment:** Vercel

## ✨ Key Features

* **Secure Authentication Flow:** Dynamically handles JWT tokens, manages user sessions, and protects private routes.
* **Cross-Origin Ready (CORS):** Architected to perfectly communicate with the Render-deployed Spring Boot backend, smoothly handling Vercel's dynamic preview URLs.
* **Role-Based UI:** Adapts the user interface and accessible routes based on the logged-in user's role.
* **Responsive Design:** A clean, optimized user experience across both desktop and mobile screens.

## ⚙️ Local Setup Instructions

**1. Clone the repository:**
```bash
git clone [https://github.com/harshu06969o/nexus-crm-frontend.git](https://github.com/harshu06969o/nexus-crm-frontend.git)
cd nexus-crm-frontend
```

**2. Environment Setup:**
Create a `.env` file in the root directory. You can point this to your live Render backend or your local backend server:

To connect to the **Live Cloud Backend**:
```env
REACT_APP_API_URL=[https://nexus-crm-backend.onrender.com](https://nexus-crm-backend.onrender.com)
```
*(Replace the URL with your actual Render backend URL if it's different).*

To connect to the **Local Backend**:
```env
REACT_APP_API_URL=http://localhost:8080
```

**3. Install Dependencies:**
```bash
npm install
```

**4. Start the Development Server:**
```bash
npm start
```
> The application will start running at `http://localhost:3000`
