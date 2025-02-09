package com.microsoft.provisioning.http.client.generator.provisioning.model;

import java.lang.reflect.Type;

/**
 * Represents an external model in the Azure provisioning model.
 */
public class ExternalModel extends ModelBase {
    /**
     * Constructs a new ExternalModel.
     *
     * @param name Name of the external model.
     * @param namespace Namespace of the external model.
     */
    public ExternalModel(String name, String namespace) {
        super(name, namespace);
        setExternal(true);
    }

    public ExternalModel(Type armType) {
        super(((Class<?>) armType).getSimpleName(),((Class<?>) armType).getPackageName(), armType, null);
        setExternal(true);
    }
}
