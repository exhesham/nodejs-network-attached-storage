var http = require('http'),
    fs = require('fs');
var formidable = require("formidable");
var util = require('util');
var exec = require('child_process').exec;

http.createServer(function (req, res) {


	console.log(JSON.stringify(req.url));
	if(req.url == "/get_log"){ //req.url has the pathname, check if it conatins '.html'
		exec( " cat /home/pi/homecloud/LogUnixInstaller.log |grep -E 'STEP|ERROR'" ,function(err,output){
			console.log("get_log -> err,output="+err+"\n"+output);
			//on your application.
			res.writeHead(200, {
				'content-type': 'text/plain'
			});
			res.write(output);
			res.end();
			
		});
		return;

    }
	
    if(req.url == "/" || req.url.indexOf('.html') != -1){ //req.url has the pathname, check if it conatins '.html'

      fs.readFile( '/home/pi/homecloud/wizard_page/wizard_page.html', function (err, data) {
        if (err) {console.log(err);
			        res.writeHead(500, {'Content-Type': 'text/html'});
					
					res.end();
					return;
		}
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
		return;
      });

    }

    if(req.url.indexOf('.js') != -1){ //req.url has the pathname, check if it conatins '.js'

      fs.readFile('/home/pi/homecloud/wizard_page/wizard_page.js', function (err, data) {
        if (err) console.log(err);
        res.writeHead(200, {'Content-Type': 'text/javascript'});
        res.write(data);
        res.end();
		return;
      });

    }

    if(req.url.indexOf('.css') != -1){ //req.url has the pathname, check if it conatins '.css'

      fs.readFile('/home/pi/homecloud/wizard_page/wizard_page.css', function (err, data) {
        if (err) console.log(err);
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.write(data);
        res.end();
		return;
      });

    }
	
	if (req.url =="/install" && req.method.toLowerCase() == 'post') {
        processAllFieldsOfTheForm(req, res);
    }


}).listen(80).timeout = 1000*60*60;
console.log('Server running at http://homecloud.local/');



function processAllFieldsOfTheForm(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
		//[password] [server url] [noip email] [noip password] [mongo password]
		console.log("running command:\n"+"> /home/pi/homecloud/LogUnixInstaller.log ; sudo /home/pi/homecloud/UnixInstaller.sh install " + fields.cloud_key + " " + fields.noip_url+ " " +  fields.noip_username + " " + fields.noip_password +" " + fields.pass + " > /home/pi/homecloud/LogUnixInstaller.log " );
        exec("> /home/pi/homecloud/LogUnixInstaller.log ; sudo /home/pi/homecloud/UnixInstaller.sh install " + fields.cloud_key + " " + fields.noip_url+ " " +  fields.noip_username + " " + fields.noip_password +" " + fields.pass + " > /home/pi/homecloud/LogUnixInstaller.log " ,function(err,output){
			//on your application.
			console.log("Finished with err="+err + "\n\noutput:"+output);
			res.writeHead(200, {
				'content-type': 'text/plain'
			});
			res.write('received the data:\n\n'+output);
			res.end(util.inspect({
				fields: fields,
				files: files
			}));
			
		});
    });
}