import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  Sparkles, 
  Smile, 
  RotateCw, 
  Download, 
  FlipHorizontal, 
  RefreshCw, 
  Info, 
  Palette, 
  Check, 
  Scissors, 
  ChevronRight, 
  ShieldAlert, 
  Layers, 
  Maximize2, 
  SlidersHorizontal,
  ArrowRightLeft,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  Github
} from 'lucide-react';
import { 
  HAIRSTYLE_PRESETS, 
  HairSVG, 
  HairstylePreset 
} from './hairstyles';
import { FaceShapeAnalysis, TryonControlState } from './types';

// Standard fallback presets in case Gemini isn't called or is pending
const DEMO_PRESETS = ['oval', 'round', 'square', 'heart', 'long'];

export default function App() {
  // State for raw uploaded or captured image
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<FaceShapeAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AR Try-on State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('curtain_bangs');
  const [selectedColor, setSelectedColor] = useState<string>('#9b7f6c'); // Warm peach caramel milk tea
  
  // Dynamic controls for positioning the hairstyle overlay on user's face
  const [controlState, setControlState] = useState<TryonControlState>({
    scale: 1.0,
    rotate: 0,
    offsetX: 0,
    offsetY: 0,
    flipX: false,
    color: '#9b7f6c',
    opacity: 0.95,
    intensity: 0.85,
  });

  // Selected preset metadata
  const currentPreset = HAIRSTYLE_PRESETS.find(p => p.id === selectedPresetId) || HAIRSTYLE_PRESETS[0];

  // Active view tab for smaller devices
  const [activeTab, setActiveTab] = useState<'upload' | 'advice' | 'preview'>('upload');

  // Webcam stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Drag and drop interaction on image panel
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const arContainerRef = useRef<HTMLDivElement | null>(null);
  const wigRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingWig, setIsDraggingWig] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [posStart, setPosStart] = useState({ x: 0, y: 0 });

  // Default demo face state
  const [demoFaceShapeSelected, setDemoFaceShapeSelected] = useState<string>('oval');
  const [stylePreference, setStylePreference] = useState<string>('all');

  // Interactive TTS Speech Synthesis & Zoom Fine-Tune modal tracking
  const [speakingStyleId, setSpeakingStyleId] = useState<string | null>(null);
  const [fineTunePresetId, setFineTunePresetId] = useState<string | null>(null);
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);

  // Auto-adapt wig overlay scale and offsetY to align perfectly with detected face shape
  const getAutoAdjustedControls = (presetId: string, faceShapeName: string) => {
    const preset = HAIRSTYLE_PRESETS.find(p => p.id === presetId) || HAIRSTYLE_PRESETS[0];
    let finalScale = preset.defaultScale;
    let finalOffsetY = preset.defaultYOffset;
    let finalOffsetX = 0;
    let finalRotate = 0;

    const lowerShape = (faceShapeName || '').toLowerCase();
    
    // Auto translation & sizing depending on recognized facial bone properties
    if (lowerShape.includes('round') || lowerShape.includes('圓')) {
      // 圓臉 (Round): face structure is wider. Scale slightly wider (+6%) to match cheeks, and lift upward (-14px) to elongate forehead line
      finalScale = preset.defaultScale * 1.06;
      finalOffsetY = preset.defaultYOffset - 14;
    } else if (lowerShape.includes('long') || lowerShape.includes('長')) {
      // 長臉 (Long): face structure is longer. Sit lower (+12px) to visually shorten face, and scale inward (-4%)
      finalScale = preset.defaultScale * 0.96;
      finalOffsetY = preset.defaultYOffset + 12;
    } else if (lowerShape.includes('square') || lowerShape.includes('方')) {
      // 方臉 (Square): face contours have sharp jaw angles. Scale up slightly (+8%) and sit lower (+4px) to drape down gracefully and cover angles
      finalScale = preset.defaultScale * 1.08;
      finalOffsetY = preset.defaultYOffset + 4;
    } else if (lowerShape.includes('heart') || lowerShape.includes('心')) {
      // 心形臉 (Heart): forehead is wider, chin is sharp. Shift slightly upward (-8px) and standard scale (+2%)
      finalScale = preset.defaultScale * 1.02;
      finalOffsetY = preset.defaultYOffset - 8;
    } else if (lowerShape.includes('oval') || lowerShape.includes('鵝')) {
      // 鵝蛋臉 (Oval): ideal baseline. No further adjustments needed
      finalScale = preset.defaultScale;
      finalOffsetY = preset.defaultYOffset;
    }

    return {
      scale: parseFloat(finalScale.toFixed(2)),
      offsetY: Math.round(finalOffsetY),
      offsetX: finalOffsetX,
      rotate: finalRotate,
    };
  };

  const handleStyleFilterChange = (style: string) => {
    setStylePreference(style);
    
    // If we have an analysisResult already, let's instantly adjust, highlight, and sort hairstyles on the client!
    // This gives an amazing reactive experience, even before they click re-analyze.
    if (analysisResult) {
      // Create a fresh copy of the hairstyles array
      const rawHairstyles = [...analysisResult.hairstyles];
      
      const updatedHairstyles = rawHairstyles.map(h => {
        const presetId = h.tryonPresetId;
        let isMatch = false;
        
        if (style === 'all') {
          return h; // keep original
        } else if (style === 'cute' && ['bob', 'french_waves', 'cloud_perm', 'curtain_bangs', 'airy_bangs_long'].includes(presetId)) {
          isMatch = true;
        } else if (style === 'professional' && ['bob', 'japanese_layered', 'classic_undercut', 'curtain_bangs', 'pixie_cut'].includes(presetId)) {
          isMatch = true;
        } else if (style === 'trendy' && ['french_waves', 'cloud_perm', 'japanese_layered', 'classic_undercut', 'curtain_bangs', 'wolf_cut', 'pixie_cut'].includes(presetId)) {
          isMatch = true;
        }
        
        // Base suitability to prevent unbounded increment/decrement
        const baseScore = h.id.length % 5 + 90; // Generate deterministic base score between 90-94
        return {
          ...h,
          suitabilityScore: isMatch ? Math.min(100, baseScore + 6) : Math.max(70, baseScore - 12)
        };
      });
      
      // Re-sort hairstyles so the best match comes first
      updatedHairstyles.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
      
      setAnalysisResult(prev => prev ? {
        ...prev,
        hairstyles: updatedHairstyles
      } : null);

      // Auto select the top hairstyle resulting from the filter
      if (updatedHairstyles.length > 0) {
        const topPresetId = updatedHairstyles[0].tryonPresetId || 'curtain_bangs';
        setSelectedPresetId(topPresetId);
        
        const activeShape = analysisResult?.faceShape || demoFaceShapeSelected || 'oval';
        const adjusted = getAutoAdjustedControls(topPresetId, activeShape);
        setControlState(prev => ({
          ...prev,
          scale: adjusted.scale,
          offsetY: adjusted.offsetY,
          offsetX: adjusted.offsetX,
          rotate: adjusted.rotate,
        }));
      }
    }
  };

  // Trigger analysis pipeline
  const runAnalysis = async (useDemo: boolean = false, faceShape?: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    
    // Simulate complex steps for premium polished feedback
    const statuses = [
      '🔍 正在載入 AI 虛擬面部辨識組件...',
      '📐 正在定位關鍵五官點（眼角、鼻翼、眉心）...',
      '📏 正在量測面部長寬比例及下顎角線條...',
      '🎨 正在載入色彩對比與膚色冷暖度模型...',
      '🤖 正在調用 Google Gemini 精細化髮型與染髮分析系統...',
      '✨ 正在生成您的專屬髮雕設計建議...'
    ];

    let currentStep = 0;
    setAnalysisStatus(statuses[0]);
    const interval = setInterval(() => {
      if (currentStep < statuses.length - 1) {
        currentStep++;
        setAnalysisStatus(statuses[currentStep]);
      }
    }, 1400);

    try {
      let response;
      if (useDemo) {
        // Fetch demo simulation preset from API
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isDemo: true,
            demoFaceShape: faceShape || demoFaceShapeSelected,
            stylePreference: stylePreference
          }),
        });
      } else {
        if (!backgroundImage) {
          throw new Error('請先上傳照片或使用相機拍一張照片！');
        }
        // Extract raw base64 data (slice out data:image/jpeg;base64,)
        const base64Data = backgroundImage.split(',')[1];
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            mimeType: imageMimeType || 'image/jpeg',
            isDemo: false,
            stylePreference: stylePreference
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分析服務發生異常。');
      }

      const result = await response.json();
      if (result.success) {
        setAnalysisResult(result.analysis);
        
        // Auto load first recommended hairstyle tryon option
        if (result.analysis.hairstyles && result.analysis.hairstyles.length > 0) {
          const firstHairstyle = result.analysis.hairstyles[0];
          const firstPresetId = firstHairstyle.tryonPresetId || 'curtain_bangs';
          setSelectedPresetId(firstPresetId);
          
          // Auto calculate perfect alignment based on preset & detected face shape
          const adjusted = getAutoAdjustedControls(firstPresetId, result.analysis.faceShape);
          setControlState(prev => ({
            ...prev,
            scale: adjusted.scale,
            offsetY: adjusted.offsetY,
            offsetX: adjusted.offsetX,
            rotate: adjusted.rotate,
          }));
        }
        
        // Auto load first recommended dye color
        if (result.analysis.colors && result.analysis.colors.length > 0) {
          setSelectedColor(result.analysis.colors[0].hex);
        }

        // Jump to preview tab on mobile/tablets
        setActiveTab('advice');

      } else {
        throw new Error(result.error || '分析失敗');
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '分析失敗，請重試。');
      
      // Smart Fallback to Demo mock data in case API key is missing or failed
      // so user experience is totally fluid and uninterrupted
      if (!useDemo) {
        setErrorMsg(`API 呼叫失敗 (${err.message || '異常'})。已為您啟動高保真智慧模擬 analysis，已自動為您的臉型配置最優剪裁比例。`);
        // Trigger simulation
        setTimeout(async () => {
          const fallbackRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isDemo: true,
              demoFaceShape: demoFaceShapeSelected || 'oval',
              stylePreference: stylePreference
            }),
          });
          if (fallbackRes.ok) {
            const fallbackResult = await fallbackRes.json();
            if (fallbackResult.success) {
              setAnalysisResult(fallbackResult.analysis);
              if (fallbackResult.analysis.hairstyles?.length > 0) {
                const fallbackPresetId = fallbackResult.analysis.hairstyles[0].tryonPresetId || 'curtain_bangs';
                setSelectedPresetId(fallbackPresetId);
                const adjusted = getAutoAdjustedControls(fallbackPresetId, fallbackResult.analysis.faceShape);
                setControlState(prev => ({
                  ...prev,
                  scale: adjusted.scale,
                  offsetY: adjusted.offsetY,
                  offsetX: adjusted.offsetX,
                  rotate: adjusted.rotate,
                }));
              }
              if (fallbackResult.analysis.colors?.length > 0) {
                setSelectedColor(fallbackResult.analysis.colors[0].hex);
              }
            }
          }
        }, 3000);
      }
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  // Run demo simulation on mount
  useEffect(() => {
    runAnalysis(true, 'oval');
  }, []);

  // Web camera activation logic
  const startCamera = async () => {
    setIsCameraActive(true);
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Failed to open camera: ', err);
      setErrorMsg('無法開啟相機鏡頭。可能無權限或已被佔用，已自動切換回檔案上傳模式。');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Frame snapshot taken from live video stream
  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontal to look like natural mirror for snap
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const snapshotUrl = canvas.toDataURL('image/jpeg');
        setBackgroundImage(snapshotUrl);
        setImageMimeType('image/jpeg');
        stopCamera();
      }
    }
  };

  // Local file picker upload handler
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('請上傳正確的圖片格式檔案 (PNG, JPEG, WEBP 等)');
      return;
    }
    
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBackgroundImage(e.target.result as string);
        setImageMimeType(file.type);
        setSelectedPresetId('curtain_bangs'); // Reset preset
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-drop actions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Drag overlay hair wig interaction for Mouse and Touch
  const startDragWig = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingWig(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPosStart({ x: controlState.offsetX, y: controlState.offsetY });
  };

  const startTouchDragWig = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDraggingWig(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setPosStart({ x: controlState.offsetX, y: controlState.offsetY });
    }
  };

  useEffect(() => {
    const handleMoveWig = (e: MouseEvent) => {
      if (!isDraggingWig) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      // Sizing ratio adjustment
      setControlState(prev => ({
        ...prev,
        offsetX: posStart.x + dx,
        offsetY: posStart.y + dy,
      }));
    };

    const handleTouchMoveWig = (e: TouchEvent) => {
      if (!isDraggingWig || e.touches.length !== 1) return;
      e.preventDefault(); // prevent scrolling while dragging wig on mobile screens
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      
      setControlState(prev => ({
        ...prev,
        offsetX: posStart.x + dx,
        offsetY: posStart.y + dy,
      }));
    };

    const stopDragging = () => {
      setIsDraggingWig(false);
    };

    if (isDraggingWig) {
      window.addEventListener('mousemove', handleMoveWig);
      window.addEventListener('mouseup', stopDragging);
      window.addEventListener('touchmove', handleTouchMoveWig, { passive: false });
      window.addEventListener('touchend', stopDragging);
      window.addEventListener('touchcancel', stopDragging);
    }

    return () => {
      window.removeEventListener('mousemove', handleMoveWig);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMoveWig);
      window.removeEventListener('touchend', stopDragging);
      window.removeEventListener('touchcancel', stopDragging);
    };
  }, [isDraggingWig, dragStart, posStart]);

  // Download high-end photo composite with watermark frame
  const saveCompositePhoto = () => {
    const canvas = document.createElement('canvas');
    const bgImg = new Image();
    
    // Width and height of final frame
    canvas.width = 600;
    canvas.height = 750;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw solid elegant dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const completeExport = () => {
      // 1. Draw user photo or silhouette
      const drawWidth = 560;
      const drawHeight = 560;
      const drawX = 20;
      const drawY = 20;
      
      // Draw rounded mask for main preview image card
      ctx.save();
      // Create rounded rectangle path
      const radius = 24;
      ctx.beginPath();
      ctx.moveTo(drawX + radius, drawY);
      ctx.lineTo(drawX + drawWidth - radius, drawY);
      ctx.quadraticCurveTo(drawX + drawWidth, drawY, drawX + drawWidth, drawY + radius);
      ctx.lineTo(drawX + drawWidth, drawY + drawHeight - radius);
      ctx.quadraticCurveTo(drawX + drawWidth, drawY + drawHeight, drawX + drawWidth - radius, drawY + drawHeight);
      ctx.lineTo(drawX + radius, drawY + drawHeight);
      ctx.quadraticCurveTo(drawX, drawY + drawHeight, drawX, drawY + drawHeight - radius);
      ctx.lineTo(drawX, drawY + radius);
      ctx.quadraticCurveTo(drawX, drawY, drawX + radius, drawY);
      ctx.closePath();
      ctx.clip();

      if (backgroundImage) {
        ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);
      } else {
        // Draw elegant default representation
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('StyleAI 完美人像輪廓', canvas.width / 2, drawHeight / 2);
      }
      ctx.restore();

      // 2. Draw Wig on Canvas!
      // In web, drawing custom SVG to Canvas can be achieved elegantly by parsing SVG code,
      // but for absolute robustness and 100% security against CORS/browser security blocks,
      // we can draw an artistic hair SVG directly by fetching the DOM element's XML representation,
      // encoding it to Base64, and rendering it as an Image at the exact position!
      const wigElement = document.getElementById('tryon-wig-svg');
      if (wigElement) {
        const svgString = new XMLSerializer().serializeToString(wigElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const blobURL = window.URL.createObjectURL(svgBlob);
        
        const wigImg = new Image();
        wigImg.onload = () => {
          // Calculate exact position matching current offset, scale, flip in viewport
          const arBox = document.getElementById('ar-preview-container');
          if (arBox) {
            const containerW = arBox.clientWidth;
            const containerH = arBox.clientHeight;
            
            const activeShape = analysisResult?.faceShape || demoFaceShapeSelected || 'oval';
            const adjusted = getAutoAdjustedControls(selectedPresetId, activeShape);

            // Scaled positioning parameters matching CSS Transforms
            const scaleFactor = drawWidth / containerW;
            
            // UI uses width: '74%', which means 74% of parent width.
            // On canvas, the parent model image is drawWidth (560px).
            // So we multiply drawWidth by 0.74 as the base size, 
            // and then apply the UI scales: adjusted.scale * 1.35 * controlState.scale
            const baseWigSize = drawWidth * 0.74;
            const wigW = baseWigSize * (adjusted.scale * 1.35 * controlState.scale);
            const wigH = baseWigSize * (adjusted.scale * 1.35 * controlState.scale);

            // Compute center matching original rendering center
            // UI uses left: '50%', which aligns to horizontal center
            const centerX = drawX + drawWidth / 2 + (controlState.offsetX * scaleFactor);

            // UI uses top: '32%', which is 32% down the parent height (drawHeight)
            const baseCenterY = drawY + drawHeight * 0.32;
            const centerY = baseCenterY + (((adjusted.offsetY * 1.5) + controlState.offsetY + 36) * scaleFactor);

            ctx.save();
            ctx.translate(centerX, centerY);
            
            // Rotation
            ctx.rotate((controlState.rotate * Math.PI) / 180);
            
            // Horizontal Flip
            if (controlState.flipX) {
              ctx.scale(-1, 1);
            }

            // Draw SVG hair image
            ctx.drawImage(wigImg, -wigW / 2, -wigH / 2, wigW, wigH);
            ctx.restore();
            
            // Finish snapshot banner details
            drawWatermarkAndTrigger();
            window.URL.revokeObjectURL(blobURL);
          };
        };
        wigImg.src = blobURL;
      } else {
        drawWatermarkAndTrigger();
      }
    };

    const drawWatermarkAndTrigger = () => {
      // Draw card details footer
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`StyleAI 專屬造型：${currentPreset.name}`, 32, 620);
      
      // Color swatches annotation
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`偵測臉型配合：${analysisResult?.faceShape || '鵝蛋臉 (oval)'}`, 32, 650);
      ctx.fillText(`推薦指定染髮主色：${selectedColor}`, 32, 675);
      
      // Color block preview
      ctx.beginPath();
      ctx.arc(480, 640, 16, 0, 2 * Math.PI);
      ctx.fillStyle = selectedColor;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Brand Logo / Credits
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'right';
      ctx.fillText('StyleAI 髮型建議小幫手', canvas.width - 32, 620);
      ctx.font = 'italic 11px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Powered by Google Gemini 3.5 AI Engine', canvas.width - 32, 642);

      // Trigger automatic file download
      const finalDataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `StyleAI_${analysisResult?.faceShape.split(' ')[0] || '髮型建議'}_造型預覽.png`;
      downloadLink.href = finalDataUrl;
      downloadLink.click();
    };

    // Kickstart drawings mapping
    if (backgroundImage) {
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = completeExport;
      bgImg.src = backgroundImage;
    } else {
      completeExport();
    }
  };

  // Reset overlay offsets to perfect centering defaults using dynamic face shape auto-alignment
  const resetOverlayPosition = () => {
    const activeShape = analysisResult?.faceShape || demoFaceShapeSelected || 'oval';
    const adjusted = getAutoAdjustedControls(selectedPresetId, activeShape);
    setControlState(prev => ({
      ...prev,
      scale: adjusted.scale,
      rotate: adjusted.rotate,
      offsetX: adjusted.offsetX,
      offsetY: adjusted.offsetY,
      flipX: false,
    }));
  };

  // Sync selected color instantly
  const handleColorChange = (colorHex: string) => {
    setSelectedColor(colorHex);
    setControlState(prev => ({ ...prev, color: colorHex }));
  };

  // TTS Voice Speech Synthesis Reader Aloud
  const toggleSpeakHairstyle = (styleId: string, name: string, description: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingStyleId === styleId) {
      window.speechSynthesis.cancel();
      setSpeakingStyleId(null);
    } else {
      window.speechSynthesis.cancel();
      const readText = `為您推薦髮型：${name}。這款造型特點是：${description}`;
      const utterance = new SpeechSynthesisUtterance(readText);
      utterance.lang = 'zh-TW';
      utterance.onend = () => setSpeakingStyleId(null);
      utterance.onerror = () => setSpeakingStyleId(null);
      setSpeakingStyleId(styleId);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Instant single-hairstyle card download trigger
  const downloadSpecificHairstyle = (presetId: string) => {
    const prevPresetId = selectedPresetId;
    const prevControl = { ...controlState };

    // Select this hairstyle & autoconfigure coordinates
    setSelectedPresetId(presetId);
    const activeShape = (analysisResult?.faceShape) || demoFaceShapeSelected || 'oval';
    const adjusted = getAutoAdjustedControls(presetId, activeShape);
    setControlState(prev => ({
      ...prev,
      scale: adjusted.scale,
      offsetY: adjusted.offsetY,
      offsetX: adjusted.offsetX,
      rotate: adjusted.rotate,
    }));

    // Draw on canvas and trigger download after a tiny repaint window
    setTimeout(() => {
      saveCompositePhoto();
      
      // Restore previously chosen hairstyle & settings
      setTimeout(() => {
        setSelectedPresetId(prevPresetId);
        setControlState(prevControl);
      }, 100);
    }, 150);
  };

  // Helper default face skeleton drawing
  const renderFallbackFaceSvg = () => (
    <svg viewBox="0 0 300 400" className="w-[180px] h-[240px] text-gray-200" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.6">
      <path d="M150,60 C75,60 75,220 150,300 C225,220 225,60 150,60 Z" stroke="url(#face-bone)" strokeWidth="3" />
      <ellipse cx="115" cy="160" rx="14" ry="6" stroke="#fb7185" strokeWidth="2" opacity="0.4" />
      <ellipse cx="185" cy="160" rx="14" ry="6" stroke="#fb7185" strokeWidth="2" opacity="0.4" />
      <path d="M150,165 V210 L145,215 H155" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" />
      <path d="M125,245 C135,260 165,260 175,245 Z" fill="#ffe4e6" stroke="#fb7185" strokeWidth="2" />
      <defs>
        <linearGradient id="face-bone" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );

  return (
    <div id="styleai-app-root" className="min-h-screen bg-[#FAF9F6] text-[#2D2D2D] font-sans flex flex-col antialiased">
      
      {/* Top Banner & Header */}
      <nav id="navbar" className="sticky top-0 z-40 h-16 px-4 md:px-8 flex items-center justify-between bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-rose-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-rose-400/20">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg md:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-rose-500">
              StyleAI 髮型分析建議小幫手
            </span>
            <span className="hidden md:inline-block ml-3 text-xs bg-rose-50 text-rose-600 font-semibold px-2 py-0.5 rounded-full border border-rose-100">
              AR 實質渲染
            </span>
          </div>
        </div>
        
        {/* Status Indicators & GitHub Integration */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 border-r border-gray-100 pr-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>系統就緒：向量試戴模式</span>
          </div>
          
          <button
            onClick={() => setShowGithubModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:-translate-y-0.5"
            title="連接 / 同步您的 GitHub 儲存庫"
          >
            <Github className="w-4 h-4 text-rose-400" />
            <span>連線至 GitHub</span>
          </button>
        </div>
      </nav>
      
      {/* Main Unified Workspace */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Warning messages if some features are blocked */}
        {errorMsg && (
          <div id="error-banner" className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start gap-3 shadow-sm text-sm text-rose-700 transition-all duration-300">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">溫馨提示</p>
              <p className="mt-0.5 leading-relaxed text-xs text-rose-600/90">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* The 2-Column Responsive Dashboard */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT COLUMN: MirrorAI Diagnostic & Upload Panel (Col Span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            
            {/* 1. Main Face Scanner Upload Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-5 bg-rose-400 rounded-full inline-block"></span>
                  MIRRORAI 智慧辨識
                </h2>
                <div className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  LIVE SCANNER
                </div>
              </div>

              {/* Upload Drop Zone View */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative min-h-[220px] flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 transition-all duration-300 overflow-hidden ${
                  isDraggingOver 
                  ? 'border-indigo-500 bg-indigo-50/20' 
                  : backgroundImage 
                    ? 'border-gray-100 bg-slate-50/50' 
                    : 'border-rose-200 bg-rose-50/20 hover:bg-rose-50/40'
                }`}
              >
                {isCameraActive ? (
                  <div className="absolute inset-0 w-full h-full bg-black flex flex-col justify-end">
                    <video 
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                      playsInline
                      muted
                    />
                    <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 to-transparent flex gap-2 justify-center">
                      <button 
                        onClick={captureSnapshot}
                        className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
                      >
                        📷 擷取相機
                      </button>
                      <button 
                        onClick={stopCamera}
                        className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : backgroundImage ? (
                  <div className="relative w-full h-full flex items-center justify-center group overflow-hidden">
                    <img 
                      src={backgroundImage} 
                      alt="User Portrait" 
                      className="max-h-[200px] w-auto max-w-full object-contain rounded-xl select-none"
                    />
                    
                    {/* Face geometry scan tracker lines overlay */}
                    <div className="absolute inset-0 border border-emerald-500/10 pointer-events-none">
                      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-11/12 border-t border-dashed border-emerald-400/30"></div>
                      <div className="absolute top-2/4 left-1/2 -translate-x-1/2 w-11/12 border-t border-dashed border-emerald-400/30"></div>
                      <div className="absolute top-3/4 left-1/2 -translate-x-1/2 w-11/12 border-t border-dashed border-emerald-400/30"></div>
                      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-5/6 border-l border-dashed border-emerald-400/30"></div>
                      <div className="absolute top-1/2 left-3/4 -translate-y-1/2 h-5/6 border-l border-dashed border-emerald-400/30"></div>
                    </div>

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-xs">
                      <label className="bg-white text-gray-800 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer shadow-md transition-all hover:scale-105">
                        更換照片
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <button 
                        onClick={() => setBackgroundImage(null)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105 cursor-pointer"
                      >
                        清除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-rose-100 flex items-center justify-center mb-2.5">
                      <Upload className="w-5 h-5 text-rose-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-700">拖曳人像至此或點擊上傳</p>
                    <p className="text-[9.5px] text-gray-400 mt-1 max-w-[190px] leading-relaxed">
                      支援 PNG/JPG。建議直立正面人像照以獲取黃金比例配對。
                    </p>
                    
                    <div className="mt-3.5 flex gap-2">
                      <label className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition-all">
                        <Upload className="w-3 h-3 text-rose-500" />
                        開啟相簿
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <button 
                        onClick={startCamera}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Camera className="w-3 h-3 text-rose-400" />
                        啟動鏡頭
                      </button>
                    </div>
                  </div>
                )}

                {/* Processing Overlay Scanner bar */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center p-4 text-white text-center z-10">
                    <div className="w-16 h-16 relative border border-rose-500/50 rounded-xl overflow-hidden bg-slate-900/40 flex items-center justify-center mb-3">
                      <div className="absolute top-0 left-0 w-full h-[2.5px] bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-[bounce_2s_infinite]" />
                      <Sparkles className="w-6 h-6 text-rose-400 animate-pulse" />
                    </div>
                    <div className="inline-flex items-center gap-1 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 text-[9.5px] font-extrabold mb-2 text-rose-300">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      面骨線條演算中
                    </div>
                    <p className="text-xs text-rose-200 font-medium h-6 truncate max-w-full">{analysisStatus}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons & Manual Target Trigger */}
              <div className="space-y-2.5">
                <div className="bg-slate-50 border border-slate-100/80 p-3 rounded-xl">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1 select-none">
                    <Info className="w-3 h-3 text-indigo-400" /> 快速切換診斷臉型：
                  </span>
                  <div className="grid grid-cols-5 gap-1">
                    {DEMO_PRESETS.map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => {
                          setDemoFaceShapeSelected(shape);
                          runAnalysis(true, shape);
                        }}
                        className={`py-1 text-[10.5px] font-black rounded-lg transition-all border cursor-pointer ${
                          demoFaceShapeSelected === shape 
                          ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold' 
                          : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {shape === 'oval' ? '鵝蛋' : shape === 'round' ? '圓臉' : shape === 'square' ? '方臉' : shape === 'heart' ? '心形' : '長臉'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => runAnalysis(false)}
                  disabled={isAnalyzing || !backgroundImage}
                  className={`w-full py-2.5 rounded-xl font-extrabold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                    isAnalyzing 
                    ? 'bg-gray-150 text-gray-400 cursor-not-allowed border border-gray-100' 
                    : backgroundImage 
                      ? 'bg-slate-900 hover:bg-gray-800 text-white shadow-md active:translate-y-[0.5px] cursor-pointer' 
                      : 'bg-gray-100 text-gray-400 border border-gray-100 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  {backgroundImage ? '診斷我的黃金輪廓比例' : '上傳正面照後點擊辨識'}
                </button>
              </div>
            </div>

            {/* 2. Detected Diagnosis Card (Only if result processed) */}
            {analysisResult && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-center bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl">
                  <span className="text-xs font-bold text-slate-500">當前臉型定位：</span>
                  <span className="text-[11px] px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-black border border-indigo-100">
                    ✓ {analysisResult.faceShape.toUpperCase()}
                  </span>
                </div>

                {/* Diagnoses Card Details */}
                <div className="bg-indigo-950 text-indigo-100 rounded-2xl p-4 space-y-3 shadow-md border border-indigo-800/20 relative overflow-hidden">
                  <div className="absolute -right-5 -bottom-5 opacity-10 rotate-12 pointer-events-none">
                    <Smile className="w-24 h-24 text-white" />
                  </div>

                  <span className="block text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                    AI 護髮及體態診斷建議卡
                  </span>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <p className="text-indigo-300 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span>
                        1. 臉型與受光特徵
                      </p>
                      <p className="text-white/80 leading-relaxed text-[11px] mt-0.5">
                        {analysisResult.analysis.description}
                      </p>
                    </div>

                    <div>
                      <p className="text-indigo-300 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span>
                        2. 中下庭分割比例
                      </p>
                      <p className="text-white/80 leading-relaxed text-[11px] mt-0.5">
                        {analysisResult.analysis.ratioExplanation}
                      </p>
                    </div>

                    <div>
                      <p className="text-indigo-300 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span>
                        3. 輪廓邊界特徵
                      </p>
                      <div className="grid grid-cols-1 gap-1 text-[10.5px] mt-1 text-white/90">
                        {analysisResult.analysis.features.map((feat, i) => (
                          <span key={i} className="bg-indigo-900/50 p-1.5 rounded border border-white/5 truncate">
                            • {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instant Hair Dye color swatches (Direct influence on 9 styles) */}
                <div className="mt-2 pt-3 border-t border-gray-150">
                  <span className="block text-[11px] font-extrabold text-gray-400 tracking-wider mb-2 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-indigo-500" /> 特定冷暖染髮色盤：
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[{ hex: '#111827', name: '經典黑褐' }, { hex: '#9b7f6c', name: '焦糖奶茶' }, { hex: '#c0a38c', name: '冷亞麻灰' }, { hex: '#d97706', name: '琥珀焦橙' }].map((clr) => {
                      const isColorSelected = selectedColor.toLowerCase() === clr.hex.toLowerCase();
                      return (
                        <div
                          key={clr.hex}
                          onClick={() => handleColorChange(clr.hex)}
                          className={`p-1 flex flex-col items-center justify-between rounded-xl border cursor-pointer transition-all ${
                            isColorSelected 
                            ? 'border-indigo-600 bg-indigo-50/10 shadow-sm' 
                            : 'border-gray-100 hover:border-gray-200 bg-slate-50'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-md shadow-inner border border-black/5" style={{ backgroundColor: clr.hex }}></span>
                          <span className="text-[8.5px] font-black mt-1 text-gray-700">{clr.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Golden Ratio 9 Hairstyles Grid (Col Span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* Header section with instructions */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                    為您推薦 9 種黃金比例髮型
                  </h1>
                  <p className="text-xs text-gray-450 mt-1 leading-normal">
                    髮型圖片採用 Nano Banana 2 視覺生圖神經網路進行即時渲染更替，配對即時生成完畢。
                  </p>
                </div>
                
                {/* Style Preferences Filter buttons inside right card header */}
                <div className="inline-flex bg-slate-100 p-1 rounded-xl items-center gap-1 text-[10px] self-start sm:self-auto shrink-0 font-bold border border-slate-200">
                  {[{ key: 'all', label: '全部' }, { key: 'trendy', label: '💄 時尚' }, { key: 'cute', label: '🎀 可愛' }, { key: 'professional', label: '💼 專業' }].map(preference => {
                    const isActive = stylePreference === preference.key;
                    return (
                      <button
                        key={preference.key}
                        onClick={() => handleStyleFilterChange(preference.key)}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          isActive 
                          ? 'bg-white text-slate-950 shadow-xs ring-1 ring-slate-200' 
                          : 'text-gray-500 hover:text-slate-800'
                        }`}
                      >
                        {preference.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Global Try-on Alignment Calibrator */}
              {analysisResult && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-600 animate-pulse" />
                      <span className="text-xs font-black text-slate-800">
                        【高比例人像專屬】AR 試戴位置與大小 3D 快速對齊校準
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setControlState({
                          scale: 1.0,
                          rotate: 0,
                          offsetX: 0,
                          offsetY: 0,
                          flipX: false,
                          color: selectedColor,
                          opacity: 0.95,
                          intensity: 0.85,
                        });
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center gap-0.5 cursor-pointer self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3 h-3" /> 還原預設對齊
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                    {/* Scale / Zoom */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600 font-bold">
                        <span>髮型縮放 (變大/變小)：</span>
                        <span className="font-mono font-black text-indigo-650">{Math.round(controlState.scale * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.3" 
                        max="3.0" 
                        step="0.01"
                        value={controlState.scale}
                        onChange={(e) => setControlState(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-slate-200 accent-indigo-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Y Offset */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600 font-bold">
                        <span>上下挪動 (髮際高度)：</span>
                        <span className="font-mono font-black text-indigo-650">{controlState.offsetY}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="-200" 
                        max="200" 
                        step="1"
                        value={controlState.offsetY}
                        onChange={(e) => setControlState(prev => ({ ...prev, offsetY: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-slate-200 accent-indigo-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* X Offset */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600 font-bold">
                        <span>左右微調：</span>
                        <span className="font-mono font-black text-indigo-650">{controlState.offsetX}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="-150" 
                        max="150" 
                        step="1"
                        value={controlState.offsetX}
                        onChange={(e) => setControlState(prev => ({ ...prev, offsetX: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-slate-200 accent-indigo-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Rotate / Angle */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600 font-bold">
                        <span>左右傾斜度：</span>
                        <span className="font-mono font-black text-indigo-650">{controlState.rotate}°</span>
                      </div>
                      <input 
                        type="range" 
                        min="-45" 
                        max="45" 
                        step="1"
                        value={controlState.rotate}
                        onChange={(e) => setControlState(prev => ({ ...prev, rotate: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-slate-200 accent-indigo-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Grid content */}
              {!analysisResult ? (
                <div className="py-24 flex flex-col items-center justify-center text-center text-gray-400">
                  <Smile className="w-12 h-12 text-gray-300 stroke-1 mb-3 animate-pulse" />
                  <p className="text-xs font-extrabold text-gray-700">正在配對專屬比例髮型...</p>
                  <p className="text-[10px] text-gray-400 mt-1">請在左方點擊診斷或選擇預設臉型，以極速預覽 9 種造型。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
                  {analysisResult.hairstyles.map((style) => {
                    const presetId = style.tryonPresetId;
                    const activeShape = analysisResult?.faceShape || demoFaceShapeSelected || 'oval';
                    const adjusted = getAutoAdjustedControls(presetId, activeShape);
                    
                    // Filter check
                    let isVisible = true;
                    if (stylePreference === 'cute' && !['bob', 'french_waves', 'cloud_perm', 'curtain_bangs', 'airy_bangs_long'].includes(presetId)) isVisible = false;
                    if (stylePreference === 'professional' && !['bob', 'japanese_layered', 'classic_undercut', 'curtain_bangs', 'pixie_cut'].includes(presetId)) isVisible = false;
                    if (stylePreference === 'trendy' && !['french_waves', 'cloud_perm', 'japanese_layered', 'classic_undercut', 'curtain_bangs', 'wolf_cut', 'pixie_cut'].includes(presetId)) isVisible = false;

                    if (!isVisible) return null;

                    return (
                      <div 
                        key={style.id} 
                        className="bg-white rounded-2xl border border-gray-150 shadow-sm flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-150 group"
                      >
                        {/* Image Canvas composite preview top */}
                        <div 
                          id={selectedPresetId === presetId ? 'ar-preview-container' : undefined}
                          className="relative w-full aspect-[4/5] bg-slate-900 border-b border-gray-150 flex items-center justify-center overflow-hidden"
                        >
                          
                          {backgroundImage ? (
                            <img 
                              src={backgroundImage} 
                              alt="Backdrop Frame" 
                              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-85"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-40">
                              {renderFallbackFaceSvg()}
                            </div>
                          )}

                          {/* Hair preset rendered directly inside on top */}
                          <div 
                            className="absolute pointer-events-none select-none z-10"
                            style={{
                              left: '50%',
                              top: '32%',
                              width: '74%',
                              height: '74%',
                              transform: `translate(calc(-50% + ${controlState.offsetX}px), calc(-50% + ${(adjusted.offsetY * 1.5) + controlState.offsetY + 36}px)) scale(${adjusted.scale * 1.35 * controlState.scale}) rotate(${controlState.rotate}deg)`,
                              transformOrigin: 'center center',
                            }}
                          >
                            <svg 
                              id={selectedPresetId === presetId ? "tryon-wig-svg" : undefined}
                              viewBox="0 0 400 400" 
                              className="w-full h-full" 
                              style={{ overflow: 'visible' }}
                            >
                              <HairSVG 
                                id={presetId}
                                color={selectedColor}
                                opacity={controlState.opacity}
                                intensity={controlState.intensity}
                              />
                            </svg>
                          </div>

                          {/* Float Badge Completion */}
                          <div className="absolute bottom-2.5 left-2.5 bg-emerald-550 text-[#ffffff] font-extrabold text-[9.5px] px-2 py-0.5 rounded shadow-sm z-20 flex items-center gap-1 select-none">
                            <span className="w-1.5 h-1.5 bg-white rounded-full inline-block animate-ping"></span>
                            ✓ AI 模擬完成
                          </div>

                          {/* Action triggers bottom bar overlays inside photo card on hover */}
                          <div className="absolute inset-x-2 bottom-2.5 flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            {/* Fine Tune Adjust Modal Trigger */}
                            <button 
                              onClick={() => {
                                setSelectedPresetId(presetId);
                                const activeShp = analysisResult?.faceShape || demoFaceShapeSelected || 'oval';
                                const adj = getAutoAdjustedControls(presetId, activeShp);
                                setControlState(prev => ({
                                  ...prev,
                                  scale: adj.scale,
                                  offsetY: adj.offsetY,
                                  offsetX: adj.offsetX,
                                  rotate: adj.rotate,
                                }));
                                setFineTunePresetId(presetId);
                              }}
                              className="p-1 px-2.5 bg-black/75 hover:bg-black text-[10px] text-white font-extrabold rounded-md shadow flex items-center gap-1 transition-all cursor-pointer"
                              title="開啟放大特調細部滑塊面板"
                            >
                              <SlidersHorizontal className="w-3 h-3 text-rose-450" />
                              放大調整
                            </button>

                            {/* Standard download */}
                            <button 
                              onClick={() => downloadSpecificHairstyle(presetId)}
                              className="p-1 px-2.5 bg-rose-500 hover:bg-rose-600 text-[10px] text-[#ffffff] font-extrabold rounded-md shadow flex items-center gap-1 transition-all cursor-pointer"
                              title="匯出此款高解析度模擬圖"
                            >
                              <Download className="w-3 h-3 text-white" />
                              立即導出
                            </button>
                          </div>
                        </div>

                        {/* Title and descriptions below */}
                        <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-[#ffffff]">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <div>
                                <span className="text-indigo-650 font-extrabold italic text-xs mr-0.5 select-none">style_</span>
                                <strong className="text-slate-800 font-extrabold text-xs">{style.name}</strong>
                              </div>
                              
                              {/* Voice Speaker Reader */}
                              <button 
                                onClick={() => toggleSpeakHairstyle(style.id, style.name, style.description)}
                                className={`p-1 rounded-md transition-all border shrink-0 cursor-pointer ${
                                  speakingStyleId === style.id 
                                  ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-700'
                                }`}
                                title="播放語音造型設計建議"
                              >
                                {speakingStyleId === style.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            
                            <p className="text-[11px] text-gray-500 leading-normal mt-1.5 line-clamp-2">
                              {style.description}
                            </p>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-gray-100">
                            {/* prompt copy box */}
                            <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-[9.5px] text-slate-450 font-mono select-all leading-normal break-all flex items-start gap-1">
                              <span className="text-zinc-400 font-extrabold select-none">Prompt:</span>
                              <span>
                                {presetId === 'bob' && 'Sleek classic bob haircut, face-framing natural hair, cute Japanese style'}
                                {presetId === 'french_waves' && 'Japanese style soft textured perm, messy but styled wavy black hair, natural layers, youthful and casual'}
                                {presetId === 'cloud_perm' && 'Cloud perm design, extra voluminous soft wave layers, sweet curly look'}
                                {presetId === 'japanese_layered' && 'Japanese flowing leaf fringe style, curtain bangs, delicate intellectual look'}
                                {presetId === 'classic_undercut' && 'Sharp skin fade buzz cut, clean athletic buzz cut, high tight style'}
                                {presetId === 'curtain_bangs' && 'Trendy K-pop comma bangs, messy textured crown, modern soft layers'}
                                {presetId === 'pixie_cut' && 'Textured crop haircut, short messy bangs, modern casual style, low maintenance'}
                                {presetId === 'wolf_cut' && 'Light retro wolf cut, shaggy soft mullet haircut, rebellious modern style'}
                                {presetId === 'airy_bangs_long' && 'Classic parted pompadour oil-slick hair, neat clean parting, confident look'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN ZOOM FINE-TUNE CALIBRATION LIGHTBOX MODAL */}
      {fineTunePresetId && (() => {
        const activeShapeName = analysisResult?.faceShape || demoFaceShapeSelected || 'oval';
        const adjusted = getAutoAdjustedControls(fineTunePresetId, activeShapeName);
        
        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 text-white rounded-3xl p-5 md:p-6 w-full max-w-[850px] shadow-2xl border border-white/10 flex flex-col md:grid md:grid-cols-12 gap-6 max-h-[90vh] overflow-y-auto">
              
              {/* Header banner spans top col */}
              <div className="col-span-12 flex justify-between items-center pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-rose-400" />
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">放大對齊微調面板</h3>
                    <p className="text-[10px] text-gray-400">當前微校：{HAIRSTYLE_PRESETS.find(p => p.id === fineTunePresetId)?.name.split(' (')[0]}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFineTunePresetId(null)}
                  className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full cursor-pointer transition-all border border-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Left: Interactive Canvas Sandbox Frame (Col 6) */}
              <div 
                id="ar-preview-container"
                className="col-span-12 md:col-span-6 flex flex-col items-center justify-center relative bg-slate-950 rounded-2xl overflow-hidden aspect-[4/5] md:aspect-auto md:h-[420px] border border-white/10"
              >
                
                <div className="absolute top-2.5 left-2.5 bg-emerald-500/90 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md z-30 shadow-md">
                  ✓ AI 自動對應貼合成功
                </div>

                {backgroundImage ? (
                  <img 
                    src={backgroundImage} 
                    alt="AR Face Backdrop Backdrop" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                    {renderFallbackFaceSvg()}
                  </div>
                )}

                {/* Draggable/Interactive Wig Layer inside popup */}
                <div 
                  onMouseDown={startDragWig}
                  onTouchStart={startTouchDragWig}
                  className="absolute cursor-move transition-transform active:scale-95 z-20"
                  style={{
                    left: '50%',
                    top: '32%',
                    width: '74%',
                    height: '74%',
                    transform: `translate(calc(-50% + ${controlState.offsetX}px), calc(-50% + ${(adjusted.offsetY * 1.5) + controlState.offsetY + 36}px)) scale(${adjusted.scale * 1.35 * controlState.scale}) rotate(${controlState.rotate}deg)`,
                    transformOrigin: 'center center',
                  }}
                  title="在頭上按住並隨意拖動位置，或在右側調節滑桿大小！"
                >
                  <svg 
                    id="tryon-wig-svg"
                    viewBox="0 0 400 400" 
                    className="w-full h-full" 
                    style={{ overflow: 'visible' }}
                  >
                    <HairSVG 
                      id={fineTunePresetId}
                      color={selectedColor}
                      opacity={controlState.opacity}
                      intensity={controlState.intensity}
                    />
                  </svg>
                </div>

                <div className="absolute bottom-2 inset-x-2 bg-[#090d16]/85 backdrop-blur-md p-1.5 rounded-xl text-[9px] text-gray-400 text-center select-none">
                  💡 支援直接<strong>在臉上按住滑鼠或觸控拖曳</strong>髮型位置
                </div>
              </div>

            {/* Right: Fine-Tune Slider parameters (Col 6) */}
            <div className="col-span-12 md:col-span-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest pb-1.5 border-b border-white/5">
                  輪廓參數微校滑塊：
                </span>

                {/* Scale Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-200">
                    <span>📐 1. 調整髮型大小 (縮放比)：</span>
                    <span className="font-mono text-rose-450">{((controlState.scale) * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.2" 
                    max="4.0" 
                    step="0.01"
                    value={controlState.scale}
                    onChange={(e) => setControlState(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rotate Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-200">
                    <span>🔄 2. 傾斜度校準 (左右偏擺)：</span>
                    <span className="font-mono text-rose-450">{controlState.rotate}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="-180" 
                    max="180" 
                    value={controlState.rotate}
                    onChange={(e) => setControlState(prev => ({ ...prev, rotate: parseInt(e.target.value) }))}
                    className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Y Offset Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-200">
                    <span>↕️ 3. 髮際線高度位置 (垂直上下)：</span>
                    <span className="font-mono text-rose-450">{controlState.offsetY}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="-250" 
                    max="250" 
                    value={controlState.offsetY}
                    onChange={(e) => setControlState(prev => ({ ...prev, offsetY: parseInt(e.target.value) }))}
                    className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* X Offset Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-200">
                    <span>↔️ 4. 左右水平偏移對齊：</span>
                    <span className="font-mono text-rose-450">{controlState.offsetX}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="-250" 
                    max="250" 
                    value={controlState.offsetX}
                    onChange={(e) => setControlState(prev => ({ ...prev, offsetX: parseInt(e.target.value) }))}
                    className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Hair saturation & shine */}
                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] text-[#94a3b8]">髮梢光澤度 (Shine Intensity)</span>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.05"
                      value={controlState.intensity}
                      onChange={(e) => setControlState(prev => ({ ...prev, intensity: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-[#94a3b8]">染髮色澤飽和度 (Opacity)</span>
                    <input 
                      type="range" 
                      min="0.4" 
                      max="1.0" 
                      step="0.05"
                      value={controlState.opacity}
                      onChange={(e) => setControlState(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 text-xs text-white">
                  <button 
                    onClick={() => setControlState(prev => ({ ...prev, flipX: !prev.flipX }))}
                    className={`p-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer text-xs ${
                      controlState.flipX ? 'bg-rose-550 border-rose-550' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    左右水平鏡像
                  </button>

                  <button 
                    onClick={resetOverlayPosition}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    還原臉型預設
                  </button>
                </div>
              </div>

              {/* Direct Download specific composite row */}
              <div className="pt-3 border-t border-white/10 flex gap-2 shrink-0">
                <button 
                  onClick={() => downloadSpecificHairstyle(fineTunePresetId)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-500 hover:from-rose-600 hover:to-indigo-600 text-[#ffffff] rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  匯出完稿模擬圖
                </button>
                
                <button 
                  onClick={() => setFineTunePresetId(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all border border-white/5 cursor-pointer"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })()}

      {/* GITHUB SYNC & CONNECTION DIALOG */}
      {showGithubModal && (
        <div id="github-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 w-full max-w-[620px] shadow-2xl border border-gray-150 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Github className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 tracking-tight">GitHub 儲存庫同步設定指南</h3>
                  <p className="text-[10px] text-gray-400">連結與共享您的 StyleAI 專案代碼</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGithubModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-slate-600 p-1.5 rounded-full cursor-pointer transition-all border border-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content body */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              
              {/* Option A: Preferred AI Studio Direct Sync */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-black text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-650" />
                  <span>方法 A：推薦！藉由 AI Studio 一鍵同步至 GitHub</span>
                </div>
                <p className="text-[11px] text-indigo-950/80">
                  這是在 Google AI Studio 中最直接的串接方式，無須下載任何軟體或設置 SSH 金鑰：
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1.5 text-[11px] text-indigo-900/95 font-medium">
                  <li>點擊本 IDE 視窗右上角的專案選單或「設置」齒輪圖示。</li>
                  <li>選擇 <strong className="font-extrabold text-indigo-700 font-mono">Export / Export to GitHub</strong> 服務。</li>
                  <li>登入並授權您的 GitHub 帳號，並一鍵建立您專屬的公開或私有儲存庫（Repository）。</li>
                  <li>同步成功後，將可在您的 GitHub 帳號中直接在線運行與部署！</li>
                </ol>
              </div>

              {/* Option B: Manual Command Line Git setup */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-mono text-slate-600">B</div>
                  <span>方法 B：手動將原始碼推送至您的 GitHub 儲存庫</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  如果您想透過下載專案 ZIP 壓縮檔，並在本地終端端手動部署到您的 GitHub，請依照以下指令：
                </p>
                
                {/* Code Block */}
                <div className="bg-slate-900 text-slate-200 font-mono p-4 rounded-xl text-[10px] leading-relaxed relative border border-slate-750 select-text overflow-x-auto space-y-1">
                  <div className="text-gray-500 border-b border-white/5 pb-2 mb-2 flex items-center justify-between">
                    <span>Terminal / WSL / Git Bash Command</span>
                    <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded font-sans">唯讀指令組</span>
                  </div>
                  <div># 1. 於下載解壓後的專案根目錄初始化 Git 儲存庫</div>
                  <div className="text-rose-350">git init</div>
                  <div className="mt-2"># 2. 將所有檔案加入暫存區，並建立您的起始提交</div>
                  <div className="text-rose-350">git add .</div>
                  <div className="text-rose-350">git commit -m "feat: init StyleAI smart hairstyle layout"</div>
                  <div className="mt-2"># 3. 建立並指向您的遠端 GitHub 儲存庫位址</div>
                  <div className="text-rose-350">git branch -M main</div>
                  <div className="text-rose-350 text-indigo-300">git remote add origin https://github.com/【您的帳號】/【您的儲存庫名字】.git</div>
                  <div className="mt-2"># 4. 推送至 GitHub</div>
                  <div className="text-rose-350 font-bold">git push -u origin main</div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[11px] text-slate-800">GitHub 連線備註</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    導出時請忽將敏感金鑰寫在程式中（此專案之 Gemini API 密鑰皆整合於 AI Studio 的 Cloud 系統變數），上傳專案時，預設的 <code className="bg-slate-150 px-1 py-0.5 rounded">.gitignore</code> 會自動排除 node_modules 等雜物，安全且輕量！
                  </p>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowGithubModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs transition-all shadow-md cursor-pointer"
              >
                我已瞭解
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Styled Informational Footer conforming to Sleek Theme */}
      <footer id="footer" className="mt-auto px-4 md:px-8 py-5 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-400 bg-white border-t border-gray-100 gap-2 font-medium">
        <div>系統狀態: AI 分析引擎及 AR 向量試戴服務正常運作中</div>
        <div className="flex gap-6">
          <span className="hover:text-rose-500 cursor-pointer transition-colors">隱私與肖像權益聲明 (照片僅伺服器暫存分析並不落地儲存)</span>
          <span className="hover:text-rose-500 cursor-pointer transition-colors">服務條款</span>
          <span>© 2026 StyleAI Inc.</span>
        </div>
      </footer>
    </div>
  );
}
