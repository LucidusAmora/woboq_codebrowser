#! /usr/bin/env node

if (process.argv.length !== 3) {
    process.exit(1);
}

var fs = require("fs");
var path = require("path");
var https = require("https");
var jsonfile = require("jsonfile");
var firebase = require("firebase");

var databaseHost = "cbrr-e225e.firebaseio.com";
firebase.initializeApp({
    databaseURL: "https://cbrr-e225e.firebaseio.com",
    serviceAccount: "/home/ubuntu/credentials/cbrr.json"
});
var db = firebase.database();
var ref = db.ref("refs");
var refM = db.ref("refs/_M")

var refsDir = process.argv[2];
var counter = 0;

function uploadDir(macro) {
    var dir = macro ? path.join(refsDir, "_M") : refsDir;
    fs.readdir(dir, function(err, files) {
        if (err) {
            console.log(err.message);
            return;
        }
        var nFiles = files.length;
        if (!macro)
            nFiles--;
        var aggregated = {};
        const batch = 2000;
        var nBatch = Math.floor(nFiles / batch);
        if (batch * nBatch > nFiles)
            nBatch++;
        files.forEach(function(file) {
            jsonfile.readFile(path.join(dir, file), function(err, obj) {
                if (err) {
                    console.log(err.message);
                    return;
                }
                var nodeName = file.replace(/[[\.\]]/g, "?");
                aggregated[nodeName] = obj;
                --nFiles;
                if (nFiles % batch === 0) {
                    (macro ? refM : ref).update(aggregated, function() {
                        if (--nBatch === 0) {
                            if (!macro)
                                uploadDir(true);
                            else
                                process.exit(0);
                        }
                        console.log(`${nBatch} batches remaining`);
                    });
                    aggregated = {};
                }
            });
        });
    });
}

uploadDir();
//ref.remove(() => { process.exit(); });
//# find . -type f -exec sed 's/"\([0-9][0-9]*\)"/\1/g' -i {} \;