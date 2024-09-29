// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.arm;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class UrlPathSegmentsTests {

    @Test
    public void testUrlPathSegments() {
        UrlPathSegments segments = new UrlPathSegments(
            "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/storageAccounts/{accountName}");

        Assertions.assertTrue(segments.hasSubscription());
        Assertions.assertTrue(segments.hasResourceGroup());
        Assertions.assertFalse(segments.hasScope());
        Assertions.assertFalse(segments.isNested());

        segments = new UrlPathSegments(
            "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/storageAccounts/{accountName}/blobServices/default/containers/{containerName}");

        Assertions.assertTrue(segments.hasSubscription());
        Assertions.assertTrue(segments.hasResourceGroup());
        Assertions.assertFalse(segments.hasScope());
        Assertions.assertTrue(segments.isNested());
        Assertions.assertEquals(4, segments.getReverseParameterSegments().size());
        Assertions.assertEquals("containers", segments.getReverseParameterSegments().get(0).getSegmentName());
        Assertions.assertEquals("storageAccounts", segments.getReverseParameterSegments().get(1).getSegmentName());
        Assertions.assertEquals("resourceGroups", segments.getReverseParameterSegments().get(2).getSegmentName());
        Assertions.assertEquals("subscriptions", segments.getReverseParameterSegments().get(3).getSegmentName());

        segments = new UrlPathSegments("/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}");

        Assertions.assertTrue(segments.hasSubscription());
        Assertions.assertFalse(segments.hasResourceGroup());
        Assertions.assertFalse(segments.hasScope());
        Assertions.assertFalse(segments.isNested());

        segments
            = new UrlPathSegments("/{scope}/providers/Microsoft.Authorization/roleAssignments/{roleAssignmentName}");

        Assertions.assertFalse(segments.hasSubscription());
        Assertions.assertFalse(segments.hasResourceGroup());
        Assertions.assertTrue(segments.hasScope());
        Assertions.assertFalse(segments.isNested());

        segments = new UrlPathSegments(
            "/{resourceUri}/providers/Microsoft.Advisor/recommendations/{recommendationId}/suppressions/{name}");

        Assertions.assertFalse(segments.hasSubscription());
        Assertions.assertFalse(segments.hasResourceGroup());
        Assertions.assertTrue(segments.hasScope());
        Assertions.assertTrue(segments.isNested());
        Assertions.assertEquals(3, segments.getReverseParameterSegments().size());
        Assertions.assertEquals("suppressions", segments.getReverseParameterSegments().get(0).getSegmentName());
        Assertions.assertEquals("recommendations", segments.getReverseParameterSegments().get(1).getSegmentName());
        Assertions.assertEquals("", segments.getReverseParameterSegments().get(2).getSegmentName());

        segments = new UrlPathSegments(
            "/subscriptions/{subscriptionId}/resourcegroups/{resourceGroupName}/providers/{resourceProviderNamespace}/{parentResourcePath}/{resourceType}/{resourceName}");

        Assertions.assertTrue(segments.hasSubscription());
        Assertions.assertTrue(segments.hasResourceGroup());
        Assertions.assertFalse(segments.hasScope());
        Assertions.assertEquals(6, segments.getReverseParameterSegments().size());
        Assertions.assertEquals("", segments.getReverseParameterSegments().get(0).getSegmentName());
        Assertions.assertEquals("", segments.getReverseParameterSegments().get(1).getSegmentName());
        Assertions.assertEquals("", segments.getReverseParameterSegments().get(2).getSegmentName());
        Assertions.assertEquals("providers", segments.getReverseParameterSegments().get(3).getSegmentName());
    }
}
