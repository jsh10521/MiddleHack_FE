import React from 'react';

function Map({ className }) {
    return (
        <div className={`map-container ${className || ''}`}>
            {/* 지도 컴포넌트 내용 */}
            <div className="map-placeholder">지도 영역</div>
        </div>
    );
}

export default Map;
