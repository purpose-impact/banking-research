export default function handler(req, res) {
  res.status(200).json({
    clientIdPresent: !!process.env.X_CLIENT_ID,
    secretPresent: !!process.env.X_CLIENT_SECRET,
    redirectUri: process.env.X_REDIRECT_URI
  });
}
