import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set request payload limit to 20MB to handle high-resolution image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Helper to get Gemini Client lazily to prevent crashing if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing. Please configure it in your Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function getNineRecommendedHairstyles(shape: string): any[] {
  const normShape = (shape || '').toLowerCase();
  
  const scores: Record<string, Record<string, number>> = {
    oval: {
      bob: 95, french_waves: 94, cloud_perm: 93, japanese_layered: 91,
      classic_undercut: 90, curtain_bangs: 98, pixie_cut: 92, wolf_cut: 91, airy_bangs_long: 97
    },
    round: {
      bob: 91, french_waves: 84, cloud_perm: 81, japanese_layered: 92,
      classic_undercut: 86, curtain_bangs: 96, pixie_cut: 88, wolf_cut: 90, airy_bangs_long: 93
    },
    square: {
      bob: 87, french_waves: 93, cloud_perm: 96, japanese_layered: 84,
      classic_undercut: 82, curtain_bangs: 91, pixie_cut: 80, wolf_cut: 88, airy_bangs_long: 90
    },
    heart: {
      bob: 90, french_waves: 91, cloud_perm: 95, japanese_layered: 87,
      classic_undercut: 84, curtain_bangs: 93, pixie_cut: 91, wolf_cut: 85, airy_bangs_long: 94
    },
    long: {
      bob: 92, french_waves: 93, cloud_perm: 97, japanese_layered: 83,
      classic_undercut: 81, curtain_bangs: 91, pixie_cut: 78, wolf_cut: 84, airy_bangs_long: 96
    }
  };

  const activeScores = scores[normShape] || scores.oval;

  const getCustomDetails = (presetId: string) => {
    switch (presetId) {
      case 'bob':
        return {
          name: "日系俐落短髮波波頭",
          tag: "經典俐落",
          desc: "長度約抵下巴的齊平短髮，髮尾作收縮內彎。不帶過多厚重層次，自帶垂墜俐落束感。",
          why: normShape.includes('round') 
            ? "能在面頰兩側構成直向線條拉伸，中和圓臉本身的橫向膨脹感，瞬間縮小雙頰。"
            : normShape.includes('square')
            ? "兩側剛好覆蓋下顎骨拐角，透過底部微往面骨內扣的弧度，溫柔遮蔽腮骨。"
            : normShape.includes('long')
            ? "齊下巴的長度在橫向提供立體折疊，使視覺上中庭與下庭寬度增加，顯得不那麼窄長。"
            : "能精妙地貼合完美骨架，讓下顎線條與唇周五官倍顯精緻流暢。",
          tips: "使用平板夾微往內夾順髮梢，洗乾吹整時手指朝臉側包覆，可搭配防潮順髮油保持無暇光澤。推薦度：⭐⭐⭐⭐"
        };
      case 'french_waves':
        return {
          name: "日系空氣感紋理燙",
          tag: "空氣紋理",
          desc: "微捲的紋理燙能為髮絲注入蓬鬆空氣感，柔化臉部線條，展現隨性慵懶日系風。",
          why: normShape.includes('square')
            ? "不對稱、柔和鬆塌的法式捲度能有效拆解、覆蓋突出的腮幫子，將生硬拐點完全融化在髮絲裡。"
            : normShape.includes('round')
            ? "透過蓬鬆流暢的外弧線把大眾注意力轉移，有效削弱圓臉肌肉過於擁擠和圓潤膨脹感。"
            : "高雅慵懶的大波浪對稱度奇高，最能襯托雙頰線條，宛如巴黎名媛自帶鬆弛感。",
          tips: "洗完頭髮抹些椰子油或者造型奶，自然烘乾，用手順著方向撥開。切勿過度梳直以防毛躁。推薦度：⭐⭐⭐⭐⭐"
        };
      case 'cloud_perm':
        return {
          name: "蓬鬆厚實雲朵燙",
          tag: "復古微捲",
          desc: "如雲朵般輕盈柔軟的大弧度波浪，為面頰側邊帶來極富溫醇及鬆弛感的立體氛圍。",
          why: normShape.includes('long')
            ? "在面頰左右兩方構件大面量、澎潤橫向弧形，阻斷縱長感，將窄長面骨修飾得圓足美妙。"
            : normShape.includes('heart')
            ? "雲朵般寬大的下擺捲度，恰好在瘦削尖細的下巴兩側補足了面量比例，免去頭重腳輕感。"
            : "能營造充沛飽滿的髮量厚度，大範圍包覆全臉，極致顯臉小。",
          tips: "半濕時使用蓬蓬水，配合熱風罩朝上托起捧吹。平時可用寬齒梳疏理，維持雲朵般綿密弧度。推薦度：⭐⭐⭐⭐"
        };
      case 'japanese_layered':
        return {
          name: "自然流線樹葉剪",
          tag: "知性流線",
          desc: "自然垂墜如樹葉般的雙側流線劉海，營造出優雅的文藝氣息，非常契合知性氣質。",
          why: normShape.includes('round')
            ? "高高隆起的頂部立體感與削緊打薄的兩側相成，使圓潤的臉部產生往上拉長延伸的錯覺。"
            : normShape.includes('square')
            ? "不規則、輕微外翹貼面的層次碎髮，能在剛硬骨骼週圍劃出弧形柔光，消除生硬角。"
            : "凸顯立體俐落的下巴和頸部，使清亮帥氣的面部五官結構大方展露。",
          tips: "吹乾時可用黏度適中的啞光髮蠟稍微將髮梢揉出幾束向外翹度，增加動感。推薦度：⭐⭐⭐⭐"
        };
      case 'classic_undercut':
        return {
          name: "美式街頭極簡寸頭",
          tag: "極簡寸頭",
          desc: "極簡的寸頭能夠最大化地凸顯您精緻的五官與立體的骨骼結構，極具硬朗型男風範。",
          why: normShape.includes('oval') || normShape.includes('heart')
            ? "極大化露出精緻的眉眼和對稱的精細五官。俐落自信、大顯名流巨星風範。"
            : "讓五官受光亮點最完美呈現，削尖 of 兩側在耳周提供直爽切面，提升面部精神氣場。",
          tips: "不需要過多打理，定時修剪兩邊漸層即可。極其省心且具備爆棚硬漢格調。推薦度：⭐⭐⭐⭐⭐"
        };
      case 'curtain_bangs':
        return {
          name: "韓系經典逗號劉海",
          tag: "韓系帥氣",
          desc: "半露額頭的逗號劉海能修飾額頭寬度，增添溫柔且時尚的韓系紳士帥氣感。",
          why: normShape.includes('heart') || normShape.includes('round')
            ? "八字碎瀏海剛好收窄偏寬的額頭兩端或遮擋雙頰外包，拉出完美的桃形中心視覺。"
            : "能為額頭和兩頰構成高雅的漸層弧度，流暢度滿分，任何骨感都能被完美霧化隱形。",
          tips: "特別注意每天用大型夾子將瀏海中段和根部夾高吹整 3 分鐘，即可構建恆久自然的八字外撇。推薦度：⭐⭐⭐⭐⭐"
        };
      case 'pixie_cut':
        return {
          name: "清爽陽光碎蓋頭",
          tag: "陽光減齡",
          desc: "輕盈的碎劉海蓋頭既減齡又好整理，非常適合便捷日常，散發鄰家男孩的親和力。",
          why: normShape.includes('oval') || normShape.includes('heart')
            ? "襯托精妙小巧的下巴，讓五官彷彿被高光聚焦，給人極其精靈生動活潑、輕盈的魅力。"
            : "能清爽框住面部中央，打造出眾的氣質層次，精神抖擻、修長感大升。",
          tips: "抹少許清透型精華油，以指腹朝外稍微抓撥，保持自然、帶有些微空氣濕髮的質感。推薦度：⭐⭐⭐⭐"
        };
      case 'wolf_cut':
        return {
          name: "微復古輕狼尾剪",
          tag: "復古層次",
          desc: "後頸處適度留長的輕狼尾剪裁，充滿層次律動感，彰顯獨特的個性與時尚態度。",
          why: normShape.includes('square') || normShape.includes('round')
            ? "不規則、輕盈的碎剪尾羽完全打破兩側沉重呆板的拐角或包子臉圓潤，拉開立體街頭酷感。"
            : "能夠豐富原本趨於平淡的外輪廓，賦予五官與雙眼強烈神秘與冷豔魅力。",
          tips: "半濕時使用定型髮乳或乾蓬粉抓於手心，由下往上捏托塑造凌亂層次，再用吹風低溫鎖定。推薦度：⭐⭐⭐⭐"
        };
      case 'airy_bangs_long':
        return {
          name: "經典英倫三七分油頭",
          tag: "紳士分線",
          desc: "俐落的旁分三七分油頭能完美展現您的下顎線條，散發成熟、自信與穩健的紳士魅力。",
          why: normShape.includes('long')
            ? "空氣瀏海完美的填補了額骨跟高高的髮際線。垂墜微捲溫順包裹臉頰，大幅消滅窄長中下庭比例。"
            : normShape.includes('round')
            ? "輕透的空氣感完全不會悶塞臉盤，搭配順著側邊落下的自然長波浪，修飾掉橫寬肉肉臉。"
            : "給人滿滿鄰家女孩的甜美與溫潤好感，同時也是超凡絕倫的百搭容貌修飾大招。",
          tips: "洗後向後吹出形狀，塗抹適量水性髮油，使用密齒梳向後方大梳成形分線，配合噴霧加強。推薦度：⭐⭐⭐⭐⭐"
        };
      default:
        return {
          name: "浪漫法式八字空靈長髮",
          tag: "溫柔女神",
          desc: "自然漂亮的修容大師。",
          why: "全方位契合您的臉型特徵與骨骼重心。",
          tips: "使用圓梳順時吹整即可。"
        };
    }
  };

  const presets: string[] = [
    'bob', 'french_waves', 'cloud_perm', 'japanese_layered', 
    'classic_undercut', 'curtain_bangs', 'pixie_cut', 'wolf_cut', 'airy_bangs_long'
  ];

  return presets.map((pid, idx) => {
    const detail = getCustomDetails(pid);
    const score = activeScores[pid] || 90;
    return {
      id: `${normShape}_preset_${pid}_${idx}`,
      name: detail.name,
      tag: detail.tag,
      suitabilityScore: score,
      description: detail.desc,
      whyItFits: detail.why,
      stylingTips: detail.tips,
      tryonPresetId: pid
    };
  });
}

// REST API for Face Shape Analysis and Hairstyle Recommendations
app.post("/api/analyze", async (req, res) => {
  try {
    const { image, mimeType, isDemo, demoFaceShape, stylePreference } = req.body;

    // Check if it's a demo mode request
    if (isDemo) {
      console.log(`Demo analysis triggered for face shape: ${demoFaceShape || 'oval'}`);
      // Return highly structured, beautiful mock response to match the FaceShapeAnalysis schema
      const demoResponses: Record<string, any> = {
        oval: {
          faceShape: "鵝蛋臉 (Oval Face)",
          confidence: 0.95,
          analysis: {
            description: "鵝蛋臉是公認最完美對稱、比例最勻稱的臉型。特徵是額頭略微寬於下顎，下巴圓潤，整體線條流暢，近乎黃金比例 1:1.5。",
            features: [
              "臉市長寬比例約為 1.5 : 1，極度勻稱",
              "顴骨處最寬，整體線條平滑柔和",
              "下巴微圓，無突出的下顎棱角"
            ],
            ratioExplanation: "面部橫向最寬點（顴骨）至面部縱向長度的比例展現完美流暢感，額頭與下庭比例近乎一比一。"
          },
          hairstyles: [
            {
              id: "curtain_bangs_long",
              name: "法式浪漫八字瀏海長髮",
              tag: "柔美波浪",
              suitabilityScore: 98,
              description: "兩側頭髮垂落至顴骨下方，再以自然的大捲度向外翻，並銜接大波浪長髮，增添浪漫感與迷人風情。",
              whyItFits: "鵝蛋臉完美的對稱度無須遮掩缺點，八字瀏海能優雅地框出精緻五官，展現最完美的流暢線條與氣質。",
              stylingTips: "吹乾時使用大圓梳將兩側瀏海往後繞吹，再用手撥開即可呈現完美的八字向外翻曲線。難度：⭐⭐",
              tryonPresetId: "curtain_bangs"
            },
            {
              id: "classic_layer_bob",
              name: "日系空氣剪輕盈波波頭",
              tag: "輕盈短髮",
              suitabilityScore: 92,
              description: "長度及肩或下巴處的短髮，搭配空氣瀏海或層次打薄，讓髮尾呈現內包弧度或隨性微捲，清爽俐落。",
              whyItFits: "輕盈的波波頭能凸顯鵝蛋臉優雅流暢的的下顎線條，使整個人看起來更加活潑、減齡且富有層次感。",
              stylingTips: "建議使用平板夾稍作內彎整理，或者吹風機朝髮尾內側壓吹定型，亦可抹少許造型髮蠟打造束感。難度：⭐⭐⭐",
              tryonPresetId: "bob"
            },
            {
              id: "glam_french_waves",
              name: "法式復古微捲羊毛燙",
              tag: "豐盈捲髮",
              suitabilityScore: 89,
              description: "蓬鬆感十足、捲度錯落有致的法式浪漫捲髮，從鎖骨或肩膀位置開始燙起，形成柔潤、自然的雲朵狀堆疊。",
              whyItFits: "極佳地面部比例能輕鬆駕馭大體積的羊毛燙或法式微捲，不僅不顯厚重，反而讓雙頰五官更顯精緻立體。",
              stylingTips: "洗完頭塗抹慕斯或彈性免沖洗輕乳液，使用烘罩或者順著手繞吹乾，切忌粗暴吹拉，保持捲度彈性。難度：⭐⭐⭐⭐",
              tryonPresetId: "french_waves"
            }
          ],
          colors: [
            {
              name: "落日摩卡棕",
              hex: "#5d4436",
              description: "濃郁的摩卡咖啡中融入些微落日橘紅，在陽光下看非常暖透，色澤飽滿而高級，適合襯膚色。",
              whyItFits: "溫暖的色調能為精緻的額頭與雙頰點綴红潤氣采，氣質加倍。"
            },
            {
              name: "霧粉焦糖拿鐵",
              hex: "#937765",
              description: "高質感的低調霧感灰棕融合暖調焦糖，自帶溫柔慵懶的日雜風，顯白且修飾毛躁髮質質感。",
              whyItFits: "霧面柔焦效果能弱化髮質粗糙，映襯鵝蛋臉的清透膚質度。"
            },
            {
              name: "迷霧黑茶綠",
              hex: "#2b302c",
              description: "在冷冽深茶色中注入極其低調的冷綠光弧，室內近乎黑髮，但在自然光下會折射出神祕又冷淡的金屬光澤。",
              whyItFits: "冷色系極顯皮膚白淨度，給人一種知性、高冷不失高級感的清爽形象。"
            }
          ],
          stylistAdvice: "身為鵝蛋臉的你幾乎沒有任何髮型限制！不論是極短髮、浪漫捲、還是高馬尾、瀏海等都能完美詮釋。在梳理造型時，建議盡可能展現整潔清晰的輪廓。若要更凸顯個人風格，可以用淡金或銀色的小飾品點綴雙耳；眼鏡鏡框建議選擇微大圓框或近年流行的金屬細絲多邊框，可增添時髦度與書卷氣息。"
        },
        round: {
          faceShape: "圓臉 (Round Face)",
          confidence: 0.92,
          analysis: {
            description: "圓臉特徵為臉部寬度與長度接近，面部肌肉豐滿，下巴圓潤，缺少明顯的骨骼棱角。整體給人活潑、親切且非常顯年輕、減齡的印象。",
            features: [
              "臉部最寬處在顴骨下方，長寬近乎 1:1",
              "面部輪廓線條溫和飽滿，線條非常圓滑平伏",
              "額頭和下頷角結構不明顯，微有肉感"
            ],
            ratioExplanation: "面部線條柔和、拐點極不明顯，縱向空間感較為壓縮，需要靠髮型做出向上延展與兩側修長折疊的效果。"
          },
          hairstyles: [
            {
              id: "curtain_bangs_long",
              name: "俐落八字瀏海波浪長髮",
              tag: "拉長臉型",
              suitabilityScore: 95,
              description: "長八字瀏海剛好遮蓋住面部最寬的雙頰外緣，並以垂直向下的弧度在下巴下方收斂，修飾寬度。",
              whyItFits: "八字瀏海可在額頭中心區塊營造出一個倒 V 字型的「視覺延伸帶」，拉長臉部縱向比例，完美遮擋雙頰最肉的部分。",
              stylingTips: "吹風機搭配捲梳，將瀏海微向外、向上吹蓬髮根，讓頭頂產生蓬鬆立體高度，縱向拉伸。難度：⭐⭐⭐",
              tryonPresetId: "curtain_bangs"
            },
            {
              id: "bob_asymmetry",
              name: "大旁分層次鎖骨直髮波波",
              tag: "遮瑕修容",
              suitabilityScore: 90,
              description: "髮長及至鎖骨，不帶厚重瀏海，改以 3:7 或 2:8 大旁分，一側頭髮塞在耳後，另一側自然垂落遮掩面頰。",
              whyItFits: "旁分的斜線條打破了圓臉橫向的圓對稱性。外露的下顎角和另一邊垂下的微直髮，能切出俐落、尖銳的陰影輪廓。",
              stylingTips: "吹整時可用微定型噴霧在分線處作逆吹，固定髮根高度，尾部順直，避免兩側太蓬。難度：⭐⭐",
              tryonPresetId: "bob"
            },
            {
              id: "japanese_shag",
              name: "日系高層次輕羽短髮",
              tag: "俐落短髮",
              suitabilityScore: 88,
              description: "頂部蓬鬆度極高、兩側收緊且髮尾打薄呈現羽毛狀碎剪的外起短髮，富有輕快與動感線條。",
              whyItFits: "利用頂部的超強空氣感製造臉往上拔高的錯覺，羽毛碎髮垂掛於脖頸兩側也可以延伸臉頸的纖細感，降低肉感。",
              stylingTips: "洗頭完使用蓬蓬水噴於頭頂根部吹乾，再以手指抹上少許油光黏度適中的髮泥向後上方抓揉，營造束感。難度：⭐⭐⭐⭐",
              tryonPresetId: "japanese_layered"
            }
          ],
          colors: [
            {
              name: "木質深冷茶",
              hex: "#3b332d",
              description: "帶有冷木木質調的黑茶灰色，中和黃皮膚的暗沉不顯沉悶，並能很好地收緊視覺輪廓感。",
              whyItFits: "深冷色系在視覺上有「收縮」效果，彷彿為圓圓的雙頰自然打上免修容腮紅陰影。"
            },
            {
              name: "薄荷霧感灰亞麻",
              hex: "#787060",
              description: "透明感與空氣感兼融的日系霧灰綠中棕色，洗鍊隨性，在陽光下閃爍著亞麻霧調的高層次光澤。",
              whyItFits: "藉由霧化、朦朧的灰調，將臉部過硬或過圓潤的邊界視線分散，柔焦面部特徵。"
            },
            {
              name: "琥珀拿鐵棕",
              hex: "#7e624c",
              description: "如同琥珀融於濃縮咖啡中般的蜜棕橙調，低溫烘培感，既元氣滿滿又帶著溫柔的高級感。",
              whyItFits: "提升臉部立體受光面，在視覺上使視線聚焦在五官核心區，忽視外輪廓的圓潤。"
            }
          ],
          stylistAdvice: "圓臉最核心的剪裁要訣就是『拉長比例』與『製造線條感』，切勿嘗試齊瀏海或兩側蓬厚膨脹的捲髮。日常妝容可以多加強眉峰立體感，化妝時著重鼻影與下巴的立體提亮。眼鏡鏡框切忌圓形，應多戴方形、貓眼形或大幾何稜角框架，與圓潤的臉部曲線形成強烈剛柔對稱感，更能豐富面部線條。"
        },
        square: {
          faceShape: "方臉 (Square Face)",
          confidence: 0.90,
          analysis: {
            description: "方臉的特徵在於額頭、顴骨與下顎骨的寬度極度相近，腮骨明顯且略寬，下巴平坦，整體呈現結構感十分強烈、俐落的硬朗線條，富帶英氣與超模高級氣場。",
            features: [
              "額頭和腮邊輪廓皆寬，下顎拐點很低、極為明顯",
              "面部邊界線直爽，缺乏曲線過渡",
              "骨感高、五官骨骼感重，長寬呈剛毅塊面"
            ],
            ratioExplanation: "面部線條拐點鮮明、下半臉分量足。要避免直線與直切，藉由有弧度的柔和線條淡化下顎的剛硬感。"
          },
          hairstyles: [
            {
              id: "cloud_perm_medium",
              name: "輕盈空氣雲朵過肩燙捲",
              tag: "豐盈捲髮",
              suitabilityScore: 96,
              description: "大弧度、軟綿膨鬆的波浪慵懶捲髮，自耳下開始自然外散與堆疊，長度超過鎖骨，柔和臉頰折角。",
              whyItFits: "大S型、流暢的波浪捲度，是柔化剛硬臉部骨骼與銳利下顎的最佳「消音器」。蓬鬆寬度能包覆兩側腮骨。",
              stylingTips: "半乾時抹上護髮油，分成4個髮束向後繞吹。吹乾後用大寬齒梳將捲度輕輕梳開，讓捲度成松雲狀。難度：⭐⭐⭐",
              tryonPresetId: "cloud_perm"
            },
            {
              id: "french_waves_long",
              name: "慵懶法式過肩帶瀏海微捲",
              tag: "柔美波浪",
              suitabilityScore: 91,
              description: "髮尾微帶隨意不對稱的弧度，蓬鬆微亂。額頭搭配略長且邊緣漸長向兩側切斜的空氣碎瀏海，營造隨性感。",
              whyItFits: "慵懶蓬鬆的髮絲和不規則捲度能分散腮部的方正感，配合兩旁修長垂落的空氣側邊，成功柔滑方正拐角。",
              stylingTips: "早上出門前噴少許海鹽噴霧，用手往上托抓吹乾，打造慵懶、微帶毛躁感法式時髦空氣度。難度：⭐⭐⭐",
              tryonPresetId: "french_waves"
            },
            {
              id: "side_part_bob",
              name: "不對稱斜剪蓬鬆內扣波波",
              tag: "遮瑕修容",
              suitabilityScore: 87,
              description: "經典波波頭，但長度特地剪裁至下巴下方 2 公分處，髮尾作內包微收處理。採用三七旁分或極具層次的發束。",
              whyItFits: "長於下巴的長度能將最突出的下顎角包裹進圓潤髮流中，加上一長一短不對稱的外側視線偏離，完美淡化方角。",
              stylingTips: "洗頭完使用圓梳將髮尾朝頸部中心包覆繞吹。若髮質過硬，可使用寬板夾夾出柔滑內扣 C 型。難度：⭐⭐",
              tryonPresetId: "bob"
            }
          ],
          colors: [
            {
              name: "焦糖斑比褐",
              hex: "#825d48",
              description: "柔和溫暖的奶油色及肉桂斑比鹿棕，色澤滑順柔焦，自帶珍珠般微光，為硬朗感帶來溫柔女人味。",
              whyItFits: "暖而透亮的焦糖色調能讓方臉剛柔並濟，減弱骨感，顯得氣色極溫柔、體貼。"
            },
            {
              name: "煙燻柔霧玫瑰粉棕",
              hex: "#8f686c",
              description: "在帶點棕色調的基础中揉入灰紫玫瑰粉色，展現極高雅迷濛的柔絲綢霧感，非常低調有特色。",
              whyItFits: "煙燻霧感具有奇妙的「消邊界」效果，能柔和化解臉下緣過於突兀、剛硬的線條焦點。"
            },
            {
              name: "霧感黑醋栗深可可",
              hex: "#422e2b",
              description: "濃郁的可可黑中帶有果實般微甜的黑醋栗與莓果紫，比起一般黑髮更輕盈，極致顯白，自帶古典神韻。",
              whyItFits: "略帶暖紫調的深可可比死黑更能折射光芒，能在方臉周圍劃出完美的圓潤反光輪廓。"
            }
          ],
          stylistAdvice: "方臉是許多歐美與高時裝秀場最渴望的『高級臉』，只要配合適度線條絕對美極。請萬萬避免任何幾何切割齊碎髮、死板的一刀切。在配飾上，可以挑選柔和流暢的圓形、水滴、橢圓耳環；穿衣服上多穿 V 領、大圓領或一字肩，在視覺上向下傾斜、大方露出脖子，能大幅削弱下巴的方正與沉重份量。"
        },
        heart: {
          faceShape: "心形臉 / 倒三角臉 (Heart Face)",
          confidence: 0.94,
          analysis: {
            description: "心形臉特徵在於額頭與顴骨較寬，下巴纖細、尖銳，呈現下半臉線條快速向內收攏的 V 字形。整體臉型非常上鏡、秀氣且充滿靈動感，極具古典美女代表性。",
            features: [
              "下巴極其尖細、小巧，是整張臉的焦點",
              "額頭和眉骨位置最寬，上寬下窄對比顯著",
              "太陽穴或顴骨兩頰略顯飽滿"
            ],
            ratioExplanation: "臉型偏向上半部寬敞，下半部過度纖細、骨感，容易有「頭重腳輕、孤傲刻薄」的感覺，髮型打理重點是要在下半部兩側製造寬度，增添平橫感。"
          },
          hairstyles: [
            {
              id: "cloud_perm_shoulder",
              name: "外翹層次雲朵捲鎖骨髮",
              tag: "中長髮",
              suitabilityScore: 96,
              description: "長度剛好及肩或輕觸鎖骨，上半部順直，但在下巴和耳下區塊燙出向外翻翹、或豐滿堆盈、有彈性的波浪捲度。",
              whyItFits: "外翻或蓬鬆的下擺捲度，恰好在瘦削、尖尖的下巴兩側補上了「橫向寬度」，使上與下達到和諧完美的視覺平衡。",
              stylingTips: "吹風吹至八分乾後，手指抓取髮梢往兩側外後方向捲繞並加熱，用冷風鎖定定型，即有漂亮的外翹弧。難度：⭐⭐",
              tryonPresetId: "cloud_perm"
            },
            {
              id: "curtain_bangs_gentle",
              name: "知性法式氣墊八字瀏海中長短",
              tag: "柔美波浪",
              suitabilityScore: 92,
              description: "長度至鎖骨，八字瀏海從眉眼處開始向外柔和撇去，包覆在顴骨外緣，將太陽穴和寬額頭自然縮攏。",
              whyItFits: "這款剪裁能在修飾原本偏寬、飽滿的額頭兩邊之餘，將視線焦點引導至秀氣的眼部，而下巴線條更具流暢清澈感。",
              stylingTips: "每天洗臉後用大捲夾將瀏海頂部夾起 5 分鐘，以熱風微吹、冷風收縮，即可獲得挺立又修容的溫柔八字。難度：⭐⭐",
              tryonPresetId: "curtain_bangs"
            },
            {
              id: "classic_bob_fringe",
              name: "法式厚度微碎短髮浪漫波波",
              tag: "輕盈短髮",
              suitabilityScore: 87,
              description: "長度微垂到下巴與嘴角之間，髮尾帶有厚度且具有少許內彎捲度，搭配自然休閒剪裁的空氣法式碎瀏海。",
              whyItFits: "包覆下巴上方的內彎髮梢在精緻的小下巴兩邊建立了適量陰影蓬鬆度，加上瀏海遮掩，上庭對比感自動減半。",
              stylingTips: "吹整時利用軟齒吹風梳將髮尾朝前臉頰側包覆，一邊拉一邊向內彎吹。吹完噴少許防潮光彩噴霧。難度：⭐⭐⭐",
              tryonPresetId: "bob"
            }
          ],
          colors: [
            {
              name: "溫柔蜜桃奶茶褐",
              hex: "#9b7f6c",
              description: "奶茶裸粉中融有一抹蜜桃餘溫的粉棕，極溫婉日系，能大幅緩和心形臉下半部分過於尖銳、冷調的孤立感。",
              whyItFits: "明亮輕快的色調散發平易近人的溫柔氛圍，中和尖下巴帶點微冰山美人的距離感。"
            },
            {
              name: "經典黑加侖巧克力黑",
              hex: "#342a27",
              description: "深黑巧克力融入溫暖栗紅色的低調光澤，在背光處黑得高雅純粹，迎光下展現高級的可可光暈質感爆棚。",
              whyItFits: "高飽和深色可自然平衡上半臉過寬的膨脹度，提供絕佳比例修飾線調感。"
            },
            {
              name: "暖霧玫瑰紅茶",
              hex: "#874d47",
              description: "柔霧感的大馬士革紅玫瑰茶棕色，低溫飽和度，在暖和成熟中帶著一絲微醺、明快的復古美感，朝氣顯白。",
              whyItFits: "紅色調能使削瘦骨感的心形臉看起來氣色豐滿、光彩照人，為消瘦輪廓注入青春活力。"
            }
          ],
          stylistAdvice: "心形臉是非常具有優勢的名媛明星上鏡臉，剪裁大原則是『豐富下輪廓』。切忌頭頂做得過蓬、兩側貼死的一條長直短髮。化妝時腮紅應打在蘋果肌並往太陽穴微微平刷。耳環是你的救星，多挑選「下擺比頂部寬」的吊飾型、扇形、大三角水滴狀耳環，能在細緻下巴周圍構件最唯美的幾何裝飾效果！"
        },
        long: {
          faceShape: "長形臉 (Long Face)",
          confidence: 0.93,
          analysis: {
            description: "長形臉的長度明顯大於臉寬（比例大於 1:1.5 很多），特徵是額頭略高、中庭或下庭長度略長，同時太陽穴與兩頰通常比較瘦削。整體給人成熟、知性、優雅且冷靜的職場高幹架勢。",
            features: [
              "臉部縱向空間較長，寬度窄，兩側線條幾近平直",
              "中庭（眉毛到鼻尖）或下巴偏長",
              "普遍伴隨窄額頭或窄下顎特徵"
            ],
            ratioExplanation: "長寬比失衡导致縱向拉伸感過強、太陽穴易凹陷。打理要點在於藉由飽滿的橫向寬度揉碎縱向視線、並用瀏海縮短長度。"
          },
          hairstyles: [
            {
              id: "cloud_perm_rich",
              name: "空氣空氣感齊眉法式瀏海大波浪",
              tag: "縮短臉型",
              suitabilityScore: 97,
              description: "經典法式瀏海，長度微遮眉毛且不顯厚重，兩側頭髮以富有空氣感的蓬鬆大波浪堆疊，向左右橫向拓展開來。",
              whyItFits: "齊眉瀏海瞬間把全臉暴露的縱向長度斬斷了三分之一！而兩次蓬鬆的波浪捲更能填滿太陽穴與偏瘦的雙頰凹陷。",
              stylingTips: "分線切忌正中，瀏海半濕時朝前方內繞吹出蓬鬆弧度，兩側用熱風向外、後作捲度提拉，製造橫向空氣感。難度：⭐⭐⭐",
              tryonPresetId: "cloud_perm"
            },
            {
              id: "romantic_french_shag",
              name: "法式凌亂微捲帶瀏海鎖骨波波",
              tag: "豐盈捲髮",
              suitabilityScore: 93,
              description: "長度剛好在肩上 3 公分或鎖骨周邊，大範圍蓬鬆捲度搭配帶有些許分束感與空氣感剪裁的側散瀏海，清爽時髦。",
              whyItFits: "鎖骨長度最能中和長臉的過度拉伸，過低的重心會顯臉更長，鎖骨波波能將臉部核心定格在最完美的中胸段。",
              stylingTips: "半乾時在頭部轉弯折角兩旁和髮梢末端抓上慕斯，打圈烘乾，製造橫向最寬延伸點。難度：⭐⭐⭐⭐",
              tryonPresetId: "french_waves"
            },
            {
              id: "bob_thick_bangs",
              name: "日系慵懶感高厚度內扣及肩直髮",
              tag: "輕盈短髮",
              suitabilityScore: 89,
              description: "及肩膀處的長波波，兩側微剪裁羽毛碎層，髮尾刻意不打薄，保持厚實且向內完美捲收，搭配中厚度空氣瀏海。",
              whyItFits: "髮尾充足的面量（橫向份量）與澎度能拓寬臉下半部分的視覺骨架，中厚瀏海更能填補額頭，大有修容功效。",
              stylingTips: "每天早上用捲髮棒在兩側髮尾朝內捲出一個寬大的 C字內包，吹風機微定。難度：⭐⭐",
              tryonPresetId: "bob"
            }
          ],
          colors: [
            {
              name: "暖金焦糖蜂蜜褐",
              hex: "#a37e58",
              description: "帶有柔光金黃蜂蜜感的暖焦糖色，明亮熱情，像冬日午後暖陽，能為略顯嚴肅、清冷的長臉渲染青春元氣。",
              whyItFits: "明亮溫和的淺暖調具溫徐擴散感，能在無形中拓展長臉面部寬廣感，顯得更健康。"
            },
            {
              name: "櫻桃摩卡玫瑰紫紅",
              hex: "#824647",
              description: "低調、顯白至極的酒紅摩卡色，夾帶極具質感的玫瑰紅茶微光。展現冷靜優雅又不失活力的優美色系。",
              whyItFits: "強烈的奢華色調與成熟典雅的長臉氣場絕佳契合，大顯女人知性感、非常高雅。"
            },
            {
              name: "太妃糖奶油栗棕",
              hex: "#8d6a4e",
              description: "溫潤柔滑的法系奶油太妃栗子色，中偏暖色調。視覺觸感非常像絲絨般和煦，為窄長臉頰提供極致的豐潤感。",
              whyItFits: "柔順、蓬鬆的茶棕色有飽和、充盈光感之效果，讓消瘦窄窄的長臉形看起來圓足富有彈性。"
            }
          ],
          stylistAdvice: "長臉的精髓在於『切忌正中分』與『切忌垂直直長髮』！中分和貼在臉兩側的垂直長直髮是你一定要杜絕的雷區。在配飾上，最適合佩戴寬扁圓形的幾何耳環、或者大而橫直貼耳的耳針，這能有效向兩旁拓展面部。戴眼鏡時，一定要選鏡框縱向高度高的深色大框鏡，這能恰如其分地占領中庭，大幅平衡縮短長臉縱深！"
        }
      };

      const requestedShape = (demoFaceShape || "oval").toLowerCase();
      // Deep clone so as not to mutate the original template
      const responseCopy = JSON.parse(JSON.stringify(demoResponses[requestedShape] || demoResponses.oval));
      
      // Override default hairstyles array with our comprehensive list of exactly 9 customized hairstyles
      responseCopy.hairstyles = getNineRecommendedHairstyles(requestedShape);

      if (stylePreference && stylePreference !== "all") {
        const styleText = stylePreference === "cute" ? "甜美可愛" : stylePreference === "professional" ? "知性專業" : "時尚個性";
        responseCopy.hairstyles.forEach((style: any) => {
          const presetId = style.tryonPresetId;
          let isMatch = false;
          if (stylePreference === "cute" && ["bob", "french_waves", "cloud_perm", "curtain_bangs", "airy_bangs_long"].includes(presetId)) {
            isMatch = true;
          } else if (stylePreference === "professional" && ["bob", "japanese_layered", "classic_undercut", "curtain_bangs", "pixie_cut"].includes(presetId)) {
            isMatch = true;
          } else if (stylePreference === "trendy" && ["french_waves", "cloud_perm", "japanese_layered", "classic_undercut", "curtain_bangs", "wolf_cut", "pixie_cut"].includes(presetId)) {
            isMatch = true;
          }

          if (isMatch) {
            style.suitabilityScore = Math.min(100, style.suitabilityScore + 6);
            style.name = `【${styleText}推薦】` + style.name;
            style.whyItFits = `【符合契合風格】此剪裁在完美呈現面骨修飾的同時，更極致地呼應了您喜愛的『${styleText}』風格。` + style.whyItFits;
          } else {
            style.suitabilityScore = Math.max(70, style.suitabilityScore - 8);
          }
        });

        // Re-sort hairstyles by updated suitabilityScore
        responseCopy.hairstyles.sort((a: any, b: any) => b.suitabilityScore - a.suitabilityScore);
      }

      return res.json({ success: true, analysis: responseCopy });
    }

    // Standard Real Analysis with Gemini API!
    if (!image || !mimeType) {
      return res.status(400).json({ success: false, error: "Missing image or mimeType parameter" });
    }

    const ai = getGeminiClient();

    // Prepare content parts for Multi-modal analysis
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: image, // Base64 chunk
      },
    };

    const preferredStyleText = stylePreference && stylePreference !== "all"
      ? `特別注意：使用者特別偏好『${stylePreference === 'cute' ? '甜美可愛' : stylePreference === 'professional' ? '專業洗鍊' : '時尚個性'}』風格的髮型。請務必在推薦的髮型中優先且深度結合此風格設計，並在設計理由、髮型名稱與描述中特別融入該風格調性、氣質和修飾要素。`
      : "使用者希望獲得全方位綜合推薦。您可自由調配各種時尚、可愛、或專業之代表髮型，使之多元化。";

    const promptString = `
你是一位頂級資深髮型設計師與色彩搭配大師。請仔細分析這張上傳的人臉照片。
請為此人判斷出最具代表性的臉型（如：圓臉、鵝蛋臉、方臉、心形臉、長形臉等）。
請依循以下指定之 JSON Schema 格式，進行嚴格分析。

切勿在 JSON 外撰寫任何 markdown 解釋文字。

使用者風格偏好：
${preferredStyleText}

請依循此結構輸出 JSON：
{
  "faceShape": "臉型名稱含英文 ( e.g. 鵝蛋臉 (Oval) )",
  "confidence": 0.0 至 1.0 之間的相似匹配度（推薦值）,
  "analysis": {
    "description": "臉型的詳細描述",
    "features": [
      "特徵 1 (例如：臉市長寬比約 1.5:1 )",
      "特徵 2",
      "特徵 3"
    ],
    "ratioExplanation": "詳細的面部長寬比、骨骼拐點與對稱比例說明"
  },
  "hairstyles": [
    {
      "id": "隨機且唯一的英文字串作為 ID",
      "name": "髮型名稱 (例如：法式浪漫八字碎蓋長髮)",
      "tag": "髮型標籤 (例如：中長髮/俐落短髮/遮瑕修容)",
      "suitabilityScore": 1 至 100 之間的分數,
      "description": "該髮型的修剪、蓬鬆度、分線、瀏海及髮尾處理說明",
      "whyItFits": "為什麼這個髮型適合此臉型（結構與骨感修飾原理解析）",
      "stylingTips": "日常吹整與整理難度與訣竅",
      "tryonPresetId": "必須是以下 9 個試戴 Preset ID 之一：'bob' (代表波波頭/俐落短髮), 'french_waves' (法式微捲長髮), 'cloud_perm' (羊毛燙/蓬鬆捲髮/雲朵燙), 'japanese_layered' (日系高層次短髮/中性短髮), 'classic_undercut' (經典油頭/鏟邊/中性/男仕油頭), 'curtain_bangs' (八字瀏海/中長直/空氣瀏海), 'pixie_cut' (精靈短髮/極短髮), 'wolf_cut' (層次狼剪), 'airy_bangs_long' (空氣瀏海微捲長髮)"
    }
  ],
  "colors": [
    {
      "name": "染髮色系名稱 (例如：金棕琥珀色)",
      "hex": "標準以 # 開頭的 16 進制色碼，如 #8c6e5e",
      "description": "該色彩與膚質中和的效果說明",
      "whyItFits": "為什麼此顏色適合與該臉型/五官對位，帶來提亮或高質感"
    }
  ],
  "stylistAdvice": "髮大師傾囊相授的日常實用總括整理、化妝腮紅與眼鏡/飾品搭配建議"
}

請務必嚴格遵循上述各屬性的格式。請注意，'hairstyles' 陣列中都必須【正好包含 9 個不同造型的實用推薦】且需囊括全部 9 種的 'tryonPresetId'：
- 'bob'
- 'french_waves'
- 'cloud_perm'
- 'japanese_layered'
- 'classic_undercut'
- 'curtain_bangs'
- 'pixie_cut'
- 'wolf_cut'
- 'airy_bangs_long'
'colors' 陣列在輸出時必須正好包含 3 個極具創見和高度實用性的推薦。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, promptString],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faceShape: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            analysis: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                features: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                ratioExplanation: { type: Type.STRING }
              },
              required: ["description", "features", "ratioExplanation"]
            },
            hairstyles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  tag: { type: Type.STRING },
                  suitabilityScore: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                  whyItFits: { type: Type.STRING },
                  stylingTips: { type: Type.STRING },
                  tryonPresetId: { type: Type.STRING }
                },
                required: ["id", "name", "tag", "suitabilityScore", "description", "whyItFits", "stylingTips", "tryonPresetId"]
              }
            },
            colors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING },
                  description: { type: Type.STRING },
                  whyItFits: { type: Type.STRING }
                },
                required: ["name", "hex", "description", "whyItFits"]
              }
            },
            stylistAdvice: { type: Type.STRING }
          },
          required: ["faceShape", "confidence", "analysis", "hairstyles", "colors", "stylistAdvice"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text returned from Gemini API");
    }

    console.log("Gemini API analyzed completely. Processing JSON.");
    const parsedData = JSON.parse(textOutput.trim());

    return res.json({ success: true, analysis: parsedData });

  } catch (error: any) {
    console.error("Analysis route failed: ", error);
    return res.status(500).json({
      success: false,
      error: error.message || "面部圖像分析失敗，請重試。",
      debugMsg: "Ensure you have set a valid GEMINI_API_KEY in the Secrets panel."
    });
  }
});

async function start() {
  // Serve modern Vite app
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite dev server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static UI bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start full-stack web application
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server: ", err);
});
