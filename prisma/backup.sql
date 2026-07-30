PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT,
    "title" TEXT,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Admin VALUES(1,'admin','$2b$10$NqX549haZ8A.Hv94EVWI0.6/WC4hCnWwOOZw32.KN7np9.fkUKCJe','管理员G','健康管家','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/avatar/1772715178463-124477557.jpg',1772099153271,1772778319350);
CREATE TABLE IF NOT EXISTS "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Category VALUES(1,'健康科普','news',1772099153279,1772099153279);
INSERT INTO Category VALUES(2,'健康前沿','news',1772099153279,1772099153279);
INSERT INTO Category VALUES(3,'健康讲堂','news',1772099153279,1772099153279);
INSERT INTO Category VALUES(4,'健康专家','expert',1772099153279,1772099153279);
INSERT INTO Category VALUES(5,'健行优选','selection',1772099153279,1772099153279);
INSERT INTO Category VALUES(7,'教授','expert',1772170938935,1772170938935);
INSERT INTO Category VALUES(8,'主任医生','expert',1772170953044,1772170953044);
INSERT INTO Category VALUES(9,'健康饮食','selection',1772172447604,1772172447604);
CREATE TABLE IF NOT EXISTS "News" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "authorTitle" TEXT,
    "authorAvatar" TEXT,
    "cover" TEXT,
    "content" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "News_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO News VALUES(4,'向阳健康网站正式发布！','Ironman Ge','健康管家','/uploads/1772169255242-837816262.PNG','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/news/1772778718679-348643761.jpg','<p>热烈祝贺向阳健康网站正式发布！</p>',1772150400000,2,1772169378809,1772778720233);
INSERT INTO News VALUES(5,'肖总采访视频','CSS','健康管家','/uploads/1772169255242-837816262.PNG','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/news/1772778793399-389196083.jpg','<p>关于NMN的权威解说</p>',1772150400000,3,1772170912263,1772778796253);
INSERT INTO News VALUES(6,'美国2026膳食指南','Ironman Ge','健康管家','/uploads/1772169255242-837816262.PNG','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/news/1772778658387-503859101.jpg','<p class="ql-align-justify"><strong style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 128);">新指南是如何建议的？</strong></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">1 核心理念：吃真正的食物（eatrealfood）</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">美国在这一版膳食指南中提出的核心膳食理念（口号）是“吃真正的食物（eatrealfood）”。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">这次指南的发布背景是基于美国“饮食-健康”危机的严峻评估之上。指南引用数据显示，超过70%的美国成年人超重或肥胖，近三分之一的青少年患有前期糖尿病，饮食相关的慢性病甚至已影响到国家安全（如兵源质量）。而根源就是因为长期的“标准美国饮食模式（StandardAmericanDiet）”，即高度依赖高度加工食品（highlyprocessedfood）和久坐的生活方式。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">美国卫生与公众服务部部长在白宫举行的简报会上说道：这是联邦营养政策史上最重要的重新调整。新的膳食指南是“以科学为依据的”，并让“真正的食物重新成为健康的核心”。新指南的核心逻辑非常直接：回归基础，以真实食物为核心。（returntothebasics，puttingrealfoodback），目的则是“MakeAmericaHealthyAgain”。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">所谓“真正的食物”（realfood），就是与高度加工食品（highlyprocessedfood）对应的，原始、完整、营养密度高的食物（whole,nutrient-densefoods），包括蛋白质、乳制品、蔬菜、水果、健康脂肪和全谷物。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">需要注意的是，在指南说的“高度加工食品”其实等同于“超加工食品”，在DGA的科学报告中指出目前因为超加工食品的说法还有争议，目前FDA还在征集意见中，所以这次还是统一用“高度加工食品”作为描述。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">2 食物金字塔倒过来了</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);"><img src="https://my-h5news.app.xinhuanet.com/chaobian-difanglink/www.news.cn/20260113/1a573e0bef9c4556944f023ed953e6c1/6b3cb8a3d88643058c60cc61f14459aa.jpg"></span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 128);">几版膳食指南食物金字塔对比</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">这版膳食指南第一眼最直观的变化就是原来的膳食宝塔变成倒的了。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">实际上，从1992年发布首个膳食宝塔以来，过去三十多年都是正的，中间还有过餐盘的形状。但这次给倒过来了。而且，在新版“食物倒金字塔”中，蛋白质、奶制品和健康脂肪位于顶端的一个角，非常显眼，第一眼就会被它们吸引；水果和蔬菜位于另一个角，而全谷物则处于底部。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">这也是目前被诟病最多的一个地方。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">因为这个倒食物金字塔将肉类和蔬菜置于最宽处的顶部位置，按照原文件中的演示顺序，首先是蛋白质、乳制品及健康油脂，给人的感觉似乎是肉类、乳制品、油脂才是最重要的，很容易形成先入为主的误导印象。目前美国学界也广泛批评这种做法。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">3 强调食物体系治理</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">为了应对营养与慢性病防控，以前的健康教育、膳食指南DGA宣传通常都是在既有食品体系中引导公众“做出更健康的选择”，强调营养素比例、膳食平衡与个人责任。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">此次DGA2025–2030在整体叙事框架上出现明显转向，其核心关切不再仅仅是“如何吃得更好”，还拓展了“为何不健康饮食成为常态”，并强调要从个体选择开始转变为食品体系重建。这一表述标志着美国官方叙事发生了根本性转变：从既往关注个别营养素的摄入不足或过量，转向关注由整个食品体系所影响的不健康饮食环境。可能也是因为过去几十年的营养教育让美国人看到似乎没有很好的效果，美国的肥胖率、慢性病发生率依然很高。</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(51, 51, 51);">当个体选择教育收效甚微时，政策重点就会逐步从“如何教会居民吃得更健康”拓展至“当前食品环境是否在系统性诱导不健康饮食”，这是从“个人营养教育”转向“食品环境治理”的重要一步，这也是目前国际营养学界探讨的重要方向，我国也早已开始了食物环境体系建设相关研究。</span></p><p><br></p><div class="ql-video-wrapper"><video src="https://qiningjiao.oss-cn-hangzhou.aliyuncs.com/%E5%A4%A7%E5%81%A5%E5%BA%B7/%E7%A7%91%E6%99%AE%E8%A7%86%E9%A2%91/2026%20%E8%86%B3%E9%A3%9F%E6%8C%87%E5%8D%97.mp4" controls="true" class="ql-video" data-url="https://qiningjiao.oss-cn-hangzhou.aliyuncs.com/%E5%A4%A7%E5%81%A5%E5%BA%B7/%E7%A7%91%E6%99%AE%E8%A7%86%E9%A2%91/2026%20%E8%86%B3%E9%A3%9F%E6%8C%87%E5%8D%97.mp4"><p>您的浏览器不支持视频播放。</p></video></div><p><br></p>',1772236800000,1,1772244138332,1772778663370);
INSERT INTO News VALUES(7,'2026年大健康行业新闻汇编','Ironman Ge','健康管家','/uploads/1772169255242-837816262.PNG','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/news/1772778702843-292091666.jpg','<h2><span style="background-color: rgb(255, 255, 255); color: rgb(41, 128, 185);">2026年大健康新趋势风向洞察报告</span></h2><p><span style="color: rgb(46, 125, 50); background-color: rgb(232, 245, 233);">趋势洞察</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(127, 140, 141);">来源：搜狐</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(85, 85, 85);">报告指出大健康行业正从被动治疗向主动健康转变。2026年的六大热点包括：全周期睡眠管理、情绪心理科学疗愈、科学体重管理、疾病主动防控、轻量化养生以及科技赋能特殊人群服务。大众健康意识觉醒，社媒平台互动量飙升，睡眠和情绪健康成为国民级痛点。</span></p><p><span style="color: rgb(102, 102, 102); background-color: rgb(249, 249, 249);">原文链接：</span><a href="https://www.sohu.com/a/989532778_120855974" rel="noopener noreferrer" target="_blank" style="color: rgb(39, 174, 96); background-color: rgb(249, 249, 249);">https://www.sohu.com/a/989532778_120855974</a></p><p><br></p><p><br></p><h2><span style="background-color: rgb(255, 255, 255); color: rgb(41, 128, 185);">共赴新质增长：2026中国医疗健康行业的双重叙事</span></h2><p><span style="color: rgb(46, 125, 50); background-color: rgb(232, 245, 233);">行业战略</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(127, 140, 141);">来源：虎嗅网</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(85, 85, 85);">2026年行业将呈现双重叙事：一方面是“规范、降本增效、质量为先”的稳健基石；另一方面是“分层、价值导向、创新开放”的突破路径。数据成为驱动变革的“第六要素”，智慧医疗迈向3.0时代，AI在新药研发和医疗服务端的应用将全面深化。</span></p><p><span style="color: rgb(102, 102, 102); background-color: rgb(249, 249, 249);">原文链接：</span><a href="https://www.huxiu.com/article/4837435.html" rel="noopener noreferrer" target="_blank" style="color: rgb(39, 174, 96); background-color: rgb(249, 249, 249);">https://www.huxiu.com/article/4837435.html</a></p><p><br></p><p><br></p><h2><span style="background-color: rgb(255, 255, 255); color: rgb(41, 128, 185);">大健康国际发布2026战略规划：破局革新</span></h2><p><span style="color: rgb(46, 125, 50); background-color: rgb(232, 245, 233);">企业动态</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(127, 140, 141);">来源：凤凰网</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(85, 85, 85);">大健康国际集团推动传统药房向“统筹药房”升级，对接医院处方流转平台。战略重点包括优化供应链、深耕DTP专业药房、跨界“医药+”运营（如药房+医美），并积极拓展港澳及海外市场，利用AI助力数字化转型。</span></p><p><span style="color: rgb(102, 102, 102); background-color: rgb(249, 249, 249);">原文链接：</span><a href="https://i.ifeng.com/c/8qFnT8Hk8AG" rel="noopener noreferrer" target="_blank" style="color: rgb(39, 174, 96); background-color: rgb(249, 249, 249);">https://i.ifeng.com/c/8qFnT8Hk8AG</a></p><p><br></p><p><br></p><h2><span style="background-color: rgb(255, 255, 255); color: rgb(41, 128, 185);">2026大健康趋势：中式养生现代化与超个性化养护</span></h2><p><span style="color: rgb(46, 125, 50); background-color: rgb(232, 245, 233);">消费趋势</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(127, 140, 141);">来源：搜狐 (数说故事)</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(85, 85, 85);">报告预判2026年八大趋势，其中强调社交情绪疗愈成为刚需，情绪价值成为“硬通货”。中式养生通过国潮与科技双向驱动实现现代化回归。AI技术将实现个体差异量化，超个性化精准养护时代到来，下沉市场与年轻群体成为消费主力。</span></p><p><span style="color: rgb(102, 102, 102); background-color: rgb(249, 249, 249);">原文链接：</span><a href="https://m.sohu.com/a/987657963_121752158" rel="noopener noreferrer" target="_blank" style="color: rgb(39, 174, 96); background-color: rgb(249, 249, 249);">https://m.sohu.com/a/987657963_121752158</a></p><p><br></p><p><br></p><h2><span style="background-color: rgb(255, 255, 255); color: rgb(41, 128, 185);">银发经济与慢病管理：5万亿市场的爆发</span></h2><p><span style="color: rgb(46, 125, 50); background-color: rgb(232, 245, 233);">市场潜力</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(127, 140, 141);">来源：分析汇编</span></p><p class="ql-align-justify"><span style="background-color: rgb(255, 255, 255); color: rgb(85, 85, 85);">预计到2025-2026年，中国深度老龄化趋势将驱动超过5万亿元的医疗健康市场。老龄化不仅带动了医疗服务需求，更促进了针对心血管、糖尿病等慢病的创新疗法与管理工具的发展。健康消费主义崛起，消费者从被动患者转变为覆盖全生命周期的主动健康管理者。</span></p>',1772236800000,2,1772263903236,1772778815917);
INSERT INTO News VALUES(8,'向阳健康网提速！','IMG','健康管家','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/avatar/1772715178463-124477557.jpg','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/news/1772777967770-434704803.PNG','<h2>向阳健康网提速啦！分享一套易筋经12式！</h2><div class="ql-video-wrapper"><video src="https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/video/1772777997041-294229572.mp4" controls="true" class="ql-video" data-url="https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/video/1772777997041-294229572.mp4"><p>您的浏览器不支持视频播放。</p></video></div><p><br></p>',1772755200000,2,1772778035237,1772778035237);
CREATE TABLE IF NOT EXISTS "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rating" REAL,
    "image" TEXT,
    "introduction" TEXT,
    "url" TEXT,
    "price" TEXT,
    "categoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "DailyTip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO DailyTip VALUES(2,'人体所需三大宏量为：碳水 脂肪 蛋白质','向阳健康',1785340800000,1,1785385619123,1785385619123);
CREATE TABLE IF NOT EXISTS "Expert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "avatar" TEXT,
    "unit" TEXT,
    "achievements" TEXT,
    "score" REAL,
    "introduction" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expert_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO Expert VALUES(1,'张桦','','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/avatar/1772778413304-517153236.jpg','工成数智','',NULL,'<p><br></p>',4,1772099153354,1772778417876);
INSERT INTO Expert VALUES(4,'葛铁','无','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/avatar/1772778400128-104588968.PNG','思隽思',NULL,NULL,'',4,1772170194906,1772778401910);
INSERT INTO Expert VALUES(5,'崔玉','教授','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/avatar/1772778384023-986146443.PNG','六六',NULL,NULL,'',4,1772170841758,1772778385653);
INSERT INTO Expert VALUES(6,'俞帆','主任','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/avatar/1772778370480-441398390.png','ZJUT',NULL,NULL,'',4,1772171264014,1772778372283);
INSERT INTO Expert VALUES(7,'肖总','-','https://xyjk-data.oss-cn-hangzhou.aliyuncs.com/avatar/1772778351057-109278163.png','海诺',NULL,NULL,'',4,1772172132672,1772778353793);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('Admin',1);
INSERT INTO sqlite_sequence VALUES('Category',9);
INSERT INTO sqlite_sequence VALUES('News',8);
INSERT INTO sqlite_sequence VALUES('Product',2);
INSERT INTO sqlite_sequence VALUES('Expert',7);
INSERT INTO sqlite_sequence VALUES('DailyTip',2);
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");
COMMIT;
