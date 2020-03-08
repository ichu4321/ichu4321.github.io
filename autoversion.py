import os
import sys

# turns the version into a string
def versionStr(major, minor):
	return str(major) + "." + str(minor);

# break if sys args is wrong length
if (len(sys.argv) < 2):
	print("YOU FORGOT THE VERSION NUMBER!");
	sys.exit(0);

# target files
html_target = "index.html";

# set version number
major_version = 1;
version = int(sys.argv[1]);

# calculate strings
last_version = version - 1;
curr = versionStr(major_version, version);
prev = versionStr(major_version, last_version);
print("Next Version: " + curr);
print("Prev Version: " + prev);

# open html file and replace strings
file = open(html_target, "rt");
html = file.read();
print("Replace Count: " + str(html.count(prev)));
html = html.replace(prev, curr);
file.close();
file = open(html_target, "wt");
file.write(html);
file.close();

# done
print("Finished");