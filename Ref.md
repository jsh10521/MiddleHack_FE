# Smart City WebService UI 협업 명세서

> 최종 수정일: 2025-08-06

## 📁 디렉토리 구조 (`/src`)

```plaintext
src/
├── assets/              # 이미지, 아이콘 등 정적 리소스
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── common/          # 공통 버튼, 카드, 모달 등
│   ├── map/             # 지도 관련 컴포넌트
│   ├── complaint/       # 민원 관련 UI
│   ├── traffic/         # 교통 데이터 관련 UI
│   ├── weather/         # 날씨 관련 UI
│   ├── chatbot/         # 챗봇 UI
│   └── community/       # 커뮤니티 UI
├── pages/               # 라우팅되는 페이지 컴포넌트
│   ├── MainPage.jsx
│   ├── ComplaintPage.jsx
│   ├── TrafficPage.jsx
│   ├── WeatherPage.jsx
│   ├── CommunityPage.jsx
│   └── ChatbotPage.jsx
├── routes/              # react-router 설정
│   └── AppRouter.jsx
├── services/            # API 호출 함수 모음
│   ├── trafficService.js
│   ├── weatherService.js
│   ├── complaintService.js
│   └── ...
├── utils/               # 유틸 함수들
├── constants/           # 상수 (경로, 색상 등)
├── styles/              # 전역 스타일 또는 theme
├── App.jsx              # 메인 App 컴포넌트
└── index.js             # 엔트리포인트

```
