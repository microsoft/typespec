// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.MgmtTest.Models;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.MgmtTest.Output.Samples
{
    internal class MgmtSampleProvider : MgmtTestProvider
    {
        public MgmtTypeProvider Owner { get; }
        public IEnumerable<Sample> Samples { get; }

        public MgmtSampleProvider(MgmtTypeProvider owner, IEnumerable<Sample> samples) : base()
        {
            Owner = owner;
            Samples = samples;
        }

        private string? _defaultName;
        protected override string DefaultName => _defaultName ??= $"Sample_{Owner.Type.Name}";

        protected override string DefaultNamespace => $"{Owner.Type.Namespace}.Samples";

        // a sample class does not need a description
        public override FormattableString Description => $"";
    }
}
