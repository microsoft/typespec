// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.nullable;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.Arrays;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class CollectionsModelClientTest {

    private final CollectionsModelClient client = new NullableClientBuilder().buildCollectionsModelClient();

    @Test
    public void patchNonNullWithResponse() {
        CollectionsModelProperty property = new CollectionsModelProperty().setRequiredProperty("foo")
            .setNullableProperty(
                Arrays.asList(new InnerModel().setProperty("hello"), new InnerModel().setProperty("world")));
        client.patchNonNull(property);
    }

    @Disabled
    @Test
    public void patchNullWithResponse() {
        client.patchNull(new CollectionsModelProperty().setRequiredProperty("foo").setNullableProperty(null));
    }

    @Test
    public void getNonNull() {
        CollectionsModelProperty response = client.getNonNull();
        assertNotNull(response.getNullableProperty());
    }

    @Test
    public void getNull() {
        CollectionsModelProperty response = client.getNull();
        assertNull(response.getNullableProperty());
    }
}
