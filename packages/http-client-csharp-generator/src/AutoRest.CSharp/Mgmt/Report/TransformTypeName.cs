// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class TransformTypeName
    {
        #region Transforms configured in MgmtConfiguration
        public const string RenameMapping = "rename-mapping";
        public const string ParameterRenameMapping = "parameter-rename-mapping";
        public const string AcronymMapping = "acronym-mapping";
        public const string FormatByNameRules = "format-by-name-rules";
        public const string KeepPluralEnums = "keep-plural-enums";
        public const string OperationGroupsToOmit = "operation-groups-to-omit";
        public const string PrivilegedOperations = "privileged-operations";
        public const string RequestPathIsNonResource = "request-path-is-non-resource";
        public const string NoPropertyTypeReplacement = "no-property-type-replacement";
        public const string KeepPluralResourceData = "keep-plural-resource-data";
        public const string NoResourceSuffix = "no-resource-suffix";
        public const string PrependRpPrefix = "prepend-rp-prefix";
        public const string OverrideOperationName = "override-operation-name";
        #endregion

        #region Other Transforms
        public const string ReplacePropertyType = "replac-property-type";
        public const string ReplaceBaseType = "replac-base-type";
        public const string ReplaceTypeWhenInitializingModel = "replace-type-when-initializing-model";
        public const string UpdateBodyParameter = "update-body-parameter";
        #endregion
    }
}
