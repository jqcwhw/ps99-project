import { NextResponse } from "next/server"

// Mock data - in production this would come from a real database/API
const mockPetData = {
  "titanic-nutcracker-cat": {
    name: "Titanic Nutcracker Cat",
    source: "The Forever Pack",
    image: "/placeholder.svg?height=200&width=200",
    currentRAP: 5840080284,
    analytics: {
      tradeVolume: "Average / Often",
      dayChange: "Low data",
      weekHigh: 6025997130,
      weekLow: 5756402427,
    },
    priceHistory: [
      { date: "2024-01-01", normal: 5840080284, golden: 5997671962, rainbow: 10714708390 },
      { date: "2024-01-02", normal: 5900000000, golden: 6100000000, rainbow: 10800000000 },
    ],
  },
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const petName = url.pathname.split("/").pop()

  if (!petName) {
    return NextResponse.json({ error: "Pet name is required" }, { status: 400 })
  }

  const pet = mockPetData[petName.toLowerCase()]

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 })
  }

  return NextResponse.json(pet)
}

