'use client'; // For Next.js client-side rendering

import React from "react";
import Lottie from "react-lottie";
import Loading from "../../../public/loading2.json";

const Loader = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Lottie options={defaultOptions} height={50} />
    </div>
  );
};

export default Loader;
