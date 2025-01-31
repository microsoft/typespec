// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class CollectionsIntClientTest {

    private final CollectionsIntClient client = new ValueTypesClientBuilder().buildCollectionsIntClient();

    @Test
    public void get() {
        CollectionsIntProperty collectionsIntProperty = client.get();
        List<Integer> properties = collectionsIntProperty.getProperty();
        Assertions.assertEquals(1, properties.get(0));
        Assertions.assertEquals(2, properties.get(1));
    }

    @Test
    public void put() {
        CollectionsIntProperty collectionsIntProperty = new CollectionsIntProperty(Arrays.asList(1, 2));
        client.put(collectionsIntProperty);
    }
}
