import axios from 'axios';

// API의 기본 URL을 설정하면 나중에 관리하기 편합니다.
const API_BASE_URL = 'https://openddm.store';

export const locationService = async () => {
  // 더미 데이터 경로 대신 실제 API 주소를 사용합니다.
  const res = await axios.get(`${API_BASE_URL}/shelter/list/`);
  return res.data;
};