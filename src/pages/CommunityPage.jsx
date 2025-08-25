import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/auth/LoginModal';
import RegisterModal from '../components/auth/RegisterModal';
import { communityService } from '../services/communityService';
import '../styles/CommunityPage.css';

function CommunityPage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [popularPosts, setPopularPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        category: '교통',
        location: '',
        locationType: 'current', // 'current' or 'search'
        latitude: null,
        longitude: null,
        image: null, // 이미지 파일
        imagePreview: null, // 이미지 미리보기 URL
    });

    // 장소 검색 관련 상태
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const [showPostForm, setShowPostForm] = useState(false);
    const [sortBy, setSortBy] = useState('latest'); // 'latest' or 'likes'
    const [activeCategory, setActiveCategory] = useState('전체');

    // 인증 관련 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // 컴포넌트 마운트시 로그인 상태 확인 및 게시물 로드
    useEffect(() => {
        // 매번 새로 가져오기
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');

        // 즉시 상태 설정 (조건 없이)
        if (token && username) {
            setIsAuthenticated(true);
            setCurrentUser({ username, token });
        }

        console.log('🔍 CommunityPage 마운트 - 인증 상태 확인:');
        console.log('   - localStorage token:', token ? 'Present' : 'Missing');
        console.log('   - localStorage username:', username);
        console.log('   - Token value:', token);
        console.log('   - Token type:', typeof token);
        console.log('   - Token length:', token ? token.length : 0);

        // localStorage 전체 내용 확인 (더 상세히)
        console.log('📋 localStorage 전체 내용:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`   [${i}] ${key}: "${value}" (${typeof value}, length: ${value ? value.length : 0})`);
        }

        // 직접적으로 다시 한번 확인
        const directToken = localStorage.getItem('token');
        const directUsername = localStorage.getItem('username');
        console.log('🔄 직접 재확인:');
        console.log('   - directToken:', directToken);
        console.log('   - directUsername:', directUsername);

        if (token && username && token !== 'undefined' && token !== 'null') {
            console.log('✅ 로그인 상태 복원 성공');
            setIsAuthenticated(true);
            setCurrentUser({ username, token });
        } else {
            console.log('❌ 로그인 상태 없음 - localStorage 정리');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            setIsAuthenticated(false);
            setCurrentUser(null);
        }

        // 게시물 목록 로드
        loadPosts();
        // 인기 게시물 로드
        loadPopularPosts();

        // 카카오맵 SDK 미리 로드
        if (!window.kakao) {
            console.log('🗺️ 카카오맵 SDK 미리 로드 시작');
            loadKakaoSDKAndSearch();
        }
    }, []);

    // 페이지 포커스시 로그인 상태 재확인 (다른 탭에서 로그인한 경우)
    useEffect(() => {
        const handlePageFocus = () => {
            console.log('👁️ 커뮤니티페이지 포커스 - 로그인 상태 재확인');
            const token = localStorage.getItem('token');
            const username = localStorage.getItem('username');

            console.log('   - 현재 token:', token);
            console.log('   - 현재 username:', username);

            if (token && username && token !== 'undefined' && token !== 'null') {
                console.log('✅ 로그인 상태 발견 - 동기화');
                setIsAuthenticated(true);
                setCurrentUser({ username, token });
            } else {
                console.log('❌ 로그인 상태 없음');
                setIsAuthenticated(false);
                setCurrentUser(null);
            }
        };

        // 페이지 방문시마다 체크
        const handlePageVisibilityChange = () => {
            if (!document.hidden) {
                handlePageFocus();
            }
        };

        window.addEventListener('focus', handlePageFocus);
        document.addEventListener('visibilitychange', handlePageVisibilityChange);

        return () => {
            window.removeEventListener('focus', handlePageFocus);
            document.removeEventListener('visibilitychange', handlePageVisibilityChange);
        };
    }, []);

    // localStorage 변화 감지 (다른 탭에서 로그인/로그아웃시)
    useEffect(() => {
        const handleStorageChange = (e) => {
            console.log('🔄 localStorage 변화 감지:', e.key, e.newValue);

            if (e.key === 'token' || e.key === 'username') {
                const token = localStorage.getItem('token');
                const username = localStorage.getItem('username');

                console.log('🔍 storage 이벤트 후 localStorage 상태:');
                console.log('   - token:', token);
                console.log('   - username:', username);

                if (token && username && token !== 'undefined' && token !== 'null') {
                    console.log('✅ 다른 탭에서 로그인됨 - 상태 동기화');
                    setIsAuthenticated(true);
                    setCurrentUser({ username, token });
                } else {
                    console.log('❌ 다른 탭에서 로그아웃됨 - 상태 동기화');
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                }
            }
        };

        // 커뮤니티페이지에서 storage 이벤트 리스너 등록
        console.log('📡 커뮤니티페이지 storage 이벤트 리스너 등록');
        window.addEventListener('storage', handleStorageChange);

        return () => {
            console.log('📡 커뮤니티페이지 storage 이벤트 리스너 해제');
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // 정렬이나 카테고리가 변경될 때 게시물 다시 로드
    useEffect(() => {
        loadPosts();
    }, [sortBy, activeCategory]);

    // 게시물 목록 로드 함수
    const loadPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = 'https://openddm.store';
            const orderBy = sortBy === 'latest' ? 'created_at' : 'likes'; // API 명세에 맞는 정렬 파라미터
            const categoryParam = activeCategory === '전체' ? '' : `/${getCategoryAPIValue(activeCategory)}`;

            const token = localStorage.getItem('token');
            console.log('Load Posts - Token:', token ? 'Present' : 'Missing');
            console.log('Load Posts - CurrentUser:', currentUser);

            const response = await fetch(`${baseUrl}/community/list/${orderBy}${categoryParam}/`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Token ${token}` }),
                },
            });

            if (response.ok) {
                const data = await response.json();
                // API 응답 데이터를 UI 형태로 변환
                const transformedPosts = data.map((post) => ({
                    id: post.post_id,
                    title: post.title,
                    content: post.content,
                    author: post.author,
                    time: formatTime(post.created_at),
                    likes: post.likes,
                    comments: post.comments?.length || 0,
                    category: getCategoryUIValue(post.category),
                    location: post.location,
                    latitude: post.latitude,
                    longitude: post.longitude,
                    image_url: post.image_url, // S3 이미지 URL
                }));
                setPosts(transformedPosts);
            } else {
                throw new Error('게시물 로드 실패');
            }
        } catch (error) {
            console.error('게시물 로드 실패:', error);
            setError('게시물을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 인기 게시물 로드 함수
    const loadPopularPosts = async () => {
        try {
            const data = await communityService.getPopularPosts();
            // API 응답 데이터를 UI 형태로 변환하고 상위 2개만 가져오기
            const transformedPosts = data.slice(0, 2).map((post) => ({
                id: post.post_id,
                title: post.title,
                content: post.content,
                author: post.author,
                time: formatTime(post.created_at),
                likes: post.likes,
                comments: post.comments?.length || 0,
                category: getCategoryUIValue(post.category),
                location: post.location,
                image_url: post.image_url,
            }));
            setPopularPosts(transformedPosts);
        } catch (error) {
            console.error('인기 게시물 로드 실패:', error);
            // 실패시 빈 배열로 설정
            setPopularPosts([]);
        }
    };

    // 카테고리 UI값을 API값으로 변환
    const getCategoryAPIValue = (uiCategory) => {
        const map = { 교통: 'general', 민원: 'emergency', 지역정보: 'notice' };
        return map[uiCategory] || 'general';
    };

    // 카테고리 API값을 UI값으로 변환
    const getCategoryUIValue = (apiCategory) => {
        const map = { general: '교통', emergency: '민원', notice: '지역정보' };
        return map[apiCategory] || '교통';
    };

    // 좋아요 토글 함수
    const handleLikeToggle = async (postId) => {
        if (!isAuthenticated) {
            alert('로그인이 필요합니다.');
            setShowLoginModal(true);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            console.log('Like Toggle - Token:', token ? 'Present' : 'Missing');

            await communityService.toggleLike(postId, token);
            // 좋아요 처리 후 게시물 목록 새로고침
            await loadPosts();
        } catch (error) {
            console.error('좋아요 처리 실패:', error);
            alert('좋아요 처리에 실패했습니다.');
        }
    };

    // 시간 포맷팅 함수
    const formatTime = (dateString) => {
        const now = new Date();
        const postTime = new Date(dateString);
        const diffMs = now - postTime;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
        return `${Math.floor(diffMins / 1440)}일 전`;
    };
    const handleBack = () => {
        navigate('/');
    };

    // 게시물 상세페이지로 이동
    const handlePostClick = (postId) => {
        navigate(`/community/${postId}`);
    };

    // 인증 관련 핸들러
    const handleNewPostClick = () => {
        // 실시간으로 localStorage 재확인
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');

        console.log('🆕 New Post Click - 상세 인증 체크:');
        console.log('   ==========================================');
        console.log('   📊 React State:');
        console.log('     - isAuthenticated:', isAuthenticated);
        console.log('     - currentUser:', currentUser);
        console.log('   💾 localStorage:');
        console.log('     - token exists:', !!token);
        console.log('     - token value:', token);
        console.log('     - token type:', typeof token);
        console.log('     - token length:', token ? token.length : 0);
        console.log('     - username:', username);
        console.log('   🔍 검증:');
        console.log('     - token valid:', token && token !== 'undefined' && token !== 'null');
        console.log('     - final auth check:', isAuthenticated && token && token !== 'undefined' && token !== 'null');
        console.log('   ==========================================');

        // 토큰이 있으면 상태도 동기화
        if (token && username && token !== 'undefined' && token !== 'null') {
            if (!isAuthenticated) {
                console.log('🔄 토큰 발견! React 상태 동기화 중...');
                setIsAuthenticated(true);
                setCurrentUser({ username, token });
            }
            console.log('✅ 인증 성공 - 글쓰기 폼 열기');
            setShowPostForm(true);
        } else {
            console.log('❌ 로그인 필요 - 메인페이지로 이동');
            alert('로그인이 필요합니다. 메인페이지에서 로그인해주세요.');
            window.location.href = '/';
        }
    };

    const handleLoginSuccess = (userData) => {
        setIsAuthenticated(true);
        setCurrentUser(userData);
        setShowLoginModal(false);
        setShowPostForm(true); // 로그인 성공 후 바로 글쓰기 폼 열기
    };

    const handleRegisterSuccess = () => {
        // 회원가입 성공 후 로직 (필요시 추가)
    };

    const handleLogout = () => {
        console.log('Logging out - clearing all auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setShowPostForm(false);

        // 페이지 새로고침으로 완전히 초기화
        window.location.reload();
    };

    const handleSwitchToLogin = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    const handleSwitchToRegister = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const handleLocationTypeChange = (type) => {
        if (type === 'current') {
            setNewPost({
                ...newPost,
                locationType: type,
                location: '현재 위치',
                latitude: 37.5665,
                longitude: 126.978,
            });
        } else {
            setNewPost({
                ...newPost,
                locationType: type,
                location: '',
                latitude: null,
                longitude: null,
            });
        }
        setSearchResults([]);
        setShowSearchResults(false);
    };

    // 실제 카카오맵 장소 검색 함수
    const searchKakaoPlaces = (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        if (!window.kakao?.maps?.services?.Places) {
            console.error('카카오맵 서비스가 로드되지 않았습니다 - SDK를 다시 로드합니다');

            // 카카오맵 SDK 강제 재로드
            loadKakaoSDKAndSearch();

            // 일단 검색은 건너뛰고 빈 결과 표시
            setIsSearching(false);
            setSearchResults([]);
            setShowSearchResults(true);
            return;
        }

        setIsSearching(true);

        const ps = new window.kakao.maps.services.Places();

        const searchCallback = (data, status) => {
            setIsSearching(false);

            if (status === window.kakao.maps.services.Status.OK) {
                const results = data.map((place) => ({
                    name: place.place_name,
                    address: place.address_name,
                    fullAddress: place.road_address_name || place.address_name,
                    latitude: parseFloat(place.y),
                    longitude: parseFloat(place.x),
                    category: place.category_name,
                }));

                console.log('검색 결과:', results);
                setSearchResults(results);
                setShowSearchResults(true);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                setSearchResults([]);
                setShowSearchResults(true);
            } else {
                console.error('검색 중 오류 발생');
                setSearchResults([]);
                setShowSearchResults(false);
            }
        };

        ps.keywordSearch(query, searchCallback);
    };

    // 검색 결과에서 장소 선택
    const selectLocation = (selectedPlace) => {
        setNewPost({
            ...newPost,
            location: selectedPlace.name,
            latitude: selectedPlace.latitude,
            longitude: selectedPlace.longitude,
        });
        setShowSearchResults(false);
        setSearchResults([]);
    };

    // 검색어 입력 핸들러
    const handleLocationSearch = (e) => {
        const query = e.target.value;
        setNewPost({ ...newPost, location: query });

        // 디바운싱
        if (window.searchTimer) {
            clearTimeout(window.searchTimer);
        }

        window.searchTimer = setTimeout(() => {
            searchKakaoPlaces(query);
        }, 500);
    };

    // 카카오 SDK 로드 및 장소 검색 함수
    const loadKakaoSDKAndSearch = async () => {
        console.log('=== 카카오 SDK 로드 및 검색 시작 ===');

        try {
            const apiKey = process.env.REACT_APP_KAKAOMAP_API_KEY;

            if (!apiKey) {
                console.error('❌ API Key가 없습니다!');
                return;
            }

            console.log('1. 카카오 SDK 로드 중...');

            // 이미 로드된 경우 제거
            const existingScript = document.getElementById('kakao-sdk');
            if (existingScript) {
                existingScript.remove();
            }

            // 카카오 SDK 동적 로드
            const script = document.createElement('script');
            script.id = 'kakao-sdk';
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
            script.async = true;

            script.onload = () => {
                console.log('✅ 카카오 SDK 스크립트 로드 완료!');

                // 카카오맵 수동 로드 (autoload=false 때문에 필요)
                window.kakao.maps.load(() => {
                    console.log('✅ 카카오맵 라이브러리 초기화 완료!');

                    console.log('2. 카카오 객체 상세 확인...');
                    console.log('   - window.kakao:', !!window.kakao);
                    console.log('   - window.kakao.maps:', !!window.kakao?.maps);
                    console.log('   - window.kakao.maps.services:', !!window.kakao?.maps?.services);
                    console.log('   - window.kakao.maps.services.Places:', !!window.kakao?.maps?.services?.Places);

                    if (
                        window.kakao &&
                        window.kakao.maps &&
                        window.kakao.maps.services &&
                        window.kakao.maps.services.Places
                    ) {
                        console.log('3. 장소 검색 서비스 초기화...');

                        try {
                            // 장소 검색 서비스 생성
                            const ps = new window.kakao.maps.services.Places();

                            // 검색 콜백 함수
                            const searchCallback = (data, status) => {
                                if (status === window.kakao.maps.services.Status.OK) {
                                    console.log('✅ 장소 검색 성공!');
                                    console.log('검색 결과:', data);

                                    // 결과를 우리 형식으로 변환
                                    const results = data.map((place) => ({
                                        name: place.place_name,
                                        address: place.address_name,
                                        fullAddress: place.road_address_name || place.address_name,
                                        latitude: parseFloat(place.y),
                                        longitude: parseFloat(place.x),
                                        category: place.category_name,
                                    }));

                                    console.log('변환된 결과:', results);

                                    // 실제 검색 결과 설정 (나중에 실제 검색에서 사용)
                                    // setSearchResults(results);
                                    // setShowSearchResults(true);
                                } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                                    console.log('❌ 검색 결과가 없습니다.');
                                } else if (status === window.kakao.maps.services.Status.ERROR) {
                                    console.log('❌ 검색 중 오류가 발생했습니다.');
                                }
                            };

                            // SDK 로드 완료 - 이제 검색 준비됨
                            console.log('4. 카카오맵 장소 검색 준비 완료! 🎉');
                        } catch (psError) {
                            console.error('❌ Places 서비스 생성 실패:', psError);
                        }
                    } else {
                        console.error('❌ 카카오 객체 일부가 로드되지 않음');
                        console.log('💡 대안: services 없이 REST API 방식 시도');

                        // services가 안 되면 REST API로 시도
                        console.log('🔧 해결방법:');
                        console.log('   1. JavaScript 키가 올바른지 확인');
                        console.log('   2. 새로고침 후 다시 시도');
                        console.log('   3. services 라이브러리 로드 문제일 수 있음');
                    }
                }); // kakao.maps.load 콜백 끝
            };

            script.onerror = () => {
                console.error('❌ 카카오 SDK 로드 실패');
            };

            document.head.appendChild(script);
        } catch (error) {
            console.error('❌ SDK 로드 중 에러:', error);
        }
    };

    // 기존 테스트 함수를 SDK 로드 함수로 대체
    const testKakaoAPI = loadKakaoSDKAndSearch;

    // 이미지 업로드 핸들러
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // 파일 크기 제한 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('이미지 크기는 5MB 이하만 업로드 가능합니다.');
                return;
            }

            // 이미지 파일 형식 확인
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }

            // 미리보기 URL 생성
            const previewUrl = URL.createObjectURL(file);
            setNewPost({
                ...newPost,
                image: file,
                imagePreview: previewUrl,
            });
        }
    };

    // 이미지 삭제 핸들러
    const handleImageRemove = () => {
        if (newPost.imagePreview) {
            URL.revokeObjectURL(newPost.imagePreview);
        }
        setNewPost({
            ...newPost,
            image: null,
            imagePreview: null,
        });
    };

    const handleSubmitPost = async (e) => {
        e.preventDefault();
        if (!newPost.title || !newPost.content || !newPost.location) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        if (!isAuthenticated) {
            alert('로그인이 필요합니다.');
            setShowLoginModal(true);
            return;
        }

        try {
            // TODO: 백엔드 배포시 실제 API URL로 교체
            const baseUrl = 'https://openddm.store';

            // API 명세서에 따른 카테고리 매핑
            const categoryMap = {
                교통: 'general',
                민원: 'emergency',
                지역정보: 'notice',
            };

            // FormData 사용하여 이미지와 텍스트 데이터 함께 전송
            const formData = new FormData();
            formData.append('title', newPost.title);
            formData.append('content', newPost.content);
            formData.append('category', categoryMap[newPost.category] || 'general');
            formData.append('latitude', newPost.latitude || '37.5665');
            formData.append('longitude', newPost.longitude || '126.978');
            formData.append('location', newPost.location);

            // 이미지가 있으면 추가
            if (newPost.image) {
                formData.append('image', newPost.image);
            }

            // localStorage 전체 확인
            console.log('LocalStorage 전체 내용:');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                console.log(`   ${key}: ${value}`);
            }

            const token = localStorage.getItem('token');
            const tokenType = typeof token;
            console.log('Submit Post - Token:', token ? 'Present' : 'Missing');
            console.log('Submit Post - Token Value:', token);
            console.log('Submit Post - Token Type:', tokenType);
            console.log('Submit Post - Token Length:', token ? token.length : 0);
            console.log('Submit Post - Form Data:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            if (!token || token === 'undefined' || token === 'null') {
                console.error('❌ 유효하지 않은 토큰:', token);
                alert('로그인이 필요합니다. 다시 로그인해주세요.');

                // localStorage 정리
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                setIsAuthenticated(false);
                setCurrentUser(null);
                setShowLoginModal(true);
                return;
            }

            const response = await fetch(`${baseUrl}/community/upload/`, {
                method: 'POST',
                headers: {
                    // FormData 사용시 Content-Type 헤더를 설정하지 않음 (브라우저가 자동 설정)
                    Authorization: `Token ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                // 게시물 작성 성공 후 목록 새로고침
                await loadPosts();

                // 이미지 미리보기 URL 정리
                if (newPost.imagePreview) {
                    URL.revokeObjectURL(newPost.imagePreview);
                }

                setNewPost({
                    title: '',
                    content: '',
                    category: '교통',
                    location: '',
                    locationType: 'current',
                    latitude: null,
                    longitude: null,
                    image: null,
                    imagePreview: null,
                });
                setSearchResults([]);
                setShowSearchResults(false);
                setShowPostForm(false);
                alert('게시물이 성공적으로 작성되었습니다!');
            } else {
                const errorData = await response.json();
                alert(errorData.message || '게시물 작성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Post creation error:', error);
            alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    // 게시물 정렬 및 필터링 함수
    const getSortedAndFilteredPosts = () => {
        let filteredPosts = posts;

        // 카테고리 필터링
        if (activeCategory !== '전체') {
            filteredPosts = posts.filter((post) => post.category === activeCategory);
        }

        // 정렬
        if (sortBy === 'latest') {
            // 최신순 정렬 (시간 기준)
            filteredPosts.sort((a, b) => {
                const timeValues = {
                    '방금 전': 0,
                    '2분 전': 2,
                    '15분 전': 15,
                    '1시간 전': 60,
                };
                return (timeValues[a.time] || 0) - (timeValues[b.time] || 0);
            });
        } else if (sortBy === 'likes') {
            // 좋아요순 정렬
            filteredPosts.sort((a, b) => b.likes - a.likes);
        }

        return filteredPosts;
    };

    return (
        <div className="community-page">
            {/* Header */}
            <header className="community-header">
                <div className="header-left">
                    <button className="back-btn" onClick={handleBack}>
                        ← 돌아가기
                    </button>
                    <h1 className="page-title">Seoul AI Community</h1>
                </div>
                <div className="header-right">
                    {isAuthenticated ? (
                        <div className="user-info">
                            <span className="welcome-text">안녕하세요, {currentUser?.username}님</span>
                            <button className="new-post-btn" onClick={handleNewPostClick}>
                                + 새 글 작성
                            </button>
                            <button className="logout-btn" onClick={handleLogout}>
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <button className="login-btn" onClick={() => setShowLoginModal(true)}>
                                로그인
                            </button>
                            <button className="new-post-btn" onClick={handleNewPostClick}>
                                + 새 글 작성
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="community-content">
                {/* Popular Posts Preview Section */}
                <div className="popular-posts-section">
                    <div className="section-header">
                        <h2>🔥 인기 게시물</h2>
                        <span className="section-subtitle">좋아요 10개 이상 게시물</span>
                    </div>
                    <div className="popular-posts-preview">
                        {popularPosts.length > 0 ? (
                            popularPosts.map((post, index) => (
                                <div key={post.id} className="popular-post-card">
                                    <div className="popular-post-header">
                                        <span className={`category-tag ${post.category}`}>{post.category}</span>
                                        <span className="popular-rank">#{index + 1}</span>
                                    </div>
                                    <h3 className="popular-post-title">{post.title}</h3>
                                    <p className="popular-post-content">
                                        {post.content.length > 50
                                            ? `${post.content.substring(0, 50)}...`
                                            : post.content}
                                    </p>
                                    <div className="popular-post-footer">
                                        <span className="popular-post-author">👤 {post.author}</span>
                                        <div className="popular-post-stats">
                                            <span className="popular-likes">👍 {post.likes}</span>
                                            <span className="popular-comments">💬 {post.comments}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-popular-posts">
                                <p>아직 인기 게시물이 없습니다.</p>
                                <p>좋아요 10개 이상인 게시물이 여기에 표시됩니다.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Post Form Modal */}
                {showPostForm && (
                    <div className="post-form-overlay">
                        <div className="post-form-modal">
                            <div className="modal-header">
                                <h3>새 글 작성</h3>
                                <button className="close-btn" onClick={() => setShowPostForm(false)}>
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleSubmitPost}>
                                <div className="form-group">
                                    <label>카테고리</label>
                                    <select
                                        value={newPost.category}
                                        onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                                    >
                                        <option value="교통">교통</option>
                                        <option value="민원">민원</option>
                                        <option value="지역정보">지역정보</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>제목</label>
                                    <input
                                        type="text"
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        placeholder="제목을 입력하세요"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>내용</label>
                                    <textarea
                                        value={newPost.content}
                                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                        placeholder="내용을 입력하세요"
                                        rows="5"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>위치</label>
                                    <div className="location-selector">
                                        <div className="location-type-buttons">
                                            <button
                                                type="button"
                                                className={`location-type-btn ${
                                                    newPost.locationType === 'current' ? 'active' : ''
                                                }`}
                                                onClick={() => handleLocationTypeChange('current')}
                                            >
                                                📍 현재위치
                                            </button>
                                            <button
                                                type="button"
                                                className={`location-type-btn ${
                                                    newPost.locationType === 'search' ? 'active' : ''
                                                }`}
                                                onClick={() => handleLocationTypeChange('search')}
                                            >
                                                🔍 찾기
                                            </button>
                                        </div>
                                        {newPost.locationType === 'search' && (
                                            <div className="location-search-container">
                                                <input
                                                    type="text"
                                                    value={newPost.location}
                                                    onChange={handleLocationSearch}
                                                    placeholder="위치를 입력하세요 (예: 강남역, 홍대)"
                                                    required
                                                />
                                                {isSearching && <div className="search-loading">🔍 검색 중...</div>}
                                                {showSearchResults && searchResults.length > 0 && (
                                                    <div className="search-results">
                                                        {searchResults.map((place, index) => (
                                                            <div
                                                                key={index}
                                                                className="search-result-item"
                                                                onClick={() => selectLocation(place)}
                                                            >
                                                                <div className="place-name">{place.name}</div>
                                                                <div className="place-address">{place.fullAddress}</div>
                                                                <div className="place-category">{place.category}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {showSearchResults &&
                                                    searchResults.length === 0 &&
                                                    !isSearching &&
                                                    newPost.location && (
                                                        <div className="no-search-results">검색 결과가 없습니다.</div>
                                                    )}
                                                {newPost.latitude && newPost.longitude && (
                                                    <div className="selected-location-info">
                                                        📍 선택된 위치: {newPost.location}
                                                        <span className="coordinates">
                                                            ({newPost.latitude.toFixed(4)},{' '}
                                                            {newPost.longitude.toFixed(4)})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {newPost.locationType === 'current' && (
                                            <div className="current-location">
                                                <span>📍 현재 위치</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 이미지 업로드 필드 */}
                                <div className="form-group">
                                    <label>이미지 첨부 (선택)</label>
                                    <div className="image-upload-container">
                                        {!newPost.imagePreview ? (
                                            <div className="image-upload-area">
                                                <input
                                                    type="file"
                                                    id="imageUpload"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    style={{ display: 'none' }}
                                                />
                                                <label htmlFor="imageUpload" className="image-upload-button">
                                                    📷 이미지 선택하기
                                                </label>
                                                <p className="image-upload-hint">JPG, PNG, GIF 파일 (최대 5MB)</p>
                                            </div>
                                        ) : (
                                            <div className="image-preview-container">
                                                <img
                                                    src={newPost.imagePreview}
                                                    alt="업로드 미리보기"
                                                    className="image-preview"
                                                />
                                                <button
                                                    type="button"
                                                    className="image-remove-button"
                                                    onClick={handleImageRemove}
                                                >
                                                    ✕ 이미지 삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={() => setShowPostForm(false)}>
                                        취소
                                    </button>
                                    <button type="submit">작성하기</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Posts List */}
                <div className="posts-section">
                    <div className="section-header">
                        <h2>최근 게시물</h2>
                        <div className="header-controls">
                            <div className="sort-controls">
                                <button
                                    className={`sort-btn ${sortBy === 'latest' ? 'active' : ''}`}
                                    onClick={() => setSortBy('latest')}
                                >
                                    최신순
                                </button>
                                <button
                                    className={`sort-btn ${sortBy === 'likes' ? 'active' : ''}`}
                                    onClick={() => setSortBy('likes')}
                                >
                                    좋아요순
                                </button>
                            </div>
                            <div className="filter-tabs">
                                <button
                                    className={`tab ${activeCategory === '전체' ? 'active' : ''}`}
                                    onClick={() => setActiveCategory('전체')}
                                >
                                    전체
                                </button>
                                <button
                                    className={`tab ${activeCategory === '교통' ? 'active' : ''}`}
                                    onClick={() => setActiveCategory('교통')}
                                >
                                    교통
                                </button>
                                <button
                                    className={`tab ${activeCategory === '민원' ? 'active' : ''}`}
                                    onClick={() => setActiveCategory('민원')}
                                >
                                    민원
                                </button>
                                <button
                                    className={`tab ${activeCategory === '지역정보' ? 'active' : ''}`}
                                    onClick={() => setActiveCategory('지역정보')}
                                >
                                    지역정보
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="posts-list">
                        {loading ? (
                            <div className="loading-state">
                                <p>게시물을 불러오는 중...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>{error}</p>
                                <button onClick={loadPosts}>다시 시도</button>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="empty-state">
                                <p>등록된 게시물이 없습니다.</p>
                            </div>
                        ) : (
                            getSortedAndFilteredPosts().map((post) => (
                                <div
                                    key={post.id}
                                    className="post-card clickable"
                                    onClick={() => handlePostClick(post.id)}
                                >
                                    <div className="post-header">
                                        <span className={`category-tag ${post.category}`}>{post.category}</span>
                                        <span className="post-time">{post.time}</span>
                                    </div>
                                    <h3 className="post-title">{post.title}</h3>
                                    <p className="post-content">{post.content}</p>

                                    {/* 이미지가 있으면 표시 */}
                                    {post.image_url && (
                                        <div className="post-image-container">
                                            <img
                                                src={post.image_url}
                                                alt="게시물 이미지"
                                                className="post-image"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="post-location">📍 {post.location}</div>
                                    <div className="post-footer">
                                        <div className="post-author">
                                            <span className="author-icon">👤</span>
                                            <span className="author-name">{post.author}</span>
                                        </div>
                                        <div className="post-actions">
                                            <button
                                                className="action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLikeToggle(post.id);
                                                }}
                                            >
                                                👍 {post.likes || 0}
                                            </button>
                                            <button className="action-btn" onClick={(e) => e.stopPropagation()}>
                                                💬 {post.comments || 0}
                                            </button>
                                            <button className="action-btn" onClick={(e) => e.stopPropagation()}>
                                                📤 공유
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 인증 모달들 */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSwitchToRegister={handleSwitchToRegister}
                onLoginSuccess={handleLoginSuccess}
            />

            <RegisterModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSwitchToLogin={handleSwitchToLogin}
                onRegisterSuccess={handleRegisterSuccess}
            />
        </div>
    );
}

export default CommunityPage;
