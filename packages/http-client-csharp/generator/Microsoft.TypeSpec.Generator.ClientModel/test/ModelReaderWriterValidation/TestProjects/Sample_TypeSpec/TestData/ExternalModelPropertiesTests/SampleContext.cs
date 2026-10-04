// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using ExternalModels;
using SampleTypeSpec;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(ExternalModelProperties))]
    [ModelReaderWriterBuildable(typeof(PersistableExternalModel))]
    internal partial class SampleContext : ModelReaderWriterContext
    {
    }
}
