# Map of Us — 项目交接文档

> 本文档记录了截至 2026-07-17 为止的所有开发工作，供下一位 AI 或开发者无缝接手。

---

## 一、项目基本信息

| 项 | 内容 |
|---|---|
| **项目名称** | Map of Us |
| **描述** | 本地优先的情侣足迹地图桌面 App（Electron + Next.js） |
| **GitHub 仓库** | https://github.com/Jim2474/map-of-us |
| **本地路径** | `/Users/jim./Vibecoding/map-of-us-template-main` |
| **主分支** | `main` |
| **当前版本** | `0.1.3`（package.json） |
| **最新 commit** | `e38ec71` — feat: 城市精细地图功能 |

---

## 二、技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Next.js 16.2.10（App Router，Turbopack） |
| UI 运行时 | React 19 |
| 桌面壳 | Electron 42 |
| 地图（全国/省份） | D3-geo（自绘 SVG） |
| 地图（城市详情） | Leaflet + React-Leaflet（OSM 瓦片） |
| 动效 | Framer Motion 12 |
| 图标 | Lucide React |
| 样式 | Tailwind CSS 4 + Vanilla CSS |
| 数据存储 | 本地 JSON 文件（data/*.private.json）或 Supabase |
| 语言 | TypeScript |

---

## 三、本地开发启动

```bash
cd /Users/jim./Vibecoding/map-of-us-template-main
npm run dev          # Web 版（端口 3002）
npm run desktop      # 桌面版（Electron）
```

> ⚠️ 同一时间只能运行一个 Next.js 实例。启动 desktop 前先 pkill -f "next dev"

---

## 四、环境变量（.env.local）

```
SITE_PASSWORD=1234
ADMIN_PASSWORD=admin1234
AUTH_COOKIE_SECRET=some-default-random-secret-key-12345
SUPABASE_STORAGE_BUCKET=map-of-us
```

Cookie 名：
- mapofus_session — 普通用户 session（30天）
- mapofus_admin — 管理员 session（8小时）

---

## 五、目录结构

```
map-of-us-template-main/
├── app/
│   ├── api/
│   │   ├── memories/route.ts     # 回忆 CRUD（支持 spotId）
│   │   ├── spots/route.ts        # 🆕 城市地点 CRUD
│   │   ├── auth/                 # 登录/登出
│   │   └── city-assets/          # 城市地标图上传
│   ├── city/[cityId]/page.tsx    # 🆕 城市详情页（Leaflet）
│   ├── province/[id]/page.tsx    # 省份地图页
│   ├── map/                      # 全国地图
│   ├── settings/                 # 设置页
│   └── ...
│
├── components/
│   ├── ChinaMap.tsx              # 全国地图 SVG
│   ├── ProvinceMap.tsx           # 省份地图 SVG（含「进城探索」按钮）
│   ├── CityDetailPage.tsx        # 🆕 Leaflet 城市地图主组件
│   ├── CityDetailPageClient.tsx  # 🆕 Leaflet SSR 隔离包装（"use client"）
│   ├── SpotMemoryPanel.tsx       # 🆕 地点回忆卡片
│   └── ...
│
├── data/
│   ├── spots.ts                  # 🆕 Spot 类型 + 桂林默认地点 + hasCityDetail()
│   ├── memories.ts               # Memory 接口（含 spotId? 字段）
│   ├── cities.ts                 # 全国城市列表
│   ├── provinces.ts              # 省份列表
│   ├── china-geo.json            # 全国 GeoJSON（582KB）
│   └── localMemories.private.json  # 用户数据（gitignore）
│
└── lib/server/
    ├── auth.ts                   # HMAC signed cookie 认证
    └── dataDir.ts                # 数据目录路径
```

---

## 六、数据模型

### Memory（回忆）
```typescript
interface Memory {
  id: string;
  cityId: string;       // 如 "guilin"
  city: string;         // 城市中文名
  cityEn: string;
  date: string;         // 格式 "2024.05.20"
  image: string;        // 封面图
  photos?: string[];
  text: string;         // 最长 80 字
  createdAt?: string;
  spotId?: string;      // 🆕 关联地点 ID（可选）
}
```

### Spot（具体地点）
```typescript
interface Spot {
  id: string;           // 如 "spot-guilin-gxnu-yanshan"
  cityId: string;
  name: string;         // 最长 20 字
  description?: string; // 最长 100 字
  lat: number;          // WGS84 纬度
  lng: number;
  emoji?: string;
  createdAt?: string;
}
```

---

## 七、API 路由

### /api/memories
- GET — 读取全部回忆（普通用户）
- POST — 新增回忆，支持 spotId 字段（管理员）
- PATCH — 编辑/换封面（管理员）
- DELETE — 删除（管理员）

### /api/spots（🆕）
- GET ?cityId=guilin — 读取城市地点（普通用户）
- POST — 新增地点（管理员）
- PATCH — 编辑地点（管理员）
- DELETE — 删除地点（管理员）

首次读取桂林若无本地数据，自动返回 7 个预置地点。

---

## 八、用户交互路径

```
登录 → 全国地图(/map)
  → 点击广西省 → 省份地图(/province/guangxi)
  → 点击桂林 → 城市回忆卡片（浮层）
  → 点击「🗺️ 进城探索·桂林专属地图」
  → Leaflet城市地图(/city/guilin)
  → 点击地图标记 → SpotMemoryPanel（添加/查看回忆）
  → 管理员右键地图 → 新建地点表单
```

---

## 九、桂林预置地点（data/spots.ts）

| 地点名称 | Emoji | 坐标 |
|---------|-------|------|
| 象山公园 | 🐘 | 25.2713°N, 110.2979°E |
| 漓江风景区 | 🌊 | 25.2780°N, 110.3062°E |
| 正阳步行街 | 🛍️ | 25.2821°N, 110.2895°E |
| 广西师范大学雁山校区 | 🎓 | 25.0728°N, 110.3031°E |
| 广西师范大学王城校区 | 🏰 | 25.2796°N, 110.2893°E |
| 叠彩山 | ⛰️ | 25.2960°N, 110.2893°E |
| 七星公园 | ⭐ | 25.2721°N, 110.3240°E |

---

## 十、已知 Bug 修复记录

### Bug 1: 指针捕获阻断点击事件（已修复）
- **文件**：ChinaMap.tsx、ProvinceMap.tsx
- **原因**：pointerdown 时立即 setPointerCapture，子元素无法接收 click
- **修复**：位移 > 6px 才捕获，正常单击穿透

### Bug 2: Google Fonts Turbopack 编译失败（已修复）
- **文件**：app/layout.tsx、app/globals.css
- **原因**：Turbopack 离线无法解析 @vercel/turbopack-next/internal/font/google/font
- **修复**：删除 next/font/google，改用系统字体栈

### Bug 3: Leaflet SSR 限制（已修复）
- **文件**：app/city/[cityId]/page.tsx、components/CityDetailPageClient.tsx
- **原因**：Next.js 16 Server Component 不支持 dynamic(..., {ssr:false})
- **修复**：新增 CityDetailPageClient.tsx ("use client") 承接动态导入

---

## 十一、扩展新城市详情页

当前只有桂林开放（data/spots.ts）：

```typescript
export const cityDetailEnabled = new Set<string>(["guilin"]);
```

新增城市步骤：
1. 在 cityDetailEnabled 加入城市 ID
2. 仿照 guilinDefaultSpots 添加该城市默认地点数组
3. 在 readSpotStore() 中加入新城市的默认数据回退

---

## 十二、Leaflet 技术细节

- 底图：OSM 瓦片（需要网络）
- 粉色滤镜：.leaflet-tile-container { filter: saturate(0.85) hue-rotate(10deg) }
- 自定义 Marker：L.divIcon 渲染 CSS 心形，有回忆→粉色，无回忆→灰色
- Leaflet 图标 Bug：已在 CityDetailPage.tsx 顶部 delete _getIconUrl 修复
- 右键新建：MapClickHandler 监听 contextmenu 事件

---

## 十三、待完成工作

### 高优先级
- [ ] 端到端测试：登录→广西→桂林→进城探索→添加地点→添加回忆
- [ ] 地点删除 UI：侧栏列表中加删除按钮（API 已支持）

### 中优先级
- [ ] 地点编辑：管理员点击标记后能修改名称/描述/emoji
- [ ] 地图控件位置：移到右下角避免与返回按钮冲突
- [ ] 移动端适配：SpotMemoryPanel 在手机竖屏从底部弹出

### 低优先级
- [ ] 更多城市开放（配置简单）
- [ ] 自定义底图上传（用户上传手绘/截图替代 OSM）
- [ ] 地图离线支持（Protomaps 或本地缓存）

---

## 十四、关键文件速查

| 需求 | 文件 |
|------|------|
| 新增城市支持 | data/spots.ts → cityDetailEnabled |
| 修改地图配色 | components/CityDetailPage.tsx → colors |
| 修改心形 Marker | components/CityDetailPage.tsx → createSpotIcon() |
| 修改回忆卡片 UI | components/SpotMemoryPanel.tsx |
| 省份地图指针逻辑 | components/ProvinceMap.tsx L743-L847 |
| 全国地图指针逻辑 | components/ChinaMap.tsx L181-L225 |
| 认证逻辑 | lib/server/auth.ts |
| Electron 主进程 | electron/main.js |

---

> 📅 文档更新时间：2026-07-17  
> ✍️ 由 Antigravity AI 撰写
