"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { erangelPoints, mapCategories, MapCategoryId } from "../lib/mapData";

const mapImage = "https://raw.githubusercontent.com/pubg/api-assets/master/Assets/Maps/Erangel_Main_Low_Res.png";

export default function PubgMapExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const [active, setActive] = useState<Set<MapCategoryId>>(new Set());
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      const bounds = L.latLngBounds([0, 0], [1_000, 1_000]);
      const map = L.map(containerRef.current, {
        attributionControl: false,
        crs: L.CRS.Simple,
        maxBounds: bounds.pad(0.08),
        maxBoundsViscosity: 0.9,
        minZoom: -1,
        maxZoom: 3,
        zoomControl: true,
        zoomSnap: 0.25,
      });
      L.imageOverlay(mapImage, bounds).addTo(map);
      const layer = L.layerGroup().addTo(map);
      map.fitBounds(bounds, { animate: false });
      leafletRef.current = L;
      mapRef.current = map;
      markerLayerRef.current = layer;
      setReady(true);
    }

    initialize();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = markerLayerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();

    for (const item of erangelPoints.filter((entry) => active.has(entry.category))) {
      const category = mapCategories.find((entry) => entry.id === item.category);
      if (!category) continue;
      const icon = L.divIcon({
        className: "map-marker-shell",
        html: `<span class="map-marker" style="--marker-color:${category.color}"><i>${category.icon}</i></span>`,
        iconAnchor: [15, 15],
        iconSize: [30, 30],
        popupAnchor: [0, -16],
      });
      L.marker([1_000 - item.y * 10, item.x * 10], { icon })
        .bindPopup(`<strong>${item.name}</strong><span>${item.note}</span>`)
        .addTo(layer);
    }
  }, [active, ready]);

  function toggle(category: MapCategoryId) {
    setActive((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <section className="pubg-map-explorer">
      <button
        aria-expanded={panelOpen}
        className="map-filter-open"
        onClick={() => setPanelOpen((open) => !open)}
        type="button"
      >
        필터 {active.size ? `· ${active.size}` : ""}
      </button>

      <aside className={panelOpen ? "map-filter-panel open" : "map-filter-panel"}>
        <div className="map-filter-head">
          <div><span>MAP SELECT</span><h1>에란겔</h1></div>
          <button aria-label="필터 닫기" onClick={() => setPanelOpen(false)} type="button">×</button>
        </div>
        <div className="map-picker" aria-label="맵 선택">
          <b>ERANGEL</b>
          <span>미라마 · 태이고 · 론도 · 비켄디 · 데스턴 준비 중</span>
        </div>
        <div className="map-filter-title">
          <span>카테고리 필터</span>
          <button onClick={() => setActive(new Set())} type="button">모두 숨김</button>
        </div>
        <div className="map-filter-list">
          {mapCategories.map((category) => {
            const count = erangelPoints.filter((item) => item.category === category.id).length;
            const selected = active.has(category.id);
            return (
              <button
                aria-pressed={selected}
                className={selected ? "active" : ""}
                key={category.id}
                onClick={() => toggle(category.id)}
                type="button"
              >
                <i style={{ background: category.color }}>{category.icon}</i>
                <span>{category.label}</span>
                <b>{count}</b>
              </button>
            );
          })}
        </div>
        <div className="map-filter-foot">
          <strong>BETA · 위치 데이터 검수 중</strong>
          <p>스폰과 시설 위치는 패치에 따라 달라질 수 있습니다.</p>
          <small>PUBG, PLAYERUNKNOWN’S BATTLEGROUNDS and all related logos are trademarks of KRAFTON, Inc.</small>
        </div>
      </aside>

      <div className="map-canvas-wrap">
        <div aria-label="에란겔 인터랙티브 지도" className="map-canvas" ref={containerRef} />
        <div className="map-attribution">
          Map image · <a href="https://github.com/pubg/api-assets" rel="noreferrer" target="_blank">PUBG API Assets ↗</a>
        </div>
      </div>
    </section>
  );
}
