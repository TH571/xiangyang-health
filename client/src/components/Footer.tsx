/**
 * Footer Component
 * 页脚信息、链接和社交媒体
 */

import { useLocation } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [, navigate] = useLocation();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-gray-300 mt-20">
      <div className="container py-16">
        {/* Main Footer Content */}
        <div className="mb-12">
          {/* Brand - 移动端单独一行居中，桌面端第一列 */}
          <div className="text-center mb-8 md:mb-0 md:text-left md:grid md:grid-cols-4 md:gap-8 lg:gap-12">
            <div className="space-y-5 md:col-span-1">
              <div className="flex items-center gap-2.5 justify-center md:justify-start">
                <img
                  src="https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/images/logo.png"
                  alt="向阳健康"
                  className="w-10 h-10 rounded-xl shadow-lg object-cover"
                />
                <span className="font-bold text-white text-lg">向阳健康</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed hidden md:block">
                以光为引，以知为翼，守护浙工大人在健康之路上温暖前行
              </p>
            </div>
          </div>

          {/* 公司、服务、关注我们 - 移动端一行三列分散显示，桌面端后三列 */}
          <div className="grid grid-cols-3 gap-4 md:grid-cols-4 md:gap-8 lg:gap-12 md:-mt-[88px]">
            {/* Links - Company */}
            <div className="text-center md:col-span-1 md:col-start-2">
              <h3 className="font-bold text-white mb-4 text-sm md:text-base md:mb-5">公司</h3>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
                <li>
                  <button
                    onClick={() => navigate("/about")}
                    className="hover:text-orange-400 transition-colors duration-200 relative group"
                  >
                    关于我们
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/about")}
                    className="hover:text-orange-400 transition-colors duration-200 relative group"
                  >
                    联系我们
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Links - Services */}
            <div className="text-center md:col-span-1">
              <h3 className="font-bold text-white mb-4 text-sm md:text-base md:mb-5">服务</h3>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
                <li>
                  <button
                    onClick={() => navigate("/services")}
                    className="hover:text-orange-400 transition-colors duration-200 relative group"
                  >
                    健康服务
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/selection")}
                    className="hover:text-orange-400 transition-colors duration-200 relative group"
                  >
                    向阳优品
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/privacy")}
                    className="hover:text-orange-400 transition-colors duration-200 relative group"
                  >
                    隐私政策
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div className="text-center md:col-span-1">
              <h3 className="font-bold text-white mb-4 text-sm md:text-base md:mb-5">关注我们</h3>
              <div className="flex gap-2 md:gap-3 justify-center">
                <button
                  onClick={() => navigate("/frontiers")}
                  className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-600/25"
                >
                  <span className="text-xs font-bold text-gray-400">NEWS</span>
                </button>
                <button
                  onClick={() => navigate("/lectures")}
                  className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-600/25"
                >
                  <span className="text-xs font-bold text-gray-400">讲堂</span>
                </button>
                <button
                  onClick={() => navigate("/science")}
                  className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-600/25"
                >
                  <span className="text-xs font-bold text-gray-400">科普</span>
                </button>
                <button
                  onClick={() => navigate("/workers")}
                  className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-600/25"
                >
                  <span className="text-xs font-bold text-gray-400">健康人</span>
                </button>
              </div>
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
            <button
              onClick={() => navigate("/privacy")}
              className="hover:text-orange-400 transition-colors duration-200 relative group"
            >
              隐私政策
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
            </button>
            <button
              onClick={() => navigate("/about")}
              className="hover:text-orange-400 transition-colors duration-200 relative group"
            >
              服务条款
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
            </button>
            <button
              onClick={() => navigate("/about")}
              className="hover:text-orange-400 transition-colors duration-200 relative group"
            >
              联系我们
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 group-hover:w-full transition-all duration-200" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
