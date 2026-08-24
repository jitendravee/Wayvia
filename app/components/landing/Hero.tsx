import React from 'react'
import TitleCol from './components/TitleCol';
import LandingSearch from './components/LandingSearch';

const Hero = () => {
  return (
    <div className="flex flex-col gap-10"><TitleCol />
    <LandingSearch />
    </div>
  )
}

export default Hero