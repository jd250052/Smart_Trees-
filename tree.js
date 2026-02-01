import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore'

/**
 * 基础课纲配置
 */
const MATH_CATALOG_BASE = [
  { id: 'set', label: '集合与常用逻辑', mastery: 0, keywords: ['集合', '逻辑', '命题', '并集', '交集', '子集'] },
  { id: 'func', label: '函数概念与性质', mastery: 0, keywords: ['函数', '单调性', '奇偶性', '定义域', '值域', '反函数'] },
  { id: 'trig', label: '三角函数与解三角形', mastery: 0, keywords: ['三角函数', '正弦', '余弦', '正切', '周期', '余弦定理', '正弦定理'] },
  { id: 'exp_log', label: '指数、对数与幂函数', mastery: 0, keywords: ['指数', '对数', '幂', '换底公式'] },
  { id: 'vector', label: '平面向量及复数', mastery: 0, keywords: ['向量', '复数', '共轭', '坐标', '数量积'] },
  { id: 'seq', label: '数列', mastery: 0, keywords: ['数列', '等差', '等比', '通项', '前n项和'] },
  { id: 'ineq', label: '不等式', mastery: 0, keywords: ['不等式', '均值定理', '线性规划'] },
  { id: 'geom_3d', label: '立体几何', mastery: 0, keywords: ['几何', '截面', '三视图', '平行', '垂直', '夹角', '球'] },
  { id: 'geom_analytic', label: '解析几何 (圆锥曲线)', mastery: 0, keywords: ['直线', '圆', '椭圆', '双曲线', '抛物线', '离心率'] },
  { id: 'stat', label: '统计与概率', mastery: 0, keywords: ['统计', '概率', '正态分布', '条件概率', '期望', '方差'] },
  { id: 'calc', label: '导数及其应用', mastery: 0, keywords: ['导数', '微积分', '切线', '极值', '驻点'] }
];

const MOCK_VIDEOS = [
  { id: 1, title: "高中数学核心：特征值与特征向量几何解释", channel: "3Blue1Brown", timestamp: "08:42", thumbnail: "https://img.youtube.com/vi/PFDu9oVAE-g/maxresdefault.jpg", tags: ["特征值", "线性代数", "代数", "矩阵"] },
  { id: 2, title: "函数平移规律：左加右减的本质", channel: "高中数学精讲", timestamp: "12:15", thumbnail: "https://img.youtube.com/vi/kYB8IZa5AuE/maxresdefault.jpg", tags: ["函数", "平移", "性质"] },
  { id: 3, title: "立体几何：截面问题解题模版", channel: "名师课堂", timestamp: "05:15", thumbnail: "https://img.youtube.com/vi/IOYyCHGWJq4/maxresdefault.jpg", tags: ["几何", "立体", "截面"] }
];

/**
 * 原生 SVG 图标组件集 - 修正了属性重复与渲染冲突
 */
const Icons = {
  Tree: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m17 10-5-5-5 5"/><path d="m21 16-9-9-9 9"/><path d="M12 3v18"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Youtube: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 2-2h15a2 2 0 0 1 2 2 10.12 10.12 0 0 1 0 10 2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2Z"/><path d="m10 15 5-3-5-3z"/></svg>,
  Play: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Brain: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.48Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.48Z"/></svg>,
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  ArrowRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  ZoomIn: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="21" /><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  ZoomOut: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="21" /><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  Maximize: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>,
  ChevronDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  Cube: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>,
  Share: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>,
  Link: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  List: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Sparkle: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813L4.275 10.725 10.088 12.637 12 18.45l1.913-5.813 5.812-1.912-5.812-1.912L12 3Z"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>,
  Key: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>,
};

// --- Firebase 初始化 ---
const firebaseConfig = JSON.parse(__firebase_config);
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'nexus-edu-forest';

// --- 字节火山方舟 API 配置 ---
const ARK_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DEFAULT_ARK_MODEL = 'doubao-seed-1-6-251015';

/**
 * 调用字节火山方舟 API
 * @param {string} prompt - 用户提示词
 * @param {string} systemPrompt - 系统提示词
 * @param {string} apiKey - API Key
 * @param {string} model - 模型名称
 * @returns {Promise<Object>} - 解析后的 JSON 结果
 */
const callArkAPI = async (prompt, systemPrompt = '', apiKey, model = DEFAULT_ARK_MODEL) => {
  if (!apiKey) {
    throw new Error('请先配置 Ark API Key');
  }

  const response = await fetch(`${ARK_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // 尝试解析 JSON 响应
  try {
    // 首先尝试直接解析
    return JSON.parse(content);
  } catch (e) {
    // 尝试从 markdown 代码块中提取 JSON
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // 尝试从文本中提取 JSON 对象
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    // 如果都失败，返回原始内容包装的对象
    return { content, reply: content };
  }
};

// --- 工具函数 ---

const renderString = (val) => {
  if (!val) return "";
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.label || val.name || val.description || val.text || val.title || JSON.stringify(val);
  }
  return String(val);
};

const updateTreeNode = (node, targetId, updateFn) => {
  if (!node) return null;
  if (node.id === targetId) return updateFn(node);
  if (node.children && Array.isArray(node.children)) {
    return { ...node, children: node.children.map(child => updateTreeNode(child, targetId, updateFn)) };
  }
  return node;
};

const deleteTreeNode = (node, targetId) => {
  if (!node) return null;
  if (node.id === targetId) return null;
  if (node.children && Array.isArray(node.children)) {
    return { ...node, children: node.children.map(child => deleteTreeNode(child, targetId)).filter(c => c !== null) };
  }
  return node;
};

const findNodeByNameRecursive = (node, name) => {
  if (!node) return null;
  const label = renderString(node.label).toLowerCase();
  if (label.includes(name.toLowerCase())) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByNameRecursive(child, name);
      if (found) return found;
    }
  }
  return null;
};

// --- 子组件定义 ---

/**
 * 掌握度目录看板
 */
const CatalogDashboard = ({ catalogData }) => (
  <div className="w-full max-w-6xl p-12 animate-in fade-in zoom-in duration-1000">
    <div className="flex flex-col gap-6 mb-12 border-b border-emerald-500/20 pb-10 text-center md:text-left">
       <h2 className="text-4xl font-black text-emerald-50 tracking-tighter uppercase">高中数学<span className="text-emerald-500 italic ml-2">智慧掌握度</span></h2>
       <p className="text-emerald-700 text-sm font-bold uppercase tracking-[0.3em]">系统会自动分析知识森林路径，实时点亮对应考纲模块</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
      {catalogData.map((item) => (
        <div key={item.id} className="bg-[#0d160e] border border-emerald-500/20 p-8 rounded-[2.5rem] shadow-2xl transition-all hover:border-emerald-400 hover:shadow-emerald-900/40 group overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-emerald-100 font-black text-lg leading-tight pr-4">{item.label}</h3>
            <div className={`w-3.5 h-3.5 rounded-full ${item.mastery > 0 ? 'bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.9)]' : 'bg-white/10'}`}></div>
          </div>
          <div className="relative w-full h-4 bg-black rounded-full overflow-hidden mb-6 border border-white/5 shadow-inner">
             <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${Math.min(item.mastery, 100)}%` }}></div>
             {item.mastery > 0 && <div className="absolute top-0 left-0 h-full w-full bg-emerald-400/5 animate-pulse"></div>}
          </div>
          <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest mb-6">
            <span className="text-emerald-900">核心掌握度</span>
            <span className="text-emerald-400">{Math.round(item.mastery)}%</span>
          </div>
          <div className="flex flex-wrap gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
             {item.keywords.map((k, i) => (
               <span key={i} className={`text-[9px] px-2 py-0.5 rounded-lg border transition-all ${item.mastery > 0 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : 'text-emerald-950 border-white/5'}`}>#{k}</span>
             ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * 3D 密度网视图
 */
const ThreeKnowledgeMesh = ({ treeData }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameIdRef = useRef(null);
  const cameraRef = useRef(null);
  const raycasterRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const nodesDataRef = useRef([]);

  const generatePositions = useCallback((node, level = 0, parentPos = [0, 0, 0], angleRange = [0, Math.PI * 2]) => {
    const nodes = [];
    const links = [];
    const currentPos = [...parentPos];
    if (level > 0) {
      const radius = 35 / (level + 0.5) + 15;
      const angle = (angleRange[0] + angleRange[1]) / 2 + (Math.random() - 0.5) * 0.5;
      const phi = Math.acos((Math.random() * 2) - 1);
      currentPos[0] += radius * Math.sin(phi) * Math.cos(angle);
      currentPos[1] += radius * Math.sin(phi) * Math.sin(angle);
      currentPos[2] += radius * Math.cos(phi);
      links.push({ start: parentPos, end: currentPos, strength: 1 / (level + 1) });
    }
    nodes.push({ pos: currentPos, depth: level, nodeData: node });
    if (node.children && node.children.length > 0) {
      const count = node.children.length;
      node.children.forEach((child, i) => {
        const subRange = [angleRange[0] + (i * (angleRange[1] - angleRange[0])) / count, angleRange[0] + ((i + 1) * (angleRange[1] - angleRange[0])) / count];
        const res = generatePositions(child, level + 1, currentPos, subRange);
        nodes.push(...res.nodes); links.push(...res.links);
      });
    }
    return { nodes, links };
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => {
      const THREE = window.THREE;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050906);
      sceneRef.current = scene;
      const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
      camera.position.z = 110;
      cameraRef.current = camera;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      const raycaster = new THREE.Raycaster();
      raycasterRef.current = raycaster;
      const { nodes, links } = generatePositions(treeData);
      nodesDataRef.current = [];
      nodes.forEach(n => {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(Math.max(1.2, 4.5 - n.depth * 0.8), 24, 24), new THREE.MeshPhongMaterial({ color: n.depth === 0 ? 0x10b981 : 0x064e3b, emissive: n.depth === 0 ? 0x10b981 : 0x000000, emissiveIntensity: 0.5, shininess: 100 }));
        sphere.position.set(...n.pos); scene.add(sphere);
        nodesDataRef.current.push({ mesh: sphere, nodeData: n.nodeData });
      });
      links.forEach(l => {
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...l.start), new THREE.Vector3(...l.end)]);
        scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5 + l.strength * 0.4 })));
      });
      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const pLight = new THREE.PointLight(0x10b981, 1, 200); pLight.position.set(20, 20, 50); scene.add(pLight);
      const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        scene.rotation.y += 0.001;
        if (raycasterRef.current && cameraRef.current) {
          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
          const intersects = raycasterRef.current.intersectObjects(nodesDataRef.current.map(n => n.mesh));
          nodesDataRef.current.forEach(item => {
            item.mesh.material.color.set(item.nodeData.children && item.nodeData.children.length > 0 ? 0x10b981 : 0x064e3b);
          });
          if (intersects.length > 0) {
            intersects[0].object.material.color.set(0x34d399);
          }
        }
        renderer.render(scene, camera);
      };
      animate();
      let isDown = false, prev = { x: 0, y: 0 };
      const onDown = (e) => { isDown = true; prev = { x: e.clientX, y: e.clientY }; };
      const onUp = () => isDown = false;
      const onMove = (e) => {
        if (isDown) {
          scene.rotation.y += (e.clientX - prev.x) * 0.005;
          scene.rotation.x += (e.clientY - prev.y) * 0.005;
          prev = { x: e.clientX, y: e.clientY };
        } else {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          }
        }
      };
      const onClick = (e) => {
        if (raycasterRef.current && cameraRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
          const intersects = raycasterRef.current.intersectObjects(nodesDataRef.current.map(n => n.mesh));
          if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const nodeData = nodesDataRef.current.find(item => item.mesh === clickedMesh).nodeData;
            const infoPanel = document.getElementById('node-info-panel');
            if (!infoPanel) {
              const panel = document.createElement('div');
              panel.id = 'node-info-panel';
              panel.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                width: 300px;
                background: rgba(7, 11, 7, 0.95);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 12px;
                padding: 20px;
                color: #ecfdf5;
                z-index: 100;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              `;
              containerRef.current.appendChild(panel);
            }
            const panel = document.getElementById('node-info-panel');
            panel.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #10b981; margin: 0;">知识点信息</h3>
                <button onclick="document.getElementById('node-info-panel').remove()" style="background: none; border: none; color: #94a3b8; cursor: pointer;">×</button>
              </div>
              <div style="margin-bottom: 10px;">
                <strong style="color: #34d399;">标题:</strong> ${nodeData.label || '未命名'}
              </div>
              ${nodeData.desc ? `<div style="margin-bottom: 10px;"><strong style="color: #34d399;">描述:</strong> ${nodeData.desc}</div>` : ''}
              ${nodeData.rel ? `<div style="margin-bottom: 10px;"><strong style="color: #34d399;">关系:</strong> ${nodeData.rel}</div>` : ''}
              ${nodeData.suggestions && nodeData.suggestions.length > 0 ? `
                <div style="margin-bottom: 10px;">
                  <strong style="color: #34d399;">建议:</strong>
                  <ul style="margin: 5px 0 0 20px; padding: 0;">
                    ${nodeData.suggestions.map(s => `<li>${s}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              ${nodeData.children && nodeData.children.length > 0 ? `<div><strong style="color: #34d399;">子节点数:</strong> ${nodeData.children.length}</div>` : ''}
            `;
          }
        }
      };
      containerRef.current.addEventListener('mousedown', onDown); window.addEventListener('mouseup', onUp); containerRef.current.addEventListener('mousemove', onMove); containerRef.current.addEventListener('click', onClick);
    };
    document.head.appendChild(script);
    return () => { 
      cancelAnimationFrame(frameIdRef.current); 
      if (rendererRef.current) rendererRef.current.dispose();
      const panel = document.getElementById('node-info-panel');
      if (panel) panel.remove();
    };
  }, [treeData, generatePositions]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing animate-in fade-in duration-1000" />;
};

/**
 * 知识节点组件
 */
const KnowledgeNode = ({ 
  node, level = 0, guidingNodeId, setGuidingNodeId, setSelectedVideo, onExpand, onSearchVideos, onDelete 
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [localGuidance, setLocalGuidance] = useState('');

  const handleExpandAction = async (text) => {
    setLocalLoading(true);
    await onExpand(node, text || localGuidance);
    setLocalLoading(false);
    setLocalGuidance('');
    setGuidingNodeId(null);
  };

  const labelText = renderString(node.label);
  const descText = renderString(node.desc);

  return (
    <div className="flex flex-col items-center flex-1 min-w-[440px]">
      <div className={`relative flex flex-col items-center ${level === 0 ? 'mb-40' : 'mb-32'}`}>
        {/* 有机化高亮连线 */}
        {level > 0 && (
          <>
            <div className="absolute -top-32 left-1/2 w-1 h-32 bg-gradient-to-b from-emerald-500 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.5)]">
               <div className="absolute top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#0a120b] border-2 border-emerald-400 rounded-full text-[10px] font-black text-emerald-300 uppercase tracking-widest shadow-2xl z-10 scale-110">
                 {renderString(node.rel) || "衍生"}
               </div>
            </div>
            <div className="absolute -top-[32.5px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)] z-[5] border-2 border-black animate-pulse"></div>
          </>
        )}
        <div className={`relative group flex flex-col items-center p-8 rounded-[3.5rem] border-2 transition-all duration-500 shadow-2xl select-none ${level === 0 ? 'bg-gradient-to-br from-[#121f14] to-[#0a120b] border-emerald-400 w-80 ring-4 ring-emerald-500/10 shadow-emerald-900/60' : 'bg-[#0f1a11] border-emerald-500/20 hover:border-emerald-400 w-72 hover:scale-[1.03]'}`}>
          <button onClick={() => onDelete(node.id)} className="absolute top-6 right-6 p-2 rounded-full bg-red-950/20 text-red-500/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all border border-red-500/10"><Icons.Trash /></button>
          {level === 0 && <div className="text-emerald-400 mb-5 animate-pulse"><Icons.Tree /></div>}
          <h3 className={`font-black tracking-tight leading-tight text-center px-4 ${level === 0 ? 'text-3xl text-emerald-50' : 'text-lg text-emerald-100 group-hover:text-emerald-400'}`}>{labelText}</h3>
          <div onClick={() => setIsDescExpanded(!isDescExpanded)} className="relative mt-5 group/desc cursor-pointer w-full text-center">
            <p className={`text-xs text-emerald-700 font-bold opacity-90 px-2 transition-all duration-500 ${isDescExpanded ? 'line-clamp-none' : 'line-clamp-2'}`}>{descText}</p>
            {!isDescExpanded && descText.length > 30 && <div className="flex justify-center mt-1 text-emerald-600/40 group-hover/desc:text-emerald-500 animate-bounce"><Icons.ChevronDown /></div>}
          </div>
          <div className="mt-8 w-full space-y-3">
            {node.videos && node.videos.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {node.videos.map(v => (
                  <div key={v.id} onClick={() => setSelectedVideo(v)} className="group/v flex items-center gap-4 p-3 bg-emerald-950/40 hover:bg-emerald-800/40 border border-emerald-500/20 rounded-2xl transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-black shrink-0 relative overflow-hidden shadow-inner border border-emerald-500/20"><img src={v.thumbnail} className="w-full h-full object-cover opacity-60 group-hover/v:opacity-100" alt="" /><div className="absolute inset-0 flex items-center justify-center text-emerald-400 scale-90"><Icons.Play /></div></div>
                    <div className="min-w-0"><p className="text-[11px] font-bold text-emerald-50 truncate">{renderString(v.title)}</p><p className="text-[9px] text-emerald-900 font-black uppercase mt-1 tracking-widest">{renderString(v.channel)}</p></div>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={async () => { await onSearchVideos(node); }} className="w-full py-4 bg-emerald-500/5 hover:bg-emerald-500/10 border-2 border-emerald-500/10 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black text-emerald-700 transition-all uppercase tracking-[0.2em] shadow-inner active:scale-95">
                <Icons.Youtube /> 检索资源
              </button>
            )}
          </div>
          <div className="mt-8 w-full flex flex-col items-center">
            {guidingNodeId === node.id ? (
              <div className="w-full animate-in slide-in-from-top-3 duration-300 z-20">
                {node.suggestions && node.suggestions.length > 0 && !localLoading && (
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {node.suggestions.map((s, i) => (
                      <button key={i} onClick={() => handleExpandAction(renderString(s))} className="px-3 py-1.5 bg-emerald-900/30 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-400 uppercase transition-all flex items-center gap-1.5 hover:bg-emerald-800"><Icons.Sparkle /> {renderString(s)}</button>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input autoFocus type="text" placeholder="引导生长意图..." className="w-full bg-[#070b07] border-2 border-emerald-500/40 rounded-2xl px-6 py-5 text-[11px] text-emerald-50 outline-none pr-14 shadow-3xl shadow-black focus:border-emerald-400 transition-all" value={localGuidance} onChange={(e) => setLocalGuidance(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleExpandAction(); }} />
                  <button onClick={() => handleExpandAction()} disabled={localLoading} className="absolute right-2.5 top-2.5 w-11 h-11 bg-emerald-600 rounded-xl text-white flex items-center justify-center hover:bg-emerald-500">{localLoading ? "🌀" : <Icons.ArrowRight />}</button>
                </div>
                {localLoading && <div className="mt-2 text-[8px] font-black uppercase text-emerald-500 animate-pulse text-center tracking-tighter">智慧脉络生长中...</div>}
                <button onClick={() => setGuidingNodeId(null)} className="mt-4 text-[10px] text-emerald-800 hover:text-emerald-600 font-black uppercase mx-auto block">取消</button>
              </div>
            ) : (
              <button onClick={() => { setGuidingNodeId(node.id); setLocalGuidance(''); }} className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_15px_40px_rgba(16,185,129,0.4)] border-[6px] border-[#0d160e] transition-transform active:scale-90"><Icons.Plus /></button>
            )}
          </div>
        </div>
        {/* 主干连线 */}
        {node.children && Array.isArray(node.children) && node.children.length > 0 && (
          <>
            <div className="h-32 w-1 bg-gradient-to-b from-emerald-400 to-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.3)]"></div>
            <div className="w-5 h-5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] -mt-2.5 z-10 border-2 border-[#050906] animate-pulse"></div>
          </>
        )}
      </div>
      {node.children && Array.isArray(node.children) && node.children.length > 0 && (
        <div className="flex flex-wrap md:flex-nowrap justify-center gap-x-24 relative w-full px-16 animate-in fade-in duration-1000">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent hidden md:block shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
          {node.children.map((child) => <KnowledgeNode key={child.id} node={child} level={level + 1} guidingNodeId={guidingNodeId} setGuidingNodeId={setGuidingNodeId} setSelectedVideo={setSelectedVideo} onExpand={onExpand} onSearchVideos={onSearchVideos} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
};

// --- 主组件入口 ---

export default function App() {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [shareInput, setShareInput] = useState('');
  const [rootNode, setRootNode] = useState(null); 
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [viewMode, setViewMode] = useState('2D'); 
  const [catalog, setCatalog] = useState(MATH_CATALOG_BASE);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [guidingNodeId, setGuidingNodeId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: '向导已就绪。所有错误已修复。现在你可以通过【目录】查看高中数学掌握度了。' }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isSharing, setIsSharing] = useState(false);
  const [isLoadInputVisible, setIsLoadInputVisible] = useState(false);
  const [arkApiKey, setArkApiKey] = useState(() => localStorage.getItem('ark_api_key') || '');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [arkModel, setArkModel] = useState(() => localStorage.getItem('ark_model') || DEFAULT_ARK_MODEL);

  const canvasRef = useRef(null);
  const scrollRef = useRef(null);

  // 保存 API Key 到 localStorage
  useEffect(() => {
    localStorage.setItem('ark_api_key', arkApiKey);
  }, [arkApiKey]);

  // 保存模型选择到 localStorage
  useEffect(() => {
    localStorage.setItem('ark_model', arkModel);
  }, [arkModel]);

  // 初始化认证
  useEffect(() => {
    let unsubscribe;
    const initAuth = async (retries = 0) => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        if (retries < 5) setTimeout(() => initAuth(retries + 1), Math.pow(2, retries) * 1000);
      }
    };
    initAuth();
    unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe && unsubscribe();
  }, []);

  /**
   * 掌握度更新引擎
   */
  const updateCatalogMastery = useCallback((labels) => {
    setCatalog(prev => prev.map(item => {
      let boost = 0;
      labels.forEach(label => {
        const lowerLabel = renderString(label).toLowerCase();
        if (item.keywords.some(k => lowerLabel.includes(k))) { boost += 20; }
      });
      return { ...item, mastery: Math.min(item.mastery + boost, 100) };
    }));
  }, []);

  const handleSearchVideos = useCallback(async (node) => {
    const label = renderString(node.label).toLowerCase();
    const matched = MOCK_VIDEOS.filter(v => v.title.toLowerCase().includes(label) || (v.tags && v.tags.some(t => label.includes(t.toLowerCase())))).slice(0, 2);
    setRootNode(prev => updateTreeNode(prev, node.id, (target) => ({ ...target, videos: matched.length > 0 ? matched : [MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)]] })));
  }, []);

  const handleExpandNode = useCallback(async (node, text) => {
    setGuidingNodeId(null);
    try {
      const prompt = `节点: "${renderString(node.label)}"。意图: "${text || '深度学习'}"）。追加生成 2 个相关的子知识分支。包含 label, rel, desc, suggestions 字符串数组。JSON 格式：{ "subBranches": [...] }`;
      const result = await callArkAPI(prompt, "教育专家。请始终返回包含 subBranches 数组的 JSON。", arkApiKey, arkModel);
      const branches = result.subBranches || result.branches || (Array.isArray(result) ? result : []);
      const newNodes = branches.map((b, i) => ({ 
        id: `${node.id}-leaf-${Date.now()}-${i}`, label: renderString(b.label), rel: renderString(b.rel) || "延伸", desc: renderString(b.desc), 
        suggestions: b.suggestions || ["详细探究"], videos: [], children: []
      }));
      setRootNode(prev => updateTreeNode(prev, node.id, (target) => ({ ...target, children: Array.isArray(target.children) ? [...target.children, ...newNodes] : newNodes })));
      updateCatalogMastery(newNodes.map(n => n.label));
    } catch (err) { 
      console.error(err); 
      setChatMessages(prev => [...prev, { role: 'ai', text: `扩展节点失败: ${err.message}` }]);
    }
  }, [updateCatalogMastery, arkApiKey, arkModel]);

  const handleDeleteNode = useCallback((id) => {
    setRootNode(prev => (prev && prev.id === id) ? null : deleteTreeNode(prev, id));
  }, []);

  const handleInitialGrowManual = useCallback(async (text) => {
    setIsInitialLoading(true);
    try {
      const result = await callArkAPI(`课题: "${text}"。生成 3 个分支。JSON包含 rootSuggestions: [] 数组。`, "教育专家。", arkApiKey, arkModel);
      const branches = result.subBranches || result.branches || (Array.isArray(result) ? result : []);
      
      // 深度加固：确保初始生长的 children 属性被强制定义为数组，解决显示问题
      const rootData = { 
        id: 'seed-' + Date.now(), label: text, desc: `智慧之脉络已展开。`,
        suggestions: result.rootSuggestions || ["底层原理", "实际应用"],
        children: branches.map((b, i) => ({ 
          id: `init-${i}-${Date.now()}`, 
          label: renderString(b.label), rel: "起源", desc: renderString(b.desc), suggestions: ["进一步探索"], 
          videos: [], children: [] // 必须为空数组而非 null
        })) 
      };
      setRootNode(rootData);
      setViewMode('2D');
      updateCatalogMastery([text, ...branches.map(b => b.label)]);
    } catch (e) { 
      setRootNode({ id: 'err', label: text, desc: `AI 调用失败: ${e.message}`, children: [] }); 
      setChatMessages(prev => [...prev, { role: 'ai', text: `初始化失败: ${e.message}` }]);
    } finally { setIsInitialLoading(false); }
  }, [updateCatalogMastery, arkApiKey, arkModel]);

  const handleSidebarChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const input = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: input }]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const labels = rootNode ? (function collect(n){ let l = [renderString(n.label)]; if(n.children) n.children.forEach(c => l=[...l, ...collect(c)]); return l; })(rootNode) : [];
      const prompt = `输入: "${input}"。节点: ${JSON.stringify(labels)}。解析 JSON: { "isCommand": true|false, "action": "ADD|DELETE|SEARCH|START|SWITCH_VIEW|LOAD", "targetName": "匹配名", "param": "参数", "reply": "回复" }。`;
      const response = await callArkAPI(prompt, "具备视图切换能力的向导。", arkApiKey, arkModel);
      if (response.isCommand) {
        const { action, targetName, param } = response;
        if (action === "SWITCH_VIEW") {
           const mode = param.toLowerCase();
           if(mode.includes('3d')) setViewMode('3D');
           else if(mode.includes('目录')) setViewMode('Catalog');
           else setViewMode('2D');
        }
        else if (action === "START") handleInitialGrowManual(param || input);
        else if (rootNode) {
          const tn = findNodeByNameRecursive(rootNode, targetName);
          if (tn) {
            if (action === "ADD") handleExpandNode(tn, param);
            else if (action === "DELETE") handleDeleteNode(tn.id);
            else if (action === "SEARCH") handleSearchVideos(tn);
          }
        }
        setChatMessages(prev => [...prev, { role: 'ai', text: `已执行指令：${action}` }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: response.reply }]);
      }
    } catch (e) { setChatMessages(prev => [...prev, { role: 'ai', text: `请求失败: ${e.message || '请检查 API Key 配置'}` }]); } finally { setIsChatLoading(false); }
  };

  const handleShare = useCallback(async () => {
    if (!rootNode || !user) return;
    setIsSharing(true);
    try {
      const shareDoc = { title: renderString(rootNode.label), data: JSON.stringify(rootNode), createdBy: user.uid, createdAt: new Date().toISOString() };
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'roadmaps'), shareDoc);
      setChatMessages(prev => [...prev, { role: 'ai', text: `分享成功！ID: ${docRef.id}` }]);
    } catch (e) { setChatMessages(prev => [...prev, { role: 'ai', text: "失败。" }]); } finally { setIsSharing(false); }
  }, [rootNode, user]);

  const handleLoadShareManual = useCallback(async (id) => {
    if (!id.trim() || !user) return;
    setIsInitialLoading(true);
    setIsLoadInputVisible(false);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'roadmaps', id.trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) { setRootNode(JSON.parse(docSnap.data().data)); setViewMode('2D'); }
      else { setChatMessages(prev => [...prev, { role: 'ai', text: '错误' }]); }
    } finally { setIsInitialLoading(false); }
  }, [user]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e) => { if (viewMode !== '2D') return; e.preventDefault(); setScale(s => Math.min(Math.max(0.1, s - e.deltaY * 0.001), 2)); };
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [viewMode]);

  // 自动滚动到聊天底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div ref={canvasRef} className={`min-h-screen bg-[#050906] text-emerald-50 flex overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`} onMouseDown={(e) => { if(viewMode!=='2D')return; if(e.target===canvasRef.current||e.target.closest('.draggable-bg')){setIsDragging(true);setStartPos({x:e.clientX-offset.x,y:e.clientY-offset.y});}}} onMouseMove={(e)=>{if(isDragging)setOffset({x:e.clientX-startPos.x,y:e.clientY-startPos.y});}} onMouseUp={()=>setIsDragging(false)}>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute top-0 left-1/4 w-[1200px] h-[1200px] bg-emerald-900/10 blur-[300px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[1000px] h-[1000px] bg-lime-900/5 blur-[250px] rounded-full"></div>
      </div>

      <div className={`flex-1 flex flex-col transition-all duration-500 ${isSidebarOpen ? 'mr-96' : 'mr-0'}`}>
        <nav className="fixed top-0 left-0 w-full z-[80] border-b border-emerald-900/30 bg-[#050906]/95 backdrop-blur-3xl px-12 py-8 flex items-center justify-between pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => {setRootNode(null); setQuery(''); setOffset({x:0,y:0}); setScale(0.8); setViewMode('2D');}}>
              <div className="w-14 h-14 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-emerald-900/30 transition-all group-hover:rotate-12 group-hover:scale-110"><Icons.Tree /></div>
              <span className="text-3xl font-black tracking-tighter uppercase text-emerald-50 italic">Smart<span className="text-emerald-400">Trees</span></span>
            </div>
            {rootNode && (
              <div className="flex bg-[#0d160e] p-1.5 rounded-[1.8rem] border border-emerald-500/20 shadow-inner">
                <button onClick={() => setViewMode('2D')} className={`flex items-center gap-2 px-6 py-3 rounded-[1.4rem] font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === '2D' ? 'bg-emerald-600 text-white shadow-xl' : 'text-emerald-800 hover:text-emerald-400'}`}>树</button>
                <button onClick={() => setViewMode('3D')} className={`flex items-center gap-2 px-6 py-3 rounded-[1.4rem] font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === '3D' ? 'bg-emerald-600 text-white shadow-xl' : 'text-emerald-800 hover:text-emerald-500'}`}><Icons.Cube /> 3D</button>
                <button onClick={() => setViewMode('Catalog')} className={`flex items-center gap-2 px-6 py-3 rounded-[1.4rem] font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'Catalog' ? 'bg-emerald-600 text-white shadow-xl' : 'text-emerald-800 hover:text-emerald-500'}`}><Icons.List /> 目录</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
               <button onClick={() => setIsLoadInputVisible(!isLoadInputVisible)} className={`p-4 rounded-2xl border border-emerald-500/20 transition-all ${isLoadInputVisible ? 'bg-emerald-600 text-white shadow-xl' : 'bg-emerald-950/60 text-emerald-400'}`} title="载入 ID"><Icons.Link /></button>
               {isLoadInputVisible && (
                 <div className="absolute top-20 right-0 w-80 bg-[#0a120b] border border-emerald-500/30 rounded-3xl p-6 shadow-3xl animate-in zoom-in-95 duration-300 z-[90]">
                    <p className="text-[9px] font-black uppercase text-emerald-700 tracking-widest mb-4 text-center">载入知识 ID</p>
                    <div className="flex gap-2">
                       <input autoFocus type="text" className="flex-1 bg-[#050906] border border-emerald-900 rounded-xl px-4 py-3 text-xs text-emerald-50 outline-none" value={shareInput} onChange={(e) => setShareInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLoadShareManual(shareInput)} />
                       <button onClick={() => handleLoadShareManual(shareInput)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black">确定</button>
                    </div>
                 </div>
               )}
            </div>
            {rootNode && <button onClick={handleShare} disabled={isSharing || !user} className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900 disabled:opacity-30 transition-all shadow-xl"><Icons.Share /></button>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/60 text-emerald-400 shadow-xl font-bold transition-all">{isSidebarOpen ? '⇠' : '⇢'}</button>
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center min-h-screen relative z-10 overflow-visible draggable-bg">
          {!rootNode ? (
            <div className={`max-w-4xl w-full text-center pointer-events-auto transition-all duration-1000 ${isInitialLoading ? 'opacity-30 scale-95' : 'opacity-100'}`}>
              <h1 className="text-[10rem] font-black mb-12 tracking-tighter leading-none text-emerald-50 text-center select-none">播种<span className="text-emerald-500 italic">智慧</span></h1>
              <div className="flex flex-col gap-10 px-10">
                <form onSubmit={(e) => { e.preventDefault(); if(query.trim()) handleInitialGrowManual(query); }} className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-600 to-lime-500 rounded-[3.5rem] blur-[40px] opacity-10 transition-all"></div>
                  <div className="relative flex bg-[#0d160e] border border-emerald-500/20 rounded-[3.5rem] overflow-hidden shadow-2xl">
                    <input type="text" placeholder="种下一个课题..." className="w-full bg-transparent px-14 py-10 outline-none text-3xl text-emerald-50 font-bold" value={query} onChange={(e) => setQuery(e.target.value)} />
                    <button type="submit" disabled={isInitialLoading} className="mr-6 my-5 px-16 bg-emerald-600 hover:bg-emerald-500 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] text-white shadow-2xl">{isInitialLoading ? "..." : "开始"}</button>
                  </div>
                </form>
              </div>
            </div>
          ) : viewMode === '2D' ? (
            <div className="absolute transition-transform duration-150 ease-out will-change-transform" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}>
              <div className="origin-top flex flex-col items-center">
                <KnowledgeNode node={rootNode} guidingNodeId={guidingNodeId} setGuidingNodeId={setGuidingNodeId} setSelectedVideo={setSelectedVideo} onExpand={handleExpandNode} onSearchVideos={handleSearchVideos} onDelete={handleDeleteNode} />
              </div>
            </div>
          ) : viewMode === '3D' ? (
            <div className="w-full h-full"><ThreeKnowledgeMesh treeData={rootNode} /></div>
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-y-auto pt-24">
               <CatalogDashboard catalogData={catalog} />
            </div>
          )}
        </main>
      </div>

      {rootNode && viewMode === '2D' && (
        <div className="fixed bottom-14 left-14 z-50 flex flex-col gap-5">
          <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-5 bg-[#0a120b]/90 backdrop-blur-3xl border border-emerald-500/20 rounded-2xl text-emerald-400 shadow-2xl active:scale-90 hover:bg-emerald-900/40"><Icons.ZoomIn /></button>
          <button onClick={() => setScale(s => Math.max(s - 0.1, 0.1))} className="p-5 bg-[#0a120b]/90 backdrop-blur-3xl border border-emerald-500/20 rounded-2xl text-emerald-400 shadow-2xl active:scale-90 hover:bg-emerald-900/40"><Icons.ZoomOut /></button>
          <button onClick={() => {setOffset({x:0,y:0}); setScale(0.8);}} className="p-5 bg-[#0a120b]/90 backdrop-blur-3xl border border-emerald-500/20 rounded-2xl text-emerald-400 shadow-2xl active:scale-90 hover:bg-emerald-900/40"><Icons.Maximize /></button>
        </div>
      )}

      <aside className={`fixed right-0 top-0 h-screen w-96 z-[100] bg-[#070b07]/98 backdrop-blur-3xl border-l border-emerald-900/30 transform transition-transform duration-500 ease-out flex flex-col pointer-events-auto ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-12 border-b border-emerald-900/30 flex items-center justify-between shadow-lg">
           <div className="flex items-center gap-5 text-emerald-400"><Icons.Brain /><h2 className="text-sm font-black text-emerald-50 uppercase tracking-[0.4em]">森林向导</h2></div>
           <div className="flex items-center gap-3">
             <button onClick={() => setIsApiKeyVisible(!isApiKeyVisible)} className={`p-3 rounded-xl border border-emerald-500/20 transition-all ${isApiKeyVisible ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:text-emerald-400'}`} title="API 设置"><Icons.Key /></button>
             <button onClick={() => setIsSidebarOpen(false)} className="text-emerald-800 hover:text-emerald-400 transition-all scale-125"><Icons.X /></button>
           </div>
        </div>
        
        {/* API Key 配置面板 */}
        {isApiKeyVisible && (
          <div className="p-6 border-b border-emerald-900/30 bg-emerald-950/30 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 block">Ark API Key</label>
                <input 
                  type="password" 
                  placeholder="输入您的 API Key..." 
                  className="w-full bg-[#0d160e] border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-50 outline-none focus:border-emerald-500"
                  value={arkApiKey}
                  onChange={(e) => setArkApiKey(e.target.value)}
                />
                <p className="text-[9px] text-emerald-800 mt-2">从火山引擎控制台获取 API Key</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 block">模型</label>
                <select 
                  className="w-full bg-[#0d160e] border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-50 outline-none focus:border-emerald-500"
                  value={arkModel}
                  onChange={(e) => setArkModel(e.target.value)}
                >
                  <option value="doubao-seed-1-6-251015">doubao-seed-1-6-251015</option>
                  <option value="doubao-pro-32k">doubao-pro-32k</option>
                  <option value="doubao-lite-32k">doubao-lite-32k</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <div className={`w-2 h-2 rounded-full ${arkApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[10px] text-emerald-600">{arkApiKey ? 'API 已配置' : '未配置 API Key'}</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 scroll-smooth">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[90%] p-6 rounded-[2.5rem] text-[14px] shadow-xl ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-emerald-950/50 text-emerald-50 border border-emerald-500/10 rounded-tl-none'}`}>{renderString(msg.text)}</div>
            </div>
          ))}
          {isChatLoading && <div className="flex justify-start text-[11px] text-emerald-800 font-black uppercase p-6 animate-pulse">解析指令中...</div>}
        </div>
        <div className="p-10 border-t border-emerald-900/30 bg-[#050906]/80 backdrop-blur-xl">
           <form onSubmit={handleSidebarChat} className="relative group">
              <input type="text" placeholder="对话操控森林..." className="w-full bg-[#0d160e] border border-emerald-500/20 rounded-[2rem] px-8 py-6 text-sm text-emerald-50 outline-none focus:border-emerald-500 pr-16 shadow-inner" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
              <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="absolute right-3 top-3 w-12 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 disabled:opacity-30"><Icons.Send /></button>
           </form>
        </div>
      </aside>

      {/* 视频播放详情 */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-16 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-[#050906]/98 backdrop-blur-3xl shadow-2xl" onClick={() => setSelectedVideo(null)}></div>
          <div className="relative w-full max-w-7xl aspect-video bg-[#0a120b] border border-emerald-500/10 rounded-[6rem] overflow-hidden shadow-2xl">
             <img src={selectedVideo.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-10 blur-[200px] scale-150" alt="" />
             <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-24">
                <div className="w-40 h-40 bg-emerald-600 rounded-[4rem] flex items-center justify-center shadow-emerald-950/60 mb-20 border-8 border-white/10 hover:scale-110 transition-transform cursor-pointer group/play"><div className="text-white scale-[2.2] ml-2"><Icons.Play /></div></div>
                <h3 className="text-7xl font-black text-emerald-50 mb-10 tracking-tight leading-tight max-w-5xl text-center shadow-inner">{renderString(selectedVideo.title)}</h3>
                <div className="flex items-center justify-center gap-10">
                  <span className="px-10 py-4 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[13px] font-black text-emerald-400 uppercase tracking-[0.5em]">时长: {renderString(selectedVideo.timestamp)}</span>
                  <span className="text-emerald-900 text-[13px] font-black uppercase opacity-80">{renderString(selectedVideo.channel)}</span>
                </div>
             </div>
             <button onClick={() => setSelectedVideo(null)} className="absolute top-20 left-20 w-24 h-24 bg-white/5 hover:bg-white/10 rounded-[3.5rem] flex items-center justify-center border border-white/10 shadow-2xl transition-all hover:scale-110 active:scale-90"><Icons.X /></button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 20px; }
        .draggable-bg { touch-action: none; }
        .will-change-transform { will-change: transform; }
        .animate-in { animation: leafIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes leafIn { 
          from { opacity: 0; transform: translateY(60px) scale(0.9); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
        @keyframes shimmer { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(100%); } 
        }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
      `}} />
    </div>
  );
}