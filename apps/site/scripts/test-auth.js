import { fetchGoogleSheetValues } from "@bdc/google-api";

const rows = await fetchGoogleSheetValues(
  process.env.SHEET_ID,
  "Publications",
  { credentialsBase64: process.env.GOOGLE_CREDENTIALS_BASE64 }
);

console.log("Success! First row:", rows[0]);