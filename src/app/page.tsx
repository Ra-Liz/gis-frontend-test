"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push("/gis/cesium");
  }, []);
  return <div className="w-full h-full bg-black"></div>;
}
