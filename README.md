
# Xtreamer

- [Xtreamer](#xtreamer)
  - [Release Notes](#release-notes-v1.0.0)
  - [Background](#background)
  - [Why Xtreamer ?](#why-xtreamer)
  - [Install Package](#install-package)
  - [APIs](#apis)
  - [Events](#events)
  - [Options](#options)
  - [Usage](#usage)
  - [Demo](#demo)
  - [Test](#test)

## Release Notes V1.0.0
- Handling to avoid repeating nodes in comments & cdata
- Minor bug fixes and exception handling.
- Unit tests to cover corner case scenarios.

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

```shell
npm i xtreamer --save
```

## APIs

`xtreamer` extends [Transform Steram Class](https://nodejs.org/api/stream.html#stream_duplex_and_transform_streams) & provides an additional custom event `xmldata` which emits xml node.

### xtreamer( node : `string`, options?: `object` ) : [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)

`xtreamer` function initialises the transform stream. It accepts following 2 arguments -

- `node`: `string`
- `options`: `object` (coming soon)

This function return a transform stream which can be triggered by piping it with any readable stream.

## Events

### xmldata

Apart from [default steam events](https://nodejs.org/api/stream.html#stream_event_close), `streamer` emits `xmldata` event to emit individual xml nodes.

> From version `0.1.3` onwards, `xtreamer` also supports the conventional `data` event to emit individual xml nodes.

```javascript
const xtreamer = require("xtreamer");

const xtreamerTransform = xtreamer("XmlNode", options);

// listening to `xmldata` event here
xtreamerTransform.on("xmldata", (data) => { });

// OR

// `data` event also supported from version 0.1.3
xtreamerTransform.on("data", (data) => { });
```

## Options

### max_xml_size ( default - 10000000 )

`max_xml_size` is maximum the number of characters allowed to hold in memory. 

`xtreamer` raises an `error` event in case in memory xml string exceed specified limit. This ensures that the node process doesn't get terminated because of excess in memory data collection.

Default value of this option restricts the amount of data held in memory to approximately 10Mb. Following snippet shows how to override default value -

```javascript
const xtreamer = require("xtreamer");

// overriding `max_xml_size` value here
const options = { max_xml_size: 30000000 };

// passing `options` object as second parameter
const xtreamerTransform = xtreamer("XmlNode", options);
```

Typically this value is not needed to override as in most of the cases, size of xml in a single xml node will not exceed 10Mb.

## Usage

Following code snippet uses `request` NPM package as input readable stream -

```javascript
const request = require("request");
const xtreamer = require("xtreamer");

const sampleNode = "SampleNode";
const sampleUrl = "http://sample-xml.com/sample.xml";
let count = 0;

// input readable stream with event handlers
const readStream = request.get(sampleUrl);

// xtreamer transform stream with custom event handler
const xtreamerTransform = xtreamer(sampleNode)
    .on("data", () => ++count % 100 || console.log(count))
    .on("end", () => console.log(count))
    .on("error", (error) => console.error(error));

// input | transform
readStream.pipe(xtreamerTransform);
```

## Demo

```shell
npm i && npm start
```

## Test

```shell
npm i && npm run test
```

---

# Author

- Author - Manoj Chalode (chalodem@gmail.com)

- Copyright - github.com/manojc