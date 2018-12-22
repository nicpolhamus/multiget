#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
var bluebird_1 = __importDefault(require("bluebird"));
var commander_1 = __importDefault(require("commander"));
var path_1 = __importDefault(require("path"));
var config_json_1 = __importDefault(require("./config.json"));
var fs_1 = require("fs");
var os_1 = require("os");
var CHUNK_SIZE;
var fileStream;
var filename;
commander_1.default
    .version('0.0.1')
    .description('a cli tool that gets a file in multiple parts')
    .usage('[options] <file>')
    .option('-o, --out <path>', 'a file to output the request to')
    .option('-p, --parallel', 'switch download to happen parallel instead of sequentally')
    .option('-c, --chunks <chunks>', 'amount of chunks to to use in the request')
    .option('-s, --size <size>', 'file size limit of you want to download (in megabytes)', parseFileSize)
    .parse(process.argv);
/* need to make sure we have an argument */
if (commander_1.default.args[0] !== undefined) {
    /* grab the file extension */
    filename = commander_1.default.args[0].match(/(?=\w+\.\w{3,4}$).+/i)[0];
    /* setup the file stream */
    if (commander_1.default.out) {
        /* setup the file stream using the given file location */
        fileStream = fs_1.createWriteStream(commander_1.default.out, { flags: 'w' });
    }
    else {
        /* setup the file stream using the default Downloads directory */
        fileStream = fs_1.createWriteStream(path_1.default.normalize(os_1.homedir() + "/Downloads/" + filename), { flags: 'w' });
    }
    /* set the chunk size */
    /* need to check if the user specified file size limit and chunk amount to calculate chunk size */
    CHUNK_SIZE = Math.floor(((commander_1.default.size) ? commander_1.default.size : config_json_1.default.MAX_FILE_SIZE) / ((commander_1.default.chunks) ? commander_1.default.chunks : config_json_1.default.CHUNKS));
    /* download the file! */
    /* need to check if the parallel flag is set */
    if (commander_1.default.parallel) {
        /* we need to download in parallel! */
        downloadInParallel(commander_1.default.args[0]);
    }
    else {
        /* we need to download sequentially! */
        downloadChunks(commander_1.default.args[0]);
    }
}
else {
    /* No file given for us to download */
    console.log("No file specified to download!");
    commander_1.default.help();
}
/**
 * download the file in parallel using axios.all
 *
 * @param {string} url
 */
function downloadInParallel(url) {
    /* this is our axios.get array, used in axios.all for parallel requests */
    var chunkRequests = setupRequests(url);
    /* map our chunk requests to execute each axios.get request */
    axios_1.default.all(chunkRequests.map(function (func) {
        return func();
    }))
        /* process our responses */
        .then(function (chunks) {
        /* since axios.all returns the responses in order, we don't have to worry
           about the order being correct */
        chunks.forEach(function (chunk) {
            /* write each chunk to the file */
            writeFileChunk(chunk.data);
        });
        /* we are done writing to the file, so lets close our file write stream */
        fileStream.close();
        console.log('Done downloading file!');
    })
        /* catch any error from the requests or file writing */
        .catch(function (error) {
        /* logging the error out to the console for now */
        console.log("Error encountered during");
    });
}
/**
 * write the file chunk using our file stream
 *
 * @param {*} fileChunk
 */
function writeFileChunk(fileChunk) {
    /* write to the file! */
    fileStream.write(fileChunk, function (error) {
        /* an error could be returned, so we need to check it */
        if (error) {
            /* throw the error */
            return console.log("Error encountered while writing chunk to file!");
        }
    });
}
/**
 * setup the array of file chunk requests
 *
 * @param {string} url
 * @returns {any[]}
 */
function setupRequests(url) {
    /* this is our axios.get array */
    var chunkRequests = [];
    /**
     * chunks is used for looping, directly correlates to the amount of file chunks
     * use chunk amount if specified by user, otherwise use default
     */
    var chunks = (commander_1.default.chunks) ? commander_1.default.chunks : config_json_1.default.CHUNKS;
    /* need to grab the file size limit */
    var fileSize = (commander_1.default.size) ? commander_1.default.size : config_json_1.default.MAX_FILE_SIZE;
    var _loop_1 = function (count) {
        chunkRequests.push(function () {
            return axios_1.default.get(url, {
                headers: {
                    // 'content-length': CHUNK_SIZE,
                    Range: "bytes=" + count * CHUNK_SIZE + "-" + ((fileSize - ((chunks - (count + 1)) * CHUNK_SIZE)) - 1)
                }
            });
        });
    };
    /* insert the functions that return the axios.get calls for each file chunk */
    for (var count = 0; count < chunks; count++) {
        _loop_1(count);
    }
    /* return the requests array */
    return chunkRequests;
}
/**
 * download file chunks sequentially
 *
 * @param {string} url
 */
function downloadChunks(url) {
    /* requests array for our sequential requests */
    var chunkRequests = setupRequests(url);
    /* run through our requests sequentially */
    bluebird_1.default.each(chunkRequests.map(function (func) {
        /* return the execution of the axios.get request */
        return func();
    }), function (chunk) {
        /* return a resolve of the file write so that the requests resolve sequentially */
        return bluebird_1.default.resolve(writeFileChunk(chunk.data));
    })
        .then(function () {
        /* close the file stream after the final resolve */
        fileStream.close();
        console.log('Done downloading file!');
    })
        .catch(function (error) {
        /* error log here is for dev only */
        console.log("Error encountered during sequential file download!");
    });
}
/**
 * takes the given file size and converts it to bytes
 *
 * @param {*} size
 * @returns {number} bytes
 */
function parseFileSize(size) {
    return Math.floor(Number.parseFloat(size) * 1048576);
}
