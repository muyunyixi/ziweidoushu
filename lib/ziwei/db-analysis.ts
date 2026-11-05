/**
 * lib/ziwei/db-analysis.ts —— 纯本地算法与古籍规则论断引擎
 *
 * 包含：
 * 1. 14 主星 × 13 宫位主题知识库（STAR_DB），供 /knowledge 百科与本地断语引擎共用
 * 2. 确定性命盘十三维详批（analyzeTopicByRules）
 * 3. 十二宫位逐宫推演（analyzePalaceByRules，含空宫借对宫、三方四正、四化飞星）
 * 4. 四化飞化专题推演（analyzeSiHuaByRules）
 */

import type { ZiweiChart, Palace, Star } from './types';
import { BRANCHES, STEMS, STAR_DESCRIPTIONS, SI_HUA_TABLE } from './constants';
import { detectPatterns } from './patterns';
import { STAR_IN_FUQI_GU, SIHUA_IN_FUQI_GU } from './heming-knowledge';

export type TopicKey =
  | 'overview' | 'personality' | 'love' | 'career' | 'wealth' | 'health'
  | 'family' | 'children' | 'move' | 'friends' | 'home' | 'spirit' | 'parents';

export const TOPIC_PALACE_NAME: Record<TopicKey, string> = {
  overview:    '命宫',
  personality: '命宫',
  love:        '夫妻',
  career:      '官禄',
  wealth:      '财帛',
  health:      '疾厄',
  family:      '兄弟',
  children:    '子女',
  move:        '迁移',
  friends:     '仆役',
  home:        '田宅',
  spirit:      '福德',
  parents:     '父母',
};

export const TOPIC_LABEL: Record<TopicKey, string> = {
  overview:    '命格总览',
  personality: '性格特质',
  love:        '感情婚姻',
  career:      '事业职业',
  wealth:      '财富运势',
  health:      '健康状况',
  family:      '兄弟合伙',
  children:    '子女缘分',
  move:        '迁移外出',
  friends:     '人际贵人',
  home:        '田宅不动产',
  spirit:      '精神福德',
  parents:     '父母长辈',
};

export interface StarCoreMeta {
  element: string;
  nature: string;
  dingdiao: string;
  niHaixia: string;
  classical: string;
  career: string;
  love: string;
  wealth: string;
  health: string;
  family: string;
  children: string;
  move: string;
  friends: string;
  home: string;
  spirit: string;
  parents: string;
}

export const STAR_CORE_META: Record<string, StarCoreMeta> = {
  '紫微': {
    element: '己土', nature: '南北斗帝座 · 官禄主',
    dingdiao: '帝座临命，统御群星，气度尊贵，喜左辅右弼相佐以成大局。',
    niHaixia: '倪师指出：紫微是皇帝星，坐命者自带尊贵与孤高之气，不喜受人管束。紫微在命必须三方见左辅、右弼才叫有臣子辅佐，若无辅弼而独坐则为「孤君」，虽有气势却凡事亲力亲为。紫微在辰戌与天府同宫或对照，财官双美；最忌四煞（羊陀火铃）同宫冲破。',
    classical: '《紫微斗数全书》：「紫微帝座临命主尊贵，统领众星，坐命者主权威显达。得辅弼昌曲拱照，位至公卿；无吉相佐则为孤君。」',
    career: '天生具备统筹与领导气场，宜大平台管理、政界、公职或独立主持大局，忌长期处于纯执行底层。',
    love: '自尊心强，感情中习惯占主导或等待对方仰慕，宜晚婚、配成熟稳重且懂得尊重彼此空间的伴侣。',
    wealth: '重名声气度胜过蝇头小利，财源多随地位与平台水涨船高，宜稳健置业与长期复利积累。',
    health: '五行属阴土，对应脾胃与中焦运化。思虑过重或孤高郁结时易伤脾胃，宜规律饮食、舒展身心。',
    family: '手足与同侪中常扮演拿主意的角色，得吉星则兄弟贵显相助，逢煞则各自独立。',
    children: '对晚辈或下属要求较高，子女多有主见与自尊，宜以引导代替高压管束。',
    move: '出外自带贵人缘，喜结交有地位与格局之人，动中可得大平台机遇。',
    friends: '交友重质不重量，喜与有能力、守规矩的朋友往来，忌卷入琐碎是非。',
    home: '置业眼光高，偏好地段开阔、地势较高或安静体面的居所，田宅根基稳固。',
    spirit: '内心追求精神高度与尊严感，最怕寄人篱下，晚年宜修习经典以养清福。',
    parents: '父母或长辈家教严谨、重规矩体面，早年多得长辈或上级荫庇提拔。',
  },
  '天机': {
    element: '乙木', nature: '南斗益算 · 智慧兄弟主',
    dingdiao: '机谋敏锐，善察秋毫，动脑胜于动手，最宜策划、幕僚与专业技术立身。',
    niHaixia: '倪师说：天机是参谋星、军师星，全盘最聪明灵动，但「聪明外露则易多思伤神」。天机坐命者反应极快、通达权变，适合做策划、研究、技术与幕僚；天机化忌最忌钻牛角尖（聪明反被聪明误），宜离乡发展、以一技之长安身。',
    classical: '《紫微斗数全书》：「天机属木，身命逢之，为人精明机巧，动静皆宜，善策划经营；居庙旺则富贵声扬，陷地逢煞则多学少成。」',
    career: '极适合研发、IT、算法、策划、教育、咨询与参谋幕僚岗位，宜靠脑力与专业壁垒发展。',
    love: '心思细腻敏感，容易反复权衡，宜与性格豁达、有包容力或年龄有一定差距的伴侣相守。',
    wealth: '财由智生，属于靠专业技能、信息差与周转获利的模式，不宜守死财，宜设固定储蓄机制。',
    health: '五行属阴木，主肝胆、筋骨与神经系统。思虑过多易失眠多梦，宜静心养神、规律作息。',
    family: '为兄弟主星，入兄弟宫得吉则手足聪慧互助，逢四化变动则兄弟各奔东西。',
    children: '子女机敏好动、理解力强，宜培养其数理逻辑与专注力。',
    move: '天机性动，入迁移或命宫皆利外出求学、异地发展，越动越见生机。',
    friends: '朋友多为技术、文化、策划界聪明人士，往来灵活但需防泛泛之交。',
    home: '早年居所或置业易有搬迁换房之象，居家宜近学区、绿植或书香之地。',
    spirit: '大脑常年高速运转，精神世界极为丰富，需防焦虑内耗，修心以定慧为要。',
    parents: '长辈思维开明或好学善思，与父母沟通宜讲逻辑、少钻牛角尖。',
  },
  '太阳': {
    element: '丙火', nature: '中天司权 · 官禄主',
    dingdiao: '光明磊落，博爱济众，卯辰巳午入庙光辉大放，主声名与公职显达。',
    niHaixia: '倪师认为：太阳是日星，在卯、辰、巳、午、未宫为白天的太阳（入庙得旺），光芒万丈，为人光明正大、慷慨好施；在申酉戌亥子丑为夜生人或日落西山，劳心费力。太阳也代表男命的父亲与儿子、女命的丈夫，入庙则六亲得力，落陷化忌则需格外留意男性至亲健康。',
    classical: '《骨髓赋》：「太阳居午，谓之日丽中天，有专权之贵，敌国之富；女命逢之，旺夫益子，然过刚则宜柔济。」',
    career: '天生的公众与管理之星，极利公职、管理、外交、传媒、教育、新能源与大型机构，重名声重信誉。',
    love: '男命重责任好面子，女命独立干练；婚姻中宜少一点强势说教，多一分温柔体恤。',
    wealth: '太阳主贵不主私财，往往先有名声地位而后财禄随之，一生疏财仗义，宜由伴侣或制度协助守财。',
    health: '五行属阳火，主心脏、心血管、眼目与小肠。需防熬夜透支、心火上炎与视力疲劳。',
    family: '对待手足朋友极为仗义疏财，常主动照顾身边人，但有时出力不讨好。',
    children: '对子女期许高、慷慨付出，庙旺则得贵子，落陷则两代人沟通宜少用命令口吻。',
    move: '出外名声响亮，极易在异地或大舞台崭露头角，贵人多在明处。',
    friends: '交游广阔，三教九流皆能结交，但需防施恩反招怨，择友宜重品行。',
    home: '喜采光充足、视野开阔、向阳高朗之宅，置业宜选阳光充沛之地。',
    spirit: '胸怀坦荡、不记隔夜仇，但好面子易扛过多责任，宜学会适度卸下包袱。',
    parents: '与父亲缘分与互动尤为关键，太阳庙旺主得父辈或男长辈强力扶持。',
  },
  '武曲': {
    element: '辛金', nature: '北斗正财 · 财帛主',
    dingdiao: '刚毅果决，重诺守信，为北斗正财之星，执行力与理财魄力超群。',
    niHaixia: '倪师视武曲为正财星与将星，性格刚直、讲求实效、说一不二。武曲坐命或入财帛宫者极擅财务、金融与实业经营，辰戌丑未四墓库及与天府、天相同会时财官双美。但武曲带有刚孤之性，在感情婚姻上不宜太硬太直，晚婚或年龄互补最吉；武曲化忌须防资金断裂与金属外伤。',
    classical: '《紫微斗数全书》：「武曲属金，司财帛之主，居庙旺则刚毅果断，财禄丰盈，与贪狼同度则先贫后富，三十后大发。」',
    career: '极利金融、银行、财务审计、军警法务、外科、工程制造与实业创业，越需要决断力的岗位越能出彩。',
    love: '行动派胜过甜言蜜语，感情专一但表达生硬，宜晚婚、选温和体贴型伴侣以柔化刚。',
    wealth: '全盘第一正财星，赚钱目标明确、执行狠准，见化禄或禄存则财源滚滚，见火铃同宫有暴发之机。',
    health: '五行属阴金，主肺系、呼吸系统、大肠、鼻腔与骨骼牙齿，平时宜注重有氧呼吸与筋骨防护。',
    family: '手足关系干脆直接、明算账，少客套寒暄但关键时刻讲道义。',
    children: '管教严格、重规矩与独立性，子女多务实刚强。',
    move: '动中求财能力极强，适合去商业中心或外地开拓市场，劳而有功。',
    friends: '朋友多为实干家或生意伙伴，交往务实，忌与言而无信者合伙。',
    home: '不动产运势佳，尤其在辰戌丑未四库位，擅长购置保值增值的硬资产。',
    spirit: '事业心与危机感强，闲不住，宜培养柔和雅致的业余爱好以调剂刚性。',
    parents: '长辈作风硬朗务实，早年家教多偏严格独立。',
  },
  '天同': {
    element: '壬水', nature: '南斗益算 · 福德主',
    dingdiao: '温良谦和，知足常乐，为南斗第一福星，具化煞解厄之天然福泽。',
    niHaixia: '倪师说：天同是福星，性情最温和厚道、不喜与人争斗。天同坐命或入福德宫者一生衣食无忧、人缘极佳；天同化禄是最舒服的化禄，主福气深厚。唯天同偏安逸，有时需要一点煞星（如羊陀）或开创星激发斗志，否则易流于随遇而安。',
    classical: '《骨髓赋》：「天同为福德之主，守命则肥满温和，不畏凶危，逢吉则一生安享清福，机月同梁作吏人。」',
    career: '适合稳定的体制内公职、文化教育、餐饮休闲、医疗康养、艺术设计与服务行业，不宜恶性内卷高压竞争。',
    love: '温柔体贴、重情调与陪伴感，但面对感情抉择时容易心软被动，宜配成熟有主见的伴侣。',
    wealth: '属于福禄自然来之财，非暴利投机之财，中晚年积蓄渐丰，白手亦能成家。',
    health: '五行属阳水，主肾水、膀胱、泌尿、内分泌与耳部。平时需防贪凉饮冷、水湿代谢不畅与发福。',
    family: '手足和睦、少争端，遇到家庭矛盾常充当和事佬。',
    children: '子女温顺讨喜、有孝心，亲子关系融洽轻松。',
    move: '出门在外人缘好，易遇温和贵人提携，旅途顺遂平安。',
    friends: '朋友众多且相处愉快，喜聚餐品茗、雅集交游。',
    home: '居家追求舒适温馨，不求奢华但求安逸静谧，置业顺遂。',
    spirit: '全盘最重精神享受与内心宁静之星，天生乐观，晚年福寿双全。',
    parents: '父母慈爱温和，家庭氛围宽松，多得长辈疼爱。',
  },
  '廉贞': {
    element: '丁火', nature: '北斗五星 · 官禄主兼次桃花',
    dingdiao: '亦正亦邪，才华卓绝，守法则掌权柄印绶，入艺则风采照人。',
    niHaixia: '倪师强调：廉贞是官禄主，同时又是「次桃花」，五行属阴火（含木气），性格爱恨分明、才艺极高且讲求规矩体制。廉贞与天相同宫于子午为「廉相格」，化囚为印，极利行政公职与大机构掌权；廉贞化禄主威权与桃花人缘双收，但廉贞化忌必须严防官非文书、情绪冲动与血光外伤。',
    classical: '《紫微斗数全书》：「廉贞在官禄主威权，在身命为次桃花；遇天相则政治廉明，逢文昌好礼乐，遇杀星则显武职。」',
    career: '极适合行政管理、法务合规、军警纪检、精密科技、设计艺术与公关传播，兼具制度感与创造力。',
    love: '情感浓烈深沉、极其看重精神共鸣与魅力吸引，忌猜忌控制，宜晚婚、以共同事业或志趣维系长久感情。',
    wealth: '善于在体制规则、精密业务或创意才华中获利，逢禄则财源丰沛，化忌则绝不可触碰灰色违规之财。',
    health: '五行属阴火，主血液循环、心脑血管、免疫炎症与内分泌，宜清心降火、定期体检。',
    family: '手足个性鲜明，保持适度距离反而感情更好。',
    children: '子女个性独立、有艺术或技术天分，宜尊重其个性发展。',
    move: '在外社交魅力强，能迅速打入核心圈层，动中宜守法合规。',
    friends: '朋友跨度大，既有体制内精英也有才艺之士，需防因意气用事产生口舌。',
    home: '居家偏好有设计感与私密性的空间，注意电器电路与厨房火源安全。',
    spirit: '内心敏感炽热、追求极致完美，宜通过书法、运动或修行疏导执念。',
    parents: '长辈要求严苛或性情刚烈，早年自立自强。',
  },
  '天府': {
    element: '戊土', nature: '南斗令星 · 财帛田宅主',
    dingdiao: '南斗延寿解厄之令星，掌财宅之总库，厚重稳健，守成治世第一。',
    niHaixia: '倪师说：天府是南斗王、财库之星，性情稳重敦厚、深谋远虑，最擅长守财、管人与统筹资源。天府坐命者一生衣食丰足，女命尤佳（旺夫益子）。天府最喜见禄存或化禄（「府库充盈」），最怕地空、地劫同宫或夹制（「空库露库」），若为空库则宜以名师顾问或清高专业立身。',
    classical: '《紫微斗数全书》：「天府为禄库，命逢之终是富，不喜四煞冲击，最嫌空亡同度，得紫微昌曲左右相会，必登一品之贵。」',
    career: '极利企业高管、金融资管、银行国企、不动产、行政总管与稳健型创业，擅长在成熟体系中把盘子做大。',
    love: '重家庭责任与现实保障，感情稳健长久，虽少戏剧化浪漫，却是极可靠的终身伴侣。',
    wealth: '天生财库星，理财稳健、极擅资产配置与守财积蓄，逢禄则家资丰厚。',
    health: '五行属阳土，主脾胃消化与肌肉丰满。中年后需控糖控脂、防脾虚湿困与体重超标。',
    family: '手足敦厚稳重，家庭观念强，彼此能互为后盾。',
    children: '子女稳重懂事、有福气，家族传承有序。',
    move: '出外稳扎稳打，所到之处皆能建立稳固人脉与根据地。',
    friends: '结交多有家底、有地位或稳重守信之友，人脉护城河深。',
    home: '全盘最强田宅吉星之一，极利置业买房、不动产传承，居家宽敞厚重。',
    spirit: '心态从容淡定、有安全感，懂得以大局为重，福泽绵长。',
    parents: '家庭根基稳固，父母多务实持家，能得祖业或长辈庇荫。',
  },
  '太阴': {
    element: '癸水', nature: '中天富星 · 财帛田宅主',
    dingdiao: '清润皎洁，主富主藏，酉戌亥子丑入庙光辉全照，利田宅积蓄与内秀之才。',
    niHaixia: '倪师指出：太阴是月亮星，也是财帛主与田宅主，主富（太阳主贵，太阴主富）。太阴在酉、戌、亥、子、丑宫为夜晚的月亮，入庙大吉，主聪明内敛、温柔细腻、暗中积聚大财；在卯辰巳午未为白天的月亮（落陷），则较为操劳多思。太阴又代表母亲、妻子与女儿，男命太阴化忌最需注意婆媳与母妻关系协调。',
    classical: '《骨髓赋》：「太阴居子号曰水澄桂萼，得忠谏之职，清要之才；居亥则为月朗天门，晋爵封侯，富而且贵。」',
    career: '极利财务金融、税务审计、不动产、文化出版、文学艺术、心理学、教育与幕后统筹工作。',
    love: '情感温润深情、极重安全感与家庭氛围，男命得贤内助，女命温婉有气质。',
    wealth: '正宗慢财与大财库之星，擅长长线储蓄、不动产收租与稳健投资，越沉淀越富足。',
    health: '五行属阴水，主肾阴、内分泌、睡眠质量、眼目及妇科保养，宜避寒凉、保充足睡眠。',
    family: '与姐妹或女性亲友缘分尤深，手足间细腻体贴。',
    children: '易得秀丽聪慧之子女（常先女后男或女儿极有出息），亲子感情细腻。',
    move: '出外喜安静雅致之所，夜间或水边之地灵感尤佳，异地置业亦吉。',
    friends: '知心好友重情感共鸣，女性贵人运极旺。',
    home: '田宅正主，一生与房产地产缘分极深，入庙则多处不动产、家境清雅富足。',
    spirit: '精神世界极具诗意与审美情怀，偶有清愁感怀，宜寄情书画音乐以养神。',
    parents: '与母亲感情深厚，太阴庙旺则母寿且贤，落陷则宜多陪伴关怀母亲健康。',
  },
  '贪狼': {
    element: '甲木（根癸水）', nature: '北斗第一星 · 祸福才艺之主',
    dingdiao: '博学多能，八面玲珑，逢火铃成暴发之格，历练之后大器晚成。',
    niHaixia: '倪师强调：贪狼有两面，它既是才艺社交与桃花之星，又掌管生杀与修道之缘。贪狼坐命者求知欲极强、多才多艺、极擅公关交际；在午宫名「木火通明」反主武贵与清白大格局；遇火星、铃星同度为「火贪格 / 铃贪格」，主横发暴富。贪狼属晚发之星，三十五岁后锋芒内敛方能大成。',
    classical: '《紫微斗数全书》：「贪狼为祸福之主，在数则喜入庙，逢火铃而威名赫奕，遇吉曜则富贵绵长，会空亡则反主清白端正。」',
    career: '极适合市场营销、公关传媒、娱乐演艺、美学设计、餐饮时尚、心理玄学与新兴商业开拓。',
    love: '异性缘极旺，极具个人魅力，早年感情易丰富多变，宜晚婚、将精力投入事业与共同爱好。',
    wealth: '极具商业嗅觉与偏财爆发力，逢火铃或化禄时易获跨界横财，但发财后务必置换成不动产以守成。',
    health: '五行属甲木带癸水，主肝胆、肾水与代谢系统，应酬过多时需戒酒色熬夜、护肝养肾。',
    family: '手足各自精彩、性格独立，社交圈广。',
    children: '子女聪明活泼、才艺出众、表现欲强。',
    move: '最喜外出闯荡，社交场中如鱼得水，异地人脉极易打开。',
    friends: '三教九流朋友极多，擅长资源整合，但合伙做生意需立明文契约。',
    home: '置业偏爱繁华热闹地段或极具特色的设计风格，中晚年置业运渐旺。',
    spirit: '年轻时重世俗进取与感官体验，中年后往往对哲学、五术、养生或禅修产生深厚兴趣。',
    parents: '长辈性格外向或历练丰富，早年独立自主。',
  },
  '巨门': {
    element: '癸水', nature: '北斗二星 · 是非口舌与暗曜主',
    dingdiao: '深研笃思，口才便给，化气为暗，去疑存真则以专业与言辞名扬天下。',
    niHaixia: '倪师说：巨门是暗星、口舌星，观察力极敏锐、逻辑严密，不轻信盲从。巨门最喜逢太阳入庙照亮（「明日驱暗」）或得化禄、化权，立刻化口舌为黄金口才，成为大律师、名医、名师、学者或外交传播大家；唯独巨门化忌最惹无妄口舌是非，凡事宜少争一时之长短，靠硬核专业说话。',
    classical: '《骨髓赋》：「巨门子午科权禄，石中隐玉福兴隆；巨日同宫，官封三代；陷地逢煞，则防口舌官非。」',
    career: '极利法律律师、医师、高校教师、学术研究、主持人、自媒体、外交谈判、纪检审计与深度调查。',
    love: '内心深情但嘴上有时不饶人，最忌冷战与猜疑，宜与阳光开朗（太阳型）伴侣互补。',
    wealth: '典型的「开口生财、专业立身」模式，知识变现与咨询费率极高，忌替人作保或口头契约。',
    health: '五行属阴水（带金气），主口腔、咽喉、食道、脾胃消化及气管，宜清淡饮食、少生闷气。',
    family: '手足间说话直接，宜少挑剔多夸赞，以免因小事伤和气。',
    children: '子女思辨力强、爱追问为什么，宜引导其往学术或语言特长发展。',
    move: '出外宜凭专业技术与口碑立足，少管闲事则四方亨通。',
    friends: '倪师云「巨门入友宫宜慎择合伙」，交友贵精不贵多，君子之交淡如水最佳。',
    home: '居家宜选采光通透、安静避闹之所，房产交易合同务必逐字审阅。',
    spirit: '研究欲极强，认准一门学问能钻研到底（「石中隐玉」），修去多疑之心则福厚神清。',
    parents: '早年与长辈沟通易有代沟或言语摩擦，保持礼敬与适当空间反而和睦。',
  },
  '天相': {
    element: '壬水', nature: '南斗五星 · 官禄印绶之主',
    dingdiao: '掌印司爵，温良公正，为辅佐掌印之枢纽，逢财荫夹则福禄天然。',
    niHaixia: '倪师讲：天相是「印星」（宰相之印），为人斯文守礼、诚实守信、处事公正稳妥，最擅长协调各方关系与执掌印信文书。天相坐命者一生重体面、讲信用，最喜「财荫夹印」（巨门化禄与天梁夹制）及紫府相朝垣；最忌「刑忌夹印」（化忌与擎羊夹制），凡执印签字需审慎。',
    classical: '《紫微斗数全书》：「天相属水，南斗第五星也，为司爵之宿，化气曰印，主人衣食丰足，官禄昌隆，言行谨慎。」',
    career: '天生的首席幕僚、行政高管、人事财务总监、法官公证、风控合规与大型机构核心枢要人才。',
    love: '温和体贴、极具包容力与契约精神，多为熟人圈或知根知底的良缘，婚后稳定顾家。',
    wealth: '正财稳定优厚，常居高薪要职或稳定的高阶管理岗，不喜高风险赌博式投机。',
    health: '五行属阳水，主肾脏、膀胱、淋巴代谢与皮肤过敏，宜多饮温水、规律运动排汗。',
    family: '手足关系礼貌融洽，能彼此照应扶持。',
    children: '子女懂礼貌、守规矩、气质端庄，学业稳健。',
    move: '出外斯文得体，极易获得当地有头面人物的信任与委任。',
    friends: '朋友多为正派稳重之士，人际口碑极佳，常受托担任中间人与协调者。',
    home: '居家整洁考究、地段体面，周边环境秩序井然。',
    spirit: '重衣食体面与精神秩序感，乐于助人，唯需学会拒绝他人不合理的请托。',
    parents: '父母知书达理、门风端正，得长辈与上司器重。',
  },
  '天梁': {
    element: '戊土', nature: '南斗二星 · 父母医药延寿之荫星',
    dingdiao: '清高厚重，逢凶化吉，为父母与医药之荫星，具长者之风与慈悲救人之心。',
    niHaixia: '倪师最为推崇天梁的「荫」与「医、法、宗教」属性：天梁是老人星、清官星、医药星，坐命者心地善良、讲原则、有侠义心肠，一生遇难呈祥（逢凶化吉）。天梁在午宫或与太阳同宫于卯（日出扶桑 / 阳梁昌禄），主大贵与学术名望；唯天梁主清贵不主横财，不宜经商逐利，最利从医、从法、从教、纪检与公益。',
    classical: '《骨髓赋》：「天梁月曜女淫贫，遇太阳则万全；阳梁昌禄，胪传第一名；天梁守命，主寿长且逢凶化吉。」',
    career: '极利中医西医、医药健康、司法纪检、审计监察、高等学术、教育科研與社会公益事业。',
    love: '成熟稳重、习惯像长辈一样照顾伴侣，适宜晚婚或姐弟/老少配，感情重精神道义。',
    wealth: '以清誉、专业声望与资历取财，越老越值钱，忌贪求快钱或高杠杆投机（先历小磨难而后成大福）。',
    health: '五行属阳土，主脾胃消化与胸膈气机。虽偶有小疾，但每遇良医良药化解，寿元绵长。',
    family: '手足中常扮演长兄如父、长姐如母的照顾者角色。',
    children: '子女早熟稳重、孝顺知礼。',
    move: '出外常遇年长贵人或行业泰斗提携，异地逢凶化吉之力极强。',
    friends: '多结交年长、有学识或医法界良友，一言九鼎。',
    home: '易继承祖业老宅或购置有历史底蕴、环境清幽之不动产。',
    spirit: '内心清高淡泊，喜传统文化、医道、易学与哲学，精神境界超然。',
    parents: '父母宫正主，长辈健康长寿且家风严谨，深得祖荫庇护。',
  },
  '七杀': {
    element: '庚金（带丁火）', nature: '南斗六星 · 肃杀大将之星',
    dingdiao: '运筹帷幄，独当一面，具大将开疆之威，成败果决，不怒自威。',
    niHaixia: '倪师说：七杀是元帅大将之星，眼大有威、做事雷厉风行、绝不拖泥带水。七杀坐命者必历一番寒彻骨的磨砺，越在危机与逆境中越能爆发惊人战斗力（寅申子午「七杀朝斗 / 仰斗」格主大贵）。七杀入女命或夫妻宫则主独立刚强，婚姻宜晚、宜找各自事业独立之伴侣以聚少离多化解刑克。',
    classical: '《紫微斗数全书》：「七杀南斗第六星，乃将星也，实为杀破狼之枢要；朝斗仰斗，爵禄荣昌；见紫微则化杀为权。」',
    career: '极利独立创业、企业统帅、军警武职、外科急诊、硬核科技攻关、重工业与危机处理，天生帅才。',
    love: '爱恨果决、绝不敷衍将就，忌过度强势控制，晚婚且保持各自事业空间可长久。',
    wealth: '大开大合之财，擅长在行业变革与险中求胜中斩获厚利，得禄存同度或对宫天府守库则富贵双全。',
    health: '五行属刚金带火，主肺金、呼吸、筋骨刀伤与肠胃痔疾，运动与出行需注意外伤防护。',
    family: '手足各自独立打拼，少依赖。',
    children: '子女个性刚强有魄力，宜刚柔并济引导。',
    move: '最利远方开疆辟土，在陌生激烈的市场中反而能迅速杀出重围。',
    friends: '朋友不多但皆为生死患难之交，最恶背信弃义之人。',
    home: '早年为事业奔波，中年后一举置办大气硬朗之宅。',
    spirit: '内心孤独而强大，胜不骄败不馁，具侠骨担当。',
    parents: '早年多离家独立闯荡，靠自己打出一片天地。',
  },
  '破军': {
    element: '癸水', nature: '北斗七星 · 先破后立耗散之先锋',
    dingdiao: '破旧立新，勇冠三军，绝不墨守成规，于变局之中开创立业。',
    niHaixia: '倪师指出：破军是先锋大将，特点是「凡事必先破坏旧局、而后建立新局」。破军坐命者一身胆识、极具颠覆精神与创造力，最烦按部就班的死板工作。破军最喜见紫微同宫（紫破，帝王御将）或得化禄、化权（「破军化禄，破而后立，旧去新来更风光」）；入六亲宫则缘分较薄，宜聚少离多、晚婚修心。',
    classical: '《骨髓赋》：「破军子午，无煞官资清显，至公卿；破军一曜性难明，化禄化权反成奇功。」',
    career: '极利颠覆式创新创业、前沿技术研发、旧城改造、项目重整、军警先锋与自由跨界创作。',
    love: '追求灵魂震撼与无拘无束的真性情，宜历经沉淀后晚婚，与同样豁达独立的伴侣携手。',
    wealth: '不走寻常财路，往往在行业洗牌、产品迭代或跨界突破中一战成名，赚钱后宜交由稳健账户锁定。',
    health: '五行属阴水，主肾水、生殖泌尿、骨髓与外伤耗损，忌熬夜极限透支体力。',
    family: '手足各奔前程，独立性极强。',
    children: '子女极具创造力与叛逆突破精神，宜因材施教。',
    move: '一生足迹遍布四方，越换环境越能激发潜能。',
    friends: '结交多为敢想敢干的先锋人物，合作需明确权责边界。',
    home: '一生常有翻新装修、换房乔迁或跨城置业之举，居所宜近水或视野通达。',
    spirit: '永远保持少年般的探索欲与不服输精神，认准目标虽千万人吾往矣。',
    parents: '早年即展现独立主见，离祖自兴之格。',
  },
};

function buildTopicEntry(star: string, topic: TopicKey): string {
  const m = STAR_CORE_META[star];
  if (!m) return '';
  const palaceName = TOPIC_PALACE_NAME[topic];
  const topicTextMap: Record<TopicKey, string> = {
    overview: `${m.niHaixia}

在事业与人生走向上，${m.career} 在财富与身心调养上，${m.wealth}`,
    personality: `${m.niHaixia}

其内心底色为：${m.spirit} 待人接物上：${m.friends}`,
    love: `${STAR_IN_FUQI_GU[star]?.summary ? `夫妻宫核心特质：${STAR_IN_FUQI_GU[star].summary}。
` : ''}${m.love}

${STAR_IN_FUQI_GU[star]?.spouse_traits ? `配偶与互动画像：${STAR_IN_FUQI_GU[star].spouse_traits}。
婚期与相处建议：${STAR_IN_FUQI_GU[star].timing}。` : ''}`,
    career: `${m.career}

${m.niHaixia}`,
    wealth: `${m.wealth}

结合田宅财库来看：${m.home}`,
    health: `${m.health}

倪师《天纪》强调：「中医重在治未病，观疾厄与全盘煞星落宫地支，即可提前调理脏腑气机。」`,
    family: `${m.family}

在团队合作与手足往来中，宜发挥${star}星之长，互敬互助。`,
    children: `${m.children}

注重言传身教与因材施教，顺应其先天星性培养专长。`,
    move: `${m.move}

迁移宫与命宫互为表里（本宫与对宫），在外发展时宜善用${star}星的正面气场。`,
    friends: `${m.friends}

择友与合伙时，须参看三方四正是否有禄存、辅弼相助，忌化忌冲破。`,
    home: `${m.home}

阳宅环境对后天运势影响占三分之一（天、地、人各三分之一），宜保持居所气场明朗整洁。`,
    spirit: `${m.spirit}

福德宫主一生福分与精神根基，心安则命安。`,
    parents: `${m.parents}

父母宫亦主文书契约与长上贵人缘，顺道而行则助力倍增。`,
  };

  return [
    `**【一句话定调】**`,
    `${star}星属${m.element}（${m.nature}），入${palaceName}宫：${m.dingdiao}`,
    ``,
    `**【核心论断】**`,
    topicTextMap[topic],
    ``,
    `**【命盘依据】**`,
    `· 五行与星性：${star}星五行属${m.element}，${m.nature}。
· 庙旺与三方：入庙得旺且会左辅、右弼、文昌、文曲、天魁、天钺或化禄权科者，吉象倍增；若落陷且逢羊陀火铃空劫交冲，则需以人事修为与环境调理化解。`,
    ``,
    `**【经典出处】**`,
    `${m.classical}${STAR_IN_FUQI_GU[star]?.ni_quote ? `
倪海厦《天纪》：「${STAR_IN_FUQI_GU[star].ni_quote}」` : ''}`,
  ].join('\n');
}

export const STAR_DB: Record<string, Record<string, string>> = Object.fromEntries(
  Object.keys(STAR_CORE_META).map(star => [
    star,
    {
      mingGong:    buildTopicEntry(star, 'overview'),
      personality: buildTopicEntry(star, 'personality'),
      fuQi:        buildTopicEntry(star, 'love'),
      guanLu:      buildTopicEntry(star, 'career'),
      caiBo:       buildTopicEntry(star, 'wealth'),
      jiE:         buildTopicEntry(star, 'health'),
      xiongDi:     buildTopicEntry(star, 'family'),
      ziNv:        buildTopicEntry(star, 'children'),
      qianYi:      buildTopicEntry(star, 'move'),
      jiaoYou:     buildTopicEntry(star, 'friends'),
      tianZhai:    buildTopicEntry(star, 'home'),
      fuDe:        buildTopicEntry(star, 'spirit'),
      fuMu:        buildTopicEntry(star, 'parents'),
    },
  ])
);

// ─── 地支对应脏腑（倪海厦《天纪》规则：按疾厄宫及全盘煞星最集中之地支定脏腑） ───
const BRANCH_ORGAN_MAP: Record<number, { branchName: string; organ: string; meridian: string; advice: string }> = {
  0:  { branchName: '子', organ: '胆与泌尿系', meridian: '足少阳胆经（23:00-01:00）', advice: '务必在23点前入睡以养少阳胆气，少食油腻夜宵。' },
  1:  { branchName: '丑', organ: '肝与筋脉',   meridian: '足厥阴肝经（01:00-03:00）', advice: '忌熬夜动怒，保持肝血充足，注意眼目与筋膜舒展。' },
  2:  { branchName: '寅', organ: '肺与呼吸系', meridian: '手太阴肺经（03:00-05:00）', advice: '注重胸腔有氧呼吸运动，换季防风寒犯肺。' },
  3:  { branchName: '卯', organ: '大肠与排泄', meridian: '手阳明大肠经（05:00-07:00）', advice: '晨起宜饮温水促排便，饮食多补充膳食纤维。' },
  4:  { branchName: '辰', organ: '胃与消化系', meridian: '足阳明胃经（07:00-09:00）', advice: '三餐定时定量，早餐宜温热饱足，忌空腹冷饮。' },
  5:  { branchName: '巳', organ: '脾与运化系', meridian: '足太阴脾经（09:00-11:00）', advice: '防久坐思虑伤脾，适度健步走以助脾气升清。' },
  6:  { branchName: '午', organ: '心脏与血脉', meridian: '手少阴心经（11:00-13:00）', advice: '午间宜小憩15-30分钟养心阴，忌剧烈情绪波动。' },
  7:  { branchName: '未', organ: '小肠与吸收', meridian: '手太阳小肠经（13:00-15:00）', advice: '午餐营养宜均衡好吸收，午后多饮温水助代谢。' },
  8:  { branchName: '申', organ: '膀胱与水道', meridian: '足太阳膀胱经（15:00-17:00）', advice: '切勿憋尿，多舒展后背督脉与膀胱经，防腰背酸痛。' },
  9:  { branchName: '酉', organ: '肾脏与元气', meridian: '足少阴肾经（17:00-19:00）', advice: '护住腰腹与足底涌泉穴勿受寒，固护先天肾气。' },
  10: { branchName: '戌', organ: '心包与情志', meridian: '手厥阴心包经（19:00-21:00）', advice: '晚间宜散步谈心、听雅乐舒压，保持气血通畅。' },
  11: { branchName: '亥', organ: '三焦与内分泌', meridian: '手少阳三焦经（21:00-23:00）', advice: '睡前温水泡脚，减少手机蓝光刺激，调和三焦水火。' },
};

const SIHUA_MEANING: Record<string, { title: string; desc: string; action: string }> = {
  '禄': {
    title: '化禄（福禄 · 财源 · 顺遂之机）',
    desc: '化禄属土，主财禄、机遇、人缘与自然增益。所落宫位往往是命主一生最顺畅、最易获得资源回报或心生欢喜的领域。',
    action: '宜顺势深耕该宫位所代表的人事与资源，广结善缘，将禄气转化为长期积累。',
  },
  '权': {
    title: '化权（掌控 · 决断 · 开创之力）',
    desc: '化权属木，主掌权、责任、专业权威与主动争取。所落宫位代表命主极有主见、不服输、愿意亲自操盘掌舵的领域。',
    action: '宜在对应领域承担核心职责、考取专业资质，但与亲人伴侣相处时宜收一分强势。',
  },
  '科': {
    title: '化科（清誉 · 贵人 · 逢凶化吉）',
    desc: '化科属水，主功名、声誉、斯文才华与聪明贵人。所落宫位主名声清雅、聪明好学，且遇困难时常有贵人暗中化解。',
    action: '宜重视口碑积累、专业著作、考试进修与体面沟通，以文雅与信誉服人。',
  },
  '忌': {
    title: '化忌（执念 · 功课 · 需修之境）',
    desc: '化忌属水，主亏欠、执着、波折与人生必考题。倪师强调：化忌所在之宫，即是命主最在乎、最容易用力过猛或产生心结之处，同时冲照对宫。',
    action: '切忌在该领域强求硬碰或投机冒险，宜学会「看破放下、守正守拙」，将执念化为深耕专业的定力。',
  },
};

function getPalaceWithBorrowedMajors(chart: ZiweiChart, palace: Palace): {
  majorStars: Star[];
  borrowed: boolean;
  oppositePalace: Palace | undefined;
} {
  const directMajors = palace.stars.filter(s => s.type === 'major');
  const oppositeBranch = (palace.branch + 6) % 12;
  const oppositePalace = chart.palaces.find(p => p.branch === oppositeBranch);
  if (directMajors.length > 0) {
    return { majorStars: directMajors, borrowed: false, oppositePalace };
  }
  const oppMajors = oppositePalace?.stars.filter(s => s.type === 'major') ?? [];
  return { majorStars: oppMajors, borrowed: true, oppositePalace };
}

function formatStarList(stars: Star[]): string {
  if (stars.length === 0) return '无';
  return stars.map(s => {
    const b = s.brightnessLabel ? `(${s.brightnessLabel})` : (s.brightness === 'bright' ? '(庙旺)' : s.brightness === 'dim' ? '(落陷)' : '');
    const sh = s.siHua ? `[生年化${s.siHua}]` : '';
    return `${s.name}${b}${sh}`;
  }).join('、');
}

function getSanFangPalaces(chart: ZiweiChart, baseBranch: number): Palace[] {
  const branches = [baseBranch, (baseBranch + 6) % 12, (baseBranch + 4) % 12, (baseBranch + 8) % 12];
  return branches.map(b => chart.palaces.find(p => p.branch === b)).filter((p): p is Palace => Boolean(p));
}

function getOverlaySiHuaMap(chart: ZiweiChart, view?: 'mingpan' | 'daxian' | 'liunian', liunianYear?: number): {
  label: string;
  map: Record<string, string>;
} | null {
  if (!view || view === 'mingpan') return null;
  if (view === 'daxian') {
    const dx = chart.daXians[chart.currentDaXianIndex];
    if (!dx) return null;
    const dxPalace = chart.palaces.find(p => p.branch === dx.palaceBranch);
    if (!dxPalace) return null;
    const stars = SI_HUA_TABLE[dxPalace.stem];
    if (!stars) return null;
    return {
      label: `大限（${dx.startAge}–${dx.endAge}岁 · ${STEMS[dxPalace.stem]}${BRANCHES[dxPalace.branch]}限）`,
      map: { [stars[0]]: '禄', [stars[1]]: '权', [stars[2]]: '科', [stars[3]]: '忌' },
    };
  }
  const yr = liunianYear || new Date().getFullYear();
  const stemIdx = ((yr - 4) % 10 + 10) % 10;
  const stars = SI_HUA_TABLE[stemIdx];
  if (!stars) return null;
  return {
    label: `${yr}流年（${STEMS[stemIdx]}干）`,
    map: { [stars[0]]: '禄', [stars[1]]: '权', [stars[2]]: '科', [stars[3]]: '忌' },
  };
}

/**
 * 十三维主题确定性详批（纯本地算法 + 倪海厦《天纪》与《全书》规则）
 */
export function analyzeTopicByRules(
  chart: ZiweiChart,
  topic: TopicKey,
  view: 'mingpan' | 'daxian' | 'liunian' = 'mingpan',
  liunianYear: number = new Date().getFullYear(),
): string {
  const targetPalaceName = TOPIC_PALACE_NAME[topic];
  const targetPalace = chart.palaces.find(p => p.name === targetPalaceName)
    || chart.palaces.find(p => p.isMingGong)
    || chart.palaces[0];

  const { majorStars, borrowed, oppositePalace } = getPalaceWithBorrowedMajors(chart, targetPalace);
  const luckyStars = targetPalace.stars.filter(s => s.type === 'lucky');
  const shaStars = targetPalace.stars.filter(s => s.type === 'sha');
  const sanFang = getSanFangPalaces(chart, targetPalace.branch);
  const patterns = detectPatterns(chart);
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const overlay = getOverlaySiHuaMap(chart, view, liunianYear);

  const ganzhi = `${STEMS[targetPalace.stem]}${BRANCHES[targetPalace.branch]}`;
  const starNames = majorStars.map(s => s.name);
  const primaryStar = starNames[0] || '紫微';
  const meta = STAR_CORE_META[primaryStar];
  const secondaryMeta = starNames[1] ? STAR_CORE_META[starNames[1]] : null;

  // 汇总三方四正四化与吉煞
  const sfSiHua: string[] = [];
  const sfLucky: string[] = [];
  const sfSha: string[] = [];
  for (const p of sanFang) {
    for (const s of p.stars) {
      if (s.siHua) sfSiHua.push(`${p.name}${s.name}化${s.siHua}`);
      if (s.type === 'lucky') sfLucky.push(`${s.name}(${p.name})`);
      if (s.type === 'sha') sfSha.push(`${s.name}(${p.name})`);
    }
  }

  const lines: string[] = [];

  // 1. 核心定调
  lines.push(`**【${TOPIC_LABEL[topic]} · 核心定调】**`);
  if (borrowed) {
    lines.push(
      `本命**${targetPalace.name}宫**在**${ganzhi}**位为空宫，依倪海厦《天纪》「本宫空则借对宫（${oppositePalace?.name || '迁移'}宫）星曜论断」之法则，借入**${formatStarList(majorStars)}**主事。空宫借星者，早年或初涉此领域时可塑性极强、易受外部环境与贵人带动，中后期渐入佳境。`
    );
  } else {
    lines.push(
      `本命**${targetPalace.name}宫**坐落**${ganzhi}**位，主星为**${formatStarList(majorStars)}**（五行局：**${chart.wuxingJuName}** · **${chart.yinYangGender}**）。${meta ? meta.dingdiao : ''}${secondaryMeta ? ` 兼得${starNames[1]}同度，${secondaryMeta.dingdiao}` : ''}`
    );
  }

  // 2. 主星与倪师法则精解
  lines.push('');
  lines.push(`**【主星配置与倪师法则】**`);
  for (const st of majorStars) {
    const m = STAR_CORE_META[st.name];
    if (!m) continue;
    const topicDetailMap: Record<TopicKey, string> = {
      overview:    m.niHaixia,
      personality: `${m.niHaixia} 其心性特质：${m.spirit}`,
      love:        `${STAR_IN_FUQI_GU[st.name]?.summary ? `**${st.name}入夫妻**：${STAR_IN_FUQI_GU[st.name].summary}。` : ''}${m.love} ${STAR_IN_FUQI_GU[st.name]?.spouse_traits ? `配偶特征：${STAR_IN_FUQI_GU[st.name].spouse_traits}。` : ''}`,
      career:      `${m.career} ${m.niHaixia}`,
      wealth:      `${m.wealth} 结合财库：${m.home}`,
      health:      m.health,
      family:      m.family,
      children:    m.children,
      move:        m.move,
      friends:     m.friends,
      home:        m.home,
      spirit:      m.spirit,
      parents:     m.parents,
    };
    lines.push(`· **${st.name}星**（${m.element} · ${m.nature}）：${topicDetailMap[topic]}`);
    lines.push(`· **古籍引证**：${m.classical}`);
  }

  // 若为疾厄健康维度，额外加入倪师「全盘煞星落宫地支对应脏腑」法则
  if (topic === 'health') {
    let maxShaPalace = targetPalace;
    let maxShaCount = -1;
    for (const p of chart.palaces) {
      const c = p.stars.filter(s => s.type === 'sha' || s.siHua === '忌').length;
      if (c > maxShaCount) {
        maxShaCount = c;
        maxShaPalace = p;
      }
    }
    const jieOrgan = BRANCH_ORGAN_MAP[targetPalace.branch];
    const shaOrgan = BRANCH_ORGAN_MAP[maxShaPalace.branch];
    lines.push('');
    lines.push(`**【天纪子午流注与脏腑重点】**`);
    if (jieOrgan) {
      lines.push(`· **疾厄宫地支（${jieOrgan.branchName}宫）**：对应**${jieOrgan.organ}**，气血流注时辰为**${jieOrgan.meridian}**。日常养护：${jieOrgan.advice}`);
    }
    if (shaOrgan && maxShaPalace.branch !== targetPalace.branch) {
      lines.push(`· **全盘煞忌最集中宫位（${maxShaPalace.name}宫 · ${shaOrgan.branchName}支）**：依倪师「全盘杀星最集中之宫，按其地支对应脏腑」法则，亦须重点护持**${shaOrgan.organ}**（${shaOrgan.advice}）。`);
    }
  }

  // 若为感情婚姻维度，额外检查福德宫（倪师双宫联参法则）
  if (topic === 'love') {
    const fudePalace = chart.palaces.find(p => p.name === '福德');
    if (fudePalace) {
      const fudeMajors = getPalaceWithBorrowedMajors(chart, fudePalace);
      lines.push('');
      lines.push(`**【夫妻宫与福德宫双宫联参】**`);
      lines.push(`倪师《天纪》口诀：「看婚姻，光看夫妻宫大错特错，一定要同时看福德宫。」您的**福德宫**在**${STEMS[fudePalace.stem]}${BRANCHES[fudePalace.branch]}**位，主星为**${formatStarList(fudeMajors.majorStars)}**${fudeMajors.borrowed ? '（借对宫）' : ''}。夫妻宫主外在相处与配偶特质，福德宫主深层情绪价值与婚姻续航力，两宫互参方为全貌。`);
    }
  }

  // 3. 三方四正与四化飞星联动
  lines.push('');
  lines.push(`**【三方四正与四化联动】**`);
  lines.push(
    `· **本宫辅煞**：吉星见【${luckyStars.length > 0 ? formatStarList(luckyStars) : '无直接同度'}】，煞星见【${shaStars.length > 0 ? formatStarList(shaStars) : '本宫无煞，气场清纯'}】。`
  );
  lines.push(
    `· **三方会照（${sanFang.map(p => p.name).join(' · ')}）**：三方四正共会吉星**${sfLucky.length}**颗${sfLucky.length > 0 ? `（${sfLucky.slice(0, 6).join('、')}）` : ''}，煞星**${sfSha.length}**颗${sfSha.length > 0 ? `（${sfSha.slice(0, 6).join('、')}）` : ''}。`
  );
  if (sfSiHua.length > 0) {
    lines.push(`· **生年四化引动**：三方四正见**${sfSiHua.join('、')}**。四化乃推动运势之枢机，逢禄权科处宜积极作为，逢化忌处宜守正修心。`);
  } else {
    lines.push(`· **生年四化引动**：本宫三方四正未见生年四化直接剧烈冲克，走势相对平稳可控，重在后天人事耕耘。`);
  }

  // 4. 古籍格局匹配（若命盘存在经典格局）
  if (patterns.length > 0 && (topic === 'overview' || topic === 'career' || topic === 'wealth' || topic === 'personality')) {
    lines.push('');
    lines.push(`**【命盘古籍格局检定（共 ${patterns.length} 格）】**`);
    for (const pat of patterns.slice(0, 4)) {
      lines.push(`· **${pat.name}**（${pat.palaces.join('/')}）：${pat.description}${pat.source ? `（出处：${pat.source}）` : ''}`);
    }
  }

  // 5. 当前大限与流年叠加应期
  lines.push('');
  lines.push(`**【大限与流年运势应期】**`);
  if (currentDx) {
    const dxPalace = chart.palaces.find(p => p.branch === currentDx.palaceBranch);
    const dxMajors = dxPalace ? getPalaceWithBorrowedMajors(chart, dxPalace) : null;
    lines.push(
      `· **当前十年大限（${currentDx.startAge}–${currentDx.endAge}岁）**：行运落入本命**${currentDx.palaceName}**（${dxPalace ? `${STEMS[dxPalace.stem]}${BRANCHES[dxPalace.branch]}` : ''}），主星**${dxMajors ? formatStarList(dxMajors.majorStars) : '无'}**。这十年的人生重心围绕「${currentDx.palaceName}」展开。`
    );
  }
  if (overlay) {
    const overlayEntries = Object.entries(overlay.map).map(([stName, sh]) => {
      const p = chart.palaces.find(pl => pl.stars.some(s => s.name === stName));
      return `${stName}化${sh}（入${p?.name || '命盘'}）`;
    });
    lines.push(`· **${overlay.label}四化飞星**：${overlayEntries.join('、')}。`);
  }

  // 6. 知行合一建议
  lines.push('');
  lines.push(`**【天纪知行合一建议】**`);
  lines.push(
    `倪师常言：「先天命盘只占三分之一，地理环境占三分之一，后天的人心意念与努力占三分之一（人事 + 地理 > 先天命数）。」针对**${TOPIC_LABEL[topic]}**，宜充分发挥**${primaryStar}星**之正面禀赋，借三方吉曜之力顺势而为；凡遇煞忌同度之宫，以退为进、修身谨言，自能化险为夷。`
  );

  return lines.join('\n');
}

/**
 * 点击十二宫位时的确定性单宫深度推演
 */
export function analyzePalaceByRules(
  chart: ZiweiChart,
  palace: Palace,
  view: 'mingpan' | 'daxian' | 'liunian' = 'mingpan',
  liunianYear: number = new Date().getFullYear(),
): string {
  const { majorStars, borrowed, oppositePalace } = getPalaceWithBorrowedMajors(chart, palace);
  const luckyStars = palace.stars.filter(s => s.type === 'lucky');
  const shaStars = palace.stars.filter(s => s.type === 'sha');
  const minorStars = palace.stars.filter(s => s.type === 'minor');
  const sanFang = getSanFangPalaces(chart, palace.branch);
  const ganzhi = `${STEMS[palace.stem]}${BRANCHES[palace.branch]}`;
  const overlay = getOverlaySiHuaMap(chart, view, liunianYear);

  const PALACE_DOMAIN: Record<string, string> = {
    '命宫': '先天格局、核心性格、一生总枢与外在气质',
    '兄弟': '手足情缘、亲密合作伙伴、现金流周转与人际助力',
    '夫妻': '婚姻感情、配偶特质、恋爱模式与深层伴侣契合度',
    '子女': '子女缘分、晚辈门生、才艺创作力与投资桃花',
    '财帛': '正偏财运、赚钱模式、现金流吞吐与理财手腕',
    '疾厄': '先天体质、脏腑强弱、情绪抗压与健康保养重点',
    '迁移': '外出发展、异地机遇、社会第一印象与外在际遇',
    '仆役': '平辈社交、团队下属、客户人脉与异性知己缘',
    '官禄': '事业方向、职场晋升、创业格局与社会地位成就',
    '田宅': '不动产置业、家宅风水、家族根基与终极藏财之库',
    '福德': '精神境界、内心福分、情绪底色、睡眠与晚年清福',
    '父母': '父母长辈缘、家教传承、上司贵人、功名考试与文书契约',
  };

  const lines: string[] = [];
  lines.push(`**【${palace.name}宫（${ganzhi}位）· 宫位定性】**`);
  lines.push(`· **主管范畴**：${PALACE_DOMAIN[palace.name] || '本宫核心人事'}。`);
  if (palace.isMingGong) lines.push(`· **本命核心**：此宫为您的**本命宫**，统领全盘十二宫之气象。`);
  if (palace.isShenGong) lines.push(`· **后天身宫**：此宫兼为您的**身宫**，三十岁后人生重心与行为模式尤为受此宫星曜牵引。`);
  if (palace.daXianAge) {
    lines.push(`· **大限年限**：对应大限为 **${palace.daXianAge[0]}–${palace.daXianAge[1]} 岁**${palace.isCurrentDaXian ? '（★ 当前正行此步大限）' : ''}。`);
  }

  lines.push('');
  lines.push(`**【本宫星曜与庙旺配置】**`);
  if (borrowed) {
    lines.push(`· **主星状态**：本宫无正曜（空宫），借对宫（**${oppositePalace?.name || ''}宫**）主星 **${formatStarList(majorStars)}** 推演。`);
  } else {
    lines.push(`· **坐守主星**：**${formatStarList(majorStars)}**。`);
  }
  lines.push(`· **同度吉星**：${luckyStars.length > 0 ? formatStarList(luckyStars) : '无直接同度吉星'}。`);
  lines.push(`· **同度煞星**：${shaStars.length > 0 ? formatStarList(shaStars) : '本宫无四煞空劫，宫位纯净'}。`);
  if (minorStars.length > 0) {
    lines.push(`· **杂曜神煞**：${minorStars.map(s => s.name).join('、')}${palace.changSheng12 ? ` · 长生十二神【${palace.changSheng12}】` : ''}${palace.boShi12 ? ` · 博士十二神【${palace.boShi12}】` : ''}。`);
  }

  lines.push('');
  lines.push(`**【主星入${palace.name}宫精解】**`);
  for (const st of majorStars) {
    const m = STAR_CORE_META[st.name];
    if (!m) continue;
    lines.push(`· **${st.name}星**：${m.dingdiao} ${m.niHaixia}`);
    if (st.siHua && SIHUA_MEANING[st.siHua]) {
      lines.push(`· **${st.name}生年化${st.siHua}**：${SIHUA_MEANING[st.siHua].desc}`);
    }
    if (overlay && overlay.map[st.name]) {
      const osh = overlay.map[st.name];
      lines.push(`· **${overlay.label}${st.name}化${osh}**：引动本宫运势，${SIHUA_MEANING[osh]?.action || ''}`);
    }
  }

  lines.push('');
  lines.push(`**【三方四正会照（${sanFang.map(p => p.name).join(' · ')}）】**`);
  for (const sp of sanFang) {
    if (sp.branch === palace.branch) continue;
    const rel = sp.branch === (palace.branch + 6) % 12 ? '对宫朝照' : '三合会照';
    const spMajors = sp.stars.filter(s => s.type === 'major');
    const spLucky = sp.stars.filter(s => s.type === 'lucky');
    const spSha = sp.stars.filter(s => s.type === 'sha');
    lines.push(
      `· **${rel} · ${sp.name}宫（${STEMS[sp.stem]}${BRANCHES[sp.branch]}）**：主星【${spMajors.length > 0 ? formatStarList(spMajors) : '空宫'}】${spLucky.length > 0 ? `，吉星【${spLucky.map(s => s.name).join('、')}】` : ''}${spSha.length > 0 ? `，煞星【${spSha.map(s => s.name).join('、')}】` : ''}。`
    );
  }

  lines.push('');
  lines.push(`**【本宫修持与实战建议】**`);
  const hasJi = palace.stars.some(s => s.siHua === '忌' || (overlay && overlay.map[s.name] === '忌'));
  const hasLu = palace.stars.some(s => s.siHua === '禄' || s.name === '禄存' || (overlay && overlay.map[s.name] === '禄'));
  if (hasJi) {
    lines.push(`本宫见**化忌**引动，代表您在「${palace.name}」领域投入心力最深、也最容易产生执念与波折。切忌急功近利或强行逆势操作，宜以稳守、合规与换位思考化解阻力。`);
  } else if (hasLu) {
    lines.push(`本宫得**禄星**照拂，气机顺畅，在「${palace.name}」相关事务上多得天然机遇与良缘助力，宜把握良机积极深耕。`);
  } else {
    lines.push(`本宫气场中正，宜结合主星【${majorStars.map(s => s.name).join('、')}】之长处稳步经营，与三方四正优势互补。`);
  }

  return lines.join('\n');
}

/**
 * 点击四化徽章（禄/权/科/忌）时的确定性专题推演
 */
export function analyzeSiHuaByRules(
  chart: ZiweiChart,
  starName: string,
  siHua: string,
  view: 'mingpan' | 'daxian' | 'liunian' = 'mingpan',
  liunianYear: number = new Date().getFullYear(),
): string {
  const palace = chart.palaces.find(p => p.stars.some(s => s.name === starName));
  const oppPalace = palace ? chart.palaces.find(p => p.branch === (palace.branch + 6) % 12) : undefined;
  const viewLabel = view === 'daxian' ? '大限' : view === 'liunian' ? `${liunianYear}流年` : '生年本命';
  const shMeta = SIHUA_MEANING[siHua] || SIHUA_MEANING['禄'];
  const starMeta = STAR_CORE_META[starName];

  const lines: string[] = [];
  lines.push(`**【${viewLabel} · ${starName}化${siHua}（落${palace?.name || '本命'}宫）】**`);
  lines.push(`· **四化定性**：${shMeta.title}`);
  lines.push(`· **核心机理**：${shMeta.desc}`);
  lines.push('');
  lines.push(`**【星曜与宫位联动】**`);
  if (starMeta) {
    lines.push(`· **${starName}星本义**：${starMeta.dingdiao}`);
  } else {
    const brief = STAR_DESCRIPTIONS[starName];
    if (brief) lines.push(`· **${starName}星本义**：五行属${brief.element}（${brief.nature}），主${brief.keywords}。`);
  }
  if (palace) {
    lines.push(
      `· **落入${palace.name}宫（${STEMS[palace.stem]}${BRANCHES[palace.branch]}）**：${starName}化${siHua}引动${palace.name}宫并照会或冲动对宫**${oppPalace?.name || ''}宫**。${siHua === '忌' ? `尤其需要注意${palace.name}宫与对宫${oppPalace?.name || ''}宫的事物不可强求、防范突发阻力。` : `为${palace.name}宫与对宫${oppPalace?.name || ''}宫注入${siHua === '禄' ? '丰沛财禄与机缘' : siHua === '权' ? '强大执行力与掌控权' : '清誉名声与贵人解厄之力'}。`}`
    );
  }
  if (palace?.name === '夫妻' && SIHUA_IN_FUQI_GU[`化${siHua}` as keyof typeof SIHUA_IN_FUQI_GU]) {
    lines.push(`· **夫妻宫四化特断**：${SIHUA_IN_FUQI_GU[`化${siHua}` as keyof typeof SIHUA_IN_FUQI_GU]}`);
  }
  lines.push('');
  lines.push(`**【趋吉避凶建议】**`);
  lines.push(shMeta.action);

  return lines.join('\n');
}
