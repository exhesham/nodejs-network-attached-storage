#!/bin/bash
if [ ! -d //home/pi/homecloud/SmartRaspian ]; then
	#seems like the server is not already installed
	webserver_prcces_num=$(ps aux | grep "node /etc/homecloud/ftw_page/ftw_page_server.js" |grep -v grep | wc -l)
	if (( $webserver_prcces_num == 0 )); then
		echo "web server ftw is not running...starting it."
		
		nohup sudo nodejs "/home/pi/homecloud/ftw_page/ftw_page_server.js" > server_logs.txt &
		return;
	fi
fi

########################################################################

sudo kill $(ps aux | grep 'ftw_page_server.js' |grep -v grep | awk '{print $2}')

webserver_prcces_num=$(ps aux | grep "main_server.js" |grep -v grep | wc -l)
if (( $webserver_prcces_num == 0 )); then
	echo "web server is not running...starting it."
	nohup  sudo nodejs "/home/pi/homecloud/SmartRaspian/main_server.js" > /home/pi/homecloud/SmartRaspian/server_logs.txt &
fi

ftpserver_prcces_num=$(ps aux | grep "home_cloud_file_handler" |grep -v grep | wc -l)
if (( $ftpserver_prcces_num == 0 )); then
	echo "ftp server is not running...starting it."
	
	nohup sudo /home/pi/homecloud/RequestsManager/home_cloud_file_handler > /home/pi/homecloud/RequestsManager/homecloudlogs.txt &
fi

noip_num=$(ps aux | grep "noip2" |grep -v grep | wc -l);
noip_url=`cat /home/pi/homecloud/noip2_address.conf`
sudo ping $noip_url -c 1
if (( $noip_num == 0 || $? == 1 )); then
	echo "noip2 is not running...restarting it..."
	a=`pgrep noip2`
	echo "Killing process $a"
	sudo kill -9 $a
	#sudo ~/noip2_script.sh
	sudo /home/pi/homecloud/noip2_script.sh
fi



