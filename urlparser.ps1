# Open windows explorer and pre-select a target file
Start-Process explorer.exe ('/select,' + [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($env:url)))

# Open a target file
Start-Process explorer.exe ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($env:url)))

<# 
    Note that the above powershell scripts are invoked using conhost.exe --headless. This inhibits the "flashing" effect of the powershell window (where it would appear for a brief moment).
#> 

# Open windows explorer and pre-select a target file (hidden window)
conhost.exe --headless powershell -WindowStyle Hidden -Command $url = '%1' -replace 'ladderr-select:', ''; Start-Process explorer.exe ('/select,' + (New-Object -ComObject Scripting.FileSystemObject).GetFile([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($url))).ShortPath)

# Open a target file (hidden window)
conhost.exe --headless powershell -WindowStyle Hidden -Command $url = '%1' -replace 'ladderr-open:', ''; Start-Process explorer.exe ((New-Object -ComObject Scripting.FileSystemObject).GetFile([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($url))).ShortPath)

<# 
    Alternative approaches for hiding the powershell window:
#> 

# Open windows explorer and pre-select a target file (hidden window using VBScript)
mshta vbscript:Execute("CreateObject(""WScript.Shell"").Run ""powershell -WindowStyle Hidden -Command $url = '%1' -replace 'ladderr-select:', ''; Start-Process explorer.exe ('/select,' + [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($url)))"", 0:close")

# Open a target file (hidden window using VBScript)
mshta vbscript:Execute("CreateObject(""WScript.Shell"").Run ""powershell -WindowStyle Hidden -Command $url = '%1'$; Start-Process explorer.exe ([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($url)))"", 0:close")

# Open windows explorer and pre-select a target file (hidden window using CMD)
cmd /c set url=%1 & call set url=%%url:ladderr-select:=%% & start /min powershell -WindowStyle Hidden -Command "Start-Process explorer.exe ('/select,' + (New-Object -ComObject Scripting.FileSystemObject).GetFile('\\?\UNC\' + [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($env:url))).ShortPath)"

# Open a target file (hidden window using CMD)
cmd /c set url=%1 & call set url=%%url:ladderr-open:=%% & start /min powershell -WindowStyle Hidden -Command "Start-Process explorer.exe ((New-Object -ComObject Scripting.FileSystemObject).GetFile('\\?\UNC\' + [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($env:url))).ShortPath)"