/*
 * homeCloud_parse_multipart.h
 *
 *  Created on: Mar 13, 2016
 *      Author: hesham
 */

#ifndef HOMECLOUD_PARSE_MULTIPART_H_
#define HOMECLOUD_PARSE_MULTIPART_H_

#include <string>
#include <iostream>
#include <sstream>
#include <fstream>
#include <stdlib.h>

#include "homeCloud_Utils.h"
using namespace std;
typedef enum
{
  receiving_header, receiving_file, finished_receiving_file
} Multi_status;
typedef enum
{
  not_interesting_header,
  contenttype_boundary,
  starting_boundary,
  content_type_header,
  content_length_header,
  content_disposition_header,
  empty_line
} Multi_header_type;
typedef enum
{
  none,
  contenttypeboundary,
  contenttypeboundary_startingboundary,
  contenttypeboundary_startingboundary_contentdisposition,
  contenttypeboundary_startingboundary_contentdisposition_contenttype,
  contenttypeboundary_startingboundary_contentdisposition_contenttype_newline

} Multi_header_structure;
class Multipart_parser
{
private:
  Multi_status multi_status;
  string buffered_start_of_packet; /*i buffer the header here until we get enough info on the header*/
  string boundary_token;
  unsigned int content_length;
  unsigned int already_received_content;
  size_t buffered_start_of_packet_len;

  string sessionid;
  string filename;
  string file_rename_new_name; // used for rename request only
  string filepath;
  operation_type op_type;

  OID file_object_id;
  string file_sha1;
  bool all_header_received;

  Multi_header_type
  handle_header_line (const string& header);
  string
  get_header_value (const string& buff, const string& header_name);
public:
  Multipart_parser () :
      multi_status (receiving_header), buffered_start_of_packet (""), boundary_token (
	  ""), content_length (0), already_received_content (0), buffered_start_of_packet_len (
	  0), sessionid (""), filename (""),file_rename_new_name(""), filepath (""), op_type (
	  op_type_unknown), file_object_id (OID ()), file_sha1 (""), all_header_received (
	  false)

  {
  }
  void
  read_request_major_headers(const string& header);
  void
  parse_buffer (const char* buff, int buff_len, ofstream& filestream);
  bool
  is_finished_receiving_file ();


  unsigned int
  get_already_received_bytes ()
  {
    return already_received_content;
  }
  unsigned int
  get_file_size ()
  {
    return content_length;
  }

  bool
  is_all_header_received ()
  {
    return all_header_received;
  }
  bool
  relevant_info_headers_received ();

  const string&
  getfilesha1 () const
  {
    return file_sha1;
  }

  void
  setfilesha1 (const string& fileSha1)
  {
    file_sha1 = fileSha1;
  }

  const string&
  getfilename () const
  {
    return filename;
  }

  void
  setfilename (const string& filename)
  {
    this->filename = filename;
  }

  const string&
  get_file_rename_new_name () const
    {
      return file_rename_new_name;
    }

    void
    set_file_rename_new_name (const string& file_rename_new_name)
    {
      this->file_rename_new_name = file_rename_new_name;
    }
  const string&
  getfilepath () const
  {
    return filepath;
  }

  void
  setfilepath (const string& filepath)
  {
    this->filepath = filepath;
  }

  const OID&
  getobjoid () const
  {
    return file_object_id;
  }

  void
  setobjoidstr (const string& objid)
  {
    string fname = "set_obj_id";
    PRNT_LOG("objid=:" << objid);
    if (objid == NULL)
      {
	PRNT_LOG("objid is null");
	this->file_object_id = OID ();
	return;
      }
    try
      {
	this->file_object_id = OID (objid);
      }
    catch (...)
      {
	PRNT_LOG("objid is invalid - received exception - length of key! ");
	this->file_object_id = OID ();
      }
  }

  const operation_type&
  getoperationtype () const
  {
    return op_type;
  }

  void
  setoperationtype (const operation_type& opt_t)
  {
    this->op_type = opt_t;
  }

  const string&
  getsessionid () const
  {
    return sessionid;
  }

  void
  setsessionid (const string& sessionid)
  {
    this->sessionid = sessionid;
  }
};

#endif /* HOMECLOUD_PARSE_MULTIPART_H_ */
