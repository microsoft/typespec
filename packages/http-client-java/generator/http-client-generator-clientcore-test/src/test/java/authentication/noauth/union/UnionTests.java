// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.noauth.union;

import authentication.utils.OAuthBearerTokenAuthenticationPolicy;
import io.clientcore.core.credentials.oauth.AccessToken;
import io.clientcore.core.credentials.oauth.OAuthTokenRequestContext;
import io.clientcore.core.http.models.HttpResponseException;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class UnionTests {

    private static final String EXPECTED_TOKEN = "https://security.microsoft.com/.default";

    private static UnionClientBuilder createClientBuilder() {
        return new UnionClientBuilder();
    }

    private static OAuthBearerTokenAuthenticationPolicy createBearerPolicy() {
        return new OAuthBearerTokenAuthenticationPolicy(
            tokenRequestContext -> new AccessToken(EXPECTED_TOKEN, OffsetDateTime.now().plusHours(1)),
            new OAuthTokenRequestContext().addScopes(EXPECTED_TOKEN));
    }

    @Test
    public void validNoAuthAllowsRequestsWithoutAuthentication() {
        UnionClient client = createClientBuilder().buildClient();

        Assertions.assertDoesNotThrow(() -> client.validNoAuth());
    }

    @Test
    public void validTokenFailsWhenAuthorizationMissing() {
        UnionClient client = createClientBuilder().buildClient();

        Assertions.assertThrows(HttpResponseException.class, client::validToken);
    }

    @Test
    public void validTokenSucceedsWithBearerToken() {
        UnionClient client = createClientBuilder().addHttpPipelinePolicy(createBearerPolicy()).buildClient();

        Assertions.assertDoesNotThrow(() -> client.validToken());
    }
}
