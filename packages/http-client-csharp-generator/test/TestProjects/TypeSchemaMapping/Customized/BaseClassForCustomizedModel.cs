// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NamespaceForEnums;
using Azure.Core;

namespace CustomNamespace
{
    internal class BaseClassForCustomizedModel
    {
        [CodeGenMember("Fruit")]
        internal CustomFruitEnum CustomizedFancyField;
    }
}
