// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests
{
    public class NamedSymbol : TypeProvider
    {
        private readonly Type? _propertyType;
        private readonly string _typeName;
        protected override string BuildRelativeFilePath() => ".";

        protected override string BuildName() => _typeName;

        protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

        public NamedSymbol(Type? propertyType = null, string name = "NamedSymbol")
        {
            _propertyType = propertyType;
            _typeName = name;
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
                    Throw(Snippet.New.Instance(typeof(NotImplementedException))),
                    this)
            ];
        }

        protected override MethodProvider[] BuildMethods()
        {
            var intParam = new ParameterProvider("intParam", $"intParam", new CSharpType(typeof(int)));

            return
            [
                new MethodProvider(
                    new MethodSignature("Method1", $"Description of method1",
                        MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, typeof(Task<int>), null,
                        [intParam]),
                    Throw(Snippet.New.Instance(typeof(NotImplementedException))),
                    this)
            ];
        }
    }
}
