// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package parameters.basic;

import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import parameters.basic.explicitbody.models.User;

public class BasicClientTests {
    private final ExplicitBodyClient explicitBodyClient = new BasicClientBuilder().buildExplicitBodyClient();
    private final ImplicitBodyClient implicitBodyClient = new BasicClientBuilder().buildImplicitBodyClient();

    @Test
    public void testBodyClient() {
        Response<Void> explicitResponse = explicitBodyClient.simpleWithResponse(new User("foo"), new RequestOptions());
        Response<Void> implicitResponse = implicitBodyClient.simpleWithResponse("foo", new RequestOptions());

        Assertions.assertNotNull(explicitResponse);
        Assertions.assertNotNull(implicitResponse);
    }
}
