/*
 * homeCloud_Utils.h
 *
 *  Created on: Feb 29, 2016
 *      Author: hesham
 */
#include "homeCloud_Utils.h"
const operation_type cast_operation_type(const string& operation_type_str){
	if(operation_type_str == "Download")
	{
		return op_type_download;
	}
	if(operation_type_str == "Upload")
	{
		return op_type_upload;
	}
	if(operation_type_str == "Rename File")
	{
		return op_type_rename_file;
	}
	if(operation_type_str == "Delete File")
	{
		return op_type_delete_file;
	}
	return op_type_not_exist;
}

