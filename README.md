# Smart City WebService

스마트 시티 웹서비스 프로젝트입니다.

## 프로젝트 구조

```
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
├── routes/              # react-router 설정
├── services/            # API 호출 함수 모음
├── utils/               # 유틸 함수들
├── constants/           # 상수 (경로, 색상 등)
├── styles/              # 전역 스타일 또는 theme
├── App.jsx              # 메인 App 컴포넌트
└── index.js             # 엔트리포인트
```

## 주요 기능

-   메인 페이지
-   민원 관리
-   교통 정보
-   날씨 정보
-   커뮤니티
-   챗봇
