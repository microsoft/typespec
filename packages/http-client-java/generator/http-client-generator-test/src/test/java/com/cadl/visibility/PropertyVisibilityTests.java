// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.cadl.visibility;

import com.azure.core.util.BinaryData;
import com.cadl.visibility.models.RoundTripModel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.io.IOException;

public class PropertyVisibilityTests {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    public void testRoundTripSecret() throws IOException {
        // serialization
        RoundTripModel model = new RoundTripModel("john", "secret");
        BinaryData binaryData = BinaryData.fromObject(model);
        JsonNode json = OBJECT_MAPPER.readTree(binaryData.toBytes());
        Assertions.assertEquals("secret", json.get("secretName").asText());

        // de-serialization
        ObjectNode objectNode = OBJECT_MAPPER.createObjectNode();
        objectNode.put("name", "john");
        byte[] jsonBytes = OBJECT_MAPPER.writeValueAsBytes(objectNode);
        model = BinaryData.fromBytes(jsonBytes).toObject(RoundTripModel.class);
        Assertions.assertEquals("john", model.getName());
        Assertions.assertNull(model.getSecretName());
    }
}
