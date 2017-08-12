var MongoClient = require('mongodb').MongoClient;
var hc_utils = require('./HomeCloud_Utils');

var url = 'mongodb://localhost:27017/home_cloud_db';

module.exports = {
	/*
	@requested_operation: add_to_favorites/move_to_trash
	
	output:
	update the table with the next new flags:
	is_favorite/is_in_trash
	*/
	add_badge_to_file_or_folder: function(file_name,file_path,username,session_id,requested_operation,res_callback){
		var fname = "add_badge_to_file_or_folder";
		var table_name = 'deluxe_table';
		
		log_data(fname,"Called...");
		if(!is_legal(file_name) || !is_legal(file_path) || !is_legal(username) || !is_legal(session_id)){
			log_data(fname,"part of the input params are empty. quiting...filename="+file_name +",filepath="+file_path);
			res_callback("Illigal input",null);
			return;
		}
		var handle_deluxe_req = function(db,callback){
			var obj_to_handle = {
			  "username" : username,
			  "file_name" : file_name,
			  "file_path" : file_path,
			  "file_owner" : username
			};
			log_data(fname,"handling request for file:" + JSON.stringify(obj_to_handle));
			
			var objid = db.collection(table_name).findOne( obj_to_handle, function(err, found_data){
				if(found_data){
					log_data(fname,"found available record...obj_id="+found_data._id);
					
					if(requested_operation == "add_to_favorites"){
						if(found_data.is_favorite != undefined && found_data.is_favorite != null){
							found_data.is_favorite = found_data.is_favorite==true?false:true;
						}else{
							found_data.is_favorite = true;
						}
					}
					if(requested_operation == "move_to_trash"){
						return; // no need to readd the file to trash
					}
					//TODO:Implement hc_utils.update_record_in_table
					hc_utils.db_api_update_record_in_table(found_data._id,table_name,found_data,callback);
				}else{
					log_data(fname,"didnt find available record...will create new one");
					if(requested_operation == "add_to_favorites"){
						obj_to_handle.is_favorite = true;
					}
					if(requested_operation == "move_to_trash"){
						found_data.is_in_trash = true;
					}
					
					hc_utils.db_api_add_new_record_to_table(obj_to_handle,table_name,callback);
					
				}
			});		
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				handle_deluxe_req(db, function(err,objid) {
					db.close();
					res_callback(err,objid);
				});
			}else{
				res_callback(err,null);
			}
		});
	}, // end of add_file_or_folder_to_favorites
	
	
	add_file_or_folder_to_favorites: function(file_name,file_path,username,session_id,res_callback){
		var fname = "add_file_or_folder_to_favorites";
		var table_name = 'deluxe_table';
		
		log_data(fname,"Called...");
	if(!is_legal(file_name) || !is_legal(file_path) || !is_legal(username) || !is_legal(session_id)){
		log_data(fname,"part of the input params are empty. quiting...filename="+file_name +",filepath="+file_path);
		res_callback("Illigal input",null);
		return;
	}
		var handle_deluxe_req = function(db,callback){
			var obj_to_handle = {
			  "username" : username,
			  "file_name" : file_name,
			  "file_path" : file_path,
			  "file_owner" : username
			};
			log_data(fname,"handling request for file:" + JSON.stringify(obj_to_handle));
			
			var objid = db.collection(table_name).findOne( obj_to_handle, function(err, found_data){
				if(found_data){
					log_data(fname,"found available record...obj_id="+found_data._id);
					
					if(found_data.is_favorite != undefined && found_data.is_favorite != null){
						found_data.is_favorite = found_data.is_favorite==true?false:true;
					}else{
						found_data.is_favorite = true;
					}
					//TODO:Implement hc_utils.update_record_in_table
					hc_utils.db_api_update_record_in_table(found_data._id,table_name,found_data,callback);
				}else{
					log_data(fname,"didnt find available record...will create new one");
					obj_to_handle.is_favorite = true;
					//TODO:Implement hc_utils.add_new_record_to_table
					hc_utils.db_api_add_new_record_to_table(obj_to_handle,table_name,callback);
					
				}
			});		
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				handle_deluxe_req(db, function(err,objid) {
					db.close();
					res_callback(err,objid);
				});
			}else{
				res_callback(err,null);
			}
		});
	} // end of add_file_or_folder_to_favorites

}
function log_data(fname,data)
{
	console.log("["+fname+"] - "+ Date()+ " - " + data);
}

function is_legal(filename){
	return filename != null && filename !=undefined;
}