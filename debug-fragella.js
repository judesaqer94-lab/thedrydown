/**
 * Debug - see raw Fragella data for Ex Nihilo
 * Run: node debug-fragella.js
 */

const FRAGELLA_KEY = 'b7ae7aa0ceff69d3c279218e1bbebd29cf3605e1b9b825500152b58492fb9ab3';

async function main() {
  const res = await fetch(
    `https://api.fragella.com/api/v1/fragrances?search=${encodeURIComponent('Ex Nihilo Fleur Narcotique')}`,
    { headers: { 'x-api-key': FRAGELLA_KEY } }
  );
  const data = await res.json();
  
  if (data && data.length > 0) {
    // Show ALL fields from first result
    console.log('Raw Fragella response (first result):');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No results');
  }
}

main();
