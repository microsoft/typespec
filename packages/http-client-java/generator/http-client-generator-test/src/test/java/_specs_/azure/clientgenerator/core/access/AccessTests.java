// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package _specs_.azure.clientgenerator.core.access;

import _specs_.azure.clientgenerator.core.access.relativemodelinoperation.implementation.models.AbstractModel;
import _specs_.azure.clientgenerator.core.access.relativemodelinoperation.implementation.models.RealModel;
import _specs_.azure.clientgenerator.core.access.sharedmodelinoperation.models.SharedModel;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class AccessTests {

    private final PublicOperationClient publicClient = new AccessClientBuilder().buildPublicOperationClient();
    private final InternalOperationClient internalClient = new AccessClientBuilder().buildInternalOperationClient();
    private final SharedModelInOperationClient sharedClient
        = new AccessClientBuilder().buildSharedModelInOperationClient();
    private final RelativeModelInOperationClient relativeClient
        = new AccessClientBuilder().buildRelativeModelInOperationClient();

    @Test
    public void test() {
        publicClient.publicDecoratorInPublic("sample");
        publicClient.noDecoratorInPublic("sample");

        internalClient.internalDecoratorInInternal("sample");
        internalClient.noDecoratorInInternal("sample");
        internalClient.publicDecoratorInInternal("sample");

        sharedClient.publicMethod("sample");
        sharedClient.internalWithResponse("sample", null).getValue().toObject(SharedModel.class);

        relativeClient.operation("Madge");
        AbstractModel abstractModel = relativeClient.discriminator("real");
        Assertions.assertInstanceOf(RealModel.class, abstractModel);
    }
}
