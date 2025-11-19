// 绿植监护小程序
class PlantGuardian {
  constructor() {
    this.plants = [];
    this.reminders = [];
    this.environmentData = {
      temperature: 22,  // 摄氏度
      humidity: 45,     // 相对湿度百分比
      lightLevel: 60    // 光照强度百分比
    };
    this.init();
  }

  init() {
    this.loadPlants();
    this.setupUI();
    this.startMonitoring();
    this.updateEnvironmentData();
  }

  // 植物信息管理
  addPlant(name, species, wateringInterval, lastWatered = new Date()) {
    const plant = {
      id: Date.now(),
      name,
      species,
      wateringInterval, // 浇水间隔（天）
      lastWatered: new Date(lastWatered),
      image: `https://placehold.co/200x200/4ade80/ffffff?text=${encodeURIComponent(name)}`,
      createdAt: new Date()
    };
    
    this.plants.push(plant);
    this.savePlants();
    this.renderPlants();
    return plant;
  }

  getPlants() {
    return this.plants;
  }

  updatePlant(plantId, updates) {
    const plantIndex = this.plants.findIndex(p => p.id === plantId);
    if (plantIndex !== -1) {
      this.plants[plantIndex] = { ...this.plants[plantIndex], ...updates };
      this.savePlants();
      this.renderPlants();
    }
  }

  deletePlant(plantId) {
    this.plants = this.plants.filter(p => p.id !== plantId);
    this.savePlants();
    this.renderPlants();
  }

  // 浇水功能
  waterPlant(plantId) {
    const plant = this.plants.find(p => p.id === plantId);
    if (plant) {
      plant.lastWatered = new Date();
      this.savePlants();
      this.renderPlants();
      this.showNotification(`${plant.name} 已浇水！`);
    }
  }

  // 检查是否需要浇水
  needsWatering(plant) {
    const now = new Date();
    const lastWatered = new Date(plant.lastWatered);
    const daysSinceWatered = Math.floor((now - lastWatered) / (1000 * 60 * 60 * 24));
    return daysSinceWatered >= plant.wateringInterval;
  }

  // 本地存储
  savePlants() {
    localStorage.setItem('plantGuardianPlants', JSON.stringify(this.plants));
  }

  loadPlants() {
    const plantsData = localStorage.getItem('plantGuardianPlants');
    if (plantsData) {
      this.plants = JSON.parse(plantsData).map(plant => ({
        ...plant,
        lastWatered: new Date(plant.lastWatered),
        createdAt: new Date(plant.createdAt)
      }));
    } else {
      // 添加示例植物
      this.addPlant("绿萝", "Epipremnum aureum", 7);
      this.addPlant("仙人掌", "Cactaceae", 14);
      this.addPlant("吊兰", "Chlorophytum comosum", 5);
    }
  }
  
  // 保存环境数据历史
  saveEnvironmentHistory() {
    const history = this.getEnvironmentHistory();
    const now = new Date();
    const newDataPoint = {
      timestamp: now,
      temperature: this.environmentData.temperature,
      humidity: this.environmentData.humidity,
      lightLevel: this.environmentData.lightLevel
    };
    
    history.push(newDataPoint);
    
    // 只保留最近100个数据点
    if (history.length > 100) {
      history.shift();
    }
    
    localStorage.setItem('plantGuardianEnvHistory', JSON.stringify(history));
  }
  
  // 获取环境数据历史
  getEnvironmentHistory() {
    const historyData = localStorage.getItem('plantGuardianEnvHistory');
    if (historyData) {
      return JSON.parse(historyData).map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    }
    return [];
  }
  
  // 更新环境数据时保存历史
  updateEnvironmentData() {
    // 模拟环境数据变化
    this.environmentData.temperature = 20 + Math.sin(Date.now() / 100000) * 5; // 温度在15-25度之间波动
    this.environmentData.humidity = 40 + Math.cos(Date.now() / 80000) * 15;   // 湿度在25-55%之间波动
    this.environmentData.lightLevel = 50 + Math.sin(Date.now() / 120000) * 30; // 光照在20-80%之间波动
    
    // 更新UI显示
    document.getElementById('temperature-value').textContent = `${this.environmentData.temperature.toFixed(1)}°C`;
    document.getElementById('humidity-value').textContent = `${this.environmentData.humidity.toFixed(1)}%`;
    document.getElementById('light-value').textContent = `${this.environmentData.lightLevel.toFixed(1)}%`;
    
    // 更新环境状态文本
    this.updateEnvironmentStatus();
    
    // 保存环境数据到历史记录
    this.saveEnvironmentHistory();
    
    // 每30秒更新一次数据
    setTimeout(() => this.updateEnvironmentData(), 30000);
  }

  // UI 界面设置
  setupUI() {
    document.body.innerHTML = `
      <div class="plant-guardian-app">
        <header>
          <h1>🌿 绿植监护</h1>
          <p>智能植物护理助手</p>
        </header>
        
        <!-- 环境监测面板 -->
        <section class="environment-monitor">
          <h2>环境监测</h2>
          <div class="environment-cards">
            <div class="env-card">
              <div class="env-icon">🌡️</div>
              <div class="env-info">
                <h3>温度</h3>
                <p id="temperature-value">${this.environmentData.temperature}°C</p>
              </div>
            </div>
            <div class="env-card">
              <div class="env-icon">💧</div>
              <div class="env-info">
                <h3>湿度</h3>
                <p id="humidity-value">${this.environmentData.humidity}%</p>
              </div>
            </div>
            <div class="env-card">
              <div class="env-icon">☀️</div>
              <div class="env-info">
                <h3>光照</h3>
                <p id="light-value">${this.environmentData.lightLevel}%</p>
              </div>
            </div>
          </div>
          <div class="env-status">
            <p id="env-status-text">环境状态：适宜</p>
          </div>
        </section>
        
        <section class="controls">
          <button id="addPlantBtn" class="btn-primary">添加植物</button>
          <div class="search-box">
            <input type="text" id="searchInput" placeholder="搜索植物...">
          </div>
        </section>
        
        <section class="stats">
          <div class="stat-card">
            <h3>总植物数</h3>
            <p id="totalPlants">0</p>
          </div>
          <div class="stat-card">
            <h3>需要浇水</h3>
            <p id="needsWatering">0</p>
          </div>
          <div class="stat-card">
            <h3>健康植物</h3>
            <p id="healthyPlants">0</p>
          </div>
        </section>
        
        <section class="plants-list" id="plantsList">
          <!-- 植物列表将在这里渲染 -->
        </section>
        
        <!-- 添加植物模态框 -->
        <div id="addPlantModal" class="modal">
          <div class="modal-content">
            <span class="close">&times;</span>
            <h2>添加新植物</h2>
            <form id="plantForm">
              <div class="form-group">
                <label for="plantName">植物名称</label>
                <input type="text" id="plantName" required>
              </div>
              <div class="form-group">
                <label for="plantSpecies">植物种类</label>
                <input type="text" id="plantSpecies" required>
              </div>
              <div class="form-group">
                <label for="wateringInterval">浇水间隔（天）</label>
                <input type="number" id="wateringInterval" min="1" max="30" value="7" required>
              </div>
              <button type="submit" class="btn-primary">添加植物</button>
            </form>
          </div>
        </div>
        
        <div id="notification" class="notification"></div>
      </div>
    `;
    
    this.bindEvents();
    this.renderPlants();
  }

  bindEvents() {
    // 添加植物按钮
    document.getElementById('addPlantBtn').addEventListener('click', () => {
      document.getElementById('addPlantModal').style.display = 'block';
    });
    
    // 关闭模态框
    document.querySelector('.close').addEventListener('click', () => {
      document.getElementById('addPlantModal').style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
      const modal = document.getElementById('addPlantModal');
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    // 表单提交
    document.getElementById('plantForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('plantName').value;
      const species = document.getElementById('plantSpecies').value;
      const interval = parseInt(document.getElementById('wateringInterval').value);
      
      this.addPlant(name, species, interval);
      document.getElementById('addPlantModal').style.display = 'none';
      document.getElementById('plantForm').reset();
    });
    
    // 搜索功能
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.filterPlants(e.target.value);
    });
  }
  
  // 更新环境数据
  updateEnvironmentData() {
    // 模拟环境数据变化
    this.environmentData.temperature = 20 + Math.sin(Date.now() / 100000) * 5; // 温度在15-25度之间波动
    this.environmentData.humidity = 40 + Math.cos(Date.now() / 80000) * 15;   // 湿度在25-55%之间波动
    this.environmentData.lightLevel = 50 + Math.sin(Date.now() / 120000) * 30; // 光照在20-80%之间波动
    
    // 更新UI显示
    document.getElementById('temperature-value').textContent = `${this.environmentData.temperature.toFixed(1)}°C`;
    document.getElementById('humidity-value').textContent = `${this.environmentData.humidity.toFixed(1)}%`;
    document.getElementById('light-value').textContent = `${this.environmentData.lightLevel.toFixed(1)}%`;
    
    // 更新环境状态文本
    this.updateEnvironmentStatus();
    
    // 每30秒更新一次数据
    setTimeout(() => this.updateEnvironmentData(), 30000);
  }
  
  // 更新环境状态文本
  updateEnvironmentStatus() {
    let statusText = '环境状态：';
    let isOptimal = true;
    
    if (this.environmentData.temperature < 18 || this.environmentData.temperature > 28) {
      statusText += '温度不适宜 ';
      isOptimal = false;
    }
    
    if (this.environmentData.humidity < 30 || this.environmentData.humidity > 70) {
      statusText += '湿度不适宜 ';
      isOptimal = false;
    }
    
    if (this.environmentData.lightLevel < 30 || this.environmentData.lightLevel > 80) {
      statusText += '光照不适宜 ';
      isOptimal = false;
    }
    
    if (isOptimal) {
      statusText += '适宜';
      document.getElementById('env-status-text').style.color = '#4caf50';
    } else {
      document.getElementById('env-status-text').style.color = '#ff9800';
    }
    
    document.getElementById('env-status-text').textContent = statusText;
  }

  renderPlants(filter = '') {
    const plantsList = document.getElementById('plantsList');
    const filteredPlants = this.plants.filter(plant => 
      plant.name.toLowerCase().includes(filter.toLowerCase()) || 
      plant.species.toLowerCase().includes(filter.toLowerCase())
    );
    
    plantsList.innerHTML = filteredPlants.map(plant => {
      const needsWater = this.needsWatering(plant);
      const lastWatered = new Date(plant.lastWatered).toLocaleDateString();
      
      return `
        <div class="plant-card ${needsWater ? 'needs-water' : 'healthy'}">
          <div class="plant-image">
            <img src="${plant.image}" alt="${plant.name}">
          </div>
          <div class="plant-info">
            <h3>${plant.name}</h3>
            <p class="species">${plant.species}</p>
            <p class="last-watered">上次浇水: ${lastWatered}</p>
            <div class="plant-status">
              <span class="status ${needsWater ? 'needs-water' : 'healthy'}">
                ${needsWater ? '💧 需要浇水' : '💚 健康'}
              </span>
            </div>
            <div class="plant-actions">
              <button class="btn-water" onclick="plantGuardian.waterPlant(${plant.id})">
                ${needsWater ? '💧 浇水' : '💧 再次浇水'}
              </button>
              <button class="btn-delete" onclick="plantGuardian.deletePlant(${plant.id})">🗑️ 删除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // 更新统计信息
    this.updateStats();
  }

  filterPlants(searchTerm) {
    const filteredPlants = this.plants.filter(plant => 
      plant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      plant.species.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const plantsList = document.getElementById('plantsList');
    plantsList.innerHTML = filteredPlants.map(plant => {
      const needsWater = this.needsWatering(plant);
      const lastWatered = new Date(plant.lastWatered).toLocaleDateString();
      
      return `
        <div class="plant-card ${needsWater ? 'needs-water' : 'healthy'}">
          <div class="plant-image">
            <img src="${plant.image}" alt="${plant.name}">
          </div>
          <div class="plant-info">
            <h3>${plant.name}</h3>
            <p class="species">${plant.species}</p>
            <p class="last-watered">上次浇水: ${lastWatered}</p>
            <div class="plant-status">
              <span class="status ${needsWater ? 'needs-water' : 'healthy'}">
                ${needsWater ? '💧 需要浇水' : '💚 健康'}
              </span>
            </div>
            <div class="plant-actions">
              <button class="btn-water" onclick="plantGuardian.waterPlant(${plant.id})">
                ${needsWater ? '💧 浇水' : '💧 再次浇水'}
              </button>
              <button class="btn-delete" onclick="plantGuardian.deletePlant(${plant.id})">🗑️ 删除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    this.updateStats();
  }

  updateStats() {
    document.getElementById('totalPlants').textContent = this.plants.length;
    document.getElementById('needsWatering').textContent = this.plants.filter(p => this.needsWatering(p)).length;
    document.getElementById('healthyPlants').textContent = this.plants.filter(p => !this.needsWatering(p)).length;
  }

  startMonitoring() {
    // 定期检查浇水提醒
    setInterval(() => {
      this.checkReminders();
    }, 60000); // 每分钟检查一次
  }

  checkReminders() {
    const plantsNeedingWater = this.plants.filter(plant => this.needsWatering(plant));
    if (plantsNeedingWater.length > 0) {
      // 有植物需要浇水，可以发送通知
      plantsNeedingWater.forEach(plant => {
        if (!plant.lastReminder || new Date() - new Date(plant.lastReminder) > 24 * 60 * 60 * 1000) { // 24小时
          this.showNotification(`提醒：${plant.name} 需要浇水了！`);
          plant.lastReminder = new Date();
        }
      });
    }
  }

  showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show';
    
    setTimeout(() => {
      notification.className = 'notification';
    }, 3000);
  }
}

// 初始化应用
let plantGuardian;
document.addEventListener('DOMContentLoaded', () => {
  plantGuardian = new PlantGuardian();
});