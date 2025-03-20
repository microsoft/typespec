// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.apikey;

import io.clientcore.core.credentials.KeyCredential;
import io.clientcore.core.http.exceptions.HttpResponseException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ApiKeyTests {

    @Test
    public void testValid() {
        ApiKeyClient client = new ApiKeyClientBuilder().credential(new KeyCredential("valid-key")).buildClient();

        client.valid();
    }

    @Test
    public void testInvalid() {
        ApiKeyClient client = new ApiKeyClientBuilder().credential(new KeyCredential("invalid-key")).buildClient();

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
