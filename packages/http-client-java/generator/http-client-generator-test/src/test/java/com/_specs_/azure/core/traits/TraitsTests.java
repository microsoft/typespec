// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com._specs_.azure.core.traits;

import com._specs_.azure.core.traits.models.UserActionParam;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.RequestConditions;
import com.azure.core.http.rest.Response;
import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public class TraitsTests {

    private TraitsClient client = new TraitsClientBuilder()
            .buildClient();

    @Test
    public void testGet() {
        OffsetDateTime unmodifiedSince = OffsetDateTime.of(2022, 8, 26, 14, 38, 0, 0, ZoneOffset.UTC);
        OffsetDateTime modifiedSince = OffsetDateTime.of(2021, 8, 26, 14, 38, 0, 0, ZoneOffset.UTC);

        client.smokeTest(1, "123", new RequestConditions()
                .setIfMatch("\"valid\"")
                .setIfNoneMatch("\"invalid\"")
                .setIfModifiedSince(modifiedSince)
                .setIfUnmodifiedSince(unmodifiedSince));
    }

    @Test
    public void testPost() {
        Response<BinaryData> response = client.repeatableActionWithResponse(1, BinaryData.fromObject(new UserActionParam("test")), null);
        Assertions.assertEquals("accepted", response.getHeaders().getValue(HttpHeaderName.fromString("repeatability-result")));
    }
}
