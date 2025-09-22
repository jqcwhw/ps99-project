import { NextResponse } from "next/server";
import { searchPet, htmloffi } from './pet-search';
import { cosmicsearch } from './CosmicValueHelp';

export async function GET(request: Request, { params }: { params: { name: string } }) {
  const petName = params.name;
  console.log(petName);

const petExists = await searchPet(petName);
await searchPet(petName);
console.log(htmloffi);
console.log(petExists);

async function fetchPetCosmicData(petName: string) {
  // Call cosmicsearch to get cosmic data and store it in maska
  const maska = await cosmicsearch(petName);

  if (maska) {
      console.log('Cosmic Data:', maska);
      return maska;  // Return the cosmic data for further use
  } else {
      console.log('No cosmic data found for the pet.');
      return null;  // Return null if no data is found
  }
}

// Call the function with the pet name 'pet-name' and store the result in resultoffi
const resultoffi = await fetchPetCosmicData(petName);  // Replace 'pet-name' with the actual name


const xxxxx = htmloffi;

  if (!petName) {
    return NextResponse.json({ error: "Pet name is required" }, { status: 400 })
  }

  const apiKey = request.headers.get("X-API-Key")

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 })
  }

  try {
    // Fetch HTML from petsimstats.com
    const response = await fetch(`https://www.petsimstats.com/pets/${petName}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Pet not found on petsimstats.com" }, { status: 404 })
    }
    
    const html = await response.text();
    

    // Call Together AI API with more specific instructions
    const aiResponse = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages: [
          {
            role: "user",
            content: `
Do not use '''json and ''' at the end and the start, just give the json as a text
DO NOT USE ANY OF THE VALUE IN THE JSON EXAMPLE
Make sure on the Cosmic Value you use the correct value and not a random value or a value that's not the real one by cosmic
note: Cosmic demand is always on 10 so ex: 1/10 or 5/10... etc, it look like that on the code: "                     <span class="float-left pt-2">Demand</span>
                                          <span class="float-right pt-2" style="color: yellow;">5/10</span>"
if Cosmic value that you see is the same as the example you are wrong, it can't be the same number as the example
Cosmic value and current value have almost 0% chance to be the same number. (Notes: i never said it was impossible but make sure to verify that the value is really the same before adding them so you make sure that you don't put the wrong current value)
Make sure to enter the good Cosmic Value, you can't create them yourself (use the cosmic value html data). (NOTES: USE only this cosmic value for the Cosmic Value and not for any of the other things in the json !)
If the value didn't changed for a long time, that mean the pet didn't got sold so the actual value isn't the current one of it
If the Normal value is Already high (ex: if normal is: 30b and the golden is 39b then the golden doesn't have any problems because the value is already high and also the max cap that a player can have is 100b)
Make sure if a number is under a thousands then don't add ".000" at the end and also there's no letter for it.
Same with Predicted value, if it's not in the thousands then don't add ".000" at the end and there's no letter for it
Make sure for prediction that it make sense because a week is alot so value of pets can't go to like 116m to only 116 with + 0.002k it would make no sense. also if you say ex: +75m, make sure the value you gave on predicted is rlly 75m more then the current value
You are a specialized HTML parser for Pet Simulator X data. Your task is to analyze pet information and provide accurate value predictions and recommendations. Follow these detailed instructions:

Important Notes:

Some pets do not have certain variants like Golden, Shiny, or Rainbow. Only include those variants if they exist for the pet.
If a variant doesn’t exist (e.g., no Golden version), do not include it.
Ensure all data is accurate, even if some prices seem unusual compared to others (e.g., billions should stay in billions even if prices are inconsistent).
1. DATA EXTRACTION
Url shoud look like this: /cache/pet-simulator-99/images/14976470932.png (14976470932 won't be the same)
Extract the image URL from image tags or relevant paths.
Identify source information (event name, location, or origin).
Parse all numerical values, removing currency symbols and formatting.
Note: Make sure you capture all data accurately. I’ve noticed issues where values were incorrectly reported as "0" when they actually had a value (e.g., Shiny or Rainbow variants).

2. VALUE PROCESSING
DO NOT LOOK at the Cosmic value for that, use the html analyse for that value
check on variant to see all the variant existing, if one doesnt exist then all data for it will be "N/A"
all variants will be included in the giving data under

Format all numerical values as follows:
if it's under a k just say ex: 55 and not "55.000"
Use "k" for thousands (e.g., 197k).
Use "m" for millions (e.g., 2.543m).
Use "b" for billions (e.g., 1.234b).
Always use exactly 3 decimal places for values (e.g., 1.234m).
When showing a value change, do not display small changes like "0.001b" — instead, use "1m".

3. CURRENT VALUES ANALYSIS

For each variant (Normal, Golden, Rainbow, Shiny, Shiny Golden, Shiny Rainbow):
Extract the current price for each variant.
Convert the prices to the standardized format (k, m, b).
Compare prices to ensure the correct relationships (e.g., Normal < Golden < Rainbow).
Flag unusual price relationships, such as if a higher-tier variant has a lower price than a lower-tier variant.

4. PREDICTION SYSTEM
Notes: if the pet value didn't changed for a long time, then make a value close to the cosmic value one (only if it been 3 or more days the value didn't change)
Notes: don't forget that if value is 105 and you put on data 105.000 then the value is still 105 (if on data value doesnt have "k", "m", "b" that mean it's under a thousands so you can't say +0.126k for smthing that worth only 105 because you can't sell or buy smthing for 105.126 bc it would be 105)

Very important: Look at the Demand on cosmic value because lower is the demand then that mean it won't go up of alot and can also can go down by alot

Predict the value for the pet variants after 7 days based on:

Historical price trends (use the last 10 updates).
Variant relationships (normal vs. golden vs. rainbow, etc.).
Market volatility.
Recent game updates or events.
Seasonal patterns and short-term trends.
Price momentum and rate of change.
Similar pets’ performance.
Market demand signals and update cycles.
Important: More valuable pets will see higher increases in value, sometimes in millions, billions, or thousands.

5. RECOMMENDATION 

Provide recommendations based on these criteria:
Notes: Look at the cosmic value demand if possible but look more at the html analyse for a more accurate answer

"VALUE NOT NORMAL AND SHOULD BE HIGHER" when:
- A higher tier variant has LOWER value than any lower tier variant

Pet variants follow this strict value progression (from lowest to highest):
1. Normal
2. Golden
3. Rainbow
4. Shiny
5. Shiny Golden
6. Shiny Rainbow
Based on this hierarchy:

Examples:
- Golden value < Normal value
- Rainbow value < Golden value
- Shiny value < Rainbow value
- Shiny Golden value < Shiny value
- Shiny Rainbow value < Shiny Golden value
(but it can also change if the pet have more or less exists)
"VALUE GLITCH" when:
- A variant's value is EXTREMELY different from expected progression
Examples:
- Rainbow value is 2x or more than Golden value (but it can also change if the pet have more or less exists)
- Shiny value is 1.5x to 50x or more than Rainbow value (but it can also change if the pet have more or less exists)
- Any variant shows impossible or illogical values
- Sudden extreme value changes that break typical ratios
"BUY" when:
- Price shows consistent upward trend
- Value is stable with potential growth
- Market indicators suggest increased demand
- Similar pets show positive performance
"WAIT" when:
- Price shows downward trend
- High market volatility
- Recent significant price drops
- Uncertain market conditions

6. NUMBER OF EXISTING PETS

Provide the number of existing variants for each pet. If a variant doesn't exist, do not include it.
Example: If there’s no Golden or Shiny version, only include the variants that exist.

7. Cosmic Value
Notes: you can only use this data for the cosmic value and not for any other stuff
Using the cosmic value that i gave you, give the value that the website give to it (not the current one). (different for each variants)
If there's not one of the variant or value is "SOON" then say "N/A"
to help you, on the cosmic value html data:....
you will see this:                                 
data-name="Huge Cat" / Pet variant
data-value="2.05B" / Cosmic Prices
Notes: Make sure the value is the good cosmic one because you can't create one yourself, also the value form the example is just an example so don't use them.

8. Cosmic Demand
note: Cosmic demand is always on 10 so ex: 1/10 or 5/10... etc
Look at the Cosmic Value data
If there's not one of the variant or demand is "SOON" then say "N/A"
note: Cosmic demand is always on 10 so ex: 1/10 or 5/10... etc, it look like that on the code: "                     <span class="float-left pt-2">Demand</span>
                                          <span class="float-right pt-2" style="color: yellow;">5/10</span>"


Return the data as a JSON object in this exact format:

Do not add any extra text or formatting.
DO NOT USE ANY OF THE VALUE IN THE JSON EXAMPLE
Example output (This is just an exemple so don't take value from there):

json

{
  "imageUrl": "/path/to/image.png",
  "source": "From X location or event",
  "currentValues": {
    "normal": "100.000m",
    "golden": "200.000m",
    "rainbow": "300.000m",
    "shiny": "310.000m",
    "shiny golden": "500.000m",
    "shiny rainbow": "750.000m"
  },
  "predictedValues": {
    "normal": "100.200m (+200k)",
    "golden": "200.500m (+500k)",
    "rainbow": "299.000m (-1.000m)",
    "shiny": "315.000m (+15.000m)",
    "shiny golden": "305.500m (-194.500m)",
    "shiny rainbow": "752.000m (+2.000m)"
  },
  "recommendations": {
    "normal": "buy",
    "golden": "Value not normal and should be higher",
    "rainbow": "wait",
    "shiny": "buy",
    "shiny golden": "wait",
    "shiny rainbow": "buy"
  },
  "NumberExists": {
    "normal": "121.532k",
    "golden": "51.434k",
    "rainbow": "7.013k",
    "shiny": "1k"
  },
    "CosmicValue": {
    "normal": "105.000m",
    "golden": "201.000m",
    "rainbow": "351.000m",
    "shiny": "370.000m",
    "shiny golden": "550.000m",
    "shiny rainbow": "751.000m"
  },
    "CosmicDemand": {
    "normal": "5/10",
    "golden": "5/10",
    "rainbow": "7/10",
    "shiny": "1/10",
    "shiny golden": "6/10",
    "shiny rainbow": "10/10"
  }
}
Key Points:

Always use the standardized value format (k, m, b).
Ensure the price relationships are correct and flag any anomalies.
Predict the future value after 7 days, using historical data and trends. (it can't be 0.000b or 0.000m it make no sense, value will increase or downgrade it sure by alot)
Provide recommendations based on market conditions and trends.
Report the number of existing pets for each variant, but only include those that exist.

data:

The pets exist:
${xxxxx}

also:

HTML to analyze (with all values from other days too):
${html}

cosmic value:
${resultoffi}

          `,
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error("AI API error:", errorText)
      return NextResponse.json({ error: "Failed to analyze pet data" }, { status: 500 })
    }
    const aiData = await aiResponse.json()

    if (!aiData?.choices?.[0]?.message?.content) {
      return NextResponse.json({ error: "Invalid response from AI" }, { status: 500 })
    }

    const content = aiData.choices[0].message.content.trim()
    console.log(content);
    try {
      const parsedData = JSON.parse(content)

      // Validate the parsed data has required fields
      if (!parsedData.currentValues || Object.keys(parsedData.currentValues).length === 0) {
        return NextResponse.json({ error: "No value data found for this pet" }, { status: 404 })
      }

      if (!parsedData.imageUrl || !parsedData.source) {
        return NextResponse.json({ error: "Incomplete pet data received" }, { status: 500 })
      }

      return NextResponse.json({
        rawResponse: content,
        processedData: parsedData,
      })
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json(
        {
          error: "Invalid data format received from AI",
          rawResponse: content,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing pet data:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process pet data",
      },
      { status: 500 },
    )
  }
}

