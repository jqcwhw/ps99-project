"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SettingsIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useApiKey } from "../contexts/ApiKeyContext"

export function Settings() {
  const { apiKey, setApiKey } = useApiKey()
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    localStorage.setItem("togetherApiKey", apiKey)
    setApiKey(apiKey)
    setIsOpen(false)
  }

  const handleGetApiKey = () => {
    window.open("https://api.together.ai/settings/api-keys", "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-black/30 border-green-500/20 text-green-400 backdrop-blur-sm
             transition-all duration-300 hover:bg-green-500/20 hover:scale-110
             hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:border-green-500/50"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="bg-black/80 border-green-500/20 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-green-400">API Settings</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="apiKey" className="text-right text-gray-400">
                    API Key
                  </label>
                  <Input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="col-span-3 bg-black/30 border-green-500/20 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  onClick={handleGetApiKey}
                  variant="outline"
                  className="bg-black/30 border-green-500/20 text-green-400 hover:bg-green-500/20"
                >
                  Get API Key
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

