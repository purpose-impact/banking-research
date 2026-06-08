import crypto from "crypto";

function base64UrlEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export default async function handler(req, res) {
  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      error: "Missing X_CLIENT_ID or X_REDIRECT_URI"
    });
  }

  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));

  const codeChallenge = base64UrlEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );

  const state = base64UrlEncode(crypto.randomBytes(16));

  const scope = [
    "tweet.read",
    "users.read",
    "offline.access"
  ].join(" ");

  res.setHeader(
    "Set-Cookie",
    [
      `x_code_verifier=${codeVerifier}; HttpOnly; Secure; Path=/; Max-Age=600; SameSite=Lax`,
      `x_oauth_state=${state}; HttpOnly; Secure; Path=/; Max-Age=600; SameSite=Lax`
    ]
  );

  const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  /*
  return res.status(200).json({
  authUrl: authUrl.toString(),
  redirectUri: process.env.X_REDIRECT_URI,
  hasClientId: !!process.env.X_CLIENT_ID,
});
*/
  

  return res.redirect(authUrl.toString());
}
