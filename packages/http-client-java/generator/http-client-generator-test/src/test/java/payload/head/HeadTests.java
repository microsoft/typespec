// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.head;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.ResponseBase;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import payload.head.models.ContentTypeHeaderInResponseHeaders;

public class HeadTests {

    private final HeadClient client = new HeadClientBuilder().buildClient();

    @Test
    public void testResponseHeaders() {
        ResponseBase<ContentTypeHeaderInResponseHeaders, Void> response
            = client.contentTypeHeaderInResponseWithResponse(new RequestOptions());
        Assertions.assertEquals("text/plain; charset=utf-8",
            response.getHeaders().getValue(HttpHeaderName.CONTENT_TYPE));
        Assertions.assertEquals("hello", response.getHeaders().getValue("x-ms-meta"));
        Assertions.assertEquals("text/plain; charset=utf-8", response.getDeserializedHeaders().getContentType());
        Assertions.assertEquals("hello", response.getDeserializedHeaders().getMetadata());
    }
}
