# OneSong Integration Guides

## Spotify Integration
```typescript
// 1. Configure Spotify OAuth
const spotifyAuth = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `${process.env.APP_URL}/auth/spotify/callback`
};

// 2. Handle Authentication
async function handleSpotifyAuth() {
  const authUrl = await getSpotifyAuthUrl();
  // Redirect user to authUrl
}

// 3. Search and Playback
const spotifyApi = new SpotifyWebApi(spotifyAuth);
await spotifyApi.searchTracks(query);
```

## Stripe Integration
```typescript
// 1. Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 2. Handle Payments
async function processPayment(amount: number) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd'
  });
  return paymentIntent;
}

// 3. Configure Webhooks
app.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  // Handle event
});
``` 