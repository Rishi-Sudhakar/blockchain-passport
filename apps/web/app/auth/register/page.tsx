"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AuthShell } from "@/components/shell/AuthShell";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/resources";
import { defaultDeviceLabel, setupSigningKeyForThisDevice } from "@/lib/auth/device-setup";
import { useSession } from "@/lib/auth/session";
import { createPasskey, isWebAuthnJSONSupported } from "@/lib/crypto/webauthn";

const schema = z.object({
  displayName: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["manufacturer", "certifier"]),
  organizationName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Stage = "form" | "passkey" | "device" | "error";

export default function RegisterPage() {
  const router = useRouter();
  const { refetch } = useSession();
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "manufacturer" },
  });
  const role = watch("role");

  const onSubmit = async (values: FormValues) => {
    setError(null);
    if (!isWebAuthnJSONSupported()) {
      setError("Your browser doesn't support passkeys yet. Try the latest Chrome, Safari, or Edge.");
      setStage("error");
      return;
    }
    try {
      setStage("passkey");
      const { ceremonyId, userId, options } = await authApi.beginRegistration({
        email: values.email,
        displayName: values.displayName,
        role: values.role,
        organizationName: values.organizationName,
      });
      const deviceLabel = defaultDeviceLabel();
      const credentialJSON = await createPasskey(options.publicKey);
      await authApi.finishRegistration(ceremonyId, userId, deviceLabel, credentialJSON);
      await refetch();

      setStage("device");
      await setupSigningKeyForThisDevice(deviceLabel);

      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setStage("error");
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Issue and certify digital product passports.">
      <AnimatePresence mode="wait">
        {stage === "form" || stage === "error" ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <TextField label="Full name" placeholder="Jordan Lee" {...register("displayName")} error={errors.displayName?.message} />
            <TextField label="Email" type="email" placeholder="you@company.com" {...register("email")} error={errors.email?.message} />

            <div className="space-y-1.5">
              <span className="text-[13px] font-medium text-ink-2">You are a</span>
              <div className="grid grid-cols-2 gap-2">
                {(["manufacturer", "certifier"] as const).map((r) => (
                  <label
                    key={r}
                    className={`flex h-12 cursor-pointer items-center justify-center rounded-[16px] border text-[14px] font-medium transition-colors ${
                      role === r
                        ? "border-accent-teal/60 bg-accent-teal/10 text-ink-0"
                        : "border-white/[0.1] bg-white/[0.04] text-ink-2"
                    }`}
                  >
                    <input type="radio" value={r} {...register("role")} className="hidden" />
                    {r === "manufacturer" ? "Manufacturer" : "Certifier"}
                  </label>
                ))}
              </div>
            </div>

            {role === "manufacturer" && (
              <TextField
                label="Organization name"
                placeholder="Acme Battery Co."
                {...register("organizationName")}
                error={errors.organizationName?.message}
              />
            )}

            {error && <p className="text-[13px] text-danger">{error}</p>}

            <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
              Continue with passkey
            </Button>
          </motion.form>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-10 text-center"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-accent-teal" />
            <p className="text-[15px] text-ink-1">
              {stage === "passkey"
                ? "Confirm with Face ID, Touch ID, or your device passkey…"
                : "Setting up this device's signing key…"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-6 text-center text-[13px] text-ink-2">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-ink-0">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
