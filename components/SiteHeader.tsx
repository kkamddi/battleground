"use client";

import { usePathname } from "next/navigation";

const navigation = [
  { href: "/patch-notes", label: "패치노트" },
  { href: "/weapons", label: "총기 도감" },
  { href: "/meta", label: "메타" },
  { href: "/guides", label: "가이드" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="BGI 홈">
        <strong>BGI</strong>
        <span>BATTLEGROUND<br />INFORMATION</span>
      </a>
      <nav aria-label="주요 메뉴">
        {navigation.map((item) => (
          <a className={pathname === item.href ? "active" : ""} href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <a
        className="steam-link"
        href="https://store.steampowered.com/app/578080/PUBG_BATTLEGROUNDS/"
        target="_blank"
        rel="noreferrer"
      >
        Steam PUBG ↗
      </a>
    </header>
  );
}
