import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CompanionEngine } from "./companion-engine";

interface CompanionContextValue {
  engine: CompanionEngine;
}

const CompanionContext = createContext<CompanionContextValue | null>(null);

export function CompanionProvider({
  children,
  engine,
}: {
  children: ReactNode;
  engine: CompanionEngine;
}) {
  const value = useMemo(() => ({ engine }), [engine]);

  return (
    <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>
  );
}

export function useCompanionEngine(): CompanionEngine {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error("useCompanionEngine must be used within CompanionProvider");
  }
  return context.engine;
}
