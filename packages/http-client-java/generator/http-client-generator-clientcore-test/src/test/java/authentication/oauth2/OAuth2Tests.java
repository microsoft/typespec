// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.oauth2;

import io.clientcore.core.credentials.KeyCredential;
import io.clientcore.core.http.exceptions.HttpResponseException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class OAuth2Tests {

    @Disabled("OAuth2 is not supported")
    @Test
    public void testValid() {
        OAuth2Client client
            = new OAuth2ClientBuilder().credential(new KeyCredential("https://security.microsoft.com/.default"))
                .buildClient();

        client.valid();
    }

    @Disabled("OAuth2 is not supported")
    @Test
    public void testInvalid() {
        OAuth2Client client = new OAuth2ClientBuilder().buildClient();

        // assert HttpResponseException
        Assertions.assertThrows(HttpResponseException.class, client::invalid);
    }
}
