import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import './styles/App.css';

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AppRouter />
            </BrowserRouter>
        </div>
    );
}

export default App;