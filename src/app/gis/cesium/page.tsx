"use client";
import dynamic from "next/dynamic";

const Cesium = dynamic(() => import("@/components/Cesium"), {
  ssr: false,
});

export default function Page() {
  return (
    <>
      <Cesium />
    </>
  );
}
