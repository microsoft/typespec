// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.subclass;

import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import tsptest.subclass.models.PropertyChangedToConstant;
import tsptest.subclass.models.PropertyChangedToRequired;

public class SubclassPropertyTests {

    @Test
    public void testPropertyChangedToRequired() {
        PropertyChangedToRequired model = new PropertyChangedToRequired("value");
        String json = BinaryData.fromObject(model).toString();
        Assertions.assertEquals("{\"propertyChangedToRequired\":\"value\"}", json);

        model = BinaryData.fromString(json).toObject(PropertyChangedToRequired.class);
        Assertions.assertEquals("value", model.getPropertyChangedToRequired());
    }

    @Test
    public void testPropertyChangedToConstant() {
        PropertyChangedToConstant model = new PropertyChangedToConstant();
        String json = BinaryData.fromObject(model).toString();
        Assertions.assertEquals("{\"propertyChangedToConstant\":\"constantValue\"}", json);

        model = BinaryData.fromString(json).toObject(PropertyChangedToConstant.class);
        Assertions.assertEquals("constantValue", model.getPropertyChangedToConstant());
    }
}
