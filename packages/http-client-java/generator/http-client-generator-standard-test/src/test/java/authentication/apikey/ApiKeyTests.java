// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.apikey;

import authentication.util.AzureKeyCredentialPolicy;
import com.azure.core.exception.HttpResponseException;
import io.clientcore.core.credential.KeyCredential;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ApiKeyTests {

    @Test
    public void testValid() {
        ApiKeyClient client = new ApiKeyClientBuilder()
            // AzureKeyCredentialPolicy from core requires HTTPS
            .addHttpPipelinePolicy(new AzureKeyCredentialPolicy("x-ms-api-key", new KeyCredential("valid-key")))
            .buildClient();

        client.valid();
    }

    @Test
    public void testInvalid() {
        ApiKeyClient client = new ApiKeyClientBuilder()
            // AzureKeyCredentialPolicy from core requires HTTPS
            .addHttpPipelinePolicy(new AzureKeyCredentialPolicy("x-ms-api-key", new KeyCredential("invalid-key")))
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
