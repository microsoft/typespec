// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;

namespace Sample.Models
{
    [PersistableModelProxy(typeof(UnknownPipelineActivity))]
    public class Tail { }

    [PersistableModelProxy(typeof(UnknownActivity))]
    public class PipelineActivity { }

    [PersistableModelProxy(typeof(OldUnknownActivity))]
    public class Activity { }

    internal class UnknownPipelineActivity : Tail { }
    internal class UnknownActivity : PipelineActivity { }
    internal class OldUnknownActivity : Activity { }

    [PersistableModelProxy(typeof(UnknownSwapSecond))]
    public class SwapFirst { }

    [PersistableModelProxy(typeof(UnknownSwapFirst))]
    public class SwapSecond { }

    internal class UnknownSwapSecond : SwapFirst { }
    internal class UnknownSwapFirst : SwapSecond { }

    [PersistableModelProxy(typeof(UnknownCycleSecond))]
    public class CycleFirst { }

    [PersistableModelProxy(typeof(UnknownCycleThird))]
    public class CycleSecond { }

    [PersistableModelProxy(typeof(UnknownCycleFirst))]
    public class CycleThird { }

    internal class UnknownCycleSecond : CycleFirst { }
    internal class UnknownCycleThird : CycleSecond { }
    internal class UnknownCycleFirst : CycleThird { }

    [PersistableModelProxy(typeof(UnknownCompetingFirst))]
    public class CompetingTail { }

    [PersistableModelProxy(typeof(SharedUnknown))]
    public class CompetingFirst { }

    [PersistableModelProxy(typeof(SharedUnknown))]
    public class CompetingSecond { }

    internal class UnknownCompetingFirst : CompetingTail { }
    internal class SharedUnknown : CompetingFirst { }
}

namespace Other.Models
{
    [PersistableModelProxy(typeof(Sharedunknown))]
    public class CaseCompeting { }

    internal class Sharedunknown : CaseCompeting { }
}

namespace System.ClientModel.Primitives
{
    [AttributeUsage(AttributeTargets.Class)]
    internal sealed class PersistableModelProxyAttribute : Attribute
    {
        public PersistableModelProxyAttribute(Type proxyType) { }
    }
}
