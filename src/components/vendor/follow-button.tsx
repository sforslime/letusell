"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function FollowButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch(`/api/vendors/${slug}/follow`)
      .then((r) => r.json())
      .then((d) => {
        setFollowing(d.following);
        setCount(d.count ?? 0);
        setAuthed(d.following !== undefined && !d.error);
        setLoading(false);
      });
  }, [slug]);

  async function toggle() {
    if (!authed && !following) {
      router.push("/login");
      return;
    }
    setFollowing((f) => !f);
    setCount((c) => (following ? c - 1 : c + 1));
    const method = following ? "DELETE" : "POST";
    const res = await fetch(`/api/vendors/${slug}/follow`, { method });
    if (res.status === 401) {
      setFollowing(false);
      setCount((c) => c - 1);
      router.push("/login");
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        following
          ? "border-brand-500 bg-brand-500 text-white hover:bg-brand-600"
          : "border-brand-500 bg-transparent text-brand-600 hover:bg-brand-50"
      }`}
    >
      {following ? "Following" : "Follow"}
      {count > 0 && <span className="ml-1.5 text-xs opacity-70">{count}</span>}
    </button>
  );
}
