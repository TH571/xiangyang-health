/**
 * Services Page
 * 健康服务 - 检验检测、认证等服务内容
 */

import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft, FlaskConical, ShieldCheck, ClipboardCheck, Microscope, FileSearch, Users } from 'lucide-react';

const services = [
  {
    icon: FlaskConical,
    title: '检验检测服务',
    desc: '提供食品、农产品、水质、环境等领域的专业检验检测服务，出具权威检测报告，确保产品安全合规。',
    items: ['食品营养成分检测', '农残及重金属检测', '水质安全检测', '环境监测与评估', '微生物检测与分析'],
  },
  {
    icon: ShieldCheck,
    title: '认证服务',
    desc: '为企业提供ISO体系认证、产品认证等服务，帮助企业建立标准化管理体系，提升市场竞争力。',
    items: ['ISO 9001 质量管理体系', 'ISO 14001 环境管理体系', 'ISO 45001 职业健康安全', 'HACCP 食品安全体系', '有机产品认证'],
  },
  {
    icon: ClipboardCheck,
    title: '健康评估与咨询',
    desc: '提供个人及团体健康评估服务，结合科学检测数据，出具个性化健康改善方案。',
    items: ['健康风险评估', '体质检测与分析', '营养状况评估', '慢性病风险筛查', '个性化健康指导'],
  },
  {
    icon: Microscope,
    title: '实验室技术服务',
    desc: '依托专业实验室资源，提供检测方法开发、技术培训、实验室建设咨询等技术支持服务。',
    items: ['检测方法开发与验证', '实验室技术培训', '实验室质量管理咨询', '仪器设备选型建议', '能力验证与比对'],
  },
  {
    icon: FileSearch,
    title: '标准与法规服务',
    desc: '跟踪国内外健康及检测行业标准法规动态，为企业提供合规性审查和标准解读服务。',
    items: ['标准法规动态跟踪', '产品合规性审查', '标签标识审核', '进出口合规咨询', '企业标准编写指导'],
  },
  {
    icon: Users,
    title: '校企合作与培训',
    desc: '依托浙江工业大学科研资源，开展校企合作项目，培养检测与健康管理专业人才。',
    items: ['实习实训基地建设', '联合科研项目', '职业技能培训', '学术交流与研讨', '人才定向培养'],
  },
];

export function ServicesPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={(path) => navigate(path)} />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 text-white bg-gradient-to-r from-blue-600 to-cyan-600 overflow-hidden">
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

          <h1 className="text-4xl md:text-5xl font-bold mb-4">健康服务</h1>
          <p className="text-lg text-white/90 max-w-2xl">
            依托浙工大科研资源，提供检验检测、认证咨询、健康评估等全方位的健康服务
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                  <service.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{service.desc}</p>
                <ul className="space-y-1.5">
                  {service.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">需要健康服务？</h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            联系我们获取更详细的服务方案和报价，浙工大科研团队为您提供专业支持
          </p>
          <button
            onClick={() => navigate('/about')}
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            联系我们
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}