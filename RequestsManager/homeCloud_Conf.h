/*
 * config_dictionary.h
 *
 *  Created on: Feb 28, 2016
 *      Author: hesham
 */

#ifndef HOMECLOUD_CONF_H_
#define HOMECLOUD_CONF_H_
#include <iostream>
#include <map>
#include <string>

using namespace std;

class ConfigurationDictionary {
private:
	static ConfigurationDictionary *s_instance;

	std::map<std::string, std::string> *configMap = NULL;

	ConfigurationDictionary():configMap(NULL){}
	~ConfigurationDictionary() {
		delete configMap;
	}
	void loadConfiguration();
	bool addConfToDict(const string& keyValueConf);
public:
	static ConfigurationDictionary *getInstance();
	void initialize();
	string operator[](const string& strIndx);

};


#endif /* HOMECLOUD_CONF_H_ */
