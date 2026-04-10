"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow, addEdge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Connection, Node, Edge,
  Handle, Position, type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

type Automation = {
  id: number; name: string; description: string | null; status: string;
  trigger: string; nodes: Node[]; edges: Edge[];
  [key: string]: unknown;
};

const nodeColors: Record<string, { bg: string; border: string; icon: string }> = {
  trigger: { bg: "bg-brand-50 dark:bg-brand-500/10", border: "border-brand-300 dark:border-brand-500/30", icon: "text-brand-500" },
  filter: { bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-300 dark:border-purple-500/30", icon: "text-purple-500" },
  delay: { bg: "bg-warning-50 dark:bg-warning-500/10", border: "border-warning-300 dark:border-warning-500/30", icon: "text-warning-500" },
  send_whatsapp: { bg: "bg-success-50 dark:bg-success-500/10", border: "border-success-300 dark:border-success-500/30", icon: "text-success-500" },
  send_email: { bg: "bg-error-50 dark:bg-error-500/10", border: "border-error-300 dark:border-error-500/30", icon: "text-error-500" },
  update_status: { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-300 dark:border-blue-500/30", icon: "text-blue-500" },
  add_to_crm: { bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-300 dark:border-orange-500/30", icon: "text-orange-500" },
  condition: { bg: "bg-yellow-50 dark:bg-yellow-500/10", border: "border-yellow-300 dark:border-yellow-500/30", icon: "text-yellow-600" },
};

const nodeLabels: Record<string, string> = {
  trigger: "Gatilho", filter: "Filtrar", delay: "Aguardar", send_whatsapp: "WhatsApp",
  send_email: "Email", update_status: "Atualizar Status", add_to_crm: "Adicionar ao CRM", condition: "Condição",
};

const nodeIcons: Record<string, React.ReactNode> = {
  trigger: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
  filter: <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />,
  delay: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  send_whatsapp: <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07" />,
  send_email: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  update_status: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
  add_to_crm: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  condition: <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

// Custom node component
function FlowNode({ data, type }: { data: Record<string, string>; type: string }) {
  const colors = nodeColors[type] || nodeColors.trigger;
  const isTrigger = type === "trigger";
  const isFill = type === "send_whatsapp";

  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} px-4 py-3 min-w-[180px] shadow-sm`}>
      {!isTrigger && <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white dark:!border-gray-900" />}
      <div className="flex items-center gap-2 mb-1">
        <svg className={`w-4 h-4 ${colors.icon}`} fill={isFill ? "currentColor" : "none"} stroke={isFill ? "none" : "currentColor"} strokeWidth={1.8} viewBox="0 0 24 24">
          {nodeIcons[type]}
        </svg>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{nodeLabels[type] || type}</span>
      </div>
      {data.label && <p className="text-xs text-gray-600 dark:text-gray-400">{data.label}</p>}
      {data.message && <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1 truncate max-w-[160px]">{data.message}</p>}
      {data.subject && <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">Assunto: {data.subject}</p>}
      {data.delay && <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">Aguardar: {data.delay}</p>}
      {data.newStatus && <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">→ {data.newStatus}</p>}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white dark:!border-gray-900" />
    </div>
  );
}

const customNodeTypes: NodeTypes = {
  trigger: FlowNode, filter: FlowNode, delay: FlowNode,
  send_whatsapp: FlowNode, send_email: FlowNode,
  update_status: FlowNode, add_to_crm: FlowNode, condition: FlowNode,
};

const nodeMenu = [
  { type: "filter", label: "Filtrar Leads", desc: "Por fonte, status" },
  { type: "delay", label: "Aguardar", desc: "Tempo de espera" },
  { type: "send_whatsapp", label: "Enviar WhatsApp", desc: "Mensagem via canal" },
  { type: "send_email", label: "Enviar Email", desc: "Via SMTP" },
  { type: "update_status", label: "Atualizar Status", desc: "Mudar status do lead" },
  { type: "add_to_crm", label: "Adicionar ao CRM", desc: "Criar deal no pipeline" },
  { type: "condition", label: "Condição", desc: "Se/Senão" },
];

export default function FlowEditor({ automation, onSave, onClose }: { automation: Automation; onSave: (a: Automation) => void; onClose: () => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(automation.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(automation.edges || []);
  const [name, setName] = useState(automation.name);
  const [trigger, setTrigger] = useState(automation.trigger);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#465FFF", strokeWidth: 2 } }, eds));
  }, [setEdges]);

  function addNode(type: string) {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: 250, y: (nodes.length) * 120 + 50 },
      data: { label: nodeLabels[type] || type },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowNodeMenu(false);
    setSelectedNode(newNode);
  }

  function updateNodeData(nodeId: string, data: Record<string, string>) {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    // Keep selectedNode in sync
    setSelectedNode((prev) => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev);
  }

  function deleteNode(nodeId: string) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }

  function handleSave() {
    // Update trigger node data
    setNodes((nds) => {
      const updated = nds.map((n) => n.type === "trigger" ? { ...n, data: { ...n.data, trigger } } : n);
      onSave({ ...automation, name, trigger, nodes: updated, edges });
      return updated;
    });
  }

  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:border-brand-300 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Sidebar */}
      <div className="w-72 shrink-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Voltar
            </button>
            <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition">
              Salvar
            </button>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inp + " text-base font-semibold"} />
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={inp + " mt-2"}>
            <option value="manual">Gatilho: Manual</option>
            <option value="new_lead">Gatilho: Novo Lead</option>
            <option value="new_message">Gatilho: Nova Mensagem</option>
            <option value="deal_stage_changed">Gatilho: Deal mudou de etapa</option>
          </select>
        </div>

        {/* Add nodes */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Adicionar Ação</p>
          <div className="space-y-1">
            {nodeMenu.map((item) => {
              const colors = nodeColors[item.type];
              return (
                <button key={item.type} onClick={() => addNode(item.type)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-sm transition flex items-center gap-2`}>
                  <svg className={`w-4 h-4 ${colors.icon}`} fill={item.type === "send_whatsapp" ? "currentColor" : "none"} stroke={item.type === "send_whatsapp" ? "none" : "currentColor"} strokeWidth={1.8} viewBox="0 0 24 24">
                    {nodeIcons[item.type]}
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{item.label}</p>
                    <p className="text-[10px] text-gray-400">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Node properties */}
        {selectedNode && selectedNode.type !== "trigger" && (
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Propriedades</p>
              <button onClick={() => deleteNode(selectedNode.id)} className="text-xs text-error-500 hover:text-error-600">Deletar</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Label</label>
                <input value={selectedNode.data.label || ""} onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} className={inp} />
              </div>

              {selectedNode.type === "send_whatsapp" && (
                <>
                  <div><label className="block text-[11px] text-gray-500 mb-1">ID do Canal</label>
                    <input value={selectedNode.data.channelId || ""} onChange={(e) => updateNodeData(selectedNode.id, { channelId: e.target.value })} className={inp} placeholder="ID do canal WhatsApp" /></div>
                  <div><label className="block text-[11px] text-gray-500 mb-1">Mensagem</label>
                    <textarea value={selectedNode.data.message || ""} onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })} className={inp + " resize-none"} rows={3} placeholder="Olá {nome}!" /></div>
                </>
              )}

              {selectedNode.type === "send_email" && (
                <>
                  <div><label className="block text-[11px] text-gray-500 mb-1">Assunto</label>
                    <input value={selectedNode.data.subject || ""} onChange={(e) => updateNodeData(selectedNode.id, { subject: e.target.value })} className={inp} placeholder="Assunto do email" /></div>
                  <div><label className="block text-[11px] text-gray-500 mb-1">Template HTML</label>
                    <textarea value={selectedNode.data.template || ""} onChange={(e) => updateNodeData(selectedNode.id, { template: e.target.value })} className={inp + " resize-none font-mono text-xs"} rows={5} placeholder="<h1>Olá {nome}</h1>" /></div>
                </>
              )}

              {selectedNode.type === "delay" && (
                <div><label className="block text-[11px] text-gray-500 mb-1">Tempo de espera</label>
                  <select value={selectedNode.data.delay || "1h"} onChange={(e) => updateNodeData(selectedNode.id, { delay: e.target.value })} className={inp}>
                    <option value="5m">5 minutos</option><option value="30m">30 minutos</option>
                    <option value="1h">1 hora</option><option value="6h">6 horas</option>
                    <option value="24h">24 horas</option><option value="48h">48 horas</option>
                    <option value="7d">7 dias</option>
                  </select></div>
              )}

              {selectedNode.type === "filter" && (
                <>
                  <div><label className="block text-[11px] text-gray-500 mb-1">Fonte (contém)</label>
                    <input value={selectedNode.data.source || ""} onChange={(e) => updateNodeData(selectedNode.id, { source: e.target.value })} className={inp} placeholder="wordpress, whatsapp" /></div>
                  <div><label className="block text-[11px] text-gray-500 mb-1">Status</label>
                    <select value={selectedNode.data.status || ""} onChange={(e) => updateNodeData(selectedNode.id, { status: e.target.value })} className={inp}>
                      <option value="">Todos</option><option value="new">Novo</option><option value="contacted">Contatado</option><option value="qualified">Qualificado</option>
                    </select></div>
                </>
              )}

              {selectedNode.type === "update_status" && (
                <div><label className="block text-[11px] text-gray-500 mb-1">Novo status</label>
                  <select value={selectedNode.data.newStatus || "contacted"} onChange={(e) => updateNodeData(selectedNode.id, { newStatus: e.target.value })} className={inp}>
                    <option value="new">Novo</option><option value="contacted">Contatado</option><option value="qualified">Qualificado</option><option value="converted">Convertido</option>
                  </select></div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_e, node) => setSelectedNode(node)}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={customNodeTypes}
          fitView
          defaultEdgeOptions={{ animated: true, style: { stroke: "#465FFF", strokeWidth: 2 } }}
        >
          <Background color="#E4E7EC" gap={20} />
          <Controls />
          <MiniMap nodeStrokeColor="#465FFF" nodeColor="#ecf3ff" style={{ borderRadius: 12 }} />
        </ReactFlow>
      </div>
    </div>
  );
}
