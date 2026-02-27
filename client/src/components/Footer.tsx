/**
 * Footer Component
 * 页脚信息、链接和社交媒体
 */

import { Facebook, Instagram, Twitter, Music } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-gray-300 mt-20">
      <div className="container py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand - 移动端居中显示，桌面端正常 */}
          <div className="space-y-5 text-center md:text-left">
            <div className="flex items-center gap-2.5 justify-center md:justify-start">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg">
                <span className="text-white font-bold text-base">向</span>
              </div>
              <span className="font-bold text-white text-lg">向阳健康</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              以光为引，以知为翼，守护工大人在健康之路上温暖前行
            </p>
          </div>

          {/* 移动端：公司、服务、关注我们 一行三列显示 */}
          {/* Links - Company */}
          <div className="text-center">
            <h3 className="font-bold text-white mb-4 text-sm md:text-base md:mb-5">公司</h3>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-orange-400 transition-colors duration-200 relative group"
                >
                  关于我们
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-orange-400 transition-colors duration-200 relative group"
                >
                  联系我们
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-orange-400 transition-colors duration-200 relative group"
                >
                  加入我们
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                </a>
              </li>
            </ul>
          </div>

          {/* Links - Services */}
          <div className="text-center">
            <h3 className="font-bold text-white mb-4 text-sm md:text-base md:mb-5">服务</h3>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-orange-400 transition-colors duration-200 relative group"
                >
                  服务项目
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-orange-400 transition-colors duration-200 relative group"
                >
                  检测支持
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-orange-400 transition-colors duration-200 relative group"
                >
                  隐私政策
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="text-center">
            <h3 className="font-bold text-white mb-4 text-sm md:text-base md:mb-5">关注我们</h3>
            <div className="flex gap-2 md:gap-3 justify-center">
              <a
                href="#"
                className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-600/25"
              >
                <Facebook className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a
                href="#"
                className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-600/25"
              >
                <Instagram className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a
                href="#"
                className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-600/25"
              >
                <Twitter className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a
                href="#"
                className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-600/25"
              >
                <Music className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-10" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p className="text-sm">
            &copy; {currentYear} 向阳健康. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a
              href="#"
              className="hover:text-orange-400 transition-colors duration-200 relative group"
            >
              隐私政策
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
            </a>
            <a
              href="#"
              className="hover:text-orange-400 transition-colors duration-200 relative group"
            >
              服务条款
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
            </a>
            <a
              href="#"
              className="hover:text-orange-400 transition-colors duration-200 relative group"
            >
              联系我们
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
