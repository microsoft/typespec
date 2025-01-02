// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.http.custom;

import authentication.util.AzureKeyCredentialPolicy;
import com.azure.core.exception.HttpResponseException;
import io.clientcore.core.credential.KeyCredential;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class CustomAuthTests {

    @Test
    public void testValid() {
        CustomClient client = new CustomClientBuilder()
            // AzureKeyCredentialPolicy from core requires HTTPS
            .addHttpPipelinePolicy(
                new AzureKeyCredentialPolicy("authorization", new KeyCredential("valid-key"), "SharedAccessKey"))
            .buildClient();

        client.valid();
    }

    @Test
    public void testInvalid() {
        CustomClient client = new CustomClientBuilder()
            // AzureKeyCredentialPolicy from core requires HTTPS
            .addHttpPipelinePolicy(
                new AzureKeyCredentialPolicy("authorization", new KeyCredential("invalid-key"), "SharedAccessKey"))
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
