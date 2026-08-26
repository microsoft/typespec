// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.nullable;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.Arrays;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class CollectionsByteClientTest {

    private final CollectionsByteClient client = new NullableClientBuilder().buildCollectionsByteClient();

    @Test
    public void patchNonNullWithResponse() {
        CollectionsByteProperty collectionsByteProperty = new CollectionsByteProperty().setRequiredProperty("foo")
            .setNullableProperty(
                Arrays.asList(new byte[] { 104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33 },
                    new byte[] { 104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33 }));
        client.patchNonNull(collectionsByteProperty);
    }

    @Disabled
    @Test
    public void patchNullWithResponse() {
        client.patchNull(new CollectionsByteProperty().setRequiredProperty("foo").setNullableProperty(null));
    }

    @Test
    public void getNonNull() {
        CollectionsByteProperty response = client.getNonNull();
        assertNotNull(response.getNullableProperty());
    }

    @Test
    public void getNull() {
        CollectionsByteProperty response = client.getNull();
        assertNull(response.getNullableProperty());
    }
}
