import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer, Trash2, Download, ChevronLeft,
  Layers, RotateCcw, FileJson, Zap, Box, Volume2, Film,
  Monitor, Type, Image, Video, Mic, Sparkles,
  Settings2, X, Plus, ArrowRight,
  User, Music, Wand2, Scissors, Globe,
  AlertTriangle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  NODE_TYPES, INITIAL_NODES, INITIAL_EDGES, META_DATA,
  SCENE_DIALOGUES, CATEGORY_LABELS,
  type GraphNode, type GraphEdge, type NodeType,
} from '@/lib/nodeEditorData';
import { phase6 as phase6Api, ApiError } from '@/lib/api';
import { useBriefBootstrap } from '@/lib/useBriefBootstrap';

const ACCENT = '#F59E0B';
const CANVAS_W = 1600;
const CANVAS_H = 1200;
const NODE_W = 156;
const NODE_H = 64;

/* ─── icon map for node palette ─── */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  input: User,
  generate: Wand2,
  audio: Volume2,
  composite: Layers,
  output: Monitor,
};

const NODE_TYPE_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'reference.actor': User,
  't2i.keyframe': Image,
  'i2v.scene': Video,
  't2v.scene': Film,
  'tts.voiceover': Mic,
  'audio.lipsync': Zap,
  'audio.sfx': Sparkles,
  'audio.music': Music,
  'overlay.text': Type,
  'transition.cut': Scissors,
  'compositor.scene': Layers,
  'compositor.master': Box,
  'render.output': Monitor,
};

/* ─── helpers ─── */
function getNodeType(typeId: string): NodeType | undefined {
  return NODE_TYPES.find((t) => t.id === typeId);
}

function parseEdgeRef(ref: string): { nodeId: string; port: string } {
  const parts = ref.split(':');
  return { nodeId: parts[0], port: parts[1] || '' };
}

function generateId(prefix: string): string {
  return `${prefix}.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 5)}`;
}

/* ─── edge path ─── */
function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1) * 0.4;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/* ─── backend <-> frontend graph adapters ───
 * Backend GraphNode uses snake_case (scene_binding, prompt_template,
 * rendered_prompt) and GraphEdge uses from_port/to_port; this page's
 * GraphNode/GraphEdge types use camelCase from/to. Field values and edge
 * "nodeId:port" string format are otherwise identical. */
function nodeFromBackend(n: Record<string, unknown>): GraphNode {
  return {
    id: String(n.id),
    type: String(n.type),
    sceneBinding: (n.scene_binding as number | null) ?? null,
    position: (n.position as { x: number; y: number }) ?? { x: 0, y: 0 },
    parameters: (n.parameters as Record<string, unknown>) ?? {},
    promptTemplate: (n.prompt_template as string) ?? '',
    renderedPrompt: (n.rendered_prompt as string) ?? '',
    core: (n.core as boolean) ?? true,
  };
}

function edgeFromBackend(e: Record<string, unknown>): GraphEdge {
  return { id: String(e.id), from: String(e.from_port), to: String(e.to_port) };
}

function nodeToBackendAddRequest(n: GraphNode) {
  return {
    type: n.type,
    scene_binding: n.sceneBinding,
    position: n.position,
    parameters: n.parameters,
    prompt_template: n.promptTemplate ?? '',
  };
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

export default function Phase6() {
  const navigate = useNavigate();
  const { briefId, loading: briefLoading, error: briefError, retry: retryBrief } = useBriefBootstrap();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasInnerRef = useRef<HTMLDivElement>(null);

  /* state */
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState<number | 'all'>('all');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSummary, setShowSummary] = useState(false);
  /* delete protection for core nodes */
  const [deleteModal, setDeleteModal] = useState<{ nodeId: string; nodeName: string } | null>(null);
  const [deleteSleep, setDeleteSleep] = useState(false);
  /* uploaded reference images per node */
  const [nodeImages, setNodeImages] = useState<Record<string, string>>({});
  /* canvas viewport auto-scale */
  const [canvasScale, setCanvasScale] = useState(1);
  /* edge selection */
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  /* backend sync state */
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  /* Load the real node graph for this brief, generating one from the
   * approved screenplay if it doesn't exist yet. Falls back to the
   * bundled demo graph (INITIAL_NODES/INITIAL_EDGES) on any failure. */
  useEffect(() => {
    if (!briefId) return;
    setGraphLoading(true);
    setGraphError(null);
    phase6Api
      .get(briefId)
      .then((res) => {
        if (res.generated && Array.isArray(res.nodes) && (res.nodes as unknown[]).length > 0) {
          setNodes((res.nodes as Record<string, unknown>[]).map(nodeFromBackend));
          setEdges((res.edges as Record<string, unknown>[]).map(edgeFromBackend));
          setIsLive(true);
          return null;
        }
        return phase6Api.generate(briefId);
      })
      .then((res) => {
        if (!res) return;
        const genNodes = (res.nodes as Record<string, unknown>[]) ?? [];
        const genEdges = (res.edges as Record<string, unknown>[]) ?? [];
        if (genNodes.length > 0) {
          setNodes(genNodes.map(nodeFromBackend));
          setEdges(genEdges.map(edgeFromBackend));
          setIsLive(true);
        }
      })
      .catch((err: unknown) => {
        setGraphError(
          err instanceof ApiError
            ? `${err.message} — showing example graph instead.`
            : 'Could not load the node graph — showing example graph instead.'
        );
      })
      .finally(() => setGraphLoading(false));
  }, [briefId]);


  /* delete button sleep timer */
  useEffect(() => {
    if (!deleteSleep) return;
    const timer = setTimeout(() => setDeleteSleep(false), 10000); // 10 second sleep
    return () => clearTimeout(timer);
  }, [deleteSleep]);

  /* ─── viewport auto-scale ─── */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = width / CANVAS_W;
        const scaleY = height / CANVAS_H;
        setCanvasScale(Math.min(scaleX, scaleY, 1)); // never scale up, only down
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ─── parameter editing ─── */
  const handleAddParam = useCallback((nodeId: string) => {
    setNodes((prev) => prev.map((n) => {
      if (n.id !== nodeId) return n;
      const params = { ...n.parameters };
      let newKey = 'new_param';
      let suffix = 1;
      while (newKey in params) { newKey = `new_param_${suffix}`; suffix++; }
      params[newKey] = '';
      return { ...n, parameters: params };
    }));
  }, []);

  const handleParamKeyChange = useCallback((nodeId: string, oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    setNodes((prev) => prev.map((n) => {
      if (n.id !== nodeId) return n;
      const params = { ...n.parameters };
      const value = params[oldKey];
      delete params[oldKey];
      params[newKey] = value;
      return { ...n, parameters: params };
    }));
  }, []);

  const handleParamValueChange = useCallback((nodeId: string, key: string, value: string) => {
    setNodes((prev) => prev.map((n) => {
      if (n.id !== nodeId) return n;
      return { ...n, parameters: { ...n.parameters, [key]: value } };
    }));
  }, []);

  const handleRemoveParam = useCallback((nodeId: string, key: string) => {
    setNodes((prev) => prev.map((n) => {
      if (n.id !== nodeId) return n;
      const params = { ...n.parameters };
      delete params[key];
      return { ...n, parameters: params };
    }));
  }, []);

  /* ─── image upload ─── */
  const handleImageUpload = useCallback((nodeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setNodeImages((prev) => ({ ...prev, [nodeId]: result }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  /* derived */
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const visibleNodes = useMemo(() => {
    if (activeScene === 'all') return nodes;
    return nodes.filter((n) => n.sceneBinding === activeScene || n.sceneBinding === null);
  }, [nodes, activeScene]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return edges.filter((e) => {
      const { nodeId: fromId } = parseEdgeRef(e.from);
      const { nodeId: toId } = parseEdgeRef(e.to);
      return visibleNodeIds.has(fromId) && visibleNodeIds.has(toId);
    });
  }, [edges, visibleNodeIds]);

  /* node type grouped for palette */
  const groupedNodeTypes = useMemo(() => {
    const groups: Record<string, NodeType[]> = {};
    NODE_TYPES.forEach((nt) => {
      if (!groups[nt.category]) groups[nt.category] = [];
      groups[nt.category].push(nt);
    });
    return groups;
  }, []);

  /* ─── drag handlers ─── */
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      const scrollLeft = canvasRef.current?.scrollLeft || 0;
      const scrollTop = canvasRef.current?.scrollTop || 0;
      setDragOffset({
        x: e.clientX - canvasRect.left + scrollLeft - node.position.x,
        y: e.clientY - canvasRect.top + scrollTop - node.position.y,
      });
      setDraggingNodeId(nodeId);
      setSelectedNodeId(nodeId);
    },
    [nodes]
  );

  useEffect(() => {
    if (!draggingNodeId) return;
    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      const scrollLeft = canvasRef.current?.scrollLeft || 0;
      const scrollTop = canvasRef.current?.scrollTop || 0;
      const newX = (e.clientX - canvasRect.left) / canvasScale + scrollLeft - dragOffset.x;
      const newY = (e.clientY - canvasRect.top) / canvasScale + scrollTop - dragOffset.y;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
            : n
        )
      );
    };
    const handleMouseUp = () => {
      setDraggingNodeId(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId, dragOffset, canvasScale]);

  /* ─── add node from palette ─── */
  const handleAddNode = useCallback((type: NodeType) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const scrollLeft = canvasRef.current?.scrollLeft || 0;
    const scrollTop = canvasRef.current?.scrollTop || 0;
    const viewW = canvasRect?.width || 800;
    const viewH = canvasRect?.height || 600;
    const newNode: GraphNode = {
      id: generateId(type.category),
      type: type.id,
      sceneBinding: activeScene === 'all' ? 1 : activeScene,
      position: {
        x: (scrollLeft + viewW / 2 - NODE_W / 2) / canvasScale + Math.random() * 40 - 20,
        y: (scrollTop + viewH / 2 - NODE_H / 2) / canvasScale + Math.random() * 40 - 20,
      },
      parameters: {},
      core: false, // user-added node (not from approved screenplay)
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    if (briefId && isLive) {
      phase6Api
        .addNode(briefId, nodeToBackendAddRequest(newNode))
        .then((res) => {
          // Backend assigns its own canonical ID — reconcile so future
          // deletes/edits target the right record.
          const saved = res.node as Record<string, unknown>;
          if (saved?.id) {
            setNodes((prev) => prev.map((n) => (n.id === newNode.id ? { ...n, id: String(saved.id) } : n)));
            setSelectedNodeId(String(saved.id));
          }
        })
        .catch(() => {
          // Non-fatal — node still exists locally for this session.
        });
    }
  }, [activeScene, canvasScale, briefId, isLive]);

  /* ─── delete selected node ─── */
  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;

    // Core nodes (from approved screenplay) show confirmation modal
    if (node.core) {
      setDeleteModal({ nodeId: selectedNodeId, nodeName: getNodeType(node.type)?.label || node.type });
      return;
    }

    // User-added nodes delete immediately
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) => prev.filter((e) => {
      const { nodeId: fromId } = parseEdgeRef(e.from);
      const { nodeId: toId } = parseEdgeRef(e.to);
      return fromId !== selectedNodeId && toId !== selectedNodeId;
    }));
    if (briefId && isLive) {
      phase6Api.deleteNode(briefId, selectedNodeId, false).catch(() => {});
    }
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [selectedNodeId, nodes, briefId, isLive]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteModal) return;
    setNodes((prev) => prev.filter((n) => n.id !== deleteModal.nodeId));
    setEdges((prev) => prev.filter((e) => {
      const { nodeId: fromId } = parseEdgeRef(e.from);
      const { nodeId: toId } = parseEdgeRef(e.to);
      return fromId !== deleteModal.nodeId && toId !== deleteModal.nodeId;
    }));
    if (briefId && isLive) {
      phase6Api.deleteNode(briefId, deleteModal.nodeId, true).catch(() => {});
    }
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setDeleteModal(null);
  }, [deleteModal, briefId, isLive]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModal(null);
    setDeleteSleep(true); // put delete button to sleep for 10s
  }, []);

  /* ─── reset ─── */
  const handleReset = useCallback(() => {
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    setSelectedNodeId(null);
  }, []);

  /* ─── export JSON ─── */
  const handleExportJSON = useCallback(() => {
    const exportData = {
      phase: 6,
      metadata: META_DATA,
      nodes,
      edges,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phase6-node-graph.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  /* ─── edge SVG paths ─── */
  const edgePaths = useMemo(() => {
    return visibleEdges.map((e) => {
      const { nodeId: fromId } = parseEdgeRef(e.from);
      const { nodeId: toId } = parseEdgeRef(e.to);
      const fromNode = visibleNodes.find((n) => n.id === fromId);
      const toNode = visibleNodes.find((n) => n.id === toId);
      if (!fromNode || !toNode) return null;
      const x1 = fromNode.position.x + NODE_W;
      const y1 = fromNode.position.y + NODE_H / 2;
      const x2 = toNode.position.x;
      const y2 = toNode.position.y + NODE_H / 2;
      return {
        id: e.id,
        d: edgePath(x1, y1, x2, y2),
        color: getNodeType(fromNode.type)?.color || '#64748B',
      };
    }).filter(Boolean);
  }, [visibleEdges, visibleNodes]);

  /* ═══════════════════════════════════════════════════════════════ */
  /*  RENDER                                                          */
  /* ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-[100dvh] bg-bg-primary flex flex-col">
      {/* ── Top Bar ── */}
      <div className="h-topbar bg-bg-secondary border-b border-border-subtle flex items-center px-4 gap-3 shrink-0 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="w-px h-5 bg-border-subtle mx-1" />
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: ACCENT }}
        >
          PHASE 6
        </span>
        <h1 className="text-sm font-semibold text-text-primary">AI Node Editor</h1>
        <span className="text-xs text-text-tertiary hidden sm:inline">
          {META_DATA.title}
        </span>
        {(graphLoading || briefLoading) && (
          <Loader2 size={14} className="text-text-tertiary animate-spin" />
        )}
        {graphError && (
          <span className="text-xs text-warning hidden md:inline truncate max-w-xs" title={graphError}>
            {graphError}
          </span>
        )}
        {briefError && (
          <button onClick={retryBrief} className="text-xs text-error underline">
            {briefError} — Retry
          </button>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSummary((s) => !s)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
              showSummary
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-bg-tertiary text-text-secondary border-border-subtle hover:text-text-primary'
            )}
          >
            <FileJson size={12} />
            Summary
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-bg-tertiary text-text-secondary border border-border-subtle hover:text-text-primary transition-all"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border"
            style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, borderColor: `${ACCENT}30` }}
          >
            <Download size={12} />
            Export JSON
          </button>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Node Palette (left) ── */}
        <div className="w-[180px] bg-bg-secondary border-r border-border-subtle flex flex-col shrink-0 z-10">
          <div className="px-3 py-2 border-b border-border-subtle">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <Box size={12} />
              Node Palette
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {Object.entries(groupedNodeTypes).map(([category, types]) => {
              const CatIcon = CATEGORY_ICONS[category] || Box;
              return (
                <div key={category}>
                  <div className="flex items-center gap-1.5 px-1.5 mb-1">
                    <CatIcon size={10} className="text-text-tertiary" />
                    <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                      {CATEGORY_LABELS[category]}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {types.map((nt) => {
                      const NtIcon = NODE_TYPE_ICON[nt.id] || Box;
                      return (
                        <button
                          key={nt.id}
                          onClick={() => handleAddNode(nt)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all group border border-transparent hover:border-border-subtle"
                        >
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${nt.color}20` }}
                          >
                            <span style={{ color: nt.color }}><NtIcon size={10} /></span>
                          </div>
                          <span className="truncate text-left">{nt.label}</span>
                          <Plus size={10} className="ml-auto opacity-0 group-hover:opacity-100 text-text-tertiary" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Canvas + Inspector ── */}
        <div className="flex-1 flex">
          {/* Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 overflow-hidden bg-bg-primary relative"
            onClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
          >
            {/* Scaled inner canvas */}
            <div
              style={{
                width: CANVAS_W * canvasScale,
                height: CANVAS_H * canvasScale,
                transformOrigin: 'top left',
              }}
            >
              <div
                ref={canvasInnerRef}
                className="absolute top-0 left-0"
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: 'top left',
                }}
              >
                {/* Dot grid background */}
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #9BA3B4 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
                {/* Edges SVG */}
                <svg className="absolute inset-0 pointer-events-none" style={{ width: CANVAS_W, height: CANVAS_H }}>
                  <defs>
                    {NODE_TYPES.map((nt) => (
                      <marker
                        key={nt.id}
                        id={`arrow-${nt.id.replace(/\./g, '-')}`}
                        viewBox="0 0 10 7"
                        refX="10"
                        refY="3.5"
                        markerWidth="8"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path
                          d="M 0 0 L 10 3.5 L 0 7 z"
                          fill={nt.color}
                          opacity={0.7}
                        />
                      </marker>
                    ))}
                  </defs>
                  {edgePaths.map((ep) => {
                    if (!ep) return null;
                    const isSelected = selectedEdgeId === ep.id;
                    return (
                      <g key={ep.id}>
                        <path
                          d={ep.d}
                          fill="none"
                          stroke={isSelected ? '#F59E0B' : ep.color}
                          strokeWidth={isSelected ? 3 : 2}
                          opacity={isSelected ? 1 : 0.5}
                          markerEnd={`url(#arrow-${ep.color.replace('#', '')})`}
                          className="pointer-events-auto cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEdgeId(ep.id === selectedEdgeId ? null : ep.id);
                          }}
                          style={{
                            filter: isSelected
                              ? 'drop-shadow(0 0 4px #F59E0B80)'
                              : `drop-shadow(0 0 3px ${ep.color}40)`,
                          }}
                        />
                        {/* Invisible wider hit area for easier clicking */}
                        <path
                          d={ep.d}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={12}
                          className="pointer-events-auto cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEdgeId(ep.id === selectedEdgeId ? null : ep.id);
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Nodes */}
                {visibleNodes.map((node) => {
                  const typeDef = getNodeType(node.type);
                  const color = typeDef?.color || '#64748B';
                  const isSelected = selectedNodeId === node.id;
                  const isDragging = draggingNodeId === node.id;
                  const NodeIcon = typeDef ? (NODE_TYPE_ICON[typeDef.id] || Box) : Box;

                  return (
                    <motion.div
                      key={node.id}
                      className={cn(
                        'absolute rounded-xl border cursor-pointer select-none',
                        'transition-shadow duration-150',
                        isSelected && 'ring-2',
                        isDragging && 'cursor-grabbing'
                      )}
                      style={{
                        left: node.position.x,
                        top: node.position.y,
                        width: NODE_W,
                        height: NODE_H,
                        backgroundColor: `${color}12`,
                        borderColor: isSelected ? color : `${color}30`,
                        boxShadow: isSelected
                          ? `0 0 0 1px ${color}, 0 4px 20px ${color}25`
                          : `0 2px 8px ${color}10`,
                        '--ring-color': color,
                      } as React.CSSProperties}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setSelectedEdgeId(null);
                      }}
                      initial={false}
                      animate={{
                        scale: isSelected ? 1.03 : 1,
                      }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Color strip */}
                      <div
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex items-center gap-2 h-full px-2.5 pl-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <span style={{ color }}><NodeIcon size={14} /></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-text-primary truncate leading-tight">
                            {typeDef?.label || node.type}
                          </div>
                          <div className="text-[9px] text-text-tertiary truncate leading-tight">
                            {typeDef?.tool}
                          </div>
                        </div>
                        {/* Scene badge */}
                        {node.sceneBinding !== null && (
                          <div
                            className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            S{node.sceneBinding}
                          </div>
                        )}
                        {node.sceneBinding === null && (
                          <div className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-bg-tertiary text-text-tertiary border border-border-subtle">
                            <Globe size={9} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Scene zone labels (decorative) */}
                {activeScene === 'all' &&
                  [1, 2, 3, 4, 5].map((sn) => {
                    const d = SCENE_DIALOGUES.find((s) => s.scene === sn);
                    if (!d) return null;
                    const yPositions = [0, 220, 440, 660, 880];
                    return (
                      <div
                        key={sn}
                        className="absolute left-2 text-[10px] font-bold text-text-tertiary/40 uppercase tracking-widest pointer-events-none select-none"
                        style={{ top: yPositions[sn - 1] + 4 }}
                      >
                        Scene {sn}: {d.name}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── Inspector Panel (right) ── */}
          <div className="w-[280px] bg-bg-secondary border-l border-border-subtle flex flex-col shrink-0 z-10">
            <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <Settings2 size={12} />
                Inspector
              </div>
              {/* Delete controls */}
              {selectedNodeId && selectedNode && (
                <>
                  {deleteSleep ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]" style={{ color: '#5C6370' }}>
                      <Zap size={10} />
                      Sleeping...
                    </span>
                  ) : (
                    <button
                      onClick={handleDeleteNode}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                      style={selectedNode.core ? { color: '#F59E0B' } : { color: '#EF4444' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = selectedNode.core ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      title={selectedNode.core ? 'Protected: confirmation required' : 'Delete user-added node'}
                    >
                      <Trash2 size={10} />
                      Delete
                    </button>
                  )}
                </>
              )}
              {/* Edge delete button */}
              {selectedEdgeId && (
                <button
                  onClick={() => {
                    setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
                    if (briefId && isLive) {
                      phase6Api.deleteEdge(briefId, selectedEdgeId).catch(() => {});
                    }
                    setSelectedEdgeId(null);
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                  style={{ color: '#EF4444' }}
                >
                  <Scissors size={10} />
                  Delete Edge
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {selectedNode ? (
                  <motion.div
                    key={selectedNode.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="p-3 space-y-3"
                  >
                    {/* Node header */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{
                            backgroundColor: `${getNodeType(selectedNode.type)?.color || '#64748B'}20`,
                          }}
                        >
                          {(() => {
                            const NTIcon =
                              NODE_TYPE_ICON[selectedNode.type] || Box;
                            return (
                              <span
                                style={{
                                  color:
                                    getNodeType(selectedNode.type)?.color ||
                                    '#64748B',
                                }}
                              >
                                <NTIcon size={12} />
                              </span>
                            );
                          })()}
                        </div>
                        <span className="text-sm font-semibold text-text-primary">
                          {getNodeType(selectedNode.type)?.label || selectedNode.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-tertiary font-mono">
                        {selectedNode.id}
                      </div>
                    </div>

                    {/* Scene binding */}
                    <div className="bg-bg-tertiary/50 rounded-lg p-2.5 space-y-1.5">
                      <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                        Scene Binding
                      </div>
                      <div className="text-xs text-text-secondary">
                        {selectedNode.sceneBinding === null
                          ? 'Global (shared across all scenes)'
                          : `Scene ${selectedNode.sceneBinding}: ${SCENE_DIALOGUES.find((s) => s.scene === selectedNode.sceneBinding)?.name || ''}`}
                      </div>
                    </div>

                    {/* Parameters - Editable */}
                    <div className="bg-bg-tertiary/50 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                          Parameters
                        </div>
                        <button
                          onClick={() => handleAddParam(selectedNode.id)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-bg-quaternary text-text-secondary hover:text-text-primary transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                      {Object.entries(selectedNode.parameters).length === 0 ? (
                        <div className="text-xs text-text-tertiary italic">
                          No parameters. Click + Add to add one.
                        </div>
                      ) : (
                        Object.entries(selectedNode.parameters).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-1.5">
                            <input
                              value={k}
                              onChange={(e) => handleParamKeyChange(selectedNode.id, k, e.target.value)}
                              className="w-[80px] text-[10px] font-mono bg-bg-tertiary border border-border-subtle rounded px-1.5 py-1 text-text-primary focus:border-border-medium focus:outline-none"
                            />
                            <input
                              value={v === null ? 'null' : String(v)}
                              onChange={(e) => handleParamValueChange(selectedNode.id, k, e.target.value)}
                              className="flex-1 min-w-0 text-[10px] bg-bg-tertiary border border-border-subtle rounded px-1.5 py-1 text-text-primary focus:border-border-medium focus:outline-none"
                            />
                            <button
                              onClick={() => handleRemoveParam(selectedNode.id, k)}
                              className="text-text-tertiary hover:text-error transition-colors shrink-0"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Image Upload (for visual nodes) */}
                    {(selectedNode.type === 't2i.keyframe' || selectedNode.type === 'reference.actor') && (
                      <div className="bg-bg-tertiary/50 rounded-lg p-2.5 space-y-1.5">
                        <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                          Reference Image
                        </div>
                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border-subtle bg-bg-tertiary hover:bg-bg-quaternary cursor-pointer transition-colors">
                          <Image size={14} className="text-text-secondary" />
                          <span className="text-xs text-text-secondary">
                            {nodeImages[selectedNode.id] ? 'Change Image' : 'Upload Image'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleImageUpload(selectedNode.id, e)}
                          />
                        </label>
                        {nodeImages[selectedNode.id] && (
                          <div className="mt-1">
                            <img
                              src={nodeImages[selectedNode.id]}
                              alt="Reference"
                              className="w-full h-20 object-cover rounded-lg border border-border-subtle"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prompt */}
                    {selectedNode.promptTemplate && (
                      <div className="bg-bg-tertiary/50 rounded-lg p-2.5 space-y-1.5">
                        <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                          Prompt Template
                        </div>
                        <div className="text-xs text-text-secondary font-mono leading-relaxed">
                          {selectedNode.promptTemplate}
                        </div>
                      </div>
                    )}
                    {selectedNode.renderedPrompt && (
                      <div className="bg-bg-tertiary/50 rounded-lg p-2.5 space-y-1.5">
                        <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                          Rendered Prompt
                        </div>
                        <div className="text-xs text-text-secondary leading-relaxed">
                          {selectedNode.renderedPrompt}
                        </div>
                      </div>
                    )}

                    {/* Connections */}
                    <div className="bg-bg-tertiary/50 rounded-lg p-2.5 space-y-1.5">
                      <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                        Connections
                      </div>
                      {(() => {
                        const outgoing = edges.filter((e) => {
                          const { nodeId } = parseEdgeRef(e.from);
                          return nodeId === selectedNode.id;
                        });
                        const incoming = edges.filter((e) => {
                          const { nodeId } = parseEdgeRef(e.to);
                          return nodeId === selectedNode.id;
                        });
                        return (
                          <>
                            {incoming.length > 0 && (
                              <div>
                                <div className="text-[9px] text-text-tertiary mb-1">
                                  Inputs ({incoming.length})
                                </div>
                                {incoming.map((e) => {
                                  const { nodeId, port } = parseEdgeRef(e.from);
                                  return (
                                    <div
                                      key={e.id}
                                      className="flex items-center gap-1 text-[10px] text-text-secondary"
                                    >
                                      <ArrowRight size={8} className="rotate-180 text-text-tertiary" />
                                      <span className="font-mono text-text-tertiary">
                                        {nodeId}
                                      </span>
                                      <span className="text-text-tertiary">→</span>
                                      <span className="text-[9px] text-text-tertiary">
                                        {port}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {outgoing.length > 0 && (
                              <div>
                                <div className="text-[9px] text-text-tertiary mb-1">
                                  Outputs ({outgoing.length})
                                </div>
                                {outgoing.map((e) => {
                                  const { nodeId, port } = parseEdgeRef(e.to);
                                  return (
                                    <div
                                      key={e.id}
                                      className="flex items-center gap-1 text-[10px] text-text-secondary"
                                    >
                                      <ArrowRight size={8} className="text-text-tertiary" />
                                      <span className="font-mono text-text-tertiary">
                                        {nodeId}
                                      </span>
                                      <span className="text-text-tertiary">→</span>
                                      <span className="text-[9px] text-text-tertiary">
                                        {port}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {incoming.length === 0 && outgoing.length === 0 && (
                              <div className="text-xs text-text-tertiary italic">
                                No connections
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 text-center"
                  >
                    <MousePointer size={24} className="mx-auto mb-2 text-text-tertiary" />
                    <div className="text-xs text-text-tertiary">
                      Click a node to view details
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Meta summary in inspector bottom */}
            <div className="border-t border-border-subtle p-3 space-y-2">
              <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                Project
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-text-tertiary">Nodes</span>
                  <span className="text-text-primary font-mono">{nodes.length}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-text-tertiary">Edges</span>
                  <span className="text-text-primary font-mono">{edges.length}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-text-tertiary">Scenes</span>
                  <span className="text-text-primary font-mono">{META_DATA.scenes}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-text-tertiary">Score</span>
                  <span
                    className="font-bold"
                    style={{ color: ACCENT }}
                  >
                    {META_DATA.score}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scene Filter Tabs (bottom) ── */}
      <div className="shrink-0 bg-bg-secondary border-t border-border-subtle flex items-center px-3 gap-1 overflow-x-auto z-20">
        <button
          onClick={() => setActiveScene('all')}
          className={cn(
            'px-3 py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap',
            activeScene === 'all'
              ? 'text-text-primary border-amber-500'
              : 'text-text-tertiary border-transparent hover:text-text-secondary'
          )}
        >
          <span className="flex items-center gap-1.5">
            <Layers size={12} />
            All
          </span>
        </button>
        {SCENE_DIALOGUES.map((sd) => (
          <button
            key={sd.scene}
            onClick={() => setActiveScene(sd.scene)}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap',
              activeScene === sd.scene
                ? 'text-text-primary border-amber-500'
                : 'text-text-tertiary border-transparent hover:text-text-secondary'
            )}
          >
            <span className="flex items-center gap-1.5">
              <Film size={12} />
              Scene {sd.scene}: {sd.name}
            </span>
          </button>
        ))}
      </div>

      {/* ── Summary Modal ── */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowSummary(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-bg-secondary border border-border-subtle rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span style={{ color: ACCENT }}><FileJson size={14} /></span>
                  Graph Summary
                </h3>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                {/* Meta */}
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                    Metadata
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(META_DATA).map(([k, v]) => (
                      <div
                        key={k}
                        className="bg-bg-tertiary/50 rounded-lg px-3 py-2"
                      >
                        <div className="text-[9px] text-text-tertiary capitalize">
                          {k.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-xs text-text-primary font-medium">
                          {String(v)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                    Graph Stats
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-bg-tertiary/50 rounded-lg px-3 py-2 text-center">
                      <div className="text-lg font-bold text-text-primary">{nodes.length}</div>
                      <div className="text-[9px] text-text-tertiary">Nodes</div>
                    </div>
                    <div className="bg-bg-tertiary/50 rounded-lg px-3 py-2 text-center">
                      <div className="text-lg font-bold text-text-primary">{edges.length}</div>
                      <div className="text-[9px] text-text-tertiary">Edges</div>
                    </div>
                    <div className="bg-bg-tertiary/50 rounded-lg px-3 py-2 text-center">
                      <div className="text-lg font-bold text-text-primary">
                        {new Set(nodes.map((n) => n.type)).size}
                      </div>
                      <div className="text-[9px] text-text-tertiary">Types</div>
                    </div>
                  </div>
                </div>

                {/* Scene breakdown */}
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                    Scene Breakdown
                  </div>
                  <div className="space-y-1">
                    {SCENE_DIALOGUES.map((sd) => {
                      const sceneNodes = nodes.filter(
                        (n) => n.sceneBinding === sd.scene
                      );
                      return (
                        <div
                          key={sd.scene}
                          className="flex items-center gap-2 bg-bg-tertiary/50 rounded-lg px-3 py-2"
                        >
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{
                              backgroundColor:
                                ['#8B5CF6', '#06D6A0', '#F59E0B', '#0EA5E9', '#EF4444'][sd.scene - 1],
                            }}
                          >
                            {sd.scene}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-text-primary truncate">
                              {sd.name}
                            </div>
                            <div className="text-[9px] text-text-tertiary truncate">
                              {sd.text}
                            </div>
                          </div>
                          <div className="text-xs text-text-tertiary font-mono shrink-0">
                            {sceneNodes.length} nodes
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2 bg-bg-tertiary/50 rounded-lg px-3 py-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-text-tertiary shrink-0 border border-border-subtle">
                        <Globe size={9} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-text-primary">
                          Global Nodes
                        </div>
                        <div className="text-[9px] text-text-tertiary">
                          Shared across all scenes
                        </div>
                      </div>
                      <div className="text-xs text-text-tertiary font-mono shrink-0">
                        {nodes.filter((n) => n.sceneBinding === null).length} nodes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node type distribution */}
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                    Node Type Distribution
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(
                      nodes.reduce<Record<string, number>>((acc, n) => {
                        const t = getNodeType(n.type);
                        const cat = t?.category || 'unknown';
                        acc[cat] = (acc[cat] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([cat, count]) => (
                      <div
                        key={cat}
                        className="flex items-center gap-2"
                      >
                        <div className="text-[10px] text-text-tertiary w-20 shrink-0">
                          {CATEGORY_LABELS[cat] || cat}
                        </div>
                        <div className="flex-1 h-3 bg-bg-tertiary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(count / nodes.length) * 100}%`,
                            }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor:
                                cat === 'input'
                                  ? '#F59E0B'
                                  : cat === 'generate'
                                  ? '#8B5CF6'
                                  : cat === 'audio'
                                  ? '#EC4899'
                                  : cat === 'composite'
                                  ? '#22C55E'
                                  : '#64748B',
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-text-secondary font-mono w-6 text-right">
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1E2028] border border-[#3A4050] rounded-xl p-6 w-[360px] shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
                <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">Delete Core Node?</h3>
                <p className="text-xs text-text-tertiary">This node is part of the approved screenplay</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-5">
              Are you sure you want to delete <strong className="text-text-primary">{deleteModal.nodeName}</strong>? This node was generated from the validated script in earlier phases.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#EF4444' }}
              >
                <Trash2 size={14} />
                Confirm Delete
              </button>
              <button
                onClick={handleCancelDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-bg-tertiary text-text-secondary border border-border-subtle hover:text-text-primary transition-all"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
