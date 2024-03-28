// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Models;

namespace AutoRest.CSharp.Mgmt.Output
{
    /// <summary>
    /// MgmtExtensionsWrapper is a wrapper of all the <see cref="MgmtExtension"/>, despite the <see cref="MgmtExtension"/> is inheriting from <see cref="MgmtTypeProvider"/>, currently it will not produce a class in the generated code.
    /// In ArmCore, we will not use this class because Azure.ResourceManager does not need to generate extension classes, we just need to generate partial classes to extend them because those "to be extended" types are defined in Azure.ResourceManager.
    /// In other packages, we need this TypeProvider to generate one big extension class that contains all the extension methods.
    /// </summary>
    internal class MgmtExtensionWrapper : MgmtTypeProvider
    {
        public IEnumerable<MgmtExtension> Extensions { get; }

        public IEnumerable<MgmtMockableExtension> MockingExtensions { get; }

        public override bool IsStatic => true;

        public bool IsEmpty => Extensions.All(extension => extension.IsEmpty);

        public MgmtExtensionWrapper(IEnumerable<MgmtExtension> extensions, IEnumerable<MgmtMockableExtension> mockingExtensions) : base(MgmtContext.RPName)
        {
            DefaultName = $"{ResourceName}Extensions";
            Description = Configuration.MgmtConfiguration.IsArmCore ? (FormattableString)$"" : $"A class to add extension methods to {MgmtContext.Context.DefaultNamespace}.";
            Extensions = extensions;
            MockingExtensions = mockingExtensions;
        }

        public override CSharpType? BaseType => null;

        public override FormattableString Description { get; }

        protected override string DefaultName { get; }

        protected override string DefaultAccessibility => "public";

        protected override IEnumerable<MgmtClientOperation> EnsureClientOperations()
        {
            foreach (var extension in Extensions)
            {
                foreach (var operation in extension.ClientOperations)
                {
                    yield return operation;
                }
            }
        }
    }
}
