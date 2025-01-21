// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.errormodel;

import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import tsptest.errormodel.models.Diagnostic;

public class ResponseErrorTests {

    @Test
    public void testResponseError() {
        String json = "{\"name\": \"diagnostic\", \"error\": {\"code\": \"error\", \"message\": \"error message\"}}";
        Diagnostic diagnostic = BinaryData.fromString(json).toObject(Diagnostic.class);
        Assertions.assertEquals("error", diagnostic.getError().getCode());
        Assertions.assertEquals("error message", diagnostic.getError().getMessage());
    }
}
