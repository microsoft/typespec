// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public abstract class PipelineActivity { }

    public abstract class CopyActivitySource : PipelineActivity { }

    internal class UnknownActivity : PipelineActivity { }

    internal class UnknownCopySource : CopyActivitySource { }
}
