import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/lib/user-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ContractGuard - AI合同审查与风险管理系统",
  description: "面向企业法务部门的智能合同审查与协作平台，通过AI技术实现合同风险自动识别、审批流程自动化、知识库沉淀",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <UserProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </UserProvider>
      </body>
    </html>
  );
}
