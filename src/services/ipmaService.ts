import { IPMA_ALERTS_URL } from "@/config/constants";

type IpmaAlertRaw = any;

export async function fetchIpmaAlerts(): Promise<{ id: string; title: string; description?: string; timestamp?: string; lat?: number; lng?: number; raw?: IpmaAlertRaw }[]> {
  try {
    const res = await fetch(IPMA_ALERTS_URL, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();

    // best-effort normalization: the IPMA open-data alerts endpoint varies.
    // If items include geometry (GeoJSON-like) or lat/lng fields, use them.
    const items: any[] = data?.data ?? data?.alerts ?? data?.features ?? data?.entries ?? [];

    const out = items
      .map((it, idx) => {
        // try common shapes
        let lat: number | undefined;
        let lng: number | undefined;

        if (it?.geometry?.type === "Point" && Array.isArray(it.geometry.coordinates)) {
          lng = Number(it.geometry.coordinates[0]);
          lat = Number(it.geometry.coordinates[1]);
        }

        if (!lat && !lng) {
          if (it.latitude || it.lat) lat = Number(it.latitude ?? it.lat);
          if (it.longitude || it.lon || it.lng) lng = Number(it.longitude ?? it.lon ?? it.lng);
        }

        const title = it.title ?? it.headline ?? it.area ?? it.description ?? `IPMA alert ${idx}`;

        return {
          id: it.id ?? it.alertId ?? `${Date.now()}_${idx}`,
          title,
          description: it.description ?? it.summary ?? undefined,
          timestamp: it.timestamp ?? it.date ?? it.pubDate ?? undefined,
          lat: Number.isFinite(lat) ? lat : undefined,
          lng: Number.isFinite(lng) ? lng : undefined,
          raw: it,
        };
      })
      .filter(Boolean);

    return out;
  } catch (err) {
    console.warn("fetchIpmaAlerts error", err);
    return [];
  }
}

export default { fetchIpmaAlerts };
