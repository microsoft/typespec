// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Diagnostics.CodeAnalysis;
using System.Threading;
using System.Threading.Tasks;

namespace System.Diagnostics.CodeAnalysis
{
    [AttributeUsage(AttributeTargets.All, Inherited = false)]
    internal sealed class ExperimentalAttribute : Attribute
    {
        public ExperimentalAttribute(string diagnosticId) => DiagnosticId = diagnosticId;
        public string DiagnosticId { get; }
    }
}

namespace Sample.Models
{
    [System.Diagnostics.CodeAnalysis.Experimental("CUSTOM_MODEL")]
    public partial class Payload
    {
    }

    [System.Diagnostics.CodeAnalysis.Experimental("CUSTOM_ENUM")]
    public readonly partial struct Choice
    {
    }

    [Sample.Experimental("UNRELATED001")]
    public partial class Control
    {
    }
}

namespace Sample
{
    [AttributeUsage(AttributeTargets.All, Inherited = false)]
    internal sealed class ExperimentalAttribute : Attribute
    {
        public ExperimentalAttribute(string diagnosticId) { }
    }

    [System.Diagnostics.CodeAnalysis.Experimental("CUSTOM_CLIENT")]
    public partial class ChildClient
    {
        [System.Diagnostics.CodeAnalysis.Experimental("CUSTOM_METHOD")]
        public partial ClientResult Bar(RequestOptions options);
        [System.Diagnostics.CodeAnalysis.Experimental("CUSTOM_METHOD")]
        public partial Task<ClientResult> BarAsync(RequestOptions options);
        [System.Diagnostics.CodeAnalysis.Experimental("CUSTOM_METHOD")]
        public partial ClientResult Bar(CancellationToken cancellationToken);
        [System.Diagnostics.CodeAnalysis.Experimental("CUSTOM_METHOD")]
        public partial Task<ClientResult> BarAsync(CancellationToken cancellationToken);
    }
}
