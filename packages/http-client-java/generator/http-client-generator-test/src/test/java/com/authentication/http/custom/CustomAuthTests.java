// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.authentication.http.custom;

import com.authentication.apikey.ApiKeyAsyncClient;
import com.authentication.apikey.ApiKeyClient;
import com.authentication.apikey.ApiKeyClientBuilder;
import com.authentication.util.AzureKeyCredentialPolicy;
import com.azure.core.credential.AzureKeyCredential;
import com.azure.core.exception.HttpResponseException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class CustomAuthTests {

    @Test
    public void testValid() {
        CustomAsyncClient client = new CustomClientBuilder()
                // AzureKeyCredentialPolicy from core requires HTTPS
                .addPolicy(new AzureKeyCredentialPolicy("authorization", new AzureKeyCredential("valid-key"), "SharedAccessKey"))
                .buildAsyncClient();

        client.valid().block();
    }

    @Test
    public void testInvalid() {
        CustomClient client = new CustomClientBuilder()
                // AzureKeyCredentialPolicy from core requires HTTPS
                .addPolicy(new AzureKeyCredentialPolicy("authorization", new AzureKeyCredential("invalid-key"), "SharedAccessKey"))
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
