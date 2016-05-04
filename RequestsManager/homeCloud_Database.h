/*
 * db_api.h
 *
 *  Created on: Feb 25, 2016
 *      Author: hesham
 */

#ifndef _DB_API_H_
#define _DB_API_H_
#include "mongo/client/dbclient.h"

#include <iostream>

using namespace std;
using namespace mongo;

#define PRNT_LOG(logmsg) cout << "[" << fname << "] - " << logmsg << endl;
typedef enum {file_success,file_pending,file_failed} File_Upload_Download_Status;
class Database_API{

    public:

        static Database_API* getInstance();

        bool validate_session_id(const string& session_id,string& out_username);
        /*When finishing to download the file, we should update the downloading status.*/
        void update_downloaded_file_status(File_Upload_Download_Status download_status,const OID& file_record_oid);
        //void update_file_percentage(size_t percentage,const OID& file_record_oid);
        string get_user_of_session(const string& session_id);
        void update_file_status(const string& newstatus,const OID& file_record_oid);
        /***
         * Before doing any operation, the request handler calls this method in order to check first if there is a request for the operation.
         * in case there is no valid request, the operation will be aborted.
         * The server decides on updating the record like file status in case there is an existing record with status failure.
         */
        bool is_valid_filerequest(const OID& file_object_id,const string& file_name, const string& filepath,const string& optype,const string& username);
        OID get_file_objectid_from_files_table(const string& file_name, const string& username,const string& file_path, const string& expected_op_type);
    private:
        Database_API(Database_API const&){}
        void operator=(Database_API const&){}
        static Database_API *_instance; // Guaranteed to be destroyed.
        boost::scoped_ptr<DBClientBase> conn;

        // Constructor? (the {} brackets) are needed here.
        Database_API(){
        	string fname = "Database_API()";
        	PRNT_LOG("Called");
        	const char *port = "27017";

			std::string errmsg;
			ConnectionString cs = ConnectionString::parse(string("mongodb://127.0.0.1:") + port, errmsg);
			if (!cs.isValid()) {
				cout << "error parsing url: " << errmsg << endl;
				return ;
			}

			PRNT_LOG("Connecting...");
			conn.reset(cs.connect(errmsg));
			PRNT_LOG("Msg Parsing connection:" << errmsg);
			if (!conn) {
				PRNT_LOG("couldn't connect : " << errmsg);
				return ;
			}
        };
        // C++ 11
        // =======
        // We can use the better technique of deleting the methods
        // we don't want.
    public:


        // Note: Scott Meyers mentions in his Effective Modern
        //       C++ book, that deleted functions should generally
        //       be public as it results in better error messages
        //       due to the compilers behavior to check accessibility
        //       before deleted status
};



#endif /* DB_API_H_ */
