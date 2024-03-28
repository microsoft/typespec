// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Output.Models.Shared
{
    internal abstract class PropertyBag
    {
        protected PropertyBag(string name)
        {
            Name = name;
        }

        protected string Name { get; }

        private bool? _shouldValidateParameter;
        private bool ShouldValidateParameter => _shouldValidateParameter ??= EnsureShouldValidateParameter();

        protected abstract bool EnsureShouldValidateParameter();

        private TypeProvider? _packModel;
        public TypeProvider PackModel => _packModel ??= EnsurePackModel();

        protected abstract TypeProvider EnsurePackModel();

        private Parameter? _packParameter;
        public Parameter PackParameter => _packParameter ??= EnsurePackParameter();

        private Parameter EnsurePackParameter()
        {
            return new Parameter(
                "options",
                $"A property bag which contains all the parameters of this method except the LRO qualifier and request context parameter.",
                TypeFactory.GetInputType(PackModel.Type),
                null,
                ShouldValidateParameter ? ValidationType.AssertNotNull : ValidationType.None,
                ShouldValidateParameter ? (FormattableString?)null : $"new {PackModel.Type.Name}()") with { IsPropertyBag = true };
        }
    }
}
