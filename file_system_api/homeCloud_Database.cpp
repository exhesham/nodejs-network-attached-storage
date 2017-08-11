/*
 * db_api.cpp

 *
 *  Created on: Feb 25, 2016
 *      Author: hesham
 */
#include "homeCloud_Database.h"
Database_API* Database_API::_instance = NULL;
Database_API* Database_API::getInstance()
{
	string fname = "getInstance";
	//PRNT_LOG("Called");
	if(_instance == NULL){
		_instance = new Database_API();
	}
	//PRNT_LOG("returning instance " << _instance);                      // Instantiated on first use.
	return _instance;
}
bool Database_API::is_valid_filerequest(const OID& file_object_id,const string& file_name, const string& filepath,const string& optype,const string& username){
	// this may not work on the rasp server because of mongo version. in this case see how get_file_objectid_from_files_table finds.
	const string fname = "is_valid_filerequest";
	const char* ns = "home_cloud_db.files_table";
	PRNT_LOG("Record oid='"<< file_object_id << "' and username='"<< username << "' file_name='"<<file_name<<"' filepath="<<filepath);
	BSONObj res = conn.get()->findOne(ns, BSONObjBuilder().append("_id", file_object_id).append("username",username).append("file_name",file_name).append("file_path",filepath).obj());

	if(res.isEmpty()){
		PRNT_LOG("cannot find a record in the files_table with the given oid! exiting..");
		return false;
	}
	PRNT_LOG("Record oid "<< file_object_id << " was found!");
	return true;
}
OID Database_API::get_file_objectid_from_files_table(const string& file_name,
		const string& username,const string& file_path,const string& expected_op_type){
	const string fname = "get_file_objectid_from_files_table";
	PRNT_LOG("Called with file name="<<file_name << " and username=" << username << " and file_path:"<<file_path);

//
	const char* ns = "home_cloud_db.sessions_table";
//	BSONObj res = conn.get()->findOne(ns, BSONObjBuilder().append("file_sha1", file_sha1).append("username",username).append("file_path",file_path).obj());
//
//	if(res.isEmpty()){
//		PRNT_LOG("cannot find a record in the files_table with the given sha1! exiting..");
//		out_op_type = "";
//		return OID();
//	}
//	out_op_type = res.getStringField("operation_type");
//	return res.firstElement().OID();

	mongo::BSONObjBuilder query;
	OID res;
	std::auto_ptr<mongo::DBClientCursor> cursor = conn->query("home_cloud_db.files_table", query.obj());
	if (!cursor.get()) {
		PRNT_LOG("query failure" );
		return OID();
	}


	while (cursor->more()) {
		PRNT_LOG("using cursor");
		mongo::BSONObj obj = cursor->next();
		if(obj.getStringField("file_name") == file_name &&
				obj.getStringField("username")==username &&
				obj.getStringField("file_path")==file_path &&
				obj.getStringField("operation_type")==expected_op_type){
			PRNT_LOG("\t FOUND IT:" << obj.jsonString() << " and the obj_id is:" <<  obj.getField("_id").OID());

			return obj.getField("_id").OID();
		}
	}
	return OID();
}
//void Database_API::update_file_percentage(size_t percentage,const OID& file_record_oid){
//	const string fname = "update_file_percentage";
//	//PRNT_LOG("Called with oid="<<file_record_oid);
//	conn.get()->update("home_cloud_db.files_table",
//			BSON("_id" << file_record_oid ),
//			BSON("$set"<< BSON("op_percentage" << percentage))
//	);
//}
void Database_API::update_file_status(const string& newstatus,const OID& file_record_oid){
	const string fname = "update_file_percentage";
	PRNT_LOG("Called with oid="<<file_record_oid);
	conn.get()->update("home_cloud_db.files_table",
			BSON("_id" << file_record_oid ),
			BSON("$set"<< BSON("file_status" << newstatus))
	);
}
void Database_API::update_downloaded_file_status(File_Upload_Download_Status u_d_status,const OID& file_record_oid){
	const string fname = "update_downloaded_file_status";
	PRNT_LOG("Called with oid="<<file_record_oid << " and value " << file_record_oid);

	string status_new_val;
	switch(u_d_status){
	case file_success:
		status_new_val = "Success";
		break;
	case file_failed:
		status_new_val = "Failed";
		break;
	case file_pending:
		status_new_val = "Pending";
		break;
	}

	conn.get()->update("home_cloud_db.files_table",
			BSON("_id" << file_record_oid ),
			BSON("$set"<< BSON("file_status" << status_new_val))
	);
//	BSONObj res = conn->get()->findOne("home_cloud_db.files_table", BSONObjBuilder().append("file_sha1", file_sha1).obj());
//	if(res.isEmpty()){
//		PRNT_LOG("cannot find a record in the files_table with the given sha1! exiting..");
//		return;
//	}
//	BSONObj after = BSONObjBuilder().appendElements(res).append("file_status", status_new_val).obj();
//	conn->get()->update("home_cloud_db.files_table", BSONObjBuilder().append("file_sha1", file_sha1).obj(), after);

}
bool Database_API::validate_session_id(const string& session_id,string& out_username){
		const string fname = "validate_session_id";
		PRNT_LOG("Called with session_id="<<session_id);

		const char* ns = "home_cloud_db.sessions_table";
        BSONObj res = conn.get()->findOne(ns, BSONObjBuilder().append("session_id", session_id).obj());
        if(!res.isEmpty()){
        	out_username = res.getStringField("username");
        	return true;
        }
        return false;

}
string Database_API::get_user_of_session(const string& session_id){
		const string fname = "validate_session_id";
		PRNT_LOG("Called with session_id="<<session_id);

		const char* ns = "home_cloud_db.sessions_table";
        BSONObj res = conn.get()->findOne(ns, BSONObjBuilder().append("session_id", session_id).obj());
        return res.getStringField("username");

}

