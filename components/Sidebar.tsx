"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/equipment", label: "Equipment" },
  { href: "/traps", label: "Traps" },
  { href: "/settings", label: "Settings" },
  { href: "/reporting", label: "Reporting" },
];

export function Sidebar({ issueCount }: { issueCount: number }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">
          <span className="dot" />
          <span className="title">SteamTrap</span>
        </div>
        <div className="sub">PM Tracker</div>
      </div>
      <nav className="nav">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
            <span>{l.label}</span>
            {l.label === "Traps" && issueCount > 0 ? (
              <span className="count">{issueCount}</span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="foot">
        Industrial PM
        <br />
        Steam Trap Survey
      </div>
    </aside>
  );
}
