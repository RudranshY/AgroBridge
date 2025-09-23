import React from "react";
import BoxSkeleton from "./BoxSkeleton";

/**
 * Use a <span> root (inline) so TextSkeleton can be used inside <p>.
 * The internal BoxSkeletons are block-level via Tailwind so layout is preserved.
 */
const TextSkeleton = ({
  noOfRows = 6,
  fontSizeHeightMd = "h-[16px]",
  fontSizeHeight = "h-[14px]",
  width = "w-full",
}) => {
  return (
    <span className={`inline-grid gap-1.5 ${width}`} role="presentation">
      {Array.from({ length: noOfRows }).map((_, index) => (
        <BoxSkeleton
          key={index}
          width={"w-full"}
          radius={"rounded"}
          height={`${fontSizeHeightMd} md:${fontSizeHeight}`}
        />
      ))}
    </span>
  );
};

export default TextSkeleton;
