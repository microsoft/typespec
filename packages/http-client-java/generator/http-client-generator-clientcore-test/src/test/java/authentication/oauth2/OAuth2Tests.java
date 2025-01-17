// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.oauth2;

import io.clientcore.core.credential.KeyCredential;
import io.clientcore.core.http.exception.HttpResponseException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class OAuth2Tests {

    @Test
    public void testValid() {
        OAuth2Client client
            = new OAuth2ClientBuilder().credential(new KeyCredential("https://security.microsoft.com/.default"))
                .buildClient();

        client.valid();
    }

    @Test
    public void testInvalid() {
        OAuth2Client client = new OAuth2ClientBuilder().buildClient();

        // assert HttpResponseException
        Assertions.assertThrows(HttpResponseException.class, client::invalid);
    }
}
