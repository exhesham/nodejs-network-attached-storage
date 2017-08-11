#!/bin/bash
flag=$1
password=$2

#------------------------------------------------------------------------------------------------------#
LOGIC_LAYER_FOLDER="/home/pi/homecloud/RequestsManager"
PROCESS_MONITOR_SCRIPT="/home/pi/homecloud/process_monitor.sh"
HC_PRODUCT_SERIAL="/home/pi/homecloud/product_serial__homecloud.conf"
NOIP2_BIN="/home/pi/homecloud/noip2"
USER_LAYER_FOLDER="/home/pi/homecloud/SmartRaspian"
FILES_TO_TAR="RequestsManager process_monitor.sh product_serial__homecloud.conf noip2 SmartRaspian"
#------------------------------------------------------------------------------------------------------#
function print_msg()
{
	if [ "$1" == "N/A" ]; then 
		echo "$2"
	else
		echo "[$1] - $2"
	fi
}
#------------------------------------------------------------------------------------------------------#
function print_help(){
	echo "Please run with the next commands:"
	echo "package [password] - in order to package the server into installation"
	echo "install [password] [server url] [noip email] [noip password] [mongo password]- in order to install and run the server"
}
#------------------------------------------------------------------------------------------------------#
function is_installed_pkg(){
	dpkg -s $1 2>/dev/null | grep "install ok installed"
	return $?
}
#------------------------------------------------------------------------------------------------------#
function install_libraries(){
	#Install SSL and BOOST and scons and curl and mongo 
	is_installed_pkg libssl-dev
	if [ $? != 0 ]; then
		sudo apt-get install libssl-dev 
	fi
	
	is_installed_pkg libboost-all-dev
	if [ $? != 0 ]; then
		sudo apt-get install libboost-all-dev 
	fi
	
	is_installed_pkg libcurl4-openssl-dev
	if [ $? != 0 ]; then
		sudo apt-get install libcurl4-openssl-dev 
	fi
	
	is_installed_pkg scons
	if [ $? != 0 ]; then
		sudo apt-get install scons 
	fi
	
	is_installed_pkg mongo
	if [ $? != 0 ]; then
		sudo apt-get install mongodb
	fi
	
	sudo apt-get update && sudo apt-get -y upgrade
}
########################################################################################################
############################################ MAIN  #####################################################
########################################################################################################
# kill all current going on processes
#sudo kill $(ps aux | grep 'UnixInstaller.sh' | grep -v "$BASHPID" |grep -v grep | awk '{print $2}')

if [[ "$flag" == "package" ]]; then
	if [ "$#" -ne 2 ]; then
		print_msg "ERROR" "You didn't insert the password into the command line. Exiting..."
		print_help
		exit 1;
	fi
	print_msg "LOG" "Packaging Home Cloud Server"
	print_msg "N/A" "==========================================================================="
	#Make sure that the folders are there
	if [ ! -f $PROCESS_MONITOR_SCRIPT ]; then
	
		print_msg "ERROR" "The script $PROCESS_MONITOR_SCRIPT  is not here. exiting..."
		exit 1
	fi
	if [ ! -d $LOGIC_LAYER_FOLDER ]; then
	
		print_msg "ERROR" "The folder of the logic layer is not here. expected to see $LOGIC_LAYER_FOLDER"
		exit 1
	fi
	
	if [ ! -d $USER_LAYER_FOLDER ]; then
		print_msg "ERROR" "The folder of the user interface layer is not here. expected to see $USER_LAYER_FOLDER"
		exit 1
	fi
	
	print_msg "STEP" "Checking if ZIP package is installed..."
	#make sure zip is installed
	is_installed_pkg "zip"
	if [ $? != 0 ]; then 
		print_msg "ERROR" "Zip is not install...will install it.."
		sudo apt-get install zip
	fi
	
	print_msg "STEP" "Updating operating system..."
	sudo apt-get update -y 
	
	
	print_msg "STEP" "Checking if Database package is installed..."
	is_installed_pkg "mongodb"
	if [ $? != 0 ]; then 
		print_msg "ERROR" "Database is not install...will install it.."
		sudo apt-get install mongodb -y
	fi
	
	print_msg "STEP" "Create product serial for Home_Cloud..."
	date_now=`date`
	product_hash=`printf '%s' "$password-$date_now" | md5sum | cut -d' ' -f 1`
	sudo echo "$product_hash" > $HC_PRODUCT_SERIAL
	print_msg "STEP" "Packaging Home_Cloud..."
	# tar the folders
	cd /home/pi/homecloud
	sudo tar -cf "./homecloud_serverside.tar" $FILES_TO_TAR
	if [ $? != 0 ]; then 
		print_msg "ERROR" "Failed to tar...exiting..."
		sudo rm -rf $HC_PRODUCT_SERIAL
		sudo rm -rf homecloud_serverside.tar
		
		
		exit 1;
	fi
	sudo rm -rf $HC_PRODUCT_SERIAL
	
	print_msg "STEP" "Encrypting Home_Cloud..."
	#zip the files
	zip --password $product_hash /home/pi/homecloud/homecloud_serverside.zip /home/pi/homecloud/homecloud_serverside.tar
	if [ $? != 0 ]; then 
		print_msg "ERROR" "Failed to zip...exiting..."
		exit 1;
	fi
	sudo rm -rf /home/pi/homecloud/homecloud_serverside.tar
	
	print_msg "STEP" "Finished packaging. Product hash=$product_hash"
	exit 0;
	
fi
#------------------------------------------------------------------------------------------------------#
if [[ "$flag" == "install" ]]; then
	if [ "$#" -ne 6 ]; then
		print_msg "ERROR" "You didn't insert all the flags. Exiting..."
		print_help
		exit 1;
	fi
	print_msg "LOG" "Installing Home Cloud Server"
	print_msg "N/A" "==========================================================================="
	
	#*****************************************************************#
	#print_msg "STEP" "Installing Auxiliary libraries - Install SSL and BOOST and scons and curl and mongo"
	#Install SSL and BOOST and scons and curl and mongo 
	#install_libraries

	#*****************************************************************#
	#Check Databases
	print_msg "STEP" "Check if database is running"
	netstat -tulp  2>/dev/null  | grep 27017
	if [ $? != 0 ]; then 
		print_msg "STEP" "Running mongodb with journaling"	
		sudo mongod --journal
		if [ $? != 0 ]; then 
			print_msg "ERROR" "Failed to run mongo with journaling."	
		print_msg "STEP" "Running mongodb WITHOUT journaling"	
			sudo mongod
			if [ $? != 0 ]; then 
				print_msg "ERROR" "Failed to run mongo WITHOUT journaling. Exiting..."	
				exit 1;
			fi
		fi
	fi
	#*****************************************************************#
	#Initialize
	noip_url=$3;
	noip_email=$4;
	noip_password=$5;
	mongo_password=$6;
	product_serial__homecloud=`cat $HC_PRODUCT_SERIAL`
	sudo rm -rf $HC_PRODUCT_SERIAL
	if [ ! -f "/home/pi/homecloud/homecloud_serverside.zip" ]; then
		print_msg "ERROR" "didn't find the file homecloud_serverside.zip. Exiting..."
		exit
	fi
	#*****************************************************************#
	print_msg "STEP" "Initialize database tables"
	#drop the database
	mongo "home_cloud_db" --eval "printjson(db.dropDatabase())";
	
	#add the datatable again
	mongo "home_cloud_db" --eval 'db.createCollection( "passwd_table",   { 		validator: { $or: 			 [ 				{ username: { $type: "string" } }, 				{password: { $type: "string" } } 			 ] 		  } 	   } 	)' ;
	
	#add admin password
	mongo "home_cloud_db" --eval "db.passwd_table.insert( { username: \"dbadmin\", password: \"$mongo_password\" } )"
	mongo "home_cloud_db" --eval "db.passwd_table.insert( { username: \"product_serial__homecloud\", password: \"$product_serial__homecloud\" } )"
	
	#*****************************************************************#
	#unzip the file
	print_msg "STEP" "Decrypting Home_Cloud..."	
	sudo unzip -o -P $password "/home/pi/homecloud/homecloud_serverside.zip"  -d /
	if [ $? != 0 ]; then 
		print_msg "ERROR" "Failed to decrypt. Make sure your password is correct.exiting..."
		exit 1;
	fi
	#*****************************************************************#
	#Untar
	print_msg "STEP" "Unpackaging Home_Cloud..."
	sudo tar -xf /home/pi/homecloud/homecloud_serverside.tar -C /home/pi/homecloud
	if [ $? != 0 ]; then 
		print_msg "ERROR" "Failed to unpackage. Exiting..."
		exit 1;
	fi
	sudo rm -rf /home/pi/homecloud/homecloud_serverside.tar
	$PROCESS_MONITOR_SCRIPT
	print_msg "STEP" "Finished unpackaging. Server should be running on https..."
	#*****************************************************************#
	#add to crontab
	#sudo mkdir -p /home/pi/homecloud/
	chmod 770 "$PROCESS_MONITOR_SCRIPT"
	chmod 770 /home/pi/homecloud/SmartRaspian/find_mounted_drives.sh
	#sudo mv "$PROCESS_MONITOR_SCRIPT" "/home/pi/homecloud/$PROCESS_MONITOR_SCRIPT"
	#sudo mv "$NOIP2_BIN" "/home/pi/homecloud/$NOIP2_BIN"
	echo "/home/pi/homecloud/noip2 -u $noip_email -p $noip_password" > "/home/pi/homecloud/noip2_script.sh"
	echo "$noip_url" > "/home/pi/homecloud/noip2_address.conf"
	
	sudo chmod 770 /home/pi/homecloud/noip2_script.sh
	print_msg "STEP" "Updating crontab of user $USER"
	line="*/5 * * * * $PROCESS_MONITOR_SCRIPT"
	crontab -u "$USER" -l | grep -v '#' |  grep "$PROCESS_MONITOR_SCRIPT"
	if [ $? != 0 ]; then 
		#if not already configured in the crontab then configure it!
		(crontab -u "$USER" -l; echo "$line" ) | crontab -u "$USER" -
	fi
	service crond start
	
	#*****************************************************************#
	
	#*****************************************************************#
	this_ip=`ifconfig  | grep 'inet addr:'| grep -v '127.0.0.1' | cut -d: -f2 | awk '{ print $1}'`
	this_mac=` cat /sys/class/net/*/address | grep -v "00:00:00:00:00:00"`
	#kill the first time wizard server
	
	#Now run the server
	sudo $PROCESS_MONITOR_SCRIPT
	
	print_msg "STEP" "Finished Installing. Next to do:"
	print_msg "STEP" " - Login to the cloud in the next link: https://$noip_url or locally by the ip address:$this_ip. login username is dbadmin and login password is $mongo_password"
	print_msg "STEP" " - In the router, go to DHCP and tell it to give always the same ip($this_ip) for MAC# $this_mac"
	print_msg "STEP" " - In the router, go to route and open port 443 to forward that traffic into ip $this_ip"
	print_msg "STEP" " - From internal network, you can login to the cloud by going to https://homecloud.local"
	exit 0;
fi

print_help
#------------------------------------------------------------------------------------------------------#

#------------------------------------------------------------------------------------------------------#
#------------------------------------------------------------------------------------------------------#
#------------------------------------------------------------------------------------------------------#

