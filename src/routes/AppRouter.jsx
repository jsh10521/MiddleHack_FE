import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from '../pages/MainPage';
import TrafficPage from '../pages/TrafficPage';
import WeatherPage from '../pages/WeatherPage';
import CommunityPage from '../pages/CommunityPage';
import PostDetailPage from '../pages/PostDetailPage';
import ChatbotPage from '../pages/ChatbotPage';
import LiveMap from '../pages/Livemap';

function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/livemap" element={<LiveMap />} />
            <Route path="/traffic" element={<TrafficPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/:postId" element={<PostDetailPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
        </Routes>
    );
}

export default AppRouter;
