/*
 * homeCloud_StorageManager.cpp
 *
 *  Created on: Feb 29, 2016
 *      Author: hesham
 */

#include <iostream>
#include <fstream>
#include <cstdio>
#include <boost/filesystem.hpp>

#include "homeCloud_StorageManager.h"

using namespace std;
using namespace boost::filesystem;

string StorageManager::create_directory(const string& needed_dir){
	const string fname = "create_directory";
	PRNT_LOG("Called needed_dir:"<<needed_dir);
	const string dir_path = CONF["homecloud_server.mount.target.1"]+needed_dir;

	boost::filesystem::path dir(dir_path);
	if(boost::filesystem::create_directory(dir)) {
		PRNT_LOG("Success");
	}
	return dir_path;
}


string StorageManager::build_file_full_path(const string& dir,const std::string& filename,const string& username) {
  const string fname = "createFilePathForUser";
  ostringstream dir_path;

  dir_path << CONF["homecloud_server.mount.target.1"] << "/"  <<"/"<<dir << "/"<<filename;

  return dir_path.str();
}
bool StorageManager::is_file_exist (const string& dir,const std::string& file_name,const string& username) {
    string file_full_path = build_file_full_path(dir,file_name,username);
    return ( access( file_full_path.c_str(), F_OK ) != -1 );
}



bool StorageManager::rename_file(const string& dir,const string& file_old_name,const string& file_new_name,const string& username){
  const string fname = "rename_file";
  PRNT_LOG("Called dir:"<<dir <<" file_old_name:"<<file_old_name <<" file_new_name:"<<file_new_name << " username:" << username);
  const string full_file_path_new_str = build_file_full_path(dir,file_new_name,username);
  const string full_file_path_old_str = build_file_full_path(dir,file_old_name,username);
  const char * full_file_path_new = full_file_path_new_str.c_str();
  const char * full_file_path_old = full_file_path_old_str.c_str();
  PRNT_LOG("Old file = " << full_file_path_old);
  PRNT_LOG("New file = " << full_file_path_new);
  bool is_old_exists = is_file_exist(full_file_path_old);
  bool is_new_exists = is_file_exist(full_file_path_new);
  if(!is_old_exists || is_new_exists){
      PRNT_LOG("old file exists="<< is_old_exists <<" exist and is new file exists"<< is_new_exists);
      return false;
  }
  chdir("/media/hesham/Transcend1/exhesham/");
  int rc = std::rename(full_file_path_old, full_file_path_new);
  if(rc) {
      PRNT_LOG("Error renaming: err num = " << rc);
      return false;
  }
  return true;
}

bool StorageManager::delete_file(const string& dir,const string& file_name,const string& username){
  const string fname = "rename_file";
  PRNT_LOG("Called");
  string full_file_path = build_file_full_path(dir,file_name,username);
  if (!is_file_exist(full_file_path)){
      PRNT_LOG("old file doesn't exist or new file exists");
      return false;
  }
  int rc = std::remove(full_file_path.c_str());
  if(rc) {
      std::perror("Error removing");
      return false;
  }
  return true;
}
