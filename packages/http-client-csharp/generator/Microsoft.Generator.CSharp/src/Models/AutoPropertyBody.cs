// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    internal record AutoPropertyBody() : PropertyBody
    {
        public AutoPropertyBody(ValueExpression initializationExpression) : this()
        {
            InitializationExpression = initializationExpression;
        }

        public AutoPropertyBody(MethodSignatureModifiers setterModifiers, ValueExpression? initializationExpression = null) : this()
        {
            HasSetter = true;
            SetterModifiers = setterModifiers;
            InitializationExpression = initializationExpression;
        }

        public bool HasSetter { get; init; } = false;

        public MethodSignatureModifiers SetterModifiers { get; init; } = MethodSignatureModifiers.None;

        public ValueExpression? InitializationExpression { get; init; }

        public void Deconstruct(out bool hasSetter, out MethodSignatureModifiers setterModifiers, out ValueExpression? initializationExpression)
        {
            hasSetter = HasSetter;
            setterModifiers = SetterModifiers;
            initializationExpression = InitializationExpression;
        }
    }
}
