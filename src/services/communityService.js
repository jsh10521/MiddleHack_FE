// 커뮤니티 API 서비스

const API_BASE_URL = 'https://openddm.store';

export const communityService = {
    // 게시글 목록 조회
    getPosts: async () => {
        // API 호출 로직
    },

    // 게시글 상세 조회
    getPostDetail: async (id) => {
        // API 호출 로직
    },

    // 게시글 작성
    createPost: async (postData) => {
        // API 호출 로직
    },

    // 게시글 수정
    updatePost: async (id, postData) => {
        // API 호출 로직
    },

    // 인기 게시물 조회 (좋아요 5개 이상)
    getPopularPosts: async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
            };

            // 토큰이 있으면 Authorization 헤더 추가
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/mainpage/pop/`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                throw new Error('인기 게시물 조회 실패');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('인기 게시물 조회 에러:', error);
            throw error;
        }
    },

    // 게시글 삭제
    deletePost: async (postId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/community/${postId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('게시글 삭제 실패');
            }

            return response;
        } catch (error) {
            console.error('게시글 삭제 에러:', error);
            throw error;
        }
    },

    // 좋아요 토글
    toggleLike: async (postId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/community/${postId}/likes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('좋아요 처리 실패');
            }

            return response;
        } catch (error) {
            console.error('좋아요 처리 에러:', error);
            throw error;
        }
    },

    // 댓글 작성
    createComment: async (postId, content, token) => {
        try {
            const requestBody = {
                content: content,
            };

            console.log('📤 댓글 작성 요청 상세:', {
                url: `${API_BASE_URL}/community/${postId}/create_comment/`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token.substring(0, 10)}...`,
                },
                body: requestBody,
                stringifiedBody: JSON.stringify(requestBody),
            });

            console.log('🔍 실제 전송될 body:', JSON.stringify(requestBody));

            const response = await fetch(`${API_BASE_URL}/community/${postId}/create_comment/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error('댓글 작성 실패');
            }

            return response;
        } catch (error) {
            console.error('댓글 작성 에러:', error);
            throw error;
        }
    },
};
