// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;
using System.Text;
using Azure.Core;

namespace MgmtDiscriminator
{
    /// <summary>
    ///
    /// </summary>
    [CodeGenSerialization(nameof(LocationWithCustomSerialization), BicepSerializationValueHook = nameof(SerializeLocation))]
    public partial class DeliveryRuleData
    {
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private void SerializeLocation(StringBuilder builder)
        {
            // this is the logic we would like to have for the value serialization
            builder.AppendLine($" '{AzureLocation.BrazilSouth}'");
        }
    }
}
