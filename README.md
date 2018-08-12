
# Xtreamer

> This package is currently in beta phase.

## Introduction

`xtreamer` is a node package used to download and convert large `XML` files in `JSON` format. The main aim of this package is to download the `XML` file in chunks using `streams` so that node applications will not go out of memory while processing large files.

This package makes use of [node buffer APIs](https://nodejs.org/api/buffer.html) to read the `XML` files in chunks. This allows `xtreamer` to keep the memory & proecssor usage in control. It also provides a config to make the usage flexible as per application and server needs.

`xtreamer` works in 3 steps -

- **file streaming** - store read chunks in database
- **chunk parsing** - parse chunks to generate `xml` structure
- **node parsing** - read `xml` nodes and convert them into `JSON`

## Install Package

The package can be installed using following command **`npm i xtreamer`**

## APIs

`Xtreamer` exposes following APIs - 

### initXtreamer(fileUrl, config): Xtreamer

`initXtreamer` initialises the conversion process, validates the url and config, connects to the database, saves file details in database and stores file id for further use. It accepts following 2 arguments -

- `file url`: `string`
- `config`: `object`

The `config` object accept multiple options & event listener functions to keep track of the conversion process.

It return `Xtreamer` object which is used to start the conversion.

### start()

This method starts the conversion process. It triggers the callback options (optional) provided in the config file as the convertion proceeds.

## Usage

Use following code to import xtreamer and start it with default settings -

```javascript
const xtreamer = require("xtreamer");
const fileUrl = "http://test-xml-file.xml";
const config = {
    "dbUrl": "mongodb://localhost"
};
const streamer = xtreamer.initXtreamer(fileUrl, config);
streamer.start();
```

## Options

The options object includes following options - 

### dbUrl: string

This is the only required option. Specify the mongo database URL here.

### dbName: string

This is optional, `xtreamer_db` is the default database name used if not specified.

### fileCollectionName: string

This is optional. This option refers to the mongo collection name to store streamed file references such as (url, size, status, structure). Default name used is `files` if not specified.

### chunkCollectionPrefix: string

This is optional. This option refers to the mongo collection name prefix to store read chunks from file. Every chunk is stored as a separate record. Default name used is `chunks` if not specified.

### nodeCollectionPrefix: string

This is optional. This option refers to the mongo collection name prefix to store `JSON` node parsed from read `XML` nodes. Every node is stored as a separate record. Default name used is `nodes` if not specified.

### bucketSize: number

This is optional. This option refers to the number of chunks to be streamed at a time while reading URL. Use this option to control the amount of in memory data while streaming the file URL. The default size is 150 if not specified.

### onChunksProcesed: (chunkCount: number) => void

This is optional. This is an event handler function that gets triggered after streaming every bucketful of chunks. By default, it gets triggered after processing 150 chunks. It provides `chunkCount` in the argument.

### onChunksParsed: (nodeCount: number) => void

This is optional. This is an event handler function that gets triggered after parsing every bucketful of `XML` nodes. By default, it gets triggered after processing 100 nodes. It provides `nodeCount` in the argument.

### onNodesParsed: (nodeCount: number) => void

This is optional. This is an event handler function that gets triggered after parsing every bucketful of `JSON` nodes nodes. By default, it gets triggered after processing 100 nodes. It provides `nodeCount` in the argument.

### onStreamingSuccess: (fileId: string) => void

This is optional. This is an event handler function that gets triggered once the `XML` file streaming is finished. It provides `fileId` in the argument which is the mongodb id for the file collection.

### onStreamingError: (error: object) => void

Tis is optional. This is an event handler that gets triggered when error occurs while file streaming.

### onChunkParsingSuccess: () => void

This is optional. This event handler gets triggered when `XML` chunks are parsed and file structure is updated in database.

### onNodeParsingSuccess: () => void

This is optional. This event handler gets triggered when `JSON` nodes are parsed.

### onParsingError: (error: object) => void

This is optional. This event handler gets triggered when error occurs in `XML chunk parsing` or `JSON node parsing`.

### onDatabaseConnectionSuccess: () => void

This is optional. This event handler funtion gets triggered when database is successfully connected.

### onDatabaseConnectionError: (error: object) => void

This is optional. this event handler gets triggered when database connection error occurs.

### onError: (error: object) => void

This is optional. This is a generic event handler function triggered after any internal error.

---

- Author - Manoj Chalode (chalodem@gmail.com)

- Copyright - github.com/manojc
