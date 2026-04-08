// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.armstreamstyleserialization;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import tsptest.armstreamstyleserialization.fluent.models.ListResultSummary2Inner;
import tsptest.armstreamstyleserialization.implementation.models.ListResult;
import tsptest.armstreamstyleserialization.implementation.models.ListResultSummary;
import tsptest.armstreamstyleserialization.models.ListResult2;
import tsptest.armstreamstyleserialization.models.ListResult3;

public class PagedModelPackageTests {

    @Test
    public void testPagedModelPackage() {
        Assertions.assertTrue(isInImplementationModels(ListResult.class));
        Assertions.assertTrue(isInImplementationModels(ListResultSummary.class));

        // ListResult2 not in implementation, because its child ListResultSummary2(Inner) is PUBLIC
        Assertions.assertFalse(isInImplementationModels(ListResult2.class));
        Assertions.assertFalse(isInImplementationModels(ListResultSummary2Inner.class));

        // ListResult3 not in implementation, because we add `@access(Access.public)` to the model
        Assertions.assertFalse(isInImplementationModels(ListResult3.class));
    }

    private static boolean isInImplementationModels(Class<?> clazz) {
        return clazz.getPackage().getName().endsWith(".implementation.models");
    }
}
