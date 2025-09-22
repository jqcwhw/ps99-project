"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Search, ExternalLink, Youtube, DiscIcon as Discord } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Settings } from "./components/Settings"
import { ParticleBackground } from "./components/ParticleBackground"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useApiKey } from "./contexts/ApiKeyContext"
import { debounce } from "./utils/debounce"

interface PetData {
  imageUrl: string
  source: string
  currentValues: {
    [key: string]: string
  }
  predictedValues: {
    [key: string]: string
  }
  recommendations: {
    [key: string]: string
  }
  NumberExists: {
    [key: string]: string
  }
  CosmicValue: {
    [key: string]: string
  }
  CosmicDemand: {
    [key: string]: string
  }
}

interface ApiResponse {
  rawResponse: string
  processedData: PetData
  error?: string
}

const variants = ["normal", "golden", "rainbow", "shiny", "shiny golden", "shiny rainbow"]

interface Suggestion {
  Name: string
  Image: string
}

const cleanPetName = (name: string): string => {
  return name.replace(/\b(Rainbow|Golden|Shiny)\s*/gi, "").trim()
}

export default function PetStats() {
  const [petName, setPetName] = useState("")
  const { apiKey } = useApiKey()
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [showRawResponse, setShowRawResponse] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeVariant, setActiveVariant] = useState("normal")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    if (showRawResponse) {
      const timer = setTimeout(() => {
        setShowRawResponse(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showRawResponse])

  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      try {
        const response = await fetch("/api/search-suggestions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: Suggestion[] = await response.json()

        if (!Array.isArray(data)) {
          console.error("Unexpected response format:", data)
          throw new Error("Unexpected response format")
        }

        setSuggestions(data)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
      }
    }, 300),
    [],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPetName(value)
    fetchSuggestions(value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    const cleanedName = cleanPetName(suggestion)
    setPetName(cleanedName)
    setSuggestions([])
  }

  const handleSearch = async () => {
    setSuggestions([]) // Clear suggestions when search starts
    if (!petName.trim()) {
      setError("Please enter a pet name")
      return
    }

    if (!apiKey) {
      setError("Please set your API key in the settings")
      return
    }

    setLoading(true)
    setError("")
    setApiResponse(null)

    try {
      const formattedName = petName.toLowerCase().replace(/ /g, "-")
      const response = await fetch(`/api/pets/${formattedName}`, {
        headers: {
          "X-API-Key": apiKey,
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pet data")
      }

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.processedData || !data.processedData.currentValues) {
        throw new Error("Invalid data received from server")
      }

      setApiResponse(data)
      setShowRawResponse(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unable to find pet data. Please try another name."
      setError(errorMessage)
      console.error("Error fetching pet data:", err)
      if (err instanceof Error && "rawResponse" in err) {
        setApiResponse({ rawResponse: (err as any).rawResponse, processedData: {} as PetData })
        setShowRawResponse(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setSuggestions([]) // Clear suggestions on Enter
      handleSearch()
    }
  }

  const formatValue = (value: number | string) => {
    if (typeof value === "string") return value
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`
    }
    return value.toString()
  }

  const variantStyles = {
    normal: "from-neon-blue to-neon-purple",
    golden: "from-yellow-400 to-amber-600",
    rainbow: "from-red-500 via-green-500 to-blue-500",
    shiny: "from-cyan-400 to-blue-500",
    "shiny golden": "from-yellow-300 to-amber-500",
    "shiny rainbow": "from-pink-500 via-purple-500 to-blue-500",
  }

  const getVariantData = (variant: string) => {
    const data = apiResponse?.processedData
    if (!data) return null

    return {
      current: data.currentValues[variant] || 0,
      predicted: data.predictedValues[variant] || "0 (+ 0)",
      recommendation: data.recommendations[variant] || "N/A",
      NumberExists: data.NumberExists[variant] || 0,
      CosmicValue: data.CosmicValue[variant] || "N/A",
      CosmicDemand: data.CosmicDemand[variant] || "N/A",
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="container mx-auto px-4 py-12 relative z-10"
      >
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-center space-y-4"
          >
            <motion.h1
              className="text-7xl font-bold bg-gradient-to-r from-white via-white to-green-300 bg-clip-text text-transparent"
              animate={{
                y: [0, -10, 0],
                textShadow: [
                  "0 0 20px rgba(34,197,94,0)",
                  "0 0 25px rgba(34,197,94,0.3)",
                  "0 0 20px rgba(34,197,94,0)",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              Pet Simulator 99
            </motion.h1>
            <p className="text-gray-400 text-xl">Made by Maska</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="w-full max-w-xl"
          >
            <div className="relative group">
              <Input
                type="text"
                placeholder={apiKey ? "Enter pet name (e.g. Titanic cat)" : "Please set API key in settings first"}
                value={petName}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={!apiKey}
                className="w-full h-14 px-6 text-lg bg-black/30 border-green-500/20 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-green-500/40 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] focus:border-green-500/50 focus:ring-green-500/50 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !apiKey}
                className="absolute right-2 top-2 h-10 px-4 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg backdrop-blur-sm transition-all duration-300 hover:bg-green-500/30 hover:scale-105 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-green-500/20 disabled:hover:shadow-none"
              >
                {loading ? <ReloadIcon className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </Button>
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-black/80 border border-green-500/20 rounded-xl backdrop-blur-sm overflow-hidden">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 cursor-pointer hover:bg-green-500/20 transition-colors duration-200"
                      onClick={() => handleSuggestionClick(suggestion.Name)}
                    >
                      {cleanPetName(suggestion.Name)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="destructive"
                  className="w-full max-w-xl bg-red-500/10 border-red-500/50 backdrop-blur-sm"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {apiResponse?.processedData && !showRawResponse && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl"
              >
                <Card className="bg-black/30 border-green-500/20 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-green-300 bg-clip-text text-transparent">
                      {petName.replace(/-/g, " ")}
                    </CardTitle>
                    <p className="text-gray-400">{apiResponse.processedData.source}</p>
                  </CardHeader>
                  <div className="px-6 pb-4">
                    <Button
                      className="w-full bg-red-500/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      onClick={() =>
                        window.open(
                          `https://www.petsimstats.com/pets/${petName.toLowerCase().replace(/ /g, "-")}`,
                          "_blank",
                        )
                      }
                    >
                      Pets Stats
                    </Button>
                  </div>
                  <div className="px-6 pb-6">
                    <Button
                      className="w-full bg-purple-500/20 hover:bg-purple-601/30 text-purple-400 border border-purple-500/50 rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(255, 0, 242, 0.52)]"
                      onClick={() => {
                        let result = activeVariant.toLowerCase().replace(/ /g, "+").replace(/normal/g, "");
                        if (result) {
                          result += "+";
                        }
                        console.log(`https://petsimulatorvalues.com/details.php?Name=${result}${petName.toLowerCase().replace(/ /g, "+")}`); // Logs petName to the console
                        window.open(
                          `https://petsimulatorvalues.com/details.php?Name=${result}${petName.toLowerCase().replace(/ /g, "+")}`,
                          "_blank"
                        );
                      }}
                    >
                      Cosmic Value
                    </Button>
                  </div>

                  <CardContent>
                    <Tabs value={activeVariant} onValueChange={setActiveVariant} className="mb-6">
                      <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-black/20 p-1">
                        {variants.map((variant) => (
                          <TabsTrigger
                            key={variant}
                            value={variant}
                            className="border border-green-500/20 text-gray-400 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 hover:text-green-400 transition-all duration-300"
                          >
                            {variant}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="flex flex-col items-center">
                        <motion.div
                          key={activeVariant}
                          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ duration: 0.5 }}
                          className="relative"
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${variantStyles[activeVariant]} blur-lg opacity-50 animate-glow`}
                          ></div>
                          <div
                            className={`relative overflow-hidden rounded-lg ${activeVariant.includes("shiny") ? "shiny-effect" : ""} ${
                              activeVariant.includes("rainbow") ? "rainbow-border" : ""
                            } ${activeVariant.includes("golden") ? "golden-border" : ""}`}
                          >
                          <img
                            src={apiResponse.processedData.imageUrl.startsWith('https://www.petsimstats.com/') 
                              ? apiResponse.processedData.imageUrl 
                              : `https://www.petsimstats.com${apiResponse.processedData.imageUrl}`}
                            alt={petName}
                            className="w-64 h-64 object-contain rounded-lg border-4 border-white/10 shadow-lg relative z-10"
                          />

                          </div>
                        </motion.div>
                      </div>

                      <div className="space-y-6">
                        {["current", "predicted"].map((type) => {
                          const data = getVariantData(activeVariant)
                          if (!data) return null

                          return (
                            <motion.div
                              key={`${type}-${activeVariant}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <h3 className="text-xl font-semibold mb-3 border-b border-gray-700 pb-2 capitalize text-white">
                                {type === "current" ? "Current Value" : "Predicted Value (in the next 7 days)"}
                              </h3>
                              <div className="grid grid-cols-2 gap-3 text-lg text-white">
                                <div className="capitalize font-medium">{activeVariant}:</div>
                                <div className="font-bold">
                                  ${formatValue(data[type])}
                                  {type === "predicted" && (
                                    <span className="text-sm ml-2 text-gray-400">
                                      {data.predicted.match(/$$.*$$/)?.[0] || ""}
                                    </span>
                                  )}
                                </div>
                                {type === "current" && (
                                  <>
                                    <div className="font-medium">Recommendation:</div>
                                    <div
                                      className={`font-medium ${
                                        data.recommendation === "buy" ? "text-neon-green" : "text-neon-pink"
                                      }`}
                                    >
                                      {data.recommendation}
                                    </div>
                                    <div className="font-medium">Exists:</div>
                                    <div>
                                      {data.NumberExists}
                                    </div>
                                    <div className="font-medium">Cosmic Value:</div>
                                    <div>
                                      {data.CosmicValue}
                                    </div>
                                    <div className="font-medium">Cosmic Demand:</div>
                                    <div>
                                      {data.CosmicDemand}
                                    </div>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="fixed bottom-4 right-4">
              <Settings />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>API Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <Button
          onClick={() => window.open("https://www.discord.gg/distinct", "_blank")}
          className="bg-blue-500/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/50 rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        >
          <Discord className="h-4 w-4 mr-2" />
          Join the Discord server
        </Button>
        <Button
          onClick={() => window.open("https://example.com", "_blank")}
          className="bg-red-500/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
        >
          <Youtube className="h-4 w-4 mr-2" />
          Tutorial
        </Button>
      </div>

      <style jsx global>{`
  @keyframes rainbow {
    0% { border-color: red; }
    14% { border-color: orange; }
    28% { border-color: yellow; }
    42% { border-color: green; }
    57% { border-color: blue; }
    71% { border-color: indigo; }
    85% { border-color: violet; }
    100% { border-color: red; }
  }

  .rainbow-border {
    animation: rainbow 5s linear infinite;
  }

  @keyframes golden-shine {
    0% { border-color: #ffd700; }
    50% { border-color: #ffec8b; }
    100% { border-color: #ffd700; }
  }

  .golden-border {
    animation: golden-shine 2s ease-in-out infinite;
  }
`}</style>
    </div>
  )
}

