// User Types
export type UserRole = 'BUSINESS_USER' | 'LEGAL_SPECIALIST' | 'LEGAL_DIRECTOR' | 'FINANCE' | 'CEO' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  createdAt: string;
}

// Contract Types
export type ContractType = 'SALES' | 'PROCUREMENT' | 'EMPLOYMENT' | 'NDA' | 'SERVICE' | 'LEASE' | 'OTHERS';
export type ContractStatus = 'DRAFT' | 'AI_REVIEWING' | 'LEGAL_REVIEW' | 'APPROVING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type RiskLevel = 'A' | 'B' | 'C' | 'D';

export interface Contract {
  id: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  amount?: number;
  counterparty: string;
  riskLevel: RiskLevel;
  originalFile: string;
  parsedText?: string;
  creatorId: string;
  creator?: User;
  versions?: ContractVersion[];
  annotations?: Annotation[];
  approvals?: Approval[];
  workflow?: WorkflowExecution;
  aiReview?: AIReview;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ContractVersion {
  id: string;
  contractId: string;
  versionNumber: number;
  fileUrl: string;
  changes?: string;
  createdBy: string;
  createdAt: string;
}

// AI Review Types
export interface AIReview {
  id: string;
  contractId: string;
  overallRisk: 'high' | 'medium' | 'low';
  riskScore: number;
  keyRisks: RiskItem[];
  missingClauses?: string[];
  thinking?: string;
  createdAt: string;
}

export interface RiskItem {
  id?: string;
  clause: string;
  location?: string;
  riskType: 'legal' | 'commercial' | 'operational';
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  suggestion: string;
  precedent?: string;
  category?: string;
  law?: string;
}

// Annotation Types
export type AnnotationType = 'AI_SUGGESTION' | 'MANUAL_COMMENT' | 'REVISION';
export type AnnotationStatus = 'OPEN' | 'RESOLVED' | 'REJECTED';
export type Visibility = 'INTERNAL' | 'EXTERNAL';

export interface Annotation {
  id: string;
  contractId: string;
  page: number;
  startOffset: number;
  endOffset: number;
  selectedText?: string;
  type: AnnotationType;
  content: string;
  status: AnnotationStatus;
  visibility: Visibility;
  authorId: string;
  author: User;
  replies: Reply[];
  createdAt: string;
  resolvedAt?: string;
}

export interface Reply {
  id: string;
  annotationId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

// Workflow Types
export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'REJECTED' | 'TIMEOUT';
export type NodeType = 'AI_REVIEW' | 'LEGAL_REVIEW' | 'FINANCE_REVIEW' | 'MANAGEMENT_APPROVAL' | 'PARALLEL_APPROVAL' | 'CONDITION';
export type NodeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type ApprovalResult = 'APPROVED' | 'REJECTED' | 'DELEGATED' | 'RETURNED';

export interface WorkflowExecution {
  id: string;
  contractId: string;
  templateId: string;
  currentNodeId: string;
  status: ExecutionStatus;
  nodes: WorkflowNode[];
  history: Approval[];
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowNode {
  id: string;
  executionId: string;
  nodeId: string;
  type: NodeType;
  status: NodeStatus;
  assignedTo?: string;
  completedBy?: string;
  result?: ApprovalResult;
  comment?: string;
  dueDate?: string;
  completedAt?: string;
}

export interface Approval {
  id: string;
  contractId: string;
  executionId: string;
  handlerId: string;
  handler: User;
  action: ApprovalResult;
  comment?: string;
  createdAt: string;
}

// Knowledge Base Types
export type DocType = 'TEMPLATE' | 'POLICY' | 'PRECEDENT' | 'CLAUSE_LIBRARY';

export interface KnowledgeDoc {
  id: string;
  title: string;
  type: DocType;
  content: string;
  vectorId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface DashboardStats {
  totalContracts: number;
  pendingReview: number;
  pendingApproval: number;
  approvedThisMonth: number;
  averageReviewTime: number;
  riskDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  recentContracts: Contract[];
}

// Contract Rules for Rule Engine
export interface ContractRule {
  id: string;
  name: string;
  pattern: RegExp;
  riskLevel: 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
  category: string;
  law?: string;
}

export interface RuleMatch {
  rule: ContractRule;
  match: RegExpMatchArray;
  index: number;
}
