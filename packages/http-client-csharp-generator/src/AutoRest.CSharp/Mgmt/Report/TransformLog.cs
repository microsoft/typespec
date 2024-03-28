// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class TransformLog
    {
        public TransformLog(int index, string targetFullSerializedName, string logMessage)
        {
            Index = index;
            LogMessage = logMessage;
            TargetFullSerializedName = targetFullSerializedName;
        }

        public int Index { get; }
        public string LogMessage { get; }
        public string TargetFullSerializedName { get; }

        public override string ToString()
        {
            return $"[{Index}][{TargetFullSerializedName}]: {LogMessage}";
        }

        public TransformLog Clone()
        {
            return new TransformLog(Index, TargetFullSerializedName, LogMessage);
        }
    }
}
