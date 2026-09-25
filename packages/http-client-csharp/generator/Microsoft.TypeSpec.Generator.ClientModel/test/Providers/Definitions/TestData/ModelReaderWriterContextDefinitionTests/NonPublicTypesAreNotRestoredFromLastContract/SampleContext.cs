// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Models.InternalModel))]
    [ModelReaderWriterBuildable(typeof(Models.PublicModel))]
    [ModelReaderWriterBuildable(typeof(Models.InternalCustomModel))]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}

namespace Sample.Models
{
    public class InternalModel
    {
    }

    public class PublicModel
    {
    }

    public class InternalCustomModel
    {
    }
}
