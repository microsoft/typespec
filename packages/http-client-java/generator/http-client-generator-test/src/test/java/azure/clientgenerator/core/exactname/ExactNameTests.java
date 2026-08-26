// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.exactname;

import azure.clientgenerator.core.exactname.enumvalue.models.AgentEndpointProtocol;
import azure.clientgenerator.core.exactname.enumvalue.models.EndpointConfig;
import azure.clientgenerator.core.exactname.model.models.my_model;
import azure.clientgenerator.core.exactname.property.models.ScopedModel;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ExactNameTests {

    private final ModelClient modelClient = new ExactNameClientBuilder().buildModelClient();
    private final PropertyClient propertyClient = new ExactNameClientBuilder().buildPropertyClient();
    private final EnumValueClient enumValueClient = new ExactNameClientBuilder().buildEnumValueClient();
    private final OperationClient operationClient = new ExactNameClientBuilder().buildOperationClient();
    private final ParameterClient parameterClient = new ExactNameClientBuilder().buildParameterClient();

    @Test
    public void testModelExactName() {
        my_model response = modelClient.send(new my_model("test"));
        Assertions.assertEquals("test", response.getName());
        Assertions.assertEquals("my_model", my_model.class.getSimpleName());
    }

    @Test
    public void testPropertyExactName() throws NoSuchMethodException {
        ScopedModel response = propertyClient.send(new ScopedModel("test"));
        Assertions.assertEquals("test", response.get_myName());

        Method getter = ScopedModel.class.getDeclaredMethod("get_myName");
        Assertions.assertNotNull(getter);
    }

    @Test
    public void testEnumValueExactName() {
        EndpointConfig response = enumValueClient.send(new EndpointConfig(AgentEndpointProtocol.A2A));
        Assertions.assertEquals(AgentEndpointProtocol.A2A, response.getProtocol());
        Assertions.assertEquals("a2a", AgentEndpointProtocol.A2A.toString());
    }

    @Test
    public void testOperationAndParameterCalls() {
        operationClient.myOp();
        parameterClient.send("hello");
    }
}
