import React, { useState } from 'react';
import '../../styles/AuthModal.css';

function LoginModal({ isOpen, onClose, onSwitchToRegister, onLoginSuccess }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(''); // 입력시 에러 메시지 초기화
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // TODO: 백엔드 배포시 실제 API URL로 교체
            const baseUrl = 'https://openddm.store';

            const response = await fetch(`${baseUrl}/accounts/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();

                // 🔍 백엔드 응답 전체 구조 확인
                console.log('🔍 백엔드 전체 응답:', data);
                console.log('🔍 응답 타입:', typeof data);
                console.log('🔍 응답 키들:', Object.keys(data));
                console.log('🔍 data.token:', data.token);
                console.log('🔍 data.key:', data.key);
                console.log('🔍 data.access_token:', data.access_token);
                console.log('🔍 data.auth_token:', data.auth_token);

                // 실제 토큰 필드 찾기
                const token = data.token || data.key || data.access_token || data.auth_token;
                console.log('🔑 최종 토큰:', token);

                if (!token) {
                    console.error('❌ 토큰을 찾을 수 없습니다. 백엔드 응답:', data);
                    setError('로그인은 성공했지만 토큰을 받지 못했습니다.');
                    return;
                }

                // 토큰 저장
                localStorage.setItem('token', token);
                localStorage.setItem('username', formData.username);

                // 로그인 성공 콜백
                onLoginSuccess({
                    token: token,
                    username: formData.username,
                });

                onClose();
                setFormData({ username: '', password: '' });
            } else {
                const errorData = await response.json();

                // Django REST framework 오류 메시지 파싱
                let errorMessage = '';

                if (errorData.username) {
                    errorMessage += `사용자명: ${
                        Array.isArray(errorData.username) ? errorData.username.join(', ') : errorData.username
                    }\n`;
                }
                if (errorData.password) {
                    errorMessage += `비밀번호: ${
                        Array.isArray(errorData.password) ? errorData.password.join(', ') : errorData.password
                    }\n`;
                }
                if (errorData.non_field_errors) {
                    errorMessage += `${
                        Array.isArray(errorData.non_field_errors)
                            ? errorData.non_field_errors.join(', ')
                            : errorData.non_field_errors
                    }\n`;
                }

                // 일반적인 로그인 실패 메시지
                if (!errorMessage && errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (!errorMessage && errorData.message) {
                    errorMessage = errorData.message;
                } else if (!errorMessage) {
                    errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
                }

                setError(errorMessage.trim());
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal">
                <div className="auth-modal-header">
                    <h2>로그인</h2>
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">사용자명</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="사용자명을 입력하세요"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="비밀번호를 입력하세요"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        계정이 없으신가요?{' '}
                        <button type="button" className="switch-auth-btn" onClick={onSwitchToRegister}>
                            회원가입
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;
