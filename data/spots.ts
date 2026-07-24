export interface Spot {
  id: string;
  cityId: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  emoji?: string; // 可自定义图标 emoji，默认 ❤️
  createdAt?: string;
}

export type SpotStore = Record<string, Spot[]>;

// ── 桂林默认预置地点 ───────────────────────────────────────
export const guilinDefaultSpots: Spot[] = [
  {
    id: "spot-guilin-xiangshan",
    cityId: "guilin",
    name: "象山公园",
    description: "桂林最标志性的景点，象鼻山",
    lat: 25.2713,
    lng: 110.2979,
    emoji: "🐘",
  },
  {
    id: "spot-guilin-lijiang",
    cityId: "guilin",
    name: "漓江风景区",
    description: "桂林山水甲天下，漓江是核心",
    lat: 25.2780,
    lng: 110.3062,
    emoji: "🌊",
  },
  {
    id: "spot-guilin-zhengyang",
    cityId: "guilin",
    name: "正阳步行街",
    description: "桂林最热闹的商业步行街",
    lat: 25.2821,
    lng: 110.2895,
    emoji: "🛍️",
  },
  {
    id: "spot-guilin-gxnu-yanshan",
    cityId: "guilin",
    name: "广西师范大学雁山校区",
    description: "我们上大学的地方 💕",
    lat: 25.0728,
    lng: 110.3031,
    emoji: "🎓",
  },
  {
    id: "spot-guilin-gxnu-wangcheng",
    cityId: "guilin",
    name: "广西师范大学王城校区",
    description: "桂林市中心的历史校区",
    lat: 25.2796,
    lng: 110.2893,
    emoji: "🏰",
  },
  {
    id: "spot-guilin-diecai",
    cityId: "guilin",
    name: "叠彩山",
    description: "可以俯瞰整个桂林市区的山",
    lat: 25.2960,
    lng: 110.2893,
    emoji: "⛰️",
  },
  {
    id: "spot-guilin-qixing",
    cityId: "guilin",
    name: "七星公园",
    description: "桂林最大的综合性公园",
    lat: 25.2721,
    lng: 110.3240,
    emoji: "⭐",
  },
];

// ── 柳州默认预置地点 ───────────────────────────────────────
export const liuzhouDefaultSpots: Spot[] = [
  {
    id: "spot-liuzhou-liuhou",
    cityId: "city-450200",
    name: "柳侯公园",
    description: "纪念唐代文学家柳宗元的古典园林",
    lat: 24.3213,
    lng: 109.4111,
    emoji: "🏯",
  },
  {
    id: "spot-liuzhou-malushan",
    cityId: "city-450200",
    name: "马鹿山奇石博览园",
    description: "世界最大奇石展览地，石头的王国",
    lat: 24.3297,
    lng: 109.4447,
    emoji: "🪨",
  },
  {
    id: "spot-liuzhou-wenhuiqiao",
    cityId: "city-450200",
    name: "文惠桥",
    description: "跨越柳江的标志性大桥，夜景绝美",
    lat: 24.3111,
    lng: 109.4136,
    emoji: "🌉",
  },
  {
    id: "spot-liuzhou-luosifen",
    cityId: "city-450200",
    name: "螺蛳粉美食街",
    description: "柳州灵魂美食，酸辣鲜香臭香四绝",
    lat: 24.3263,
    lng: 109.4052,
    emoji: "🍜",
  },
  {
    id: "spot-liuzhou-yufeng",
    cityId: "city-450200",
    name: "鱼峰公园",
    description: "传说刘三姐在此对歌飞升的山峰",
    lat: 24.3001,
    lng: 109.4258,
    emoji: "🐟",
  },
  {
    id: "spot-liuzhou-liujiang",
    cityId: "city-450200",
    name: "柳江滨水步道",
    description: "沿柳江漫步，感受慢生活城市风光",
    lat: 24.3180,
    lng: 109.4200,
    emoji: "🚶",
  },
];

// ── 玉林默认预置地点 ───────────────────────────────────────
export const yulinDefaultSpots: Spot[] = [
  {
    id: "spot-yulin-yuntian",
    cityId: "city-450900",
    name: "云天文化城",
    description: "广西的布达拉宫，宏大的仿古建筑群",
    lat: 22.6441,
    lng: 110.1502,
    emoji: "🏛️",
  },
  {
    id: "spot-yulin-tongshiling",
    cityId: "city-450900",
    name: "铜石岭旅游度假区",
    description: "北流境内的山岳型旅游胜地",
    lat: 22.4850,
    lng: 110.3420,
    emoji: "⛰️",
  },
  {
    id: "spot-yulin-yuzhoudadao",
    cityId: "city-450900",
    name: "玉州大道商圈",
    description: "玉林市区核心商业区，繁华购物地",
    lat: 22.6350,
    lng: 110.1538,
    emoji: "🛍️",
  },
  {
    id: "spot-yulin-nanliujiang",
    cityId: "city-450900",
    name: "南流江滨江公园",
    description: "沿南流江的市民休闲公园",
    lat: 22.6290,
    lng: 110.1580,
    emoji: "🌿",
  },
  {
    id: "spot-yulin-renjian",
    cityId: "city-450900",
    name: "人间烟火夜市",
    description: "玉林人最爱的夜宵大排档，牛腩粉必吃",
    lat: 22.6380,
    lng: 110.1490,
    emoji: "🌙",
  },
  {
    id: "spot-yulin-yulinpark",
    cityId: "city-450900",
    name: "玉林人民公园",
    description: "市区最大的综合性公园，早晨遛弯胜地",
    lat: 22.6420,
    lng: 110.1560,
    emoji: "🌸",
  },
];

// ── 所有城市默认地点映射 ───────────────────────────────────
export const defaultSpotsByCity: Record<string, Spot[]> = {
  guilin: guilinDefaultSpots,
  "city-450200": liuzhouDefaultSpots,
  "city-450900": yulinDefaultSpots,
};

// 支持「城市详情地图」的城市列表
export const cityDetailEnabled = new Set<string>([
  "guilin",
  "city-450200", // 柳州
  "city-450900", // 玉林
]);

export const hasCityDetail = (cityId: string) => cityDetailEnabled.has(cityId);
