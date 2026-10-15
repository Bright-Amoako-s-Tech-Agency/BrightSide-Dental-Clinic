import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import orthodontics from "../assets/orthodontist.jpg";
import preventive from "../assets/preventive.jpg";
import restorative from "../assets/restoration.jpg";
import welcome from "../assets/welcome.jpg";

const treatments = [
  {
    title: "Preventive & Hygiene",
    description: "Keep your smile healthy with regular dental care.",
    href: "/treatments",
    image: preventive,
  },
  {
    title: "Restorative Care",
    description: "Restore comfort, function, and confidence in your smile.",
    href: "/treatments",
    image: restorative,
  },
  {
    title: "Cosmetic Dentistry",
    description: "Explore options to help you feel confident about your smile.",
    href: "/treatments",
    image:
      "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "Orthodontics & Implants",
    description: "Discover treatment options tailored to your needs.",
    href: "/treatments",
    image: orthodontics,
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b84620]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl leading-tight text-[#0d2d26] sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 leading-7 text-[#66716a]">{description}</p>
      )}
    </div>
  );
}

function SectionImage({ src, alt, className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`block h-full w-full object-cover ${className}`}
    />
  );
}

const homepageImages = {
  welcome: welcome,
  preventive: preventive,
  restorative: restorative,
  cosmetic:
    "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=700&q=80",
  orthodontics: orthodontics,
  clinic:
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1400&q=80",
};

export default function Home() {
  const [videoFailed, setVideoFailed] = useState(false);

  const videoRef = useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f4ed] text-[#10231f]">
      {/* Public navigation */}
      <header className="relative z-20 border-b border-[#e5e1d8] bg-[#f7f4ed]">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          <Link to="/" className="shrink-0" aria-label="BrightSmile home">
            <span className="font-serif text-2xl font-semibold tracking-tight text-[#0d2d26]">
              BrightSmile
            </span>
            <span className="ml-2 hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b84620] sm:inline">
              Dental
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#treatments"
              className="text-sm text-[#46504c] hover:text-[#b84620]"
            >
              Treatments
            </a>
            <a
              href="#clinicians"
              className="text-sm text-[#46504c] hover:text-[#b84620]"
            >
              Our clinicians
            </a>
            <a
              href="#about"
              className="text-sm text-[#46504c] hover:text-[#b84620]"
            >
              About us
            </a>
          </nav>

          <a
            href="#book"
            className="shrink-0 rounded-lg bg-[#0d2d26] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#174238] sm:px-5"
          >
            Book an appointment
          </a>
        </div>
      </header>

      <main>
        {/* Cinematic hero */}
        <section className="relative isolate flex min-h-[620px] items-center overflow-hidden bg-[#263b32] sm:min-h-[680px] lg:min-h-[740px]">
          {!videoFailed && !prefersReducedMotion && (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/brightsmile-hero-poster.png"
              onError={() => setVideoFailed(true)}
              aria-hidden="true"
            >
              <source src="/videos/brightsmile-hero.mp4" type="video/mp4" />
            </video>
          )}

          {videoFailed && (
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,#8b9a86_0%,#536b5d_35%,#263b32_78%)]"
              aria-hidden="true"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-[#10251f]/85 via-[#10251f]/55 to-[#10251f]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10251f]/35 via-transparent to-black/10" />

          <div className="relative mx-auto w-full max-w-[1440px] px-6 py-20 sm:px-10 lg:px-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0b69b] sm:text-sm">
                Thoughtful care. Confident smiles.
              </p>

              <h1 className="mt-6 font-serif text-5xl leading-[1.08] text-[#fffdf8] sm:text-6xl lg:text-7xl">
                A healthier smile starts here.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
                Gentle, thoughtful dental care in a welcoming environment, with
                your comfort at the heart of every visit.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#book"
                  className="rounded-lg bg-[#b84620] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#9f3c1b]"
                >
                  Book an appointment
                </a>
                <a
                  href="#treatments"
                  className="rounded-lg border border-white/60 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore treatments
                </a>
              </div>
            </div>
          </div>

          <p className="absolute bottom-5 right-6 text-xs tracking-wide text-white/70 sm:right-10">
            Care that feels different.
          </p>
        </section>

        {/* Introduction */}
        <section id="about" className="px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div className="overflow-hidden rounded-2xl">
              <div className="aspect-[4/3]">
                <SectionImage
                  src={homepageImages.welcome}
                  alt="Dental care in a welcoming clinical environment"
                />
              </div>
            </div>

            <div>
              <SectionHeading
                eyebrow="Welcome to BrightSmile"
                title="Dental care built around you."
                description="Every smile is different. We take the time to understand your needs, explain your options, and help you feel comfortable throughout your care."
              />

              <div className="mt-8 border-l-2 border-[#b84620] pl-6 sm:pl-8">
                <p className="font-serif text-2xl leading-relaxed text-[#0d2d26] sm:text-3xl">
                  A thoughtful approach to your oral health, from your first
                  visit to every smile that follows.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Treatment browsing */}
        <section
          id="treatments"
          className="bg-[#eeece5] px-6 py-20 sm:px-10 lg:px-16 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="Explore our care"
                title="Care for every kind of smile."
                description="Browse our treatment areas to find the care that fits your needs."
              />
              <Link
                to="/treatments"
                className="shrink-0 text-sm font-semibold text-[#0d2d26] underline decoration-[#b84620] underline-offset-4"
              >
                View all treatments
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {treatments.map((treatment, index) => (
                <article
                  key={treatment.title}
                  className="flex min-h-[250px] flex-col rounded-2xl border border-[#dedad1] bg-[#f7f4ed] p-6 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="-mx-6 -mt-6 mb-5 overflow-hidden rounded-t-2xl">
                    <div className="aspect-[5/3]">
                      <SectionImage
                        src={treatment.image}
                        alt={treatment.title}
                      />
                    </div>
                  </div>
                  <span className="font-serif text-sm text-[#b84620]">
                    0{index + 1}
                  </span>
                  <h3 className="mt-7 font-serif text-2xl text-[#0d2d26]">
                    {treatment.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#66716a]">
                    {treatment.description}
                  </p>
                  <Link
                    to={treatment.href}
                    className="mt-6 text-sm font-semibold text-[#0d2d26] hover:text-[#b84620]"
                  >
                    Explore care <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Clinicians */}
        <section
          id="clinicians"
          className="px-6 py-20 sm:px-10 lg:px-16 lg:py-24"
        >
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Meet your care team"
              title="People who put you at ease."
              description="Get to know the clinicians who will support your dental health."
            />
            <Link
              to="/staff/clinicians"
              className="text-sm font-semibold text-[#0d2d26] underline decoration-[#b84620] underline-offset-4"
            >
              Clinician information
            </Link>
          </div>

          <div className="mt-10 rounded-2xl border border-[#e5e1d8] bg-white/50 p-8 sm:p-12">
            <p className="max-w-2xl font-serif text-2xl leading-relaxed text-[#0d2d26] sm:text-3xl">
              Professional care begins with listening, understanding, and
              treating every patient with kindness.
            </p>
            <p className="mt-5 text-sm leading-6 text-[#66716a]">
              Clinician profiles and photographs will be connected to the
              existing clinician data in the next implementation step.
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-[#0d2d26] px-6 py-20 text-[#fffdf8] sm:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="The patient experience"
              title="Comfort matters at every step."
              description="We want every visit to feel considered, clear, and welcoming."
            />
            <div className="mt-10 max-w-3xl border-t border-white/20 pt-8">
              <p className="font-serif text-2xl leading-relaxed sm:text-3xl">
                Your experience matters as much as the care you receive.
              </p>
              <p className="mt-4 text-sm leading-6 text-white/65">
                Verified patient testimonials will be added from your approved
                content rather than invented reviews.
              </p>
            </div>
          </div>
        </section>

        {/* Booking call to action */}
        <section id="book" className="px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-3xl bg-[#e8e4d9] p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:p-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b84620]">
                Your next step
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-[#0d2d26] sm:text-4xl">
                Ready to make time for your smile?
              </h2>
              <p className="mt-4 leading-7 text-[#59645d]">
                Start planning your visit with BrightSmile.
              </p>
            </div>

            <a
              href="mailto:hello@brightsmile.example"
              className="inline-flex shrink-0 justify-center rounded-lg bg-[#b84620] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#9f3c1b]"
            >
              Ask about an appointment
            </a>
          </div>
        </section>

        {/* Clinic information */}
        <section className="border-t border-[#e5e1d8] px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-2 lg:gap-14">
            <div className="overflow-hidden rounded-2xl">
              <div className="aspect-[5/3]">
                <SectionImage
                  src={homepageImages.clinic}
                  alt="Modern dental clinic interior"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b84620]">
                Visit us
              </p>
              <h2 className="mt-3 font-serif text-2xl text-[#0d2d26]">
                We look forward to welcoming you.
              </h2>
              <div className="mt-4 text-sm leading-7 text-[#66716a]">
                <p>Airport Residential Area, Accra</p>
                <p>
                  Opening hours and contact details will be confirmed before
                  launch.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#10251f] px-6 py-10 text-white sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="font-serif text-2xl font-semibold">
              BrightSmile
            </Link>
            <p className="mt-2 text-sm text-white/65">
              Thoughtful care. Confident smiles.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-white/75">
            <a href="#treatments" className="hover:text-white">
              Treatments
            </a>
            <a href="#clinicians" className="hover:text-white">
              Our clinicians
            </a>
            <a href="#book" className="hover:text-white">
              Appointments
            </a>
            <Link to="/staff" className="hover:text-white">
              Staff portal
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/15 pt-5 text-xs text-white/50">
          © {new Date().getFullYear()} BrightSmile Dental. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
