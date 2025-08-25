import React, { useEffect, useRef, useState, useCallback } from 'react';
import redmarker from '../../assets/marker-red.png';
import yellowmarker from '../../assets/marker-yellow.png';

const Tmap_traffic = ({ alerts }) => {
    const mapRef = useRef(null);
    const initialized = useRef(false);
    const polylineRef = useRef([]);
    const markerRef = useRef([]);
    const [trafficVisible, setTrafficVisible] = useState(true);
    const [autoUpdate, setAutoUpdate] = useState(true);

    // Polyline 생성/갱신 함수
    const fetchTraffic = useCallback(async () => {
        if (!mapRef.current) return;

        try {
            const TMAP_APP_KEY = process.env.REACT_APP_TMAP_API_KEY;

            const url = new URL('https://apis.openapi.sk.com/tmap/traffic');
            url.searchParams.append('version', '1');
            url.searchParams.append('reqCoordType', 'WGS84GEO');
            url.searchParams.append('resCoordType', 'WGS84GEO');
            url.searchParams.append('zoomLevel', mapRef.current.getZoom().toString());
            url.searchParams.append('trafficType', 'AUTO');
            url.searchParams.append('centerLon', '127.0595');
            url.searchParams.append('centerLat', '37.5979');
            url.searchParams.append('appKey', TMAP_APP_KEY);

            const res = await fetch(url.toString());
            const data = await res.json();

            const features = data.features || [];

            polylineRef.current.forEach((p) => p.setMap(null));
            polylineRef.current = [];

            if (!trafficVisible) return; // 교통 OFF면 그리지 않고 종료

            const bounds = new window.Tmapv2.LatLngBounds();

            features.forEach((feature) => {
                if (feature.geometry.type !== 'LineString') return;

                const path = feature.geometry.coordinates.map(([lon, lat]) => new window.Tmapv2.LatLng(lat, lon));
                path.forEach((p) => bounds.extend(p));

                const congestion = feature.properties.congestion || 0;
                let lineColor = '#61AB25';
                if (congestion === 2) lineColor = '#FFFF00';
                else if (congestion === 3) lineColor = '#E87506';
                else if (congestion === 4) lineColor = '#D61125';

                const polyline = new window.Tmapv2.Polyline({
                    path,
                    strokeColor: lineColor,
                    strokeWeight: 3,
                    map: mapRef.current,
                });

                polylineRef.current.push(polyline);
            });
        } catch (e) {
            console.error('교통 API 오류:', e);
        }
    }, [mapRef, trafficVisible]);

    // 알림에 따라 마크 추가
    const addAlertMarkers = useCallback(() => {
        if (!mapRef.current || !window.Tmapv2) return;

        // 기존 마커 제거
        markerRef.current.forEach((marker) => marker.setMap(null));
        markerRef.current = [];

        // 알림에 따라 마커 추가
        (alerts || []).forEach((alert) => {
            if (alert.coordinate && alert.coordinate.length === 2) {
                const [lon, lat] = alert.coordinate;
                const iconurl =
                    alert.isAccidentNode === 'Y' && (alert.accidentUpperCode === 'A' || alert.accidentUpperCode === 'D')
                        ? redmarker
                        : yellowmarker;

                const marker = new window.Tmapv2.Marker({
                    position: new window.Tmapv2.LatLng(lat, lon),
                    map: mapRef.current,
                    icon: iconurl,
                    // title: alert.name.split('/')[0],
                    title: alert.description.split('/')[0],
                });
                markerRef.current.push(marker);
            }
        });
    }, [mapRef, alerts]);

    useEffect(() => {
        if (mapRef.current) {
            addAlertMarkers();
        }
    }, [alerts, addAlertMarkers]);

    // 지도 초기화
    useEffect(() => {
        if (!window.Tmapv2 || initialized.current) return;

        const map = new window.Tmapv2.Map('mapDiv', {
            center: new window.Tmapv2.LatLng(37.5979, 127.0595),
            width: '100%',
            height: '100%',
            zoom: 15,
        });
        mapRef.current = map;
        initialized.current = true;

        new window.Tmapv2.Marker({
            position: new window.Tmapv2.LatLng(37.5979, 127.0595),
            map,
            title: '한국외국어대학교',
        });

        fetchTraffic();

        let interval;
        if (autoUpdate) interval = setInterval(fetchTraffic, 180000);

        return () => clearInterval(interval);
    }, [autoUpdate, fetchTraffic]);

    // trafficVisible 변경 시 새로 Polyline 그리기
    useEffect(() => {
        fetchTraffic();
    }, [fetchTraffic]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div id="mapDiv" style={{ width: '100%', height: '100%' }} />
            <div className="top-right-buttons">
                <button className="top-right-button" onClick={() => setTrafficVisible((prev) => !prev)}>
                    {trafficVisible ? '교통 OFF' : '교통 ON'}
                </button>
                <button className="top-right-button" onClick={() => setAutoUpdate((prev) => !prev)}>
                    {autoUpdate ? '자동 갱신 OFF' : '자동 갱신 ON'}
                </button>
            </div>
        </div>
    );
};

export default Tmap_traffic;
