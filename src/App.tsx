import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Search, CheckSquare, Square, Newspaper, Download, Terminal, Star } from 'lucide-react'
import newsData from './newsData.json'

interface NewsItem {
  country: string
  source: string
  time: string
  title_cn: string
  title_raw: string
  url: string
  summary: string
  recommended?: boolean
}

interface CrawlLog {
  date: string
  window_start: string
  window_end: string
  total_news: number
  sites: {
    site: string
    status: string
    count: number
    error?: string
  }[]
}

const newsTemplates: Record<string, { quick_view: string; main_title: string; body: string; analysis: string }> = {
  "Emas UBS tembus Rp3,167 juta/gr, Galeri24 Rp3,13 juta/gr Senin pagi": {
    quick_view: "印尼黄金价格创历史新高",
    main_title: "印尼黄金价格飙升至每克316.7万盾，创历史新高",
    body: "【尚普华泰编译】据安塔拉通讯社报道（41 menit lalu），印尼黄金价格周一早盘大幅飙升。UBS品牌黄金价格突破316.7万印尼盾/克，Galeri24品牌黄金价格也达到313万印尼盾/克。这一价格上涨反映了全球地缘政治紧张局势下投资者对避险资产的追捧。",
    analysis: "【市场分析】黄金作为传统避险资产，在地缘政治风险上升时通常表现强劲。印尼国内黄金价格上涨也与全球金价走势同步，建议投资者关注中东局势发展对贵金属市场的持续影响。"
  },
  "IHSG diprediksi volatile pekan ini dipicu naiknya risiko geopolitik": {
    quick_view: "地缘政治风险加剧，印尼股市预计波动",
    main_title: "地缘政治风险上升，雅加达综合指数预计本周波动加剧",
    body: "【尚普华泰编译】据安塔拉通讯社报道（2 jam lalu），印尼证券公司Indo Premier Sekuritas分析师Imam Gunadi预测，受地缘政治风险上升影响，雅加达综合指数（IHSG）本周将呈现波动态势。中东地区紧张局势升级引发全球市场不确定性增加。",
    analysis: "【市场分析】地缘政治风险通常会导致股市短期波动，投资者应保持谨慎。建议关注能源、国防等可能受益于局势变化的板块，同时考虑增加现金头寸以应对市场不确定性。"
  },
  "雅迪在越南北宁斥资1亿美元的智能制造工厂正式竣工投产": {
    quick_view: "雅迪越南1亿美元智能工厂投产",
    main_title: "雅迪在越南北宁省1亿美元智能制造工厂正式竣工投产",
    body: "【尚普华泰编译】据越南通讯社报道（01/03/2026 18:00），中国智能电动摩托车品牌雅迪（YADEA）在越南北宁省新兴工业区的智能制造工厂正式竣工投产。该工厂总投资1亿美元，标志着雅迪在东南亚市场的深度布局。雅迪越南同时宣布与Grab越南达成战略合作，共同推动越南绿色交通转型。",
    analysis: "【投资分析】雅迪在越南的重大投资反映了中国电动车企业加速出海东南亚的趋势。越南作为东南亚增长最快的电动车市场之一，具有巨大的发展潜力。此举将带动当地产业链发展，同时加剧东南亚电动车市场竞争。"
  },
  "超百万亿越盾公共投资成增长新引擎": {
    quick_view: "越南公共投资超1008万亿盾推动增长",
    main_title: "越南2026年公共投资超1008万亿越盾，成为经济增长新引擎",
    body: "【尚普华泰编译】据越南通讯社报道（01/03/2026 14:55），2026年越南公共投资资金总计划超过1008万亿越盾（约合400亿美元），体现了越南政府将公共投资作为推动经济增长10%以上关键动力的决心。工作重点在于疏通资金到位瓶颈，强化负责人责任意识，并在年初迅速推进项目进度。",
    analysis: "【政策分析】大规模公共投资将带动基础设施建设、制造业和房地产等相关产业发展。对于外国投资者而言，越南基建领域的投资机会值得关注，特别是在高速公路、港口、电力等关键基础设施领域。"
  },
  "Market Positioning May Limit Fallout On Malaysia From Middle East Conflict - Economist": {
    quick_view: "经济学家称马来西亚市场定位有助缓解中东冲突影响",
    main_title: "经济学家：马来西亚市场定位有助限制中东冲突的经济影响",
    body: "【尚普华泰编译】据马新社报道（52m ago），经济学家表示，如果中东紧张局势不持续升级，马来西亚受到的经济影响可能保持可控，尽管短期内市场波动难以避免。马来西亚的多元化经济结构和对亚洲市场的依赖有助于缓冲外部冲击。",
    analysis: "【经济分析】马来西亚作为能源净出口国，短期内可能从油价上涨中受益，但长期来看，全球经济放缓风险需要警惕。投资者应关注马来西亚的贸易平衡和外汇储备变化。"
  },
  "Middle East Conflict: Govt Will Try To Maintain RON95 Price Under BUDI95 Programme - PM Anwar": {
    quick_view: "马来西亚政府承诺维持RON95油价",
    main_title: "安瓦尔总理：政府将努力维持RON95油价在BUDI95计划下不变",
    body: "【尚普华泰编译】据马新社报道（11h ago），马来西亚总理安瓦尔表示，尽管全球市场因中东冲突而不确定，政府将努力维持马来西亚人RON95汽油价格在当前每升1.99令吉的水平。政府将通过BUDI95补贴计划确保国内油价稳定。",
    analysis: "【政策分析】维持油价稳定有助于控制通胀预期，保护消费者购买力。然而，这也将增加政府财政负担。投资者应关注马来西亚的财政赤字和补贴政策可持续性。"
  },
  "ราคาน้ำมันตอนนี้ WTI พุ่งกว่า 8% หวั่นอุปทานชะงัก หลังสหรัฐ-อิสราเอลโจมตีอิหร่าน": {
    quick_view: "WTI油价飙升超8%",
    main_title: "WTI油价飙升超8%，市场担忧供应中断",
    body: "【尚普华泰编译】据Thansettakij报道（02/03/2569 09:22），美国-以色列对伊朗发动袭击后，WTI原油价格飙升超过8%，市场担忧波斯湾地区供应可能中断。投资者密切关注霍尔木兹海峡的航运安全。",
    analysis: "【能源分析】油价短期飙升将利好能源出口国如泰国，但也会增加进口成本。泰国作为石油净进口国，需要关注油价上涨对贸易平衡和通胀的影响。"
  },
  "西港物流综合体项目向社会资本开放，公私合营模式推动柬埔寨基础设施升级": {
    quick_view: "西港物流综合体项目招募投资方",
    main_title: "西港物流综合体项目向社会资本开放，采用PPP模式推动基建升级",
    body: "【尚普华泰编译】据KHMER TIMES报道（2026-02-28），柬埔寨公共工程和运输部宣布，政府计划通过公私合作伙伴关系（PPP）模式实施西港物流综合体项目，涵盖设计、建设、融资、运营及维护等环节。该项目旨在提升西哈努克港的物流能力和区域竞争力。",
    analysis: "【投资分析】西港物流综合体项目是柬埔寨重要的基础设施项目，采用PPP模式为外国投资者提供了参与机会。该项目将提升柬埔寨的物流效率，利好制造业和出口导向型企业。"
  },
  "柬埔寨信用担保机构已为9600家企业提供担保，总额超5.3亿美元": {
    quick_view: "柬埔寨信用担保机构服务9600家企业",
    main_title: "柬埔寨信用担保机构已为9600家企业提供超5.3亿美元担保",
    body: "【尚普华泰编译】据KHMER TIMES报道（2026-02-26），柬埔寨信用担保机构（CGCC）数据显示，截至2026年1月31日，已为9600家企业提供信贷担保，担保贷款总额达5.3354亿美元。该机构在支持中小企业融资方面发挥了重要作用。",
    analysis: "【金融分析】信用担保计划有效缓解了中小企业融资难问题，促进了私营部门发展。随着担保规模扩大，柬埔寨的金融包容性持续提升，有利于吸引更多外国投资。"
  },
  "Sepekan, 44 penerima LPDP disanksi hingga tarif RI-AS jadi 15 persen": {
    quick_view: "美国对印尼关税降至15%",
    main_title: "特朗普政府将对印尼关税降至15%，CPO等产品仍为零关税",
    body: "【尚普华泰编译】据安塔拉通讯社报道（21 jam lalu），美国总统特朗普宣布将对印尼的进口关税从之前的水平降至15%。这一决定是在印尼政府积极谈判后达成的，有利于印尼对美出口。值得注意的是， crude palm oil (CPO) 等关键产品仍享受零关税待遇。",
    analysis: "【贸易分析】关税降低将提振印尼对美出口，特别是纺织品、鞋类和电子产品。CPO零关税的维持对印尼农业出口是重大利好。投资者可关注受益于关税降低的出口导向型企业。"
  },
  "GTS Internasional rombak manajemen untuk perkuat sinergi holding": {
    quick_view: "GTS国际重组管理层",
    main_title: "GTS国际重组管理层以强化控股协同效应",
    body: "【尚普华泰编译】据安塔拉通讯社报道（2 jam lalu），PT GTS Internasional Tbk (GTSI) 宣布进行管理层调整，作为强化控股协同效应的战略举措。公司希望通过新的管理架构提升运营效率和市场竞争力。",
    analysis: "【企业分析】管理层重组通常意味着公司战略方向的调整。投资者应关注新管理层的背景和战略计划，评估其对公司长期发展的影响。"
  },
  "越南自3月1日起为房地产颁发电子识别码": {
    quick_view: "越南房地产电子识别码系统上线",
    main_title: "越南3月1日起为房地产颁发电子识别码，推动市场数字化",
    body: "【尚普华泰编译】据越南通讯社报道（01/03/2026 16:26），自2026年3月1日起，越南将为每栋独栋房屋、公寓楼每套住房以及房地产项目中的每个产品颁发独立的电子识别码。专家认为，这是推进数字化转型进程中的一项重要举措，将有助于推动房地产市场朝着更加透明、现代化方向发展。",
    analysis: "【市场分析】房地产电子识别码系统将提高市场透明度，减少欺诈行为，增强投资者信心。这一举措有利于吸引更多外国投资进入越南房地产市场，特别是高端住宅和商业地产领域。"
  },
  "第79-NQ/TW号决议：国有企业是重大项目实施中的骨干力量": {
    quick_view: "越南强化国有企业在重大项目中的作用",
    main_title: "越共中央第79-NQ/TW号决议：国企是重大项目实施的骨干力量",
    body: "【尚普华泰编译】据越南通讯社报道（01/03/2026 11:00），越共中央政治局颁布关于发展国有经济的第79-NQ/TW号决议，要求国有企业不仅限于保值增值，而是要在国家和地方重大发展战略中发挥骨干作用。国有企业正投资建设多功能城市新区，既满足当前发展需求，又能为首都创造长期增长空间。",
    analysis: "【政策分析】该决议强化了国有企业在越南经济中的战略地位，预示着更多大型基建项目将由国企主导。外国投资者可通过与国企合作的方式参与越南基建市场。"
  },
  "越南企业在国际赛场上转型": {
    quick_view: "越南企业国际化转型加速",
    main_title: "越南企业告别低成本模式，凭技术和品牌立足国际市场",
    body: "【尚普华泰编译】据越南通讯社报道（28/02/2026 13:00），越南企业正告别单纯依靠廉价或成本优势的旧模式，而是凭借技术、标准和品牌在国际市场上站稳脚跟。这一转型反映了越南制造业向高附加值方向发展的趋势。",
    analysis: "【产业分析】越南企业的国际化转型将提升其在全球价值链中的地位，有利于吸引更多高端制造业投资。投资者可关注具有技术优势和品牌影响力的越南企业。"
  },
  "胡志明市高科技园区彰显科技核心地位": {
    quick_view: "胡志明市高科技园区目标国际创新中心",
    main_title: "胡志明市高科技园区力争2030年成为国际科技与创新中心",
    body: "【尚普华泰编译】据越南通讯社报道（28/02/2026 11:00），胡志明市高科技园区（SHTP）力争到2030年建设成为国际科技与创新中心，为绿色、可持续的经济转型作出贡献，同时发挥南部创新集群的核心作用。园区已吸引众多跨国科技企业入驻。",
    analysis: "【投资分析】SHTP的发展目标为科技投资者提供了明确的政策信号。园区在税收优惠、土地供应和人才支持方面的政策值得关注，适合高科技制造和研发类项目投资。"
  },
  "Renewed US-Iran Conflict Fueling Market Volatility, Raising Oil Prices And Forex risks": {
    quick_view: "美伊冲突加剧市场波动",
    main_title: "美伊冲突升级引发市场波动，油价和外汇风险上升",
    body: "【尚普华泰编译】据马新社报道（22h ago），美国与伊朗冲突再度升级，引发全球市场波动，推高油价并增加外汇风险。马来西亚作为石油净进口国，需要密切关注局势发展对贸易平衡和汇率的影响。",
    analysis: "【风险分析】地缘政治风险上升通常会导致新兴市场货币承压。马来西亚林吉特可能面临贬值压力，央行或需采取措施稳定汇率。投资者应考虑对冲外汇风险。"
  },
  "Early Policy Response Crucial To Contain US-Iran Conflict's Impact, Says Economist": {
    quick_view: "经济学家呼吁及早应对美伊冲突影响",
    main_title: "经济学家：及早政策应对对控制美伊冲突影响至关重要",
    body: "【尚普华泰编译】据马新社报道（16h ago），经济学家表示，及早和协调一致的政策干预将是决定美国-伊朗冲突升级是暂时外部冲击还是演变为更持久经济挑战的关键。马来西亚需要制定应对预案。",
    analysis: "【政策建议】建议马来西亚政府准备财政和货币政策的组合拳，以应对可能的能源价格冲击和资本外流。同时应加强与东盟国家的政策协调。"
  },
  "ค้าชายแดน ม.ค.69 พุ่ง 1.61 แสนล้าน แรงหนุนผ่านแดนโตแรง 50%": {
    quick_view: "泰国边境贸易1月增长强劲",
    main_title: "泰国1月边境贸易达1610亿泰铢，跨境贸易增长50%",
    body: "【尚普华泰编译】据Thansettakij报道（02/03/2569 08:10），泰国1月边境贸易额达1610亿泰铢，其中跨境贸易增长强劲，达50%。主要贸易伙伴包括中国、越南和马来西亚。边境贸易的繁荣反映了区域经济活动的活跃。",
    analysis: "【贸易分析】泰国边境贸易的强劲增长表明区域经济一体化程度加深。投资者可关注泰国边境地区的物流和贸易相关企业，以及受益于跨境贸易的制造业。"
  },
  "泰国全面提升安保级别，严防趁机违法事件": {
    quick_view: "泰国提升安保级别",
    main_title: "泰国全面提升安保级别，严防趁机违法事件",
    body: "【尚普华泰编译】据泰国头条新闻报道（3月 1, 2026），泰国国家警察提升全国安保级别，严防趁机违法事件。此举是在中东局势紧张背景下采取的预防措施，旨在维护社会稳定和游客安全。",
    analysis: "【安全分析】安保级别提升可能会增加旅游和商务活动的成本，但有利于维护长期稳定。投资者应关注泰国政府的安全政策对旅游业和消费市场的影响。"
  },
  "泰国软实力再出圈，MotoGP 2026首创“嘟嘟车挑战赛”": {
    quick_view: "MotoGP 2026泰国嘟嘟车挑战赛",
    main_title: "泰国软实力再出圈，MotoGP 2026首创嘟嘟车挑战赛",
    body: "【尚普华泰编译】据泰国头条新闻报道（3月 1, 2026），2026年MotoGP泰国站将首创嘟嘟车挑战赛，展示泰国独特的文化元素。这一创新举措将进一步提升泰国作为旅游目的地的国际知名度。",
    analysis: "【文化分析】泰国通过体育赛事推广文化软实力，有利于提升国家品牌形象和吸引游客。投资者可关注泰国文化旅游和体育产业的投资机会。"
  },
  "泰国放宽对老挝燃油出口管制": {
    quick_view: "泰国放宽对老挝燃油出口",
    main_title: "泰国放宽对老挝燃油出口管制，促进边境贸易",
    body: "【尚普华泰编译】据泰国头条新闻报道（3月 1, 2026），泰国政府放宽对老挝的燃油出口管制，以促进边境贸易和区域经济合作。这一政策将有利于泰国能源企业扩大对老挝市场的出口。",
    analysis: "【贸易分析】燃油出口管制的放宽将利好泰国能源企业，同时也有助于老挝缓解能源供应压力。这一政策反映了两国经济合作的深化。"
  },
  "泰国影院公司Major Cineplex Group宣布退出柬埔寨": {
    quick_view: "Major Cineplex退出柬埔寨市场",
    main_title: "泰国Major Cineplex宣布退出柬埔寨，结束12年运营",
    body: "【尚普华泰编译】据KHMER TIMES报道（2026-02-27），隶属于泰国的电影院线公司Major Cineplex Group宣布，其子公司Major Cineplex Cambodia在柬埔寨市场经营12年后，将正式停止该国境内的全部运营。公司表示这是基于商业考量做出的战略调整。",
    analysis: "【市场分析】Major Cineplex的退出反映了柬埔寨电影市场竞争的激烈程度。随着流媒体服务的普及，传统影院面临挑战。投资者应关注柬埔寨娱乐消费市场的结构性变化。"
  },
  "柬埔寨制造能否赢得消费者的信任": {
    quick_view: "柬埔寨制造运动激发爱国消费",
    main_title: "柬埔寨制造运动激发爱国情怀，本土产品品质仍待提升",
    body: "【尚普华泰编译】据KHMER TIMES报道（2026-02-26），柬埔寨制造运动自启动以来，无论实际成效如何，都已在柬埔寨民众中激发起浓厚的爱国情怀。然而，部分本土产品在品质上仍难与进口商品媲美，需要持续改进。",
    analysis: "【产业分析】柬埔寨制造运动为本土企业提供了发展机会，但要真正赢得消费者信任，还需要在产品质量和品牌建设上下功夫。外国投资者可考虑与本土企业合作，提升其生产技术和管理水平。"
  },
  "柬埔寨旅游部会见英国AROSCO公司，共商高尔夫赛事与旅游推广事宜": {
    quick_view: "柬埔寨与英国商讨高尔夫旅游合作",
    main_title: "柬埔寨旅游部与英国AROSCO公司商讨高尔夫赛事与旅游推广",
    body: "【尚普华泰编译】据KHMER TIMES报道（2026-02-26），柬埔寨旅游部部长华合会见英国高尔夫企业AROSCO首席执行官Jaz Kanth先生率领的代表团，双方就柬埔寨高尔夫赛事的组织策划、以及向全球推广柬埔寨旅游进行商讨。",
    analysis: "【旅游分析】高尔夫旅游是高端旅游市场的重要组成部分，有助于吸引高消费游客。柬埔寨发展高尔夫旅游需要配套的高端酒店和会议设施，为相关投资提供了机会。"
  },
  "今年1月柬埔寨与RCEP贸易额达37.6亿美元，同比增长14.75%": {
    quick_view: "柬埔寨RCEP贸易额增长14.75%",
    main_title: "柬埔寨1月与RCEP成员国贸易额达37.6亿美元，同比增长14.75%",
    body: "【尚普华泰编译】据KHMER TIMES报道（2026-02-25），柬埔寨商务部报告显示，2026年1月柬埔寨与区域全面经济伙伴关系协定（RCEP）成员国贸易额达到约37.6亿美元，较去年同期的32.8亿美元同比增长14.75%。",
    analysis: "【贸易分析】RCEP的深入实施为柬埔寨带来了显著的贸易增长。柬埔寨在纺织品、农产品等领域的出口优势得到进一步发挥。投资者可关注受益于RCEP的柬埔寨出口导向型企业。"
  },
  "洪森亲王与乌克兰总统泽连斯基举行电话会谈": {
    quick_view: "洪森与泽连斯基电话会谈",
    main_title: "洪森亲王与乌克兰总统泽连斯基举行电话会谈",
    body: "【尚普华泰编译】据柬华日报报道（2026/02/28），柬埔寨参议院主席洪森亲王与乌克兰总统泽连斯基举行电话会谈，双方就双边关系和地区局势交换了意见。洪森表示柬埔寨支持通过和平对话解决争端。",
    analysis: "【外交分析】此次会谈体现了柬埔寨在国际事务中的积极姿态。柬埔寨作为东盟成员国，在地区事务中发挥着越来越重要的作用。投资者应关注柬埔寨外交政策对其国际形象和投资环境的积极影响。"
  },
  "金边警方破获外籍团伙绑架勒索案 顺藤摸瓜突击电诈窝点": {
    quick_view: "金边警方破获绑架勒索和电诈案件",
    main_title: "金边警方破获外籍团伙绑架勒索案，顺藤摸瓜突击电诈窝点",
    body: "【尚普华泰编译】据柬华日报报道（2026/03/01），金边警方成功破获一起外籍团伙绑架勒索案，并顺藤摸瓜突击了相关的电信诈骗窝点。警方表示将继续加大打击跨国犯罪的力度。",
    analysis: "【安全分析】柬埔寨政府加大打击跨国犯罪力度，有利于改善投资环境和社会治安。投资者应关注柬埔寨法治环境的持续改善，这对于吸引高质量外资至关重要。"
  },
  "柬埔寨再次遣返335名中国籍涉诈人员": {
    quick_view: "柬埔寨遣返335名涉诈人员",
    main_title: "柬埔寨再次遣返335名中国籍涉诈人员",
    body: "【尚普华泰编译】据柬华日报报道（2026/03/01），柬埔寨移民局再次遣返335名中国籍涉诈人员。这是柬埔寨政府打击电信诈骗犯罪的又一重要行动，显示了政府净化投资环境的决心。",
    analysis: "【政策分析】大规模遣返涉诈人员表明柬埔寨政府打击电信诈骗的坚定决心。这将有助于改善柬埔寨的国际形象，为合法投资者创造更安全的环境。"
  }
}

const countryColors: Record<string, string> = {
  '印尼': 'bg-red-50 text-red-700 border-red-200',
  '越南': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  '马来西亚': 'bg-blue-50 text-blue-700 border-blue-200',
  '泰国': 'bg-purple-50 text-purple-700 border-purple-200',
  '柬埔寨': 'bg-green-50 text-green-700 border-green-200',
}

const countryFlag: Record<string, string> = {
  '印尼': '🇮🇩',
  '越南': '🇻🇳',
  '马来西亚': '🇲🇾',
  '泰国': '🇹🇭',
  '柬埔寨': '🇰🇭',
}

const shouldShow = (item: NewsItem, filter: string, searchTerm: string): boolean => {
  if (filter === 'recommended') {
    if (!item.recommended) return false
  } else if (filter !== 'all' && item.country !== filter) {
    return false
  }
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase()
    if (!item.title_cn.toLowerCase().includes(term) &&
        !item.source.toLowerCase().includes(term)) {
      return false
    }
  }
  return true
}

function App() {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [showLog, setShowLog] = useState(false)
  const [crawlLog, setCrawlLog] = useState<CrawlLog | null>(null)

  useEffect(() => {
    fetch('/crawl_log.json')
      .then(r => r.json())
      .then(data => setCrawlLog(data))
      .catch(() => setCrawlLog(null))
  }, [])

  const countries = (() => {
    const set = new Set<string>()
    ;(newsData as NewsItem[]).forEach(item => set.add(item.country))
    return Array.from(set)
  })()

  const recommendedCount = (newsData as NewsItem[]).filter(item => item.recommended).length

  const getDisplayCount = useCallback(() => {
    return (newsData as NewsItem[]).filter(item => shouldShow(item, filter, searchTerm)).length
  }, [filter, searchTerm])

  const toggleSelect = useCallback((url: string) => {
    setSelectedUrls(prev => {
      const newSet = new Set(prev)
      if (newSet.has(url)) {
        newSet.delete(url)
      } else {
        newSet.add(url)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    const visibleUrls = (newsData as NewsItem[])
      .filter(item => shouldShow(item, filter, searchTerm))
      .map(item => item.url)
    setSelectedUrls(prev => {
      const newSet = new Set(prev)
      visibleUrls.forEach(url => newSet.add(url))
      return newSet
    })
  }, [filter, searchTerm])

  const clearAll = useCallback(() => {
    setSelectedUrls(new Set())
  }, [])

  const makeArticle = useCallback(() => {
    const selected = (newsData as NewsItem[]).filter(item => selectedUrls.has(item.url))

    let text = '东南亚日报\n\n'
    text += `${new Date().toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric'})}\n\n`

    text += '今日速览\n'
    selected.forEach((item, idx) => {
      const template = newsTemplates[item.title_cn]
      const quickView = template ? template.quick_view : item.title_cn.substring(0, 30) + '...'
      text += `${idx + 1}、${quickView}\n`
    })
    text += '\n'

    text += '今日要闻\n\n'
    selected.forEach((item, idx) => {
      const template = newsTemplates[item.title_cn]
      if (template) {
        text += `${idx + 1}、${template.main_title}\n\n`
        text += `${template.body}\n\n`
        text += `${template.analysis}\n\n`
      } else {
        text += `${idx + 1}、${item.title_cn}\n\n`
        text += `【尚普华泰编译】据${item.source}报道（${item.time}）\n\n`
        text += `${item.summary}\n\n`
        text += `${item.country}市场动态值得关注。\n\n`
      }
    })

    text += '免责声明\n'
    text += '本文内容来源于权威媒体、政府部门及相关机构公告等公开渠道信息整理汇编，仅供读者参考，不构成任何投资建议。对于因使用本文内容而产生的任何直接或间接损失，本公众号不承担任何责任。读者据此投资，风险自担。\n'

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `东南亚日报-${new Date().toISOString().slice(0,10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [selectedUrls])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="w-7 h-7 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">东南亚日报选题系统</h1>
                <p className="text-xs text-gray-500">
                  {crawlLog ? (() => {
                    const fmt = (s: string) => {
                      const d = new Date(s)
                      return `${d.getMonth()+1}.${String(d.getDate()).padStart(2,'0')}`
                    }
                    return `${fmt(crawlLog.window_start)} 09:00 - ${fmt(crawlLog.window_end)} 09:00`
                  })() : (() => {
                    const now = new Date()
                    const end = new Date(now)
                    end.setHours(9, 0, 0, 0)
                    const start = new Date(end)
                    start.setDate(start.getDate() - 1)
                    const fmt = (d: Date) => `${d.getMonth()+1}.${String(d.getDate()).padStart(2,'0')}`
                    return `${fmt(start)} 09:00 - ${fmt(end)} 09:00`
                  })()} | 共 {(newsData as NewsItem[]).length} 条
                  {crawlLog && ` (爬取自 ${crawlLog.sites.filter(s => s.status === 'success').length} 个网站)`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50"
                onClick={() => setShowLog(!showLog)}
              >
                <Terminal className="w-4 h-4" />
                {showLog ? '隐藏日志' : '爬取日志'}
              </button>
              <div className="text-right mr-2">
                <p className="text-xs text-gray-500">已选</p>
                <p className="text-xl font-bold text-blue-600">{selectedUrls.size}</p>
              </div>
              <button 
                className="inline-flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={makeArticle}
                disabled={selectedUrls.size === 0}
              >
                <Download className="w-4 h-4" />
                生成文章
              </button>
            </div>
          </div>
        </div>
      </header>

      {showLog && crawlLog && (
        <div className="bg-gray-900 text-green-400 p-4 font-mono text-sm">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-white font-bold mb-2">爬取日志</h3>
            <p className="mb-2">时间窗口: {crawlLog.window_start} ~ {crawlLog.window_end}</p>
            <table className="w-full">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-left py-1">网站</th>
                  <th className="text-left py-1">状态</th>
                  <th className="text-right py-1">数量</th>
                </tr>
              </thead>
              <tbody>
                {crawlLog.sites.map((site, idx) => (
                  <tr key={idx}>
                    <td className="py-1">{site.site}</td>
                    <td className="py-1">{site.status === 'success' ? '✅ 成功' : '❌ 失败'}</td>
                    <td className="text-right py-1">{site.count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showLog && !crawlLog && (
        <div className="bg-gray-900 text-yellow-400 p-4 font-mono text-sm">
          <div className="max-w-7xl mx-auto">
            ⚠️ 暂无爬取日志，请确认 crawl_log.json 文件格式正确
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-20 p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  全部新闻 ({(newsData as NewsItem[]).length})
                </button>

                <button
                  onClick={() => setFilter('recommended')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${filter === 'recommended' ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-gray-100'}`}
                >
                  <Star className="w-3 h-3 inline mr-1" /> 推荐选题 ({recommendedCount})
                </button>
                
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400 mb-1 px-3">按国家筛选</p>
                  {countries.map(country => (
                    <button
                      key={country}
                      onClick={() => setFilter(country)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${filter === country ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    >
                      {countryFlag[country]} {country}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button 
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50"
                  onClick={selectAll}
                >
                  <CheckSquare className="w-3 h-3" /> 全选
                </button>
                <button 
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50"
                  onClick={clearAll}
                >
                  <Square className="w-3 h-3" /> 取消
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="mb-3">
              <h2 className="text-sm font-medium text-gray-700">
                {filter === 'all' && '全部新闻'}
                {filter === 'recommended' && '⭐ 推荐选题'}
                {filter !== 'all' && filter !== 'recommended' && `${countryFlag[filter]} ${filter}`}
                <span className="text-gray-400 ml-2">({getDisplayCount()})</span>
              </h2>
            </div>

            <div className="space-y-2 overflow-auto max-h-[calc(100vh-280px)]">
              {(newsData as NewsItem[]).map((item) => {
                const isVisible = shouldShow(item, filter, searchTerm)
                const isSelected = selectedUrls.has(item.url)
                return (
                  <div
                    key={item.url}
                    className={`bg-white rounded-lg shadow-sm border p-3 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                    style={{ display: isVisible ? 'block' : 'none' }}
                    onClick={() => toggleSelect(item.url)}
                  >
                    <div className="flex items-start gap-3">
                      <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.url)}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${countryColors[item.country]}`}>
                            {countryFlag[item.country]} {item.country}
                          </span>
                          {item.recommended && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-yellow-100 text-yellow-700 border-yellow-200">
                              <Star className="w-3 h-3 mr-1" /> 推荐
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{item.source}</span>
                          <span className="text-xs text-gray-400">{item.time}</span>
                        </div>
                        <h3 className="text-sm font-medium">{item.title_cn}</h3>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener" 
                          onClick={(e: React.MouseEvent) => e.stopPropagation()} 
                          className="text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 inline" /> 查看原文
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
