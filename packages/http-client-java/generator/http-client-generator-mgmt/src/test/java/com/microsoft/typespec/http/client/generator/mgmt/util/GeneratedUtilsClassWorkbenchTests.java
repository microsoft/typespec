// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.util;

import com.azure.core.util.CoreUtils;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class GeneratedUtilsClassWorkbenchTests {

    static final class Utils {
        static String getValueFromIdByName(String id, String name) {
            if (id == null) {
                return null;
            }
            Iterator<String> itr = Arrays.stream(id.split("/")).iterator();
            while (itr.hasNext()) {
                String part = itr.next();
                if (part != null && !part.trim().isEmpty()) {
                    if (part.equalsIgnoreCase(name)) {
                        if (itr.hasNext()) {
                            return itr.next();
                        } else {
                            return null;
                        }
                    }
                }
            }
            return null;
        }

        static String getValueFromIdByParameterName(String id, String pathTemplate, String parameterName) {
            if (id == null || pathTemplate == null) {
                return null;
            }
            String parameterNameParentheses = "{" + parameterName + "}";
            List<String> idSegmentsReverted = Arrays.asList(id.split("/"));
            List<String> pathSegments = Arrays.asList(pathTemplate.split("/"));
            Collections.reverse(idSegmentsReverted);
            Iterator<String> idItrReverted = idSegmentsReverted.iterator();
            int pathIndex = pathSegments.size();
            while (idItrReverted.hasNext() && pathIndex > 0) {
                String idSegment = idItrReverted.next();
                String pathSegment = pathSegments.get(--pathIndex);
                if (!CoreUtils.isNullOrEmpty(idSegment) && !CoreUtils.isNullOrEmpty(pathSegment)) {
                    if (pathSegment.equalsIgnoreCase(parameterNameParentheses)) {
                        if (pathIndex == 0 || (pathIndex == 1 && pathSegments.get(0).isEmpty())) {
                            List<String> segments = new ArrayList<>();
                            segments.add(idSegment);
                            idItrReverted.forEachRemaining(segments::add);
                            Collections.reverse(segments);
                            if (segments.size() > 0 && segments.get(0).isEmpty()) {
                                segments.remove(0);
                            }
                            return String.join("/", segments);
                        } else {
                            return idSegment;
                        }
                    }
                }
            }
            return null;
        }
    }

    @Test
    public void testGetValueFromIdByName() {
        String id
            = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-weidxu/providers/Microsoft.ServiceBus/namespaces/sb1weidxu/queues/queue1";

        Assertions.assertEquals("00000000-0000-0000-0000-000000000000",
            Utils.getValueFromIdByName(id, "subscriptions"));
        Assertions.assertEquals("rg-weidxu", Utils.getValueFromIdByName(id, "ResourceGroups"));
        Assertions.assertEquals("Microsoft.ServiceBus", Utils.getValueFromIdByName(id, "providers"));
        Assertions.assertEquals("sb1weidxu", Utils.getValueFromIdByName(id, "namespaces"));
        Assertions.assertEquals("queue1", Utils.getValueFromIdByName(id, "queues"));

        Assertions.assertNull(Utils.getValueFromIdByName(id, "notExist"));
    }

    @Test
    void testGetValuesFromId() {
        String pathTemplate = "/{scope}/providers/Microsoft.Authorization/roleAssignments/{roleAssignmentName}";
        String id
            = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-weidxu/providers/Microsoft.Authorization/roleAssignments/00000000-0000-0000-0000-000000000001";

        Assertions.assertEquals("00000000-0000-0000-0000-000000000001",
            Utils.getValueFromIdByParameterName(id, pathTemplate, "roleAssignmentName"));
        Assertions.assertEquals("subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-weidxu",
            Utils.getValueFromIdByParameterName(id, pathTemplate, "scope"));

        pathTemplate
            = "/{resourceUri}/providers/Microsoft.Advisor/recommendations/{recommendationId}/suppressions/{name}";
        id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-weidxu/providers/Microsoft.Compute/virtualMachines/vm1/providers/Microsoft.Advisor/recommendations/recommendation1/suppressions/suppressionName1";

        Assertions.assertEquals("recommendation1",
            Utils.getValueFromIdByParameterName(id, pathTemplate, "recommendationId"));
        Assertions.assertEquals("suppressionName1", Utils.getValueFromIdByParameterName(id, pathTemplate, "name"));
        Assertions.assertEquals(
            "subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-weidxu/providers/Microsoft.Compute/virtualMachines/vm1",
            Utils.getValueFromIdByParameterName(id, pathTemplate, "resourceUri"));
    }
}
