// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    [System.ClientModel.Primitives.PersistableModelProxy(typeof(UnknownActivity))]
    public abstract class PipelineActivity { }

    internal class UnknownActivity : PipelineActivity { }
}
