// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;

namespace Sample.Models
{
    [PersistableModelProxy(typeof(UnknownActivity))]
    public abstract class PipelineActivity { }

    [PersistableModelProxy(typeof(UnknownPipelineActivity))]
    public abstract class JobDetails { }

    internal class UnknownActivity : PipelineActivity { }

    internal class UnknownPipelineActivity : JobDetails { }
}
