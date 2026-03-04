/**
 * Header Component
 * 固定顶部导航栏，包含 Logo 和菜单
 * Design Philosophy: 清晰的信息架构 - 严格的排版层级和充足的空白
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  onNavigate?: (path: string) => void;
}

const navItems = [
  { label: "主页", href: "/" },
  { label: "健康工大人", href: "/workers" },
  { label: "向阳优选", href: "/selection" },
  { label: "健康讲堂", href: "/lectures" },
  { label: "健康前沿", href: "/frontiers" },
  { label: "健康科普", href: "/science" },
  { label: "关于我们", href: "/about" },
];

export function Header({ onNavigate }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  // Check if a nav item is active
  const isActive = (href: string) => {
    // Exact match for home
    if (href === "/") return location === "/";
    // Prefix match for other routes
    return location.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 shadow-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => onNavigate?.("/")}
        >
          <img
            src="/images/logo.png"
            alt="向阳健康"
            className="w-11 h-11 transition-all duration-300 group-hover:scale-105 object-cover"
          />
          <div className="flex flex-col">
            <span className={`text-lg font-bold transition-colors duration-300 ${
              isActive("/") ? "text-orange-600" : "text-slate-800 group-hover:text-orange-600"
            }`}>
              向阳健康
            </span>
            <span className="text-xs text-orange-600 font-semibold group-hover:text-orange-700 transition-colors duration-300">
              知库
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => onNavigate?.(item.href)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative group ${
                  active
                    ? "text-orange-600 bg-orange-50/90"
                    : "text-slate-700 hover:text-orange-600 hover:bg-orange-50/80"
                }`}
              >
                {item.label}
                <span className={`absolute bottom-0 left-1/2 h-0.5 bg-orange-600 transition-all duration-200 ${
                  active ? "w-1/2 left-1/4" : "w-0 group-hover:w-1/2 group-hover:left-1/4"
                }`} />
              </button>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-slate-700" />
          ) : (
            <Menu className="w-6 h-6 text-slate-700" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-md animate-fade-in">
          <nav className="container py-4 space-y-2">
            {navItems.map(item => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    onNavigate?.(item.href);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    active
                      ? "text-orange-600 bg-orange-50/90"
                      : "text-slate-700 hover:text-orange-600 hover:bg-orange-50/80"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
