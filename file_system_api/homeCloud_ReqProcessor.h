/*
 * RequestWrapper.h
 *
 *  Created on: Feb 17, 2016
 *      Author: hesham
 */

#ifndef _REQUESTWRAPPER_H_
#define _REQUESTWRAPPER_H_
#include<string>
#include <iostream>
#include <sstream>
#include <fstream>
#include <map>


#include "homeCloud_Conf.h"
#include "homeCloud_Database.h"
#include "homeCloud_StorageManager.h"
#include "homeCloud_Utils.h"
#include "homeCloud_parse_multipart.h"

#define MAX_HEADER_LIMIT 2000
#define READ_BUFF_SIZE 4096
typedef enum { Valid_session, Not_Valid_session, Not_Received_yet} SessionStatus;


typedef enum { Receiving_header, Receiving_file,Finished_receiving_file} DataStatus;
using namespace std;
class Socket_data{

	int socket;
	bool is_finished_processing_header ;
	SessionStatus session_status;
	string username;
	ofstream socket_buff_upload_file;
	ifstream socket_buff_download_file;
	Multipart_parser multiparser;

	string get_header_value(const string& buff,const string& header_name);

public:
	Socket_data(int socket);
	~Socket_data();
	bool send_file_to_client();
	bool rename_file();

	bool encrypt_file();//TODO
	bool decrypt_file();//TODO

	void finish_receiving();
	void add_data_chunk(const char* buff,unsigned int buff_size);
	OID get_record_id();
	SessionStatus get_session_status(){

		return  session_status;
	}
	bool is_file_received(){
		return multiparser.is_finished_receiving_file();
	}
	operation_type get_op_type() const{
	  return multiparser.getoperationtype();
	}
	int getSocket() const {
		return socket;
	}

	const string& get_username() const {
		return username;
	}

	void set_username(const string& username) {
		this->username = username;
	}
};

class Request_wrapper{
private:

	std::map<int,Socket_data*> socket_hashmap;

public:

	Request_wrapper(){

	}
	void queue_socket_opaque(int socket_id){
		string fname = "queue_socket_opaque";
		Socket_data* sock_data = NULL;
		if(socket_hashmap.find(socket_id)  == socket_hashmap.end()){
			sock_data = new Socket_data(socket_id);
			socket_hashmap[socket_id] = sock_data;
		}
	}
	void dequeue_socket_opaque(int socket){
		string fname = "dequeue_socket_opaque";
		socket_hashmap.erase(socket);
	}
	Socket_data& operator[](std::size_t socket){
		return *socket_hashmap[socket];
	};

};


#endif /* _REQUESTWRAPPER_H_ */
