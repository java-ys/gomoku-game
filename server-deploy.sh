# 确保脚本在出错时停止执行
set -e

echo "开始部署五子棋游戏后端..."

# 创建项目目录（如果不存在）
if [ ! -d "~/gomoku-game" ]; then
  echo "创建项目目录..."
  mkdir -p ~/gomoku-game
fi

# 克隆或更新代码
if [ -d "~/gomoku-game/.git" ]; then
  echo "更新代码..."
  cd ~/gomoku-game
  git pull
else
  echo "目录已存在，初始化为Git仓库..."
  # 检查目录是否存在
  if [ -d "~/gomoku-game" ]; then
    # 备份现有文件（如果需要）
    echo "备份现有文件..."
    timestamp=$(date +%Y%m%d%H%M%S)
    mkdir -p ~/gomoku-backup-$timestamp
    cp -r ~/gomoku-game/* ~/gomoku-backup-$timestamp/ 2>/dev/null || true
    
    # 清空目录
    echo "清空目录..."
    rm -rf ~/gomoku-game/*
    
    # 克隆代码
    echo "克隆代码到现有目录..."
    cd ~/gomoku-game
    git clone https://github.com/java-ys/gomoku-game.git .
  else
    echo "克隆代码..."
    git clone https://github.com/java-ys/gomoku-game.git ~/gomoku-game
  fi
fi

# 安装依赖
echo "正在安装依赖..."
cd ~/gomoku-game/server
npm install

# 配置环境变量
echo "正在配置环境变量..."
cat > .env << EOL
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://java-ys.github.io/gomoku-game
EOL

echo "环境变量已配置。如需修改，请编辑 ~/gomoku-game/server/.env 文件"

# 配置PM2
echo "正在配置PM2..."
if ! command -v pm2 &> /dev/null; then
  echo "安装PM2..."
  npm install -g pm2
fi

# 创建PM2配置文件
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: "gomoku-backend",
    script: "./server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "200M",
    env: {
      NODE_ENV: "production",
      PORT: 3001,
      FRONTEND_URL: "https://java-ys.github.io/gomoku-game"
    }
  }]
};
EOL

# 启动或重启服务
echo "正在启动服务..."
if pm2 list | grep -q "gomoku-backend"; then
  pm2 restart gomoku-backend
else
  pm2 start ecosystem.config.js
fi

# 保存PM2配置，确保服务器重启后自动启动
pm2 save
pm2 startup

# 配置防火墙（这里禁用set -e）
echo "正在配置防火墙..."

set +e  # 禁用 set -e，避免防火墙配置失败导致脚本中断

if command -v firewall-cmd &> /dev/null; then
  # CentOS
  sudo firewall-cmd --zone=public --add-port=3001/tcp --permanent
  sudo firewall-cmd --reload
  echo "防火墙已配置（CentOS）"
elif command -v ufw &> /dev/null; then
  # Ubuntu
  # 确保防火墙已启用
  if ! sudo ufw status | grep -q "active"; then
    echo "启用防火墙..."
    sudo ufw --force enable
  fi
  sudo ufw allow 3001/tcp
  sudo ufw reload  # 确保配置生效
  echo "防火墙已配置（Ubuntu）"
elif command -v iptables &> /dev/null; then
  # 通用Linux
  sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT  # 确保SSH访问
  
  # 保存iptables规则（根据发行版不同可能需要调整）
  if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    sudo apt-get update
    sudo apt-get install -y iptables-persistent
    sudo netfilter-persistent save
  elif [ -f /etc/redhat-release ]; then
    # CentOS/RHEL
    sudo service iptables save
  else
    echo "无法自动保存iptables规则，请手动保存"
  fi
  
  echo "防火墙已配置（iptables）"
else
  echo "未检测到防火墙系统，跳过防火墙配置"
  echo "请确保端口3001已开放，或手动配置防火墙"
fi

set -e  # 恢复 set -e

# 配置Nginx（如果需要）
echo "是否配置Nginx反向代理？(y/n)"
read configure_nginx

if [ "$configure_nginx" = "y" ]; then
  echo "正在配置Nginx..."
  
  # 安装Nginx（如果未安装）
  if ! command -v nginx &> /dev/null; then
    if command -v yum &> /dev/null; then
      # CentOS
      sudo yum install -y nginx
    elif command -v apt-get &> /dev/null; then
      # Ubuntu
      sudo apt-get update
      sudo apt-get install -y nginx
    else
      echo "无法识别的包管理器，请手动安装Nginx"
      exit 1
    fi
  fi
  
  # 创建Nginx配置文件
  sudo tee /etc/nginx/conf.d/gomoku.conf > /dev/null << EOL
server {
    listen 80;
    server_name 212.192.221.50;  # 替换为你的域名，如果没有域名可以使用服务器IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL
  
  # 测试Nginx配置
  sudo nginx -t
  
  # 重启Nginx
  sudo systemctl restart nginx
  
  echo "Nginx已配置"
fi

echo "部署完成！"
echo "后端服务运行在: http://212.192.221.50:3001"
echo "可以通过以下命令查看服务状态："
echo "  pm2 status"
echo "可以通过以下命令查看日志："
echo "  pm2 logs gomoku-backend"
