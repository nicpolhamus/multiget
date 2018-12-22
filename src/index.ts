#!/usr/bin/env node

import axios, {AxiosResponse} from 'axios';
import Promise from 'bluebird';
import program from 'commander';
import path from 'path';
import config from './config.json';
import {createWriteStream, WriteStream} from 'fs';
import {homedir} from 'os';

let CHUNK_SIZE: number;
let fileStream: WriteStream;
let filename: string;

program
  .version('0.0.1')
  .description('a cli tool that gets a file in multiple parts')
  .usage('[options] <file>')
  .option('-o, --out <path>', 'a file to output the request to')
  .option('-p, --parallel', 'switch download to happen parallel instead of sequentally')
  .option('-c, --chunks <chunks>', 'amount of chunks to to use in the request')
  .option('-s, --size <size>', 'file size limit of you want to download (in megabytes)', parseFileSize)
  .parse(process.argv);

/* need to make sure we have an argument */
if (program.args[0] !== undefined) {
  /* grab the file extension */
  filename = program.args[0].match(/(?=\w+\.\w{3,4}$).+/i)[0];
  /* setup the file stream */
  if (program.out) {
    /* setup the file stream using the given file location */
    fileStream = createWriteStream(program.out, {flags: 'w'});
  } else {
    /* setup the file stream using the default Downloads directory */
    fileStream = createWriteStream(path.normalize(`${homedir()}/Downloads/${filename}`), {flags: 'w'});
  }
  /* set the chunk size */
  /* need to check if the user specified file size limit and chunk amount to calculate chunk size */
  CHUNK_SIZE = Math.floor(((program.size) ? program.size : config.MAX_FILE_SIZE) / ((program.chunks) ? program.chunks : config.CHUNKS));
  /* download the file! */
  /* need to check if the parallel flag is set */
  if (program.parallel) {
    /* we need to download in parallel! */
    downloadInParallel(program.args[0]);
  } else {
    /* we need to download sequentially! */
    downloadChunks(program.args[0]);
  }
} else {
  /* No file given for us to download */
  console.log(`No file specified to download!`);
  program.help();
}

/**
 * download the file in parallel using axios.all
 *
 * @param {string} url
 */
function downloadInParallel(url: string): void {
  /* this is our axios.get array, used in axios.all for parallel requests */
  const chunkRequests = setupRequests(url);
  /* map our chunk requests to execute each axios.get request */
  axios.all(chunkRequests.map((func: any) => {
    return func();
  }))
  /* process our responses */
  .then((chunks: AxiosResponse[]) => {
    /* since axios.all returns the responses in order, we don't have to worry 
       about the order being correct */
    chunks.forEach((chunk: any) => {
      /* write each chunk to the file */
      writeFileChunk(chunk.data);
    });
    /* we are done writing to the file, so lets close our file write stream */
    fileStream.close();
    console.log('Done downloading file!');
  })
  /* catch any error from the requests or file writing */
  .catch((error: Error) => {
    /* logging the error out to the console for now */
    console.log(`Error encountered during`);
  });
}

/**
 * write the file chunk using our file stream
 *
 * @param {*} fileChunk
 */
function writeFileChunk(fileChunk: any): void {
  /* write to the file! */
  fileStream.write(fileChunk, (error: any) => {
    /* an error could be returned, so we need to check it */
    if (error) {
      /* throw the error */
      return console.log(`Error encountered while writing chunk to file!`);
    }
  });
}

/**
 * setup the array of file chunk requests
 *
 * @param {string} url
 * @returns {any[]}
 */
function setupRequests(url: string): any[] {
  /* this is our axios.get array */
  const chunkRequests: any[] = [];
  /** 
   * chunks is used for looping, directly correlates to the amount of file chunks 
   * use chunk amount if specified by user, otherwise use default
   */
  const chunks = (program.chunks) ? program.chunks : config.CHUNKS;
  /* need to grab the file size limit */
  const fileSize = (program.size) ? program.size : config.MAX_FILE_SIZE;
  /* insert the functions that return the axios.get calls for each file chunk */
  for (let count = 0; count < chunks; count++) {
    chunkRequests.push(function() {
      return axios.get(url, {
        headers: {
          // 'content-length': CHUNK_SIZE,
          Range: `bytes=${count * CHUNK_SIZE}-${(fileSize - ((chunks - (count + 1)) * CHUNK_SIZE)) - 1}`
        }
      });
    });
  }
  /* return the requests array */
  return chunkRequests;
}

/**
 * download file chunks sequentially
 *
 * @param {string} url
 */
function downloadChunks(url: string): void {
  /* requests array for our sequential requests */
  const chunkRequests = setupRequests(url);
  /* run through our requests sequentially */
  Promise.each(chunkRequests.map((func: any) => {
    /* return the execution of the axios.get request */
    return func();
  }), (chunk: AxiosResponse) => {
    /* return a resolve of the file write so that the requests resolve sequentially */
    return Promise.resolve(writeFileChunk(chunk.data));
  })
  .then(() => {
    /* close the file stream after the final resolve */
    fileStream.close();
    console.log('Done downloading file!');
  })
  .catch((error: Error) => {
    /* error log here is for dev only */
    console.log(`Error encountered during sequential file download!`);
  });
}

/**
 * takes the given file size and converts it to bytes
 *
 * @param {*} size
 * @returns {number} bytes
 */
function parseFileSize(size: any): number {
  return Math.floor(Number.parseFloat(size) * 1048576);
}