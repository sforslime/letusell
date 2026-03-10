"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";

interface Props {
  fullName: string | null;
  phone: string | null;
}

export function ProfileEditForm({ fullName, phone }: Props) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateProfile, null);

  if (!editing) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Full name</p>
          <p className="mt-0.5 text-sm font-medium text-gray-800">{fullName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Phone</p>
          <p className="mt-0.5 text-sm font-medium text-gray-800">{phone ?? "Not set"}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-1 gap-1.5"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit details
        </Button>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setEditing(false);
      }}
      className="space-y-3"
    >
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Full name
        </label>
        <input
          name="full_name"
          defaultValue={fullName ?? ""}
          required
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Phone
        </label>
        <input
          name="phone"
          defaultValue={phone ?? ""}
          placeholder="+234..."
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      {state?.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="gap-1.5" disabled={pending}>
          <Check className="h-3.5 w-3.5" />
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setEditing(false)}
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
