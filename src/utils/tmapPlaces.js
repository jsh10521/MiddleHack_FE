import { loadTmapScript } from './tmapLoader';

const TMAP_APP_KEY = process.env.REACT_APP_TMAP_API_KEY;

export async function searchPlacesWithTmap(keyword, location) {
    await loadTmapScript();

    if (!window.Tmapv2) return [];

    return new Promise((resolve) => {
        try {
            const headers = { appKey: TMAP_APP_KEY };
            const baseUrl = 'https://apis.openapi.sk.com/tmap/pois';
            const params = new URLSearchParams({
                version: '1',
                searchKeyword: keyword,
                resCoordType: 'WGS84GEO',
                reqCoordType: 'WGS84GEO',
                count: '5',
            });

            if (location && location.latitude && location.longitude) {
                params.set('centerLat', String(location.latitude));
                params.set('centerLon', String(location.longitude));
                params.set('radius', '5000');
            }

            fetch(`${baseUrl}?${params.toString()}`, { headers })
                .then((r) => r.json())
                .then((data) => {
                    const list = (data?.searchPoiInfo?.pois?.poi || []).map((poi) => ({
                        name: poi?.name,
                        address: [
                            poi?.upperAddrName,
                            poi?.middleAddrName,
                            poi?.lowerAddrName,
                            poi?.roadName,
                            poi?.buildingNo,
                        ]
                            .filter(Boolean)
                            .join(' '),
                        category: poi?.category || poi?.categoryName,
                        lat: Number(poi?.noorLat || poi?.frontLat),
                        lon: Number(poi?.noorLon || poi?.frontLon),
                    }));
                    resolve(list);
                })
                .catch(() => resolve([]));
        } catch (_) {
            resolve([]);
        }
    });
}







