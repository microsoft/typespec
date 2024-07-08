// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    internal class ClonedTypeProvider : TypeProvider
    {
        private readonly TypeProvider _original;
        private readonly OutputLibraryVisitor[]? _visitors;

        public ClonedTypeProvider(TypeProvider original, OutputLibraryVisitor[]? visitors)
        {
            _original = original;
            _visitors = visitors;
            foreach (var visitor in _visitors ?? [])
            {
                visitor.Visit(_original);
            }
        }

        public override string RelativeFilePath => _original.RelativeFilePath;
        public override string Name => _original.Name;

        public override string Namespace => _original.Namespace;

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new HashSet<MethodProvider>();
            foreach (var method in _original.Methods)
            {
                foreach (var visitor in _visitors ?? [])
                {
                    var newMethod = visitor.Visit(_original, method);
                    if (newMethod != null)
                    {
                        methods.Add(newMethod);
                    }
                    else
                    {
                        methods.Remove(method);
                    }
                }
            }

            return [.. methods];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            var properties = new HashSet<PropertyProvider>();
            foreach (var property in _original.Properties)
            {
                foreach (var visitor in _visitors ?? [])
                {
                    var newProperty = visitor.Visit(_original, property);
                    if (newProperty != null)
                    {
                        properties.Add(newProperty);
                    }
                    else
                    {
                        properties.Remove(property);
                    }
                }
            }

            return [.. properties];
        }
        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return _original.DeclarationModifiers;
        }

        protected override XmlDocProvider BuildXmlDocs()
        {
            return _original.XmlDocs;
        }

        protected override FieldProvider[] BuildFields()
        {
            return _original.Fields.ToArray();
        }

        protected override MethodProvider[] BuildConstructors()
        {
            return _original.Constructors.ToArray();
        }

        protected override TypeProvider[] BuildNestedTypes()
        {
            var result = _original.NestedTypes.ToArray();
            return result;
        }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return _original.SerializationProviders.ToArray();
        }

        protected override CSharpType[] BuildTypeArguments()
        {
            return _original.TypeArguments.ToArray();
        }

        protected override CSharpType[] BuildImplements()
        {
            return _original.Implements.ToArray();
        }
    }
}
