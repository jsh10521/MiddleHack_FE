import React from 'react';

function MapControls({ onZoomIn, onZoomOut, onReset }) {
    return (
        <div className="map-controls">
            <button onClick={onZoomIn}>확대</button>
            <button onClick={onZoomOut}>축소</button>
            <button onClick={onReset}>초기화</button>
        </div>
    );
}

export default MapControls;
