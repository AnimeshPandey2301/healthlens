"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const supabase = createClient();
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const termsChecked = watch("terms");

  async function onSubmit(values: RegisterFormValues) {
    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setAuthError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mx-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
            {/* Green check icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
              <svg
                className="h-7 w-7 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1E3A5F]">Check your email</h2>
            <p className="mt-3 text-sm text-gray-500">
              We&apos;ve sent a confirmation link to your email address. Click it to
              activate your HealthLens account.
            </p>
            <Link
              href="/auth/login"
              className="mt-6 inline-block text-sm font-medium text-teal-600 hover:underline"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Register form ── */
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mx-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-teal-600">HealthLens</h1>
            <p className="mt-1 text-sm text-gray-500">Create your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                className={errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                className={errors.password ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                className={
                  errors.confirmPassword ? "border-red-400 focus-visible:ring-red-400" : ""
                }
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Disclaimer checkbox */}
            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <Checkbox
                id="terms"
                checked={termsChecked}
                onCheckedChange={(val) => setValue("terms", !!val, { shouldValidate: true })}
                className="mt-0.5 border-gray-300 data-[state=checked]:border-teal-600 data-[state=checked]:bg-teal-600"
              />
              <Label
                htmlFor="terms"
                className="cursor-pointer text-xs leading-relaxed text-gray-600"
              >
                I understand HealthLens is for <strong>educational purposes only</strong> and
                is not a substitute for professional medical advice.
              </Label>
            </div>
            {errors.terms && (
              <p className="text-xs text-red-500">{errors.terms.message}</p>
            )}

            {/* Auth error */}
            {authError && (
              <p className="text-center text-sm font-medium text-red-500">{authError}</p>
            )}

            {/* Submit */}
            <Button
              id="create-account-btn"
              type="submit"
              disabled={!termsChecked || loading}
              className="w-full rounded-lg bg-teal-600 py-3 font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-teal-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}