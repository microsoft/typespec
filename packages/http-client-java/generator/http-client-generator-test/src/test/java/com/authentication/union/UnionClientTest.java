// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.authentication.union;

import com.authentication.util.AzureKeyCredentialPolicy;
import com.authentication.util.BearerTokenAuthenticationPolicy;
import com.azure.core.credential.AccessToken;
import com.azure.core.credential.AzureKeyCredential;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

class UnionClientTest {

    @Test
    void validKey() {
        UnionClient client = new UnionClientBuilder().addPolicy(new AzureKeyCredentialPolicy("x-ms-api-key", new AzureKeyCredential("valid-key"))).buildClient();
        client.validKey();
    }

    @Test
    void validToken() {
        UnionClient client = new UnionClientBuilder().addPolicy(new BearerTokenAuthenticationPolicy(tokenRequestContext -> Mono.just(new AccessToken("https://security.microsoft.com/.default", OffsetDateTime.now().plusHours(1))))).buildClient();
        client.validToken();
    }
}