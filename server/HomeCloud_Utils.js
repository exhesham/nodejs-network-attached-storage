var RELATIVE_DIR = "/home/pi/homecloud/SmartRaspian/"
var MOUNT_DIR = "/media/pi"

var fs = require('fs');
var crypto = require('crypto');
var exec = require('child_process').exec;
var MongoClient = require('mongodb').MongoClient;

var url = 'mongodb://localhost:27017/home_cloud_db';
var conf = [];
module.exports = {
	

	/************************************************************************************************/
	hc_utils_get_mounted_drives : function(callback){
		var fname = "hc_utils_get_mounted_drives";
		log_data(fname, "mount dir is:" +MOUNT_DIR+" will run this command:"+RELATIVE_DIR + "./find_mounted_drives.sh " +MOUNT_DIR);
		exec(RELATIVE_DIR + "find_mounted_drives.sh " +MOUNT_DIR , function(error, stdout, stderr){
			
			log_data(fname, 'mounted drives as received are:' + stdout);
			callback( stdout);
		});
	},
	/************************************************************************************************/
	/************************************************************************************************/
	/*
	obj_to_insert: json of structure {field:value}
	tablename: datatbase tablename
	result_callback: Callback receives (err_msg,add object ID)
	*/
	db_api_add_new_record_to_table : function(obj_to_insert,tablename,result_callback){
		var fname = "db_api_add_new_record_to_table";
		
		var add_obj_to_db = function(db,callback){
			var objid = db.collection(tablename).insertOne( obj_to_insert, function(err,aa){
				if(err){
					callback(err,null);
				}else{
					callback(err,obj_to_insert._id);
				}
			} );		
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				add_obj_to_db(db, function(err,objid) {
					db.close();
					result_callback(err,objid);
				});
			}else{
				result_callback(err,null);
			}
		});
	},//db_api_add_new_record_to_table
	/************************************************************************************************/
	db_api_update_record_in_table : function(record_id, table_name,updated_record,result_callback){
		var fname = "db_api_update_record_in_table";
		var update_obj_in_db = function(db,callback){
			var objid = db.collection(table_name).updateOne({"_id":record_id}, updated_record, function(err,aa){
				if(err){
					callback(err,null);
				}else{
					callback(err,updated_record._id);
				}
			} );		
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				update_obj_in_db(db, function(err,objid) {
					db.close();
					result_callback(err,objid);
				});
			}else{
				result_callback(err,null);
			}
		});
	}, // db_api_update_record_in_table
	/************************************************************************************************/
	db_api_delete_records_by_filter : function(filter, table_name,result_callback){
		var fname = "db_api_delete_records_by_filter";
		log_data(fname, 'Called');
		
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				delete_from_table(db,table_name,filter, function(tabledata) {
					db.close();
					result_callback(tabledata);
				});
			}else{
				result_callback(null);
			}
		});
	} ,// db_api_delete_records_by_filter
	/************************************************************************************************/
	db_api_find_records_by_filter : function(filter, table_name,result_callback){
		var fname = "db_api_find_records_by_filter";
		log_data(fname, 'Called');
		
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				find_in_table_cursor(db,table_name,filter, function(tabledata) {
					db.close();
					result_callback(tabledata);
				});
			}else{
				result_callback(null);
			}
		});
	} ,// db_api_find_records_by_filter
	/************************************************************************************************/
	hc_generate_random_hash : function(callback){
		var hash = crypto.createHash('md5').update(new Date().valueOf() + Math.sqrt(new Date().valueOf()).toString()).digest('hex');
		callback(hash);
	}
	/************************************************************************************************/
};

/************************************************************************************************/
function delete_from_table(db,table_name,filter,callback){
	var result = [];
	var res =db.collection(table_name).deleteMany(filter,callback);
}
/************************************************************************************************/
function log_data(fname,data)
{
	console.log("["+fname+"] - "+ Date()+ " - " + data);
}
/************************************************************************************************/
function find_in_table_cursor(db,table_name,filter,callback){
	var result = [];
	var cursor =db.collection(table_name).find(filter);
	
	cursor.each(function(err, record) {
		if(err != null){
			callback(null);
			return;
		}
		if (record != null) {
			result.push(record);
		} else{
			//finished pushing
			callback(result);
		}
	});
}
/************************************************************************************************/