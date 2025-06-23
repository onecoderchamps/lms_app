'use client';

import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  BookCopy,
  BarChart3,
  Settings,
} from 'lucide-react';

const SansLogo = () => (
  <div className="flex flex-col items-center justify-center py-4">
    <img
      src="/logo.png" // Menggunakan logo standar
      onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/150x50/f97316/ffffff?text=CoderChamps' }}
      alt="CoderChamps Logo"
      className="h-12 w-auto"
    />
  </div>
);

// --- DIUBAH: Menu Laporan & Analitik dihapus ---
const menuItems = [
    {
      section: "Admin Menu",
      items: [
        {
            name: "Dasboard",
            path: "/admin/dashboard",
            icon: <LayoutDashboard size={20} />,
        },
        { 
            name: "Manajemen Pengguna", 
            path: "/admin/manajemenpengguna", 
            icon: <Users size={20} /> 
        },
        {
            name: "Manajemen Kelas",
            path: "/admin/manajemenkelas",
            icon: <BookCopy size={20} />,
        },
        {
            name: "Pengaturan Sistem",
            path: "/admin/pengaturansistem",
            icon: <Settings size={20} />,
        },
      ]
    }
];

const activeBg = "bg-orange-100";
const activeTextColor = "text-orange-600";
const activeFontWeight = "font-semibold";
const hoverBg = "hover:bg-orange-50";
const hoverTextColor = "hover:text-orange-600";
const defaultTextColor = "text-gray-600";
const defaultIconColor = "text-gray-400";
const activeIconColor = "text-orange-600";

export default function SidebarAdmin() {
  const router = useRouter();
  const isActivePath = (path) => router.pathname.startsWith(path);

  return (
    <aside className="w-64 h-screen bg-white shadow-xl fixed top-0 left-0 overflow-y-auto flex flex-col font-sans">
      <div className="px-2 border-b border-gray-100">
        <SansLogo />
      </div>
      
      <nav className="flex-1 flex flex-col space-y-1 p-3">
        {menuItems.map((section) => (
          <div key={section.section}>
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.section}
            </div>
            <div className="flex flex-col space-y-0.5">
              {section.items.map((item) => (
                <Link key={item.name} href={item.path} passHref
                  className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
                    ${ isActivePath(item.path)
                        ? `${activeBg} ${activeTextColor} ${activeFontWeight}`
                        : `${defaultTextColor} ${hoverBg} ${hoverTextColor}`
                    }`}
                >
                  <span className={`${isActivePath(item.path) ? activeIconColor : defaultIconColor} group-hover:text-orange-600 transition-colors duration-150`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
