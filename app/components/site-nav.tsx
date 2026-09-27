"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/imports", label: "Imports" },
  { href: "/sales", label: "Sales" },
  { href: "/settings", label: "Settings" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return <nav className="primary-nav" aria-label="Primary navigation">
    {links.map((link) => {
      const active = link.href === "/"
        ? pathname === link.href
        : pathname.startsWith(link.href);
      return <Link
        key={link.href}
        className="nav-link"
        href={link.href}
        aria-current={active ? "page" : undefined}
      >{link.label}</Link>;
    })}
  </nav>;
}