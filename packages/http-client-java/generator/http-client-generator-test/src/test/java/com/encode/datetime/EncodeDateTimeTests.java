// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.encode.datetime;

import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.rest.Response;
import com.encode.datetime.models.DefaultDatetimeProperty;
import com.encode.datetime.models.Rfc3339DatetimeProperty;
import com.encode.datetime.models.Rfc7231DatetimeProperty;
import com.encode.datetime.models.UnixTimestampArrayDatetimeProperty;
import com.encode.datetime.models.UnixTimestampDatetimeProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;

public class EncodeDateTimeTests {

    private final QueryClient queryClient = new DatetimeClientBuilder().buildQueryClient();
    private final HeaderClient headerClient = new DatetimeClientBuilder().buildHeaderClient();
    private final ResponseHeaderClient responseHeaderClient = new DatetimeClientBuilder().buildResponseHeaderClient();
    private final PropertyClient propertyClient = new DatetimeClientBuilder().buildPropertyClient();

    private final static OffsetDateTime DATE0 = OffsetDateTime.of(2022, 8, 26, 14, 38, 0, 0, ZoneOffset.UTC);
    private final static OffsetDateTime DATE1 = OffsetDateTime.of(2022, 8, 26, 18, 38, 0, 0, ZoneOffset.UTC);
    private final static OffsetDateTime DATE2 = OffsetDateTime.ofInstant(Instant.ofEpochSecond(1686566864), ZoneOffset.UTC);
    private final static OffsetDateTime DATE3 = OffsetDateTime.ofInstant(Instant.ofEpochSecond(1686734256), ZoneOffset.UTC);

    @Test
    public void testQuery() {
        queryClient.defaultMethod(DATE1);

        queryClient.rfc3339(DATE1);

        queryClient.rfc7231(DATE0);

        queryClient.unixTimestamp(DATE2);

        queryClient.unixTimestampArray(Arrays.asList(DATE2, DATE3));
    }

    @Test
    public void testRequestHeader() {
        headerClient.defaultMethod(DATE0);

        headerClient.rfc3339(DATE1);

        headerClient.rfc7231(DATE0);

        headerClient.unixTimestamp(DATE2);

        headerClient.unixTimestampArray(Arrays.asList(DATE2, DATE3));
    }


    @Test
    public void testResponseHeader() {
        HttpHeaderName valueHeaderName = HttpHeaderName.fromString("value");

        Response<Void> response = responseHeaderClient.defaultMethodWithResponse(null);
        Assertions.assertNotNull(response.getHeaders().getValue(valueHeaderName));

        response = responseHeaderClient.rfc3339WithResponse(null);
        Assertions.assertNotNull(response.getHeaders().getValue(valueHeaderName));

        response = responseHeaderClient.rfc7231WithResponse(null);
        Assertions.assertNotNull(response.getHeaders().getValue(valueHeaderName));

        response = responseHeaderClient.unixTimestampWithResponse(null);
        Assertions.assertNotNull(response.getHeaders().getValue(valueHeaderName));
    }

    @Test
    public void testProperty() {
        propertyClient.defaultMethod(new DefaultDatetimeProperty(DATE1));

        propertyClient.rfc3339(new Rfc3339DatetimeProperty(DATE1));

        propertyClient.rfc7231(new Rfc7231DatetimeProperty(DATE0));

        propertyClient.unixTimestamp(new UnixTimestampDatetimeProperty(DATE2));

        List<OffsetDateTime> array = Arrays.asList(DATE2, DATE3);
        UnixTimestampArrayDatetimeProperty ret = propertyClient.unixTimestampArray(new UnixTimestampArrayDatetimeProperty(array));
        Assertions.assertEquals(array, ret.getValue());
    }
}
