// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class MappedModelBaseUpgradeTests
    {
        [TestCase(typeof(PlainDerived), true)]
        [TestCase(typeof(OverrideDerived), true)]
        [TestCase(typeof(EventOverrideDerived), true)]
        [TestCase(typeof(FieldLikeEventOverrideDerived), true)]
        [TestCase(typeof(EventHidingDerived), false)]
        [TestCase(typeof(HidingDerived), false)]
        [TestCase(typeof(PrivateHidingDerived), false)]
        [TestCase(typeof(OverloadDerived), false)]
        [TestCase(typeof(Unrelated), false)]
        public void UpgradeMustRetainTheCurrentFrameworkContract(Type candidateType, bool compatible)
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var input = InputFactory.Model("Derived", properties: [], baseModel: currentBase);
            MockHelpers.LoadMockGenerator(inputModelTypes: [currentBase, input],
                createModelCore: model => model == currentBase
                    ? new SystemObjectModelProvider(new CSharpType(typeof(Ancestor)), model)
                    : new ModelProvider(model));

            var model = new ModelProvider(input);
            var candidate = new SystemObjectModelProvider(new CSharpType(candidateType), currentBase,
                new ModelProvider(InputFactory.Model("Historical", properties: [])), []);
            Assert.That(MappedModelBaseUpgrade.CanReplaceCurrentBase(model, candidate), Is.EqualTo(compatible));
        }

        public class Ancestor
        {
            public virtual string Value { get; set; } = string.Empty;
            public virtual string Describe() => Value;
            public virtual event EventHandler? Changed { add { } remove { } }
        }
        public class PlainDerived : Ancestor { }
        public class OverrideDerived : Ancestor
        {
            public override string Value { get; set; } = string.Empty;
            public override string Describe() => Value;
        }
        public class EventOverrideDerived : Ancestor
        {
            public override event EventHandler? Changed { add { } remove { } }
        }
        public class FieldLikeEventOverrideDerived : Ancestor
        {
            public override event EventHandler? Changed;
            public void RaiseChanged() => Changed?.Invoke(this, EventArgs.Empty);
        }
        public class EventHidingDerived : Ancestor
        {
            public new event EventHandler? Changed { add { } remove { } }
        }
        public class HidingDerived : Ancestor
        {
            public new int Value { get; set; }
        }
        public class PrivateHidingDerived : Ancestor
        {
            private new string Value { get; set; } = string.Empty;
        }
        public class OverloadDerived : Ancestor
        {
            public string Describe(int value) => value.ToString();
        }
        public class Unrelated { }
    }
}
