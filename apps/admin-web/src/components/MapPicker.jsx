import { useEffect, useRef } from "react";
import L from "leaflet";
import { defaultMapView } from "../lib/constants.js";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function normalizeCenter(defaultCenter) {
  const latitude = Number(defaultCenter?.latitude);
  const longitude = Number(defaultCenter?.longitude);
  const zoom = Number(defaultCenter?.zoom);

  return {
    latitude: Number.isFinite(latitude) ? latitude : defaultMapView.latitude,
    longitude: Number.isFinite(longitude) ? longitude : defaultMapView.longitude,
    zoom: Number.isFinite(zoom) ? zoom : defaultMapView.zoom,
  };
}

export function MapPicker({ latitude, longitude, onPick, defaultCenter = defaultMapView }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const defaultCenterRef = useRef(normalizeCenter(defaultCenter));
  const selectedPointRef = useRef(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  function refreshMapSize() {
    if (!instanceRef.current) {
      return;
    }

    instanceRef.current.invalidateSize(false);
  }

  function centerToDefault(shouldRefresh = false) {
    if (!instanceRef.current) {
      return;
    }

    const center = defaultCenterRef.current;
    instanceRef.current.setView([center.latitude, center.longitude], center.zoom, { animate: false });
    if (shouldRefresh) {
      refreshMapSize();
    }
  }

  function updateMarker(lat, lng, source, shouldCenter = true) {
    if (!instanceRef.current) {
      return;
    }

    selectedPointRef.current = { lat, lng };

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(instanceRef.current);
      markerRef.current.on("dragend", (event) => {
        const nextPoint = event.target.getLatLng();
        onPickRef.current(nextPoint.lat.toFixed(6), nextPoint.lng.toFixed(6), "leaflet_drag");
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (shouldCenter) {
      instanceRef.current.setView([lat, lng], Math.max(instanceRef.current.getZoom(), 19), { animate: false });
    }

    if (source) {
      onPickRef.current(lat.toFixed(6), lng.toFixed(6), source);
    }
  }

  useEffect(() => {
    defaultCenterRef.current = normalizeCenter(defaultCenter);
  }, [defaultCenter]);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) {
      return;
    }

    const initialCenter = defaultCenterRef.current;
    const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 22,
      maxNativeZoom: 19,
      detectRetina: true,
      updateWhenZooming: false,
      updateWhenIdle: true,
      attribution: "&copy; OpenStreetMap contributors",
    });
    const satelliteLayer = L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 22,
      maxNativeZoom: 19,
      detectRetina: true,
      updateWhenZooming: false,
      updateWhenIdle: true,
      attribution: "Tiles &copy; Esri",
    });
    const map = L.map(mapRef.current, { zoomControl: true, trackResize: true, zoomAnimation: false, fadeAnimation: false, maxZoom: 22, layers: [satelliteLayer] }).setView([initialCenter.latitude, initialCenter.longitude], initialCenter.zoom);
    let satelliteLoaded = false;

    satelliteLayer.on("load", () => {
      satelliteLoaded = true;
    });

    satelliteLayer.on("tileerror", () => {
      window.setTimeout(() => {
        if (!satelliteLoaded && instanceRef.current === map && map.hasLayer(satelliteLayer)) {
          map.removeLayer(satelliteLayer);
          if (!map.hasLayer(streetLayer)) {
            streetLayer.addTo(map);
          }
        }
      }, 300);
    });

    L.control.layers(
      {
        Jalan: streetLayer,
        Satelit: satelliteLayer,
      },
      null,
      { position: "topright" },
    ).addTo(map);

    map.on("click", (event) => {
      updateMarker(event.latlng.lat, event.latlng.lng, "leaflet_click", false);
    });

    instanceRef.current = map;
    map.whenReady(() => {
      centerToDefault(true);
    });

    const rafId = window.requestAnimationFrame(() => {
      centerToDefault(true);
    });
    const timeoutIds = [80, 200, 360, 560].map((delay) =>
      window.setTimeout(() => {
        centerToDefault(true);
      }, delay),
    );

    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(() => {
        refreshMapSize();
      });
      resizeObserverRef.current.observe(mapRef.current);
    }

    const handleWindowResize = () => {
      refreshMapSize();
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.removeEventListener("resize", handleWindowResize);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      map.remove();
      instanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!instanceRef.current) {
      return;
    }

    refreshMapSize();

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      if (selectedPointRef.current) {
        updateMarker(selectedPointRef.current.lat, selectedPointRef.current.lng, null, false);
        return;
      }

      if (markerRef.current) {
        instanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      centerToDefault();
      return;
    }

    updateMarker(lat, lng, null, true);
  }, [latitude, longitude]);

  useEffect(() => {
    if (!instanceRef.current) {
      return;
    }

    const hasPoint = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));

    if (!hasPoint && !selectedPointRef.current) {
      centerToDefault(true);
    }
  }, [defaultCenter, latitude, longitude]);

  return <div ref={mapRef} style={{ height: "18rem", minHeight: "18rem", width: "100%" }} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-inner" />;
}
