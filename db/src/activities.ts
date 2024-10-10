import https from 'https';
import 'dotenv/config';

interface GoogleSearchResult {
  title: string;
  link: string;
  // Add other properties as needed
}

interface GoogleSearchResponse {
  items: GoogleSearchResult[];
  // Add other properties as needed
}

const GOOGLE_API_KEY: string | undefined = process.env.GOOGLE_API_KEY;
const PLADS_I_HAVNEN_SEARCH_ID: string = process.env.PLADS_I_HAVNEN_SEARCH_ID || '';

/*
<script async src="https://cse.google.com/cse.js?cx=e72c8af59a9e74031">
</script>
<div class="gcse-search"></div>
*/

const googleSearch = (query: string): Promise<GoogleSearchResult[]> => {
  console.log('Searching for:', query);
  return new Promise((resolve, reject) => {
    console.log('Searching for:', query);
    const apiKey = GOOGLE_API_KEY;
    const searchEngineId: string = PLADS_I_HAVNEN_SEARCH_ID;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;

    console.log('URL:', url);
    https.get(url, (res) => {
      console.log('Response:', res.statusCode);
      let data = '';

      res.on('data', (chunk) => {
        console.log('Data:', chunk);
        data += chunk;
      });

      res.on('end', () => {
        console.log('Data:', data);
        try {
          const parsedData: GoogleSearchResponse = JSON.parse(data);
          resolve(parsedData.items || []);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });
  });
};

const searchHavnAktiviteter = async (havnNavn: string): Promise<void> => {
  const query = `${havnNavn} aktiviteter`;
  try {
    const searchResults = await googleSearch(query);
    console.log('Search results:', searchResults.length);
    // Gennemgå resultaterne for yderligere behandling
    searchResults.forEach((result: GoogleSearchResult) => {
      console.log(result.title, result.link);
    });
  } catch (error) {
    console.error('Fejl ved søgning:', error);
  }
};

// Eksempel på at udføre en søgning
searchHavnAktiviteter('Middelfart Havn');