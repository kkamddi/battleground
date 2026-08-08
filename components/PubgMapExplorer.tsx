"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { OpeningRouteAnalysis } from "../lib/pubgRoutes";
import {
  mapCatalog,
  mapCategories,
  mapDataVersion,
  mapSlugs,
  type MapCategoryId,
  type MapMode,
  type MapSlug,
} from "../lib/mapData";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character]!);
}

export default function PubgMapExplorer({ mapSlug }: { mapSlug: MapSlug }) {
  const definition = mapCatalog[mapSlug];
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const routeLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const endgameLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const [active, setActive] = useState<Set<MapCategoryId>>(new Set());
  const [mode, setMode] = useState<MapMode>("normal");
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [showEndgames, setShowEndgames] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState<OpeningRouteAnalysis | null>(null);
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "error">("idle");

  const modePoints = useMemo(
    () => definition.points.filter((point) => point[3] === mode || point[3] === "both"),
    [definition.points, mode],
  );

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    async function initialize() {
      if (!containerRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      const bounds = L.latLngBounds([0, 0], [1_000, 1_000]);
      const map = L.map(containerRef.current, {
        attributionControl: false,
        crs: L.CRS.Simple,
        maxBounds: bounds.pad(0.08),
        maxBoundsViscosity: 0.9,
        minZoom: -1,
        maxZoom: 2,
        zoomControl: true,
        zoomSnap: 0.25,
      });
      L.imageOverlay(definition.image, bounds).addTo(map);
      const layer = L.layerGroup().addTo(map);
      const routeLayer = L.layerGroup().addTo(map);
      const endgameLayer = L.layerGroup().addTo(map);
      map.fitBounds(bounds, { animate: false });
      leafletRef.current = L;
      mapRef.current = map;
      markerLayerRef.current = layer;
      routeLayerRef.current = routeLayer;
      endgameLayerRef.current = endgameLayer;
      setReady(true);
    }

    initialize();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      routeLayerRef.current = null;
      endgameLayerRef.current = null;
      leafletRef.current = null;
    };
  }, [definition.image]);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = markerLayerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();

    for (const point of modePoints.filter((entry) => active.has(entry[0]))) {
      const [categoryId, x, y, , source] = point;
      const category = mapCategories.find((entry) => entry.id === categoryId);
      if (!category) continue;
      const icon = L.divIcon({
        className: "map-marker-shell",
        html: `<span class="map-marker" style="--marker-color:${category.color}"><i>${category.icon}</i></span>`,
        iconAnchor: [15, 15],
        iconSize: [30, 30],
        popupAnchor: [0, -16],
      });
      const sourceLabel = source === "game-data" ? "게임 월드 좌표" : "커뮤니티 교차검증";
      L.marker([1_000 - (y / definition.worldSize) * 1_000, (x / definition.worldSize) * 1_000], { icon })
        .bindPopup(`<strong>${category.label}</strong><span>${sourceLabel} · ${Math.round(x / 100)}m, ${Math.round(y / 100)}m</span>`)
        .addTo(layer);
    }
  }, [active, definition.worldSize, modePoints, ready]);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = routeLayerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    if (!showRoutes || !routeAnalysis) return;

    for (const route of routeAnalysis.routes) {
      const coordinates = route.points.map((point) => [
        1_000 - (point.y / definition.worldSize) * 1_000,
        (point.x / definition.worldSize) * 1_000,
      ] as Leaflet.LatLngTuple);
      const popup = `${route.leaderboardRank}위 ${escapeHtml(route.playerName)} · 매치 ${route.placement}위`;
      L.polyline(coordinates, { color: "#f0b429", opacity: 0.72, weight: 3 })
        .bindPopup(popup)
        .addTo(layer);
      L.circleMarker(coordinates[0], {
        color: "#111",
        fillColor: "#f0b429",
        fillOpacity: 1,
        radius: 5,
        weight: 2,
      }).bindPopup(`낙하지점 · ${popup}`).addTo(layer);
    }
  }, [definition.worldSize, ready, routeAnalysis, showRoutes]);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = endgameLayerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    if (!showEndgames || !routeAnalysis) return;

    for (const endgame of routeAnalysis.endgames) {
      const center: Leaflet.LatLngTuple = [
        1_000 - (endgame.y / definition.worldSize) * 1_000,
        (endgame.x / definition.worldSize) * 1_000,
      ];
      const radius = (endgame.radius / definition.worldSize) * 1_000;
      const popup = `${endgame.playedAt.slice(0, 10)} · 최종 ${endgame.phase}페이즈 · 생존 ${endgame.alivePlayers}명`;
      L.circle(center, {
        color: "#55d6be",
        fillColor: "#55d6be",
        fillOpacity: 0.12,
        radius,
        weight: 2,
      }).bindPopup(popup).addTo(layer);

      for (const route of endgame.routes) {
        const coordinates = route.points.map((point) => [
          1_000 - (point.y / definition.worldSize) * 1_000,
          (point.x / definition.worldSize) * 1_000,
        ] as Leaflet.LatLngTuple);
        L.polyline(coordinates, { color: "#55d6be", opacity: 0.62, weight: 2 })
          .bindPopup(`${route.leaderboardRank}위 ${escapeHtml(route.playerName)} · 매치 ${route.placement}위`)
          .addTo(layer);
      }
    }
  }, [definition.worldSize, ready, routeAnalysis, showEndgames]);

  async function loadAnalysis() {
    if (routeAnalysis || routeStatus === "loading") return;
    setRouteStatus("loading");
    try {
      const response = await fetch(`/api/map-routes/${mapSlug}`);
      if (!response.ok) throw new Error(`ROUTES_${response.status}`);
      setRouteAnalysis(await response.json() as OpeningRouteAnalysis);
      setRouteStatus("idle");
    } catch {
      setRouteStatus("error");
    }
  }

  async function toggleRoutes() {
    const next = !showRoutes;
    setShowRoutes(next);
    if (next) await loadAnalysis();
  }

  async function toggleEndgames() {
    const next = !showEndgames;
    setShowEndgames(next);
    if (next) await loadAnalysis();
  }

  function toggle(category: MapCategoryId) {
    setActive((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function changeMode(nextMode: MapMode) {
    if (nextMode === "ranked" && !definition.ranked) return;
    setMode(nextMode);
    setActive(new Set());
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
          <div><span>MAP SELECT</span><h1>{definition.nameKo}</h1></div>
          <button aria-label="필터 닫기" onClick={() => setPanelOpen(false)} type="button">×</button>
        </div>

        <nav className="map-picker" aria-label="맵 선택">
          {mapSlugs.map((slug) => (
            <Link className={slug === mapSlug ? "active" : ""} href={`/maps/${slug}`} key={slug}>
              {mapCatalog[slug].nameKo}
            </Link>
          ))}
        </nav>

        <div className="map-mode-picker" aria-label="게임 모드">
          <button className={mode === "normal" ? "active" : ""} onClick={() => changeMode("normal")} type="button">
            일반전
          </button>
          <button
            className={mode === "ranked" ? "active" : ""}
            disabled={!definition.ranked}
            onClick={() => changeMode("ranked")}
            type="button"
          >
            경쟁전{definition.ranked ? "" : " 미지원"}
          </button>
        </div>

        <div className="map-route-control">
          <button
            aria-pressed={showRoutes}
            className={showRoutes ? "active" : ""}
            disabled={!definition.ranked || routeStatus === "loading"}
            onClick={toggleRoutes}
            type="button"
          >
            <span>상위 랭커 초반 루트</span>
            <b>{routeStatus === "loading" ? "분석 중" : routeAnalysis ? routeAnalysis.routes.length : "LIVE"}</b>
          </button>
          <button
            aria-pressed={showEndgames}
            className={showEndgames ? "active endgame" : ""}
            disabled={!definition.ranked || routeStatus === "loading"}
            onClick={toggleEndgames}
            type="button"
          >
            <span>최종 자기장 운영</span>
            <b>{routeStatus === "loading" ? "분석 중" : routeAnalysis ? routeAnalysis.endgames.length : "LIVE"}</b>
          </button>
          {routeStatus === "error" && <p>현재 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
          {showRoutes && routeAnalysis && (
            <p>경쟁전 스쿼드 FPP · 상위 {routeAnalysis.sampledPlayers}명 · 낙하 후 10분</p>
          )}
          {showEndgames && routeAnalysis && (
            <p>최근 {routeAnalysis.endgames.length}경기 · 3페이즈 이후 이동과 최종 안전구역</p>
          )}
        </div>

        <div className="map-filter-title">
          <span>카테고리 필터</span>
          <button onClick={() => setActive(new Set())} type="button">모두 해제</button>
        </div>
        <div className="map-filter-list">
          {mapCategories.map((category) => {
            const count = modePoints.filter((point) => point[0] === category.id).length;
            const selected = active.has(category.id);
            if (!count) return null;
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
          <strong>UPDATE {mapDataVersion.patch} · {mapDataVersion.verifiedAt}</strong>
          <p>차량·보트·글라이더는 게임 월드 좌표, 시설은 최신 공개 지도를 교차검증해 표시합니다. 실제 등장 여부는 매치 설정에 따라 달라질 수 있습니다.</p>
          <small>PUBG and all related logos are trademarks of KRAFTON, Inc.</small>
        </div>
      </aside>

      <div className="map-canvas-wrap">
        <div aria-label={`${definition.nameKo} 인터랙티브 지도`} className="map-canvas" ref={containerRef} />
        <div className="map-attribution">
          Map image · <a href={mapDataVersion.mapAssetsUrl} rel="noreferrer" target="_blank">PUBG API Assets</a>
          <span> · </span><a href={mapDataVersion.coordinateDocsUrl} rel="noreferrer" target="_blank">좌표 기준</a>
        </div>
      </div>
    </section>
  );
}
