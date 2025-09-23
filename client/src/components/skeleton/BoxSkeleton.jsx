import React from "react";


function BoxSkeleton({ height = "h-4", width = "w-full", paddingX = "", paddingY = "", radius = "rounded" }) {
  return (
    <span
      aria-hidden="true"
      className={`bg-gray-300 ${radius} ${paddingX} ${paddingY} ${height} ${width} block animate-pulse`}
    />
  );
}

export default BoxSkeleton;
