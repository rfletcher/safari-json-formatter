# JSON Formatter

A Safari extension which makes valid JSON documents human-readable.

### Before:
![Before JSON Formatter][i1]
### After:
![After JSON Formatter][i2]

## Installation
[Download the extension][1] and open it with Safari 5.

### Usage
Once installed, load any valid JSON document. [This project's most recent
commit][2] makes a good example.

#### Caveats
The extension aims to produce the same JSON string that's been loaded as input,
but because the original JSON has actually been parsed some transformation may
occur. In other words, the formatted JSON will always be equivalent to the
original JSON, but in rare circumstances it may not match exactly. The only
known example of this is conversion between number formats -- if the original
JSON contains the number 1e2, for example, the formatted JSON will display the
value 100.

[1]: http://github.com/downloads/rfletcher/safari-json-formatter/JSON%20Formatter.safariextz
[2]: http://github.com/rfletcher/safari-json-formatter/commit/HEAD.json
[i1]: http://github.com/rfletcher/safari-json-formatter/raw/HEAD/images/before.png
[i2]: http://github.com/rfletcher/safari-json-formatter/raw/HEAD/images/after.png