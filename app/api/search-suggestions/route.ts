import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query } = body

    const response = await fetch("https://petsimulatorvalues.com/search_suggestions.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, category: "all", variant: "" }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in search suggestions API route:", error)
    return NextResponse.json({ error: "Failed to fetch search suggestions" }, { status: 500 })
  }
}

