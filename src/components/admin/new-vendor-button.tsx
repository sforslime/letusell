"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateVendorModal } from "./create-vendor-modal";

export function NewVendorButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-1.5 h-4 w-4" />
        New vendor
      </Button>
      {open && <CreateVendorModal onClose={() => setOpen(false)} />}
    </>
  );
}
