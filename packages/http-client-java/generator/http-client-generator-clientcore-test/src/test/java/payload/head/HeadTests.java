// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.head;

import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class HeadTests {

    private final HeadClient client = new HeadClientBuilder().buildClient();

    @Test
    public void testResponseHeaders() {
        Response<Void> response = client.contentTypeHeaderInResponseWithResponse(RequestContext.none());
        Assertions.assertEquals("text/plain; charset=utf-8",
            response.getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
        Assertions.assertEquals("hello", response.getHeaders().getValue(HttpHeaderName.fromString("x-ms-meta")));
    }
}
