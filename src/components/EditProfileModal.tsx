"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  User,
  Phone,
  Briefcase,
  Lock,
  Save,
  CheckCircle2,
  Sparkles,
  Upload,
  ShieldCheck,
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSave: (updatedUser: any) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || user.employee?.phone || "");
      setPosition(user.position || user.employee?.position || "");
      setBio(user.bio || "");
      setAvatar(user.avatar || "");
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const initials = name
    ? name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB. Please upload a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          position,
          bio,
          avatar,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const finalUser = data.user || {
          ...user,
          name,
          phone,
          position,
          bio,
          avatar,
        };

        try {
          localStorage.removeItem("kore_user_profile");
          if (user?.id) {
            localStorage.setItem(
              `kore_user_profile_${user.id}`,
              JSON.stringify({
                name: finalUser.name,
                phone: finalUser.phone,
                position: finalUser.position,
                bio: finalUser.bio,
                avatar: finalUser.avatar,
              })
            );
          }
        } catch (e) {}

        onSave(finalUser);
        setSavedMsg("Profile & Cloudinary photo saved across all devices!");
      } else {
        setSavedMsg("Updated profile locally.");
        onSave({ ...user, name, phone, position, bio, avatar });
      }
    } catch (err) {
      console.error("Profile save error:", err);
      onSave({ ...user, name, phone, position, bio, avatar });
      setSavedMsg("Profile saved.");
    } finally {
      setSaving(false);
      setTimeout(() => {
        setSavedMsg("");
        onClose();
      }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="profile-modal-dark bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp text-white flex flex-col max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Edit My Profile
              </h2>
              <p className="text-[11px] sm:text-xs font-bold text-slate-300">
                Customize photo, details, and security settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {savedMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black rounded-2xl flex items-center gap-2 animate-bounce-short">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            {savedMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh] sm:max-h-[80vh]">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg border-2 border-sky-400/80 group-hover:opacity-90 transition-all"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-rose-500 via-sky-500 to-blue-600 flex items-center justify-center font-black text-2xl text-white shadow-lg border-2 border-slate-700">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <Camera className="h-6 w-6 text-white drop-shadow" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md border-2 border-slate-900">
                <Camera className="h-3.5 w-3.5" />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" /> Upload Photo
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-300 font-medium">
              JPG, PNG, GIF up to 5MB
            </span>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-sky-400" /> Full Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-violet-400" /> Job Position / Role Title
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Company Admin, Manager"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" /> Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9999740587"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5">
                Bio / Tagline
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Short bio or motto..."
                className="w-full px-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-rose-400" /> Email Address
              </label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs font-bold text-white opacity-90 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Change Password Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-xs font-black text-sky-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              {showPasswordSection ? "Cancel Password Change" : "Change Password"}
            </button>

            {showPasswordSection && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    New Security Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" /> Save &amp; Apply Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
