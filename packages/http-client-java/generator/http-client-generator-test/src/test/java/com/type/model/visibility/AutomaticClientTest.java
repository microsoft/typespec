// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.model.visibility;

import com.type.model.visibility.models.ReadOnlyModel;
import com.type.model.visibility.models.VisibilityModel;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

// These cases are using protocol method, we don't support automatic visibility for convenience methods yet, the tests are added for cadl-ranch coverage.
class AutomaticClientTest {

    private final VisibilityClient client = new VisibilityClientBuilder().buildClient();

    @Test
    void getModel() {
        // client.getModelWithResponse(BinaryData.fromString("{\"queryProp\": 123}"), null);
        client.getModel(new VisibilityModel(123, null, null, null));
    }

    @Test
    void headModel() {
        // client.headModelWithResponse(BinaryData.fromString("{\"queryProp\": 123}"), null);
        client.headModel(new VisibilityModel(123, null, null, null));
    }

    @Test
    void putModel() {
        // client.putModelWithResponse(BinaryData.fromString("{\"createProp\": [\"foo\",\"bar\"], \"updateProp\": [1, 2]}"), null);
        client.putModel(new VisibilityModel(null, Arrays.asList("foo", "bar"), Arrays.asList(1, 2), null));
    }

    @Test
    void patchModel() {
        // client.patchModelWithResponse(BinaryData.fromString("{\"updateProp\": [1, 2]}"), null);
        client.patchModel(new VisibilityModel(null, null, Arrays.asList(1, 2), null));
    }

    @Test
    void postModel() {
        // client.postModelWithResponse(BinaryData.fromString("{\"createProp\": [\"foo\",\"bar\"]}"), null);
        client.postModel(new VisibilityModel(null, Arrays.asList("foo", "bar"), null, null));
    }

    @Test
    void deleteModel() {
        // client.deleteModelWithResponse(BinaryData.fromString("{\"deleteProp\": true}"), null);
        client.deleteModel(new VisibilityModel(null, null, null, true));
    }

    @Test
    void putReadOnlyModel() {
        ReadOnlyModel readOnlyModel = client.putReadOnlyModel(new ReadOnlyModel());
        Assertions.assertIterableEquals(Arrays.asList(1, 2, 3), readOnlyModel.getOptionalNullableIntList());
        Assertions.assertEquals("value1", readOnlyModel.getOptionalStringRecord().get("k1"));
        Assertions.assertEquals("value2", readOnlyModel.getOptionalStringRecord().get("k2"));
    }
}
