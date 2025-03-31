// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.model.visibility;

import io.clientcore.core.http.client.HttpClient;
import java.util.Arrays;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class AutomaticClientTest {

    private final VisibilityClient client
        = new VisibilityClientBuilder().httpClient(HttpClient.getNewInstance()).buildClient();

    @Test
    void getModel() {
        client.getModel(123, new VisibilityModel(null, null, null));
    }

    @Test
    void headModel() {
        client.headModel(123, new VisibilityModel(null, null, null));
    }

    @Test
    void putModel() {
        client.putModel(new VisibilityModel(Arrays.asList("foo", "bar"), Arrays.asList(1, 2), null));
    }

    @Test
    void patchModel() {
        client.patchModel(new VisibilityModel(null, Arrays.asList(1, 2), null));
    }

    @Test
    void postModel() {
        client.postModel(new VisibilityModel(Arrays.asList("foo", "bar"), null, null));
    }

    @Test
    void deleteModel() {
        client.deleteModel(new VisibilityModel(null, null, true));
    }

    @Test
    void putReadOnlyModel() {
        ReadOnlyModel readOnlyModel = client.putReadOnlyModel(new ReadOnlyModel());
        Assertions.assertIterableEquals(Arrays.asList(1, 2, 3), readOnlyModel.getOptionalNullableIntList());
        Assertions.assertEquals("value1", readOnlyModel.getOptionalStringRecord().get("k1"));
        Assertions.assertEquals("value2", readOnlyModel.getOptionalStringRecord().get("k2"));
    }
}
