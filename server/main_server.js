/* packages */
var https = require('https');
var fs = require('fs');
var process = require('process');
var qs = require('querystring');
var express = require('express');
var crypto = require('crypto');
var path = require("path");
var util  = require('util');
var formidable = require("formidable");
var httprequestlib = require('request');
var exec = require('child_process').exec;
var bodyParser = require('body-parser');
var db_api = require( './web_server_db_api');
var db_account = require( './web_server_account_db');
var hc_utils = require( './HomeCloud_Utils');
var hc_deluxeapi = require('./HomeCloud_DeluxeAPI');
var app = express();


/* globals */
var RELATIVE_DIR = "/home/pi/homecloud/SmartRaspian/"
var MOUNT_DIR = "/media/pi"
var total_ram = -1;
var mounted_drives_json  = [];
var options = {
	cert: fs.readFileSync(RELATIVE_DIR + 'thunderclouding.crt')  ,
	key: fs.readFileSync(RELATIVE_DIR + 'thundercloudingemeraldclouding.pem')
};


/* Include the express body parser */
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

function log_data(fname,data)
{
	console.log("["+fname+"] - "+ Date()+ " - " + data);
}

/*****************************************************************************************************************/

/*
Servlet Name: GetFolderContents
Request Type: GET
Parameters: 
@folderpath: Name of folder, in case the name is empty, you request the whole home directory. Otherwise, it will get the relative path [storage]/..

Returns a json array which contains the files/folders/mounted drives
*/			
app.all('/api/v1/fs/folder/content', function(request, response) {
	var fname = "GetFolderContents";
	log_data(fname,"Called");
	is_valid_session(request,function(is_valid){ // function to check if the session is valid
		if(is_valid){
			var folderpath =  request.param("folderpath");
			if(!isLegalFolderORFileName(folderpath)){//TODO:BASSAM:Implement it....
				response.write("Failed because of illigal folder path!");  
				response.end(); 
				return;
			}
			
			
			
			hc_utils.hc_utils_get_mounted_drives(function(mounted_drives){
				log_data(fname,"mounted_drives = "+mounted_drives);
				if(mounted_drives == null || mounted_drives == undefined || mounted_drives == ""){
					log_data(fname,"mounted_drives = "+mounted_drives);
					send_status_code(response,404);
					return;
				}
				mounted_drives_json = JSON.parse(mounted_drives);
				var mounted_drives_json_to_send = [];
				var mounted_drive_str = "";
				log_data(fname,"mounted_drives_json.length = "+mounted_drives_json.length);
				for(i=0;i<mounted_drives_json.length;i++){
					log_data(fname,"Handling dir:\""+mounted_drives_json[i].mounted_dir+"\"");			
					if(mounted_drives_json[i].mounted_dir != undefined && mounted_drives_json[i] != {} && mounted_drives_json[i].mounted_dir.length > 1){ // one char path is . or / whihc is never good
						mounted_drive_str += " " + mounted_drives_json[i].mounted_dir ;
						
						var manipulated_mounted_drive =  mounted_drives_json[i];
						manipulated_mounted_drive.mounted_dir = manipulated_mounted_drive.mounted_dir.replace(MOUNT_DIR+"/","");
						mounted_drives_json_to_send.push(manipulated_mounted_drive);
					}else{
						log_data(fname,"Deleting element #"+i);		
						mounted_drives_json.splice(i,1);
						i--;
					}
				}
				log_data(fname,"mounted_drive_str = "+mounted_drive_str);
				var files_arr = {};
				if(mounted_drive_str == ""){
					
					files_arr["data"] = [];
					files_arr["mounted_drives"] = [];
					
					response.setHeader('Content-Type', 'application/json');
					response.write(JSON.stringify(files_arr));  
					response.end(); 
					return;
				}
				mounted_drive_str = folderpath != null && folderpath != undefined && folderpath != ""? MOUNT_DIR + folderpath : mounted_drive_str;
				log_data(fname,"Will return the contents of: "+ mounted_drive_str);
				
				//-exec md5sum {} 2>/dev/null \;
				//exec("find "+ mounted_drive_str  + ' | while read file; do echo -n \\"`ls -lgdG --time-style="+%s" "$file"`\\"","; done ', function(error, stdout, stderr){
				exec('ls -lgdG --time-style="+%s" '+ mounted_drive_str.trim()  +'/*', function(error, stdout, stderr){
					
					//var files = hc_utils.utils_parse_ls_output_to_json(stdout,prefix_dir);
					log_data(fname,"after running the command:"+'ls -lgdG --time-style="+%s" '+ mounted_drive_str.trim()  +'/*');//JSON.stringify(files));
					var re = new RegExp(MOUNT_DIR, 'g');
					files_arr["data"] = stdout.replace(re,"");
					files_arr["mounted_drives"] = mounted_drives_json_to_send;
					
					response.setHeader('Content-Type', 'application/json');
					response.write(JSON.stringify(files_arr));  
					response.end(); 
				
				});
				
			});
			
		}else{
			send_logout_redirect(response);
		}
	});
	
});

/*****************************************************************************************************************/
/*
Servlet Name: create_folder
Request Type: GET
Parameters: 
@foldername: The name of the new folder...

Returns a json array which contains the files/folders/mounted drives
*/
app.get('/api/v1/fs/folder/create', function(request, response) {
var fname = "create_folder";
	log_data(fname,"Called");
	
	is_valid_session(request,function(is_valid,session_data){
		if(is_valid)
		{
			var foldername = request.param("foldername");
			if(!validate_uploading_filepath(foldername,"")){
				log_data(fname,"Failed to validate foldername="+foldername);
				
				send_status_code(response,500,"Folder path is illigal!");
				return;
			}
			log_data(fname,"foldername="+foldername);
			
			var fullpathname = MOUNT_DIR + "/" + foldername;
			exec("mkdir \""+ fullpathname+"\"", function(error, stdout, stderr){
			
				//log_data(fname,"The found files for the path:"+fullpathname+" are:\n" + stdout);
				send_status_code(response,200,JSON.stringify({'status': 'SUCCESS'}),"text/json");
				return;
			});
		}else{
			send_logout_redirect(response);
		}
	});	
});
/*****************************************************************************************************************/
/*
Servlet Name: rename_file
Request Type: GET
Parameters: 
@file_path: path of file
@file_name:
@file_new_name
*/
app.get('/api/v1/fs/file/rename', function(request, response) {
var fname = "rename_file";
	log_data(fname,"Called");
	
	is_valid_session(request,function(is_valid,session_data){
		if(is_valid)
		{
			var newurl = 'http://127.0.0.1:9034';
			var file_path = request.param("file_path");
			var file_name = request.param("file_name");
			var file_new_name = request.param("file_new_name");
			send_request_to_logic_layer({
										"File-Name" : file_name,
										"File-Rename-New-Name" : file_new_name,
										"Session-ID" : session_data.session_id,
										"File-Path" : file_path,
										"Operation-Type" : "Rename File"
									},request,response);
			
		}else{
			send_logout_redirect(response);
		}
	});	
});
/*****************************************************************************************************************/
/*
Servlet Name: download_shared
Request Type: GET
Parameters: 
@key_token: Token for the shared file

*/
app.all('/api/v1/fs/shared/download', function(request, response) {
	var fname = "download_shared";
	log_data(fname,"Called");
	// get the data
	
	var key_token = request.param("key_token");
	var filter_json ={};
	filter_json.key_token = request.param("key_token");
	if(filter_json.key_token == null || filter_json.key_token ==undefined || filter_json.key_token ==""){
		send_status_code(400,"share does not exist");
		return;
	}
	// get data from database
	var req_json ={};
	hc_utils.db_api_find_records_by_filter({"key_token" :key_token},"hc_shared_links",function(data){
		if(data != null){
			log_data(fname,"Found share data is "+JSON.stringify(data));
			req_json.file_path = data[0].shared_filepath.trim();
			req_json.file_name = data[0].shared_filename.trim();
			req_json.file_sha1 = "TOBE ADDED";
			
			send_request_to_logic_layer({
						"File-Name" : data[0].shared_filename.trim(),
						"File-Path" :  data[0].shared_filepath.trim(),
						"File-SHA1" : "TOBE ADDED",
						"Operation-Type" : "DownloadShared"
					},request,response);
			
			
		}else{
			send_status_code(res,500);
			return;
		}
		
		
	});
	
});
/*****************************************************************************************************************/
/*
Servlet Name: download_file
Request Type: GET
Parameters: 
@file_name
@file_path
*/
app.all('/api/v1/fs/file/download', function(request, response) {
	var fname = "dwonload_file";
	var file_name = request.param("file_name");
	log_data(fname,"called with file_name="+file_name);
	is_valid_session(request,function(is_valid,session_data){
		if(is_valid){
			var file_path =request.param("file_path");
			log_data(fname,"file_name:"+file_name + ", file_path="+file_path);
			
			var req_json ={};
			req_json.file_name = file_name;
			req_json.file_path =file_path;
			
			req_json.file_sha1 = "TOBE ADDED";
			req_json.operation_type = "Download";
			db_api.db_api_add_new_file_request_to_database(req_json,session_data.username,function(is_allowed,objid,err,validated_chunks){
				send_request_to_logic_layer({
									"File-Name" : file_name,
									"Session-ID" : session_data.session_id,
									"File-Path" : file_path,
									"File-OBJID" : objid,
									"Operation-Type" : req_json.operation_type
								},request,response);		
			});
		}else{
			send_logout_redirect(response);
		}

	});
	
});
/*****************************************************************************************************************/
/*
Servlet Name: UploadFile
Request Type: POST
Headers:
@x-file_name:
@x-file_size:
@x-file_path:
@x-upload_identifier: For client use only - in order for the web  to identify the uploads of the session
@x-operation_type: Should be set to 'Upload'
@
@

*/
app.all('/api/v1/fs/file/upload', function(request, response) {
	var fname = "UploadFile";
	log_data(fname,"Uploading ");
	is_valid_session(request,function(is_valid,session_data){
		if(is_valid)
		{
			
			//var filename = request.param("filename");
			var filename = unescape(request.headers["x-file_name"]);
			var fileSize = request.headers['x-file_size'];
			var filePath = /*"/" + session_data["username"] +"/"+*/request.headers['x-file_path'];
			var upload_identifier = request.headers['x-upload_identifier'];
			var operation_type = request.headers['x-operation_type'];
			log_data(fname,"requested with filename=:" + filename + " file_path=" + filePath);
			var req_json ={};
			req_json.file_name = filename;
			req_json.file_path =filePath;
			req_json.upload_identifier = upload_identifier;
			req_json.file_size = fileSize;
			req_json.file_sha1 = "TOBE ADDED";
			req_json.operation_type = operation_type;
			
			// lets check if user uploads to the right place:
			//if(!validate_uploading_filepath(filePath,filename)){
				// log_data(fname,"Directory has .. and this is bad");
				// response.writeHeader(500, {"Content-Type": "text/json"});  
				// response.end();
				// return;
			//}
			log_data(fname,"Received request:"+JSON.stringify(req_json));
			db_api.db_api_add_new_file_request_to_database(req_json,session_data.username,function(is_allowed,objid,err,validated_chunks){//The request body already has the operation type:Upload/Download			 
				if(objid != null && objid != undefined){
					log_data(fname,"file_name:"+filename + " OBJID="+objid);
					send_request_to_logic_layer({
						"File-Name" : filename,
						"Session-ID" : session_data.session_id,
						"File-Path" : filePath,
						"File-SHA1" : "TOBE ADDED",
						"File-OBJID" :objid,
						"File-Size" : fileSize,
						"Operation-Type" : operation_type
					},request,response);
				}
			});
			
			
			/////////////////////////////////////////////////////////////////////////////////////////////////////
			
		}else{
			log_data(fname,"Session Not Valid");
			send_logout_redirect(response);
		}
	});
	
});
/*****************************************************************************************************************/
/*
 Servlet Name: getdeluxecontent
 Request Type: POST
 Headers/Body:
 @The cookie content only

 Return a json with the files that are favorite/shared...
 */
app.post('/api/v1/fs/file/favorites', function(req, res) {
	var fname="getdeluxecontent";
	log_data(fname,"Called...");
	is_valid_session(req,function(is_valid,session_data){
		if(!is_valid){
			log_data(fname,"Not a valid session");
			send_logout_redirect(res);
		}else{

			//username,file_status,operation_type,files_callback

			hc_utils.db_api_find_records_by_filter({"username" : session_data.username},"deluxe_table",function(data){
				if(data != null){
					log_data(fname,"Sending data...num of records:"+data.length);
					res.writeHead(200,{'Content-Type': 'application/json'});
					res.write(JSON.stringify(data));
					res.end();
					return;
				}else{
					send_status_code(res,500);
					return;
				}

			});
		}
	});
});
/*****************************************************************************************************************/
/*
 Servlet Name: getsharedlinks
 Request Type: GET
 Parameters:
 @The cookie content only

 Return the shared links as json structure...
 */
app.all('/api/v1/fs/shared/content', function(req, res) {
	var fname="getsharedlinks";
	log_data(fname,"Called...");
	is_valid_session(req,function(is_valid,session_data){
		if(!is_valid){
			log_data(fname,"Not a valid session");
			send_logout_redirect(res);
		}else{

			//username,file_status,operation_type,files_callback

			hc_utils.db_api_find_records_by_filter({"owner" : session_data.username},"hc_shared_links",function(data){
				if(data != null){
					log_data(fname,"Sending data...num of records:"+data.length);
					res.writeHead(200,{'Content-Type': 'application/json'});
					res.write(JSON.stringify(data));
					res.end();
					return;
				}else{
					send_status_code(res,500);
					return;
				}

			});
		}
	});
});
/*****************************************************************************************************************/

/*****************************************************************************************************************/
/*
 Servlet Name: deluxerequest
 Request Type: POST
 Body: A json with the next structure:
 {"operation_type":"","file_name":"","file_path":""}


 operation_type=add_to_favorites:
 add a file to favorites or remove it from there.
 input: file_name,file_path:name and path of the file
 output: status=200 then success, status=500 then failed
 operation_type=remove_share_link
 operation_type=generate_share_link
 operation_type=move_to_trash
 operation_type=
 operation_type=
 operation_type=
 operation_type=
 operation_type=
 Deluxe Table: deluxe_table:Stores data regarding files. contains additional data about files. favorites,notes,shares...
 |file_name | file_path| file_owner | is_favorite | is_shared_public | shared_with_users | is_shared_locally | file_note | is_file_trashed | is_file_encrypted
 */
app.post('/api/v1/fs/folder/favorites', function(req, res) {
	var fname="deluxerequest";
	log_data(fname,"Called...");
	is_valid_session(req,function(is_valid,session_data){
		if(!is_valid){
			log_data(fname,"Not a valid session");
			send_logout_redirect(res);
		}else{
			var deluxe_req = req.body;
			log_data(fname,"deluxe_req="+JSON.stringify(deluxe_req));
			if(deluxe_req == null || deluxe_req == undefined || deluxe_req["operation_type"] == null || deluxe_req["operation_type"] == undefined){
				//return err code;
				log_data(fname,"deluxe_req.operation_type="+deluxe_req["operation_type"]);
				send_status_code(res,500);
				return;
			}
			var file_name = deluxe_req.file_name;
			var file_path = deluxe_req.file_path;
			if(deluxe_req.operation_type == "add_to_favorites"){
				hc_deluxeapi.add_badge_to_file_or_folder(file_name,file_path,session_data["username"],session_data["session_id"],deluxe_req.operation_type,function(error){
					if(error == null){
						// no error - was added successfully
						send_status_code(res,200,"File was added to favorites");
						return;
					}else{
						send_status_code(res,500,error);
						return;
					}
				});
				return;
			}
			if(deluxe_req.operation_type == "add_note_to_file_or_folder"){
				//nodejs server handles it
				return;
			}
			if(deluxe_req.operation_type == "encrypt_file"){
				//C++
				return;
			}
			if(deluxe_req.operation_type == "move_file"){
				//C++
				return;
			}
			if(deluxe_req.operation_type == "move_to_trash"){
				hc_deluxeapi.add_badge_to_file_or_folder(file_name,file_path,session_data["username"],session_data["session_id"],"move_to_trash",function(error){
					if(error == null){
						// no error - was added successfully
						send_status_code(res,200,"File was moved to trash");
						return;
					}else{
						send_status_code(res,500,error);
						return;
					}
				});
				return;
			}
			if(deluxe_req.operation_type == "remove_share_link"){
				//nodejs
				log_data(fname,"processing remove_share_link");
				var share_node = {};
				share_node.owner = session_data["username"];
				share_node.shared_filename = file_name.trim();
				share_node.shared_filepath = file_path.trim();
				hc_utils.db_api_delete_records_by_filter(share_node, "hc_shared_links",function(err){
					if(err == null){
						send_status_code(res,200);
						return;
					}else{
						send_status_code(res,501,"Failed to delete record. "+err);
						return;
					}
				});
				return;
			}
			if(deluxe_req.operation_type == "generate_share_link"){
				//nodejs
				log_data(fname,"processing generate_share_link");
				var share_node = {};
				share_node.owner = session_data["username"];
				share_node.shared_filename = file_name.trim();
				share_node.shared_filepath = file_path.trim();
				log_data(fname,"generate_share_link - filter shared node =  "+JSON.stringify(share_node));
				hc_utils.db_api_find_records_by_filter(share_node, "hc_shared_links",function(found_rec){
					if (found_rec != {} && found_rec != null && found_rec.key_token != null && found_rec.key_token != undefined){
						log_data(fname,"generate_share_link - file was shared before...sending the same key_token: "+found_hash);
						var found_hash = found_rec.key_token;
						send_status_code(res,200,"key_token="+found_hash);
						return;
					}else{
						log_data(fname,"generate_share_link - file was NOT shared before...generating a new token");
						hc_utils.hc_generate_random_hash(function(generated_hash){
							share_node.key_token = generated_hash;
							if(share_node.key_token != undefined && share_node.key_token != null && share_node.key_token != ""){
								log_data(fname,"generate_share_link - the generated token is "+generated_hash);
								hc_utils.db_api_add_new_record_to_table(share_node,"hc_shared_links",function(){
									log_data(fname,"generate_share_link - sending the token "+generated_hash);
									send_status_code(res,200,"key_token="+generated_hash);
								});
							}

						}); // hc_utils.hc_generate_random_hash
					}
				}); // db_api_find_records_by_filter

				return;
			}
			if(deluxe_req.operation_type == "share_file_with_other_user"){
				//nodejs
				return;
			}
			if(deluxe_req.operation_type == "share_file_with_local_user"){
				//nodejs
				return;
			}
			// if(deluxe_req.operation_type == ""){
			// return;
			// }

		}
	});
});
/*****************************************************************************************************************/
function send_request_to_logic_layer(headers_to_send,request,response){
	var fname = "send_request_to_logic_layer";
	var backendUrl = 'http://127.0.0.1:9034';

	// if(headers_to_send != null && headers_to_send != undefined){
		// for(var key in headers_to_send){
			
		// }
	// }
	try{
			request.pipe(
				httprequestlib({
								url:backendUrl,
								headers:headers_to_send
					},function(error, r, body){
							if (error != null){
								
								log_data(fname,"Failed to pipe:" + error);
								response.writeHeader(500, {"Content-Type": "text/json"});  
								response.end();
								return;
							
							} else { 
								log_data(fname,"Upload success" + error);
								if(operation_type == "Upload"){
									request.on('data',function(d){
										 log_data(fname,"Uploading ");
									});
								}
							
							}
						})
			).pipe(response);
		//response.send({status: 'SUCCESS' });
		
	}catch(ex){
		log_data(fname,"Failed to pipe:" + ex);
		response.send({status: 'FAIL' });
	}
}
/*****************************************************************************************************************/
/*
Servlet Name: validate_session
Request Type: GET
Parameters: 
@The cookie content only

if valid session then status 200 is returned. Otherwise, the session is not valid!
*/
app.get('/validate_session', function(req, res) {
	var fname = "validate_session";
	log_data(fname,"Called....");
	is_valid_session(req,function(is_valid,session_data){
		if(!is_valid){
			log_data(fname,"Not a valid session");
			res.writeHead(406, {'Content-Type': 'text/plain'});
			res.end("Invalid Session");
		}else{
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end("Valid Session");
		}
	});
	
});
/*****************************************************************************************************************/
/*
Servlet Name: logout
Request Type: GET
Parameters: 
@The cookie content only

delete the session from db
*/
app.get('/api/v1/user/logout', function(req, res) {
	var fname="logout";
	log_data( fname, "Called...");
	is_valid_session(req,function(is_valid,session_data){
		if(!is_valid){
			log_data(fname,"Not a valid session");
			send_status_code(406, "Invalid Session");
		}else{
			var cookies = parseCookies(req);
			db_account.delete_session_from_db(cookies["session"],function(err){
				send_logout_redirect(res);
			});
		}
	});
});
/*****************************************************************************************************************/

function get_clean_path(path){
	if(path == undefined || path == null){
		return path;
	}
	path = path.trim();
	return path.replace(/\/\/+/g,"/");
	
}
/*****************************************************************************************************************/
function validate_uploading_filepath(filePath,filename){
	var fname = "validate_uploading_filepath";
	log_data(fname,"Called with mounted_drives_json.length="+mounted_drives_json.length);
	// if(filePath.indexOf("../") >=0 || filename.indexOf("../") >= 0)
	// {
		// log_data(fname,"Directory has .. and this is bad");
		// return false;
	// }
	for(i=0;i<mounted_drives_json.length;i++){
		log_data(fname,"checking mounted_drives_json[i].mounted_dir = "+mounted_drives_json[i].mounted_dir);
		if(mounted_drives_json[i].mounted_dir != undefined  && mounted_drives_json[i].mounted_dir  != null){
			log_data(fname,"mounted_dir = " + mounted_drives_json[i].mounted_dir);
			var drive_dir = get_clean_path(mounted_drives_json[i].mounted_dir);
			var file_dir = get_clean_path(MOUNT_DIR +  filePath);
			log_data(fname,"filePath="+filePath +" drive_dir = " + drive_dir + " file_dir = " + file_dir);
			if(file_dir.indexOf("/"+drive_dir) == 0 && filePath.indexOf("..") < 0 &&  filePath.indexOf(";") < 0 &&  filePath.indexOf("&") < 0)
			{
				log_data(fname,"will return true");
				return true;
			}else{
				log_data(fname,"will return false because: "+'filePath.indexOf("..") < 0 &&  filePath.indexOf(";") < 0 &&  filePath.indexOf("&") < 0'+filePath.indexOf("..") < 0  +" " +  filePath.indexOf(";") < 0 +" " + filePath.indexOf("&") < 0);
				
			}
			
		}
		
	}
	return false;
}
/*****************************************************************************************************************/
function send_status_code(response,statuscode,msg,content_type){
	
	var fname = "send_status_code";
	log_data( fname, "Called with status code="+statuscode + " and msg="+msg);
	
	if(content_type == undefined || content_type == null || content_type == ""){
		content_type = "text/html; charset=utf-8";
	}
	response.writeHead(statuscode, {"Content-Type":content_type});
	if(msg != undefined && msg != null){
		response.end(msg);
	}else{
		response.end();
	}
}

/*****************************************************************************************************************/
/*
Servlet Name: login_password
Request Type: POST
Body:JSON with the next keys: 
{"username":"","password":""}

*/
app.post('/api/v1/user/login', function(req, res) {
	var fname = "login_password";
	log_data( fname, JSON.stringify(req.body));
	var request_content = req.body;
	if(request_content == undefined || request_content == null)
	{
		log_data(fname,"received no data at all");
		send_status_code(res,401);
		return;
	}
	if(request_content.username == undefined||request_content.password == undefined){
		log_data(fname,"didnt receive the login data");
		send_status_code(res,401);
		return;
		
	}
	var password = request_content.password;
	var username = request_content.username.toLowerCase();
	
	log_data(fname,"received the password:"+password + " and the username:"+username);
	// check in the db if the credintials are valid:
	db_account.db_account_validate_credintials(password,username,function(is_available){
		if(is_available){
			// var name = 'braitsch';
			// var hash = crypto.createHash('md5').update(name).digest('hex');
			log_data(fname,"Login Success");
			crypto.randomBytes(48, function(ex, buf) {
				var token = buf.toString('hex');
				
				db_account.db_account_add_new_session(token,username,"TODO",function(err){
					log_data(fname,"New session was added...sending a redirect...");
					res.writeHead(200, {'Set-Cookie': [['session=' + token],['username='+username]]	});
					
					res.end("OK");
					//res.redirect("/main_page.html");
				
				});
					
			});
		}else{
			send_status_code(res,401);
		}
	});
  
  
});
/*****************************************************************************************************************/
/*
Servlet Name: create_new_account
Request Type: POST
Body:JSON with the next keys: 
{"username":"","password":"","repassword":"","adminusername":"","adminpassword":"","cloudkey":""}
*/
app.post('/api/v1/user/new', function(req, res) {
	var fname = "create_new_account";
	var request_content = req.body;
	if(request_content == undefined || request_content == null)
	{
		log_data(fname,"received no data at all");
		send_status_code(res,204,"Bad request, no data was received!");
		return;
	}
	log_data( fname, "request_content.username="+request_content.username);
	log_data( fname, "request_content.password="+request_content.password);
	log_data( fname, "request_content.repassword="+request_content.repassword);
	log_data( fname, "request_content.adminusername="+request_content.adminusername);
	log_data( fname, "request_content.adminpassword="+request_content.adminpassword);
	log_data( fname, "request_content.cloudkey="+request_content.cloudkey);
	log_data( fname, JSON.stringify(request_content));
	
	if(	request_content.username == undefined||
		request_content.password == undefined||
		request_content.repassword == undefined||
		request_content.adminusername == undefined||
		request_content.adminpassword == undefined||
		request_content.cloudkey == undefined){
			
		log_data(fname,"didn't receive the login data");
		send_status_code(res,206, "Partial fields were received!");
		return;
		
	}
	request_content.username = request_content.username.toLowerCase();
	
	if(request_content.username.length == 0 || request_content.password == 0 ||request_content.password != request_content.repassword || !hc_utils.utils_validate_abc_name_regex(request_content.username)){
		log_data(fname,"incurrect username password");
		send_status_code(res,206, "Incorrect username or password!");
		return;
	}
	db_account.db_account_validate_credintials(request_content.adminpassword,request_content.adminusername,function(is_available){
		// admin passed - get cloud key from server
		hc_utils.db_api_find_records_by_filter({"username" : "product_serial__homecloud", "password" : request_content.cloudkey },function(found_rec){
			
			if( !(found_rec != {} && found_rec != null && found_rec.key_token != null && found_rec.key_token != undefined)|| request_content.cloudkey != found_rec.password){
				log_data(fname,"cloud key is incorrect.");
				send_status_code(res,206, "Cloud key is incorrect!");
				return;
			}
			// add username and password 
			db_account.add_new_account(request_content.password,request_content.username,function(err){
				if(err == null){
					log_data(fname,"didn't receive the login data");
					send_status_code(res,200,"Username "+request_content.username+" Was Added Successfully");
					return;
				}else{
					log_data(fname,"didn't receive the login data");
					send_status_code(res,500, "Error adding username!");
					return;				
				}
			});
			
		}); // db_api_find_records_by_filter
		
	});
	
});
/*****************************************************************************************************************/
/*
Servlet Name: getperformance
Request Type: GET
@Parameters: Only the session cookie...
*/
app.get('/api/v1/user/getperformance', function(req, response) {
	var fname = "getperformance";
	log_data(fname, "Called");
	is_valid_session(req,function(is_valid,sessionData){
		if(is_valid)
		{
			exec("echo `top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'`,`free -t | grep Total | awk '{print $3}'`", function(error, stdout, stderr){
					var performance_data = stdout.split(','); 
					log_data(fname,"stdout="+stdout);
					response.setHeader('Content-Type', 'application/json');
					response.write(JSON.stringify({"used_memory":performance_data[1],"total_ram":total_ram,"cpu_prcntg":performance_data[0]}));  
					response.end(); 
			});
		}else{
			send_status_code(response,404);
		}
	});
	
	
});
/*****************************************************************************************************************/
app.get('/', function(req, res) {
	var fname = "/";
	log_data(fname, "Called");
	is_valid_session(req,function(is_valid,sessionData){
		if(is_valid)
		{
			res.redirect("main_page.html");  
		}else{
			log_data(fname, "Redirecting to login");
			res.redirect('login.html');
		}
	});
	
	
});
/*****************************************************************************************************************/
app.get('/*.html', function(req, res) {
	var fname = "html_page";
	log_data( fname,"Called");
	var now = new Date();
	is_valid_session(req,function(is_valid,sessionData){
		
		var filename = req.url || "login.html";
		log_data( fname,"filename=" + filename);
		filename=filename.replace("/","");
		log_data( fname,"the requested page is:"+filename);
		var localPath = __dirname;
		var html_folder = "";
		if(!is_valid){
			log_data( fname,"session is not valid - will serve only the login page");
			filename = "login.html";
		}else{
			if(filename == "login.html"){
				filename = "main_page.html";
			}
		}
		switch(filename){
			case "login.html":
				html_folder = "login_form";
				break;
			case "main_page.html":
				
				html_folder = "main_page";
				break;
			default:
				log_data(fname,"Page not found: " + localPath);
				send_status_code(res,404);
			
				return;
		}
		localPath =localPath +"/"+html_folder+"/"+ filename;
		log_data(fname,"filename = " + filename);
		
		if(filename.indexOf('?')>0){
			filename = filename.substring(0,filename.indexOf('?'));
		}
		
		fs.exists(localPath, function(exists) {
			if(exists) {
				log_data(fname,"Serving file: " + localPath );
				res.setHeader("Location", filename);
				getFile(localPath, res, "text/html");
			} else {
				log_data(fname,"File not found: " + localPath);
				send_status_code(res,404);
				return;
			}
		});				
	});
	
});
/*****************************************************************************************************************/
app.get('/*', function(req, res) {
	var fname = "Anything else";
	log_data(fname, JSON.stringify(req.body));
	var now = new Date();

	var filename = req.url || "login.html";
	var ext = path.extname(filename);
	var localPath = __dirname;
	var validExtensions = {
		".html" : "text/html",			
		".js": "application/javascript", 
		".css": "text/css",
		".map": "application/octet-stream",
		".mapfile": "text/css",
		".woff": "text/css",
		".otf": "text/css",
		".eot": "text/css",
		".svg": "text/css",
		".ttf": "text/css",
		".txt": "text/plain",
		".jpg": "image/jpeg",
		".gif": "image/gif",
		".ico": "icon/ico",
		".png": "image/png"
	};
	var isValidExt = validExtensions[ext];

	if (isValidExt || 1) {
		
		if(filename.indexOf('?')>0){
			filename = filename.substring(0,filename.indexOf('?'));
		}
		log_data(fname,"filename = " + filename);
		
		localPath += filename;
		fs.exists(localPath, function(exists) {
			if(exists) {
				log_data(fname,"Serving file: " + localPath +" with mime-type:"+validExtensions[ext]);
				getFile(localPath, res, validExtensions[ext]);
			} else {
				log_data(fname,"File not found: " + localPath);
				send_status_code(res,404);
				
			}
		});

	} else {
		log_data(fname,"Invalid file extension detected: " + ext + "file name is " +filename);
	}
});
/*****************************************************************************************************************/
/*****************************************************************************************************************/

/*****************************************************************************************************************/
function isLegalFolderORFileName(name){
	var specialChars = "<>\\.\|\"?;*$:";

    for(i = 0; i < specialChars.length;i++){
        // if(name.indexOf(specialChars[i]) > -1){
            // return false;
        // }
    }
    return true;
}
/*****************************************************************************************************************/
function is_valid_session(request,callback){
	var fname = "is_valid_session";
	var cookies = parseCookies(request);
	if(cookies == undefined || cookies == null){
		callback(false);
		return;
	}
	log_data(fname,"All cookies are: " + JSON.stringify(cookies));
	log_data(fname,"thes session in the cookie is: " + cookies["session"]);
	if(cookies["session"] == undefined){
		log_data(fname,"No session in cookie");
		callback(false);
		
	}else{
		db_account.db_account_is_available_session(cookies["session"],callback);
	}
}
/*****************************************************************************************************************/
function send_logout_redirect(res){
	var fname = "send_logout_redirect";
	log_data(fname,"Called...");
	res.clearCookie("session");
	res.clearCookie("username");
	
	res.redirect('login.html');

}
/*****************************************************************************************************************/
function getFile(localPath, res, mimeType) {
	var fname = "getFile";
	fs.readFile(localPath, function(err, contents) {
		if(!err) {
			res.setHeader("Content-Length", contents.length);
			if(mimeType == undefined || mimeType == null )
			{
				mimeType = "text/css";
			}
			res.setHeader("Content-Type", mimeType);
			res.statusCode = 200;
			res.end(contents);
			log_data(fname,"file "+localPath +" was sent successfully with mymtype "+mimeType);
		} else {
			res.statusCode = 500;
			res.end();
		}
	});
}

function get_total_ram(){
	
	var fname = "get_total_ram";
	exec("free -t | grep Total | awk '{print $2}'", function(error, stdout, stderr){
			total_ram = stdout
			log_data(fname,"total_ram="+total_ram);
			return stdout;
	});
	return -1;
}
function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}
//app.listen(8182);
//sys.puts("Server Running on 8182"); 

hc_utils.hc_utils_get_mounted_drives(function(mounted_drives){
	var fname = "main -> hc_utils_get_mounted_drives"; 
	log_data(fname,"mounted_drives =  '"+mounted_drives+"'");
	if(mounted_drives == null || mounted_drives == undefined || mounted_drives.trim() == ""){
		log_data(fname,"mounted_drives = '"+mounted_drives+"'");
		mounted_drives="{}";
	}
	mounted_drives_json = JSON.parse(mounted_drives);
});

var server = https.createServer(options, app).listen(443, function () {
   console.log('HTTPS started, it must be superuser to take on port less than 1024!');
});
server.timeout = 1000*60*60; // One Hour timeout
 
get_total_ram();
 
// uncought sudden excepotions:
process.on('uncaughtException', function(err){
	var fname = "uncaughtException";
	log_data(fname,'uncaughtException: ' + err.message);
	log_data(fname,err.stack);
  //process.exit(1);             // exit with error
});