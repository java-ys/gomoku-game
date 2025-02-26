import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h1>五子棋游戏</h1>
      <div className="game-modes">
        <Link to="/game" className="mode-button">
          与AI对战
        </Link>
        <Link to="/multiplayer" className="mode-button">
          多人对战
        </Link>
      </div>
      <div className="game-info">
        <h2>游戏说明</h2>
        <p>五子棋是一种两人对弈的纯策略型棋类游戏，使用15×15的棋盘，黑白两色的棋子。</p>
        <p>游戏规则简单：</p>
        <ul>
          <li>黑方先行，双方轮流在棋盘空位落子</li>
          <li>先在横、竖或斜方向形成连续五子一线的一方获胜</li>
        </ul>
      </div>
    </div>
  );
};

export default Home; 