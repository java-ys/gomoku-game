import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Game from './components/Game';
import MultiplayerGame from './components/MultiplayerGame';

function App() {
  const basename = process.env.NODE_ENV === 'production' ? '/gomoku-game' : '';

  return (
    <Router basename={basename}>
      <div className="App">
        <header className="App-header">
          <h1>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              五子棋游戏 | Gomoku Game
            </Link>
          </h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ai" element={<Game />} />
            <Route path="/multiplayer" element={<MultiplayerGame />} />
          </Routes>
        </main>
        <footer className="App-footer">
          <p>© {new Date().getFullYear()} 五子棋游戏 | Gomoku Game</p>
        </footer>
      </div>
    </Router>
  );
}

export default App; 