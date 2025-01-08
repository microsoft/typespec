// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.http.custom;

import io.clientcore.core.credential.KeyCredential;
import io.clientcore.core.http.exception.HttpResponseException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class CustomAuthTests {

    @Test
    public void testValid() {
        CustomClient client = new CustomClientBuilder().credential(new KeyCredential("valid-key")).buildClient();

        client.valid();
    }

    @Test
    public void testInvalid() {
        CustomClient client = new CustomClientBuilder().credential(new KeyCredential("invalid-key")).buildClient();

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
