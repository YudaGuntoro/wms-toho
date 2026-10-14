"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import YkkBrand from "@/components/brand/YkkBrand";
import { EyeCloseIcon, EyeIcon, LockIcon, UserIcon } from "@/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useId, useState } from "react";
import { apiPost } from "@/lib/api";
import { hasValidAuthSession, saveAuthSession } from "@/lib/auth";
import type { LoginResponse } from "@/lib/types";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/signin") ? value : "/";
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const usernameFieldId = useId().replace(/:/g, "");
  const passwordFieldId = useId().replace(/:/g, "");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasValidAuthSession()) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiPost<LoginResponse>("/api/auth/login", {
        username: username.trim(),
        password,
      });
      saveAuthSession(response);
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2 lg:px-10">
      <div className="relative w-full max-w-[500px]">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <YkkBrand />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white/95 p-6 shadow-theme-xl backdrop-blur dark:border-white/[0.08] dark:bg-gray-900/90 sm:p-8">
          <div className="mb-8">
            <div className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#184F8F]">
              <span className="flex size-9 overflow-hidden rounded-md bg-[#184F8F] shadow-theme-xs" aria-hidden="true">
                <svg className="h-full w-full" viewBox="0 0 200 200">
                  <rect width="200" height="200" fill="#1F5A94" />
                  <ellipse cx="101" cy="50" rx="52" ry="14" fill="white" />
                  <path
                    d="M88 79C60 88 43 111 44 135C45 158 64 171 91 167C125 162 154 133 159 99C163 77 147 67 119 68V122L88 145V79Z"
                    fill="white"
                  />
                  <path d="M88 79V145L119 122V68C106 70 96 74 88 79Z" fill="#1F5A94" />
                </svg>
              </span>
              Warehouse Management
            </div>
            <h1 className="mb-3 text-title-sm font-bold text-gray-900 dark:text-white/90 sm:text-title-md">Sign in</h1>
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">Sign in to access the WMS-Toho warehouse operations workspace.</p>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-error-500/20 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          ) : null}

          <form autoComplete="on" onSubmit={(event) => void submit(event)}>
            <div className="space-y-6">
              <div>
                <Label htmlFor={`production-user-${usernameFieldId}`}>
                  Username <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <UserIcon className="size-5 fill-current" />
                  </span>
                  <Input
                    autoCapitalize="none"
                    autoComplete="username"
                    className="h-12 pl-12"
                    disabled={loading}
                    id={`production-user-${usernameFieldId}`}
                    inputMode="text"
                    name="username"
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter username"
                    spellCheck={false}
                    type="text"
                    value={username}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`production-secret-${passwordFieldId}`}>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <LockIcon className="size-5 fill-current" />
                  </span>
                  <Input
                    autoComplete="current-password"
                    className="h-12 pl-12 pr-12"
                    disabled={loading}
                    id={`production-secret-${passwordFieldId}`}
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#184F8F] px-4 text-sm font-semibold text-white shadow-theme-md transition-colors hover:bg-[#123D70] focus:outline-none focus:ring-3 focus:ring-[#184F8F]/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Processing..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">WMS-Toho</p>
      </div>
    </div>
  );
}
