// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package response.bodyornocontent;

import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class BodyOrNoContentTests {

    private static final HttpHeaderName REQUEST_ID = HttpHeaderName.fromString("x-ms-request-id");

    private final BodyOrNoContentClient client = new BodyOrNoContentClientBuilder().buildClient();

    @Test
    public void testGetBody() {
        Response<BlobLayout> response = client.getBodyWithResponse(RequestContext.none());

        Assertions.assertEquals(200, response.getStatusCode());
        Assertions.assertEquals("body-request", response.getHeaders().getValue(REQUEST_ID));
        Assertions.assertEquals("hello", response.getValue().getContent());
    }

    @Test
    public void testGetNoContent() {
        Response<BlobLayout> response = client.getNoContentWithResponse(RequestContext.none());

        Assertions.assertEquals(204, response.getStatusCode());
        Assertions.assertEquals("no-content-request", response.getHeaders().getValue(REQUEST_ID));
        Assertions.assertNull(response.getValue());
    }
}
