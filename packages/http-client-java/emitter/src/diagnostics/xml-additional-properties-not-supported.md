# XML additional properties are not supported

The Java emitter cannot serialize or deserialize additional properties in XML models, including `Record<unknown>`.

Define explicitly named XML properties, or use `@@alternateType` to select a Java-specific model matching the service's XML contract.
