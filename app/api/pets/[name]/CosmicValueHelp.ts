// Function to format the pet name (converting hyphens to plus signs)
export function formatPetNameForURL(petName: string): string {
    return petName.replace(/-/g, '+');  // Replace all hyphens with plus signs
}

// Function to fetch cosmic data from the website
export async function cosmicsearch(petName: string): Promise<string | null> {
    try {
        // Format the pet name for URL
        const formattedPetName = formatPetNameForURL(petName);
        // Make the fetch request to get the cosmic data
        const response = await fetch(`https://petsimulatorvalues.com/values.php?category=all&search=${formattedPetName}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Define const maska and store the cosmic data
        const maska = await response.text();
        
        // Return the cosmic data as maska
        return maska;

    } catch (error) {
        console.error('Error fetching cosmic data:', error);
        return null;  // Return null if there's an error
    }
}
