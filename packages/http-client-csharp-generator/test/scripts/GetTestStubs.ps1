$filePath = Join-Path $PSScriptRoot 'TestList.txt'
$fileContent = Get-Content $filePath
$definitionText = @'

        [Test]
        public Task 
'@
$tests = foreach($line in $fileContent)
{
    $firstLetter = "$($line[0])".ToUpper()
    $testText = if($firstLetter -eq 'G')
    {
        '() => Test(async (host, pipeline) => { await Task.FromException(new Exception()); });'
    }
    else
    {
        '() => TestStatus(async (host, pipeline) => { await Task.FromException(new Exception()); return null; });'
    }
    $testName = "$firstLetter$($line.Substring(1))"
    "$definitionText$testName$testText"
}
$tests | Out-File -FilePath $filePath