// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.noauth.union;

import authentication.util.BearerTokenAuthenticationPolicy;
import com.azure.core.credential.AccessToken;
import com.azure.core.exception.HttpResponseException;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

public class UnionTests {

    private static final String EXPECTED_TOKEN = "https://security.microsoft.com/.default";

    private static UnionClientBuilder createClientBuilder() {
        return new UnionClientBuilder();
    }

    private static BearerTokenAuthenticationPolicy createBearerPolicy() {
        return new BearerTokenAuthenticationPolicy(
            tokenRequestContext -> Mono.just(new AccessToken(EXPECTED_TOKEN, OffsetDateTime.now().plusHours(1))));
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
        UnionClient client = createClientBuilder().addPolicy(createBearerPolicy()).buildClient();

        Assertions.assertDoesNotThrow(() -> client.validToken());
    }
}
