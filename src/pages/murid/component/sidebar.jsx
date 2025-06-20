'use client';

import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookText,
  MonitorPlay,
  FileText,
  ListChecks,
  Edit,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
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

const menuItems = [
  {
    section: "Main Menu",
    items: [
      {
        name: "Beranda",
        path: "/murid/dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      {
        name: "Kelas",
        icon: <BookText size={20} />,
        children: [
          { name: "Sesi Live", path: "/murid/sesi-live", icon: <MonitorPlay size={18} /> },
          { name: "Materi", path: "/murid/materi", icon: <FileText size={18} /> },
          { name: "Ujian", path: "/murid/ujian", icon: <ListChecks size={18} />},
          { name: "Tugas", path: "/murid/tugas", icon: <Edit size={18} /> },
          { name: "Absen", path: "/murid/absen", icon: <ClipboardCheck size={18} /> },
        ],
      },
    ],
  },
];

// --- DIUBAH: Variabel gaya disederhanakan untuk konsistensi ---
const activeClasses = "bg-orange-100 text-orange-600 font-semibold";
const hoverClasses = "hover:bg-orange-50 hover:text-orange-600";
const defaultText = "text-gray-600";
const defaultIcon = "text-gray-400";
const activeIcon = "text-orange-600";

export default function SidebarMurid() {
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
                        className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${hoverClasses} ${parentIsActive ? 'font-semibold text-orange-600' : defaultText}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`${parentIsActive ? activeIcon : defaultIcon} group-hover:text-orange-600 transition-colors duration-150`}>
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <ChevronDown size={18} className={`text-gray-400 group-hover:text-orange-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>
                      </button>
                      {isOpen && (
                        <div className="pl-6 mt-1 space-y-0.5 border-l-2 border-orange-100 ml-5 py-1">
                          {item.children.map((subItem) => (
                            <Link key={subItem.name} href={subItem.path} passHref
                              className={`group flex items-center space-x-3 w-full pl-3 pr-2 py-2 rounded-md text-sm transition-colors duration-150
                                ${ isActivePath(subItem.path) ? activeClasses : `${defaultText.replace('600', '500')} ${hoverClasses}` }`}
                            >
                              <span className={`${isActivePath(subItem.path) ? activeIcon : defaultIcon} group-hover:text-orange-600 transition-colors duration-150`}>
                                {subItem.icon}
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
                    className={`group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
                      ${ isActivePath(item.path) ? activeClasses : `${defaultText} ${hoverClasses}`}`}
                  >
                    <span className={`${isActivePath(item.path) ? activeIcon : defaultIcon} group-hover:text-orange-600 transition-colors duration-150`}>
                      {item.icon}
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