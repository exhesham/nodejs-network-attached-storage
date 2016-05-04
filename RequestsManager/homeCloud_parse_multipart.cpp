#include "homeCloud_parse_multipart.h"
void Multipart_parser::parse_buffer(const char* buff,int buff_len,ofstream& filestream){
	const string fname = "parse_buffer";
	//PRNT_LOG("called with buff = "<<buff);
	/*First check our status and act accordingly*/

	if(multi_status == receiving_header){
		/*Add the received buffer to the local buffer*/
		this->buffered_start_of_packet.append(buff,buff_len); /* in case the buffer include bin data with null char then it also will be added*/
		string tmp_headertoparse = string(this->buffered_start_of_packet);
		//PRNT_LOG("buffered_start_of_packet = "<<buffered_start_of_packet);
		/*split according to \r\n*/

		std::string delimiter = "\r\n";

		size_t pos = 0;


		buffered_start_of_packet_len  += buff_len;
		size_t start_of_file =buffered_start_of_packet_len ;
		std::string token;
		Multi_header_structure header_structure = none;
		while ((pos = tmp_headertoparse.find(delimiter)) != std::string::npos) {

		    token = tmp_headertoparse.substr(0, pos);
		    start_of_file -= token.length() ;

		   // PRNT_LOG("token = " << token);
		    Multi_header_type header_info = handle_header_line(token);
		    if(header_info == contenttype_boundary){
		    	header_structure = contenttypeboundary;

		    }
		    if(header_info == starting_boundary && header_structure == contenttypeboundary){
				header_structure = contenttypeboundary_startingboundary;
				PRNT_LOG("contenttypeboundary_startingboundary");
			}
		    if(header_info == content_disposition_header && header_structure == contenttypeboundary_startingboundary){
				header_structure = contenttypeboundary_startingboundary_contentdisposition;
				PRNT_LOG("contenttypeboundary_startingboundary_contentdisposition");
				// here the start boundery of the packet is received - meaning that all relevant data was received.
				all_header_received = true;
			}
		    if(header_info == content_type_header && header_structure == contenttypeboundary_startingboundary_contentdisposition){
				header_structure = contenttypeboundary_startingboundary_contentdisposition_contenttype;
				PRNT_LOG("contenttypeboundary_startingboundary_contentdisposition_contenttype");
			}
		    if(header_info == empty_line && header_structure == contenttypeboundary_startingboundary_contentdisposition_contenttype){
				header_structure = contenttypeboundary_startingboundary_contentdisposition_contenttype_newline;
				PRNT_LOG("contenttypeboundary_startingboundary_contentdisposition_contenttype_newline");
				// write the rest of the header to the file.
				//PRNT_LOG("the buffer is:"<<tmp_headertoparse);
				//PRNT_LOG("start_of_file=" << start_of_file);
				//PRNT_LOG("tmp_headertoparse.length()=" << tmp_headertoparse.length());

				//PRNT_LOG("content_length=" << content_length);
				//PRNT_LOG("buffered_start_of_packet_len=" << buffered_start_of_packet_len);
				//PRNT_LOG("already_received_content=" << already_received_content);
				tmp_headertoparse.erase(0, delimiter.length());
				if( this->op_type == op_type_upload){
				  if(start_of_file < content_length ){
					  // means that the file does not ends with the data we have in buffered_start_of_packet
					  filestream.write(tmp_headertoparse.c_str(),tmp_headertoparse.length());
					  multi_status = receiving_file;
					  already_received_content += tmp_headertoparse.length();
					  return;
				  }else{
					  PRNT_LOG("writing last chunk");
					  filestream.write(tmp_headertoparse.c_str(),content_length);
					  multi_status = finished_receiving_file;
					  PRNT_LOG("finished receiving file");
					  already_received_content = content_length;
					  filestream.close();
					  return;
				  }
				}




			}

		    tmp_headertoparse.erase(0, pos + delimiter.length());
		}

	}
	if(multi_status == receiving_file){
		if(already_received_content + buff_len >= content_length){
			PRNT_LOG("writing to file data of size:"<<content_length-already_received_content);
			filestream.write(buff,content_length-already_received_content);
			multi_status = finished_receiving_file;
			already_received_content = content_length;
			filestream.close();
			PRNT_LOG("Finishing - receiving file: received " << already_received_content << "/" << content_length);

		}else{
			filestream.write(buff,buff_len);
			already_received_content += buff_len;
			PRNT_LOG("receiving file: received " << already_received_content << "/" << content_length);
		}
	}
//	if(filestream.is_open() && already_received_content == content_length){
//		PRNT_LOG("closing the stream");
//		filestream.close();
//	}
}

bool Multipart_parser::is_finished_receiving_file(){
	return multi_status == finished_receiving_file;
}
bool Multipart_parser::relevant_info_headers_received(){
  const string fname = "handle_header_line";
  if ((this->getoperationtype() == op_type_download || this->getoperationtype() == op_type_upload)  &&(this->getsessionid() == "" || this->getfilename() == "" || !this->file_object_id.isSet())) {
      PRNT_LOG("Return false:Operation type = '" << this->getoperationtype() <<"' this->getsessionid() ='"<<this->getsessionid() <<"' this->getfilename()='"<<this->getfilename()<<"' this->file_object_id.isSet()='"<< this->file_object_id.isSet()<<"'");
      return false;
  }
  if (this->getsessionid() == "" || this->getfilename() == "" || this->getoperationtype() == op_type_unknown) {
      PRNT_LOG("Return false:Operation type = '" << this->getoperationtype() <<"' this->getsessionid() ='"<<this->getsessionid() <<"' this->getfilename()='"<<this->getfilename()<<"'");
      return false;
  }
  return true;
}
void Multipart_parser::read_request_major_headers(const string& header){
  const string fname = "read_request_major_headers";
  //PRNT_LOG("buffered_start_of_packet = "<<buffered_start_of_packet);
  /*split according to \r\n*/
  string tmp_headertoparse = header;

  std::string delimiter = "\r\n";

  size_t pos = 0;
  std::string token;
  Multi_header_structure header_structure = none;
  while ((pos = tmp_headertoparse.find(delimiter)) != std::string::npos) {

      token = tmp_headertoparse.substr(0, pos);
     // PRNT_LOG("token = " << token);
      Multi_header_type header_info = handle_header_line(token);

      tmp_headertoparse.erase(0, pos + delimiter.length());
  }
}
Multi_header_type Multipart_parser::handle_header_line(const string& header){
	const string fname = "handle_header_line";

	size_t find_index;
	string header_name;
	//PRNT_LOG("Handling the header '"<< header << "'");
	if(header == ""){
		return empty_line;
	}
	/*Check out file header data:*/
	find_index = header.find("Session-ID:");
	if(find_index != string::npos && find_index == 0){

		string headerval = get_header_value(header, "Session-ID:");
		PRNT_LOG("Session-ID header = " << headerval);
		this->setsessionid(headerval);
		return not_interesting_header;
	}
	find_index = header.find("File-Name:");
	if(find_index != string::npos && find_index == 0){

		string headerval = get_header_value(header, "File-Name:");
		PRNT_LOG("File-Name header = " << headerval);
		this->setfilename(headerval);
		return not_interesting_header;
	}
	find_index = header.find("File-Rename-New-Name:");
	if(find_index != string::npos && find_index == 0){

		string headerval = get_header_value(header, "File-Rename-New-Name:");
		PRNT_LOG("File-Rename-New-Name header = " << headerval);
		this->set_file_rename_new_name(headerval);
		return not_interesting_header;
	}
	find_index = header.find("File-Path:");
	if(find_index != string::npos && find_index == 0){

		string headerval = get_header_value(header, "File-Path:");
		PRNT_LOG("File-Path: header = " << headerval);
		this->setfilepath(headerval);
		return not_interesting_header;
	}
	find_index = header.find("File-OBJID:");
	if(find_index != string::npos && find_index == 0){

		string headerval = get_header_value(header, "File-OBJID:");
		PRNT_LOG("File-OBJID header = " << headerval);
		this->setobjoidstr(headerval);
		return not_interesting_header;
	}
	find_index = header.find("Operation-Type:");
	if(find_index != string::npos && find_index == 0){

		string headerval = get_header_value(header, "Operation-Type:");
		PRNT_LOG("Operation-Type header = " << headerval);
		this->setoperationtype(cast_operation_type(headerval));
		return not_interesting_header;
	}
	find_index = header.find("File-SHA1:");
	if(find_index != string::npos && find_index == 0){

		string headerval = get_header_value(header, "File-SHA1:");
		PRNT_LOG("File-SHA1 header = " << headerval);
		this->setfilesha1(headerval);
		return not_interesting_header;
	}

	/*Check out multipart data*/
	find_index = header.find("Content-Disposition:");

	if(find_index != string::npos && find_index == 0){
		PRNT_LOG("result is: Content-Disposition");
		return content_disposition_header;
	}
	find_index = header.find("Content-Type:");

	if(find_index != string::npos && find_index == 0){
		PRNT_LOG("result is:Content-Type");
		return content_type_header;
	}

	header_name = "x-file_size:" ;//"content-length:";
	find_index = header.find(header_name);
	if(find_index != string::npos && find_index == 0){
		/*Read the content length*/
		this->content_length = atoi(header.substr(header_name.length()).c_str());
		PRNT_LOG("content-length:"<< this->content_length <<" find_index = "<< find_index << "");
		return content_length_header;
	}

	find_index = header.find("content-type: multipart/form-data;");
	if(find_index != string::npos && find_index == 0 && header.find("boundary=") != string::npos){
		// take the boundary from the header and save it
		boundary_token = "--" + header.substr(header.find("boundary=")+string("boundary=").length());
		PRNT_LOG("content-type:multipart/form-data; find_index = "<< find_index << ", boundary_token = " << boundary_token);
		return contenttype_boundary;
	}

	find_index = header.find(boundary_token);

	if(find_index != string::npos && find_index == 0 && boundary_token != ""){
		PRNT_LOG("boundary find_index = "<< find_index << "");
		return starting_boundary;
	}

	return not_interesting_header;
}

string Multipart_parser::get_header_value(const string& buff,const string& header_name){
  string fname = "get_header_value";

  PRNT_LOG(" Called with token " << buff);
  int header_start_index = buff.find(header_name);
  //PRNT_LOG("header_start_index="<<header_start_index);
  if(header_start_index >= 0){
      int start_of_header_value = header_start_index+header_name.length()+1;// add one to skip space
      string start_of_value_str = buff.substr(start_of_header_value);
      //PRNT_LOG(" the substr is:"<<start_of_value_str);
      //int end_of_header_value = buff.length();
      //PRNT_LOG("start_of_header_value="<<start_of_header_value);
      //PRNT_LOG("end_of_header_value="<<end_of_header_value);
//      if (end_of_header_value == string::npos){
//	      PRNT_LOG(" Header name = " << header_name << ",Value = ''");
//	      return "";
//      }
      //string res = start_of_value_str.substr(0,end_of_header_value);
      PRNT_LOG(" Header name = " << header_name << ",Value = '" << start_of_value_str << "'");
      return start_of_value_str;
  }
  return "";
}
