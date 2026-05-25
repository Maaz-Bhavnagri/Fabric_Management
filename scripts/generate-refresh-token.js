require('dotenv').config({ path: '.env' });
const { google } = require('googleapis');
const readline = require('readline');

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = 'http://localhost:3000/api/auth/google/callback';

if (!client_id || !client_secret) {
  console.error('❌ Error: Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

const scopes = ['https://www.googleapis.com/auth/drive'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Required to get a refresh token
  scope: scopes,
  prompt: 'consent',     // Force consent screen to ensure refresh token is returned
});

console.log('\n--- 1. VISIT THIS URL IN YOUR BROWSER ---');
console.log(authUrl);
console.log('\n--- 2. LOG IN AND "ALLOW" PERMISSIONS ---');
console.log('--- 3. AFTER REDIRECT, COPY THE "code" FROM THE URL BAR ---');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nPaste the code here: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('❌ Error retrieving access token:', err.message);
      return;
    }
    console.log('\n--- SUCCESS! ADD THIS TO YOUR .env ---');
    console.log(`GOOGLE_REFRESH_TOKEN=${token.refresh_token}`);
    console.log('\n--------------------------------------');
  });
});
