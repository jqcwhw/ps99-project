// Define a type for the pet object
interface Pet {
  configData?: {
    id: string;
    sh?: boolean;
    pt?: number;
  };
  value: string;
}

// Define a type for the API response
interface ApiResponse {
  data?: Pet[];
}

export function formatPetName(petName: string): string {
  return petName
    .split('-') // Split by the dash
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter and make others lowercase
    .join(' '); // Join back with a space
}

// Initialize the array to store formatted pet data messages
export let htmloffi: string[] = [];  // Export the htmloffi array

// Function to search for a pet by name
export async function searchPet(petName: string): Promise<void> {
  try {
    // Clear the htmloffi array before starting the new search
    htmloffi = [];  // Reset the array

    // Format the pet name
    const formattedPetName = formatPetName(petName);
    console.log(`Formatted pet name: ${formattedPetName}`);

    // Make the API request
    const response = await fetch('https://ps99.biggamesapi.io/api/exists');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the response as JSON
    const data: ApiResponse = await response.json();
    console.log('API Response:', data); // Log the full response to inspect its structure

    // Check if the response is an array or if it's wrapped in another object
    const petsData = Array.isArray(data.data) ? data.data : [];

    // Filter the pets data to find the matching formatted pet name
    const matchingPets = petsData.filter((pet: Pet) => pet.configData?.id === formattedPetName);

    // Loop through each matching pet and create the formatted string
    matchingPets.forEach((pet: Pet) => {
      const { configData, value } = pet;
      const petName = configData?.id;

      let output = '';

      // Check for conditions and generate the appropriate message
      if (!configData?.sh && !configData?.pt) {
        output = `${petName} : ${value} exists`;
      } else if (!configData?.sh && configData?.pt === 1) {
        output = `Golden ${petName} : ${value} exists`;
      } else if (!configData?.sh && configData?.pt === 2) {
        output = `Rainbow ${petName} : ${value} exists`;
      } else if (configData?.sh && !configData?.pt) {
        output = `Shiny ${petName} : ${value} exists`;
      } else if (configData?.sh && configData?.pt === 1) {
        output = `Shiny Golden ${petName} : ${value} exists`;
      } else if (configData?.sh && configData?.pt === 2) {
        output = `Shiny Rainbow ${petName} : ${value} exists`;
      }

      // Push the formatted string into the htmloffi array
      htmloffi.push(output);
    });

    // Log the htmloffi array after collecting all the results
    console.log('htmloffi:', htmloffi);

  } catch (error) {
    console.error('Error fetching pet data:', error);
  }
}
