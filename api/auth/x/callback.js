function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

async function getJson(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;

    const savedState = getCookie(req, "x_oauth_state");
    const codeVerifier = getCookie(req, "x_code_verifier");

    if (!code || !state) {
      return res.status(400).json({ error: "Missing code or state" });
    }

    if (state !== savedState) {
      return res.status(400).json({ error: "Invalid OAuth state" });
    }

    if (!codeVerifier) {
      return res.status(400).json({ error: "Missing code verifier" });
    }

    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    const redirectUri = process.env.X_REDIRECT_URI;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(400).json({
        error: "Token exchange failed",
        details: tokenData
      });
    }

    const accessToken = tokenData.access_token;

    const me = await getJson("https://api.twitter.com/2/users/me", accessToken);

    const userId = me.data.id;

    const bookmarks = await getJson(
      `https://api.twitter.com/2/users/${userId}/bookmarks?max_results=10&tweet.fields=created_at,author_id,public_metrics`,
      accessToken
    );

    return res.status(200).json({
      message: "X connected successfully",
      user: me.data,
      bookmarks
    });
  } catch (error) {
    return res.status(500).json({
      error: "Callback failed",
      details: error.message
    });
  }
}
