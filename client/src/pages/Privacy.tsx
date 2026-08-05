/**
 * Privacy Page
 * 隐私政策
 */

import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Shield } from 'lucide-react';

export function PrivacyPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={(path) => navigate(path)} />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 text-white bg-gradient-to-r from-slate-700 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>

          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-8 h-8 text-orange-400" />
            <h1 className="text-4xl md:text-5xl font-bold">隐私政策</h1>
          </div>
          <p className="text-lg text-white/90 max-w-2xl">
            向阳健康（xyjk.ren）重视您的隐私。本政策说明我们如何收集、使用和保护您的个人信息。
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white flex-1">
        <div className="container max-w-3xl">
          <div className="space-y-10">
            <Section
              title="一、信息收集"
              content="我们在您使用网站服务时可能收集以下信息：您主动提供的个人信息（如姓名、联系方式）；使用过程中自动收集的技术信息（如IP地址、浏览器类型、访问时间）；以及通过Cookie等工具收集的偏好信息。"
            />
            <Section
              title="二、信息使用"
              content="收集的信息用于：向您提供健康科普内容和服务；改善用户体验和优化网站功能；与您沟通，回复您的咨询和反馈；遵守法律法规要求。我们不会将您的个人信息用于本政策未载明的其他用途。"
            />
            <Section
              title="三、信息保护"
              content="我们采取合理的技术和管理措施保护您的个人信息安全，包括SSL加密传输、访问权限控制、数据备份等。但请注意，互联网上的数据传输不能保证100%的安全。"
            />
            <Section
              title="四、信息共享"
              content="我们不会向第三方出售您的个人信息。在以下情况下可能会共享信息：获得您的明确同意；法律法规要求；保护向阳健康、用户或公众的合法权益。"
            />
            <Section
              title="五、Cookie 使用"
              content="本网站使用Cookie和类似技术来改善用户体验、分析网站流量。您可以通过浏览器设置管理Cookie偏好。禁用Cookie可能影响部分功能的正常使用。"
            />
            <Section
              title="六、第三方链接"
              content="本网站可能包含第三方网站的链接。我们对这些网站的隐私实践不承担责任，建议您查阅其隐私政策。"
            />
            <Section
              title="七、政策更新"
              content="我们可能会不时更新本隐私政策。重大变更时，我们会通过网站公告或直接通知的方式告知您。继续使用本网站即表示您同意更新后的政策。"
            />
            <Section
              title="八、联系我们"
              content="如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：邮箱 info-xyjk@xyjk.ren"
            />
          </div>

          <div className="mt-10 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500">
              最后更新日期：2026年8月
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
      <p className="text-slate-600 leading-relaxed">{content}</p>
    </div>
  );
}