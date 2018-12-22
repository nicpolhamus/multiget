#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
var request_promise_native_1 = __importDefault(require("request-promise-native"));
var config_json_1 = __importDefault(require("../config.json"));
var CHUNK_SIZE = config_json_1.default.MAX_FILE_SIZE / config_json_1.default.CHUNKS;
commander_1.default
    .version('0.0.1')
    .description('a cli tool that gets a file in multiple parts')
    .option('-o, --out', 'a file to output the request to')
    .option('-p, --parallel', 'switch download to happen parallel instead of sequentally')
    .parse(process.argv);
if (commander_1.default.args[0]) {
    /* download the file! */
    /* need to check if the parallel flag is set */
    if (commander_1.default.parallel) {
        downloadInParallel(commander_1.default.args[0])
            .then(function (fileChunks) {
            console.log(fileChunks.length);
        });
    }
    else {
        console.log('here!');
    }
}
function downloadInParallel(url) {
    return __awaiter(this, void 0, void 0, function () {
        var fileRequests, fileChunks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fileRequests = Array(config_json_1.default.CHUNKS).map(function (element, index) {
                        return parallelRequest(url, index);
                    });
                    return [4 /*yield*/, Promise.all(fileRequests)];
                case 1:
                    fileChunks = _a.sent();
                    // const fileChunkOne = await request(url, {
                    //   headers: {
                    //     Range: `bytes=0-${CHUNK_SIZE}`
                    //   }
                    // });
                    // const fileChunkTwo = await request(url, {
                    //   headers: {
                    //     Range: `bytes=${CHUNK_SIZE}-${CHUNK_SIZE * 2}`
                    //   }
                    // });
                    // const fileChunkThree = await request(url, {
                    //   headers: {
                    //     Range: `bytes=${CHUNK_SIZE * 2}-${CHUNK_SIZE * 3}`
                    //   }
                    // });
                    // const fileChunkFour = await request(url, {
                    //   headers: {
                    //     Range: `bytes=${CHUNK_SIZE * 3}-${CHUNK_SIZE * 4}`
                    //   }
                    // });
                    return [2 /*return*/, fileChunks];
            }
        });
    });
}
function parallelRequest(url, requestNumber) {
    return request_promise_native_1.default(url, {
        headers: {
            Range: "bytes=" + requestNumber * CHUNK_SIZE + "-" + (requestNumber + 1) * CHUNK_SIZE
        }
    });
}
function downloadChunks(url) {
    var fileChunks = [];
    return fileChunks;
}
