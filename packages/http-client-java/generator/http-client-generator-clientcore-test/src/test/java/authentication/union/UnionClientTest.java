// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.union;

import io.clientcore.core.credentials.KeyCredential;
import io.clientcore.core.credentials.oauth.AccessToken;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class UnionClientTest {

    @Disabled("No TokenCredential exists in clientcore. It becomes KeyCredential and overrides this.")
    @Test
    void validKey() {
        UnionClient client = new UnionClientBuilder().credential(new KeyCredential("valid-key")).buildClient();
        client.validKey();
    }

    @Test
    void validToken() {
        UnionClient client = new UnionClientBuilder()
            .credential(request -> new AccessToken("https://security.microsoft.com/.default", OffsetDateTime.MAX))
            .buildClient();
        client.validToken();
    }
}
