"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;
export function SheetHeader(props: React.ComponentProps<"div">) { return <div {...props} />; }
export function SheetContent({ side, className, children, showClose = true }: {
  side: "bottom" | "right";
  className?: string;
  children: React.ReactNode;
  showClose?: boolean;
}) {
  return <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
    <Dialog.Content className={`fixed z-50 border bg-card p-6 pt-12 shadow-xl ${side === "bottom" ? "inset-x-0 bottom-0" : "inset-y-0 right-0"} ${className ?? ""}`}>
      {showClose && <Dialog.Close aria-label="Đóng" className="absolute right-4 top-4 rounded p-1"><X size={20} /></Dialog.Close>}
      {children}
    </Dialog.Content>
  </Dialog.Portal>;
}
