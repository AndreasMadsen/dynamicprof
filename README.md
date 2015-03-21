#dprof

> Sync but mostly async profiling done dynamically

## Installation

```sheel
npm install dprof
```

## Example

Add `dprof` to the beginning of you script to profile it. When done a `dprof.json` file is created in your working directory.
You can inspect the file or run `cat dprof.json | dprof > dprof.html` to get a svg view.

```javascript
require('dprof');

var fs = require('fs');

fs.open(__filename, function (err, fd) {

  var count = 0;
  var a = new Buffer(10);
  fs.read(fd, a, 0, 10, 0, function (err2) {
    if (++count === 2) close();
  });

  var b = new Buffer(10);
  fs.read(fd, b, 0, 10, 10, function (err2) {
    if (++count === 2) close();
  });

  fs.close(fd, function (err) {

  });
});
```

## License

**This software is licensed under "MIT"**

> Copyright (c) 2015 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
