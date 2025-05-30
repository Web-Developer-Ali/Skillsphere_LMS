# 🎓 SkillSphere LMS

SkillSphere is a modern Learning Management System (LMS) built with the MERN stack and cloud integration. It enables educators and organizations to create, manage, and deliver high-quality online courses with ease. The platform is designed for scalability, performance, and a smooth user experience.

---

## 🚀 Features

- 🧑‍🏫 Instructor and student dashboards
- 📚 Course creation and enrollment
- 🎥 Secure video streaming (.m3u8 with Azure SAS tokens)
- 📝 PDF and document storage
- 🔎 Advanced course browsing and search
- 🌐 SEO-optimized course pages
- 🛡️ Authentication and role-based access control
- 📈 Admin analytics and course insights
- ☁️ Azure Blob Storage integration
- 💬 Ratings and reviews (optional)
- 🔔 Notifications system (optional)

---

## 🧰 Tech Stack

| Category      | Technology                        |
|---------------|------------------------------------|
| Frontend      | Next.js, Tailwind CSS              |
| Backend       | Node.js, Express.js                |
| Database      | PostgreSQL                         |
| Storage       | Azure Blob Storage (SAS tokens)    |
| Authentication| NextAuth.js                        |
| Video Streaming| Video.js, HLS.js (.m3u8 format)   |
| Styling       | Tailwind CSS                       |
| DevOps (Planned)| Docker, Azure                    |

---

## 📁 Project Structure (Next.js App Directory)

/app
/(pages)/student -> Student pages
/(pages)/instructor -> Instructor pages
/api/student -> Backend API routes for student
/api/instructor -> Backend API routes for instructors
/components -> Reusable UI components
/lib -> Helper functions (e.g., SAS generation)
/models -> Mongoose models (User, Course, etc.)
/public -> Static assets
/styles -> Tailwind & global styles
/utils -> Utility functions
.env.local -> Environment variables
---

## 🧑‍💻 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Web-Developer-Ali/Skillsphere_LMS
cd skillsphere-lms
2. Install dependencies

npm install
3. Setup environment variables
Create a .env.local file and add:

npm run dev
App runs locally at: http://localhost:3000

🛡️ Security
All video files are secured using Azure SAS tokens

API routes are protected using NextAuth role-based access

Input validation and sanitization applied across forms

📦 Deployment
Recommended:
Frontend: Vercel or Azure Static Web Apps

Backend: Azure App Service or Dockerized on Azure VM

Database: PostgreSQL

Storage: Azure Blob Storage

🧪 Testing
Manual testing done for all major flows

E2E and unit tests planned with Jest and Playwright

🤝 Contributing
Fork the project

Create your feature branch: git checkout -b feature/my-feature

Commit your changes: git commit -m "feat: added new feature"

Push to the branch: git push origin feature/my-feature

Open a pull request

📬 Contact
For feedback or collaboration, reach out to:

Ali Hamza
📧 alihamzashoaibahmed@gmail.com
