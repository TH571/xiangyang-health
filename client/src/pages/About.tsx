/**
 * About Page
 * 关于我们 - 品牌介绍、团队和联系方式
 */

import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SimpleDivider } from '@/components/OrganicDivider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, MapPin, Users, Target, Lightbulb } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: '李明',
    role: '创始人 & CEO',
    bio: '健康管理专家，致力于推动大学生健康教育',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
  },
  {
    id: '2',
    name: '王芳',
    role: '医学顾问',
    bio: '医学博士，专注于预防医学和健康科普',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
  },
  {
    id: '3',
    name: '张伟',
    role: '技术总监',
    bio: '资深技术工程师，打造最好的健康平台',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
  },
  {
    id: '4',
    name: '刘静',
    role: '内容运营',
    bio: '健康内容创作者，为用户提供专业知识',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
  }
];

export function AboutPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={(path) => navigate(path)} />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 text-white bg-gradient-to-r from-purple-600 to-pink-600 overflow-hidden">
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

          <h1 className="text-4xl md:text-5xl font-bold mb-4">关于向阳健康</h1>
          <p className="text-lg text-white/90 max-w-2xl">
            我们的使命是守护每一位工大人的健康，让健康成为生活的习惯
          </p>
        </div>
      </section>

      <SimpleDivider className="my-0" />

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">我们的使命</h3>
              <p className="text-slate-600">
                通过科学的健康知识和专业的指导，帮助工大人建立健康的生活方式，成为自己健康的主人。
              </p>
            </div>

            {/* Vision */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Lightbulb className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">我们的愿景</h3>
              <p className="text-slate-600">
                构建一个开放、包容、充满温暖的健康社区，让每一个工大人都能找到属于自己的健康之路。
              </p>
            </div>

            {/* Values */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">我们的价值观</h3>
              <p className="text-slate-600">
                专业、诚信、关怀。我们承诺提供最准确的信息、最真诚的服务和最温暖的陪伴。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-orange-50">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center">
            我们的故事
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-8 border-l-4 border-orange-600">
              <h3 className="text-xl font-bold text-slate-900 mb-3">从一个想法开始</h3>
              <p className="text-slate-600 leading-relaxed">
                2023年，我们的创始人李明在工大校园里发现了一个现象：许多学生因为压力、不规律的生活作息和缺乏健康知识而身体状况下降。这激发了他创办向阳健康的想法——用科学的方法和温暖的陪伴，帮助工大人重获健康。
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border-l-4 border-blue-600">
              <h3 className="text-xl font-bold text-slate-900 mb-3">汇聚专业力量</h3>
              <p className="text-slate-600 leading-relaxed">
                我们邀请了医学专家、营养师、心理咨询师和运动教练加入团队，确保每一条建议都是科学、专业的。同时，我们建立了一个由工大学生组成的志愿者团队，他们用自己的亲身经历为其他同学提供支持和鼓励。
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border-l-4 border-green-600">
              <h3 className="text-xl font-bold text-slate-900 mb-3">持续成长</h3>
              <p className="text-slate-600 leading-relaxed">
                从最初的微信公众号到现在的完整平台，向阳健康已经服务了数千名工大人。我们收到了无数感谢信，看到了许多人的健康改善和生活质量提升。这些都激励我们继续前进，为更多人带去健康和希望。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">
            我们的团队
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="text-center rounded-lg overflow-hidden bg-gradient-to-b from-orange-50 to-white p-6 hover:shadow-lg transition-shadow"
              >
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-orange-200"
                />
                <h3 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-orange-600 font-semibold text-sm mb-3">{member.role}</p>
                <p className="text-slate-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            联系我们
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {/* Email */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">邮箱</h3>
              <a
                href="mailto:contact@xiangyang-health.com"
                className="text-white/80 hover:text-white transition-colors"
              >
                contact@xiangyang-health.com
              </a>
            </div>

            {/* Phone */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">电话</h3>
              <a
                href="tel:+86-10-1234-5678"
                className="text-white/80 hover:text-white transition-colors"
              >
                010-1234-5678
              </a>
            </div>

            {/* Address */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">地址</h3>
              <p className="text-white/80">
                北京市朝阳区<br />
                工业大学校园内
              </p>
            </div>
          </div>

          {/* Contact Form CTA */}
          <div className="mt-12 text-center">
            <p className="text-white/90 mb-6">有任何问题或建议？我们很乐意听到您的声音</p>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
            >
              发送消息
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            常见问题
          </h2>

          <div className="space-y-6">
            {[
              {
                q: '向阳健康的内容是否可信？',
                a: '是的。我们的所有内容都由医学专家和营养师审核，确保科学准确。我们也会标注信息来源，方便您进一步了解。'
              },
              {
                q: '我可以在平台上分享我的故事吗？',
                a: '当然可以！我们欢迎所有工大人分享他们的健康故事。您可以通过"健康工大人"页面提交您的故事。'
              },
              {
                q: '向阳健康是否提供一对一咨询？',
                a: '目前我们主要提供在线文章和资源。未来我们计划推出专业咨询服务，敬请期待。'
              },
              {
                q: '如何订阅向阳健康的更新？',
                a: '您可以在首页点击"开始探索"按钮加入我们的社区，或关注我们的微信公众号获取最新资讯。'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.q}</h3>
                <p className="text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
