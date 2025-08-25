import React from 'react';

function Button({ children, onClick, className, type = 'button', disabled = false }) {
    return (
        <button type={type} onClick={onClick} className={`btn ${className || ''}`} disabled={disabled}>
            {children}
        </button>
    );
}

export default Button;
