// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.armcreateonly;

import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpMethod;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.HttpRequest;
import com.azure.core.test.http.MockHttpResponse;
import com.azure.core.util.Context;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;
import reactor.core.publisher.Mono;
import tsptest.armcreateonly.models.Assessment;

public class ResourceIdentityTests {
    private static final String PARENT_ID
        = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/assessments"
            + "/providers/TspTest.ArmCreateOnly/projects/project";
    private static final String ID = PARENT_ID + "/assessments/assessment";
    private static final String DOWNLOAD_URL = "https://example.com/assessment";
    private static final String RESOURCE_JSON = "{\"id\":\"" + ID
        + "\",\"name\":\"assessment\",\"type\":\"TspTest.ArmCreateOnly/projects/assessments\",\"properties\":{}}";
    private final AtomicReference<HttpRequest> request = new AtomicReference<>();
    private final ArmCreateOnlyManager manager
        = ArmCreateOnlyManager.authenticate(new HttpPipelineBuilder().httpClient(httpRequest -> {
            request.set(httpRequest);
            String path = httpRequest.getUrl().getPath();
            String body = path.endsWith("/downloadUrl")
                ? "{\"url\":\"" + DOWNLOAD_URL + "\"}"
                : path.endsWith("/assessments") ? "{\"value\":[" + RESOURCE_JSON + "]}" : RESOURCE_JSON;
            return Mono.just(new MockHttpResponse(httpRequest, 200,
                new HttpHeaders().set("Content-Type", "application/json"), body.getBytes(StandardCharsets.UTF_8)));
        }).build(), ArmUtils.getAzureProfile());

    @Test
    public void getRetainsResourceIdentity() {
        assertResourceOperations(manager.assessments().get("assessments", "project", "assessment"));
    }

    @Test
    public void getWithResponseRetainsResourceIdentity() {
        assertResourceOperations(
            manager.assessments().getWithResponse("assessments", "project", "assessment", Context.NONE).getValue());
    }

    @Test
    public void listRetainsResourceIdentity() {
        assertResourceOperations(manager.assessments().listByProject("assessments", "project").iterator().next());
    }

    @Test
    public void getByIdRetainsResourceIdentity() {
        assertResourceOperations(manager.assessments().getById(ID));
    }

    private void assertResourceOperations(Assessment resource) {
        Assertions.assertEquals(DOWNLOAD_URL, resource.downloadUrl().url());
        assertRequest(HttpMethod.POST, ID + "/downloadUrl");
        Assertions.assertEquals(DOWNLOAD_URL, resource.downloadUrlWithResponse(Context.NONE).getValue().url());
        assertRequest(HttpMethod.POST, ID + "/downloadUrl");
        Assertions.assertSame(resource, resource.refresh());
        assertRequest(HttpMethod.GET, ID);
        Assertions.assertSame(resource, resource.refresh(Context.NONE));
        assertRequest(HttpMethod.GET, ID);
    }

    private void assertRequest(HttpMethod method, String path) {
        Assertions.assertEquals(method, request.get().getHttpMethod());
        Assertions.assertEquals(path, request.get().getUrl().getPath());
    }
}
