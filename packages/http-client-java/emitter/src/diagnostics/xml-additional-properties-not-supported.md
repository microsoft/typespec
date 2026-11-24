# XML additional properties are not supported

The Java emitter cannot serialize or deserialize additional properties in XML models, direct dictionary bodies, or dictionaries nested in arrays and other dictionaries. XML model properties of type `Record<string>` remain supported.

Define explicitly named XML properties, or use `@@alternateType` to select a Java-specific model matching the service's XML contract.
