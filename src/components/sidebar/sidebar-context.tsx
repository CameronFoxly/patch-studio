"use client";

import { createContext, useContext, type RefObject } from "react";

export const SidebarContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export function useSidebarContainer() {
  return useContext(SidebarContainerContext);
}
