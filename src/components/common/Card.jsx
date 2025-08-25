import React from 'react';

function Card({ children, title, className }) {
    return (
        <div className={`card ${className || ''}`}>
            {title && <div className="card-header">{title}</div>}
            <div className="card-body">{children}</div>
        </div>
    );
}

export default Card;
