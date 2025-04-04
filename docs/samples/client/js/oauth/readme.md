# Authenticating with OAuth2TokenCredential

This readme demonstrates how to implement `OAuth2TokenCredential` using popular third-party authentication libraries and integrate it with the generated TypeSpec client. It provides examples for both Authorization Code Flow using `@auth0/auth0-spa-js` and Client Credentials Flow using `auth0`.

## Table of contents

- [Creating OAuth2 Credential](#creating-oauth2-credential-with-third-party-library)
  - [Example with `@auth0/auth0-spa-js`](#authorization-code-flow-with-auth0auth0-spa-js)
  - [Example with `auth0`](#client-credential-flow-with-auth0)

## Create OAuth2 Credential

#### Authorization Code Flow with `@auth0/auth0-spa-js`

The following sample illustrates using `@auth0/auth0-spa-js` to acquire the access token for authorization code flow. The credential created is passed into the constructor of the `SampleTypeSpecClient` and the client will set the appropriate authentication policy using the information provided. The method `getOAuth2Token` will be called to get the token to authenticate the request.

```ts
import { OAuth2TokenCredential, AuthorizationCodeFlow } from "@typespec/ts-http-runtime";
import { Auth0Client } from "@auth0/auth0-spa-js";
import { SampleTypeSpecClient } from "SampleTypeSpecSDK";

// Create an OAuth2 credential that implements authorization code flow
const credential: OAuth2TokenCredential<AuthorizationCodeFlow> = {
  async getOAuth2Token(flows: AuthorizationCodeFlow[]) {
    const { authorizationUrl, scopes } = flows[0];
    try {
      const auth0Client = new Auth0Client({
        domain: authorizationUrl,
        clientId: "SampleClientID",
        authorizationParams: {
          redirect_uri: "https://example.com/redirect",
          audience: "SampleAudience",
        },
      });

      const token = await auth0Client.getTokenSilently({
        authorizationParams: {
          scope: scopes?.join(" "),
        },
      });

      return token;
    } catch (error) {
      console.error("Failed to retrieve token from Auth0", error);
      throw new Error("Token retrieval failed");
    }
  },
};

// Authentication shemes that the services allow
const authorizationCodeScheme: AuthScheme = {
  kind: "oauth2",
  flows: [
    {
      kind: "authorizationCode",
      authorizationUrl: "https://example.com/authorize",
      tokenUrl: "https://example.com/token",
      scopes: ["sampleScope1", "sampleScope2"],
    },
  ],
};

// Pass the credential to the client and use the client to make a request to the service
const client = new SampleTypeSpecClient(credential, {
  authSchemes: [authorizationCodeScheme],
});
```

#### Client Credential Flow with `auth0`

The following sample illustrates using `auth0` to acquire the access token for authorization code flow. The credential created is passed into the constructor of the `SampleTypeSpecClient` and the client will set the appropriate authentication policy using the information provided. The method `getOAuth2Token` will be called to get the token to authenticate the request.

```ts
import { OAuth2TokenCredential, ClientCredentialsFlow } from "@typespec/ts-http-runtime";
import { AuthenticationClient } from "auth0";
import { SampleTypeSpecClient } from "SampleTypeSpecSDK";

// Create an OAuth2 credential that implements authorization code flow
const credential: OAuth2TokenCredential<ClientCredentialsFlow> = {
  async getOAuth2Token(flows: ClientCredentialsFlow[]) {
    const { tokenUrl } = flows[0];
    const option = {
      domain: tokenUrl,
      clientId: "SampleClientID",
      clientSecret: "SampleClientSecret",
    };
    const client = new AuthenticationClient(option);
    const response = await client.oauth.clientCredentialsGrant({ audience: "SampleAudience" });
    return response.data.access_token;
  },
};

// Authentication shemes that the services allow
const authorizationCodeScheme: AuthScheme = {
  kind: "oauth2",
  flows: [
    {
      kind: "clientCredentials",
      tokenUrl: "https://example.com/token",
      scopes: ["sampleScope1", "sampleScope2"],
    },
  ],
};

// Pass the credential to the client and use the client to make a request to the service
const client = new SampleTypeSpecClient(credential, {
  authSchemes: [authorizationCodeScheme],
});
```
