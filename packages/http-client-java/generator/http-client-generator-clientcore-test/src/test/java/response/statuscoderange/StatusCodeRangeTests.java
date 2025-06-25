// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package response.statuscoderange;

import io.clientcore.core.http.models.HttpResponseException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class StatusCodeRangeTests {

    private final StatusCodeRangeClient client = new StatusCodeRangeClientBuilder().buildClient();

    @Test
    public void testErrorStatusCodeRange() {
        HttpResponseException httpResponseException
            = Assertions.assertThrows(HttpResponseException.class, client::errorResponseStatusCodeInRange);
        Assertions.assertEquals("Request header too large",
            ((ErrorInRange) httpResponseException.getValue()).getMessage());

        httpResponseException
            = Assertions.assertThrows(HttpResponseException.class, client::errorResponseStatusCode404);
        Assertions.assertEquals("resource1", ((NotFoundError) httpResponseException.getValue()).getResourceId());
    }
}
