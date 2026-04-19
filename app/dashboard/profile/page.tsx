"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

// ─── Validation schema ───────────────────────────────────────────────────────

const GENDER_VALUES = ["male", "female", "other", "prefer_not_to_say"] as const;
const BLOOD_GROUPS  = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const profileSchema = z.object({
  fullName:   z.string().max(100, "Max 100 characters").optional(),
  age:        z.number().int().min(1, "Min 1").max(120, "Max 120").optional(),
  gender:     z.enum(GENDER_VALUES).optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Tag input ───────────────────────────────────────────────────────────────

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  chipClass: string;
  id: string;
}

function TagInput({ tags, onAdd, onRemove, placeholder, chipClass, id }: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const val = inputRef.current?.value.trim();
    if (!val || tags.includes(val)) return;
    onAdd(val);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={id}
        type="text"
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5
                   py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground
                   focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${chipClass}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  // Tag state
  const [allergies,   setAllergies]   = useState<string[]>([]);
  const [conditions,  setConditions]  = useState<string[]>([]);

  // UI state
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", age: undefined, gender: undefined, bloodGroup: undefined },
  });

  // ── Fetch profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile) {
          reset({
            fullName:   profile.fullName   ?? "",
            age:        profile.age        ?? undefined,
            gender:     profile.gender     ?? undefined,
            bloodGroup: profile.bloodGroup ?? undefined,
          });
          setAllergies(profile.knownAllergies    ?? []);
          setConditions(profile.chronicConditions ?? []);
        }
      })
      .catch(() => toast.error("Could not load profile"))
      .finally(() => setLoading(false));
  }, [reset]);

  // ── Save profile ─────────────────────────────────────────────────────────────
  async function onSubmit(values: ProfileFormValues) {
    setSaving(true);
    try {
      const body = {
        ...values,
        knownAllergies:    allergies,
        chronicConditions: conditions,
      };
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Could not save profile");
        return;
      }
      toast.success("Profile saved successfully");
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  // ── Data export ──────────────────────────────────────────────────────────────
  async function handleDownload() {
    setDownloading(true);
    try {
      const [profileRes, sessionsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/sessions?limit=50"),
      ]);
      const { profile }  = await profileRes.json();
      const { sessions } = await sessionsRes.json();

      const data = { exportedAt: new Date().toISOString(), profile, sessions };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href     = url;
      a.download = "healthlens-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded");
    } catch {
      toast.error("Export failed — please try again");
    } finally {
      setDownloading(false);
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Deletion failed");
        setDeleting(false);
        return;
      }
      // Client-side sign-out then redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      toast.error("Network error — could not delete account");
      setDeleting(false);
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="h-6 w-40 rounded bg-gray-200" />
          <div className="h-8 w-64 rounded bg-gray-200" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-200" />
          ))}
        </div>
      </main>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-teal-600
                     hover:text-teal-800 transition-colors mb-6"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-[#1E3A5F]">Your Medical Profile</h1>
        <p className="text-sm text-gray-500 mt-1 mb-8">
          All fields are optional. This helps provide more relevant health guidance.
        </p>

        {/* ── Form ───────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Your name"
              {...register("fullName")}
              className={errors.fullName ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <Label htmlFor="age" className="text-sm font-medium text-gray-700">
              Age
            </Label>
            <Input
              id="age"
              type="number"
              min={1}
              max={120}
              placeholder="e.g. 28"
              {...register("age", {
                setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
              })}
              className={errors.age ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {errors.age && (
              <p className="text-xs text-red-500">{String(errors.age.message)}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
              Gender
            </Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="gender"
                    className="w-full h-8 text-sm"
                    aria-invalid={!!errors.gender}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Blood Group */}
          <div className="space-y-1.5">
            <Label htmlFor="bloodGroup" className="text-sm font-medium text-gray-700">
              Blood Group
            </Label>
            <Controller
              name="bloodGroup"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="bloodGroup" className="w-full h-8 text-sm">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Known Allergies */}
          <div className="space-y-1.5">
            <Label htmlFor="allergies-input" className="text-sm font-medium text-gray-700">
              Known Allergies
              <span className="ml-1.5 text-xs text-gray-400 font-normal">
                — press Enter to add
              </span>
            </Label>
            <TagInput
              id="allergies-input"
              tags={allergies}
              onAdd={(t) => setAllergies((a) => [...a, t])}
              onRemove={(t) => setAllergies((a) => a.filter((x) => x !== t))}
              placeholder="e.g. Penicillin, Pollen…"
              chipClass="bg-red-100 text-red-800"
            />
          </div>

          {/* Chronic Conditions */}
          <div className="space-y-1.5">
            <Label htmlFor="conditions-input" className="text-sm font-medium text-gray-700">
              Chronic Conditions
              <span className="ml-1.5 text-xs text-gray-400 font-normal">
                — press Enter to add
              </span>
            </Label>
            <TagInput
              id="conditions-input"
              tags={conditions}
              onAdd={(t) => setConditions((c) => [...c, t])}
              onRemove={(t) => setConditions((c) => c.filter((x) => x !== t))}
              placeholder="e.g. Diabetes, Hypertension…"
              chipClass="bg-blue-100 text-blue-800"
            />
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white
                       w-full py-3 rounded-xl font-medium mt-6 transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>

        </form>

        {/* ── Danger Zone ─────────────────────────────────────────────────────── */}
        <section className="mt-10 border-t-2 border-red-100 pt-6 space-y-4">
          <h2 className="text-lg font-semibold text-red-600">Danger zone</h2>

          {/* Download data */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-2.5 rounded-xl border border-gray-300 text-sm font-medium
                       text-gray-700 hover:bg-gray-50 transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? "Preparing download…" : "Download my data"}
          </button>

          {/* Delete account */}
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="w-full py-2.5 rounded-xl border border-red-300 text-sm font-medium
                       text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete my account
          </button>
        </section>

      </div>

      {/* ── Delete confirmation dialog ──────────────────────────────────────── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account, medical profile, and all session
              history. <strong>This cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-t-0 bg-transparent p-0 mt-2 flex flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium
                         text-gray-700 hover:bg-gray-50 transition-colors
                         disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white
                         text-sm font-medium transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting…" : "Confirm delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </main>
  );
}
