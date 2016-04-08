/*
 * homeCloud_Utils.h
 *
 *  Created on: Feb 29, 2016
 *      Author: hesham
 */

#ifndef HOMECLOUD_UTILS_H_
#define HOMECLOUD_UTILS_H_

#include "mongo/client/dbclient.h"
#include "homeCloud_Conf.h"

/*MACROS*/
#define CONF (*ConfigurationDictionary::getInstance())
#define PRNT_LOG(logmsg) cout << "[" << fname << "] - " << logmsg << endl;
#define SSTR( x ) static_cast< std::ostringstream & >( \
        ( std::ostringstream() << std::dec << x ) ).str()
/*enums*/
typedef enum { op_type_download,op_type_unknown,op_type_upload,op_type_rename_file,op_type_delete_file,op_type_not_exist} operation_type;

/*namespaces*/
using namespace mongo;

const operation_type cast_operation_type(const string& operation_type_str);
#endif /* HOMECLOUD_UTILS_H_ */
