# Open windows explorer and pre-select a target file
Start-Process explorer.exe ('/select,' + [System.Uri]::UnescapeDataString($env:url))

# Open a target file
Start-Process explorer.exe ([System.Uri]::UnescapeDataString($env:url))

<# 
    Note that the above powershell scripts are invoked using VBScript. This inhibits the "flashing" effect of the powershell window (where it would appear for a brief moment).
#> 

# Open windows explorer and pre-select a target file (hidden window)
mshta vbscript:Execute("CreateObject(""WScript.Shell"").Run ""powershell -WindowStyle Hidden -Command $url = '%1' -replace 'ladderr-select:', ''; Start-Process explorer.exe ('/select,' + [System.Uri]::UnescapeDataString($url))"", 0:close")

# Open a target file (hidden window)
mshta vbscript:Execute("CreateObject(""WScript.Shell"").Run ""powershell -WindowStyle Hidden -Command $url = '%1' -replace 'ladderr-open:', ''; Start-Process explorer.exe ([System.Uri]::UnescapeDataString($url))"", 0:close")