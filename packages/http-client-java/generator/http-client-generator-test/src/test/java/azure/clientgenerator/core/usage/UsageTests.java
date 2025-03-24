// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.usage;

import azure.clientgenerator.core.usage.models.InputModel;
import azure.clientgenerator.core.usage.models.OrphanModel;
import azure.clientgenerator.core.usage.models.OutputModel;
import azure.clientgenerator.core.usage.models.ResultModel;
import azure.clientgenerator.core.usage.models.RoundTripModel;
import com.azure.core.util.BinaryData;
import java.lang.reflect.Constructor;
import java.lang.reflect.Modifier;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class UsageTests {

    private final UsageClient client = new UsageClientBuilder().buildClient();

    @Test
    public void test() throws NoSuchMethodException {
        client.inputToInputOutput(new InputModel("Madge"));

        client.outputToInputOutput();

        // verify "OutputModel" class has public constructor
        Constructor<OutputModel> ctorOutputModel = OutputModel.class.getDeclaredConstructor(String.class);
        Assertions.assertEquals("public", Modifier.toString(ctorOutputModel.getModifiers()));

        RoundTripModel roundTripModel = client.modelInReadOnlyProperty(new RoundTripModel());
        Assertions.assertEquals("Madge", roundTripModel.getResult().getName());
        // verify "ResultModel" class has private constructor and no setter
        Constructor<ResultModel> ctorResultModel = ResultModel.class.getDeclaredConstructor(String.class);
        Assertions.assertEquals("private", Modifier.toString(ctorResultModel.getModifiers()));

        // verify "OrphanModel" (when made public) can be serialized (and de-serializable as well) to JSON
        client.orphanModelSerializableWithResponse(BinaryData.fromObject(new OrphanModel("name", "desc")), null);
    }
}
