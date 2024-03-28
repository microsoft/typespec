// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.MgmtTest.Models;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core.TestFramework;
using Azure.ResourceManager.TestFramework;

namespace AutoRest.CSharp.MgmtTest.Output.Mock
{
    internal class MgmtMockTestProvider<T> : MgmtTestProvider where T : MgmtTypeProvider
    {
        protected Parameter IsAsyncParameter => new(Name: "isAsync", Description: null, Type: typeof(bool), DefaultValue: null, ValidationType.None, null);

        public T Target { get; }
        public MgmtMockTestProvider(T provider, IEnumerable<MockTestCase> testCases) : base()
        {
            Target = provider;
            MockTestCases = testCases;
        }

        public IEnumerable<MockTestCase> MockTestCases { get; }
        public override FormattableString Description => $"Test for {Target.Type.Name}";
        protected override string DefaultName => $"{Target.Type.Name}MockTests";
        protected override string DefaultNamespace => $"{Target.Type.Namespace}.Tests.Mock";
        public override CSharpType? BaseType => typeof(MockTestBase);

        private ConstructorSignature? _ctor;
        public ConstructorSignature? Ctor => _ctor ??= EnsureCtor();
        protected virtual ConstructorSignature? EnsureCtor()
        {
            return new ConstructorSignature(
                Type,
                null,
                Description: $"Initializes a new instance of the <see cref=\"{Type.Name}\"/> class for mocking.",
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: new[] { IsAsyncParameter },
                Initializer: new ConstructorInitializer(
                    true,
                    new ValueExpression[] { IsAsyncParameter, new TypeReference(typeof(RecordedTestMode)).Property(nameof(RecordedTestMode.Record)) }));
        }
    }
}
