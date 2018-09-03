- [Xtreamer](#xtreamer)
    - [Background](#background)
    - [Why Xtreamer ?](#why-xtreamer)
    - [Install Package](#install-package)
    - [APIs](#apis)
        - [xtreamer( node : `string`, options?: `object` ) : stream.Transform](#xtreamer-node--string-options-object---streamtransform)
    - [Events](#events)
        - [xmldata](#xmldata)
    - [Usage](#usage)
    - [Demo](#demo)
    - [Test](#test)
- [Author](#author)

# Xtreamer

## Background

While working on a NodeJs project, I came across a problem of processing huge XML files. Node process can store a limited amout of data after which it throws `out of memory` exception. Thus files more than a specified limit was a pain for the application.

That is where I found a couple of `npm packages` viz. [xml-flow](https://www.npmjs.com/package/xml-flow) & [xml-stream](https://www.npmjs.com/package/xml-stream). These packages process the XML files in chunks using streams (which is exactly what I was looking for).

However, I came across few drawbacks regarding these packages explained in [this stackoverflow question](https://stackoverflow.com/questions/52129764/xml-flow-npm-package-unexpected-xml-parsing-behaviour). And thus I started working on this package which does exactly what these 2 packages do but it emits xml instead of processed JSON and gives a flexibility of choosing most compatible `xml to json npm packages`.

## Why Xtreamer ?

- One of the key points is `xtreamer` has `stream` as its only dependency.

- As this package uses streams, the memory consumption will always be in control.

- `xtreamer` itself is an extension of a `Transform Stream` so it can be piped to any input `Readable Stream` and `xtreamer` output can be piped to a `Writable Stream`.

- Apart from above points, `xtreamer` provides XML nodes in response which enables it to get hooked up with any `XML-JSON` parsing npm packages as per requirement.

## Install Package

The package can be installed using following command **`npm i xtreamer`**

## APIs

`xtreamer` extends [Transform Steram Class](https://nodejs.org/api/stream.html#stream_duplex_and_transform_streams) & provides an additional custom event `xmldata` which emits xml node.

### xtreamer( node : `string`, options?: `object` ) : [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)

`xtreamer` function initialises the transform stream. It accepts following 2 arguments -

- `node`: `string`
- `options`: `object` (coming soon)

This function return a transform stream which can be triggered by piping it with any readable stream.

## Events

Apart from [default steam events](https://nodejs.org/api/stream.html#stream_event_close), `streamer` emits `xmldata` event to emit individual xml nodes.

### xmldata

```javascript
xtreamer.on("xmldata", (data) => { });
```

## Usage

Following code snippet uses `request` NPM package as input readable stream -

```javascript
const request = require("request");
const xtreamer = require("xtreamer");

const url = "http://sampl-xml.com/sample.xml";
let count = 0;

// input readable stream with event handlers
const readStream = request.get(url)
    .on("end", (data) => console.log(count))
    .on("close", () => { })
    .on("error", (error) => { });

// xtreamer transform stream with custom event handler
const xtreamerTransform = xtreamer("XmlNode")
    .on("xmldata", (data) => ++count);

// input | transform
readStream.pipe(xtreamerTransform);
```

## Demo

```
npm i && npm start
```

## Test

```
npm i && npm run test
```

---

# Author

- Author - Manoj Chalode (chalodem@gmail.com)

- Copyright - github.com/manojc