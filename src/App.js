import { useEffect, useState } from "react";

const CLIENT_ID = "686439120217-83sbckt02u93occvv4fc7o6co323f3bv.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

function App() {
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    // wait for window.google to exist before init
    const initializeGsi = () => {
      if (window.google && !tokenClient) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.access_token) {
              setAccessToken(response.access_token);
              loadGapiClient(response.access_token);
            }
          },
        });
        setTokenClient(client);
      }
    };

    // Try immediately and also on a short timeout (sometimes script loads late)
    if (window.google) {
      initializeGsi();
    } else {
      // If window.google not yet loaded, try again after short delay
      const interval = setInterval(() => {
        if (window.google) {
          initializeGsi();
          clearInterval(interval);
        }
      }, 100);
      // clean up
      return () => clearInterval(interval);
    }
  }, [tokenClient]);

  const loadGapiClient = (accessToken) => {
    window.gapi.load("client", () => {
      window.gapi.client.setToken({ access_token: accessToken });
      window.gapi.client.load("gmail", "v1", () => {
        listUnreadEmails();
      });
    });
  };

  const listUnreadEmails = () => {
    window.gapi.client.gmail.users.messages
      .list({
        userId: "me",
        q: "is:unread",
      })
      .then((response) => {
        console.log("Unread Messages:", response.result.messages);
      });
  };

  const handleLogin = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      alert("Google API not loaded yet, please wait.");
    }
  };

  return (
    <div>
      <h1>Gmail Unread Reader</h1>
      <button onClick={handleLogin}>Sign In with Google</button>
    </div>
  );
}

export default App;
