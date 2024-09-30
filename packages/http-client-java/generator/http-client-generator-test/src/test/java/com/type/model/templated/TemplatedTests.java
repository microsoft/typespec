// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.model.templated;

import com.type.model.templated.models.Float32ValuesType;
import com.type.model.templated.models.Int32ValuesType;
import java.util.List;
import org.junit.jupiter.api.Test;

public class TemplatedTests {

    private final TemplatedClient client = new TemplatedClientBuilder().buildClient();

    @Test
    public void testTemplated() {
        client.float32Type(new Float32ValuesType(List.of(0.5), 0.5));

        client.int32Type(new Int32ValuesType(List.of(1234), 1234));

        // bug
        // client.numericType(new Int32Type(List.of(1234), 1234));
    }
}
