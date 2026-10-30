# Abhilash Kannan — Portfolio

Personal portfolio of **Abhilash Kannan**, IT Executive at Banas Cooperative (Amul Group) and Full Stack & AI Developer.

**Live:** [abhilashkannan.vercel.app](https://abhilashkannan.vercel.app)

An interactive 3D site: a procedurally sculpted character greets visitors in the hero, then sits down at a desk and types as the page scrolls, followed by experience, tech stack, projects and a working contact form.

## Highlights

- **3D character built in code**: head, face, hair and beard are sculpted from a single mesh at runtime (no model download), with blinking, cursor-following eyes and a scroll-driven sit-down animation.
- **Scroll-driven scenes**: sticky full-screen canvas across the hero and overview, a DNA-style helix behind the experience timeline and interactive tech-stack spheres.
- **Fast first paint**: 3D canvases mount only when near the viewport and pause when off screen; three.js ships in its own long-cached chunk.
- **Accessible**: respects `prefers-reduced-motion`, keeps the system cursor on touch devices, and falls back gracefully when WebGL is unavailable.
- **Working contact form** via EmailJS.

## Tech stack

React 18 · Vite · Tailwind CSS · Framer Motion · three.js · React Three Fiber · Drei · EmailJS

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your EmailJS keys
npm run dev            # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

### Environment variables

| Variable | Description |
| --- | --- |
| `VITE_APP_EMAILJS_SERVICE_ID` | EmailJS service ID |
| `VITE_APP_EMAILJS_TEMPLATE_ID` | EmailJS template ID |
| `VITE_APP_EMAILJS_PUBLIC_KEY` | EmailJS public key |
| `VITE_RESUME_URL` | Optional link for the RESUME button (e.g. Google Drive). Defaults to `public/resume.pdf` |

## Editing content

All text lives in [`src/constants/index.js`](src/constants/index.js): profile, rotating roles, awards, experience, tech stack and projects. To update the resume, either replace the file behind `VITE_RESUME_URL` (no redeploy needed) or replace [`public/resume.pdf`](public/resume.pdf) and redeploy.

## Project structure

```
src/
  components/         page sections (Hero, About, Experience, Works, Contact, ...)
  components/canvas/  3D scenes (Avatar, headGeometry, Helix, Ball, Stars)
  constants/          site content
  hooks/              viewport, media-query and pointer helpers
```

## Credits

Started from the open-source [3D developer portfolio](https://github.com/adrianhajdin/project_3D_developer_portfolio) by JavaScript Mastery, then substantially redesigned and extended.

## Contact

[LinkedIn](https://www.linkedin.com/in/abhilashkannan04) · [GitHub](https://github.com/abhikannan04) · abhikannan0407@gmail.com
