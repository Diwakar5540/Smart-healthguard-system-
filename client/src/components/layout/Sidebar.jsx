import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShieldCheck, Activity, LogOut, ChevronLeft, ChevronRight, Menu, Droplets, Camera } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const SidebarItem = ({ to, icon: Icon, label, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200
      ${isActive 
        ? "bg-medical-500 text-white shadow-lg shadow-medical-200" 
        : "text-slate-500 hover:bg-medical-50 hover:text-medical-600"}
      ${collapsed ? "justify-center px-2" : ""}
    `}
  >
    <Icon size={20} />
    {!collapsed && <span className="font-medium">{label}</span>}
  </NavLink>
);

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  return (
    <aside className={`
      relative bg-white border-r border-slate-200 h-full flex flex-col p-4 transition-all duration-300
      ${collapsed ? "w-20" : "w-64"}
      hidden md:flex
    `}>
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-400 to-medical-600 flex items-center justify-center text-white shadow-md">
          <ShieldCheck size={24} />
        </div>
        {!collapsed && <h1 className="text-xl font-bold bg-gradient-to-r from-medical-600 to-medical-800 bg-clip-text text-transparent">HealthGuard</h1>}
      </div>

      <nav className="flex-1 space-y-2">
        <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
        <SidebarItem to="/vitamin" icon={ShieldCheck} label="Vitamin Checker" collapsed={collapsed} />
        <SidebarItem to="/disease" icon={Activity} label="Disease Detection" collapsed={collapsed} />
        <SidebarItem to="/fingerprint-lookup" icon={Droplets} label="Blood Group Lookup" collapsed={collapsed} />
      </nav>

      <button
        onClick={logout}
        className={`
          flex items-center gap-4 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-all
          ${collapsed ? "justify-center px-2" : ""}
        `}
      >
        <LogOut size={20} />
        {!collapsed && <span className="font-medium">Logout</span>}
      </button>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-medical-500 shadow-sm"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
