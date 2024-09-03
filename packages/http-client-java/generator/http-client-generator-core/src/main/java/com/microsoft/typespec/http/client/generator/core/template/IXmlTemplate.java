// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

/**
 * Writes a Client Model of type ModelT to a Java syntax context.
 */
public interface IXmlTemplate<ModelT, ContextT> {
    void write(ModelT model, ContextT context);
}
