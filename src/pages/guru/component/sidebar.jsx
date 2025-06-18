// src/pages/guru/layouts/Sidebar.jsx (atau path yang sesuai)
'use client';

import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  BookText,
  MonitorPlay,
  FileText,
  ListChecks,
  Edit,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  BookCheck, // Diubah dari BookCheckIcon agar konsisten
  FilePen,   // --- BARU: Ikon untuk nilai ujian ---
} from 'lucide-react';

const SansLogo = () => (
  <div className="flex flex-col items-center justify-center py-4">
    <img
      src="/logo.png" // Pastikan path logo benar
      alt="CoderChamps Logo"
      className="h-12 w-auto"
    />
  </div>
);

// --- DIUBAH: Menambahkan menu "Beri Nilai Ujian" ---
const menuItems = [
  {
    section: "Main Menu",
    items: [
      {
        name: "Beranda",
        path: "/guru/dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      { name: "Member", 
        path: "/guru/member", 
        icon: <Users size={20} /> 
      },
      {
        name: "Kelas",
        icon: <BookText size={20} />,
        children: [
          { name: "Sesi Live", path: "/guru/sesi-live", icon: <MonitorPlay size={18} /> },
          { name: "Materi", path: "/guru/materi", icon: <FileText size={18} /> },
          { name: "Ujian", path: "/guru/ujian", icon: <ListChecks size={18} />},
          { name: "Tugas", path: "/guru/tugas", icon: <Edit size={18} /> },
          { name: "Beri Nilai Tugas", path: "/guru/berikan-nilai", icon: <BookCheck size={18} /> },
          // --- BARU: Menu untuk nilai ujian ditambahkan di sini ---
          { name: "Beri Nilai Ujian", path: "/guru/nilai-ujian", icon: <FilePen size={18} /> },
          { name: "Absen", path: "/guru/absen", icon: <ClipboardCheck size={18} /> },
        ],
      },
    ],
  },
];

// --- DIUBAH: Penyempurnaan variabel gaya untuk tampilan lebih modern ---
const activeBg = "bg-orange-100";
const activeTextColor = "text-orange-600";
const activeFontWeight = "font-semibold";
const hoverBg = "hover:bg-orange-50";
const hoverTextColor = "hover:text-orange-600";
const defaultTextColor = "text-gray-600";
const defaultIconColor = "text-gray-400";
const activeIconColor = "text-orange-600";

export default function Sidebar() {
  const [openMenus, setOpenMenus] = useState({});
  const router = useRouter();

  const toggleMenu = (name) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isActivePath = (path) => router.pathname === path;
  const isChildActive = (children) => children.some((child) => isActivePath(child.path));

  useEffect(() => {
    const initialOpenState = {};
    menuItems.forEach(section => {
      section.items.forEach(item => {
        if (item.children && isChildActive(item.children)) {
          initialOpenState[item.name] = true;
        }
      });
    });
    setOpenMenus(prevOpenMenus => ({...prevOpenMenus, ...initialOpenState}));
  }, [router.pathname]);

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
              {section.items.map((item) => {
                if (item.children) {
                  const isOpen = !!openMenus[item.name];
                  const parentIsActive = isChildActive(item.children);
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
                          ${parentIsActive ? `${activeFontWeight} ${defaultTextColor}` : `${defaultTextColor} ${hoverBg} ${hoverTextColor}`}
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`${parentIsActive ? activeIconColor : defaultIconColor} group-hover:text-orange-600 transition-colors duration-150`}>
                            {item.icon || <span className="w-5 h-5"></span>}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        {isOpen ? <ChevronUp size={18} className="text-gray-500 group-hover:text-orange-600 transition-colors duration-150"/> : <ChevronDown size={18} className="text-gray-500 group-hover:text-orange-600 transition-colors duration-150"/>}
                      </button>
                      {isOpen && (
                        <div className="pl-6 mt-1 space-y-0.5 border-l-2 border-orange-100 ml-5 py-1">
                          {item.children.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.path}
                              passHref
                              className={`group flex items-center space-x-3 w-full pl-3 pr-2 py-2 rounded-md text-sm 
                                ${ isActivePath(subItem.path)
                                    ? `${activeBg} ${activeTextColor} ${activeFontWeight}`
                                    : `${defaultTextColor.replace('600', '500')} ${hoverBg} ${hoverTextColor}`
                                } transition-colors duration-150`}
                            >
                              <span className={`${isActivePath(subItem.path) ? activeIconColor : defaultIconColor.replace('400', '400')} group-hover:text-orange-600 transition-colors duration-150`}>
                                {subItem.icon || <span className="w-[18px] h-[18px]"></span>}
                              </span>
                              <span>{subItem.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link key={item.name} href={item.path} passHref
                    className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm
                      ${ isActivePath(item.path)
                          ? `${activeBg} ${activeTextColor} ${activeFontWeight}`
                          : `${defaultTextColor} ${hoverBg} ${hoverTextColor}`
                      } transition-colors duration-150`}
                  >
                    <span className={`${isActivePath(item.path) ? activeIconColor : defaultIconColor} group-hover:text-orange-600 transition-colors duration-150`}>
                      {item.icon || <span className="w-5 h-5"></span>}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}