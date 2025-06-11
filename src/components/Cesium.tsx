"use client";

import { useRef, useState } from "react";
import { Viewer, Cesium3DTileset, CesiumComponentRef } from "resium";
import {
  Viewer as CesiumViewer,
  IonResource, // https://sandcastle.cesium.com/
  Cesium3DTileset as tileSet,
} from "cesium";

export default function Cesium() {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);
  const [tileLoaded, setTileLoaded] = useState(false);

  const handleReady = async (tileset: tileSet) => {
    try {
      // ↓ viewer
      if (viewerRef.current?.cesiumElement) {
        // viewerRef.current.cesiumElement.zoomTo(tileset);
        // ↑ http://cesium.xin/cesium/cn/Documentation1.72/Viewer.html?classFilter=viewer#zoomTo
        const camera = viewerRef.current.cesiumElement.camera;
        const boundingSphere = tileset.boundingSphere;
        boundingSphere.radius *= 1.2; // 安全边距

        camera.flyToBoundingSphere(boundingSphere, {
          duration: 1,
        });
      }
      setTileLoaded(true);
    } catch (e) {
      console.error("Tileset failed to load:", e);
      setTileLoaded(false);
    }
  };

  return (
    <>
      <Viewer full ref={viewerRef}>
        <Cesium3DTileset
          url={IonResource.fromAssetId(40866)}
          onReady={handleReady}
        />
      </Viewer>
      {!tileLoaded && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black text-white z-50">
          Loading...
        </div>
      )}
    </>
  );
}
