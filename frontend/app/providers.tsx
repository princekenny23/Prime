"use client"

import { TenantProvider } from "@/contexts/tenant-context"
import { RoleProvider } from "@/contexts/role-context"
import { ShiftProvider } from "@/contexts/shift-context"
import { I18nProvider } from "@/contexts/i18n-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <I18nProvider>
        <RoleProvider>
          <ShiftProvider>
            {children}
          </ShiftProvider>
        </RoleProvider>
      </I18nProvider>
    </TenantProvider>
  )
}

