/*
 * RequestWrapper.cpp
 *
 *  Created on: Feb 17, 2016
 *      Author: hesham
 */
#include <iostream>

#include "homeCloud_ReqProcessor.h"
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"


using namespace rapidjson;
using namespace std;

Socket_data::Socket_data(int socket):socket(socket),is_finished_processing_header(false),session_status(Not_Received_yet){
	ConfigurationDictionary::getInstance()->initialize();
}

Socket_data::~Socket_data(){
  string fname = "~Socket_data()";
  PRNT_LOG("Called...");
}
void Socket_data::finish_receiving(){
		string fname = "finish_receiving";
		PRNT_LOG("Called...");
		PRNT_LOG("==> Close File" << this->multiparser.getfilename());
		if(socket_buff_upload_file.is_open()){
			socket_buff_upload_file.close();
		}

		if(multiparser.get_already_received_bytes() == multiparser.get_file_size()){
			// update data with success
			Database_API::getInstance()->update_downloaded_file_status(file_success,this->multiparser.getobjoid());
			return;
		}
		Database_API::getInstance()->update_downloaded_file_status(file_failed,this->multiparser.getobjoid());

	}

/********************************************************************************************************************/
bool Socket_data::rename_file(){
  return StorageManager::rename_file(multiparser.getfilepath(),multiparser.getfilename(),multiparser.get_file_rename_new_name() ,this->get_username());
}
/********************************************************************************************************************/
OID Socket_data::get_record_id(){
  return multiparser.getobjoid();
}
bool Socket_data::send_file_to_client(){
	string fname = "send_file_to_client";
	/*Get the file name*/
	string filepath = StorageManager::build_file_full_path(multiparser.getfilepath(),multiparser.getfilename(),this->get_username());
	bool res = true;
	PRNT_LOG("Sending the file: " << filepath);
	socket_buff_download_file.open(filepath.c_str(),ios::out|ios::ate | ios::binary); /*open file to the end so we imidiatly get the file size*/
	if(!socket_buff_download_file.good() ){
		PRNT_LOG("the "<< filepath << "Wont send file because:Good = " << socket_buff_download_file.good());
		return false;
	}
	const streampos file_size =socket_buff_download_file.tellg();
	streampos buff_size = file_size;

	socket_buff_download_file.seekg(0,ios::beg); /**Go back to the beginning of the file.*/
	PRNT_LOG("file_size = " << file_size);
	if(file_size > READ_BUFF_SIZE)
	{
		buff_size = READ_BUFF_SIZE;
	}

	stringstream header;
	header <<  "HTTP/1.1 200 OK\r\n"
	    "Content-Type: application/download\r\n" <<
//			"Content-Description: File Transfer\r\n"<<
//			"Connection: keep-alive\r\n"<<
			"Content-Disposition: attachment; filename= "<< multiparser.getfilename()<<"\r\n"<<
			"Connection: close\r\n" <<
			"Accept-Ranges: bytes\r\n"
			"Content-Description: File Transfer\r\n" <<

			"Content-Transfer-Encoding: binary\r\n"<<
			"Content-Type: application/octet-stream\r\n" <<
//			"Expect: 100-continue\r\n"<<
//			"Pragma: public\r\n"<<
	    "Content-Length: "<<file_size <<"\r\n\r\n";

	PRNT_LOG("Sending the header" << header.str() << ". Header length is:" << header.str().length());
	send(this->getSocket(),header.str().c_str(),header.str().length(),MSG_NOSIGNAL);
	//socket_buff_download_file.r
	while(!socket_buff_download_file.eof()){
		if(buff_size == 0){
			PRNT_LOG("buff_size == 0");
			goto cleanup;
		}
		//PRNT_LOG("Creating Buffer of size = " << buff_size);
		char* read_buff = new char[buff_size];
		if(read_buff == NULL){
			PRNT_LOG("read_buff == NULL! exiting...");
			res=false;
			delete[] read_buff;
			goto cleanup;
		}
		socket_buff_download_file.read(read_buff,buff_size);

		/*Time to send the buff*/
		//PRNT_LOG("trying to Send buffer of size : " << buff_size );
		streampos sent_data_bytes = send(this->getSocket(),read_buff,buff_size,MSG_NOSIGNAL);
		if(sent_data_bytes <=0){
			PRNT_LOG("Send buffer finished with errors - finishing" );
			res = false;
			delete[] read_buff;
			goto cleanup;
		}

		streampos curr_pos = socket_buff_download_file.tellg();
		PRNT_LOG("Succeedded to acctually send: "<< sent_data_bytes<< " Left to send:" << streampos(file_size - curr_pos) << ". Already sent:" << curr_pos);
		/* resize the buffer according to the left size*/


		/*update database*/
		Database_API::getInstance()->update_file_percentage(curr_pos,multiparser.getobjoid());
		if(file_size - curr_pos < buff_size){
			buff_size = file_size - curr_pos;
		}
		delete[] read_buff;
	}
cleanup:
	PRNT_LOG("Finished sending: " << filepath);
	Database_API::getInstance()->update_file_status(res?"SUCCESS_DOWNLOAD":"FAIL_DOWNLOAD",multiparser.getobjoid());

	socket_buff_download_file.close();

	return true;
}
/********************************************************************************************************************/
/*This method is responsible to handle every received chunk
 * if the received chunk belongs to file upload, it will create the file and then will append it.
 * if it belongs to a download file request, then the download method will handle it.*/
void Socket_data::add_data_chunk(const char* buff,unsigned int buff_size) {
		string fname = "add_data_chunk";
		PRNT_LOG("Called");
		if(buff == NULL || buff_size == 0){
		    PRNT_LOG("Bad input");
		    return;
		}
		if(multiparser.is_finished_receiving_file() == true){
			PRNT_LOG("Finished receiving file...return.");
			return;
		}
		if(multiparser.getoperationtype() == op_type_download){
			PRNT_LOG("Wont process buff because operation is not upload. it is download:" << multiparser.getoperationtype());
			return;
		}
		if(!multiparser.relevant_info_headers_received() ){
		    string header = string(buff);
		    multiparser.read_request_major_headers(header);
		}

		if(multiparser.is_all_header_received() && ! multiparser.relevant_info_headers_received()){
			/*In first MAX_HEADER_LIMIT we cant get the flags..possible attack on port - report it!*/
			PRNT_LOG("All header was received but not all data is there");
			session_status = Not_Valid_session;
			return;
		}

		if(multiparser.relevant_info_headers_received() && !is_finished_processing_header) {
			PRNT_LOG("All headers are set");
			is_finished_processing_header = true;
			if(session_status != Valid_session){
				// check if the session is available:
				PRNT_LOG("Will try to validate session:" << multiparser.getsessionid());

				if(!Database_API::getInstance()->validate_session_id(multiparser.getsessionid(),this->username)){
					session_status = Not_Valid_session;
					PRNT_LOG("The session is NOT valid");
					return;
				}else{
					this->set_username(Database_API::getInstance()->get_user_of_session(multiparser.getsessionid()));
					PRNT_LOG("The session is valid for user:" << this->get_username());
					session_status = Valid_session;

				}
			}

			// confirm it is an upload request:
			if(multiparser.getoperationtype() != op_type_upload){
				PRNT_LOG("The request is not upload. it is:" << multiparser.getoperationtype());
				return;
			}

			/*Find the record id in the database. no file can be uploaded without a request in the database.*/
			if(!Database_API::getInstance()->is_valid_filerequest(multiparser.getobjoid(),multiparser.getfilename(),
									      multiparser.getfilepath(),"Upload",this->get_username())){
				session_status = Not_Valid_session;
				PRNT_LOG("Setting session to be invalid because didn't found the upload request in the database");
				return;
			}

			PRNT_LOG("Finished receiving header");
			string filepath = StorageManager::build_file_full_path(multiparser.getfilepath(),multiparser.getfilename(),this->get_username()) ;
			PRNT_LOG("==> Open File" << filepath);

			socket_buff_upload_file.open(filepath.c_str(),ios::out | ios::trunc | ios::binary);

		}


		//data_status = Receiving_file;
		if(multiparser.getoperationtype() == op_type_upload || multiparser.getoperationtype() == op_type_unknown){
			multiparser.parse_buffer(buff,buff_size,socket_buff_upload_file);
			Database_API::getInstance()->update_file_percentage(multiparser.get_already_received_bytes(),multiparser.getobjoid());
		}
	}
/********************************************************************************************************************/

