import {
  mobile,
  backend,
  creator,
  web,
  javascript,
  html,
  css,
  reactjs,
  tailwind,
  nodejs,
  git,
  docker,
  python,
  java,
  fastapi,
  postgresql,
} from "../assets";

// Personal details used across the site (navbar, hero, contact form).
export const profile = {
  name: "Abhilash",
  fullName: "Abhilash Kannan",
  // Optional tagline shown after the name in the navbar, e.g. "Web Developer".
  brand: "Full Stack & AI Developer",
  headline: "I build full-stack web apps, internal tools and AI-powered solutions",
  // Rotating titles in the hero ("A ___ Developer") and preloader marquee.
  roles: ["Full Stack", "Agentic AI", "Generative AI", "AI & RAG", "Backend"],
  email: "abhikannan0407@gmail.com",
  linkedin: "https://www.linkedin.com/in/abhilashkannan04",
  github: "https://github.com/abhikannan04",
  // Resume link. Set VITE_RESUME_URL to a Google Drive (or any) link so the
  // resume can be updated without redeploying; otherwise public/resume.pdf.
  resume: import.meta.env.VITE_RESUME_URL || "/resume.pdf",
  about:
    "I'm an IT Executive at Banas Dairy (Amul Group) and a B.Tech graduate in Electronics and Communication Engineering from SVNIT Surat. I drive digital transformation by designing, building and optimizing internal tools that streamline operations and automate workflows, from the official Banas Dairy website and a KPI platform spanning 90 plants to SAP RFC data pipelines powering an AI chatbot and demand forecasting. My core stack spans Java, Python, React.js, Node.js, FastAPI and PostgreSQL, with a keen interest in Agentic AI, Generative AI, Machine Learning, Deep Learning and RAG.",
};

// Awards and achievements shown as chips under the About text.
export const highlights = [
  "CII National AI Award 2026",
  "GATE Qualified 2025",
  "NTSE Qualified",
];

export const navLinks = [
  {
    id: "about",
    title: "About",
  },
  {
    id: "work",
    title: "Work",
  },
  {
    id: "contact",
    title: "Contact",
  },
];

// Cards under the Overview. `accent` colours the card's glow and border.
const services = [
  {
    title: "Full Stack Developer",
    icon: web,
    accent: "#00cea8",
    description:
      "Building complete web applications, from responsive interfaces to secure APIs and well-designed databases, with clean, scalable code.",
  },
  {
    title: "AI Solutions Engineer",
    icon: creator,
    accent: "#bf61ff",
    description:
      "Designing AI features that solve real problems, from LLM-powered chatbots and RAG search to autonomous agents and automation.",
  },
  {
    title: "SAP Integration & Automation",
    icon: backend,
    accent: "#2f80ed",
    description:
      "Connecting enterprise systems like SAP to modern applications and automating manual workflows, so data stays accurate and in sync without the busywork.",
  },
  {
    title: "Project Management",
    icon: mobile,
    accent: "#ec4899",
    description:
      "Planning and delivering projects end to end: gathering requirements, setting priorities, coordinating teams and shipping on schedule.",
  },
];

const technologies = [
  { name: "Python", icon: python },
  { name: "Java", icon: java },
  { name: "JavaScript", icon: javascript },
  { name: "React JS", icon: reactjs },
  { name: "Node JS", icon: nodejs },
  { name: "FastAPI", icon: fastapi },
  { name: "PostgreSQL", icon: postgresql },
  { name: "Tailwind CSS", icon: tailwind },
  { name: "HTML 5", icon: html },
  { name: "CSS 3", icon: css },
  { name: "Docker", icon: docker },
  { name: "Git", icon: git },
];

// Entries without an `icon` show `initials` in the timeline badge instead.
const experiences = [
  {
    title: "B.Tech, Electronics & Communication Engineering",
    company_name: "SVNIT Surat · CGPA 8.34",
    initials: "SV",
    iconBg: "#383E56",
    date: "Dec 2021 - Jun 2025",
    points: [
      "Coursework and projects in Machine Learning, Deep Learning, Data Structures & Algorithms and Control Systems Design.",
      "Qualified GATE ECE 2025.",
    ],
  },
  {
    title: "Internship Trainee",
    company_name: "KRIBHCO · Surat, Gujarat",
    initials: "KR",
    iconBg: "#1d1836",
    date: "Jun 2023 - Jul 2023",
    points: [
      "Designed and implemented optimized control logic for solenoid valve operations in the Yokogawa CENTUM VP interface for the Urea Tank system, reducing response time by 20%.",
    ],
  },
  {
    title: "IT Executive",
    company_name: "Banas Dairy (Amul Group) · Palanpur, Gujarat",
    initials: "BD",
    iconBg: "#383E56",
    date: "Jul 2025 - Present",
    points: [
      "Driving digital transformation by designing, developing and optimizing internal tools that streamline operations and automate workflows.",
    ],
  },
];

// Add real recommendations here to show the Testimonials section.
const testimonials = [];

// Add `image` (an imported screenshot) to a project to replace its gradient
// cover. `links` (live sites, app store, source code) is optional.
const projects = [
  {
    name: "Banas Dairy Website",
    description:
      "Official website of Banas Dairy, Asia's largest dairy cooperative, with a custom CMS admin panel that lets non-technical staff manage sliders, tenders, products and more. Optimized asset delivery and caching cut page load latency by 80%, with 99.6% uptime and 20,000+ visitors in the first two weeks.",
    links: [{ label: "Live site", href: "https://banasdairy.coop" }],
  },
  {
    name: "Banas Bhoomi Amrut",
    description:
      "Scalable web platform initiated by Banas Dairy as a resource hub for fertilizer products, with detailed specifications and usage guidelines. Drove a ~35% increase in monthly active farmer visits and cut query resolution time by ~30%.",
    links: [{ label: "Live site", href: "https://banasbhoomiamrut.com/" }],
  },
  {
    name: "Banas AI Intelligence Platform",
    description:
      "Multilingual voice chatbot (BanasGPT, with Gujarati support) and a multi-level demand and procurement forecasting tool, built on SAP RFC to PostgreSQL data pipelines and LightGBM. 92% forecast accuracy and 6% MAPE across 7 plants, secured with MFA and RBAC on in-house servers. Winner of the CII National AI Award.",
    links: [
      { label: "Prediction Tool", href: "https://predictiontool.banasdairy.coop/app/milk/overview" },
      { label: "Analytical Tool", href: "https://banasai.banasdairy.coop/" },
    ],
  },
  {
    name: "Banas Live Dashboard",
    description:
      "Real-time monitoring dashboard on SAP RFC data covering milk collection, production and sales, with built-in analysis that helps management take informed decisions. Replaced manual reporting and cut decision turnaround by 45%.",
    links: [{ label: "Live site", href: "https://dashboard.banasdairy.coop/" }],
  },
  {
    name: "KPI Management System",
    description:
      "Full-stack platform bringing 1,296 KPIs from 90 plants across 8 locations into one place, with role-based leadership dashboards, color-coded target tracking, trend and Pareto charts, and an abnormality tracker with 8,500+ issues logged and 94% closed.",
  },
  {
    name: "Banas BMC Service App",
    description:
      "Field-technician app with a web admin panel for complaint ticketing, equipment tracking, preventive maintenance and photo and OTP verification, consolidating 1,500 complaints into one platform. 60% faster technician response and 1K+ downloads.",
    links: [{ label: "Play Store", href: "https://play.google.com/store/search?q=Banas%20BMC&c=apps&hl=en" }],
  },
];

export { services, technologies, experiences, testimonials, projects };
