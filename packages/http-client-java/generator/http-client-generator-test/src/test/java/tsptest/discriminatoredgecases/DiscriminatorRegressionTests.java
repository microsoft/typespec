// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.discriminatoredgecases;

import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import tsptest.discriminatoredgecases.models.RegressionAncestorOrdinaryPropertyMaskingAssistant;
import tsptest.discriminatoredgecases.models.RegressionAncestorOrdinaryPropertyMaskingBase;
import tsptest.discriminatoredgecases.models.RegressionDuplicateRepeatedInheritedDiscriminatorAssistant;
import tsptest.discriminatoredgecases.models.RegressionDuplicateRepeatedInheritedDiscriminatorBase;
import tsptest.discriminatoredgecases.models.RegressionSuperclassConstructorPropagationAssistant;
import tsptest.discriminatoredgecases.models.RegressionSuperclassConstructorPropagationBase;

public class DiscriminatorRegressionTests {

    @Test
    public void duplicateRepeatedInheritedDiscriminatorHasOneCanonicalRepresentation() {
        String json = "{\"type\":\"message\",\"role\":\"assistant\"}";

        RegressionDuplicateRepeatedInheritedDiscriminatorBase model
            = BinaryData.fromString(json).toObject(RegressionDuplicateRepeatedInheritedDiscriminatorBase.class);

        Assertions.assertInstanceOf(RegressionDuplicateRepeatedInheritedDiscriminatorAssistant.class, model);
        Assertions.assertEquals(json, BinaryData.fromObject(model).toString());
    }

    @Test
    public void canonicalDiscriminatorMasksAncestorOrdinaryProperty() {
        String json = "{\"type\":\"message\",\"role\":\"assistant\"}";

        RegressionAncestorOrdinaryPropertyMaskingBase model
            = BinaryData.fromString(json).toObject(RegressionAncestorOrdinaryPropertyMaskingBase.class);

        Assertions.assertInstanceOf(RegressionAncestorOrdinaryPropertyMaskingAssistant.class, model);
        Assertions.assertEquals(json, BinaryData.fromObject(model).toString());
    }

    @Test
    public void canonicalDiscriminatorSuppliesSuperclassConstructor() {
        String json = "{\"type\":\"message\",\"role\":\"assistant\"}";

        RegressionSuperclassConstructorPropagationBase model
            = BinaryData.fromString(json).toObject(RegressionSuperclassConstructorPropagationBase.class);

        Assertions.assertInstanceOf(RegressionSuperclassConstructorPropagationAssistant.class, model);
        Assertions.assertEquals("message", model.getType());
    }

}
