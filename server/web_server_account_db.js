var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/home_cloud_db';
module.exports = {
	delete_session_from_db : function(session_to_delete,callback_delete_session){
		var fname = "delete_session_from_db";
		log_data(fname,"Called...");
		
		var delete_session = function(db, callback) {
			db.collection('sessions_table').deleteOne(  { "session_id": session_to_delete},function(err, session_rec) {
				if(session_rec && !err){
					log_data(fname,"Found and deleted the session:"+session_to_delete);
					
					callback(true);
				}else{
					log_data(fname,"session  "+session_to_delete +"is NOT valid...");
					callback(false);
				}
			});
			
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				delete_session(db, function(was_deleted) {
					db.close();
					callback_delete_session(was_deleted);
				});
			}else{
				log_data(fname,"Error happened saying: "+err);
				callback_delete_session(false);
			}
		});		
	},
	db_account_validate_credintials : function(password,username,callback_validate_credintials){
		var fname = "db_account_validate_credintials";
		log_data(fname,"Called...");
		var validate_credintials = function(db, callback) {
				db.collection('passwd_table').findOne( { "username": username,"password":password},function(find_err,user_record){
					log_data(fname,"Found record "+JSON.stringify(user_record)+"for username:"+username);
					
					if(user_record != null && find_err == null&& user_record != JSON.parse("{}") &&user_record.username == username && user_record.password == password ){
						callback(true);
					}else{
						log_data(fname,"didn't found record for username:"+username);
						callback(false);
					}
				});
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				validate_credintials(db, function(is_exist) {
					db.close();
					callback_validate_credintials(is_exist);
				});
				
			}else{
				log_data(fname,": err happened saying: "+ err);
				callback_validate_credintials(false);
			}
		});	
		
	},
	/************************************************************************************************************/
	/*
	params:
	@session_id: session id - one user may have several of them if he has the app configured in more than one machine
	
	sessions_table:
	-----------------------------------------------------------------------------
	session_id | username| date | device_id
	-----------------------------------------------------------------------------
	
	*/
	db_account_is_available_session : function(session_id,find_acc_callback){
		var fname = "db_account_is_available_session";
		log_data(fname,"Called...");
		log_data(fname,"Validating the session:" + session_id);
		var find_account = function(db, callback) {
			db.collection('sessions_table').findOne(  { "session_id": session_id},function(err, session_rec) {
				if(session_rec && !err){
					log_data(fname,"Found the session " + JSON.stringify(session_rec));
					log_data(fname,"session "+session_rec["session_id"] +"is valid...");
					callback(true,session_rec);
				}else{
					log_data(fname,"session  "+session_id +"is NOT valid...");
					callback(false,null);
				}
			});
			
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				find_account(db, function(is_exist,data) {
					db.close();
					find_acc_callback(is_exist,data);
				});
			}else{
				log_data(fname,"Error happened saying: "+err);
				find_acc_callback(false,null);
			}
		});	
	},
/*****************************************************************************************************************/
	db_account_add_new_session : function(session_id,username,device_id,res_callback){
		var fname = "db_account_add_new_session";
		log_data(fname,"Called...");
		
		var insert_session = function(db,callback){
			db.collection('sessions_table').insertOne( {
			  "session_id" : session_id,
			  "username" : username,
			  "device_id" : device_id,
			  "date_created" : Date()
			}, callback );		
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				insert_session(db, function(insert_session_err) {
					if(!insert_session_err){
						log_data(fname,"The session "+session_id+"was added successfully");
						db.close();
						res_callback(insert_session_err);
					}else{
						log_data(fname,"Failed to add session "+session_id+". Error says:" +insert_session_err);
					}
				});
			}else{
				log_data(fname,"Failed to Connect to DB. error says:" + err);
				res_callback(err);
			}
		});
	},
/*****************************************************************************************************************/	
	add_new_account : function(password,username,res_callback){
		var fname = "add_new_account";
		log_data(fname,"Called...");
		
		var new_user = function(db,callback){
			db.collection('passwd_table').insertOne( {
			  "username" : username,
			  "password" : password
			}, callback );		
		};
		MongoClient.connect(url, function(err, db) {
			if(err==null){
				new_user(db, function(insert_session_err) {
					if(!insert_session_err){
						log_data(fname,"The credintials "+username+"were added successfully");
						db.close();
						res_callback(insert_session_err);
					}else{
						log_data(fname,"Failed to add credentials "+username+". Error says:" +insert_session_err);
					}
				});
			}else{
				log_data(fname,"Failed to Connect to DB. error says:" + err);
				res_callback(err);
			}
		});
	}
};
/*****************************************************************************************************************/

function log_data(fname,data)
{
	console.log("["+fname+"]"+ " - " + data);
}
/*****************************************************************************************************************/
/*****************************************************************************************************************/
/*****************************************************************************************************************/
/*****************************************************************************************************************/
/*****************************************************************************************************************/