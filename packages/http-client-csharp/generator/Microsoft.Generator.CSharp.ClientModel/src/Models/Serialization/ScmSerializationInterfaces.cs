// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal class ScmSerializationInterfaces : SerializationInterfaces
    {
        private readonly CSharpType _modelType;
        private readonly bool _isStruct;

        public ScmSerializationInterfaces(TypeProvider typeProvider, bool hasJson, bool hasXml) : base(typeProvider, hasJson, hasXml)
        {
            _modelType = typeProvider.Type;
            _isStruct = typeProvider.IsStruct;

            if (hasJson)
            {
                IJsonModelTInterface = new CSharpType(typeof(IJsonModel<>), _modelType);
                IPersistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), _modelType);
                IJsonModelObjectInterface = _isStruct ? (CSharpType)typeof(IJsonModel<object>) : null;
                IPersistableModelObjectInterface = _isStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
            }

            // TO-DO: Handle XML serialization https://github.com/microsoft/typespec/issues/3331
        }

        protected override IReadOnlyList<CSharpType> BuildInterfaces()
        {
            bool hasIJsonT = false;
            bool hasIJsonObject = false;
            var interfaces = new List<CSharpType>();

            if (IJsonModelTInterface is not null)
            {
                interfaces.Add(IJsonModelTInterface);
                hasIJsonT = true;
            }
            if (IJsonModelObjectInterface is not null)
            {
                interfaces.Add(IJsonModelObjectInterface);
                hasIJsonObject = true;
            }
            if (!hasIJsonT && IPersistableModelTInterface is not null)
            {
                interfaces.Add(IPersistableModelTInterface);
            }
            if (!hasIJsonObject && IPersistableModelObjectInterface is not null)
            {
                interfaces.Add(IPersistableModelObjectInterface);
            }
            return interfaces;
        }
    }
}
