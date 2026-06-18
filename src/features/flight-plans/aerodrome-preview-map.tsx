import * as React from "react";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import { Text } from "@/components/ui/text";

type AerodromePreviewMapProps = {
  lat: number;
  lng: number;
  coordinatesLabel: string;
  height?: number;
};

function buildLeafletHtml(lat: number, lng: number, coordinatesLabel: string): string {
  const safeLabel = coordinatesLabel.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, " ");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
    .coord-overlay {
      position: absolute; left: 8px; right: 8px; bottom: 8px; z-index: 1000;
      background: rgba(255,255,255,0.92); border-radius: 10px; padding: 8px 10px;
      font: 600 11px/1.35 system-ui, -apple-system, sans-serif; color: #18181b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12); pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="coord-overlay" id="coords"></div>
  <script>
    const lat = ${lat}, lng = ${lng};
    document.getElementById('coords').textContent = '${safeLabel}';
    const map = L.map('map', { zoomControl: true, attributionControl: true }).setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    L.marker([lat, lng]).addTo(map);
  </script>
</body>
</html>`;
}

export function AerodromePreviewMap({
  lat,
  lng,
  coordinatesLabel,
  height = 200,
}: AerodromePreviewMapProps) {
  const html = React.useMemo(
    () => buildLeafletHtml(lat, lng, coordinatesLabel),
    [lat, lng, coordinatesLabel],
  );

  return (
    <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100" style={{ height }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={{ flex: 1, backgroundColor: "#e4e4e7" }}
        scrollEnabled={false}
        nestedScrollEnabled
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        {...(Platform.OS === "android" ? { mixedContentMode: "always" as const } : {})}
      />
      {Platform.OS === "web" ? (
        <View className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-xl bg-white/95 px-3 py-2">
          <Text className="text-xs font-semibold text-zinc-900">{coordinatesLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}
