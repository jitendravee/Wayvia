import React from "react";

const TitleCol = () => {
  return (
    <div className="flex flex-col gap-4 ">
      <h1 className="font-display text-[46px] font-semibold leading-[110%]">
        One destination,
        <br />
        <span className="text-violet">Thousands of ways</span> to get there.
      </h1>
      <p className="text-ink/70">
        Explore trains, buses, flights, and connections to discover smarter ways
        to get there
        <br />
        even when the usual route doesn’t work.
      </p>
    </div>
  );
};

export default TitleCol;
