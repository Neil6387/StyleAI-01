import React from 'react';

export interface HairstylePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultScale: number;
  defaultYOffset: number;
}

export const HAIRSTYLE_PRESETS: HairstylePreset[] = [
  {
    id: 'bob',
    name: '日系俐落短髮波波頭 (Sleek Bob)',
    category: '流暢短髮',
    description: '長度齊下巴的內縮短髮，最能修飾下顎線與方圓臉輪廓。',
    defaultScale: 1.1,
    defaultYOffset: -20,
  },
  {
    id: 'french_waves',
    name: '法式復古浪漫微捲 (French Waves)',
    category: '浪漫中長捲髮',
    description: '散發自然傭懶氣息的S型捲度，修飾太陽穴與顴骨線條。',
    defaultScale: 1.25,
    defaultYOffset: -35,
  },
  {
    id: 'cloud_perm',
    name: '蓬鬆厚實雲朵燙 (Cloud Perm)',
    category: '豐盈捲髮',
    description: '如雲朵般輕盈柔和的波浪堆疊，完美和諧心形與窄長臉。',
    defaultScale: 1.25,
    defaultYOffset: -40,
  },
  {
    id: 'japanese_layered',
    name: '輕盈羽毛高層次短髮 (Japanese Layered)',
    category: '輕質碎剪',
    description: '頂部蓬鬆、髮梢如羽毛般靈動貼面，散發中性率性魅力。',
    defaultScale: 1.15,
    defaultYOffset: -25,
  },
  {
    id: 'classic_undercut',
    name: '經典紳士復古油頭 (Classic Undercut)',
    category: '男仕/中性短髮',
    description: '頂部俐落向後收攏，流露清爽英氣與立體五官。',
    defaultScale: 1.0,
    defaultYOffset: -12,
  },
  {
    id: 'curtain_bangs',
    name: '浪漫法式八字空靈長髮 (Curtain Bangs Long)',
    category: '優雅長髮',
    description: '眼眉處向外翻飛的優雅八字瀏海，修面極佳。',
    defaultScale: 1.3,
    defaultYOffset: -45,
  },
  {
    id: 'pixie_cut',
    name: '極柔線條減齡精靈短髮 (Pixie Cut)',
    category: '極短精靈髮',
    description: '極具個性的超短碎剪，修飾頸部線條，突顯深邃眼眸。',
    defaultScale: 1.05,
    defaultYOffset: -15,
  },
  {
    id: 'wolf_cut',
    name: '個性野性高層次狼剪 (Edgy Wolf Cut)',
    category: '高層次狼剪',
    description: '上重下輕、髮尾呈碎剪羽毛狀散落，氣場爆棚，最顯不羈個性。',
    defaultScale: 1.2,
    defaultYOffset: -28,
  },
  {
    id: 'airy_bangs_long',
    name: '空氣瀏海溫柔微捲長髮 (Soft Waves Long)',
    category: '甜美長髮',
    description: '輕盈微透的空氣瀏海，搭配垂墜在兩肩的微捲流線。',
    defaultScale: 1.3,
    defaultYOffset: -42,
  },
];

interface HairSVGProps {
  id: string;
  color: string; // hex
  opacity: number; // 0 to 1
  intensity: number; // blend option
}

export const HairSVG: React.FC<HairSVGProps> = ({ id, color, opacity, intensity }) => {
  // Let's design stylized vector SVG hairs with multiple layers (base, shadows, highlights)
  // to give them a premium realistic volume and texture.
  
  // Custom linear gradient for hair shine base
  const gradId = `hair-grad-${id}`;
  const highlightGradId = `hair-highlight-${id}`;
  
  // High fidelity vector paths representing hair contours
  switch (id) {
    case 'bob':
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="50%" stopColor={color} stopOpacity={opacity * 0.9} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.7} />
            </linearGradient>
            <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="30%" stopColor="#ffffff" stopOpacity={0.2 * intensity} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity={0.4 * intensity} />
              <stop offset="70%" stopColor="#ffffff" stopOpacity={0.2 * intensity} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* Back Hair Silhouette Layer */}
          <path 
            d="M 120 180 C 100 240, 110 320, 130 330 C 140 335, 170 335, 180 320 C 190 300, 195 240, 195 240 L 205 240 C 205 240, 210 300, 220 320 C 230 335, 260 335, 270 330 C 290 320, 300 240, 280 180 Z" 
            fill={color} 
            opacity={opacity * 0.75} 
          />
          
          {/* Main Hair Volume */}
          <path 
            d="M 200 60 
               C 100 60, 100 180, 105 280 
               C 107 310, 125 330, 145 320 
               C 165 310, 155 240, 155 200 
               C 155 180, 165 170, 175 180
               C 185 190, 190 220, 195 240
               C 198 250, 202 250, 205 240
               C 210 220, 215 190, 225 180
               C 235 170, 245 180, 245 200
               C 245 240, 235 310, 255 320
               C 275 330, 293 310, 295 280
               C 300 180, 300 60, 200 60 Z" 
            fill={`url(#${gradId})`}
          />
          
          {/* Air Bangs / Forehead layers */}
          <path 
            d="M 160 110 C 170 140, 180 150, 180 155 M 180 110 C 190 145, 195 150, 198 153 M 202 110 C 205 145, 210 150, 202 153 M 240 110 C 230 140, 220 150, 220 155" 
            stroke={color} 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none" 
            opacity={opacity} 
          />
          
          {/* Shading/Strand highlights to make it look detailed */}
          <path 
            d="M 200 65 C 130 65, 120 160, 125 240 M 150 78 C 115 130, 130 220, 135 280 M 200 65 C 270 65, 280 160, 275 240 M 250 78 C 285 130, 270 220, 265 280" 
            stroke="black" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            fill="none" 
            opacity={0.15 * intensity} 
          />
          
          {/* Light shine halo (Angel Ring) */}
          <path 
            d="M 125 150 C 150 135, 200 130, 250 130 C 265 130, 275 135, 275 145" 
            stroke={`url(#${highlightGradId})`} 
            strokeWidth="16" 
            fill="none" 
            strokeLinecap="round"
          />
          <path 
            d="M 125 150 C 150 135, 200 130, 250 130 C 265 130, 275 135, 275 145" 
            stroke="#ffffff" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round"
            opacity={0.25 * intensity}
          />
        </svg>
      );

    case 'french_waves':
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="60%" stopColor={color} stopOpacity={opacity * 0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.75} />
            </linearGradient>
            <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity={0.35 * intensity} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* Background thick hair flowing behind shoulders */}
          <path 
            d="M 110 200 C 80 260, 90 350, 115 390 C 120 395, 140 395, 145 370 C 150 340, 140 250, 150 200 Z" 
            fill={color} 
            opacity={opacity * 0.65} 
          />
          <path 
            d="M 290 200 C 320 260, 310 350, 285 390 C 280 395, 260 395, 255 370 C 250 340, 260 250, 250 200 Z" 
            fill={color} 
            opacity={opacity * 0.65} 
          />

          {/* Main S-wave hair strands */}
          <path 
            d="M 200 50 
               C 105 50, 100 130, 110 180
               C 120 210, 100 240, 105 285
               C 110 320, 130 350, 120 375
               C 112 390, 135 410, 155 385
               C 165 370, 155 330, 150 300
               C 145 270, 160 245, 155 220
               C 150 190, 135 170, 137 140
               C 140 100, 170 80, 200 80
               C 230 80, 260 100, 263 140
               C 265 170, 250 190, 245 220
               C 240 245, 255 270, 250 300
               C 245 330, 235 370, 245 385
               C 265 410, 288 390, 280 375
               C 270 350, 290 320, 295 285
               C 300 240, 280 210, 290 180
               C 300 130, 295 50, 200 50 Z" 
            fill={`url(#${gradId})`}
          />

          {/* Flowing locks on ears */}
          <path 
            d="M 125 130 C 115 170, 125 210, 120 250 M 275 130 C 285 170, 275 210, 280 250" 
            stroke={color} 
            strokeWidth="6" 
            strokeLinecap="round" 
            fill="none" 
            opacity={opacity} 
          />

          {/* S-wave strand lines */}
          <path 
            d="M 180 65 Q 120 90, 125 150 T 115 260 T 135 360" 
            stroke="black" 
            strokeWidth="1.5" 
            fill="none" 
            opacity={0.16 * intensity} 
          />
          <path 
            d="M 220 65 Q 280 90, 275 150 T 285 260 T 265 360" 
            stroke="black" 
            strokeWidth="1.5" 
            fill="none" 
            opacity={0.16 * intensity} 
          />
          <path 
            d="M 200 55 C 160 55, 140 85, 135 120 C 130 160, 150 180, 142 220" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            fill="none" 
            opacity={0.2 * intensity} 
          />

          {/* Hair shine halo */}
          <path 
            d="M 130 135 C 160 120, 200 115, 240 115 C 255 115, 270 120, 270 130" 
            stroke={`url(#${highlightGradId})`} 
            strokeWidth="12" 
            fill="none" 
            strokeLinecap="round"
          />
        </svg>
      );

    case 'cloud_perm':
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="60%" stopColor={color} stopOpacity={opacity * 0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.72} />
            </linearGradient>
            <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity={0.3 * intensity} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Voluminous Fluffy Cloud shapes behind shoulder */}
          <path 
            d="M 120 180 C 70 200, 60 270, 80 320 C 85 330, 110 350, 130 330 C 140 320, 140 250, 140 180 Z" 
            fill={color} 
            opacity={opacity * 0.6} 
          />
          <path 
            d="M 280 180 C 330 200, 340 270, 320 320 C 315 330, 290 350, 270 330 C 260 320, 260 250, 260 180 Z" 
            fill={color} 
            opacity={opacity * 0.6} 
          />

          {/* Bubbles of curls creating maximum volume */}
          <path 
            d="M 200 40 
               C 150 40, 110 60, 95 100 
               C 85 125, 90 155, 100 170
               C 110 185, 105 205, 95 220
               C 80 240, 85 270, 100 290
               C 115 310, 130 335, 155 345
               C 170 350, 165 310, 160 280
               C 155 250, 165 230, 175 220
               C 185 210, 195 230, 200 245
               C 205 230, 215 210, 225 220
               C 235 230, 245 250, 240 280
               C 235 310, 230 350, 245 345
               C 270 335, 285 310, 300 290
               C 315 270, 320 240, 305 220
               C 295 205, 290 185, 300 170
               C 310 155, 315 125, 305 100
               C 290 60, 250 40, 200 40 Z" 
            fill={`url(#${gradId})`}
          />

          {/* Bangs (wavy split) */}
          <path 
            d="M 155 100 C 165 130, 175 140, 180 145 M 245 100 C 235 130, 225 140, 220 145" 
            stroke={color} 
            strokeWidth="4" 
            strokeLinecap="round" 
            fill="none" 
            opacity={opacity} 
          />

          {/* Wavy spiral shading indicators */}
          <path 
            d="M 125 100 C 105 140, 135 180, 115 240 M 165 80 C 145 130, 165 180, 145 260 M 275 100 C 295 140, 265 180, 285 240 M 235 80 C 255 130, 235 180, 255 260" 
            stroke="black" 
            strokeWidth="1.2" 
            fill="none" 
            opacity={0.15 * intensity} 
          />

          {/* Fluffy highlights */}
          <path 
            d="M 120 120 C 150 110, 200 105, 250 105 C 270 105, 280 120, 280 120" 
            stroke={`url(#${highlightGradId})`} 
            strokeWidth="14" 
            fill="none" 
            strokeLinecap="round"
          />
        </svg>
      );

    case 'japanese_layered':
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="70%" stopColor={color} stopOpacity={opacity * 0.9} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.65} />
            </linearGradient>
            <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="30%" stopColor="#ffffff" stopOpacity={0.22 * intensity} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity={0.4 * intensity} />
              <stop offset="70%" stopColor="#ffffff" stopOpacity={0.22 * intensity} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Shaggy, layered spikes around face */}
          <path 
            d="M 200 65 
               C 130 65, 110 110, 105 160 
               L 95 180 L 115 190
               L 100 220 L 125 225
               L 110 260 L 140 250 
               L 145 280 L 165 250
               L 175 220 L 190 230
               L 200 220 L 210 230
               L 225 220 L 235 250
               L 255 280 L 260 250
               L 290 260 L 275 225
               L 300 220 L 285 190
               L 305 180 L 295 160
               C 290 110, 270 65, 200 65 Z" 
            fill={`url(#${gradId})`}
          />

          {/* Long strands hugging collarbones */}
          <path 
            d="M 125 230 L 115 310 L 130 315 L 145 250 Z M 275 230 L 285 310 L 270 315 L 255 250 Z" 
            fill={color} 
            opacity={opacity * 0.85} 
          />

          {/* Airy layered bangs */}
          <path 
            d="M 145 110 L 140 150 M 165 105 L 160 158 M 185 100 L 182 163 M 200 100 L 200 165 M 215 100 L 218 163 M 235 105 L 240 158 M 255 110 L 260 150" 
            stroke={color} 
            strokeWidth="3" 
            strokeLinecap="round" 
            opacity={opacity} 
          />

          {/* Strand details (rebel spikes) */}
          <path 
            d="M 150 80 Q 120 130, 115 190 M 180 75 Q 140 130, 135 240 M 250 80 Q 280 130, 285 190 M 220 75 Q 260 130, 265 240" 
            stroke="black" 
            strokeWidth="1.2" 
            fill="none" 
            opacity={0.16 * intensity} 
          />

          {/* Light halo shine */}
          <path 
            d="M 125 140 C 150 120, 200 115, 250 115 C 270 115, 275 125, 275 135" 
            stroke={`url(#${highlightGradId})`} 
            strokeWidth="14" 
            fill="none" 
            strokeLinecap="round"
          />
        </svg>
      );

    case 'classic_undercut':
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.8} />
            </linearGradient>
            <linearGradient id="shaved-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity * 0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Shaved temple gradients (fade) */}
          <path 
            d="M 145 150 C 135 150, 130 190, 140 220 C 145 210, 148 190, 148 170 Z M 255 150 C 265 150, 270 190, 260 220 C 255 210, 252 190, 252 170 Z" 
            fill="url(#shaved-grad)"
          />

          {/* Slicked back volume top */}
          <path 
            d="M 140 150 
               C 135 100, 160 55, 200 55 
               C 240 55, 265 100, 260 150 
               C 255 145, 248 140, 230 145
               C 215 148, 205 142, 200 140
               C 195 142, 185 148, 170 145
               C 152 140, 145 145, 140 150 Z" 
            fill={`url(#${gradId})`}
          />

          {/* Pompadour lines pointing back */}
          <path 
            d="M 155 110 Q 190 70, 200 70 M 175 130 Q 200 80, 205 80 M 245 110 Q 210 70, 200 70 M 225 130 Q 200 80, 195 80" 
            stroke="black" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            fill="none" 
            opacity={0.25 * intensity} 
          />
          <path 
            d="M 195 65 Q 175 90, 160 115 M 205 65 Q 225 90, 240 115" 
            stroke="#ffffff" 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            fill="none" 
            opacity={0.2 * intensity} 
          />
        </svg>
      );

    case 'pixie_cut':
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.75} />
            </linearGradient>
            <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity={0.45 * intensity} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Main sleek volume on top and sides */}
          <path 
            d="M 200 60 
               C 130 60, 120 100, 122 150 
               C 123 165, 138 175, 142 160
               C 145 150, 150 140, 155 135
               C 165 125, 175 140, 180 150
               C 185 155, 195 152, 198 145
               C 202 145, 208 155, 212 150
               C 218 140, 228 125, 238 135
               C 245 142, 252 152, 255 160
               C 260 175, 275 165, 276 150
               C 278 100, 270 60, 200 60 Z" 
            fill={`url(#${gradId})`}
          />
          {/* Swept fringes and wispy strands */}
          <path 
            d="M 175 110 Q 160 145, 150 152 M 195 105 Q 185 145, 175 150 M 215 110 Q 230 145, 240 152 M 225 105 Q 212 148, 202 150" 
            stroke={color} 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none" 
            opacity={opacity} 
          />
          {/* Fine Hair textures for modern Pixie feel */}
          <path 
            d="M 200 65 Q 150 90, 135 140 M 200 65 Q 250 90, 265 140" 
            stroke="black" 
            strokeWidth="1.2" 
            fill="none" 
            opacity={0.18 * intensity} 
          />
          {/* Sleek sheen */}
          <path 
            d="M 140 120 C 160 105, 200 100, 240 105 C 255 108, 260 115, 260 120" 
            stroke={`url(#${highlightGradId})`} 
            strokeWidth="10" 
            fill="none" 
            strokeLinecap="round"
          />
        </svg>
      );

    case 'wolf_cut':
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="50%" stopColor={color} stopOpacity={opacity * 0.9} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.65} />
            </linearGradient>
            <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity={0.3 * intensity} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Shaggy back-shoulder feathers */}
          <path 
            d="M 115 220 C 70 280, 80 340, 100 375 L 130 365 C 145 330, 140 260, 145 220 Z" 
            fill={color} 
            opacity={opacity * 0.70} 
          />
          <path 
            d="M 285 220 C 330 280, 320 340, 300 375 L 270 365 C 255 330, 260 260, 255 220 Z" 
            fill={color} 
            opacity={opacity * 0.70} 
          />
          {/* Shaggy crown layering with spikes */}
          <path 
            d="M 200 55 
               C 120 55, 105 100, 100 160 
               L 90 175 L 115 185
               L 95 210 L 125 215
               L 110 245 L 140 235
               L 145 260 L 170 230 
               L 200 240 L 230 230
               L 255 260 L 260 235
               L 290 245 L 275 215
               L 305 210 L 285 185
               L 310 175 L 300 160
               C 295 100, 280 55, 200 55 Z" 
            fill={`url(#${gradId})`}
          />
          {/* Textured face framing points */}
          <path 
            d="M 150 110 C 140 145, 125 170, 125 180 M 175 100 C 155 140, 138 185, 140 200 M 250 110 C 260 145, 275 170, 275 180 M 225 100 C 245 140, 262 185, 260 200" 
            stroke={color} 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none" 
            opacity={opacity} 
          />
          {/* Dynamic strokes for wolf movement */}
          <path 
            d="M 180 75 Q 135 110, 130 170 M 220 75 Q 265 110, 270 170" 
            stroke="black" 
            strokeWidth="1.5" 
            fill="none" 
            opacity={0.2 * intensity} 
          />
          {/* Halo shine */}
          <path 
            d="M 130 120 C 160 105, 200 100, 270 115" 
            stroke={`url(#${highlightGradId})`} 
            strokeWidth="12" 
            fill="none" 
            strokeLinecap="round"
          />
        </svg>
      );

    case 'airy_bangs_long':
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="60%" stopColor={color} stopOpacity={opacity * 0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.65} />
            </linearGradient>
            <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity={0.4 * intensity} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Thick long back-hair layers cascading low */}
          <path 
            d="M 115 180 C 70 250, 65 340, 80 400 L 140 400 C 135 340, 130 260, 140 180 Z" 
            fill={color} 
            opacity={opacity * 0.65} 
          />
          <path 
            d="M 285 180 C 330 250, 335 340, 320 400 L 260 400 C 265 340, 270 260, 260 180 Z" 
            fill={color} 
            opacity={opacity * 0.65} 
          />
          {/* Main top crown and front wave frames */}
          <path 
            d="M 200 45 
               C 110 45, 100 120, 105 190 
               C 107 210, 120 230, 125 210
               C 130 190, 125 150, 135 125
               C 145 115, 155 130, 150 160
               C 145 190, 135 240, 150 260
               C 165 285, 185 240, 185 180
               L 200 170 L 215 180
               C 215 240, 235 285, 250 260
               C 265 240, 255 190, 250 160
               C 245 130, 255 115, 265 125
               C 275 150, 270 190, 275 210
               C 280 230, 293 210, 295 190
               C 300 120, 290 45, 200 45 Z" 
            fill={`url(#${gradId})`}
          />
          {/* Beautiful whispy Airy Bangs (translucent modern air bangs) */}
          <path 
            d="M 152 105 C 158 135, 160 142, 162 144 M 172 102 C 176 138, 178 142, 178 145 M 190 100 C 190 138, 190 142, 190 146 M 200 100 C 200 138, 200 142, 200 146 M 210 102 C 206 138, 204 142, 204 145 M 220 105 C 214 135, 212 142, 210 144" 
            stroke={color} 
            strokeWidth="3" 
            strokeLinecap="round" 
            fill="none" 
            opacity={opacity * 0.9} 
          />
          {/* Side face framing strands */}
          <path 
            d="M 132 125 Q 112 165, 115 210 M 268 125 Q 288 165, 285 210" 
            stroke={color} 
            strokeWidth="4" 
            strokeLinecap="round" 
            fill="none" 
            opacity={opacity} 
          />
          {/* Gentle wave flow curves */}
          <path 
            d="M 165 60 Q 120 130, 130 240 Q 140 320, 110 370 M 235 60 Q 280 130, 270 240 Q 260 320, 290 370" 
            stroke="black" 
            strokeWidth="1.2" 
            fill="none" 
            opacity={0.16 * intensity} 
          />
          {/* Shine halo */}
          <path 
            d="M 125 115 C 150 103, 200 98, 250 103 C 275 103, 275 115, 275 115" 
            stroke={`url(#${highlightGradId})`} 
            strokeWidth="12" 
            fill="none" 
            strokeLinecap="round"
          />
        </svg>
      );

    case 'curtain_bangs':
    default:
      return (
        <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="60%" stopColor={color} stopOpacity={opacity * 0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.7} />
            </linearGradient>
            <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="50%" stopColor="#ffffff" stopOpacity={0.35 * intensity} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Long flowing hair down behind back */}
          <path 
            d="M 120 180 C 80 240, 85 340, 100 400 L 150 400 C 145 350, 140 260, 150 180 Z" 
            fill={color} 
            opacity={opacity * 0.6} 
          />
          <path 
            d="M 280 180 C 320 240, 315 340, 300 400 L 250 400 C 255 350, 260 260, 250 180 Z" 
            fill={color} 
            opacity={opacity * 0.6} 
          />

          {/* Main Top Volume & Cascading face framing strands */}
          <path 
            d="M 200 50 
               C 110 50, 105 130, 110 200 
               C 112 230, 122 250, 130 240
               C 138 230, 132 180, 132 150
               C 132 140, 138 120, 148 115
               C 158 110, 175 140, 175 155
               C 175 160, 185 160, 190 152
               C 195 145, 198 145, 202 152
               C 205 160, 215 160, 215 155
               C 215 140, 232 110, 242 115
               C 252 120, 258 140, 258 150
               C 258 180, 252 230, 260 240
               C 268 250, 278 230, 280 200
               C 285 130, 280 50, 200 50 Z" 
            fill={`url(#${gradId})`}
          />

          {/* Curved Curtain Bangs strokes */}
          <path 
            d="M 184 105 Q 165 125, 153 148 M 216 105 Q 235 125, 247 148" 
            stroke={color} 
            strokeWidth="5" 
            strokeLinecap="round" 
            fill="none" 
            opacity={opacity} 
          />
          <path 
            d="M 175 110 Q 155 135, 142 165 M 225 110 Q 245 135, 258 165" 
            stroke={color} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none" 
            opacity={opacity} 
          />

          {/* Hair flow detail lines */}
          <path 
            d="M 170 65 Q 120 120, 125 210 M 230 65 Q 280 120, 275 210" 
            stroke="black" 
            strokeWidth="1.3" 
            fill="none" 
            opacity={0.16 * intensity} 
          />

          {/* Hair shine halo */}
          <path 
            d="M 130 130 C 160 115, 200 110, 240 110 C 255 110, 270 115, 270 125" 
            stroke={`url(#${highlightGradId})`} 
            strokeWidth="12" 
            fill="none" 
            strokeLinecap="round"
          />
        </svg>
      );
  }
};
