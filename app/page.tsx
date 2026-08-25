import Link from "next/link";
import TrainSearchBox from "./components/TrainSearchBox";
import { POPULAR_TRAINS } from "@/lib/trains";
import { PageInner } from "./components/PageClient";
import { Suspense } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/landing/Hero";
import Image from "next/image";
import HowWayviaThinks from "./components/landing/HowWayviaThinks";
import WeDontStopAtFirstRoute from "./components/landing/WeDontStopCheckList";
import AddAStopSection from "./components/landing/AddAStopSection";
import MoreWaysToGetThere from "./components/landing/MoreWaysToGetThere";
import WhereAreYouGoing from "./components/landing/WhereAreYouGoing";
import BetterDependsOnYou from "./components/landing/BetterDependsOnYou";

export default function Page() {
  return (
    <main className="flex flex-col gap-10 md:gap-20 h-full w-full overflow-hidden pb-20">
      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-gray-50 min-h-[620px] py-14 sm:min-h-[680px] sm:py-16 lg:h-[90vh] lg:py-0">
        {/* Responsive background image — purely decorative, always fills the
            section (object-cover) no matter what height the section ends up
            at. It never drives layout; the content column below does. */}
        <picture className="absolute inset-0 block h-full w-full">
          {/* Mobile */}
          <source media="(max-width: 767px)" srcSet="/mobile-hero.png" />

          {/* Tablet */}
          <source
            media="(min-width: 768px) and (max-width: 1199px)"
            srcSet="/tablet-hero.png"
          />

          {/* Desktop */}
          <img
            src="/hero.png"
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-white/80 md:from-white/40 to-transparent" />

        {/* Hero content — a normal flowing column. On small screens the
            section grows to fit it (min-h + padding above); on large
            screens it's vertically centered inside the fixed 90vh box. */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center px-5 sm:px-6">
          <Hero />
        </div>
      </section>
      <section  id="how-it-works">
        <HowWayviaThinks />
      </section>

      <section>
        <WeDontStopAtFirstRoute />
      </section>
      <WhereAreYouGoing />

      <AddAStopSection />
      <MoreWaysToGetThere />
      <BetterDependsOnYou />
      {/* HOW IT WORKS */}
    </main>
  );
}
