import os
import sys
import subprocess
import urllib.parse

# Get path from command arguments
path = urllib.parse.unquote(sys.argv[1])
# If it's a file, add the '/select' option to open the parent folder with the file selected
path = path if os.path.isdir(path) else '/select,' + path
# Call explorer.exe and open the folder
subprocess.call(['explorer', path])

# Minified code 
'''
import os,sys,subprocess as B,urllib.parse
A=urllib.parse.unquote(sys.argv[1])
A=A if os.path.isdir(A)else'/select,'+A
B.call(['explorer',A])
'''

# One-line code in command form
'''
python -c "import os,sys,subprocess as B,urllib.parse;A=urllib.parse.unquote(sys.argv[1]);A=A if os.path.isdir(A)else'/select,'+A;B.call(['explorer',A])"
'''