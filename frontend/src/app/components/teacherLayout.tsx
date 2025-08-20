"use client";
import Link from "next/dist/client/link";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { HiOutlineDocumentArrowUp } from "react-icons/hi2";
import { PiMegaphoneDuotone } from "react-icons/pi";
import { RiLockPasswordLine } from "react-icons/ri";
import { TiDocumentText } from "react-icons/ti";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { CiLogout } from "react-icons/ci";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { Logout } from "../../../auth/logout";

const TeacherLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when viewport becomes desktop-sized
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close sidebar when clicking outside on small screens
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!sidebarOpen) return;
      // only auto-close on small screens
      if (window.innerWidth >= 768) return;

      const sidebar = document.getElementById("sidebar");
      const menuButton = document.getElementById("menu-button");

      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button (hidden on md+) */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          id="menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-black/75 text-white rounded-sm shadow-sm hover:bg-primary/90 transition-colors"
        >
          {sidebarOpen ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
        </button>
      </div>

      {/* Overlay for mobile (only visible when sidebar is open) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`
          fixed left-1 top-1 pb-4 h-[calc(100vh-0.5rem)] 
          flex flex-col bg-primary border-r border-gray-900 px-4 py-10
          transition-transform duration-300 ease-in-out z-50
      w-60 md:w-60 lg:w-80
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        <div className="flex items-center justify-center shrink-0 border-b border-white/10 p-4">
          <h1
            className={`text-lg font-semibold text-white flex gap-4 md:text-lg sm:text-base`}
          >
            {/* <SlUser size={22} /> */}
            <span className="text-sm md:text-base">Staff Dashboard</span>
          </h1>
        </div>

        <nav className="flex-1 mt-4 py-4 space-y-6">
          <NavLink
            href="/dashboard"
            icon={<MdOutlineSpaceDashboard size={20} />}
            text="Dashboard"
            isActive={pathname === "/dashboard"}
            onClick={() => setSidebarOpen(false)}
          />
          <NavLink
            href="/announcement"
            icon={<PiMegaphoneDuotone size={20} />}
            text="Announcements"
            isActive={pathname === "/announcement"}
            onClick={() => setSidebarOpen(false)}
          />
          <NavLink
            href="/results"
            icon={<HiOutlineDocumentArrowUp size={20} />}
            text="Result Upload"
            isActive={pathname === "/results"}
            onClick={() => setSidebarOpen(false)}
          />
          <NavLink
            href="/attendance"
            icon={<TiDocumentText size={20} />}
            text="Attendance"
            isActive={pathname === "/attendance"}
            onClick={() => setSidebarOpen(false)}
          />

          <div className="shrink-0 border-t border-white/10 md:pt-60 pt-52">
            <div>
              <button
                onClick={() => Logout()}
                className={`
              flex 
              gap-3 px-4
              py-3 text-white/70 hover:text-white
              rounded-lg hover:bg-white/10
              transition-colors w-full cursor-pointer
            `}
              >
                <CiLogout size={20} />
                <span>Logout</span>
              </button>
            </div>

            <div>
              <Link
                href="/settings"
                className={`
                  flex 
                  gap-3 px-4
                  py-3 text-white/70 hover:text-white
                  rounded-lg hover:bg-white/10
                  transition-colors w-full
                `}
              >
                <RiLockPasswordLine size={20} />
                <span>Change Password</span>
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      <main
        className={`
        flex-1 py-2 px-4 transition-all duration-300
        ml-0 md:ml-[230px] lg:ml-[300px]
        pt-16 md:pt-2
      `}
      >
        <div className="">{children}</div>
      </main>
    </div>
  );
};

export default TeacherLayout;

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  text: string;
  shortText?: string;
  isActive?: boolean;
  sidebarOpen?: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}

function NavLink({
  href,
  icon,
  text,
  isActive,
  isMobile,
  onClick,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center        
        py-3
        ${
          isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
        }
        rounded-lg hover:bg-white/10 gap-4
        transition-colors px-2
        w-full
        ${isMobile ? "text-sm" : ""}
      `}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
}
