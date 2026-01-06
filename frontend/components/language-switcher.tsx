"use client"

import { useState } from "react"
import { useI18n } from "@/contexts/i18n-context"
import { LOCALES, Locale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Flag icons as SVG components for crisp rendering
 */
const FlagEN = ({ className }: { className?: string }) => (
  <svg className={cn("rounded-sm", className)} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <path fill="#012169" d="M0 0h640v480H0z"/>
    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
  </svg>
)

const FlagMW = ({ className }: { className?: string }) => (
  <svg className={cn("rounded-sm", className)} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <path fill="#000" d="M0 0h640v160H0z"/>
    <path fill="#f41408" d="M0 160h640v160H0z"/>
    <path fill="#21873b" d="M0 320h640v160H0z"/>
    <g fill="#f41408" transform="translate(320 80)">
      <circle r="50"/>
      <path d="M0-80v60M-30-70l30 50 30-50M-50-50l50 40 50-40M-60-25l60 25 60-25"/>
    </g>
  </svg>
)

/**
 * Get flag component for locale
 */
const getFlag = (locale: Locale, className?: string) => {
  switch (locale) {
    case "en":
      return <FlagEN className={className} />
    case "ny":
      return <FlagMW className={className} />
    default:
      return <FlagEN className={className} />
  }
}

interface LanguageSwitcherProps {
  /** Show full language names instead of codes */
  showFullName?: boolean
  /** Additional CSS classes */
  className?: string
  /** Variant style */
  variant?: "default" | "ghost" | "outline"
  /** Size */
  size?: "default" | "sm" | "lg" | "icon"
}

/**
 * Language switcher component for the header or settings
 * Allows users to switch between English and Chichewa
 * Features flag icons for quick visual identification
 */
export function LanguageSwitcher({
  showFullName = false,
  className,
  variant = "ghost",
  size = "default",
}: LanguageSwitcherProps) {
  const { locale, setLocale, isLoading } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = LOCALES.find((l) => l.code === locale)

  const handleSelect = async (newLocale: Locale) => {
    if (newLocale !== locale) {
      await setLocale(newLocale)
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          disabled={isLoading}
        >
          {getFlag(locale, "h-4 w-6")}
          {showFullName ? (
            <span>{currentLanguage?.nativeName}</span>
          ) : (
            <span className="uppercase text-xs font-medium">{locale}</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {LOCALES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={cn(
              "flex items-center gap-3 cursor-pointer py-2.5",
              locale === lang.code && "bg-accent"
            )}
          >
            {getFlag(lang.code, "h-5 w-7 flex-shrink-0")}
            <div className="flex flex-col flex-1">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </div>
            {locale === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Compact language switcher with flag for header
 * Single click to toggle between languages
 */
export function LanguageSwitcherCompact({ className }: { className?: string }) {
  const { locale, setLocale, isLoading } = useI18n()

  const toggleLanguage = async () => {
    const newLocale = locale === "en" ? "ny" : "en"
    await setLocale(newLocale)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      disabled={isLoading}
      className={cn(
        "gap-1.5 px-2 h-8",
        className
      )}
      title={locale === "en" ? "Switch to Chichewa (🇲🇼)" : "Sinthani kukhala Chingelezi (🇬🇧)"}
    >
      {getFlag(locale, "h-4 w-6")}
      <span className="text-xs font-medium uppercase">{locale}</span>
    </Button>
  )
}

/**
 * Icon-only language switcher for very compact spaces
 * Shows only the flag, toggles on click
 */
export function LanguageSwitcherIcon({ className }: { className?: string }) {
  const { locale, setLocale, isLoading } = useI18n()

  const toggleLanguage = async () => {
    const newLocale = locale === "en" ? "ny" : "en"
    await setLocale(newLocale)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      disabled={isLoading}
      className={cn("h-8 w-8", className)}
      title={locale === "en" ? "Switch to Chichewa (🇲🇼)" : "Sinthani kukhala Chingelezi (🇬🇧)"}
    >
      {getFlag(locale, "h-5 w-7")}
    </Button>
  )
}

/**
 * Language selector for settings pages
 * Full-width button style
 */
export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale, isLoading, t } = useI18n()

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">
        {t("settings.language.current")}
      </label>
      <div className="flex gap-2">
        {LOCALES.map((lang) => (
          <Button
            key={lang.code}
            variant={locale === lang.code ? "default" : "outline"}
            onClick={() => setLocale(lang.code)}
            disabled={isLoading}
            className="flex-1"
          >
            <div className="flex flex-col items-center">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs opacity-70">{lang.name}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}

export default LanguageSwitcher

