// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package response.bodyornocontent;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import response.bodyornocontent.models.BlobLayout;

public class BodyOrNoContentTests {

    private static final HttpHeaderName REQUEST_ID = HttpHeaderName.fromString("x-ms-request-id");

    private final BodyOrNoContentClient client = new BodyOrNoContentClientBuilder().buildClient();

    @Test
    public void testGetBody() {
        Response<BinaryData> response = client.getBodyWithResponse(new RequestOptions());

        Assertions.assertEquals(200, response.getStatusCode());
        Assertions.assertEquals("body-request", response.getHeaders().getValue(REQUEST_ID));
        Assertions.assertEquals("hello", response.getValue().toObject(BlobLayout.class).getContent());
    }

    @Test
    public void testGetNoContent() {
        Response<BinaryData> response = client.getNoContentWithResponse(new RequestOptions());

        Assertions.assertEquals(204, response.getStatusCode());
        Assertions.assertEquals("no-content-request", response.getHeaders().getValue(REQUEST_ID));
        Assertions.assertArrayEquals(new byte[0], response.getValue().toBytes());
        Assertions.assertNull(response.getValue().toObject(BlobLayout.class));
    }
}
