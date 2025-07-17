// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class NamedSymbol : TypeProvider
    {
        private readonly Type? _propertyType;
        private readonly Type? _parameterType;
        private readonly ValueExpression? _parameterDefaultValue;
        private readonly string _typeName;
        private readonly string _typeNamespace;
        protected override string BuildRelativeFilePath() => ".";

        protected override string BuildName() => _typeName;

        protected override string BuildNamespace() => _typeNamespace;

        public NamedSymbol(
            Type? propertyType = null,
            Type? parameterType = null,
            ValueExpression? parameterDefaultValue = null,
            string name = "NamedSymbol",
            string @namespace = "Sample.Models")
        {
            _propertyType = propertyType;
            _parameterType = parameterType;
            _parameterDefaultValue = parameterDefaultValue;
            _typeName = name;
            _typeNamespace = @namespace;
        }

        protected override FieldProvider[] BuildFields()
        {
            return
            [
                new FieldProvider(FieldModifiers.Public, typeof(int), "IntField", new TestTypeProvider(),
                    $"PublicIntField field"),
                new FieldProvider(FieldModifiers.Private, typeof(string), "StringField", new TestTypeProvider(),
                    $"PrivateStringField field no setter"),
                new FieldProvider(FieldModifiers.Internal, typeof(double), "DoubleField", new TestTypeProvider(),
                    $"InternalDoubleField field"),
                new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(float), "FloatField",
                    new TestTypeProvider(), $"PublicStaticFloatField field"),
            ];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            if (_propertyType == null)
            {
                return
                [
                    new PropertyProvider($"IntProperty property", MethodSignatureModifiers.Public, typeof(int),
                        "IntProperty", new AutoPropertyBody(true), this),
                    new PropertyProvider($"StringProperty property no setter", MethodSignatureModifiers.Public,
                        typeof(string), "StringProperty", new AutoPropertyBody(false), this),
                    new PropertyProvider($"InternalStringProperty property no setter", MethodSignatureModifiers.Public,
                        typeof(string), "InternalStringProperty", new AutoPropertyBody(false), this),
                    new PropertyProvider($"PropertyTypeProperty property", MethodSignatureModifiers.Public,
                        new PropertyType().Type, "PropertyTypeProperty", new AutoPropertyBody(true), this),
                    new PropertyProvider($"NullWireInfo property", MethodSignatureModifiers.Public,
                        new PropertyType().Type, "NullWireInfoProperty", new AutoPropertyBody(true), this),
                ];
            }

            return
            [
                new PropertyProvider($"p1", MethodSignatureModifiers.Public, _propertyType, "P1",
                    new AutoPropertyBody(true), this)
            ];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            var intParam = new ParameterProvider("intParam", $"intParam", new CSharpType(typeof(int)));

            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(Type, $"Initializes a new instance of {Type}",
                        MethodSignatureModifiers.Public, [intParam]),
                    Throw(New.Instance(typeof(NotImplementedException))),
                    this)
            ];
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<ParameterProvider> parameters = new();
            var parameterType = _parameterType ?? typeof(int);
            if (_parameterDefaultValue != null)
            {
                parameters.Add(new ParameterProvider("p1", $"param", new CSharpType(parameterType), _parameterDefaultValue));
            }
            else
            {
                parameters.Add(new ParameterProvider("intParam", $"intParam", new CSharpType(parameterType)));
            }

            return
            [
                new MethodProvider(
                    new MethodSignature("Method1", $"Description of method1",
                        MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, typeof(Task<int>), null,
                        parameters),
                    Throw(New.Instance(typeof(NotImplementedException))),
                    this),
                // explicit interface implementation
                new MethodProvider(
                    new MethodSignature("DisposeAsync", $"",
                        MethodSignatureModifiers.Async, typeof(ValueTask), null,
                        [],
                        ExplicitInterface: new CSharpType(typeof(IAsyncDisposable))),
                    Throw(New.Instance(typeof(NotImplementedException))),
                    this)
            ];
        }

        protected override TypeProvider[] BuildNestedTypes()
        {
            return [new TestTypeProvider("Foo")];
        }

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial |TypeSignatureModifiers.Class;
    }
}
