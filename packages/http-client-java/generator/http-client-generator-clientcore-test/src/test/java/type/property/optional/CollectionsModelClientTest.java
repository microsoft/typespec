// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.optional;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class CollectionsModelClientTest {

    private final CollectionsModelClient client = new OptionalClientBuilder().buildCollectionsModelClient();

    @Test
    public void getAll() {
        CollectionsModelProperty collectionsModelProperty = client.getAll();
        List<StringProperty> properties = collectionsModelProperty.getProperty();
        Assertions.assertEquals("hello", properties.get(0).getProperty());
        Assertions.assertEquals("world", properties.get(1).getProperty());
    }

    @Test
    public void getDefault() {
        CollectionsModelProperty collectionsModelProperty = client.getDefault();
        Assertions.assertNull(collectionsModelProperty.getProperty());
    }

    @Test
    public void putAll() {
        CollectionsModelProperty collectionsModelProperty = new CollectionsModelProperty();
        StringProperty stringProperty1 = new StringProperty();
        StringProperty stringProperty2 = new StringProperty();
        stringProperty1.setProperty("hello");
        stringProperty2.setProperty("world");
        collectionsModelProperty.setProperty(Arrays.asList(stringProperty1, stringProperty2));
        client.putAll(collectionsModelProperty);
    }

    @Test
    public void putDefault() {
        CollectionsModelProperty collectionsModelProperty = new CollectionsModelProperty();
        client.putDefault(collectionsModelProperty);
    }
}
