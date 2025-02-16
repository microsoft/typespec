// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package response.statuscoderange;

import com.azure.core.exception.HttpResponseException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class StatusCodeRangeTests {

    private final StatusCodeRangeClient client = new StatusCodeRangeClientBuilder().buildClient();

    @Test
    public void testErrorStatusCodeRange() {
        Assertions.assertThrows(HttpResponseException.class, client::errorResponseStatusCodeInRange);
        Assertions.assertThrows(HttpResponseException.class, client::errorResponseStatusCode404);
    }
}
