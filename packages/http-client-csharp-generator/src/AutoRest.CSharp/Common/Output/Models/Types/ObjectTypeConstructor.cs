// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class ObjectTypeConstructor
    {
        public ObjectTypeConstructor(ConstructorSignature signature, IReadOnlyList<ObjectPropertyInitializer> initializers, ObjectTypeConstructor? baseConstructor = null)
        {
            Signature = signature;
            Initializers = initializers;
            BaseConstructor = baseConstructor;
        }

        public ObjectTypeConstructor(CSharpType type, MethodSignatureModifiers modifiers, IReadOnlyList<Parameter> parameters, IReadOnlyList<ObjectPropertyInitializer> initializers, ObjectTypeConstructor? baseConstructor = null)
            : this(
                 new ConstructorSignature(
                     type,
                     $"Initializes a new instance of {type:C}",
                     null,
                     modifiers,
                     parameters,
                     Initializer: new(isBase: true, baseConstructor?.Signature.Parameters ?? Array.Empty<Parameter>())),
                 initializers,
                 baseConstructor)
        {
        }

        public ConstructorSignature Signature { get; }
        public IReadOnlyList<ObjectPropertyInitializer> Initializers { get; }
        public ObjectTypeConstructor? BaseConstructor { get; }

        public ObjectTypeProperty? FindPropertyInitializedByParameter(Parameter constructorParameter)
        {
            foreach (var propertyInitializer in Initializers)
            {
                var value = propertyInitializer.Value;
                if (value.IsConstant)
                    continue;

                if (value.Reference.Name == constructorParameter.Name)
                {
                    return propertyInitializer.Property;
                }
            }

            return BaseConstructor?.FindPropertyInitializedByParameter(constructorParameter);
        }

        public Parameter? FindParameterByInitializedProperty(ObjectTypeProperty property)
        {
            foreach (var propertyInitializer in Initializers)
            {
                if (propertyInitializer.Property == property)
                {
                    if (propertyInitializer.Value.IsConstant)
                    {
                        continue;
                    }

                    var parameterName = propertyInitializer.Value.Reference.Name;
                    return Signature.Parameters.Single(p => p.Name == parameterName);
                }
            }

            return BaseConstructor?.FindParameterByInitializedProperty(property);
        }
    }
}
