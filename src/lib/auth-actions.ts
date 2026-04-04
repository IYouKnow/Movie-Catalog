"use server";

import { signIn, signOut } from "@/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

function safeCallbackPath(url: string): string {
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return "/catalog";
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = safeCallbackPath(
    String(formData.get("callbackUrl") ?? "/catalog"),
  );

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    return { error: "Invalid email or password." };
  }

  redirect(nextPath);
}

const registerSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
  name: z.string().max(100).optional(),
});

export type RegisterState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "name", string[]>>;
};

export async function registerAction(
  _prev: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? ""),
  };

  const parsed = registerSchema.safeParse({
    ...raw,
    name: raw.name.trim() || undefined,
  });

  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        email: fe.email,
        password: fe.password,
        name: fe.name,
      },
    };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: parsed.data.name?.trim() || null,
      },
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? e.code : null;
    if (code === "P2002") {
      return { error: "An account with this email already exists." };
    }
    throw e;
  }

  const result = await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirect: false,
  });

  if (result?.error) {
    return {
      error: "Account created. Please sign in with your email and password.",
    };
  }

  redirect("/catalog");
}
