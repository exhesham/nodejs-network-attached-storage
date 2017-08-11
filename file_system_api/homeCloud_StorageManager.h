/*
 * homeCloud_StorageManager.h
 *
 *  Created on: Feb 29, 2016
 *      Author: hesham
 */

#ifndef HOMECLOUD_STORAGEMANAGER_H_
#define HOMECLOUD_STORAGEMANAGER_H_
#include <string.h>
#include "homeCloud_Utils.h"
using namespace std;

class StorageManager{
public:
	void static create_directory(const string& dir);


	bool static is_file_exist (const string& dir,const std::string& filename,const string& username);
	string static build_file_full_path(const string& dir,const std::string& filename,const string& username);
	bool static rename_file(const string& dir,const string& file_old_name,const string& file_new_name,const string& username);
	bool static delete_file (const string& dir,const std::string& filename,const string& username);
	bool static encrypt_file (const string& dir,const std::string& filename,const string& username);//TODO
	bool static decrypt_file (const string& dir,const std::string& filename,const string& username);//TODO


private:
      inline static bool is_file_exist (const string& file_full_path) {

	  return ( access( file_full_path.c_str(), F_OK ) != -1 );
      }
};



#endif /* HOMECLOUD_STORAGEMANAGER_H_ */
