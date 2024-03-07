// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoRest.CSharp.Input;

namespace AutoRest.CSharp.Common.Decorator
{
    /// <summary>
    /// This class is used to eliminate the value of ClientDefaultValue which is defined in the "x-ms-client-default" property attribute.
    /// We will not generate any client default value into the SDK for model property, so we remove it from the code model.
    /// </summary>
    internal class ModelPropertyClientDefaultValueTransformer
    {
        public static void Transform(CodeModel codeModel)
        {
            foreach (var schema in codeModel.AllSchemas.OfType<ObjectSchema>())
            {
                foreach (var property in schema.Properties)
                {
                    /* eliminate the client default value of model property */
                    property.ClientDefaultValue = null;
                }
            }
        }

    }
}
