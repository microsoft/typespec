#Requires -Version 6.0
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$clonedPath = Join-Path $repoRoot 'artifacts/azure-sdk-for-net-shared'
$azCoreSharedPath = "sdk/core/Azure.Core/src/Shared/"
$armCoreSharedPath = "sdk/resourcemanager/Azure.ResourceManager/src/Shared/"

if(Test-Path $clonedPath)
{
    Remove-Item $clonedPath -Recurse -Force
}

Write-Host "git clone --no-checkout --filter=tree:0 https://github.com/Azure/azure-sdk-for-net.git $clonedPath"
git clone --no-checkout --filter=tree:0 https://github.com/Azure/azure-sdk-for-net.git $clonedPath
Push-Location $clonedPath
Write-Host "git sparse-checkout init"
git sparse-checkout init
Write-Host "git sparse-checkout set --no-cone $azCoreSharedPath $armCoreSharedPath"
git sparse-checkout set --no-cone $azCoreSharedPath $armCoreSharedPath
Write-Host "git checkout"
git checkout
Pop-Location

function CopyAll([string[]]$files, [string]$source, [string]$destination)
{
    foreach ($file in $files)
    {
        Write-Host "Copying $file to $destination"
        Copy-Item (Join-Path $source $file) (Join-Path $destination $file)
    }
}

$files = @('AsyncLockWithValue.cs', 'CallerShouldAuditAttribute.cs', 'ClientDiagnostics.cs', 'DiagnosticScope.cs', 'DiagnosticScopeFactory.cs', 'HttpMessageSanitizer.cs',
    'OperationInternalBase.cs', 'OperationInternal.cs', 'OperationInternalOfT.cs', 'TaskExtensions.cs', 'Multipart/MultipartFormDataContent.cs',
    'Multipart/MultipartContent.cs', 'AzureKeyCredentialPolicy.cs', 'AppContextSwitchHelper.cs',
    'OperationPoller.cs', 'FixedDelayWithNoJitterStrategy.cs', 'SequentialDelayStrategy.cs',
    'ForwardsClientCallsAttribute.cs', 'VoidValue.cs', 'AzureResourceProviderNamespaceAttribute.cs',
    'ChangeTrackingDictionary.cs',
    'FormUrlEncodedContent.cs',
    'HttpPipelineExtensions.cs',
    'IOperationSource.cs',
    'IUtf8JsonSerializable.cs',
    'IXmlSerializable.cs',
    'JsonElementExtensions.cs',
    'NextLinkOperationImplementation.cs',
    'NoValueResponseOfT.cs',
    'OperationFinalStateVia.cs',
    'Page.cs',
    'PageableHelpers.cs',
    'ProtocolOperation.cs',
    'ProtocolOperationHelpers.cs',
    'RawRequestUriBuilder.cs',
    'RequestContentHelper.cs',
    'RequestHeaderExtensions.cs',
    'RequestUriBuilderExtensions.cs',
    'ResponseHeadersExtensions.cs',
    'ResponseWithHeaders.cs',
    'ResponseWithHeadersOfTHeaders.cs',
    'ResponseWithHeadersOfTOfTHeaders.cs',
    'StringRequestContent.cs',
    'TypeFormatters.cs',
    'Utf8JsonRequestContent.cs',
    'Utf8JsonWriterExtensions.cs',
    'XElementExtensions.cs',
    'XmlWriterContent.cs',
    'XmlWriterExtensions.cs',
    'TrimmingAttribute.cs')
$sourcePath = "$clonedPath/sdk/core/Azure.Core/src/Shared/"
$destinationPath = "$repoRoot/src/assets/Azure.Core.Shared"

Get-ChildItem $destinationPath -Filter *.cs | Remove-Item;
CopyAll $files $sourcePath $destinationPath

#Download management Shared
$files = 'SharedExtensions.cs', 'ManagedServiceIdentityTypeV3Converter.cs'
$sourcePath = "$clonedPath/sdk/resourcemanager/Azure.ResourceManager/src/Shared"
$destinationPath = "$repoRoot/src/assets/Management.Shared"

Get-ChildItem $destinationPath -Filter *.cs | Remove-Item;
CopyAll $files $sourcePath $destinationPath

# Waiting before deleting the cloned repo to avoid file locking issues
Start-Sleep -Seconds 1
Remove-Item $clonedPath -Recurse -Force -ErrorAction SilentlyContinue
