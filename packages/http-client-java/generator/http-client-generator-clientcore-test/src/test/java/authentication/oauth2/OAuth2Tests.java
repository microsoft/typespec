// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.oauth2;

import authentication.utils.OAuthBearerTokenAuthenticationPolicy;
import io.clientcore.core.credentials.oauth.AccessToken;
import io.clientcore.core.credentials.oauth.OAuthTokenRequestContext;
import io.clientcore.core.http.models.HttpResponseException;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class OAuth2Tests {

    @Disabled("OAuth2 is not supported")
    @Test
    public void testValid() {
        OAuth2Client client = new OAuth2ClientBuilder()
            .addHttpPipelinePolicy(new OAuthBearerTokenAuthenticationPolicy(
                tokenRequestContext -> new AccessToken("token", OffsetDateTime.now().plusHours(1)),
                new OAuthTokenRequestContext().addScopes("https://security.microsoft.com/.default")))
            .buildClient();

        client.valid();
    }

    @Disabled("OAuth2 is not supported")
    @Test
    public void testInvalid() {
        OAuth2Client client = new OAuth2ClientBuilder().buildClient();

        // assert HttpResponseException
        Assertions.assertThrows(HttpResponseException.class, client::invalid);
    }
}
