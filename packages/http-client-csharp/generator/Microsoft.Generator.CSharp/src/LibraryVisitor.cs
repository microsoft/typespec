// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Base class for visiting and potentially modifying the output library.
    /// </summary>
    public abstract class LibraryVisitor
    {
        internal virtual void Visit(OutputLibrary library)
        {
            // Ensure all types are built before visiting them
            foreach (var type in library.TypeProviders)
            {
                type.EnsureBuilt();
            }

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
                    var method = Visit(methodProvider);
                    if (method != null)
                    {
                        methods.Add(method);
                    }
                }

                var constructors = new List<ConstructorProvider>();
                foreach (var constructorProvider in typeProvider.Constructors)
                {
                    var constructor = Visit(constructorProvider);
                    if (constructor != null)
                    {
                        constructors.Add(constructor);
                    }
                }

                var properties = new List<PropertyProvider>();
                foreach (var propertyProvider in typeProvider.Properties)
                {
                    var property = Visit(propertyProvider);
                    if (property != null)
                    {
                        properties.Add(property);
                    }
                }

                var fields = new List<FieldProvider>();
                foreach (var fieldProvider in typeProvider.Fields)
                {
                    var field = Visit(fieldProvider);
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

        /// <summary>
        /// Visits an <see cref="InputModelType"/> and the converted <see cref="ModelProvider"/> and returns a possibly modified version of the <see cref="ModelProvider"/>.
        /// </summary>
        /// <param name="model">The original input model.</param>
        /// <param name="type">The current conversion.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="ModelProvider"/>.</returns>
        protected internal virtual ModelProvider? Visit(InputModelType model, ModelProvider? type)
        {
            return type;
        }

        /// <summary>
        /// Visits an <see cref="InputModelProperty"/> and the converted <see cref="PropertyProvider"/> and returns a possibly modified version of the <see cref="PropertyProvider"/>.
        /// </summary>
        /// <param name="property">The original input model property.</param>
        /// <param name="propertyProvider">The current conversion.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="PropertyProvider"/>.</returns>
        protected internal virtual PropertyProvider? Visit(InputModelProperty property, PropertyProvider? propertyProvider)
        {
            return propertyProvider;
        }

        /// <summary>
        /// Visits an <see cref="InputEnumType"/> and the converted <see cref="TypeProvider"/> and returns a possibly modified version of the <see cref="TypeProvider"/>.
        /// </summary>
        /// <param name="enumType">The original input enum.</param>
        /// <param name="type">The current conversion.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="TypeProvider"/>.</returns>
        protected internal virtual TypeProvider? Visit(InputEnumType enumType, TypeProvider? type)
        {
            return type;
        }

        /// <summary>
        /// Visits a <see cref="TypeProvider"/> and returns a possibly modified version of it.
        /// </summary>
        /// <param name="type">The original <see cref="TypeProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="TypeProvider"/>.</returns>
        protected virtual TypeProvider? Visit(TypeProvider type)
        {
            return type;
        }

        protected virtual void Foo() { }

        /// <summary>
        /// Visits a <see cref="TypeProvider"/> after all its members have been visited and returns a possibly modified version of it.
        /// </summary>
        /// <param name="type">The original <see cref="TypeProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="TypeProvider"/>.</returns>
        protected virtual TypeProvider? PostVisit(TypeProvider type)
        {
            return type;
        }

        /// <summary>
        /// Visits a <see cref="ConstructorProvider"/> and returns a possibly modified version of it.
        /// </summary>
        /// <param name="constructor">The original <see cref="ConstructorProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="ConstructorProvider"/>.</returns>
        protected virtual ConstructorProvider? Visit(ConstructorProvider constructor)
        {
            return constructor;
        }

        /// <summary>
        /// Visits a <see cref="MethodProvider"/> and returns a possibly modified version of it.
        /// </summary>
        /// <param name="method">The original <see cref="MethodProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="MethodProvider"/>.</returns>
        protected virtual MethodProvider? Visit(MethodProvider method)
        {
            return method;
        }

        /// <summary>
        /// Visits a <see cref="PropertyProvider"/> and returns a possibly modified version of it.
        /// </summary>
        /// <param name="property">The original <see cref="PropertyProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="PropertyProvider"/>.</returns>
        protected virtual PropertyProvider? Visit(PropertyProvider property)
        {
            return property;
        }

        /// <summary>
        /// Visits a <see cref="FieldProvider"/> and returns a possibly modified version of it.
        /// </summary>
        /// <param name="field">The original <see cref="FieldProvider"/>.</param>
        /// <returns>Null if it should be removed otherwise the modified version of the <see cref="FieldProvider"/>.</returns>
        protected virtual FieldProvider? Visit(FieldProvider field)
        {
            return field;
        }
    }
}
