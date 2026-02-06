/**
 * WeChat Login Modal Component
 * 微信二维码登录弹窗
 */

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WechatLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export function WechatLoginModal({ isOpen, onClose, onLoginSuccess }: WechatLoginModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const handleScanComplete = () => {
    setIsScanning(true);
    // Simulate scanning process
    setTimeout(() => {
      setScanComplete(true);
      // Simulate login process
      setTimeout(() => {
        onLoginSuccess?.();
        // Reset state
        setTimeout(() => {
          setIsScanning(false);
          setScanComplete(false);
          onClose();
        }, 1000);
      }, 1500);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">微信扫码登录</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-8">
          {/* QR Code Area */}
          <div className="relative mb-6">
            <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
              {/* Simulated QR Code */}
              <svg
                className="w-40 h-40 text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-4h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3z" />
              </svg>

              {/* Scanning Animation */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-700 font-medium">扫描中...</p>
                  </div>
                </div>
              )}

              {/* Scan Complete */}
              {scanComplete && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">扫描成功</p>
                  </div>
                </div>
              )}
            </div>

            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-600" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-600" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-600" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-600" />
          </div>

          {/* Instructions */}
          <div className="text-center mb-6">
            <p className="text-slate-700 font-medium mb-2">打开微信扫一扫</p>
            <p className="text-sm text-slate-500">扫描二维码即可登录和注册</p>
          </div>

          {/* Demo Button */}
          {!isScanning && !scanComplete && (
            <button
              onClick={handleScanComplete}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              模拟扫描
            </button>
          )}

          {/* Divider */}
          <div className="w-full my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-slate-500">或</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Alternative Login Methods */}
          <div className="w-full space-y-2">
            <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-slate-700 hover:bg-gray-50 transition-colors font-medium text-sm">
              手机号登录
            </button>
            <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-slate-700 hover:bg-gray-50 transition-colors font-medium text-sm">
              邮箱登录
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
