' Claude Messenger — Cloud Launcher
' Just opens the app — server runs in the cloud on Render

Option Explicit
Dim shell, fso, appDir, electronPath

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the folder this .vbs file lives in
appDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Check Node.js is installed
On Error Resume Next
shell.Run "cmd /c node --version > nul 2>&1", 0, True
If Err.Number <> 0 Or shell.Run("cmd /c node --version > nul 2>&1", 0, True) > 0 Then
    MsgBox "Node.js is not installed." & vbCrLf & vbCrLf & _
           "Please download and install it from:" & vbCrLf & _
           "https://nodejs.org", vbCritical, "Claude Messenger"
    WScript.Quit
End If
On Error GoTo 0

' Run npm install if node_modules doesn't exist
If Not fso.FolderExists(appDir & "\node_modules") Then
    shell.Run "cmd /c cd /d """ & appDir & """ && npm install", 0, True
End If

' Launch Electron — server is in the cloud, nothing to start locally
shell.Run "cmd /c cd /d """ & appDir & """ && npx electron . --no-sandbox", 0, False

WScript.Quit
