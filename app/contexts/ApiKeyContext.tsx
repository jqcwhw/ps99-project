"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"

interface ApiKeyContextType {
  apiKey: string
  setApiKey: (key: string) => void
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    const storedApiKey = localStorage.getItem("togetherApiKey")
    if (storedApiKey) {
      setApiKey(storedApiKey)
    }
  }, [])

  return <ApiKeyContext.Provider value={{ apiKey, setApiKey }}>{children}</ApiKeyContext.Provider>
}

export function useApiKey() {
  const context = useContext(ApiKeyContext)
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider")
  }
  return context
}

