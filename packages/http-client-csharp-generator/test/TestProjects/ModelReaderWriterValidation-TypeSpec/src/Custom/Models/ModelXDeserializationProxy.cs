// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;

namespace ModelReaderWriterValidationTypeSpec.Models
{
    /// <summary>
    /// This is a model deserializing through a proxy
    /// </summary>
    [PersistableModelProxy(typeof(ModelX))]
    public class ModelXDeserializationProxy
    {
    }
}
