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

// 桂林默认预置地点（用户可以继续添加更多）
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
    id: "spot-guilin-qianmen",
    cityId: "guilin",
    name: "七星公园",
    description: "桂林最大的综合性公园",
    lat: 25.2721,
    lng: 110.3240,
    emoji: "⭐",
  },
];

// 支持「城市详情地图」的城市列表（初期只开放桂林）
export const cityDetailEnabled = new Set<string>(["guilin"]);

export const hasCityDetail = (cityId: string) => cityDetailEnabled.has(cityId);
