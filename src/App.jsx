import { BrowserRouter } from "react-router-dom";

import { testimonials } from "./constants";
import { useMediaQuery } from "./hooks";
import { About, AvatarStage, Contact, Cursor, Experience, Feedbacks, Footer, Hero, Navbar, Preloader, Services, SocialRail, Tech, Works, StarsCanvas } from "./components";

const App = () => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <BrowserRouter>
      <Preloader />
      <Cursor />
      <div className='relative z-0 bg-primary'>
        {/* Fixed, scroll-reactive star field behind every section. */}
        <StarsCanvas />

        <Navbar />
        <SocialRail />
        {/* The 3D character stays on screen across the hero, overview and
            services: it sits down at its desk, then stands and moves aside
            to watch the service cards arrive (desktop). */}
        <div className='relative'>
          {isDesktop && <AvatarStage />}
          <Hero />
          <About />
          <Services />
        </div>
        <Experience />
        <Tech />
        <Works />
        {testimonials.length > 0 && <Feedbacks />}
        <Contact />
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
