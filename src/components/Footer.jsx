import { profile } from "../constants";

const Footer = () => (
  <footer className='relative z-10 border-t border-white/10'>
    <p className='max-w-7xl mx-auto sm:px-16 px-6 py-8 text-center text-[14px] text-secondary'>
      © {new Date().getFullYear()} {profile.fullName} | Palanpur, Gujarat
    </p>
  </footer>
);

export default Footer;
