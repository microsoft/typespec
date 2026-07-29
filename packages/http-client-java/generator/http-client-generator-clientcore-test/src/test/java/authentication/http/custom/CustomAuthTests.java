// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.http.custom;

import authentication.utils.KeyCredentialPolicy;
import io.clientcore.core.credentials.KeyCredential;
import io.clientcore.core.http.models.HttpResponseException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class CustomAuthTests {

    @Test
    public void testValid() {
        CustomClient client = new CustomClientBuilder()
            .addHttpPipelinePolicy(
                new KeyCredentialPolicy("authorization", new KeyCredential("valid-key"), "SharedAccessKey"))
            .buildClient();

        client.valid();
    }

    @Test
    public void testInvalid() {
        CustomClient client = new CustomClientBuilder()
            .addHttpPipelinePolicy(
                new KeyCredentialPolicy("authorization", new KeyCredential("invalid-key"), "SharedAccessKey"))
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
