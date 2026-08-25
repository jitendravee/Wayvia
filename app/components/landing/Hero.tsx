import React from "react";
import TitleCol from "./components/TitleCol";
import LandingSearch from "./components/LandingSearch";

const Hero = () => {
  return (
    <div className="flex w-full flex-col gap-6 sm:gap-8 md:gap-10 pt-10">
      <TitleCol />
      <LandingSearch />
    </div>
  );
};

export default Hero;