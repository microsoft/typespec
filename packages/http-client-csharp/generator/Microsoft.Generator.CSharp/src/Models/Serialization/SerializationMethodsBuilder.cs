// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    internal static class SerializationMethodsBuilder
    {
        /// <summary>
        /// Builds the serialization methods for the model. If the serialization supports JSON, it will build the JSON serialization methods.
        /// </summary>
        /// <param name="serialization">The serialization type provider for the model.</param>
        /// <returns>A list of serialization and deserialization methods for the model.</returns>
        internal static CSharpMethod[] BuildSerializationMethods(ModelTypeSerializationProvider serialization)
        {
            var methods = new List<CSharpMethod>();

            // Build the JSON serialization methods
            if (serialization.Json != null)
            {
                foreach (var method in BuildJsonSerializationMethods(serialization.Interfaces))
                {
                    methods.Add(method);
                }

                // TO-DO: Add deserialization helper methods if applicable https://github.com/microsoft/typespec/issues/3330
            }

            // TO-DO: Add support for additional serialization formats (XML) https://github.com/microsoft/typespec/issues/3331

            // Build the IModel methods
            var iModelMethods = BuildIModelMethods(serialization.Interfaces, serialization.WireFormat);
            methods.AddRange(iModelMethods);

            return methods.ToArray();
        }

        /// <summary>
        /// Builds the JSON serialization methods for the model.
        /// </summary>
        /// <param name="interfaces">The serialization interfaces for the model.</param>
        /// <returns>A list of JSON serialization and deserialization methods for the model.</returns>
        internal static IList<CSharpMethod> BuildJsonSerializationMethods(SerializationInterfaces interfaces)
        {
            var jsonModelInterface = interfaces.IJsonModelTInterface;
            var persistableModelTInterface = interfaces.IPersistableModelTInterface;
            var methods = new List<CSharpMethod>();

            if (jsonModelInterface != null && persistableModelTInterface != null)
            {
                // Add the json serialization method
                var serializationMethod = Extensible.Model.BuildJsonModelSerializationMethod(jsonModelInterface);
                if (serializationMethod != null)
                {
                    methods.Add(serializationMethod);
                }

                // Add the json deserialization method
                var deserializationMethod = Extensible.Model.BuildJsonModelDeserializationMethod(jsonModelInterface);
                if (deserializationMethod != null)
                {
                    methods.Add(deserializationMethod);
                }

            }

            return methods;
        }

        /// <summary>
        /// Builds the I model methods for the model.
        /// </summary>
        /// <param name="interfaces">The serialization interfaces for the model.</param>
        /// <param name="wireFormat">The wire interchange format.</param>
        /// <returns>A list of I model methods.</returns>
        internal static IList<CSharpMethod> BuildIModelMethods(SerializationInterfaces interfaces, ValueExpression wireFormat)
        {
            var modelInterface = interfaces.IPersistableModelTInterface;
            var methods = new List<CSharpMethod>();

            if (modelInterface != null)
            {
                var serializationMethod = Extensible.Model.BuildIModelSerializationMethod(modelInterface);
                if (serializationMethod != null)
                {
                    methods.Add(serializationMethod);
                }

                var deserializationMethod = Extensible.Model.BuildIModelDeserializationMethod(modelInterface);
                if (deserializationMethod != null)
                {
                    methods.Add(deserializationMethod);
                }

                var getFormatMethod = Extensible.Model.BuildIModelGetFormatMethod(modelInterface, wireFormat);
                if (getFormatMethod != null)
                {
                    methods.Add(getFormatMethod);
                }
            }

            return methods;
        }
    }
}
