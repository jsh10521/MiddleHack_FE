/*import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/WeatherCard.css';

const getWeatherImage = (condition) => {
    switch (condition) {
        case '맑음':
            return '/sunny.png';
        case '구름 많음':
        case '흐림':
            return '/cloudy.png';
        case '비':
        case '소나기':
            return '/rainy.png';
        case '눈':
            return '/snowy.png';
        default:
            return '/default.png';
    }
};

const WeatherCard = () => {
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = 'https://openddm.store';

    useEffect(() => {
        const fetchWeather = async (lat, lon) => {
            try {
                const token = localStorage.getItem('token'); // ✅ 로컬스토리지에서 토큰 꺼내오기
                if (!token) {
                    setError('로그인이 필요합니다.');
                    setLoading(false);
                    return;
                }

                const headers = {
                    Authorization: `Token ${token}`, 
                    // 👉 JWT라면: Authorization: `Bearer ${token}`
                };
                const response = await axios.get(`${API_BASE_URL}/weather/forecast/?lat=${lat}&lon=${lon}`, { headers });
                
                /*const [currentResponse, forecastResponse] = await Promise.all([
                    axios.get(`${API_BASE_URL}/weather/forecast/?lat=${lat}&lon=${lon}`, { headers }),
                    axios.get(`${API_BASE_URL}/weather/forecast/?lat=${lat}&lon=${lon}`, { headers }),
                ]);*/

                /*setCurrentWeather(response.data);
                setForecast(response.data);
                setError(null);
            } catch (err) {
                console.error('날씨 정보 호출 실패:', err);
                setError('날씨 정보를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    fetchWeather(lat, lon);
                },
                (err) => {
                    console.error('위치 정보 가져오기 실패:', err);
                    setError('위치 정보가 차단되어 날씨를 불러올 수 없습니다.');
                    setLoading(false);
                }
            );
        } else {
            setError('위치 정보를 지원하지 않는 브라우저입니다.');
            setLoading(false);
        }
    }, []);

    if (loading) {
        return <div className="weather-container">날씨 정보를 불러오는 중입니다...</div>;
    }

    if (error) {
        return <div className="weather-container error">{error}</div>;
    }

    if (!currentWeather || forecast.length === 0) {
      return <div className="weather-container">날씨 데이터를 표시할 수 없습니다.</div>;
  }

    const imageUrl = getWeatherImage(currentWeather.condition);

    return (
        <div className="weather-container">
            <div className="current-weather">
                <h3>📍 현재 날씨</h3>
                <div className="weather">
                    <img className="weatherpic" src={imageUrl} alt={currentWeather.condition} />
                    <div className="weatherinfo">
                        <p className="temp">{currentWeather.temperature}°C</p>
                        {/* API에 체감 온도 데이터가 없으므로 정적인 값을 사용 */
                        /*<p>{currentWeather.condition}</p>
                        <p>UV 지수: {currentWeather.uv_index}</p>
                        <p>위험 수준: {currentWeather.heat_alert ? '높음' : '보통'}</p>
                    </div>
                </div>
            </div>

            <div className="forecast">
                <h3>📅 7일간의 날씨 예보</h3>
                {forecast.map((day, index) => (
                    <div key={index} className="forecast-item">
                        <p><strong>{day.date}</strong></p>
                        <p>최고: {day.high}°C / 최저: {day.low}°C</p>
                        <p>상태: {day.condition}</p>
                        <p>강수량: {day.precipitation}mm</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherCard;*/

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/WeatherCard.css';

// 날씨 상태에 따른 이미지 반환 함수 (이전과 동일)
const getWeatherImage = (condition) => {
    switch (condition) {
        case '비':
        case '소나기':
            return '/rainy.png';
        case '강수 없음':
            return '/sunny.png'; // '강수 없음'을 '맑음'으로 간주
        // 필요에 따라 다른 케이스 추가
        default:
            return '/default.png';
    }
};

// ✅ FIX: 시간별 데이터를 일별 데이터로 가공하는 헬퍼 함수
const processDailyForecast = (hourlyData) => {
    if (!hourlyData || hourlyData.length === 0) return [];

    const dailyData = {};

    // 1. 시간별 데이터를 날짜별로 그룹화
    hourlyData.forEach(hour => {
        const date = hour.time_set.split('T')[0]; // '2025-08-24T00:00:00' -> '2025-08-24'
        if (!dailyData[date]) {
            dailyData[date] = {
                temps: [],
                conditions: [],
            };
        }
        dailyData[date].temps.push(parseFloat(hour.temperature));
        dailyData[date].conditions.push(hour.weather_condition);
    });

    // 2. 그룹화된 데이터로 최고/최저 기온 및 대표 날씨 계산
    return Object.keys(dailyData).map(date => {
        const day = dailyData[date];
        const high = Math.round(Math.max(...day.temps));
        const low = Math.round(Math.min(...day.temps));
        
        // 하루 중 '비'가 한 번이라도 있으면 대표 날씨를 '비'로 설정
        const condition = day.conditions.includes('비') ? '비' : day.conditions[0];

        return { date, high, low, condition };
    }).slice(0, 7); // 최대 7일치 예보만 보여주기
};


const WeatherCard = () => {
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = 'https://openddm.store';

    useEffect(() => {
        const fetchWeather = async (lat, lon) => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('로그인이 필요합니다.');
                    setLoading(false);
                    return;
                }
                const headers = { Authorization: `Token ${token}` };

                const response = await axios.get(`${API_BASE_URL}/weather/forecast/?lat=${lat}&lon=${lon}`, { headers });
                
                if (response.data && response.data.length > 0) {
                    // ✅ FIX: API 응답 배열의 첫번째 항목을 현재 날씨로 설정
                    setCurrentWeather(response.data[0]);
                    // ✅ FIX: 전체 배열을 일별 예보로 가공하여 설정
                    setForecast(processDailyForecast(response.data));
                } else {
                    throw new Error("날씨 데이터가 비어있습니다.");
                }

                setError(null);
            } catch (err) {
                console.error('날씨 정보 호출 실패:', err);
                setError('날씨 정보를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
                (err) => {
                    setError('위치 정보가 차단되어 날씨를 불러올 수 없습니다.');
                    setLoading(false);
                }
            );
        } else {
            setError('위치 정보를 지원하지 않는 브라우저입니다.');
            setLoading(false);
        }
    }, []);

    if (loading) return <div className="weather-container">날씨 정보를 불러오는 중입니다...</div>;
    if (error) return <div className="weather-container error">{error}</div>;
    if (!currentWeather) return <div className="weather-container">날씨 데이터를 표시할 수 없습니다.</div>;

    // ✅ FIX: API 응답에 맞는 키 사용 (weather_condition)
    const imageUrl = getWeatherImage(currentWeather.weather_condition);

    return (
        <div className="weather-container">
            <div className="current-weather">
                
                <div className="weather">
                    {/* ✅ FIX: API 응답에 맞는 키 사용 */}
                    <img className="weatherpic" src={imageUrl} alt={currentWeather.weather_condition} />
                    <div className="weatherinfo">
                        <p className="temp">{Math.round(currentWeather.temperature)}°C</p>
                        <p>날씨: {currentWeather.weather_condition}</p>
                        <p>습도: {currentWeather.humidity}%</p>
                        <p>풍속: {currentWeather.wind_speed}m/s</p>
                    </div>
                </div>
            </div>

            <div className="forecast">
                <h3>주간 날씨 예보</h3>
                {forecast.map((day) => (
                    <div key={day.date} className="forecast-item">
                        <p><strong>{day.date.substring(5)}</strong></p> {/* 날짜를 'MM-DD' 형식으로 표시 */}
                        <p>최고: {day.high}°C / 최저: {day.low}°C</p>
                        <p>상태: {day.condition}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherCard;
