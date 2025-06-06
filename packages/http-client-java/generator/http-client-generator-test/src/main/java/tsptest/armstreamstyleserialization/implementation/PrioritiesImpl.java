// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.armstreamstyleserialization.implementation;

import com.azure.core.http.rest.Response;
import com.azure.core.util.Context;
import com.azure.core.util.logging.ClientLogger;
import tsptest.armstreamstyleserialization.fluent.PrioritiesClient;
import tsptest.armstreamstyleserialization.models.Priorities;
import tsptest.armstreamstyleserialization.models.Priority;

public final class PrioritiesImpl implements Priorities {
    private static final ClientLogger LOGGER = new ClientLogger(PrioritiesImpl.class);

    private final PrioritiesClient innerClient;

    private final tsptest.armstreamstyleserialization.ArmResourceProviderManager serviceManager;

    public PrioritiesImpl(PrioritiesClient innerClient,
        tsptest.armstreamstyleserialization.ArmResourceProviderManager serviceManager) {
        this.innerClient = innerClient;
        this.serviceManager = serviceManager;
    }

    public Response<Priority> setPriorityWithResponse(Priority priority, Context context) {
        return this.serviceClient().setPriorityWithResponse(priority, context);
    }

    public Priority setPriority(Priority priority) {
        return this.serviceClient().setPriority(priority);
    }

    private PrioritiesClient serviceClient() {
        return this.innerClient;
    }

    private tsptest.armstreamstyleserialization.ArmResourceProviderManager manager() {
        return this.serviceManager;
    }
}
