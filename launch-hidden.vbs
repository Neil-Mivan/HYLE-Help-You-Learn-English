Option Explicit

Dim shell, fileSystem, projectFolder, command
Set shell = CreateObject("WScript.Shell")
Set fileSystem = CreateObject("Scripting.FileSystemObject")

projectFolder = fileSystem.GetParentFolderName(WScript.ScriptFullName)
command = Chr(34) & fileSystem.BuildPath(projectFolder, "launch.cmd") & Chr(34)
shell.Run command, 0, False
