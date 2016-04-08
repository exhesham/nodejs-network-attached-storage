/*
 * config_dictionary.cpp
 *
 *  Created on: Feb 28, 2016
 *      Author: hesham
 */
#include <fstream>
#include <boost/algorithm/string.hpp>
#include "homeCloud_Conf.h"

#define PRNT_LOG(logmsg) cout << "[" << fname << "] - " << logmsg << endl;

using namespace std;
using namespace boost::algorithm;

ConfigurationDictionary* ConfigurationDictionary::s_instance = NULL;

void ConfigurationDictionary::loadConfiguration() {
	const string fname="loadConfiguration";
	PRNT_LOG("Called...");
	string keyValueConf;
	ifstream configurationFile("homecloud_server.conf");
	if (configurationFile.is_open()) {
		while (getline(configurationFile, keyValueConf)) {
			trim(keyValueConf);
			if(keyValueConf.length()<3 || keyValueConf[0] == '#' )
			{
				PRNT_LOG("comment or empty space:"<<keyValueConf);
				continue;
			}
			addConfToDict(keyValueConf);
		}
		configurationFile.close();
	}
}

bool ConfigurationDictionary::addConfToDict(const string& keyValueConf) {
	const string fname = "addConfToDict";
	PRNT_LOG("Called...");
	string keyValTrimmed = keyValueConf;
	boost::algorithm::trim(keyValTrimmed);
	if(keyValTrimmed.length()>0 &&  keyValTrimmed[0] == '#'){
		// this is a comment line - ignore it
		return true;
	}
	size_t endOfKeyIndx = keyValTrimmed.find('=');

	if (endOfKeyIndx <= 0 || keyValTrimmed.length()<endOfKeyIndx+1) { /* we expect at least one char after the =*/
		cout << "the line " << keyValTrimmed
				<< " is not in the syntax key=value";
		throw "configuration line is not in the syntax key=value";
	}
	(*configMap)[keyValTrimmed.substr(0, endOfKeyIndx )] = keyValTrimmed.substr(endOfKeyIndx + 1);
	PRNT_LOG("["<<keyValTrimmed.substr(0, endOfKeyIndx ) <<"] = '" <<keyValTrimmed.substr(endOfKeyIndx + 1) <<"'");
	return true;
}

ConfigurationDictionary* ConfigurationDictionary::getInstance() {
	const string fname="getInstance";
	PRNT_LOG("Called...");
	if (!s_instance) {
		PRNT_LOG("Creating new instance");
		s_instance = new ConfigurationDictionary;
	}
	return s_instance;
}

string ConfigurationDictionary::operator[](const string& strIndx){
	const string fname="operator[]";
	PRNT_LOG("Called");
	if(this->configMap == NULL){
		return "";
	}
	return (*configMap)[strIndx];
}

void ConfigurationDictionary::initialize(){
	const string fname="initialize";
	PRNT_LOG("Called...");
	if(configMap != NULL){
		PRNT_LOG("Already initialized!");
		return;
	}
	configMap = new map<std::string, std::string>();
	loadConfiguration();
}

