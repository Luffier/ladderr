import sys
import subprocess
import urllib.parse

""" SELECT """

# Get path from command arguments
path = '/select,' + urllib.parse.unquote(sys.argv[1])
# Call explorer.exe and open the folder
subprocess.call(['explorer', path])

# Minified code 
'''
import sys,subprocess as A,urllib.parse
A.call(['explorer','/select,'+urllib.parse.unquote(sys.argv[1])])
'''

# One-line code in command form
'''
python -c "import sys,subprocess as A,urllib.parse;A.call(['explorer','/select,'+urllib.parse.unquote(sys.argv[1])])"
'''


""" OPEN """

# Get path from command arguments
path = urllib.parse.unquote(sys.argv[1])
# Call explorer.exe and open the folder
subprocess.call(['explorer', path])

# Minified code 
'''
import sys,subprocess as A,urllib.parse
A.call(['explorer',urllib.parse.unquote(sys.argv[1])])
'''

# One-line code in command form
'''
python -c "import sys,subprocess as A,urllib.parse:A.call(['explorer',urllib.parse.unquote(sys.argv[1])])"
'''