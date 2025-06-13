"use client";

import { useRef, useState } from "react";
import {
  Viewer,
  Cesium3DTileset,
  CesiumComponentRef,
  Model,
  Camera,
} from "resium";
import {
  Cartesian3,
  Cesium3DTileStyle,
  Viewer as CesiumViewer,
  createWorldTerrainAsync,
  IonResource,
  Matrix4,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cesium3DTileset as tileSet,
  Math as CesiumMath,
  Transforms,
  Camera as CesiumCamera,
  HeadingPitchRoll,
} from "cesium";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Switch,
  Typography,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import CanvasWindy3D from "@/utils/CanvasWindy3D";
import result from "../../public/assets/mock/cd2.json";
import * as _ from "lodash";
import join from "lodash/join";

export default function Cesium() {
  const terrainProvider = createWorldTerrainAsync();
  const tilesetList = [
    { id: 40866, label: "模型A" },
    { id: 5713, label: "模型B" },
  ];
  const presetViews = [
    {
      name: "默认视角",
      position: Cartesian3.fromDegrees(104.07, 30.67, 1000),
      hpr: new HeadingPitchRoll(0, -0.5, 0),
    },
    {
      name: "俯视图",
      position: Cartesian3.fromDegrees(104.07, 30.67, 2000),
      hpr: new HeadingPitchRoll(0, -CesiumMath.PI_OVER_TWO, 0),
    },
    {
      name: "北向视图",
      position: Cartesian3.fromDegrees(104.07, 30.67, 1000),
      hpr: new HeadingPitchRoll(CesiumMath.toRadians(180), -0.3, 0),
    },
  ];
  const options = {
    // default
    // age: 120, // 粒子最大生命周期
    // particalsNumber: 10000, // 初始粒子总数
    // frameRate: 1, // 刷新速度
    // speedRate: 100, // 粒子前行速度

    // cd2
    age: 20, // 粒子最大生命周期
    particalsNumber: 1500, // 初始粒子总数
    frameRate: 10, // 刷新速度
    speedRate: 500, // 粒子前行速度
  };

  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);
  const cameraRef = useRef<CesiumComponentRef<CesiumCamera>>(null);
  const tileRef = useRef<CesiumComponentRef<tileSet>>(null);
  const windyRef = useRef<CanvasWindy3D>(null);
  const handler = useRef<ScreenSpaceEventHandler>(null);
  const [curView, setCurView] = useState(0);
  const [curTileId, setCurTileId] = useState(5713);
  const [showTileset, setShowTileset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGLTF, setShowGLTF] = useState(false);
  const [modelMatrix, setModelMatrix] = useState<Matrix4>();
  const [showWind, setShowWind] = useState(false);

  const handleChangeTile = (event: React.ChangeEvent, value: string) => {
    setCurTileId(parseInt(value));
    setLoading(true);
  };
  const handleSwitchTile = (
    event: React.ChangeEvent<HTMLInputElement>,
    value: boolean
  ) => {
    setShowTileset(value);
    value && setLoading(true);
  };
  const handleTileReady = async (tileset: tileSet) => {
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
        const boundingSphere = tileset.boundingSphere;
        boundingSphere.radius *= 1.2;
        cameraRef.current?.cesiumElement?.flyToBoundingSphere(boundingSphere, {
          duration: 1,
        });

        // 鼠标抓取事件
        // const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        // handler.setInputAction((movement: any) => {
        //   const picked = viewer.scene.pick(movement.position);
        //   console.log("Picked:", picked);
        // if (picked && typeof picked.getPropertyNames === "function") {
        //   const props = picked.getPropertyNames().map((name: string) => ({
        //     [name]: picked.getProperty(name),
        //   }));
        //   console.log("Picked feature properties:", props);
        // } else {
        //   console.log("No valid feature picked");
        // }
        // }, ScreenSpaceEventType.LEFT_CLICK);
        // // 清理
        // return () => {
        //   handler.destroy();
        // };
      }
    } catch (e) {
      console.error("Tileset failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchGLTF = async (
    event: React.ChangeEvent<HTMLInputElement>,
    value: boolean
  ) => {
    setShowGLTF(value);
    if (value) {
      const position = Cartesian3.fromDegrees(104.07, 30.67, 458);
      const hpr = new HeadingPitchRoll(
        0,
        CesiumMath.toRadians(90),
        CesiumMath.toRadians(-90)
      );
      const matrix = Transforms.headingPitchRollToFixedFrame(position, hpr);
      setModelMatrix(matrix);
      setLoading(true);
    }
  };
  const handleModelReady = async (model: any) => {
    try {
      if (viewerRef.current?.cesiumElement) {
        const boundingSphere = model.boundingSphere;
        boundingSphere.radius *= 1.2;
        cameraRef.current?.cesiumElement?.flyToBoundingSphere(boundingSphere, {
          duration: 1,
        });
      }
    } catch (err) {
      console.log("model error: ", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchWind = (
    event: React.ChangeEvent<HTMLInputElement>,
    value: boolean
  ) => {
    setShowWind(value);
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;
    if (value) {
      let udata = result.u;
      let vdata = result.v;
      let wdata = result.w;
      let header = {
        isForecast: 0,
        nx: 205,
        ny: 143,
        lo1: 102.9,
        lo2: 104.94,
        la1: 31.46,
        la2: 30.04,
        dx: 0.01,
        dy: 0.01,
      };
      const cols = header.nx;
      const rows = header.ny;
      const windData = {
        cols,
        rows,
        udata,
        vdata,
        wdata,
        ymin: header.la2,
        ymax: header.la1,
        xmin: header.lo1,
        xmax: header.lo2,
      };

      const canvas = document.createElement("canvas");
      canvas.width = viewer.canvas.clientWidth;
      canvas.height = viewer.canvas.clientHeight;
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.pointerEvents = "none";
      document.body.appendChild(canvas);

      // 创建 CanvasWindy 实例
      windyRef.current = new CanvasWindy3D(windData, {
        viewer: viewerRef.current?.cesiumElement,
        canvas: canvas,
        canvasWidth: viewer.canvas.clientWidth,
        canvasHeight: viewer.canvas.clientHeight,
        speedRate: options.speedRate,
        frameRate: options.frameRate,
        particlesNumber: options.particalsNumber,
        maxAge: options.age,
        color: "#ffffff",
        lineWidth: 2,
      });

      const debounced = _.debounce(() => {
        windyRef.current?.removeLines();
        windyRef.current?._init(); // FIXME: 无效
      }, 1000);
      handler.current = new ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.current.setInputAction((_: any) => {
        debounced();
      }, ScreenSpaceEventType.WHEEL);
      handler.current.setInputAction((_: any) => {
        windyRef.current?.removeLines();
      }, ScreenSpaceEventType.LEFT_DOWN);
      handler.current.setInputAction((_: any) => {
        windyRef.current?._init(); // FIXME: 无效
      }, ScreenSpaceEventType.LEFT_UP);
    } else {
      handler.current?.destroy();
      if (windyRef.current) {
        windyRef?.current?.removeLines();
        windyRef.current = null;
      }
    }
  };

  const handleChangeView = (event: React.ChangeEvent, value: string) => {
    const curIdx = parseInt(value);
    setCurView(curIdx);
    const view = presetViews[curIdx];
    const camera = cameraRef.current?.cesiumElement;
    if (camera) {
      camera.flyTo({
        destination: view.position,
        orientation: {
          heading: view.hpr.heading,
          pitch: view.hpr.pitch,
          roll: view.hpr.roll,
        },
        duration: 1.5,
      });
    }
  };

  return (
    <>
      <Viewer
        full
        ref={viewerRef}
        terrainProvider={terrainProvider} // 添加此行启用地形
      >
        <Camera ref={cameraRef} />
        {showTileset && (
          <Cesium3DTileset
            key={curTileId}
            ref={tileRef}
            url={IonResource.fromAssetId(curTileId)}
            onReady={handleTileReady}
          />
        )}

        {showGLTF && (
          <Model
            url="/assets/model/chengdu.glb"
            modelMatrix={modelMatrix}
            scale={1.0}
            minimumPixelSize={128}
            maximumScale={10}
            onReady={handleModelReady}
          />
        )}
      </Viewer>

      {/* Hint */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 h-20 w-30 rounded bg-white opacity-80 text-black -translate-x-1/2 -translate-y-1/2 z-50 flex-center">
          Loading...
        </div>
      )}
      {/* Form */}
      <div className="absolute top-0 left-0 w-1/6 h-1/4 z-50 flex flex-col">
        <Accordion>
          <AccordionSummary
            expandIcon={<FontAwesomeIcon icon={faChevronUp} />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">3D Tile</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch checked={showTileset} onChange={handleSwitchTile} />
                }
                label="展示"
              />
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
        <Accordion>
          <AccordionSummary
            expandIcon={<FontAwesomeIcon icon={faChevronUp} />}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            <Typography component="span">GLTF模型</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch checked={showGLTF} onChange={handleSwitchGLTF} />
                }
                label="展示"
              />
            </FormGroup>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<FontAwesomeIcon icon={faChevronUp} />}
            aria-controls="panel3-content"
            id="panel3-header"
          >
            <Typography component="span">视角</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                name="radio-buttons-group"
                value={curView}
                onChange={handleChangeView}
              >
                {presetViews.map((view, idx) => (
                  <FormControlLabel
                    key={idx}
                    value={idx}
                    control={<Radio />}
                    label={view.name}
                  />
                ))}
              </RadioGroup>
            </FormGroup>
          </AccordionDetails>
        </Accordion>
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<FontAwesomeIcon icon={faChevronUp} />}
            aria-controls="panel4-content"
            id="panel4-header"
          >
            <Typography component="span">3D Wind</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch checked={showWind} onChange={handleSwitchWind} />
                }
                label="展示"
              />
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </div>
    </>
  );
}
