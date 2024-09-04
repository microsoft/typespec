// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.authentication.apikey;

import com.authentication.util.AzureKeyCredentialPolicy;
import com.azure.core.credential.AzureKeyCredential;
import com.azure.core.exception.HttpResponseException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ApiKeyTests {

    @Test
    public void testValid() {
        ApiKeyAsyncClient client = new ApiKeyClientBuilder()
                // AzureKeyCredentialPolicy from core requires HTTPS
                .addPolicy(new AzureKeyCredentialPolicy("x-ms-api-key", new AzureKeyCredential("valid-key")))
                .buildAsyncClient();

        client.valid().block();
    }

    @Test
    public void testInvalid() {
        ApiKeyClient client = new ApiKeyClientBuilder()
                // AzureKeyCredentialPolicy from core requires HTTPS
                .addPolicy(new AzureKeyCredentialPolicy("x-ms-api-key", new AzureKeyCredential("valid-key")))
                .buildClient();

        // assert HttpResponseException
        Assertions.assertThrows(HttpResponseException.class, client::invalid);
        // assert statusCode 403
        try {
            client.invalid();
        } catch (HttpResponseException e) {
            Assertions.assertEquals(403, e.getResponse().getStatusCode());
        }
    }
}
