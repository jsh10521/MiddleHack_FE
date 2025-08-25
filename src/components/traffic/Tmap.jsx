import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import redmarker from '../../assets/marker-red.png';
import yellowmarker from '../../assets/marker-yellow.png';

const Tmap = ({
    popularPosts = [],
    currentLocation = { latitude: null, longitude: null, loading: true, error: null },
    alerts = [],
    onRefreshLocation,
    mapId = 'mapDiv', // 고유한 맵 ID를 prop으로 받기
}) => {
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const initialized = useRef(false);
    const polylineRef = useRef([]);
    const markersRef = useRef([]);
    const currentLocationMarkerRef = useRef(null);
    const alertMarkersRef = useRef([]);
    const [trafficVisible, setTrafficVisible] = useState(true);
    const [autoUpdate, setAutoUpdate] = useState(true);

    // 불꽃 마커 SVG(Data URI) - 외부 네트워크 상태와 상관없이 항상 표시되도록 데이터 URI 사용
    const fireIconDataUri =
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(
            `\
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                <path fill="#ff6b00" d="M13.5 1.6c.2.4.4.9.5 1.4c.3 1.3.1 2.9-.7 4.2c-.8 1.4-2.2 2.5-3.9 3.1c.2-1.5-.1-3.1-1.1-4.6c-.3-.4-.6-.8-.9-1.1C5 2.9 3.7 2 2.9 1.6c-.1 1.9.4 3.9 1.6 5.6c1.3 1.8 3.3 3.2 5.7 3.9c-.9.3-1.8.8-2.6 1.6c-1.2 1.1-2.1 2.9-2.1 4.7c0 3.1 2.5 5.6 6.5 5.6s6.5-2.5 6.5-5.6c0-2.2-1-4.3-2.3-6.2c-.9-1.2-1.9-2.3-2.8-3.4c-.7-.8-1.3-1.5-1.8-2.2c-.5-.8-.8-1.6-.9-2.4c0-.5 0-1 .1-1.4z"/>
            </svg>
        `
        );

    // Polyline 생성/갱신 함수
    const fetchTraffic = useCallback(async () => {
        if (!mapRef.current) return;

        try {
            const TMAP_APP_KEY = process.env.REACT_APP_TMAP_API_KEY;

            if (!TMAP_APP_KEY || TMAP_APP_KEY === 'your_tmap_api_key_here') {
                console.warn('T맵 API 키가 설정되지 않았습니다.');
                return;
            }

            // URLSearchParams를 사용해 쿼리 파라미터 구성
            const url = new URL('https://apis.openapi.sk.com/tmap/traffic');
            url.searchParams.append('version', '1');
            url.searchParams.append('reqCoordType', 'WGS84GEO');
            url.searchParams.append('resCoordType', 'WGS84GEO');
            url.searchParams.append('zoomLevel', mapRef.current.getZoom().toString());
            url.searchParams.append('trafficType', 'AUTO');
            url.searchParams.append('centerLon', '127.0595');
            url.searchParams.append('centerLat', '37.5979');
            url.searchParams.append('appKey', TMAP_APP_KEY);

            const res = await fetch(url.toString(), {
                timeout: 10000, // 10초 타임아웃
            });

            if (!res.ok) {
                throw new Error(`T맵 API 오류: ${res.status} ${res.statusText}`);
            }

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
                let lineColor = '#61AB25'; // 원활
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

    // 알림에 따라 마커 추가
    const addAlertMarkers = useCallback(() => {
        if (!mapRef.current || !window.Tmapv2) return;

        // 기존 알림 마커 제거
        alertMarkersRef.current.forEach((marker) => marker.setMap(null));
        alertMarkersRef.current = [];

        // 알림에 따라 마커 추가
        (alerts || []).forEach((alert) => {
            const coords = alert.coordinate || alert.coordinates;
            if (coords && coords.length === 2) {
                const [lon, lat] = coords;
                const iconurl =
                    alert.isAccidentNode === 'Y' && (alert.accidentUpperCode === 'A' || alert.accidentUpperCode === 'D')
                        ? redmarker
                        : yellowmarker;
                const marker = new window.Tmapv2.Marker({
                    position: new window.Tmapv2.LatLng(lat, lon),
                    map: mapRef.current,
                    icon: iconurl,
                    title: alert.description ? alert.description.split('/')[0] : alert.message || alert.name,
                });
                alertMarkersRef.current.push(marker);
            }
        });
    }, [alerts]);

    // 인기게시물 마커 생성/갱신 함수
    const updatePopularPostMarkers = useCallback(() => {
        console.log('updatePopularPostMarkers 호출:', {
            mapRef: !!mapRef.current,
            popularPostsCount: popularPosts.length,
            popularPosts,
        });

        if (!mapRef.current) {
            console.log('지도 참조 없음, 마커 업데이트 중단');
            return;
        }

        // 기존 마커들 제거
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        console.log('기존 인기게시물 마커들 제거 완료');

        // 새로운 마커들 추가
        popularPosts.forEach((post, index) => {
            console.log(`인기게시물 ${index + 1} 처리:`, post);
            if (post.latitude && post.longitude) {
                console.log(`마커 생성 중: ${post.title} at (${post.latitude}, ${post.longitude})`);

                const marker = new window.Tmapv2.Marker({
                    position: new window.Tmapv2.LatLng(post.latitude, post.longitude),
                    map: mapRef.current,
                    title: `🔥 인기 #${index + 1}: ${post.title}`,
                    icon: {
                        url: fireIconDataUri,
                        size: new window.Tmapv2.Size(32, 32),
                        anchor: new window.Tmapv2.Point(16, 32),
                    },
                    visible: true,
                    zIndex: 1000,
                });

                // 마커 클릭 시 정보창 표시
                const infoWindow = new window.Tmapv2.InfoWindow({
                    position: new window.Tmapv2.LatLng(post.latitude, post.longitude),
                    content: `
                        <div style="padding: 12px; min-width: 220px; font-family: 'Segoe UI', sans-serif;">
                            <h4 style="margin: 0 0 8px 0; color: #ff6b6b; font-size: 14px;">🔥 인기 게시물 #${
                                index + 1
                            }</h4>
                            <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; line-height: 1.3;">${
                                post.title
                            }</p>
                            <p style="margin: 0 0 6px 0; font-size: 11px; color: #666;">${post.category} | ${
                        post.author
                    }</p>
                            <p style="margin: 0 0 6px 0; font-size: 11px;">📍 ${post.location || '위치 정보 없음'}</p>
                            <p style="margin: 0 0 10px 0; font-size: 11px;">👍 ${post.likes} | 💬 ${post.comments} | ${
                        post.time
                    }</p>
                            <button 
                                onclick="window.dispatchEvent(new CustomEvent('navigateToPost', { detail: { postId: ${
                                    post.id
                                } } }))"
                                style="
                                    width: 100%; 
                                    padding: 6px 12px; 
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                    color: white; 
                                    border: none; 
                                    border-radius: 6px; 
                                    font-size: 12px; 
                                    font-weight: 500; 
                                    cursor: pointer;
                                    transition: opacity 0.2s ease;
                                "
                                onmouseover="this.style.opacity='0.8'"
                                onmouseout="this.style.opacity='1'"
                            >
                                📄 게시물 상세보기
                            </button>
                        </div>
                    `,
                    type: 2,
                    map: null, // 초기에는 숨김
                });

                marker.addListener('click', () => {
                    infoWindow.setMap(mapRef.current);
                });

                // 지도 클릭 시 정보창 닫기
                mapRef.current.addListener('click', () => {
                    infoWindow.setMap(null);
                });

                markersRef.current.push(marker);
                console.log(`마커 생성 완료: ${post.title}`, marker);
            } else {
                console.log(`마커 생성 실패 - 좌표 없음: ${post.title}`, {
                    latitude: post.latitude,
                    longitude: post.longitude,
                });
            }
        });

        console.log(`총 ${markersRef.current.length}개의 인기게시물 마커 생성됨`);
        // 첫 인기 게시물 위치로 카메라 이동하여 사용자에게 명확히 보이도록 처리
        if (markersRef.current.length > 0 && mapRef.current) {
            const first = popularPosts[0];
            const center = new window.Tmapv2.LatLng(first.latitude, first.longitude);
            mapRef.current.setZoom(16);
            mapRef.current.panTo(center);
        }
    }, [popularPosts]);

    // 현재 위치 마커 업데이트
    const updateCurrentLocationMarker = useCallback(() => {
        console.log('updateCurrentLocationMarker 호출:', {
            mapRef: !!mapRef.current,
            currentLocation,
        });

        if (!mapRef.current || !window.Tmapv2) {
            console.log('지도 또는 Tmapv2 라이브러리 없음');
            return;
        }

        // 기존 현재 위치 마커 제거
        if (currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.setMap(null);
            console.log('기존 마커 제거됨');
        }

        // currentLocation이 null이거나 undefined인 경우 처리
        if (!currentLocation) {
            console.log('currentLocation이 null/undefined, 기본 위치 사용');
            const markerPosition = new window.Tmapv2.LatLng(37.5979, 127.0595);
            const marker = new window.Tmapv2.Marker({
                position: markerPosition,
                map: mapRef.current,
                title: '기본 위치 (한국외국어대학교)',
            });
            currentLocationMarkerRef.current = marker;
            return;
        }

        // 위치 정보가 로딩 중이거나 없으면 기본 위치 마커 표시
        let markerPosition, markerTitle, markerIcon;

        if (currentLocation.loading) {
            // 로딩 중이면 아직 마커 표시하지 않음
            console.log('위치 정보 로딩 중, 마커 표시 대기');
            return;
        } else if (currentLocation.error || !currentLocation.latitude || !currentLocation.longitude) {
            // 에러가 있거나 위치 정보가 없으면 기본 위치 사용
            markerPosition = new window.Tmapv2.LatLng(37.5979, 127.0595); // 한국외국어대학교
            markerTitle = `위치 정보 없음 (기본 위치: 한국외국어대학교)${
                currentLocation.error ? ` - ${currentLocation.error}` : ''
            }`;
            markerIcon = {
                url:
                    'data:image/svg+xml;charset=UTF-8,' +
                    encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#dc3545">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                `),
                size: new window.Tmapv2.Size(24, 24),
                anchor: new window.Tmapv2.Point(12, 24),
            };
        } else {
            // 정상적으로 위치 정보를 받아온 경우
            markerPosition = new window.Tmapv2.LatLng(currentLocation.latitude, currentLocation.longitude);
            markerTitle = '현재 위치';
            markerIcon = {
                url:
                    'data:image/svg+xml;charset=UTF-8,' +
                    encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4285F4">
                        <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="#ffffff" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" fill="#ffffff"/>
                    </svg>
                `),
                size: new window.Tmapv2.Size(24, 24),
                anchor: new window.Tmapv2.Point(12, 12),
            };
        }

        console.log('마커 생성 중:', { markerTitle, position: markerPosition });

        // 새로운 현재 위치 마커 추가
        const marker = new window.Tmapv2.Marker({
            position: markerPosition,
            map: mapRef.current,
            title: markerTitle,
            icon: markerIcon,
        });

        currentLocationMarkerRef.current = marker;
        console.log('새 마커 생성 완료:', marker);

        // 현재 위치를 받아온 경우에만 지도 중심을 이동
        if (!currentLocation.error && currentLocation.latitude && currentLocation.longitude) {
            mapRef.current.panTo(markerPosition);
            console.log('지도 중심을 현재 위치로 이동');
        }
    }, [currentLocation]);

    // 지도 초기화
    useEffect(() => {
        const initializeMap = () => {
            if (initialized.current) {
                console.log('지도가 이미 초기화됨, 중복 초기화 방지');
                return;
            }

            // T맵 라이브러리가 로드될 때까지 기다림
            if (!window.Tmapv2) {
                console.log('T맵 라이브러리 대기 중...');
                setTimeout(initializeMap, 100);
                return;
            }

            try {
                console.log(`T맵 라이브러리 발견, 지도 초기화 시작... (맵 ID: ${mapId})`);

                // 추가 안전 체크
                if (!window.Tmapv2.Map || !window.Tmapv2.LatLng) {
                    throw new Error('T맵 라이브러리 클래스가 완전히 로드되지 않음');
                }

                // React StrictMode 등으로 인해 재마운트될 때 이전 지도 DOM이 남아 중복 표시되는 것을 방지
                const container = document.getElementById(mapId);
                if (!container) {
                    throw new Error(`지도 컨테이너를 찾을 수 없습니다: ${mapId}`);
                }

                console.log(`지도 컨테이너 발견: ${mapId}`, container);

                if (container) {
                    // 남아있는 기존 자식 노드 제거
                    while (container.firstChild) container.removeChild(container.firstChild);
                }

                // 기본 중심 위치 (한국외국어대학교)
                const initialCenter = new window.Tmapv2.LatLng(37.5979, 127.0595);

                const map = new window.Tmapv2.Map(mapId, {
                    center: initialCenter,
                    width: '100%',
                    height: '100%',
                    zoom: 14,
                });

                mapRef.current = map;
                initialized.current = true;

                console.log('지도 생성 완료:', map);

                // 지도 로드 완료 후 마커들 추가
                setTimeout(() => {
                    if (mapRef.current) {
                        fetchTraffic();
                        updatePopularPostMarkers();
                        updateCurrentLocationMarker();
                        addAlertMarkers();
                    }
                }, 1000); // 1초로 증가
            } catch (error) {
                console.error('지도 초기화 실패:', error);
                // 재시도 로직
                setTimeout(() => {
                    initialized.current = false;
                    initializeMap();
                }, 3000);
            }
        };

        initializeMap();

        // 언마운트 시 지도 및 오버레이 정리 (StrictMode에서 중복 생성 방지)
        return () => {
            try {
                // 폴리라인/마커 해제
                polylineRef.current.forEach((p) => p.setMap(null));
                polylineRef.current = [];
                markersRef.current.forEach((m) => m.setMap(null));
                markersRef.current = [];
                alertMarkersRef.current.forEach((m) => m.setMap(null));
                alertMarkersRef.current = [];
                if (currentLocationMarkerRef.current) {
                    currentLocationMarkerRef.current.setMap(null);
                    currentLocationMarkerRef.current = null;
                }
                // 컨테이너 비우기
                const container = document.getElementById(mapId);
                if (container) container.innerHTML = '';
            } finally {
                mapRef.current = null;
                initialized.current = false;
            }
        };
    }, []); // 컴포넌트 마운트 시 한 번만 실행

    // 자동 업데이트 interval 관리
    useEffect(() => {
        let interval;
        if (autoUpdate && mapRef.current) {
            interval = setInterval(() => {
                if (mapRef.current) {
                    fetchTraffic();
                }
            }, 180000); // 3분마다 업데이트
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoUpdate, fetchTraffic]);

    // currentLocation이 변경될 때마다 현재 위치 마커 업데이트
    useEffect(() => {
        if (mapRef.current && window.Tmapv2) {
            updateCurrentLocationMarker();
        }
    }, [currentLocation, updateCurrentLocationMarker]);

    // popularPosts가 변경될 때마다 마커 업데이트
    useEffect(() => {
        if (mapRef.current && window.Tmapv2) {
            updatePopularPostMarkers();
        }
    }, [popularPosts, updatePopularPostMarkers]);

    // alerts가 변경될 때마다 알림 마커 업데이트
    useEffect(() => {
        if (mapRef.current && window.Tmapv2) {
            addAlertMarkers();
        }
    }, [alerts, addAlertMarkers]);

    // 게시물 상세페이지 이동 이벤트 리스너
    useEffect(() => {
        const handleNavigateToPost = (event) => {
            const { postId } = event.detail;
            navigate(`/community/${postId}`);
        };

        window.addEventListener('navigateToPost', handleNavigateToPost);

        return () => {
            window.removeEventListener('navigateToPost', handleNavigateToPost);
        };
    }, [navigate]);

    // trafficVisible 변경 시 새로 Polyline 그리기
    useEffect(() => {
        if (mapRef.current && window.Tmapv2) {
            fetchTraffic();
        }
    }, [trafficVisible, fetchTraffic]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div id={mapId} style={{ width: '100%', height: '100%' }} />
            <div className="top-right-buttons">
                <button className="top-right-button" onClick={() => setTrafficVisible((prev) => !prev)}>
                    {trafficVisible ? '교통 OFF' : '교통 ON'}
                </button>
                <button className="top-right-button" onClick={() => setAutoUpdate((prev) => !prev)}>
                    {autoUpdate ? '자동 갱신 OFF' : '자동 갱신 ON'}
                </button>
                {onRefreshLocation && (
                    <button
                        className="top-right-button"
                        onClick={onRefreshLocation}
                        disabled={currentLocation?.loading}
                        title="현재 위치 새로고침"
                    >
                        📍 {currentLocation?.loading ? '위치 찾는 중...' : '위치 새로고침'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Tmap;
