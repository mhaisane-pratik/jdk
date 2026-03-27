import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../contexts/ChatContext";
import { Users, Activity, Settings, ToggleLeft, ToggleRight, ArrowLeft, ShieldAlert, Search, UserCheck, UserX, Shield } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL as string;

interface AppConfig {
  id: string;
  app_name: string;
  api_key: string;
  allow_group_creation: boolean;
  created_at?: string;
  app_logo?: string;
  allow_chat_creation?: boolean;
  allow_media_sharing?: boolean;
  max_group_size?: number;
  max_message_length?: number;
}

interface AdminStats {
  activeUsers: number;
  totalGroups?: number;
  onlineUsersList: any[];
  adminUsersList: any[];
  applications: AppConfig[];
  setupRequired?: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useChat();
  
  const isSuperAdmin = currentUser?.username === 'admin';
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingApp, setTogglingApp] = useState<string | null>(null);

  // User Search State
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  // User Editing State
  const [editAdminStatus, setEditAdminStatus] = useState(false);
  const [editGroupAccess, setEditGroupAccess] = useState(false);
  const [editPassword, setEditPassword] = useState("");

  // App Editing State
  const [editingApp, setEditingApp] = useState<AppConfig | null>(null);
  const [appForm, setAppForm] = useState<AppConfig | null>(null);

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<"metrics" | "directories">("metrics");
  const [groupsList, setGroupsList] = useState<any[]>([]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/groups`);
      if (res.ok) setGroupsList(await res.json());
    } catch(err) {}
  };

  useEffect(() => {
    if (activeTab === "directories") fetchGroups();
  }, [activeTab]);

  useEffect(() => {
    // Force Light theme exclusively for Admin Dashboard to ensure crisp visibility
    const wasDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");
    
    if (searchResult) {
      setEditAdminStatus(!!searchResult.is_admin);
      setEditGroupAccess(!!searchResult.can_create_group);
      setEditPassword(searchResult.admin_password || "");
    }

    return () => {
      // Restore previously loaded theme when unmounting this view
      if (wasDark) document.documentElement.classList.add("dark");
    };
  }, [searchResult]);

  // Security Auth State
  const [isPasswordAuth, setIsPasswordAuth] = useState(
    localStorage.getItem("adminAuthKey") === "superadminauthpass"
  );
  const [passwordInput, setPasswordInput] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/dashboard`);
      if (!res.ok) throw new Error("Failed to fetch admin stats. Ensure backend is running.");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/admin/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser?.username || 'admin', password: passwordInput })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Verification failed");
      
      if (data.success) {
        localStorage.setItem("adminAuthKey", "superadminauthpass");
        setIsPasswordAuth(true);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleGroupAccess = async (app: AppConfig) => {
    if (!isSuperAdmin) {
      alert("Only the Super Admin can change global settings.");
      return;
    }
    if (stats?.setupRequired) {
      alert("Database error: Please run the provided supabase_admin_setup.sql file in your Supabase SQL Editor to create the api_clients table.");
      return;
    }
    
    setTogglingApp(app.id);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/config/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allow_group_creation: !app.allow_group_creation }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update config");
      
      // Optimistically update UI
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          applications: prev.applications.map(a => 
            a.id === app.id ? { ...a, allow_group_creation: !app.allow_group_creation } : a
          )
        };
      });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setTogglingApp(null);
    }
  };

  const saveAppConfig = async () => {
    if (!appForm) return;
    if (appForm.id === "default") {
       alert("Cannot save settings to the ghost/default application. Please ensure you ran the SQL setup script and created an API client block.");
       return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/config/${appForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appForm),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update configuration.");
      
      setEditingApp(null);
      fetchStats();
      alert("Application Settings updated successfully!");
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const banUserAction = async (bannerUsername: string, is_banned: boolean) => {
    if (!window.confirm(`Are you sure you want to ${is_banned ? 'BAN' : 'UNBAN'} @${bannerUsername}?`)) return;
    try {
       const res = await fetch(`${API_URL}/api/v1/admin/users/${bannerUsername}/ban`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ is_banned })
       });
       if(res.ok) { fetchStats(); alert("User ban status updated"); }
    } catch(err) {}
  };

  const warnUserAction = async (warnUsername: string) => {
    const msg = window.prompt(`Enter warning message for @${warnUsername}:`, "You are violating community guidelines.");
    if (!msg) return;
    try {
       const res = await fetch(`${API_URL}/api/v1/admin/users/${warnUsername}/warn`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ message: msg })
       });
       if(res.ok) { fetchStats(); alert("Warning sent securely over websockets!"); }
    } catch(err) {}
  };

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    
    setSearching(true);
    setSearchError("");
    setSearchResult(null);
    
    try {
      const res = await fetch(`${API_URL}/api/v1/users/${searchUsername.trim()}`, {
         headers: { "x-api-key": "ZATCHAT_PRATEEK9373" }
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("User Not Found in database");
        throw new Error("Failed to search user");
      }
      const userData = await res.json();
      setSearchResult(userData);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const quickRevokeAdmin = async (revokeUsername: string) => {
    if (!window.confirm(`Are you sure you want to revoke admin access for @${revokeUsername}?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users/${revokeUsername}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          is_admin: false,
          can_create_group: false,
          admin_password: null
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove admin access");
      
      // Refresh the dashboard stats to instantly remove them from the list
      fetchStats();
      alert(`Admin access revoked for @${revokeUsername}`);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const saveUserPermissions = async () => {
    if (!searchResult) return;
    
    setUpdatingRole(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users/${searchResult.username}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          is_admin: editAdminStatus,
          can_create_group: editGroupAccess,
          admin_password: editPassword.trim() || null
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update permissions");
      
      setSearchResult(data.user);
      alert(`Success! Permissions securely updated for ${data.user.username}.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  if (!isPasswordAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-gray-100">
          <ShieldAlert className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Security Check</h2>
          <p className="text-gray-500 mb-8 font-medium text-sm">Please enter the master password to access the admin dashboard.</p>
          <form onSubmit={handlePasswordSubmit}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Admin Password (admin123)"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 transition"
              autoFocus
            />
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md">
              Unlock Dashboard
            </button>
          </form>
          <button onClick={() => navigate('/chat')} className="mt-6 text-sm text-gray-500 underline hover:text-gray-700 transition">
            Cancel & Return to Chat
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/chat')}
              className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-8 h-8 text-indigo-500" />
                Admin Dashboard
              </h1>
              <p className="text-gray-500 mt-1">Manage API integrations and platform settings</p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
            <ShieldAlert className="w-6 h-6" />
            <span>{error}</span>
            <button onClick={fetchStats} className="ml-auto underline font-medium hover:text-red-800">Retry</button>
          </div>
        ) : (
          <>
            {stats?.setupRequired && (
              <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" /> 
                  Database Setup Required
                </h3>
                <p>The <b>api_clients</b> table has not been created in your Supabase database yet. Please run the SQL script generated in your backend folder (<b>supabase_admin_setup.sql</b>) to enable permanent settings storage.</p>
              </div>
            )}

            {/* Metrics (Only Super Admin sees exact user data) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {isSuperAdmin && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Active Users</p>
                      <h3 className="text-4xl font-extrabold text-gray-900 mt-2">
                        {stats?.activeUsers || 0}
                      </h3>
                    </div>
                    <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                      <Activity className="w-7 h-7 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-green-500 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                    Users currently online
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Groups</p>
                    <h3 className="text-4xl font-extrabold text-gray-900 mt-2">
                      {stats?.totalGroups || 0}
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center">
                    <Users className="w-7 h-7 text-purple-500" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500 line-clamp-1">
                  Groups actively registered
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Connected Applications</p>
                    <h3 className="text-4xl font-extrabold text-gray-900 mt-2">
                      {stats?.applications.length || 0}
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Settings className="w-7 h-7 text-indigo-500" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500 line-clamp-1">
                  Apps utilizing your Chat API
                </div>
              </div>
            </div>

              {/* Real-time Status Lists */}
              {isSuperAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Online Users List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-96">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" />
                        Live Online Users
                      </h2>
                      <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-bold">
                        {stats?.onlineUsersList?.length || 0} Online
                      </span>
                    </div>
                    <div className="overflow-y-auto p-2 flex-grow custom-scrollbar">
                      {stats?.onlineUsersList?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <Users className="w-10 h-10 mb-2 opacity-20" />
                          <p>No users are currently online.</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-50">
                          {stats?.onlineUsersList?.map((user: any) => (
                            <li key={user.username} className="p-4 hover:bg-gray-50 flex items-center justify-between rounded-xl transition">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    <img src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-10 h-10 rounded-full shadow-sm" alt="avatar" />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-gray-900">{user.display_name}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                  </div>
                                </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Admins List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-96">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-indigo-500" />
                        Administrative Team
                      </h2>
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-bold">
                        {stats?.adminUsersList?.length || 0} Admins
                      </span>
                    </div>
                    <div className="overflow-y-auto p-2 flex-grow custom-scrollbar">
                      {stats?.adminUsersList?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <Shield className="w-10 h-10 mb-2 opacity-20" />
                          <p>No extra admins appointed.</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-50">
                          {/* Force Displaying the Hardcoded Super Admin to be complete */}
                          <li className="p-4 hover:bg-gray-50 flex items-center justify-between rounded-xl transition bg-indigo-50/30">
                            <div className="flex items-center gap-4">
                              <img src={`https://ui-avatars.com/api/?name=admin&background=random`} className="w-10 h-10 rounded-full shadow-sm" alt="avatar" />
                              <div>
                                <p className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                                  Super Admin <span className="text-[10px] bg-indigo-600 text-white px-1.5 rounded uppercase">Owner</span>
                                </p>
                                <p className="text-xs text-indigo-500">@admin</p>
                              </div>
                            </div>
                          </li>

                          {stats?.adminUsersList?.map((user: any) => (
                            <li key={user.username} className="p-4 hover:bg-gray-50 flex items-center justify-between rounded-xl transition group">
                                <div className="flex items-center gap-4">
                                  <img src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-10 h-10 rounded-full shadow-sm" alt="avatar" />
                                  <div>
                                    <p className="font-bold text-sm text-gray-900">{user.display_name}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-end mr-2">
                                    <span className="text-xs font-bold text-gray-700">
                                      {user.total_chats || 0} Chats
                                    </span>
                                    {user.can_create_group && (
                                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 mt-0.5 rounded font-bold">
                                        + Groups
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => quickRevokeAdmin(user.username)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Revoke Admin Access"
                                  >
                                    <ShieldAlert className="w-4 h-4" />
                                  </button>
                                </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* App Management & Group Directory Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab("metrics")}
                  className={`flex-1 py-4 font-bold text-center border-b-2 transition ${activeTab === 'metrics' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                  Global API Configuration
                </button>
                <button
                  onClick={() => setActiveTab("directories")}
                  className={`flex-1 py-4 font-bold text-center border-b-2 transition ${activeTab === 'directories' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                  Active Groups Directory
                </button>
              </div>
              
              {activeTab === "metrics" ? (
                <div className="p-6">
                  {editingApp ? (
                    <div className="animate-fade-in">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-500" /> Editing {editingApp.app_name} Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-semibold text-gray-700">App Name</label>
                          <input type="text" className="px-4 py-2 border rounded-lg bg-white outline-none w-full" 
                            value={appForm?.app_name || ''} onChange={(e) => setAppForm(prev => prev ? {...prev, app_name: e.target.value} : prev)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-semibold text-gray-700">App Logo URL</label>
                          <input type="text" className="px-4 py-2 border rounded-lg bg-white outline-none w-full" 
                            value={appForm?.app_logo || ''} onChange={(e) => setAppForm(prev => prev ? {...prev, app_logo: e.target.value} : prev)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-semibold text-gray-700">Max Group Size</label>
                          <input type="number" className="px-4 py-2 border rounded-lg bg-white outline-none w-full" 
                            value={appForm?.max_group_size || 50} onChange={(e) => setAppForm(prev => prev ? {...prev, max_group_size: parseInt(e.target.value)} : prev)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-semibold text-gray-700">Max Message Length</label>
                          <input type="number" className="px-4 py-2 border rounded-lg bg-white outline-none w-full" 
                            value={appForm?.max_message_length || 1000} onChange={(e) => setAppForm(prev => prev ? {...prev, max_message_length: parseInt(e.target.value)} : prev)} />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={appForm?.allow_chat_creation} 
                              onChange={(e) => setAppForm(prev => prev ? {...prev, allow_chat_creation: e.target.checked} : prev)} />
                            <span className="font-semibold text-sm">Allow Chatting</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={appForm?.allow_group_creation} 
                              onChange={(e) => setAppForm(prev => prev ? {...prev, allow_group_creation: e.target.checked} : prev)} />
                            <span className="font-semibold text-sm">Allow Groups</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={appForm?.allow_media_sharing} 
                              onChange={(e) => setAppForm(prev => prev ? {...prev, allow_media_sharing: e.target.checked} : prev)} />
                            <span className="font-semibold text-sm">Allow Media (Images)</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setEditingApp(null)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition">Cancel</button>
                        <button onClick={saveAppConfig} className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition shadow-md">Save Global Settings</button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 text-sm">
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider">Application</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider">Group Size Cap</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-center">Media Sharing</th>
                            {isSuperAdmin && <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Action</th>}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {stats?.applications.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 flex items-center gap-3">
                                <img src={app.app_logo} alt="logo" className="w-10 h-10 rounded-lg shadow-sm" />
                                <div>
                                  <div className="font-bold text-gray-900 text-lg">{app.app_name}</div>
                                  <div className="text-xs text-gray-500 font-mono">APP-{app.id.substring(0,6).toUpperCase()}</div>
                                </div>
                               </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-gray-700">{app.max_group_size || 50} Members</span>
                               </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${app.allow_media_sharing ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                  {app.allow_media_sharing ? "Allowed" : "Blocked"}
                                </span>
                               </td>
                              {isSuperAdmin && (
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => { setEditingApp(app); setAppForm(app); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold transition">
                                    Edit Settings
                                  </button>
                                 </td>
                              )}
                             </tr>
                          ))}
                        </tbody>
                       </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-sm">
                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Group Details</th>
                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Members</th>
                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Created By</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupsList.map(g => (
                        <tr key={g.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img src={g.group_icon} alt="icon" className="w-10 h-10 rounded-full shadow-sm" />
                            <div className="font-bold text-gray-900">{g.group_name}</div>
                           </td>
                          <td className="px-6 py-4 font-bold text-gray-700">{g.member_count}</td>
                          <td className="px-6 py-4 text-indigo-600 font-medium">@{g.created_by}</td>
                         </tr>
                      ))}
                      {groupsList.length === 0 && (
                         <tr><td colSpan={3} className="p-8 text-center text-gray-500 font-medium">No active groups found in the directory.</td></tr>
                      )}
                    </tbody>
                   </table>
                </div>
              )}
            </div>

            {/* User Management Section (Super Admin Only) */}
            {isSuperAdmin && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-indigo-500" />
                  Assign Admin Access
                </h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSearchUser} className="flex flex-col sm:flex-row gap-3 max-w-lg mb-6">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search for a username..." 
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 transition"
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={searching || !searchUsername.trim()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition disabled:opacity-50"
                  >
                    {searching ? "Searching..." : "Search User"}
                  </button>
                </form>

                {searchError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 mb-4 border border-red-100 max-w-lg">
                    <UserX className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{searchError}</span>
                  </div>
                )}

                {searchResult && (
                  <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-4 max-w-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src={searchResult.profile_picture || `https://ui-avatars.com/api/?name=${searchResult.username}&background=random`} 
                          alt="Profile" 
                          className="w-14 h-14 rounded-full shadow-sm"
                        />
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            {searchResult.display_name}
                            {searchResult.is_admin && <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
                          </h3>
                          <p className="text-gray-500 text-sm">@{searchResult.username}</p>
                        </div>
                      </div>
                    </div>

                    {/* User Action Controls */}
                    <div className="flex flex-col gap-5 w-full mt-2 border-t border-gray-200 pt-5">
                      
                      <div className="flex flex-col sm:flex-row gap-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded bg-gray-100 border-gray-300 focus:ring-indigo-500" 
                                 checked={editAdminStatus}
                                 onChange={(e) => setEditAdminStatus(e.target.checked)} />
                          <span className="font-medium text-gray-700">Grant Admin Dashboard Access</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded bg-gray-100 border-gray-300 focus:ring-indigo-500" 
                                 checked={editGroupAccess}
                                 onChange={(e) => setEditGroupAccess(e.target.checked)} />
                          <span className="font-medium text-gray-700">Allow Group Creation (Bypass Global Limit)</span>
                        </label>
                      </div>

                      {editAdminStatus && (
                        <div className="flex flex-col gap-2 mt-2">
                          <label className="text-sm font-semibold text-gray-600">Child Admin Specific Dashboard Password</label>
                          <input 
                            type="text" 
                            placeholder="Set their secure dashboard password..."
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:max-w-md text-gray-900"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                          />
                          <p className="text-xs text-gray-500">This user must type this password to unlock their Admin Dashboard view.</p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-5">
                        <div className="flex gap-3 w-full sm:w-auto mb-4 sm:mb-0">
                          <button onClick={() => warnUserAction(searchResult.username)} className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg font-bold transition flex items-center justify-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Warn User
                          </button>
                          <button onClick={() => banUserAction(searchResult.username, !searchResult.is_banned)} className={`flex-1 sm:flex-none px-4 py-2 border rounded-lg font-bold transition flex items-center justify-center gap-2 ${searchResult.is_banned ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}>
                            <UserX className="w-4 h-4" /> {searchResult.is_banned ? "Unban User" : "Ban User"}
                          </button>
                        </div>
                        <button
                          onClick={saveUserPermissions}
                          disabled={updatingRole}
                          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {updatingRole ? "Saving Settings..." : "Save User Permissions"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}   

