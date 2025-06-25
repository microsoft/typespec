// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.union;

import authentication.utils.KeyCredentialPolicy;
import authentication.utils.OAuthBearerTokenAuthenticationPolicy;
import io.clientcore.core.credentials.KeyCredential;
import io.clientcore.core.credentials.oauth.AccessToken;
import io.clientcore.core.credentials.oauth.OAuthTokenRequestContext;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;

class UnionClientTest {

    @Test
    void validKey() {
        UnionClient client = new UnionClientBuilder()
            .addHttpPipelinePolicy(new KeyCredentialPolicy("x-ms-api-key", new KeyCredential("valid-key")))
            .buildClient();
        client.validKey();
    }

    @Test
    void validToken() {
        UnionClient client = new UnionClientBuilder().addHttpPipelinePolicy(new OAuthBearerTokenAuthenticationPolicy(
            tokenRequestContext -> new AccessToken("https://security.microsoft.com/.default",
                OffsetDateTime.now().plusHours(1)),
            new OAuthTokenRequestContext().addScopes("https://security.microsoft.com/.default"))).buildClient();
        client.validToken();
    }
}
