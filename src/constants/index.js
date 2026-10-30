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
    "I'm an IT Executive at Banas Cooperative (Amul Group) and a B.Tech graduate in Electronics and Communication Engineering from SVNIT Surat. I design and deliver production-grade web platforms, real-time operational dashboards and AI solutions that support decision-making across multiple dairy plants, from the official Banas Dairy website to the SAP RFC to PostgreSQL data pipelines powering an analytics chatbot and demand forecasting. My core stack spans React.js, Node.js, Express.js, FastAPI, PostgreSQL and Python, with a keen interest in Agentic AI, Generative AI, Machine Learning, Deep Learning and RAG.",
};

// Awards and achievements shown as chips under the About text.
export const highlights = [
  "CII National AI Award 2025",
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
    title: "Executive",
    company_name: "Banas Dairy (AMUL) · Palanpur, Gujarat",
    initials: "BD",
    iconBg: "#383E56",
    date: "Jul 2025 - Present",
    points: [
      "Driving digital transformation by designing, developing and optimizing internal tools and systems.",
      "Streamlining operations and automating workflows to improve organizational efficiency.",
      "Working across web development and SAP ERP to support large-scale dairy operations.",
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
      "Official Banas Dairy website with a custom CMS admin panel that lets non-technical staff manage content. Optimized asset delivery and caching cut page load latency by ~80%, with ~99.6% uptime and 20,000+ visitors in the first 2 weeks.",
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
      "Voice-integrated analytics chatbot (Caddie) and multi-level demand and procurement prediction tool, co-developed with a vendor team. Engineered the SAP RFC to PostgreSQL pipelines behind both: under 2 s responses, ~92% forecast accuracy and ~6% MAPE across 88 districts and 5 plants.",
    links: [
      { label: "Prediction Tool", href: "https://predictiontool.banasdairy.coop/app/milk/overview" },
      { label: "Analytical Tool", href: "https://stgcaddie.banasdairy.coop:4436/" },
    ],
  },
  {
    name: "Banas Live Dashboard",
    description:
      "Centralized real-time monitoring platform aggregating live milk collection, production and sales data from SAP RFCs for management. Continuously refreshed cross-plant metrics replaced delayed manual reporting and cut decision turnaround by ~45%.",
    links: [{ label: "Live site", href: "https://dashboard.banasdairy.coop/" }],
  },
  {
    name: "KPI Management System",
    description:
      "Web-based KPI platform tracking 15+ production parameters across plants in real time, with CSV uploads, daily entries, root-cause analysis, action plans, target revisions and interactive charts. Cut daily reporting from 1-2 hours to under 5 minutes.",
  },
  {
    name: "Banas BMC Service App",
    description:
      "Play Store app for field technicians with a web admin panel, digitizing BMCU service records across dairy societies: equipment tracking, ticketing, preventive maintenance, photo and OTP verification and audit-ready invoicing. Cut response time by ~60%, with 100+ downloads in week one.",
    links: [{ label: "Play Store", href: "https://play.google.com/store/search?q=Banas%20BMC&c=apps&hl=en" }],
  },
];

export { services, technologies, experiences, testimonials, projects };
