import React from 'react';

function ChatInput({ onSendMessage }) {
    return (
        <div className="chat-input">
            {/* 채팅 입력 내용 */}
            <div className="input-placeholder">채팅 입력 영역</div>
        </div>
    );
}

export default ChatInput;
