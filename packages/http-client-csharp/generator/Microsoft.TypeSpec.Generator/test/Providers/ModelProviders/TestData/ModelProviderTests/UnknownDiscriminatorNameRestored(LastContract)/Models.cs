// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;

namespace Sample.Models
{
    [PersistableModelProxy(typeof(UnknownActivity))]
    public class PipelineActivity { }

    [PersistableModelProxy(typeof(UnknownCopySource))]
    public class CopyActivitySource : PipelineActivity { }

    internal class UnknownActivity : PipelineActivity { }
    internal class UnknownCopySource : CopyActivitySource { }

    public class NoProxy { }

    [PersistableModelProxy(typeof(Other.UnknownActivity))]
    public class WrongNamespace { }

    [PersistableModelProxy(typeof(UnknownActivity))]
    [PersistableModelProxy(typeof(UnknownCopySource))]
    public class DuplicateProxy { }

    [PersistableModelProxy(typeof(MissingType))]
    public class UnresolvedProxy { }
}

namespace Other
{
    internal class UnknownActivity { }
}

namespace System.ClientModel.Primitives
{
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
    internal sealed class PersistableModelProxyAttribute : Attribute
    {
        public PersistableModelProxyAttribute(Type proxyType) { }
    }
}
