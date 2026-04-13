import type { ReactNode } from "react";
import { SiteNav } from "./site-nav";

const defaultNavItems = [
  { href: "/", label: "总览" },
  { href: "/pnl", label: "P&L" },
  { href: "/positions", label: "持仓" },
  { href: "/trades", label: "成交" },
  { href: "/runs", label: "运行" },
  { href: "/reports", label: "报告" },
  { href: "/backtests", label: "回测" },
  { href: "/admin", label: "管理" }
];

const spectatorNavItems = [
  { href: "/", label: "总览" },
  { href: "/pnl", label: "P&L" },
  { href: "/positions", label: "持仓" },
  { href: "/trades", label: "成交" },
  { href: "/cashflow", label: "现金流" }
];

export function Shell({ children, spectatorMode = false }: { children: ReactNode; spectatorMode?: boolean }) {
  const navItems = spectatorMode ? spectatorNavItems : defaultNavItems;

  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">跳到正文</a>
      <header className="hero">
        <div className="hero-main">
          <p className="eyebrow">{spectatorMode ? "X Layer DEX 围观台" : "Autonomous X Layer DEX Agent"}</p>
          <h1>{spectatorMode ? "像看真实账户一样看一个实盘钱包，而不是看一堆生硬调试字段。" : "公开查看一个实时交易钱包的账户状态。"}</h1>
          <p className="hero-copy">
            {spectatorMode
              ? "这个页面优先给人看，不是给系统日志看。它从 X Layer DEX 公共接口拉取数据，把一个钱包整理成可读的账户视图：持仓、成交、现金流和推导后的 P&L。"
              : "这是一个面向外部的只读界面，用来查看实时钱包的持仓、成交、报告和 P&L。"}
          </p>
        </div>
        <div className="hero-rail">
          <div className="hero-chips">
            <span className="hero-chip">只读</span>
            <span className="hero-chip">5 秒轮询</span>
            <span className="hero-chip">{spectatorMode ? "地址模式" : "管理保护"}</span>
          </div>
          <dl className="hero-fact-list">
            <div>
              <dt>面向对象</dt>
              <dd>{spectatorMode ? "外部围观用户" : "内部操作人员"}</dd>
            </div>
            <div>
              <dt>数据来源</dt>
              <dd>{spectatorMode ? "X Layer DEX 公共数据" : "项目公共接口"}</dd>
            </div>
            <div>
              <dt>重点内容</dt>
              <dd>{spectatorMode ? "持仓、成交、P&L、现金流" : "运行、报告和控制台"}</dd>
            </div>
          </dl>
        </div>
      </header>

      <SiteNav items={navItems} />

      <main className="page-grid" id="main-content">{children}</main>
    </div>
  );
}
