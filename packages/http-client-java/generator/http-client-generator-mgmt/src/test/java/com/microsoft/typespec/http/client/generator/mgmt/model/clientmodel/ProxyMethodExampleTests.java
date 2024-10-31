// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class ProxyMethodExampleTests {

    @BeforeAll
    public static void ensurePlugin() {
        new TestUtils.MockFluentGen();
    }

    @Test
    public void testRelativeOriginalFileName() {
        ProxyMethodExample example = new ProxyMethodExample.Builder().originalFile(
            "file:///c:/github/azure-rest-api-specs/specification/resources/resource-manager/Microsoft.Resources/stable/2019-08-01/examples/PutDeploymentAtScope.json")
            .build();
        Assertions.assertEquals(
            "specification/resources/resource-manager/Microsoft.Resources/stable/2019-08-01/examples/PutDeploymentAtScope.json",
            example.getRelativeOriginalFileName());

        example = new ProxyMethodExample.Builder().originalFile(
            "https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Authorization/stable/2020-09-01/examples/getDataPolicyManifest.json")
            .build();
        Assertions.assertEquals(
            "specification/resources/resource-manager/Microsoft.Authorization/stable/2020-09-01/examples/getDataPolicyManifest.json",
            example.getRelativeOriginalFileName());

        // not able to parse
        example = new ProxyMethodExample.Builder().originalFile(
            "/c:/github/azure-rest-api-specs/specification/resources/resource-manager/Microsoft.Resources/stable/2019-08-01/examples/PutDeploymentAtScope.json")
            .build();
        Assertions.assertEquals(example.getOriginalFile(), example.getRelativeOriginalFileName());
    }

    @Test
    public void testUnescapeQueryValue() {
        String queryNotEscaped1
            = "timestamp ge datetime'2017-06-01T00:00:00' and timestamp le datetime'2017-06-04T00:00:00'";
        String queryNotEscaped2
            = "properties/extensionHandler/any(eh: eh/version gt '2.70') and contains(name,'sql') and contains(properties/nodeConfiguration/name,'$$Not$$Configured$$')";

        String queryNotEscaped3 = "properties/eventDate ge 2020-05-20 AND properties/eventDate le 2020-05-30";
        String queryEscaped3 = "properties/eventDate+ge+2020-05-20+AND+properties/eventDate+le+2020-05-30";

        String queryNotEscaped4 = "(properties/archived eq false)";
        String queryEscaped4 = "(properties/archived+eq+false)".replace("/", "%2f");  // workaround spelling check

        String queryNotEscaped5 = "status eq 'Active' and severity eq 'Critical'";
        // workaround spelling check
        String queryEscaped5 = "status eq 'Active' and severity eq 'Critical'".replace(" ", "%20");

        ProxyMethodExample.ParameterValue parameterValue = new ProxyMethodExample.ParameterValue(queryNotEscaped1);
        Assertions.assertEquals(queryNotEscaped1, parameterValue.getUnescapedQueryValue().toString());

        parameterValue = new ProxyMethodExample.ParameterValue(queryNotEscaped2);
        Assertions.assertEquals(queryNotEscaped2, parameterValue.getUnescapedQueryValue().toString());

        parameterValue = new ProxyMethodExample.ParameterValue(queryEscaped3);
        Assertions.assertEquals(queryNotEscaped3, parameterValue.getUnescapedQueryValue().toString());

        parameterValue = new ProxyMethodExample.ParameterValue(queryEscaped4);
        Assertions.assertEquals(queryNotEscaped4, parameterValue.getUnescapedQueryValue().toString());

        parameterValue = new ProxyMethodExample.ParameterValue(queryEscaped5);
        Assertions.assertEquals(queryNotEscaped5, parameterValue.getUnescapedQueryValue().toString());
    }
}
