// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public abstract class LibraryVisitor
    {
        internal virtual void Visit(OutputLibrary library)
        {
            var types = new List<TypeProvider>();
            foreach (var typeProvider in library.TypeProviders)
            {
                var type = VisitType(typeProvider);
                if (type != null)
                {
                    types.Add(type);
                }
            }
            library.TypeProviders = types;
        }

        private TypeProvider? VisitType(TypeProvider typeProvider)
        {
            var type = Visit(typeProvider);
            if (type != null)
            {
                var methods = new List<MethodProvider>();
                foreach (var methodProvider in typeProvider.Methods)
                {
                    var method = Visit(typeProvider, methodProvider);
                    if (method != null)
                    {
                        methods.Add(method);
                    }
                }

                var constructors = new List<ConstructorProvider>();
                foreach (var constructorProvider in typeProvider.Constructors)
                {
                    var constructor = Visit(typeProvider, constructorProvider);
                    if (constructor != null)
                    {
                        constructors.Add(constructor);
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

                var serializations = new List<TypeProvider>();
                foreach (var serializationProvider in typeProvider.SerializationProviders)
                {
                    var serialization = VisitType(serializationProvider);
                    if (serialization != null)
                    {
                        serializations.Add(serialization);
                    }
                }

                var nestedTypes = new List<TypeProvider>();
                foreach (var nestedTypeProvider in typeProvider.NestedTypes)
                {
                    var nestedType = VisitType(nestedTypeProvider);
                    if (nestedType != null)
                    {
                        nestedTypes.Add(nestedType);
                    }
                }

                type.Update(methods, constructors, properties, fields, serializations, nestedTypes);
                type = PostVisit(type);
            }
            return type;
        }

        protected internal virtual TypeProvider? Visit(InputModelType model, TypeProvider? type)
        {
            return new ModelProvider(model);
        }

        protected internal virtual PropertyProvider? Visit(InputModelProperty property, PropertyProvider? propertyProvider)
        {
            return new PropertyProvider(property);
        }

        protected internal virtual TypeProvider? Visit(InputEnumType enumType, TypeProvider? type)
        {
            return EnumProvider.Create(enumType, type);
        }

        protected internal virtual MethodProviderCollection? Visit(InputOperation operation, TypeProvider enclosingType, MethodProviderCollection? methodProviderCollection)
        {
            return new MethodProviderCollection(operation, enclosingType);
        }

        protected virtual TypeProvider? Visit(TypeProvider type)
        {
            return type;
        }

        protected virtual TypeProvider? PostVisit(TypeProvider type)
        {
            return type;
        }

        protected virtual ConstructorProvider? Visit(TypeProvider enclosingType, ConstructorProvider constructor)
        {
            return constructor;
        }

        protected virtual MethodProvider? Visit(TypeProvider enclosingType, MethodProvider method)
        {
            return method;
        }

        protected virtual PropertyProvider? Visit(TypeProvider enclosingType, PropertyProvider property)
        {
            return property;
        }

        protected virtual FieldProvider? Visit(TypeProvider enclosingType, FieldProvider field)
        {
            return field;
        }
    }
}
