import os
from tempfile import mkstemp
from shutil import move
from os import fdopen, remove
__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))
index_file = __location__ + "//build/index.html"
fh, abs_path = mkstemp()
with fdopen(fh,'w') as new_file:
    with open(index_file, "r") as js_file:
         for line in js_file:
             new_file.write(line.replace("/Spectrogram", ""))
remove(index_file)
    #Move new file
move(abs_path, index_file)
