var nexe = require('nexe');

nexe.compile({
    input: 'main_server.js', // where the input file is
    output: 'C:/Users/hesham/Google Drive/projects/RaspberryPi/SmartRaspian/bin', // where to output the compiled binary
    nodeVersion: '5.5.0', // node version
    nodeTempDir: 'src', // where to store node source.
  //  nodeConfigureArgs: ['opt', 'val'], // for all your configure arg needs.
    nodeMakeArgs: ["-j", "4"], // when you want to control the make process.
    python: 'C:/Users/hesham/AppData/Local/Programs/Python/Python35-32', // for non-standard python setups. Or python 3.x forced ones.
  //  resourceFiles: [ 'path/to/a/file' ], // array of files to embed.
    resourceRoot: [ 'C:/Users/hesham/Google Drive/projects/RaspberryPi/SmartRaspian/bin' ], // where to embed the resourceFiles.
    flags: true, // use this for applications that need command line flags.
    jsFlags: "--use_strict", // v8 flags
    framework: "node" // node, nodejs, or iojs
}, function(err) {
    if(err) {
        return console.log(err);
    }

});