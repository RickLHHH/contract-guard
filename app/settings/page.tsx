"use client";

import { useRouter } from "next/navigation";
import {
  Settings,
  Search,
  Shield,
  Bell,
  ArrowLeft,
  User,
  Lock,
  Database,
  FileText,
  Bot,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="flex h-16 items-center px-6 gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ContractGuard</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>法务</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            系统设置
          </h1>
          <p className="text-muted-foreground">配置系统参数和个性化选项</p>
        </div>

        <div className="space-y-6">
          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI 审查设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">启用 AI 分析</p>
                  <p className="text-sm text-muted-foreground">
                    上传合同后自动进行 AI 风险分析
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">分析深度</p>
                  <p className="text-sm text-muted-foreground">
                    选择 AI 分析的详细程度
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    标准
                  </Button>
                  <Button size="sm">详细</Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">当前 AI 提供商</p>
                  <p className="text-sm text-muted-foreground">
                    通过环境变量配置 (Qwen / DeepSeek / Mock)
                  </p>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  Mock 模式
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5" />
                通知设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">合同待审提醒</p>
                  <p className="text-sm text-muted-foreground">
                    有新合同需要审查时接收通知
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">审批完成通知</p>
                  <p className="text-sm text-muted-foreground">
                    合同审批完成后通知提交人
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">高风险合同预警</p>
                  <p className="text-sm text-muted-foreground">
                    检测到高风险合同时立即通知
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                安全设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">批注可见性默认设置</p>
                  <p className="text-sm text-muted-foreground">
                    新批注默认对业务人员可见
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">审批流程强制确认</p>
                  <p className="text-sm text-muted-foreground">
                    重要审批需要二次确认
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Data Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                数据管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">自动归档</p>
                  <p className="text-sm text-muted-foreground">
                    已审批合同自动归档到知识库
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">数据保留期限</p>
                  <p className="text-sm text-muted-foreground">
                    合同数据保留时间
                  </p>
                </div>
                <span className="text-sm">永久</span>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">关于系统</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">版本：</span> v1.0.0
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">构建时间：</span>{" "}
                {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                ContractGuard - AI合同审查与风险管理系统
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
