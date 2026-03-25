import { Bell, User, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden">
          <Menu size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Hi, {user?.name?.split(' ')[0] || "User"}</h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
        </button>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none mb-1">{user?.name}</p>
            <p className="text-[11px] font-medium text-slate-400 leading-none">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medical-100 to-medical-200 flex items-center justify-center text-medical-600 shadow-sm border border-medical-50">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
