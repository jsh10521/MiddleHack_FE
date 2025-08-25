import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import chatbotService from '../services/chatbotService';
import { searchPlacesWithTmap } from '../utils/tmapPlaces';

function ChatbotPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: '안녕하세요! 동대문구 전문 AI 챗봇입니다. 무엇을 도와드릴까요?',
            sender: 'bot',
            time: new Date().toLocaleTimeString(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => {}
            );
        }
    }, []);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || loading) return;
        const userMsg = { id: Date.now(), text: inputMessage, sender: 'user', time: new Date().toLocaleTimeString() };
        setMessages((prev) => [...prev, userMsg]);
        setInputMessage('');

        setLoading(true);
        try {
            const keyword = chatbotService.detectKeywords(inputMessage);
            let places = [];
            if (keyword) {
                places = await searchPlacesWithTmap(`동대문구 ${keyword}`, location);
            }
            const reply = await chatbotService.generateResponse(inputMessage, location, places);
            const botMsg = { id: Date.now() + 1, text: reply, sender: 'bot', time: new Date().toLocaleTimeString() };
            setMessages((prev) => [...prev, botMsg]);
        } catch (e) {
            const errMsg = {
                id: Date.now() + 1,
                text: `오류: ${e.message}`,
                sender: 'bot',
                time: new Date().toLocaleTimeString(),
            };
            setMessages((prev) => [...prev, errMsg]);
        }
        setLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
            }}
        >
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '20px',
                    height: '95vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        paddingBottom: '15px',
                        borderBottom: '1px solid #e0e0e0',
                    }}
                >
                    <h1 style={{ color: '#333', margin: 0 }}>🤖 Seoul AI Chatbot</h1>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 20px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        홈으로
                    </button>
                </div>

                {/* Messages Container */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        marginBottom: '20px',
                        padding: '20px',
                        background: '#f8f9fa',
                        borderRadius: '15px',
                        border: '1px solid #e0e0e0',
                    }}
                >
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            style={{
                                display: 'flex',
                                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: '15px',
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: '70%',
                                    padding: '15px 20px',
                                    borderRadius: '20px',
                                    background:
                                        message.sender === 'user'
                                            ? 'linear-gradient(45deg, #667eea, #764ba2)'
                                            : '#ffffff',
                                    color: message.sender === 'user' ? 'white' : '#333',
                                    border: message.sender === 'user' ? 'none' : '1px solid #e0e0e0',
                                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.text}</p>
                                <small
                                    style={{
                                        opacity: 0.7,
                                        fontSize: '0.8em',
                                        color: message.sender === 'user' ? 'rgba(255, 255, 255, 0.8)' : '#999',
                                    }}
                                >
                                    {message.time}
                                </small>
                            </div>
                        </div>
                    ))}
                    {loading && <div style={{ opacity: 0.6, fontSize: '0.9em' }}>답변 생성 중...</div>}
                </div>

                {/* Input Area */}
                <div
                    style={{
                        display: 'flex',
                        gap: '15px',
                        padding: '20px',
                        background: '#ffffff',
                        borderRadius: '15px',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="메시지를 입력하세요..."
                        style={{
                            flex: 1,
                            padding: '15px 20px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            background: '#f8f9fa',
                            outline: 'none',
                            fontSize: '16px',
                            fontFamily: 'inherit',
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        style={{
                            padding: '15px 25px',
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)',
                        }}
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatbotPage;
