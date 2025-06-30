"use client";
import { useState } from "react";
import { useLogin } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import GoogleInit from "@/components/GoogleInit";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(form);
    if (loginMutation.isSuccess) {
      router.push("/google");
    }
  };

  return (
    <div>
      <h1>Google Integration</h1>
      <div className="bg-blue-600">
        <GoogleInit />
      </div>

      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </button>
      </form>
      {loginMutation.isError && <p>Error: Something went wrong.</p>}
    </div>
  );
}
