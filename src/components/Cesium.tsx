"use client";

import { useRef, useState } from "react";
import { Viewer, Cesium3DTileset, CesiumComponentRef } from "resium";
import {
  Cartesian3,
  Cesium3DTileStyle,
  Viewer as CesiumViewer,
  createWorldTerrainAsync,
  IonResource,
  Math as CesiumMath,
  Matrix3,
  Matrix4,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cesium3DTileset as tileSet,
  Transforms,
} from "cesium";
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";

export default function Cesium() {
  const terrainProvider = createWorldTerrainAsync();
  const tilesetList = [
    { id: 40866, label: "模型A" },
    { id: 5713, label: "模型B" },
  ];

  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);
  const tileRef = useRef<CesiumComponentRef<tileSet>>(null);
  const [curTileId, setCurTileId] = useState(5713);
  const [loading, setLoading] = useState(true);

  const handleChangeTile = (event: React.ChangeEvent, value: string) => {
    setCurTileId(parseInt(value));
    setLoading(true);
  };

  const handleReady = async (tileset: tileSet) => {
    try {
      // 模型样式
      tileset.style = new Cesium3DTileStyle({
        color: "color('blue', 0.6)",
      });
      // 模型平移和旋转
      const offset = Cartesian3.fromElements(0, 0, 30); // 经纬度、高度
      const offsetMatrix = Matrix4.fromTranslation(offset);
      tileset.root.transform = Matrix4.multiply(
        tileset.root.transform,
        offsetMatrix,
        new Matrix4()
      );

      const viewer = viewerRef.current?.cesiumElement;
      if (viewer) {
        // 控制camera飞到模型位置
        const camera = viewer.camera;
        const boundingSphere = tileset.boundingSphere;
        boundingSphere.radius *= 1.2;
        camera.flyToBoundingSphere(boundingSphere, {
          duration: 1,
        });

        // 鼠标抓取事件
        const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement: any) => {
          const picked = viewer.scene.pick(movement.position);
          console.log("Picked:", picked);
          if (picked && typeof picked.getPropertyNames === "function") {
            const props = picked.getPropertyNames().map((name: string) => ({
              [name]: picked.getProperty(name),
            }));
            console.log("Picked feature properties:", props);
          } else {
            console.log("No valid feature picked");
          }
        }, ScreenSpaceEventType.LEFT_CLICK);
        // 清理
        return () => {
          handler.destroy();
        };
      }
    } catch (e) {
      console.error("Tileset failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Viewer
        full
        ref={viewerRef}
        terrainProvider={terrainProvider} // 添加此行启用地形
      >
        <Cesium3DTileset
          key={curTileId}
          ref={tileRef}
          url={IonResource.fromAssetId(curTileId)}
          onReady={handleReady}
        />
      </Viewer>

      {/* Hint */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 h-20 w-30 rounded bg-white opacity-80 text-black -translate-x-1/2 -translate-y-1/2 z-50 flex-center">
          Loading...
        </div>
      )}

      {/* Form */}
      <div className="absolute top-0 left-0 w-1/6 h-1/4 z-50 flex flex-col">
        <Accordion defaultExpanded>
          <AccordionSummary
            // expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">3D Tile</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                name="radio-buttons-group"
                value={curTileId}
                onChange={handleChangeTile}
              >
                {tilesetList.map((tile) => (
                  <FormControlLabel
                    key={tile.id}
                    value={tile.id}
                    control={<Radio />}
                    label={tile.label}
                  />
                ))}
              </RadioGroup>
            </FormGroup>
          </AccordionDetails>
        </Accordion>
        {/* <Accordion>
          <AccordionSummary
            // expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3-content"
            id="panel3-header"
          >
            <Typography component="span">Test</Typography>
          </AccordionSummary>
          <AccordionDetails>...</AccordionDetails>
          <AccordionActions>
            <Button>Cancel</Button>
            <Button>Agree</Button>
          </AccordionActions>
        </Accordion> */}
      </div>
    </>
  );
}
