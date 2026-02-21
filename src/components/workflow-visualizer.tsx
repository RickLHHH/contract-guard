"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowNodeData {
  label: string;
  type: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  assignee?: string;
  role?: string;
  sla?: number;
}

const nodeTypes: NodeTypes = {
  aiReview: ({ data }: { data: WorkflowNodeData }) => (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 min-w-[140px] text-center",
        data.status === "completed"
          ? "bg-green-50 border-green-500"
          : data.status === "in_progress"
          ? "bg-blue-50 border-blue-500 animate-pulse"
          : "bg-gray-50 border-gray-300"
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <Bot className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      <Badge
        variant={data.status === "completed" ? "default" : "outline"}
        className="text-xs"
      >
        {data.status === "completed"
          ? "已完成"
          : data.status === "in_progress"
          ? "进行中"
          : "待处理"}
      </Badge>
    </div>
  ),
  manualReview: ({ data }: { data: WorkflowNodeData }) => (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 min-w-[140px] text-center",
        data.status === "completed"
          ? "bg-green-50 border-green-500"
          : data.status === "in_progress"
          ? "bg-yellow-50 border-yellow-500 animate-pulse"
          : "bg-gray-50 border-gray-300"
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <User className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      {data.assignee && (
        <p className="text-xs text-muted-foreground">{data.assignee}</p>
      )}
      <Badge
        variant={data.status === "completed" ? "default" : "outline"}
        className="text-xs mt-1"
      >
        {data.status === "completed"
          ? "已完成"
          : data.status === "in_progress"
          ? "进行中"
          : "待处理"}
      </Badge>
    </div>
  ),
  approval: ({ data }: { data: WorkflowNodeData }) => (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 min-w-[140px] text-center",
        data.status === "completed"
          ? "bg-green-50 border-green-500"
          : data.status === "in_progress"
          ? "bg-purple-50 border-purple-500 animate-pulse"
          : "bg-gray-50 border-gray-300"
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <CheckCircle className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      {data.role && (
        <p className="text-xs text-muted-foreground">{data.role}</p>
      )}
      <Badge
        variant={data.status === "completed" ? "default" : "outline"}
        className="text-xs mt-1"
      >
        {data.status === "completed"
          ? "已审批"
          : data.status === "in_progress"
          ? "审批中"
          : "待审批"}
      </Badge>
    </div>
  ),
  condition: ({ data }: { data: WorkflowNodeData }) => (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 min-w-[140px] text-center transform rotate-0",
        data.status === "completed"
          ? "bg-green-50 border-green-500"
          : "bg-gray-50 border-gray-300"
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <AlertCircle className="w-4 h-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">条件判断</p>
    </div>
  ),
};

interface WorkflowVisualizerProps {
  workflow?: {
    nodes: Array<{
      id: string;
      type: string;
      status: string;
      assignedTo?: string;
    }>;
  };
  contractAmount?: number;
}

export function WorkflowVisualizer({
  workflow,
  contractAmount,
}: WorkflowVisualizerProps) {
  const isHighValue = (contractAmount || 0) > 1000000;

  const initialNodes: Node<WorkflowNodeData>[] = [
    {
      id: "start",
      type: "default",
      position: { x: 100, y: 100 },
      data: { label: "开始", type: "start", status: "completed" },
    },
    {
      id: "ai_review",
      type: "aiReview",
      position: { x: 100, y: 200 },
      data: {
        label: "AI 审查",
        type: "ai_review",
        status: workflow?.nodes?.find((n) => n.nodeId === "ai_review")?.status
          ?.toLowerCase() as WorkflowNodeData["status"] || "completed",
      },
    },
    {
      id: "legal_review",
      type: "manualReview",
      position: { x: 100, y: 320 },
      data: {
        label: "法务审查",
        type: "legal_review",
        status: workflow?.nodes?.find((n) => n.nodeId === "legal_review")?.status
          ?.toLowerCase() as WorkflowNodeData["status"] || "in_progress",
        assignee: "李法务",
        role: "法务专员",
        sla: 24,
      },
    },
    ...(isHighValue
      ? [
          {
            id: "finance_review",
            type: "manualReview",
            position: { x: 100, y: 440 },
            data: {
              label: "财务审核",
              type: "finance_review",
              status: workflow?.nodes?.find((n) => n.nodeId === "finance_review")?.status
                ?.toLowerCase() as WorkflowNodeData["status"] || "pending",
              assignee: "赵财务",
              role: "财务专员",
              sla: 12,
            },
          },
        ]
      : []),
    {
      id: "legal_director",
      type: "approval",
      position: { x: 100, y: isHighValue ? 560 : 440 },
      data: {
        label: "法务总监",
        type: "management_approval",
        status: workflow?.nodes?.find((n) => n.nodeId === "legal_director")?.status
          ?.toLowerCase() as WorkflowNodeData["status"] || "pending",
        assignee: "王总监",
        role: "法务总监",
      },
    },
    ...(isHighValue
      ? [
          {
            id: "ceo_approval",
            type: "approval",
            position: { x: 100, y: 680 },
            data: {
              label: "CEO 审批",
              type: "management_approval",
              status: workflow?.nodes?.find((n) => n.nodeId === "ceo_approval")?.status
                ?.toLowerCase() as WorkflowNodeData["status"] || "pending",
              assignee: "刘总",
              role: "CEO",
            },
          },
        ]
      : []),
    {
      id: "end",
      type: "default",
      position: { x: 100, y: isHighValue ? 800 : 560 },
      data: { label: "完成", type: "end", status: "pending" },
    },
  ];

  const initialEdges: Edge[] = [
    { id: "e1-2", source: "start", target: "ai_review", animated: true },
    { id: "e2-3", source: "ai_review", target: "legal_review", animated: true },
    ...(isHighValue
      ? [
          { id: "e3-4", source: "legal_review", target: "finance_review" },
          {
            id: "e4-5",
            source: "finance_review",
            target: "legal_director",
          },
          {
            id: "e5-6",
            source: "legal_director",
            target: "ceo_approval",
          },
          {
            id: "e6-7",
            source: "ceo_approval",
            target: "end",
          },
        ]
      : [
          {
            id: "e3-4",
            source: "legal_review",
            target: "legal_director",
          },
          {
            id: "e4-5",
            source: "legal_director",
            target: "end",
          },
        ]),
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>审批流程</span>
          {isHighValue && (
            <Badge variant="outline">高价值合同审批流</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </CardContent>
    </Card>
  );
}
