'use client';

import { useState } from 'react';
import { login } from '@/app/login/actions';
import Link from 'next/link';
import { Alert, authLabelCls } from '@/components/AuthUI';

export default function LoginForm({ error, message }: { error?: string; message?: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={login} className="space-y-5">
      <div className="space-y-1.5">
        <label className={authLabelCls}>Email truy cập</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm14 2v1.4l-7 4.2-7-4.2V6h14z" /></svg>
          </div>
          <input
            type="email"
            name="email"
            required
            placeholder="admin@example.com"
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-[15px] text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={authLabelCls}>Mật khẩu</label>
          <Link href="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors">
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            required
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-[15px] text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <Alert error={error} message={message} />

      <button
        type="submit"
        className="group relative mt-8 flex w-full items-center justify-center overflow-hidden rounded-xl bg-brand-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98]"
      >
        <span className="relative z-10 flex items-center gap-2">
          Đăng nhập hệ thống
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-1"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
        </span>
      </button>
    </form>
  );
}
