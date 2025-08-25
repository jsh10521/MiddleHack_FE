// T맵 스크립트 동적 로드 유틸리티 (개선된 버전)
export const loadTmapScript = () => {
    return new Promise((resolve, reject) => {
        // 이미 로드되어 있다면 즉시 resolve
        if (window.Tmapv2) {
            resolve(window.Tmapv2);
            return;
        }

        // 이미 스크립트 태그가 있다면 로드 완료를 기다림
        const existingScript = document.querySelector('script[src*="tmap/jsv2"]');
        if (existingScript) {
            // 이미 있는 스크립트의 로드를 기다리면서 Tmapv2 체크
            const checkTmapv2 = () => {
                if (window.Tmapv2) {
                    resolve(window.Tmapv2);
                } else {
                    setTimeout(checkTmapv2, 100);
                }
            };
            checkTmapv2();
            return;
        }

        const TMAP_APP_KEY = process.env.REACT_APP_TMAP_API_KEY;

        console.log('T맵 API 키 확인:', TMAP_APP_KEY ? '설정됨' : '설정되지 않음');
        
        if (!TMAP_APP_KEY || TMAP_APP_KEY === 'your_tmap_api_key_here') {
            const errorMsg = 'T맵 API 키가 설정되지 않았습니다. .env 파일에 REACT_APP_TMAP_API_KEY를 설정해주세요.';
            console.error(errorMsg);
            reject(new Error(errorMsg));
            return;
        }

        // 새로운 스크립트 태그 생성
        const script = document.createElement('script');
        script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${TMAP_APP_KEY}`;
        script.async = true;
        
        console.log('T맵 스크립트 로드 시작:', script.src);

        script.onload = () => {
            console.log('T맵 스크립트 onload 이벤트 발생');
            // 스크립트 로드 후 Tmapv2가 실제로 사용 가능할 때까지 기다림
            const waitForTmapv2 = () => {
                if (window.Tmapv2 && typeof window.Tmapv2.Map === 'function') {
                    console.log('T맵 라이브러리 완전히 로드됨');
                    resolve(window.Tmapv2);
                } else {
                    console.log('T맵 라이브러리 초기화 대기 중...');
                    setTimeout(waitForTmapv2, 100);
                }
            };
            waitForTmapv2();
        };

        script.onerror = (error) => {
            console.error('T맵 스크립트 로드 실패:', error);
            reject(new Error('T맵 스크립트 로드 실패'));
        };

        document.head.appendChild(script);

        // 타임아웃 설정 (15초)
        setTimeout(() => {
            reject(new Error('T맵 라이브러리 로드 타임아웃'));
        }, 15000);
    });
};

// T맵 초기화 대기
export const waitForTmap = (maxWaitTime = 10000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkTmap = () => {
            if (window.Tmapv2) {
                resolve(window.Tmapv2);
                return;
            }

            if (Date.now() - startTime > maxWaitTime) {
                reject(new Error('T맵 로드 타임아웃'));
                return;
            }

            setTimeout(checkTmap, 100);
        };

        checkTmap();
    });
};
