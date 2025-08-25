import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TrafficPageStyles.css';
import Tmap_traffic from '../components/traffic/Tmap_traffic';

const TrafficPage = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]); // 교통혼잡도 top3
    const [prediction, setPrediction] = useState([]); // 예측 데이터
    const [alerts, setAlerts] = useState([]); // 실시간 알림

    // 좌표를 행정동으로 변환, 실패 시 기본값 사용
    const getAddressName = useCallback(async (lon, lat) => {
        const TMAP_APP_KEY = process.env.REACT_APP_TMAP_API_KEY;
        const url = `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${lat}&lon=${lon}&coordType=WGS84GEO`;

        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: { appKey: TMAP_APP_KEY },
            });
            const data = await res.json();
            return data.addressInfo?.legalDong || data.addressInfo?.roadName || '알 수 없는 지역';
        } catch (err) {
            console.error('주소 변환 에러:', err);
            return '알 수 없는 지역';
        }
    }, []);

    const getPosts = useCallback(async () => {
        try {
            const TMAP_APP_KEY = process.env.REACT_APP_TMAP_API_KEY;
            const tmapUrl = `https://apis.openapi.sk.com/tmap/traffic?version=1&reqCoordType=WGS84GEO&resCoordType=WGS84GEO&trafficType=AUTO&centerLon=127.0595&centerLat=37.5979&zoomLevel=15`;
            const tmapResponse = await fetch(tmapUrl, {
                method: 'GET',
                headers: { appKey: TMAP_APP_KEY },
            });

            if (!tmapResponse.ok) throw new Error(`HTTP error! status: ${tmapResponse.status}`);

            const tmapData = await tmapResponse.json();
            const features = tmapData.features || [];

            const usedRoads = new Set();
            const topPosts = [];

            // 반복하며 중복 도로 제거, top3 확보
            for (const feature of features
                .filter((f) => f.geometry.type === 'LineString' && f.properties.congestion)
                .sort((a, b) => b.properties.congestion - a.properties.congestion)) {
                if (topPosts.length >= 3) break;

                const props = feature.properties;
                const coords = feature.geometry.coordinates;
                const [lon, lat] = coords[0];

                let roadName = '도로명 정보 없음';
                if (props.name) roadName = props.name.split('/')[0];
                else if (props.routeNo) roadName = `도로 번호 ${props.routeNo}`;
                else if (props.linkId) roadName = `도로 ID ${props.linkId}`;

                if (usedRoads.has(roadName)) continue; // 이미 나온 도로는 건너뛰기

                const areaName = await getAddressName(lon, lat);

                const congestionLevel =
                    {
                        1: '원활',
                        2: '서행',
                        3: '지체',
                        4: '정체',
                    }[props.congestion] || '정보 없음';

                topPosts.push({
                    name: `${roadName} (${areaName}) - ${congestionLevel}`,
                });
                usedRoads.add(roadName);
            }

            setPosts(topPosts);

            // 실시간 알림 백엔드 호출
            const response = await fetch('https://openddm.store/traffic/traffic_current_info/');
            const data = await response.json();

            // 두 버전의 데이터 구조를 모두 지원
            const newAlerts = data
                .filter((post) => post.isAccidentNode === 'Y')
                .slice(-30)
                .reverse()
                .map((post) => ({
                    ...post,
                    // 기존 구조와 호환성 유지
                    type: 'Y',
                    message: post.description,
                    traffictype: post.accidentUpperCode || post.accidentUppercode,
                    coordinates: post.coordinates,
                }));
            setAlerts(newAlerts);

            // setPrediction(data.prediction || []);
        } catch (error) {
            console.log('에러: ', error);
        }
    }, [getAddressName]);

    const handleBack = () => navigate('/');

    useEffect(() => {
        getPosts();
        const interval = setInterval(getPosts, 300000); // 5분마다 업데이트
        return () => clearInterval(interval);
    }, [getPosts]);

    return (
        <div className="traffic-page-container">
            <header className="traffic-header">
                <div className="header-left">
                    <button className="back-btn" onClick={handleBack}>
                        ← 돌아가기
                    </button>
                    <h1 className="page-title">Seoul AI Traffic</h1>
                </div>
            </header>

            <div className="map-placeholder">
                <Tmap_traffic mapId="trafficmapDiv" alerts={alerts} />
            </div>

            <div className="sidebar">
                <h3>🚦 교통 혼잡도 안내</h3>
                <ul className="legend-list">
                    <li><span className="color-box red-box"></span> 정체</li>
                    <li><span className="color-box orange-box"></span> 지체</li>
                    <li><span className="color-box yellow-box"></span> 서행</li>
                    <li><span className="color-box green-box"></span> 원활</li>
                </ul>

                <h3>교통 혼잡도 TOP3</h3>
                <ul className="legend-list">
                    {posts.map((post, index) => (
                        <li key={index}>{`${index + 1}. ${post.name}`}</li>
                    ))}
                </ul>

                {/* 예측 데이터는 주석 처리 */}
                {/* <h3>예측 데이터</h3>
                <ul className="legend-list">
                    <p className="prediction-text">도로 혼잡 예상 구간: {prediction.join(', ')}</p>
                </ul> */}

                <h3>실시간 알림</h3>
                <ul className="legend-list">
                    {alerts.length > 0 ? (
                        alerts.map((alert, index) => (
                            <div
                                key={index}
                                className={
                                    alert.isAccidentNode === 'Y' &&
                                    (alert.accidentUpperCode === 'A' || alert.accidentUpperCode === 'D')
                                        ? 'alert-box-red'
                                        : 'alert-box-yellow'
                                }
                            >
                                {alert.isAccidentNode === 'Y' &&
                                (alert.accidentUpperCode === 'A' || alert.accidentUpperCode === 'D')
                                    ? '🚨 '
                                    : '🚧 '}
                                {alert.description ? alert.description.split('/')[0] : alert.message}
                            </div>
                        ))
                    ) : (
                        <div className="no-alerts-message">실시간 알림이 없습니다.</div>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default TrafficPage;
