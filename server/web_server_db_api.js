var Enum = require('enum');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/home_cloud_db';

var chunks_table=[];
var files_table=[];
var ENUM_DB = new Enum({'Already exist in database': 1, 'failed to add because of error': 2, 'Successfully added': 3});
var PENDING = "Pending";
// exports.chunks_table=chunks_table;
// exports.files_table=files_table;
// exports.ENUM_DB=ENUM_DB;
module.exports = {
	/*
		return a a json of the files of the username that are uploading or downloading and filter by the requested status
		@username: the files that belongs to this user
		@file_status: whether pending or completed or error
		@operation_type: whether downloading or uploading
	*/
	get_files_by_state : function(username,file_status,operation_type,files_callback){
		var fname = "get_files_by_state";
		log_data(fname,"called...");
		var query = {};
		var found_records = [];
		query.operation_type = operation_type;
		query.username = username;
		if(file_status != undefined || file_status != null){
			query.file_status = file_status;
		}
		log_data(fname,"query:" + JSON.stringify(query));
		var find_files = function(db, callback) {
		   var cursor =db.collection('files_table').find( query);
		   cursor.each(function(err,file_rec) {
			   //log_data(fname,"err="+err+" and file_rec:" + JSON.stringify(file_rec));
			   if(err==null && file_rec != null){
				//log_data(fname,"found:" + JSON.stringify(file_rec));
				   found_records.push(file_rec);
			   }else{
					log_data(fname,"GOT err" + err);
					log_data(fname,"finished and calling callback");
					callback();
			   }
		   });
		   
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				find_files(db, function() {
					db.close();
					files_callback(found_records);
				});
			}else{
				log_data(fname,"Error happened saying: "+err);
				files_callback(found_records);
				return;
			}
		});	
	},
	/*****************************************************************************************************************/

	//var FILES_TABLE = "hs_processed_files_table";
	
	/**
	Post a request to /UploadFilesRequest with the json detailed below:
	Expecting detailed array json which handles the files to be uploaded
	{
	  
		"number_of_chunks":2,
		"chunks_stat": [
			{chunk_number:1,sha1:"fjksdjfhkj345hkj34h5k3j45hk3j4l23",size:213123},
			{chunk_number:2, sha1:"fjks11fhkj345hkj34h5k3j45hk3j4l23",size:21313},
			{chunk_number:3, sha1:"fjks546456345hkj34h5k3j45hk3j4l23",size:2131123}
		],
		"file_name": "breaking bad part 1.avi",
		"file_path": "/hesham/tv shows/breaking bad",
		"sha1": "8d9fd9fsd9f8sd98sd9fdfdsfsdfsd98sfdd",
		"file_size":1334545

	}
		
		The files table
		----------------------------------------------------------------------------------------------
		[username] | [file_sha1] | file_name | file_size | file_path | operation_type | update_date 
		----------------------------------------------------------------------------------------------
		
		
		The chunks table:
		---------------------------------------------------------------------------------------------------------------
		chunk_name | chunk_size | [chunk_sha1] | [chunk file sha1] | [username] | status | update_date | operation_type
		---------------------------------------------------------------------------------------------------------------
	**/
	
	db_api_add_new_file_request_to_database: function(request,username,callback)
	{
		var fname = "db_api_add_new_file_request_to_database";
		log_data(fname,"called...");
		
		var request_json=request;
		
		
		var file_name = request_json["file_name"];
		var file_sha1 = request_json["file_sha1"];
		var file_size = request_json["file_size"];
		var file_path = request_json["file_path"];
		var upload_identifier = request_json["upload_identifier"];
		var operation_type = request_json["operation_type"];
		
		var chunks_stat = request_json["chunks_stat"];
		log_data(fname,"file_name="+file_name);
		log_data(fname,"upload_identifier="+upload_identifier);
		log_data(fname,"file_sha1="+file_sha1);
		log_data(fname,"file_size="+file_size);
		log_data(fname,"operation_type="+operation_type);
		log_data(fname,"username="+username);
		
		db_api_validate_if_file_already_exist(username,
									file_name,
									file_path,
									operation_type,
									function(is_exist,file_record){
										log_data(fname,"db_api_validate_if_file_already_exist Finished");
										// TODO:If download from same user from same place then ignore, otherwise, add it. the reason so user doesn't doubleclick thousand times and download thousand times but click thousand times and download once.
										
										
										
										if(!is_exist){
											log_data(fname,"no record was found...");
											db_api_add_to_files_table(
																		username,
																		file_sha1,
																		file_name,
																		file_size,
																		file_path,
																		operation_type,
																		Date(),
																		upload_identifier,
																		chunks_stat,
																		function(err,objid){
																			if(err == null)
																			{
																				var filtered_sha1_arr=[];
																				log_data(fname,"file "+ file_sha1 + " was added successfully! obj_id = " + objid);
																				filtered_sha1_arr.push(file_sha1);
																				callback(true,objid,null,filtered_sha1_arr);
																			}else{
																				log_data(fname,"Failed to add file "+file_sha1+" to files table because: "+err);
																				callback(false,null,"Failed to add file "+file_sha1+" to files table because: "+err,null);
																			}
																			
																			
																		}
											);
										}else{
											
											log_data(fname,"A record already available with _id="+file_record._id);
											// The upload may be stuck if data was found. it is better to send it to the logic layer so it decides how to manage that.
											
											
											filter_pending_chunks(file_sha1,chunks_stat,file_record["chunks_stat"],file_record["status"],function(filtered_chunks_arr){
												log_data(fname,"filter_pending_chunks Finished");
												//TODO:If the record already exist, it need to be handled
												callback(true,file_record._id,null,filtered_chunks_arr);
											});
										}
									})		
	}
};
/*****************************************************************************************************************/

/*****************************************************************************************************************/

//The filter callback expects the input: callback(true,null,filtered_chunks)
function filter_pending_chunks(file_sha1,requested_chunks_stat,curr_chunks_stat,file_status,filter_callback){
	/*Pass over the requested and curr chunks
		if empty then update the whole file
		if not empty then return from the curr_chunks those who are only pending and exist in requested_chunks_stat.
	*/
	var fname = "filter_pending_chunks";
	log_data(fname,"called...");
	//log_data(fname,"there are  "+requested_chunks_stat.length+" members:requested_chunks_stat = " + JSON.stringify(requested_chunks_stat));
	var filtered_sha1_arr=[];
	if(requested_chunks_stat == undefined ||requested_chunks_stat == null || requested_chunks_stat.length == 0){
		filtered_sha1_arr.push(file_sha1);
		filter_callback(filtered_sha1_arr);
		
	}else{
		
		for (var i = 0; i <curr_chunks_stat.length ; i++) {
			log_data(fname,"checking the member number : "+i);
			//if(curr_chunks_stat[i]["status"] == PENDING){
			//	filtered_sha1_arr.push(curr_chunks_stat[i]["chunk_sha1"]);
			//}
			
		}
		filter_callback(filtered_sha1_arr);
	}
}
/*****************************************************************************************************************/
function db_api_add_to_files_table (username,
							file_sha1,
							file_name,
							file_size,
							file_path,
							operation_type,
							date_of_insertion,
							upload_identifier,
							chunks_stat,
							res_callback){
	var fname = "db_api_add_to_files_table";
	var insert_file = function(db,callback){
		var obj_to_insert = {
		  "username" : username,
		  "file_sha1" : file_sha1,
		  "file_name" : file_name,
		  "file_status" : "Pending",
		  "file_size" : file_size,
		  "file_path" : file_path,
		  "op_percentage" : 0,
		  "operation_type" : operation_type,
		  "date_of_insertion" : date_of_insertion,
		  "upload_identifier" : upload_identifier,
		  "chunks_stat" : chunks_stat
		}
		var objid = db.collection('files_table').insertOne( obj_to_insert, function(err,aa){
			if(err){
				callback(err,null);
			}else{
				callback(err,obj_to_insert._id);
			}
		} );		
	};
	MongoClient.connect(url, function(err, db) {
		if(err==null){
			insert_file(db, function(err,objid) {
				db.close();
				res_callback(err,objid);
			});
		}else{
			res_callback(err,null);
		}
	});
}	// db_api_add_to_files_table
/*****************************************************************************************************************/

function log_data(fname,data)
{
	console.log("["+fname+"]"+ " - " + data);
}
/*****************************************************************************************************************/
function db_api_validate_if_file_already_exist(username,
									file_name,
									file_path,
									operation_type,found_record_callback){
	var fname = "db_api_validate_if_file_already_exist";
	log_data(fname,"Called...");
	var index = 0;
	var find_file = function(db, callback) {
		var file_rec =db.collection('files_table').findOne(  { "username": username,"file_name":file_name ,"file_path":file_path,"operation_type":operation_type,"op_percentage":0,"file_status":"Pending"},function(err, found_data){
				
				if(found_data){
					log_data(fname,"file "+file_name+" already exists");
					callback(true,found_data);			
				}else{
					log_data(fname,"file "+file_name+" doesn't exists");
					callback(false,null);
				}
			});
	};
	MongoClient.connect(url, function(err, db) {
		if(err==null){
			find_file(db, function(is_exist,data) {
				db.close();
				if(is_exist){
					log_data(fname,"found record  for file " +file_name +":"+JSON.stringify(data));
				}else{
					log_data(fname,"DIDNT found record  for file " +file_name +" - because data found is:"+JSON.stringify(data));
				}
				found_record_callback(is_exist,data);
			});
		}else{
			log_data(fname,"ERR: cant find file. error for file " +file_name +":"+err);
			found_record_callback(false,null);
		}
	});
}
/*****************************************************************************************************************/
/*****************************************************************************************************************/
/*****************************************************************************************************************/