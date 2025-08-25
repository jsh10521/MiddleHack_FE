import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService } from '../services/communityService';
import '../styles/CommunityPage.css';

function PostDetailPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // 인증 관련 상태 - localStorage에서 초기값 설정
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        return !!(token && username && token !== 'undefined' && token !== 'null' && token.trim() !== '');
    });
    const [currentUser, setCurrentUser] = useState(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        if (token && username && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
            return { username, token };
        }
        return null;
    });

    // 인증 상태 실시간 체크 헬퍼 함수
    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        return token && username && token !== 'undefined' && token !== 'null' && token.trim() !== '';
    };

    useEffect(() => {
        // 로그인 상태 재확인 및 동기화
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const isTokenValid = token && username && token !== 'undefined' && token !== 'null' && token.trim() !== '';

        if (isTokenValid) {
            setIsAuthenticated(true);
            setCurrentUser({ username, token });
        } else {
            setIsAuthenticated(false);
            setCurrentUser(null);
        }

        loadPostDetail();
    }, [postId]);

    const loadPostDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = 'https://openddm.store';

            // localStorage에서 직접 토큰 가져오기 (React 상태 동기화 지연 방지)
            const token = localStorage.getItem('token');

            console.log('🔍 PostDetail API 요청 - 토큰 체크:', {
                hasToken: !!token,
                tokenValue: token,
                isTokenValid: checkAuthStatus(),
            });

            const response = await fetch(`${baseUrl}/community/${postId}/`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && token !== 'undefined' && token !== 'null' && { Authorization: `Token ${token}` }),
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPost({
                    id: data.post_id,
                    title: data.title,
                    content: data.content,
                    author: data.author,
                    category: getCategoryUIValue(data.category),
                    likes: data.likes,
                    comments: data.comments || [],
                    location: data.location,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    image_url: data.image_url,
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                });
            } else {
                throw new Error('게시물을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('게시물 상세 로드 실패:', error);
            setError('게시물을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 카테고리 API값을 UI값으로 변환
    const getCategoryUIValue = (apiCategory) => {
        const map = { general: '교통', emergency: '민원', notice: '지역정보' };
        return map[apiCategory] || '교통';
    };

    // 시간 포맷팅 함수
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleBack = () => {
        navigate('/community');
    };

    // 댓글 작성 함수
    const handleCommentSubmit = async () => {
        console.log('💬 댓글 작성 함수 시작');

        if (!newComment.trim()) {
            console.log('💬 댓글 내용 없음');
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        const isTokenValid = checkAuthStatus();
        console.log('💬 토큰 유효성:', isTokenValid);
        if (!isTokenValid) {
            alert('로그인이 필요합니다.');
            return;
        }

        console.log('💬 댓글 작성 시작 - 내용:', newComment.trim());
        setCommentLoading(true);

        try {
            const token = localStorage.getItem('token');
            console.log('💬 API 호출 시작');
            await communityService.createComment(postId, newComment.trim(), token);
            console.log('💬 API 호출 성공');
            setNewComment('');
            // 게시물 다시 로드하여 새 댓글 표시
            await loadPostDetail();
        } catch (error) {
            console.error('💬 댓글 작성 실패:', error);
            alert('댓글 작성에 실패했습니다.');
        } finally {
            console.log('💬 댓글 작성 처리 완료');
            setCommentLoading(false);
        }
    };

    // 게시글 삭제 함수
    const handleDeletePost = async () => {
        const isTokenValid = checkAuthStatus();
        const username = localStorage.getItem('username');

        if (!isTokenValid || username !== post.author) {
            alert('게시글을 삭제할 권한이 없습니다.');
            return;
        }

        if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다.')) {
            return;
        }

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await communityService.deletePost(postId, token);
            alert('게시글이 삭제되었습니다.');
            navigate('/community');
        } catch (error) {
            console.error('게시글 삭제 실패:', error);
            alert('게시글 삭제에 실패했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    // 게시글 수정 페이지로 이동
    const handleEditPost = () => {
        const isTokenValid = checkAuthStatus();
        const username = localStorage.getItem('username');

        if (!isTokenValid || username !== post.author) {
            alert('게시글을 수정할 권한이 없습니다.');
            return;
        }
        // 수정 페이지로 이동 (수정 페이지는 추후 구현)
        navigate(`/community/${postId}/edit`);
    };

    // 현재 사용자가 게시글 작성자인지 확인
    const username = localStorage.getItem('username');
    const isAuthor = checkAuthStatus() && post && username === post.author;

    if (loading) {
        return (
            <div className="community-page">
                <div className="loading-state">
                    <p>게시물을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="community-page">
                <div className="error-state">
                    <p>{error || '게시물을 찾을 수 없습니다.'}</p>
                    <button onClick={handleBack}>커뮤니티로 돌아가기</button>
                </div>
            </div>
        );
    }

    return (
        <div className="community-page">
            <header className="community-header">
                <div className="header-left">
                    <button className="back-btn" onClick={handleBack}>
                        ← 커뮤니티로 돌아가기
                    </button>
                    <h1 className="page-title">게시물 상세</h1>
                </div>
                {isAuthor && (
                    <div className="header-right">
                        <button className="edit-btn" onClick={handleEditPost} disabled={isDeleting}>
                            ✏️ 수정
                        </button>
                        <button className="delete-btn" onClick={handleDeletePost} disabled={isDeleting}>
                            {isDeleting ? '삭제 중...' : '🗑️ 삭제'}
                        </button>
                    </div>
                )}
            </header>

            <div className="community-content">
                <div className="post-detail-container">
                    <div className="post-detail-card">
                        <div className="post-detail-header">
                            <div className="post-meta">
                                <span className={`category-tag ${post.category}`}>{post.category}</span>
                                <span className="post-date">{formatTime(post.created_at)}</span>
                            </div>
                            <h1 className="post-detail-title">{post.title}</h1>
                            <div className="post-author-info">
                                <span className="author-icon">👤</span>
                                <span className="author-name">{post.author}</span>
                                <span className="post-location">📍 {post.location}</span>
                            </div>
                        </div>

                        <div className="post-detail-content">
                            {post.image_url && (
                                <div className="post-detail-image">
                                    <img
                                        src={post.image_url}
                                        alt="게시물 이미지"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                            <div className="post-content-text">
                                {post.content.split('\n').map((line, index) => (
                                    <p key={index}>{line}</p>
                                ))}
                            </div>
                        </div>

                        <div className="post-detail-footer">
                            <div className="post-stats">
                                <span className="stat-item">👍 좋아요 {post.likes}</span>
                                <span className="stat-item">💬 댓글 {post.comments.length}</span>
                            </div>
                        </div>

                        {/* 댓글 섹션 */}
                        <div className="comments-section">
                            <h3>댓글 ({post.comments.length})</h3>

                            {/* 댓글 작성 폼 */}
                            {checkAuthStatus() ? (
                                <div className="comment-form">
                                    <div className="comment-input-container">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                    e.preventDefault();
                                                    handleCommentSubmit();
                                                }
                                            }}
                                            placeholder="댓글을 작성해주세요..."
                                            rows="3"
                                            disabled={commentLoading}
                                        />
                                        <button
                                            type="button"
                                            className="comment-submit-btn"
                                            disabled={commentLoading || !newComment.trim()}
                                            onClick={(e) => {
                                                console.log('🔴 버튼 클릭됨!');
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleCommentSubmit();
                                            }}
                                        >
                                            {commentLoading ? '작성 중...' : '댓글 작성'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="comment-login-prompt">
                                    <p>댓글을 작성하려면 로그인이 필요합니다.</p>
                                </div>
                            )}

                            {/* 댓글 목록 */}
                            {post.comments.length > 0 ? (
                                <div className="comments-list">
                                    {post.comments.map((comment) => (
                                        <div key={comment.id} className="comment-item">
                                            <div className="comment-header">
                                                <span className="comment-author">👤 {comment.author}</span>
                                                <span className="comment-date">{formatTime(comment.created_at)}</span>
                                            </div>
                                            <div className="comment-content">{comment.content}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-comments">
                                    <p>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PostDetailPage;
