import React from "react";

const TitleCol = () => {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <h1 className="font-display text-[26px] font-semibold leading-[1.18] sm:text-[32px] sm:leading-[1.14] md:text-[46px] md:leading-[110%]">
        One destination,
        <br />
        {/* inline-block + text-balance lets this phrase choose its own line
            breaks based on the actual width available at each screen size,
            instead of wrapping greedily and stranding a lone word. */}
        <span className="text-balance inline-block">
          <span className="text-violet">Thousands of ways</span> to get there.
        </span>
      </h1>
      <p className="text-pretty max-w-[42ch] text-[13px] leading-relaxed text-ink/70 sm:text-[14px] md:text-base">
        Explore trains, buses, flights, and connections to discover smarter
        ways to get there even when the usual route doesn&rsquo;t work.
      </p>
    </div>
  );
};

export default TitleCol;