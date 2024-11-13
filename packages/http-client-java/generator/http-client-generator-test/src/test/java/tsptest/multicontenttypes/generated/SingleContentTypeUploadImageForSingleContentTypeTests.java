// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.multicontenttypes.generated;

import com.azure.core.util.BinaryData;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled
public final class SingleContentTypeUploadImageForSingleContentTypeTests extends MultiContentTypesClientTestBase {
    @Test
    @Disabled
    public void testSingleContentTypeUploadImageForSingleContentTypeTests() {
        // method invocation
        singleContentTypeClient.uploadImageForSingleContentType(
            BinaryData.fromBytes("\"D:\\Program Files\"".getBytes(StandardCharsets.UTF_8)));
    }
}
