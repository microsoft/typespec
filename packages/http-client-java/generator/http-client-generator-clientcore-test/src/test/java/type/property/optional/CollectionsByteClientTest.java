// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.optional;

import java.util.Arrays;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class CollectionsByteClientTest {

    private final CollectionsByteClient client = new OptionalClientBuilder().buildCollectionsByteClient();

    @Test
    public void getAll() {
        CollectionsByteProperty collectionsByteProperty = client.getAll();
        for (byte[] p : collectionsByteProperty.getProperty()) {
            Assertions.assertNotNull(p);
        }
    }

    @Test
    public void getDefault() {
        CollectionsByteProperty collectionsByteProperty = client.getDefault();
        Assertions.assertNull(collectionsByteProperty.getProperty());
    }

    @Test
    public void putAll() {
        CollectionsByteProperty collectionsByteProperty = new CollectionsByteProperty();
        byte[] byteProperty = new byte[] { 104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33 };
        collectionsByteProperty.setProperty(Arrays.asList(byteProperty, byteProperty));
        client.putAll(collectionsByteProperty);
    }

    @Test
    public void putDefault() {
        CollectionsByteProperty collectionsByteProperty = new CollectionsByteProperty();
        client.putDefault(collectionsByteProperty);
    }
}
