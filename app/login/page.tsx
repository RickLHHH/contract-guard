"use client";

import { useState } from "react";
import { Shield, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "登录失败");
      }

      console.log("[Login] 登录成功:", data);
      toast.success("登录成功！");
      setLoginSuccess(true);
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        console.log("[Login] 开始跳转到首页...");
        // 使用多种方式尝试跳转
        if (typeof window !== 'undefined') {
          window.location.replace("/");
        }
      }, 500);
    } catch (error) {
      console.error("[Login] 登录错误:", error);
      toast.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleManualRedirect = () => {
    window.location.replace("/");
  };

  // 登录成功后显示跳转按钮
  if (loginSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">登录成功！</CardTitle>
            <CardDescription>欢迎回来，{email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              如果没有自动跳转，请点击下方按钮进入系统
            </p>
            <Button onClick={handleManualRedirect} className="w-full" size="lg">
              进入系统
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">ContractGuard</CardTitle>
          <CardDescription>AI 合同审查与风险管理系统</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
            <p className="font-medium mb-2">测试账号：</p>
            <div className="space-y-1">
              <p>业务用户: business@contractguard.com / password123</p>
              <p>法务专员: legal@contractguard.com / password123</p>
              <p>法务总监: director@contractguard.com / password123</p>
              <p>管理员: admin@contractguard.com / admin123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
