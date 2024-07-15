// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public abstract class OutputLibraryVisitor
    {
        internal void Visit(OutputLibrary outputLibrary)
        {
            var types = new List<TypeProvider>();
            // TODO add more things to visit, e.g Constructors, Parameters, etc - https://github.com/microsoft/typespec/issues/3825
            foreach (var typeProvider in outputLibrary.TypeProviders)
            {
                var type = Visit(typeProvider);
                if (type != null)
                {
                    types.Add(type);

                    var methods = new List<MethodProvider>();
                    foreach (var methodProvider in typeProvider.Methods)
                    {
                        var method = Visit(typeProvider, methodProvider);
                        if (method != null)
                        {
                            methods.Add(method);
                        }
                    }

                    var properties = new List<PropertyProvider>();
                    foreach (var propertyProvider in typeProvider.Properties)
                    {
                        var property = Visit(typeProvider, propertyProvider);
                        if (property != null)
                        {
                            properties.Add(property);
                        }
                    }

                    var fields = new List<FieldProvider>();
                    foreach (var fieldProvider in typeProvider.Fields)
                    {
                        var field = Visit(typeProvider, fieldProvider);
                        if (field != null)
                        {
                            fields.Add(field);
                        }
                    }

                    type.Update(methods, properties, fields);
                }
            }
            outputLibrary.TypeProviders = types;
        }

        protected virtual TypeProvider? Visit(TypeProvider typeProvider)
        {
            return typeProvider;
        }

        protected virtual ConstructorProvider? Visit(TypeProvider typeProvider, ConstructorProvider constructorProvider)
        {
            return constructorProvider;
        }

        protected virtual MethodProvider? Visit(TypeProvider typeProvider, MethodProvider methodProvider)
        {
            return methodProvider;
        }

        protected virtual PropertyProvider? Visit(TypeProvider typeProvider, PropertyProvider propertyProvider)
        {
            return propertyProvider;
        }

        protected virtual FieldProvider? Visit(TypeProvider typeProvider, FieldProvider fieldProvider)
        {
            return fieldProvider;
        }
    }
}
