"use client";
import Link from "next/dist/client/link";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { HiOutlineDocumentArrowUp } from "react-icons/hi2";
import { PiMegaphoneDuotone } from "react-icons/pi";
import { RiLockPasswordLine } from "react-icons/ri";
import { TiDocumentText } from "react-icons/ti";
import { SlUser } from "react-icons/sl";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { CiLogout } from "react-icons/ci";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { Logout } from "../../../auth/logout";

const TeacherLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto close sidebar on mobile when window resizes
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && sidebarOpen) {
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
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <button
            id="menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-black/75 text-white rounded-sm shadow-sm hover:bg-primary/90 transition-colors"
          >
            {sidebarOpen ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
          </button>
        </div>
      )}

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`
          fixed left-1 top-1 pb-4 rounded-lg h-[calc(100vh-0.5rem)] 
          flex flex-col bg-primary border-r border-gray-900 px-4 py-10
          transition-transform duration-300 ease-in-out z-50
          ${isMobile ? "w-60" : "lg:w-72 md:w-60"}
          ${
            isMobile
              ? sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
              : "translate-x-0"
          }
        `}
      >
        <div className="flex items-center justify-center shrink-0 border-b border-white/10 p-4">
          <h1
            className={`text-lg font-semibold text-white flex gap-4 ${
              isMobile ? "text-base" : ""
            }`}
          >
            <SlUser size={22} />
            <span className={isMobile ? "text-sm" : ""}>Staff Dashboard</span>
          </h1>
        </div>

        <nav className="flex-1 mt-4 py-4 space-y-2">
          <NavLink
            href="/dashboard"
            icon={<MdOutlineSpaceDashboard size={20} />}
            text="Dashboard"
            isActive={pathname === "/dashboard"}
            isMobile={isMobile}
            onClick={() => isMobile && setSidebarOpen(false)}
          />
          <NavLink
            href="/announcement"
            icon={<PiMegaphoneDuotone size={20} />}
            text="Announcements"
            isActive={pathname === "/announcement"}
            isMobile={isMobile}
            onClick={() => isMobile && setSidebarOpen(false)}
          />
          <NavLink
            href="/results"
            icon={<HiOutlineDocumentArrowUp size={20} />}
            text="Result Upload"
            isActive={pathname === "/results"}
            isMobile={isMobile}
            onClick={() => isMobile && setSidebarOpen(false)}
          />
          <NavLink
            href="/attendance"
            icon={<TiDocumentText size={20} />}
            text="Attendance"
            isActive={pathname === "/attendance"}
            isMobile={isMobile}
            onClick={() => isMobile && setSidebarOpen(false)}
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
        ${isMobile ? "ml-0" : "lg:ml-[300px] md:ml-[230px]"}
        ${isMobile ? "pt-16" : "pt-2"}
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
