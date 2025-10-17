# 🚀 Taliyo Admin Panel — Launch your marketplace control tower

![Build](https://img.shields.io/badge/build-passing-22c55e?style=for-the-badge)
![Version](https://img.shields.io/badge/version-0.1.0-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-0ea5e9?style=for-the-badge)
![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Tailwind%20%7C%20Supabase-22d3ee?style=for-the-badge)

> A modern admin cockpit for Taliyo Marketplace — manage products, banners, analytics, and growth from a single sleek dashboard.

---

## 📚 Table of Contents
1. [Overview](#-overview)
2. [Screenshots & Demo](#-screenshots--demo)
3. [Tech Stack](#-tech-stack)
4. [Features](#-features)
5. [Installation](#-installation)
6. [Usage](#-usage)
7. [Folder Structure](#-folder-structure)
8. [Contributing](#-contributing)
9. [License](#-license)
10. [Contact](#-contact)

---

## ✨ Overview
Taliyo Admin Panel is the control center for the Taliyo Marketplace ecosystem. Built for operational teams, it combines real-time analytics, inventory management, marketing controls, and secure admin workflows.

**Why it stands out**
- Mission-critical admin tooling with a product-grade UX.
- Secure Supabase-powered APIs and audit trails.
- Responsive layouts with mobile-first dashboards.

---

## 🖼 Screenshots & Demo
| Dashboard | Product Management | Banner Analytics |
|-----------|-------------------|------------------|
| _Add `./docs/dashboard.png`_ | _Add `./docs/products.png`_ | _Add `./docs/banner-analytics.png`_ |

- **Live Demo:** _Add your deployment URL here_
- **Video Walkthrough:** _Add Loom/YouTube link here_

---

## ⚙️ Tech Stack
- ⚡ **Framework:** ![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
- 🎨 **UI:** ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-38bdf8?logo=tailwind-css&logoColor=white)
- 🔥 **Backend/API:** ![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=white)
- 📊 **Charts:** ![Chart.js](https://img.shields.io/badge/Chart.js-f87171?logo=chart.js&logoColor=white)
- 🔐 **Auth:** ![JSON Web Tokens](https://img.shields.io/badge/JWT-0ea5e9?logo=jsonwebtokens&logoColor=white)

---

## ✅ Features
- ✔️ **Live Inventory Control** — manage products, services, and packages in real time.
- ✔️ **Banner CMS** — upload media, schedule campaigns, and track impressions.
- ✔️ **Admin Authentication** — secure session cookies and role-guarded APIs.
- ✔️ **Analytics Hub** — bookings, click tracking, and conversion dashboards.
- ✔️ **Bulk Operations** — CSV/XLSX import, drag-and-drop reordering, and audit logs.
- ✔️ **Mobile Responsive** — optimized views for tablets and phones.

---

## 🛠 Installation
```bash
# Clone the repo
git clone https://github.com/virajverse/Final-Taliyo-Marketplace-Admin-Panel.git
cd admin-panel

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# fill in Supabase + Admin credentials

# Start development server
pnpm dev
```

---

## 🚀 Usage
### Start locally
```bash
pnpm dev
```
Open `http://localhost:3001`.

### Build & run production
```bash
pnpm build
pnpm start
```

### Lint
```bash
pnpm lint
```

---

## 📁 Folder Structure
```
admin-panel/
├── components/
│   ├── ModernLayout.js
│   ├── ModernSidebar.js
│   └── ...
├── pages/
│   ├── index.js
│   ├── banners.js
│   ├── products.js
│   └── api/
│       └── admin/
│           ├── banners/
│           ├── services/
│           └── ...
├── public/
├── styles/
│   └── globals.css
├── next.config.mjs
├── package.json
└── README.md
```

---

## 🤝 Contributing
We welcome contributions!

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-upgrade
   ```
3. Commit your changes:
   ```bash
   git commit -m "feat: add amazing upgrade"
   ```
4. Push and open a PR.

👀 Please include screenshots or Loom demos for UI changes and reference related issues.

---

## 📜 License
![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)

This project is licensed under the MIT License — see [`LICENSE`](./LICENSE) for details.

---

## 📬 Contact
| Name | GitHub | LinkedIn | Website |
|------|--------|----------|---------|
| Viraj | [@virajverse](https://github.com/virajverse) | [LinkedIn](https://www.linkedin.com/in/virajverse/) | [www.viraj.dev](https://www.viraj.dev) |

Need support? Drop an issue or ping us at `team@taliyo.com`.

---

_Built with 💙 by the Taliyo team — turning marketplace operations into a delight._
