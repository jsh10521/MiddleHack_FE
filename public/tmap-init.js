// T맵 API 스크립트를 동적으로 로드하는 초기화 스크립트
(function () {
    // 환경 변수에서 API 키 가져오기 (React 앱에서 설정됨)
    const script = document.createElement('script');

    // 개발 환경에서는 process.env를 사용할 수 없으므로
    // 대신 데이터 속성이나 전역 변수를 사용
    const apiKey = window.REACT_APP_TMAP_API_KEY || '%REACT_APP_TMAP_API_KEY%';

    if (apiKey && apiKey !== '%REACT_APP_TMAP_API_KEY%') {
        script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${apiKey}`;
        script.async = false; // 순서 보장을 위해 async=false
        document.head.appendChild(script);

        console.log('T맵 스크립트 로드 시작...');

        script.onload = function () {
            console.log('T맵 스크립트 로드 완료');
            window.tmapReady = true;
        };

        script.onerror = function () {
            console.error('T맵 스크립트 로드 실패');
        };
    } else {
        console.error('T맵 API 키가 설정되지 않았습니다.');
    }
})();
