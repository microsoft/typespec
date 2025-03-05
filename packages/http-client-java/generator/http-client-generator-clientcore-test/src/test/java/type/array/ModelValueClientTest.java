// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.array;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ModelValueClientTest {

    private final ModelValueClient client = new ArrayClientBuilder().buildModelValueClient();

    @Test
    public void get() {
        List<InnerModel> response = client.get();
        Assertions.assertEquals(2, response.size());
        Assertions.assertEquals("hello", response.get(0).getProperty());
        Assertions.assertEquals("world", response.get(1).getProperty());
    }

    @Test
    public void put() {
        InnerModel model1 = new InnerModel("hello");
        InnerModel model2 = new InnerModel("world");
        client.put(Arrays.asList(model1, model2));
    }
}
