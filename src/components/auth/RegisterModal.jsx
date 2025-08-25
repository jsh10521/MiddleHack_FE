import React, { useState } from 'react';
import '../../styles/AuthModal.css';

function RegisterModal({ isOpen, onClose, onSwitchToLogin, onRegisterSuccess }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password1: '',
        password2: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');

    const checkPasswordStrength = (password) => {
        if (password.length === 0) return '';

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;

        const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough].filter(
            Boolean
        ).length;

        if (password.length < 8) return '너무 짧습니다 (최소 8자)';
        if (criteriaCount < 3) return '약함 - 대문자, 소문자, 숫자, 특수문자를 조합하세요';
        if (criteriaCount < 4) return '보통';
        return '강함';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // 비밀번호 입력 시 강도 체크
        if (name === 'password1') {
            setPasswordStrength(checkPasswordStrength(value));
        }

        setError(''); // 입력시 에러 메시지 초기화
    };

    const validateForm = () => {
        // 사용자명 검증
        if (formData.username.length < 3) {
            setError('사용자명은 3자 이상이어야 합니다.');
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            setError('사용자명은 영문, 숫자, 언더스코어(_)만 사용 가능합니다.');
            return false;
        }

        // 이메일 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('올바른 이메일 형식을 입력해주세요.');
            return false;
        }

        // 비밀번호 검증
        if (formData.password1.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return false;
        }

        // 비밀번호 복잡성 검사
        const hasUpperCase = /[A-Z]/.test(formData.password1);
        const hasLowerCase = /[a-z]/.test(formData.password1);
        const hasNumbers = /\d/.test(formData.password1);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password1);

        if (!hasNumbers && !hasSpecialChar) {
            setError('비밀번호는 숫자 또는 특수문자를 포함해야 합니다.');
            return false;
        }

        // 너무 단순한 비밀번호 체크
        const commonPasswords = ['12345678', 'password', 'qwerty123', '11111111'];
        if (commonPasswords.includes(formData.password1.toLowerCase())) {
            setError('너무 단순한 비밀번호입니다. 다른 비밀번호를 사용해주세요.');
            return false;
        }

        // 비밀번호 확인
        if (formData.password1 !== formData.password2) {
            setError('비밀번호가 일치하지 않습니다.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!validateForm()) {
            setIsLoading(false);
            return;
        }

        try {
            // TODO: 백엔드 배포시 실제 API URL로 교체
            const baseUrl = 'https://openddm.store';

            const response = await fetch(`${baseUrl}/accounts/registration/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();

                // 회원가입 성공
                onRegisterSuccess();

                // 로그인 모달로 전환
                setFormData({ username: '', email: '', password1: '', password2: '' });
                onSwitchToLogin();

                alert('회원가입이 완료되었습니다. 로그인해주세요.');
            } else {
                const errorData = await response.json();

                // Django REST framework 오류 메시지 파싱
                let errorMessage = '';

                if (errorData.username) {
                    errorMessage += `사용자명: ${
                        Array.isArray(errorData.username) ? errorData.username.join(', ') : errorData.username
                    }\n`;
                }
                if (errorData.email) {
                    errorMessage += `이메일: ${
                        Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email
                    }\n`;
                }
                if (errorData.password1) {
                    errorMessage += `비밀번호: ${
                        Array.isArray(errorData.password1) ? errorData.password1.join(', ') : errorData.password1
                    }\n`;
                }
                if (errorData.password2) {
                    errorMessage += `비밀번호 확인: ${
                        Array.isArray(errorData.password2) ? errorData.password2.join(', ') : errorData.password2
                    }\n`;
                }
                if (errorData.non_field_errors) {
                    errorMessage += `${
                        Array.isArray(errorData.non_field_errors)
                            ? errorData.non_field_errors.join(', ')
                            : errorData.non_field_errors
                    }\n`;
                }

                // 특정 필드 오류가 없으면 일반 메시지 표시
                if (!errorMessage && errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (!errorMessage && errorData.message) {
                    errorMessage = errorData.message;
                } else if (!errorMessage) {
                    errorMessage = '회원가입에 실패했습니다. 입력 정보를 확인해주세요.';
                }

                setError(errorMessage.trim());
            }
        } catch (error) {
            console.error('Register error:', error);
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
                    <h2>회원가입</h2>
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
                        <label htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="이메일을 입력하세요"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password1">비밀번호</label>
                        <input
                            type="password"
                            id="password1"
                            name="password1"
                            value={formData.password1}
                            onChange={handleChange}
                            placeholder="비밀번호를 입력하세요 (8자 이상)"
                            required
                            disabled={isLoading}
                        />
                        {passwordStrength && (
                            <div
                                className={`password-strength ${
                                    passwordStrength.includes('강함')
                                        ? 'strong'
                                        : passwordStrength.includes('보통')
                                        ? 'medium'
                                        : 'weak'
                                }`}
                            >
                                비밀번호 강도: {passwordStrength}
                            </div>
                        )}
                        <div className="password-requirements">
                            <small>
                                • 8자 이상
                                <br />• 대문자, 소문자, 숫자, 특수문자 중 3가지 이상 조합
                            </small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password2">비밀번호 확인</label>
                        <input
                            type="password"
                            id="password2"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            placeholder="비밀번호를 다시 입력하세요"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? '회원가입 중...' : '회원가입'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        이미 계정이 있으신가요?{' '}
                        <button type="button" className="switch-auth-btn" onClick={onSwitchToLogin}>
                            로그인
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RegisterModal;
