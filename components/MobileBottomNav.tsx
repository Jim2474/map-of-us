"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Heart,
  Map as MapIcon,
  Settings,
} from "lucide-react";

type NavTab = {
  key: string;
  label: string;
  icon: typeof MapIcon;
  href: string;
  match: (path: string) => boolean;
};

const navTabs: NavTab[] = [
  {
    key: "map",
    label: "地图",
    icon: MapIcon,
    href: "/map",
    match: (path) => path === "/map" || path.startsWith("/province") || path.startsWith("/city"),
  },
  {
    key: "memories",
    label: "回忆",
    icon: BookOpen,
    href: "/memories",
    match: (path) => path.startsWith("/memories"),
  },
  {
    key: "favorites",
    label: "收藏",
    icon: Heart,
    href: "/favorites",
    match: (path) => path.startsWith("/favorites"),
  },
  {
    key: "anniversaries",
    label: "纪念日",
    icon: CalendarDays,
    href: "/anniversaries",
    match: (path) => path.startsWith("/anniversaries"),
  },
  {
    key: "settings",
    label: "设置",
    icon: Settings,
    href: "/settings",
    match: (path) => path.startsWith("/settings") || path.startsWith("/time-capsule"),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Do not show on entry/login page
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 block border-t border-[#D8DDD8]/80 bg-[#FAFBF7]/94 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(90,102,112,0.08)] backdrop-blur-lg lg:hidden"
      aria-label="移动端底部导航"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] py-1 text-center transition active:scale-95 ${
                active
                  ? "font-semibold text-[#D86F82]"
                  : "text-[#5A6670]/65 hover:text-[#5A6670]"
              }`}
            >
              <div
                className={`grid h-8 w-11 place-items-center rounded-full transition ${
                  active ? "bg-[#F5DCE0]/80 text-[#D86F82]" : "text-current"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] leading-tight tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
